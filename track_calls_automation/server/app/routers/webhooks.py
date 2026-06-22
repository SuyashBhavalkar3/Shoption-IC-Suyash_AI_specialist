from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets
import hmac
import hashlib
import json
import httpx
from datetime import datetime
from app.database import get_db
from app.models import WebUser, WebhookSubscription, WebhookLog
from app.schemas import WebhookSubscriptionOut, WebhookSubscriptionCreate
from app.security import get_current_web_user

router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks"]
)

@router.get("/", response_model=WebhookSubscriptionOut)
def get_webhook_subscription(
    db: Session = Depends(get_db),
    current_user: WebUser = Depends(get_current_web_user)
):
    """Fetch the webhook subscription for the current web developer."""
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.web_user_id == current_user.id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No webhook subscription configured yet."
        )
    return sub

@router.post("/", response_model=WebhookSubscriptionOut)
async def upsert_webhook_subscription(
    payload: WebhookSubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: WebUser = Depends(get_current_web_user)
):
    """Create or update the webhook subscription configuration. Requires verification handshake."""
    target_url = payload.target_url.strip()
    verification_secret = payload.verification_secret
    
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.web_user_id == current_user.id).first()
    
    needs_verification = False
    if not sub:
        needs_verification = True
    elif sub.target_url != target_url:
        needs_verification = True
    elif verification_secret:
        needs_verification = True
        
    if needs_verification:
        if not verification_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification secret key is required when setting or updating the destination URL."
            )
            
        # Perform GET handshake (Meta style)
        challenge = secrets.token_hex(16)
        params = {
            "hub.mode": "subscribe",
            "hub.verify_token": verification_secret,
            "hub.challenge": challenge
        }
        
        print(f"INFO: Performing webhook validation handshake with '{target_url}' using challenge '{challenge}'")
        
        async with httpx.AsyncClient() as client:
            try:
                # 10 second timeout for the handshake request
                response = await client.get(target_url, params=params, timeout=10.0)
                
                # Check response
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Verification failed. Target server returned status code {response.status_code}."
                    )
                
                response_text = response.text.strip()
                if response_text != challenge:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Verification failed. Target server returned incorrect challenge. Expected '{challenge}', got '{response_text[:100]}'."
                    )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Verification failed. Could not connect to target server: {str(e)}."
                )
                
    # Handshake succeeded or wasn't needed. Save to DB.
    if not sub:
        secret_token = f"ll_secret_{secrets.token_hex(16)}"
        sub = WebhookSubscription(
            web_user_id=current_user.id,
            target_url=target_url,
            secret_token=secret_token,
            is_active=payload.is_active if payload.is_active is not None else True
        )
        db.add(sub)
    else:
        sub.target_url = target_url
        if payload.is_active is not None:
            sub.is_active = payload.is_active
            
    db.commit()
    db.refresh(sub)
    print(f"INFO: Updated webhook subscription for WebUser '{current_user.email}' to '{sub.target_url}' (Handshake Succeeded/Skipped)")
    return sub

@router.post("/test")
async def test_webhook_subscription(
    db: Session = Depends(get_db),
    current_user: WebUser = Depends(get_current_web_user)
):
    """Send a mock call event payload to the user's destination URL to test connectivity."""
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.web_user_id == current_user.id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please configure a webhook URL before testing."
        )
        
    # Build mock event payload
    mock_payload = {
        "event": "call.synced",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "org_id": str(current_user.id),  # Mock org ID using the web_user's UUID
        "data": {
            "system_id": "999999",
            "employee_id": "EMP-TEST",
            "phone_number": "+919999999999",
            "call_type": "outgoing",
            "call_status": "Dropped Call",
            "duration_seconds": 8,
            "timestamp": str(int(datetime.utcnow().timestamp() * 1000)),
            "system_call_id": "call_mock_test_12345"
        }
    }
    
    payload_str = json.dumps(mock_payload)
    
    # Calculate HMAC signature
    signature = hmac.new(
        sub.secret_token.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    headers = {
        "Content-Type": "application/json",
        "X-LeadLens-Signature": signature
    }
    
    # Dispatch request using httpx with a 10s timeout
    status_code = None
    response_body = ""
    attempt_status = "failed"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                sub.target_url,
                content=payload_str,
                headers=headers,
                timeout=10.0
            )
            status_code = response.status_code
            response_body = response.text[:1000]  # Store first 1000 chars of body
            if 200 <= status_code < 300:
                attempt_status = "success"
        except httpx.RequestError as e:
            response_body = f"Connection error: {str(e)}"
            
    # Log the attempt in webhook_logs
    log_entry = WebhookLog(
        subscription_id=sub.id,
        event_type="call.synced",
        payload=payload_str,
        response_status=status_code,
        response_body=response_body,
        attempt_number=1,
        status=attempt_status
    )
    db.add(log_entry)
    db.commit()
    
    if attempt_status == "success":
        return {
            "success": True,
            "status_code": status_code,
            "response_body": response_body
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": "Webhook test dispatch failed to reach the server.",
                "status_code": status_code,
                "response_body": response_body
            }
        )
