import httpx
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

API_URL = "https://proderp.gbru.in/api/method"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-KEY": "SHOPTION_XYZ_9834SDJKS",
    "X-API-SECRET": "SHOPTION_SECRET_99ASD9A8S9D"
}
MOBILE_NO = "9174611987"

def fetch_no_brand():
    all_items = {}
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    
    # Query page 1 to 10 with brand=None
    for page in range(1, 10):
        payload = {
            "category": None,
            "subcategory": None,
            "brand": None,
            "page": page,
            "page_size": 100,
            "mobile_no": MOBILE_NO
        }
        try:
            response = httpx.post(url, headers=HEADERS, json=payload, timeout=20.0)
            if response.status_code == 200:
                items = response.json().get("message", {}).get("data", {}).get("data", [])
                if not items:
                    break
                for item in items:
                    all_items[item.get("item_code")] = item.get("item_name")
                logger.info(f"Page {page} -> Got {len(items)} items. Total unique: {len(all_items)}")
                if len(items) < 100:
                    break
            else:
                break
        except Exception as e:
            logger.error(f"Error page {page}: {e}")
            break
            
    print(f"\nRetrieved {len(all_items)} unique items without brand constraint.")
    for code, name in all_items.items():
        if any(w in name.lower() for w in ["zatka", "rotavator", "brush"]):
            print(f"Code: {code} | Name: {name}")

if __name__ == "__main__":
    fetch_no_brand()
