import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
API_VERSION = os.getenv("API_VERSION", "v25.0")
WABA_ID = "1015468127681241"

def fetch_templates():
    url = f"https://graph.facebook.com/{API_VERSION}/{WABA_ID}/message_templates"
    params = {
        "access_token": ACCESS_TOKEN,
        "limit": 100
    }
    r = httpx.get(url, params=params)
    print("Templates response:")
    data = r.json()
    templates = data.get("data", [])
    print(f"Total Templates: {len(templates)}")
    for t in templates:
        print(f"\nName: {t.get('name')}")
        print(f"Category: {t.get('category')}")
        print(f"Language: {t.get('language')}")
        print(f"Status: {t.get('status')}")
        for comp in t.get("components", []):
            if comp.get("type") == "BODY":
                print(f"Body: {comp.get('text')}")

if __name__ == "__main__":
    fetch_templates()
