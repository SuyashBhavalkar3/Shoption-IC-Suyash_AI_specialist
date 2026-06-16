import os
import hmac
import hashlib
import logging
from fastapi import FastAPI, Request, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse, JSONResponse

# Set up logging to output to console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("webhook_consumer")

app = FastAPI(
    title="LeadLens Webhook Consumer",
    description="A dummy FastAPI server to verify and consume LeadLens webhooks."
)

# Retrieve configuration from environment variables or use default fallbacks
LEADLENS_SECRET_KEY = os.getenv("LEADLENS_SECRET_KEY", "my_dummy_secret")

@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    """
    GET endpoint to handle the LeadLens verification handshake.
    Validates hub.mode and hub.verify_token against the server secret key.
    """
    logger.info(f"Verification handshake request: hub.mode={hub_mode}, hub.verify_token={hub_verify_token}")
    
    if hub_mode == "subscribe" and hub_verify_token == LEADLENS_SECRET_KEY:
        logger.info("Verification successful. Returning challenge.")
        # Return challenge as a plain text string
        return Response(content=hub_challenge, media_type="text/plain", status_code=200)
    
    logger.warning("Verification failed. Incorrect token or mode.")
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/webhook")
async def receive_webhook(request: Request):
    """
    POST endpoint to consume LeadLens webhook events.
    Verifies the request using HMAC-SHA256 signature in the X-LeadLens-Signature header.
    """
    try:
        # Retrieve configuration from environment variables dynamically
        secret_token = os.getenv("LEADLENS_SECRET_TOKEN", "my_dummy_token")

        # Read the raw body bytes (required for accurate HMAC verification)
        body = await request.body()
        
        # Retrieve the signature header
        signature_header = request.headers.get("X-LeadLens-Signature")
        if not signature_header:
            logger.warning("Webhook request missing 'X-LeadLens-Signature' header.")
            return JSONResponse(
                status_code=401,
                content={"status": "unauthorized", "message": "Missing signature header"}
            )
        
        # Strip any prefix like 'sha256=' if present (standard format often includes it)
        expected_signature = signature_header
        if signature_header.lower().startswith("sha256="):
            expected_signature = signature_header[7:]
            
        # Compute the HMAC-SHA256 signature using the token
        computed_signature = hmac.new(
            secret_token.encode("utf-8"),
            body,
            hashlib.sha256
        ).hexdigest()
        
        # Securely compare signatures to prevent timing attacks
        if not hmac.compare_digest(computed_signature, expected_signature):
            logger.warning(f"Signature verification failed. Expected: {expected_signature}, Computed: {computed_signature}")
            return JSONResponse(
                status_code=401,
                content={"status": "unauthorized", "message": "Invalid signature"}
            )
            
        # Attempt to parse body as JSON
        try:
            payload = await request.json()
        except Exception as e:
            logger.error(f"Error parsing JSON payload: {e}")
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Invalid JSON payload"}
            )
            
        logger.info(f"Successfully verified and received webhook payload: {payload}")
        
        # Log payload details (phone_number, duration, etc.)
        phone_number = payload.get("phone_number")
        duration = payload.get("duration")
        logger.info(f"Call Details - Phone Number: {phone_number}, Duration: {duration}")

        return JSONResponse(
            status_code=200,
            content={"status": "success", "message": "Signature verified!"}
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in receive_webhook: {e}", exc_info=True)
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "An unexpected error occurred"}
        )

