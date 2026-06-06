import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
API_VERSION = os.getenv("API_VERSION", "v25.0")

def get_waba_accounts():
    url = f"https://graph.facebook.com/{API_VERSION}/me/whatsapp_business_accounts"
    params = {
        "access_token": ACCESS_TOKEN
    }
    r = httpx.get(url, params=params)
    print("User accounts/WABA info:")
    print(r.json())

if __name__ == "__main__":
    get_waba_accounts()
