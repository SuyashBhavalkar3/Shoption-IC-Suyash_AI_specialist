import hmac
import hashlib
import json
import asyncio
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi.concurrency import run_in_threadpool
from app.models import WebUser, WebhookSubscription, WebhookLog
from app.database import SessionLocal

# Limit concurrent webhook background tasks to avoid exhausting the DB connection pool.
# With pool_size=5 + max_overflow=2 per worker, capping at 3 concurrent dispatches
# ensures webhooks never starve the main request handlers of DB connections.
_webhook_semaphore = asyncio.Semaphore(5)

def _get_active_subscriptions(db: Session, org_id):
    """
    Synchronous DB helper to fetch active webhook subscriptions.
    Returns plain dictionaries to avoid DetachedInstanceError across threads.
    """
    web_users = db.query(WebUser).filter(WebUser.organisation_id == org_id).all()
    active_subs = []
    for web_user in web_users:
        sub = db.query(WebhookSubscription).filter(
            WebhookSubscription.web_user_id == web_user.id,
            WebhookSubscription.is_active == True
        ).first()
        if sub:
            active_subs.append({
                "id": sub.id,
                "target_url": sub.target_url,
                "secret_token": sub.secret_token
            })
    return active_subs

def _log_webhook_attempts(db: Session, logs):
    """
    Synchronous DB helper to save webhook log attempts.
    """
    for log in logs:
        log_entry = WebhookLog(
            subscription_id=log["subscription_id"],
            event_type=log["event_type"],
            payload=log["payload"],
            response_status=log["response_status"],
            response_body=log["response_body"],
            attempt_number=1,
            status=log["status"]
        )
        db.add(log_entry)
    try:
        db.commit()
    except Exception as e:
        print(f"ERROR: Failed to save webhook dispatch logs: {e}")
        db.rollback()

async def dispatch_webhook(org_id, event_type: str, payload):
    """
    Dispatches webhook events to all active subscriptions for the organisation.

    `payload` may be a single dict (legacy) or a list of dicts (batched).
    When called from POST /calls/, a list is always passed so all new logs
    from a single request are delivered in one background task, not N tasks.

    A global semaphore (_webhook_semaphore) limits concurrent executions to 3
    to prevent background tasks from exhausting the DB connection pool.
    """
    if not org_id:
        return

    # Normalise to a list so the rest of the function works uniformly
    payloads = payload if isinstance(payload, list) else [payload]

    # Phase 1: Retrieve active subscriptions.
    # Semaphore is held only for this short DB read (~100ms), then released.
    # This prevents the "synchronized wave" where all tasks hold the semaphore
    # during the entire 3-second HTTP call and then hit Phase 3 simultaneously.
    subs = []
    async with _webhook_semaphore:
        db = SessionLocal()
        try:
            subs = await run_in_threadpool(_get_active_subscriptions, db, org_id)
        finally:
            db.close()

    if not subs:
        return

    # Phase 2: Deliver each payload to each subscriber.
    # Semaphore is NOT held here — HTTP calls use no DB connections.
    # Tasks are free to interleave their HTTP calls without queuing behind each other.
    logs_to_save = []
    for sub in subs:
        for single_payload in payloads:
            event_payload = {
                "event": event_type,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "org_id": str(org_id),
                "data": single_payload
            }

            payload_str = json.dumps(event_payload)

            signature = hmac.new(
                sub["secret_token"].encode(),
                payload_str.encode(),
                hashlib.sha256
            ).hexdigest()

            headers = {
                "Content-Type": "application/json",
                "X-LeadLens-Signature": signature
            }

            status_code = None
            response_body = ""
            attempt_status = "failed"

            print(f"INFO: Dispatching webhook event '{event_type}' to '{sub['target_url']}'")

            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        sub["target_url"],
                        content=payload_str,
                        headers=headers,
                        timeout=3.0
                    )
                    status_code = response.status_code
                    response_body = response.text[:1000]
                    if 200 <= status_code < 300:
                        attempt_status = "success"
                except httpx.RequestError as e:
                    response_body = f"Delivery failed: {str(e)}"

            logs_to_save.append({
                "subscription_id": sub["id"],
                "event_type": event_type,
                "payload": payload_str,
                "response_status": status_code,
                "response_body": response_body,
                "status": attempt_status
            })

    # Phase 3: Write delivery logs.
    # Semaphore is re-acquired only for this short DB write (~100ms), then released.
    if logs_to_save:
        async with _webhook_semaphore:
            db = SessionLocal()
            try:
                await run_in_threadpool(_log_webhook_attempts, db, logs_to_save)
            finally:
                db.close()



