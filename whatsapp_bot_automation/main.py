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
        response = qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit
        )
        results = response.points
        context_parts = []
        for res in results:
            content = res.payload.get("content", "")
            source = res.payload.get("source", "Unknown source")
            context_parts.append(f"[Source: {source}]\n{content}")
        return "\n\n---\n\n".join(context_parts)
    except Exception as e:
        logger.error(f"Error searching Qdrant: {e}")
        return ""

import json

async def generate_groq_response(user_message: str) -> str:
    """
    Calls Groq Chat Completions API with JSON mode.
    Classifies intent (greeting, goodbye, catalog_inquiry, complaint_feedback, out_of_scope)
    and returns a warm, helpful, conversion-oriented response in the user's language.
    """
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not configured in .env. Falling back to default greeting.")
        return "Hello! How can I assist you today?"

    # RAG: Retrieve context from Qdrant using OpenAI Embeddings
    context = ""
    try:
        query_vector = await get_openai_embedding(user_message)
        context = await retrieve_context(query_vector, limit=7)
    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}. Proceeding without context.")

    # System instruction enforces natural assistance while maintaining strict facts for catalog inquiries
    system_instruction = (
        "You are a helpful customer support assistant for Shoption, an agricultural e-commerce platform. "
        "You MUST respond ONLY in a valid JSON object matching the following structure:\n"
        "{\n"
        "  \"intent\": \"greeting\" | \"goodbye\" | \"catalog_inquiry\" | \"complaint_feedback\" | \"out_of_scope\",\n"
        "  \"language\": \"en\" | \"hi\" | \"mr\",\n"
        "  \"answer\": \"your generated response (follow the rules below)\"\n"
        "}\n\n"
        "Rules for generating the \"answer\" field in the detected \"language\":\n"
        "1. For \"greeting\": Welcome the customer warmly (e.g. 'Hello, welcome to Shoption! How can I help you today? Are you looking for product specs, prices, or booking details?').\n"
        "2. For \"goodbye\": Say goodbye politely (e.g. 'You're welcome! I hope I was able to help. If you still have questions, feel free to request a callback or give us a missed call on 9890450985. Have a great day!').\n"
        "3. For \"complaint_feedback\": Apologize sincerely and show empathy (e.g. 'I am really sorry to hear about your bad experience. We apologize for the inconvenience caused. Let me arrange an immediate callback for you, or please give a missed call on 9890450985 to connect with our senior executives directly so we can resolve this right away.').\n"
        "4. For \"catalog_inquiry\":\n"
        "   - Check the context first. If the product/spec is explicitly in the context, answer the query factually using ONLY the context. Do NOT assume or make up any prices or features.\n"
        "   - If the product/details are NOT in the context, do NOT say 'unable to answer'. Instead, say something like: 'I see you are asking about [Product/Topic]. Currently, I don't have the exact details or pricing for it in my active catalog. However, I would love to connect you with our sales expert! Feel free to drop your details here or give a missed call on 9890450985 so we can get back to you with the correct details.'\n"
        "5. For \"out_of_scope\" (general chit-chat or unrelated topics): Politely guide them back to Shoption (e.g. 'I can help you with Shoption's agricultural equipment, catalog prices, or support. If you need any assistance, feel free to drop a message or give a missed call on 9890450985.').\n"
        "6. Always output ONLY the raw JSON object, no explanation or markdown formatting.\n\n"
        f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---"
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": GROQ_MODEL,
        "response_format": {"type": "json_object"},
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
        "temperature": 0.0,
        "max_tokens": 512
    }

    logger.info(f"Calling Groq API in JSON Mode for query: '{user_message}'")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            raw_reply = data["choices"][0]["message"]["content"].strip()
            
            # Parse the JSON response from LLM
            parsed = json.loads(raw_reply)
            answer = parsed.get("answer", "").strip()
            lang = parsed.get("language", "en")

            if answer:
                return answer

            # Ultimate fallback in case JSON answer is empty
            if lang == "hi":
                return "ऐसा लगता है कि वर्तमान में मैं आपके प्रश्न का उत्तर देने में असमर्थ हूँ। कृपया हमारे ग्राहक कार्यकारी विशेषज्ञ को अपना प्रश्न भेजने में संकोच न करें या 9890450985 पर मिस्ड कॉल दें।"
            elif lang == "mr":
                return "असे दिसते आहे की सध्या मी तुमच्या प्रश्नाचे उत्तर देण्यास असमर्थ आहे। कृपया आमच्या ग्राहक सेवा तज्ज्ञांकडे तुमचा प्रश्न पाठवा किंवा 9890450985 वर मिस्ड कॉल द्या।"
            else:
                return "It seems like currently I am not able to answer your query. Please feel free to drop your query to our customer executives expert or give a missed call on 9890450985."

        except Exception as e:
            logger.error(f"Error calling or parsing Groq JSON reply: {e}")
            return "It seems like currently I am not able to answer your query. Please feel free to drop your query to our customer executives expert or give a missed call on 9890450985."

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

async def send_whatsapp_template(to_phone: str, template_name: str, language_code: str = "en_US", components: list = None):
    """
    Sends a WhatsApp message using a pre-approved template.
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
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }
    }
    if components:
        payload["template"]["components"] = components

    logger.info(f"Sending template message '{template_name}' to {to_phone}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            logger.info(f"Meta template response status code: {response.status_code}")
            logger.info(f"Meta template response body: {response.text}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while sending Meta template: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error while sending Meta template: {e}")
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