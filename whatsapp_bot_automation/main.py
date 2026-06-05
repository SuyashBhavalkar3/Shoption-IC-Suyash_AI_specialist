import os
import logging
from fastapi import FastAPI, Request, Query, Response, HTTPException
from fastapi.responses import PlainTextResponse
import httpx
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "my_secure_whatsapp_token_123")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
API_VERSION = os.getenv("API_VERSION", "v25.0")

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# OpenAI and Qdrant configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "shoption_knowledge"

# Initialize Qdrant Client
qdrant_client = None
if QDRANT_URL and QDRANT_API_KEY:
    qdrant_client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=30.0
    )

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

async def get_openai_embedding(text: str) -> list:
    """
    Calls OpenAI API to generate a 1536-dimension embedding for text-embedding-3-small.
    """
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY is not configured!")
        raise ValueError("OPENAI_API_KEY is missing")

    url = "https://api.openai.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "input": text,
        "model": "text-embedding-3-small"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            return data["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"Error generating OpenAI embedding: {e}")
            raise e

async def retrieve_context(query_vector: list, limit: int = 3) -> str:
    """
    Queries Qdrant to find the top matching document chunks.
    """
    if not qdrant_client:
        logger.warning("Qdrant client is not initialized.")
        return ""
        
    try:
        results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=limit
        )
        context_parts = []
        for res in results:
            content = res.payload.get("content", "")
            source = res.payload.get("source", "Unknown source")
            context_parts.append(f"[Source: {source}]\n{content}")
        return "\n\n---\n\n".join(context_parts)
    except Exception as e:
        logger.error(f"Error searching Qdrant: {e}")
        return ""

async def generate_groq_response(user_message: str) -> str:
    """
    Calls Groq Chat Completions API to generate a dynamic message using context retrieved from Qdrant.
    """
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not configured in .env. Falling back to default greeting.")
        return "Hello! How can I assist you today?"

    # RAG: Retrieve context from Qdrant using OpenAI Embeddings
    context = ""
    try:
        query_vector = await get_openai_embedding(user_message)
        context = await retrieve_context(query_vector, limit=3)
    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}. Proceeding without context.")

    # System instruction enforces answering ONLY from the context
    system_instruction = (
        "You are a helpful customer support assistant for Shoption, an e-commerce platform. "
        "You MUST answer the user's question ONLY using the factual context provided below. "
        "Do NOT assume, hallucinate, or predict any details (such as prices, availability, specs, contact info) that are not explicitly stated in the context.\n\n"
        "If the user asks something inappropriate, or if the answer is NOT explicitly contained in the context, you MUST respond exactly with the following fallback message in the user's language:\n"
        "- For English: \"It seems like currently I am not able to answer your query. Please feel free to drop your query to our customer executives expert or give a missed call on 9890450985.\"\n"
        "- For Hindi: \"ऐसा लगता है कि वर्तमान में मैं आपके प्रश्न का उत्तर देने में असमर्थ हूँ। कृपया हमारे ग्राहक कार्यकारी विशेषज्ञ को अपना प्रश्न भेजने में संकोच न करें या 9890450985 पर मिस्ड कॉल दें।\"\n"
        "- For Marathi: \"असे दिसते आहे की सध्या मी तुमच्या प्रश्नाचे उत्तर देण्यास असमर्थ आहे. कृपया आमच्या ग्राहक सेवा तज्ज्ञांकडे तुमचा प्रश्न पाठवा किंवा 9890450985 वर मिस्ड कॉल द्या.\"\n\n"
        "Always respond in the language used by the user (English, Hindi, or Marathi).\n\n"
        f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---"
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_instruction
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        "temperature": 0.0,  # Zero temperature for deterministic responses based ONLY on context
        "max_tokens": 512
    }

    logger.info(f"Calling Groq API model {GROQ_MODEL} for query: '{user_message}' with system instruction containing context.")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            return reply.strip()
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return "Namaste! I am having trouble connecting to my brain right now. How can I help you?"

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
                            
                            # Generate dynamic response using Groq LLM
                            try:
                                reply_text = await generate_groq_response(msg_body)
                            except Exception as e:
                                logger.error(f"Failed to generate Groq reply: {e}")
                                reply_text = "Namaste! How can I help you today?"
                            
                            # Send reply asynchronously
                            try:
                                await send_whatsapp_message(sender_phone, reply_text)
                            except Exception as e:
                                logger.error(f"Failed to send response message: {e}")
                                
    return {"status": "ok"}