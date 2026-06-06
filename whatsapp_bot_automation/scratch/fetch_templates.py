import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
API_VERSION = os.getenv("API_VERSION", "v25.0")

def get_templates():
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        print("Missing ACCESS_TOKEN or PHONE_NUMBER_ID in environment.")
        return

    # Step 1: Fetch WABA ID (WhatsApp Business Account ID)
    url_phone = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}"
    params_phone = {
        "access_token": ACCESS_TOKEN,
        "fields": "whatsapp_business_account"
    }
    
    print("Fetching WhatsApp Business Account ID...")
    try:
        r = httpx.get(url_phone, params=params_phone)
        r.raise_for_status()
        waba_id = r.json().get("whatsapp_business_account", {}).get("id")
        print(f"Successfully retrieved WABA ID: {waba_id}")
    except Exception as e:
        print(f"Failed to fetch WABA ID: {e}")
        if 'r' in locals():
            print(f"Response: {r.text}")
        return

    # Step 2: Fetch message templates
    url_templates = f"https://graph.facebook.com/{API_VERSION}/{waba_id}/message_templates"
    params_templates = {
        "access_token": ACCESS_TOKEN,
        "limit": 100
    }
    
    print("\nFetching Approved Message Templates...")
    try:
        r = httpx.get(url_templates, params=params_templates)
        r.raise_for_status()
        data = r.json()
        templates = data.get("data", [])
        print(f"Retrieved {len(templates)} templates:")
        for t in templates:
            print(f"\nTemplate Name: {t.get('name')}")
            print(f"Category: {t.get('category')}")
            print(f"Language: {t.get('language')}")
            print(f"Status: {t.get('status')}")
            components = t.get("components", [])
            for comp in components:
                if comp.get("type") == "BODY":
                    print(f"Text Body: {comp.get('text')}")
    except Exception as e:
        print(f"Failed to fetch templates: {e}")
        if 'r' in locals():
            print(f"Response: {r.text}")

if __name__ == "__main__":
    get_templates()
