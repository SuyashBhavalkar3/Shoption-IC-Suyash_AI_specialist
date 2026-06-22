import hmac
import hashlib
import json
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import WebUser, WebhookSubscription, WebhookLog

async def dispatch_webhook(db: Session, org_id, event_type: str, payload: dict):
    """
    Looks up all active webhook subscriptions linked to the organisation_id
    and dispatches the signed event payload to their configured target URLs.
    """
    if not org_id:
        return

    # Find all web users linked to this organisation
    web_users = db.query(WebUser).filter(WebUser.organisation_id == org_id).all()
    if not web_users:
        return

    for web_user in web_users:
        # Check if the user has an active webhook subscription
        sub = db.query(WebhookSubscription).filter(
            WebhookSubscription.web_user_id == web_user.id,
            WebhookSubscription.is_active == True
        ).first()
        
        if not sub:
            continue

        # Construct final event payload
        event_payload = {
            "event": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "org_id": str(org_id),
            "data": payload
        }

        print(event_payload)
        
        payload_str = json.dumps(event_payload)
        
        # Calculate signature using shared token
        signature = hmac.new(
            sub.secret_token.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()

        
        headers = {
            "Content-Type": "application/json",
            "X-LeadLens-Signature": signature
        }

        print(signature)
        print(sub.secret_token)
        
        status_code = None
        response_body = ""
        attempt_status = "failed"

        print(f"INFO: Dispatching webhook event '{event_type}' to '{sub.target_url}'")
        
        # Perform HTTP POST request
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    sub.target_url,
                    content=payload_str,
                    headers=headers,
                    timeout=10.0
                )
                status_code = response.status_code
                response_body = response.text[:1000]
                if 200 <= status_code < 300:
                    attempt_status = "success"
            except httpx.RequestError as e:
                response_body = f"Delivery failed: {str(e)}"
                
        # Log delivery details
        log_entry = WebhookLog(
            subscription_id=sub.id,
            event_type=event_type,
            payload=payload_str,
            response_status=status_code,
            response_body=response_body,
            attempt_number=1,
            status=attempt_status
        )
        db.add(log_entry)
        
    try:
        db.commit()
    except Exception as e:
        print(f"ERROR: Failed to save webhook dispatch logs: {e}")
        db.rollback()
