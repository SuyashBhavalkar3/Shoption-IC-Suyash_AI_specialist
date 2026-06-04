import os
import logging
from fastapi import FastAPI, Request, Query, Response, HTTPException
from fastapi.responses import PlainTextResponse
import httpx
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "my_secure_whatsapp_token_123")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
API_VERSION = os.getenv("API_VERSION", "v25.0")

app = FastAPI(title="WhatsApp Bot Webhook")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "WhatsApp Bot Webhook Server is running."}

@app.get("/webhook", response_class=PlainTextResponse)
def verify_webhook(
    mode: str = Query(None, alias="hub.mode"),
    challenge: str = Query(None, alias="hub.challenge"),
    verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Verification endpoint required by Meta.
    When you setup the webhook in Facebook developer portal, Meta sends a GET request here.
    """
    logger.info(f"Received webhook verification request. Mode: {mode}, Token: {verify_token}")
    
    if mode == "subscribe" and verify_token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully!")
        return challenge
    
    logger.warning("Webhook verification failed. Token mismatch.")
    raise HTTPException(status_code=403, detail="Verification token mismatch")

async def send_whatsapp_message(to_phone: str, text_body: str):
    """
    Sends a text message using Meta WhatsApp Cloud API.
    """
    url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": text_body
        }
    }
    
    logger.info(f"Sending message to {to_phone}: {text_body}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            logger.info(f"Meta response status code: {response.status_code}")
            logger.info(f"Meta response body: {response.text}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while calling Meta API: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error while calling Meta API: {e}")
            raise

@app.post("/webhook")
async def receive_webhook(request: Request):
    """
    Main webhook receiver endpoint where Meta posts events.
    """
    try:
        body = await request.json()
    except Exception as e:
        logger.error(f"Error parsing incoming JSON: {e}")
        return {"status": "error", "message": "Invalid JSON"}
        
    logger.info(f"Received webhook event payload: {body}")
    
    # Process the webhook payload
    # Check if this is a WhatsApp message event
    if "object" in body and body["object"] == "whatsapp_business_account":
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Check if it has actual messages (ignoring statuses like sent, delivered, read)
                if "messages" in value:
                    for message in value["messages"]:
                        # Extract message info
                        sender_phone = message.get("from")
                        msg_type = message.get("type")
                        
                        logger.info(f"Incoming message from {sender_phone} of type {msg_type}")
                        
                        if msg_type == "text":
                            msg_body = message.get("text", {}).get("body", "").strip()
                            logger.info(f"Received text message: '{msg_body}'")
                            
                            # Simple response routing:
                            # If message is "hi" (case insensitive), reply with help message
                            if msg_body.lower() == "hi":
                                reply_text = "hello how can i assist you"
                            else:
                                reply_text = "hello how can i assist you"
                            
                            # Send reply asynchronously
                            try:
                                await send_whatsapp_message(sender_phone, reply_text)
                            except Exception as e:
                                logger.error(f"Failed to send response message: {e}")
                                
    return {"status": "ok"}
