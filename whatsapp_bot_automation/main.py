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
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error sending template: {e}")
            raise

async def send_whatsapp_interactive_list(
    to_phone: str, 
    body_text: str, 
    button_label: str, 
    sections: list, 
    header_text: str = None, 
    footer_text: str = None
):
    """
    Sends a WhatsApp Interactive List message.
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
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {
                "text": body_text
            },
            "action": {
                "button": button_label,
                "sections": sections
            }
        }
    }
    if header_text:
        payload["interactive"]["header"] = {"type": "text", "text": header_text}
    if footer_text:
        payload["interactive"]["footer"] = {"text": footer_text}

    logger.info(f"Sending interactive list to {to_phone}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            logger.info(f"Interactive list response: {response.text}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error sending interactive list: {e}")
            raise

async def send_whatsapp_interactive_buttons(
    to_phone: str, 
    body_text: str, 
    buttons: list, 
    header_text: str = None, 
    footer_text: str = None
):
    """
    Sends a WhatsApp Interactive Button message (maximum of 3 buttons).
    """
    url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    formatted_buttons = []
    for btn in buttons:
        formatted_buttons.append({
            "type": "reply",
            "reply": {
                "id": btn["id"],
                "title": btn["title"]
            }
        })
        
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": body_text
            },
            "action": {
                "buttons": formatted_buttons
            }
        }
    }
    if header_text:
        payload["interactive"]["header"] = {"type": "text", "text": header_text}
    if footer_text:
        payload["interactive"]["footer"] = {"text": footer_text}

    logger.info(f"Sending interactive buttons to {to_phone}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            logger.info(f"Interactive buttons response: {response.text}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error sending interactive buttons: {e}")
            raise

# In-memory session store
user_states = {}

# Categories & Product Options Structure
CATEGORIES_MAPPING = {
    "cat_drones": {
        "title": "Spraying Drones",
        "description": "Select a drone model:",
        "items": [
            {"id": "prod_32164", "title": "AgriVeer Drone", "description": "GBRU Spraying Drone - AgriVeer"}
        ]
    },
    "cat_sprayers": {
        "title": "Power Sprayers",
        "description": "Select a sprayer model:",
        "items": [
            {"id": "prod_32186", "title": "PowerMax 35 Premium", "description": "GBRU PowerMax 35 Premium, 25L"},
            {"id": "prod_17427", "title": "Spray Pump 12x8 Single", "description": "Spray Pump 12x8 Single Motor, 16L"},
            {"id": "prod_17415", "title": "Spray Pump 12x14 Double", "description": "Spray Pump 12x14 Double Motor, 20L"},
            {"id": "prod_27675", "title": "Tufaan 12x14 Double", "description": "Tufaan 12x14 Spray Pump Double Motor"}
        ]
    },
    "cat_weeders": {
        "title": "Power Weeders",
        "description": "Select a weeder model:",
        "items": [
            {"id": "prod_32177", "title": "9 HP Diesel Weeder", "description": "GBRU 9 HP Diesel Power Weeder"},
            {"id": "prod_32166", "title": "EarthMax 63 Super Pro", "description": "GBRU EarthMax 63 Super Pro"}
        ]
    },
    "cat_cameras": {
        "title": "Security Cameras",
        "description": "Select a camera model:",
        "items": [
            {"id": "prod_12983", "title": "4G Solar Camera", "description": "Smart Guard GBRU 4G Solar Camera"}
        ]
    },
    "cat_tarpaulins": {
        "title": "Tarpaulins & Rain Pipes",
        "description": "Select a product:",
        "items": [
            {"id": "prod_27545", "title": "30x30 FT Tarpaulin", "description": "GBRU 30x30 FT Tarpaulin - 180 GSM"},
            {"id": "prod_32081", "title": "50x50 FT Tarpaulin", "description": "GBRU 50x50 FT Tarpaulin - 180 GSM"},
            {"id": "prod_32082", "title": "24x50 Mtr Tarpaulin", "description": "GBRU 24x50 Meter Tarpaulin - 180 GSM"},
            {"id": "prod_27319", "title": "Rain Pipe 20 MM - 200M", "description": "GBRU rain pipe 20 MM - 200 MTR"},
            {"id": "prod_27205", "title": "Rain Pipe 40 MM - 100M", "description": "GBRU rain pipe 40 MM - 100 MTR"},
            {"id": "prod_27309", "title": "Rain Pipe 32 MM - 100M", "description": "GBRU rain pipe 32 MM - 100 MTR"}
        ]
    }
}

async def send_main_menu(to_phone: str):
    """
    Sends the primary menu list to the user.
    """
    body_text = (
        "Hello! I hope you are doing fine.\n\n"
        "We are GBRU under Shoption, and we are pioneers of the agritech industry.\n"
        "Please select an option below to proceed:"
    )
    sections = [
        {
            "title": "Main Options",
            "rows": [
                {
                    "id": "track_order",
                    "title": "📦 Track Order",
                    "description": "Check order delivery status"
                },
                {
                    "id": "see_products",
                    "title": "🚜 See Products & Prices",
                    "description": "Browse agritech products"
                },
                {
                    "id": "raise_query",
                    "title": "❓ Raise Query",
                    "description": "Ask catalog/support queries"
                },
                {
                    "id": "rate_product",
                    "title": "⭐ Rate Product",
                    "description": "Rate our product and service"
                },
                {
                    "id": "talk_customer_care",
                    "title": "📞 Talk to Customer Care",
                    "description": "Connect with an executive"
                }
            ]
        }
    ]
    await send_whatsapp_interactive_list(
        to_phone=to_phone,
        body_text=body_text,
        button_label="Select Option",
        sections=sections,
        header_text="GBRU Agritech",
        footer_text="Powered by Shoption"
    )

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
    
    if "object" in body and body["object"] == "whatsapp_business_account":
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                if "messages" in value:
                    for message in value["messages"]:
                        sender_phone = message.get("from")
                        msg_type = message.get("type")
                        
                        logger.info(f"Incoming message from {sender_phone} of type {msg_type}")
                        
                        # Initialize user state if missing
                        if sender_phone not in user_states:
                            user_states[sender_phone] = {"state": "idle"}
                        
                        # 1. HANDLE TEXT MESSAGES
                        if msg_type == "text":
                            msg_body = message.get("text", {}).get("body", "").strip()
                            cleaned_body = msg_body.lower().strip("?!. ")
                            logger.info(f"Received text message: '{msg_body}'")
                            
                            # Check if greeting or menu request -> reset state & send Main Menu
                            greetings = ["hi", "hello", "hey", "namaste", "pranam", "start", "menu", "नमस्कार", "हॅलो"]
                            if cleaned_body in greetings:
                                user_states[sender_phone] = {"state": "idle"}
                                try:
                                    await send_main_menu(sender_phone)
                                except Exception as e:
                                    logger.error(f"Failed to send main menu: {e}")
                                continue

                            current_state = user_states[sender_phone].get("state", "idle")
                            
                            if current_state == "awaiting_order_id":
                                # Process order tracking
                                user_states[sender_phone]["state"] = "idle"
                                reply = (
                                    f"🔍 Checking order status for ID: *{msg_body}*...\n\n"
                                    "Your order is currently packaging and will be dispatched soon via Shoption Logistics. "
                                    "We will notify you with the tracking link."
                                )
                                try:
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text=reply,
                                        buttons=[{"id": "back_to_main", "title": "🔙 Main Menu"}]
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send order tracking reply: {e}")
                                    
                            elif current_state == "awaiting_query":
                                # Generate response via LLM RAG
                                try:
                                    reply_text = await generate_groq_response(msg_body)
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text=reply_text,
                                        buttons=[
                                            {"id": "raise_query", "title": "❓ Ask Another"},
                                            {"id": "back_to_main", "title": "🔙 Main Menu"}
                                        ]
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to process custom query: {e}")
                                    
                            else:
                                # Default: Treat as general query
                                try:
                                    reply_text = await generate_groq_response(msg_body)
                                    await send_whatsapp_message(sender_phone, reply_text)
                                except Exception as e:
                                    logger.error(f"Failed to process catalog reply: {e}")

                        # 2. HANDLE INTERACTIVE MESSAGES (LIST/BUTTON CLICKS)
                        elif msg_type == "interactive":
                            interactive = message.get("interactive", {})
                            interactive_type = interactive.get("type")
                            
                            click_id = ""
                            if interactive_type == "list_reply":
                                click_id = interactive.get("list_reply", {}).get("id", "")
                            elif interactive_type == "button_reply":
                                click_id = interactive.get("button_reply", {}).get("id", "")
                                
                            logger.info(f"User clicked interactive item: '{click_id}'")
                            
                            if click_id == "back_to_main":
                                user_states[sender_phone] = {"state": "idle"}
                                try:
                                    await send_main_menu(sender_phone)
                                except Exception as e:
                                    logger.error(f"Failed to send main menu: {e}")
                                    
                            elif click_id == "track_order":
                                user_states[sender_phone]["state"] = "awaiting_order_id"
                                try:
                                    await send_whatsapp_message(
                                        sender_phone, 
                                        "📦 Please type your *Order ID* (for example: GBRU-5492) to track your delivery status."
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to ask for order ID: {e}")
                                    
                            elif click_id == "raise_query":
                                user_states[sender_phone]["state"] = "awaiting_query"
                                try:
                                    await send_whatsapp_message(
                                        sender_phone, 
                                        "❓ Please type your question (e.g. 'what is the price of GBRU spraying drone?') and I will search our catalog."
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to ask for query: {e}")
                                    
                            elif click_id == "see_products":
                                # Send Category sub-menu list
                                sections = [
                                    {
                                        "title": "Select Category",
                                        "rows": [
                                            {"id": "cat_drones", "title": "🛸 Spraying Drones", "description": "Specs & details of agritech drones"},
                                            {"id": "cat_sprayers", "title": "💧 Power Sprayers", "description": "Double motor spray pumps"},
                                            {"id": "cat_weeders", "title": "🌾 Power Weeders", "description": "Diesel weeders & earth augers"},
                                            {"id": "cat_cameras", "title": "📷 Security Cameras", "description": "Solar powered 4G cameras"},
                                            {"id": "cat_tarpaulins", "title": "⛺ Tarpaulins & Pipes", "description": "Tarpaulins and rain pipes"},
                                            {"id": "back_to_main", "title": "🔙 Back to Main Menu", "description": "Return to main menu options"}
                                        ]
                                    }
                                ]
                                try:
                                    await send_whatsapp_interactive_list(
                                        to_phone=sender_phone,
                                        body_text="🚜 Please select a category to view GBRU products:",
                                        button_label="Categories",
                                        sections=sections,
                                        header_text="GBRU Catalog"
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send categories menu: {e}")
                                    
                            elif click_id.startswith("cat_"):
                                # Send list of products in the selected category
                                category_data = CATEGORIES_MAPPING.get(click_id)
                                if category_data:
                                    rows = []
                                    for item in category_data["items"]:
                                        rows.append({
                                            "id": item["id"],
                                            "title": item["title"],
                                            "description": item["description"][:72]
                                        })
                                    rows.append({
                                        "id": "see_products",
                                        "title": "🔙 Back to Categories",
                                        "description": "Go back to categories"
                                    })
                                    sections = [{"title": category_data["title"], "rows": rows}]
                                    try:
                                        await send_whatsapp_interactive_list(
                                            to_phone=sender_phone,
                                            body_text=category_data["description"],
                                            button_label="View Products",
                                            sections=sections,
                                            header_text=category_data["title"]
                                        )
                                    except Exception as e:
                                        logger.error(f"Failed to send products list: {e}")
                                        
                            elif click_id.startswith("prod_"):
                                # Extract product ID/code
                                code = click_id.replace("prod_", "")
                                # Fetch specifications from RAG context
                                try:
                                    # Create query vector for product name/code
                                    query_vector = await get_openai_embedding(f"item code {code}")
                                    details_text = await retrieve_context(query_vector, limit=1)
                                    
                                    # Use Groq LLM to format it cleanly
                                    formatted_reply = await generate_groq_response(f"Describe specifications, MRP, and prices of product {code} from this context: {details_text}")
                                    
                                    buttons = [
                                        {"id": f"buy_now_{code}", "title": "🛍️ Buy Now"},
                                        {"id": "see_products", "title": "🚜 Back to Catalog"},
                                        {"id": "back_to_main", "title": "🔙 Main Menu"}
                                    ]
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text=formatted_reply,
                                        buttons=buttons
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to format product detail: {e}")
                                    
                            elif click_id.startswith("buy_now_"):
                                reply = (
                                    "🛒 *How to Buy GBRU Products:*\n\n"
                                    "1. **Full Pre-payment**: Pay now on Shoption to get free shipping and maximum savings.\n"
                                    "2. **Cash on Delivery (COD)**: Pay the booking amount now, and the remainder upon delivery.\n\n"
                                    "📞 To finalize booking, please give a missed call on *9890450985* or type your name here and we will call you back!"
                                )
                                try:
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text=reply,
                                        buttons=[{"id": "back_to_main", "title": "🔙 Main Menu"}]
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send buy now reply: {e}")
                                    
                            elif click_id == "rate_product":
                                try:
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text="⭐ We value your business! Please rate our service and products:",
                                        buttons=[
                                            {"id": "rate_5", "title": "⭐⭐⭐⭐⭐ Outstanding"},
                                            {"id": "rate_3", "title": "⭐⭐⭐ Satisfactory"},
                                            {"id": "rate_1", "title": "⭐ Needs Improvement"}
                                        ]
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send rating buttons: {e}")
                                    
                            elif click_id in ["rate_5", "rate_3", "rate_1"]:
                                text = "🙏 Thank you so much for your feedback! It helps us improve GBRU and Shoption for all farmers."
                                try:
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text=text,
                                        buttons=[{"id": "back_to_main", "title": "🔙 Main Menu"}]
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send rating thanks: {e}")
                                    
                            elif click_id == "talk_customer_care":
                                text = (
                                    "📞 *Talk to Customer Care:*\n\n"
                                    "Our customer care executives are ready to assist you. You can:\n"
                                    "- Give a missed call on *9890450985* to receive an automated callback.\n"
                                    "- Drop your query here, and we will get back to you within 24 hours."
                                )
                                try:
                                    await send_whatsapp_interactive_buttons(
                                        to_phone=sender_phone,
                                        body_text=text,
                                        buttons=[{"id": "back_to_main", "title": "🔙 Main Menu"}]
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send care details: {e}")
                                    
    return {"status": "ok"}