import os
import hmac
import hashlib
import logging
import sqlite3
import json
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

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

# Enable CORS so frontend Next.js app can fetch database values
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_FILE = "webhooks.db"

def init_db():
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS webhooks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT,
                phone_number TEXT,
                duration INTEGER,
                payload TEXT NOT NULL,
                signature_verified INTEGER NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        logger.info("SQLite database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize SQLite database: {e}")

# Initialize DB on load
init_db()

def save_webhook_event(event_type: str, phone_number: str, duration: int, payload: dict, signature_verified: bool):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO webhooks (timestamp, event_type, phone_number, duration, payload, signature_verified) VALUES (?, ?, ?, ?, ?, ?)",
            (
                datetime.utcnow().isoformat() + "Z",
                event_type,
                phone_number,
                duration,
                json.dumps(payload),
                1 if signature_verified else 0
            )
        )
        conn.commit()
        conn.close()
        logger.info(f"Saved webhook event to database. Verified: {signature_verified}")
    except Exception as e:
        logger.error(f"Failed to save webhook to database: {e}")

# Retrieve configuration from environment variables or use default fallbacks
LEADLENS_SECRET_KEY = os.getenv("LEADLENS_SECRET_KEY")

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
        secret_token = os.getenv("LEADLENS_SECRET_TOKEN")
        if not secret_token:
            logger.error("LEADLENS_SECRET_TOKEN is not set in the environment variables.")
            return JSONResponse(
                status_code=401,
                content={"status": "unauthorized", "message": "Server secret token is not configured"}
            )

        # Read the raw body bytes (required for accurate HMAC verification)
        body = await request.body()
        
        # Retrieve the signature header
        signature_header = request.headers.get("X-LeadLens-Signature")
        if not signature_header:
            logger.warning("Webhook request missing 'X-LeadLens-Signature' header.")
            # Even if verification fails due to missing header, let's parse and save it as unverified
            try:
                payload = await request.json()
                phone_number = payload.get("phone_number")
                duration = payload.get("duration")
                event_type = payload.get("event") or payload.get("event_type") or "call"
                save_webhook_event(event_type, phone_number, duration, payload, False)
            except Exception:
                pass
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
        signature_verified = hmac.compare_digest(computed_signature, expected_signature)
        
        # Attempt to parse body as JSON
        try:
            payload = await request.json()
        except Exception as e:
            logger.error(f"Error parsing JSON payload: {e}")
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Invalid JSON payload"}
            )
            
        # Log payload details (phone_number, duration, etc.)
        phone_number = payload.get("phone_number")
        duration = payload.get("duration")
        event_type = payload.get("event") or payload.get("event_type") or "call"
        logger.info(f"Call Details - Phone Number: {phone_number}, Duration: {duration}")

        # Save to database
        save_webhook_event(event_type, phone_number, duration, payload, signature_verified)

        if not signature_verified:
            logger.warning(f"Signature verification failed. Expected: {expected_signature}, Computed: {computed_signature}")
            return JSONResponse(
                status_code=401,
                content={"status": "unauthorized", "message": "Invalid signature"}
            )
            
        logger.info(f"Successfully verified and received webhook payload: {payload}")

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

@app.get("/api/calls")
async def get_calls(limit: int = 50, offset: int = 0):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, timestamp, event_type, phone_number, duration, payload, signature_verified FROM webhooks ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = cursor.fetchall()
        
        # Count total items
        cursor.execute("SELECT COUNT(*) FROM webhooks")
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        calls = []
        for row in rows:
            try:
                payload_dict = json.loads(row["payload"])
            except Exception:
                payload_dict = row["payload"]
            calls.append({
                "id": row["id"],
                "timestamp": row["timestamp"],
                "event_type": row["event_type"],
                "phone_number": row["phone_number"],
                "duration": row["duration"],
                "payload": payload_dict,
                "signature_verified": bool(row["signature_verified"])
            })
            
        return {
            "status": "success",
            "total": total_count,
            "data": calls
        }
    except Exception as e:
        logger.error(f"Failed to retrieve webhooks from database: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/api/calls")
async def clear_calls():
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM webhooks")
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Database cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear database: {e}")
        raise HTTPException(status_code=500, detail="Database error")


