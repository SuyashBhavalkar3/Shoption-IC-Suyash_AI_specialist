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

def search_item(search_text):
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    
    # Let's try different combinations of payload parameters
    # Let's try category: None, brand: None, and see if it retrieves all items
    payload = {
        "category": None,
        "subcategory": None,
        "brand": None,
        "page": 1,
        "page_size": 2000,
        "mobile_no": MOBILE_NO
    }
    
    try:
        response = httpx.post(url, headers=HEADERS, json=payload, timeout=20.0)
        if response.status_code == 200:
            items = response.json().get("message", {}).get("data", {}).get("data", [])
            matches = [item for item in items if search_text.lower() in item.get("item_name", "").lower()]
            print(f"Searched '{search_text}' with brand=None -> Found {len(matches)} matches:")
            for m in matches[:5]:
                print(f"  - {m.get('item_name')} ({m.get('item_code')})")
        else:
            print(f"Failed with status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_item("zatka")
    search_item("rotavator")
    search_item("brush")
    search_item("seeder")
    search_item("solar")
