import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
API_VERSION = os.getenv("API_VERSION", "v25.0")

def get_phone_info():
    url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}"
    params = {
        "access_token": ACCESS_TOKEN
    }
    r = httpx.get(url, params=params)
    print("Phone Number info:")
    print(r.json())

if __name__ == "__main__":
    get_phone_info()
