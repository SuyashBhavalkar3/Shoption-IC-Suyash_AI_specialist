import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")

def debug():
    url = "https://graph.facebook.com/debug_token"
    params = {
        "input_token": ACCESS_TOKEN,
        "access_token": ACCESS_TOKEN
    }
    r = httpx.get(url, params=params)
    print("Token Debug Info:")
    print(r.json())

if __name__ == "__main__":
    debug()
