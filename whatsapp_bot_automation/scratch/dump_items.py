import httpx
import json
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

def get_all_items():
    all_items = {}
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    for page in [1, 2, 3]:
        payload = {
            "category": None,
            "subcategory": None,
            "brand": "175",
            "page": page,
            "page_size": 100,
            "mobile_no": MOBILE_NO
        }
        try:
            r = httpx.post(url, headers=HEADERS, json=payload, timeout=20.0)
            if r.status_code == 200:
                items = r.json().get("message", {}).get("data", {}).get("data", [])
                for item in items:
                    all_items[item.get("item_code")] = item.get("item_name")
        except Exception as e:
            print(f"Error page {page}: {e}")
    return all_items

if __name__ == "__main__":
    items = get_all_items()
    # Save the mapping of item_code -> item_name to a file for easy viewing
    with open("scratch/db_items_dump.json", "w", encoding="utf-8") as f:
        json.dump(items, f, indent=4)
    print(f"Dumped {len(items)} items to scratch/db_items_dump.json")
    
    # Print list sorted by name
    sorted_items = sorted(items.items(), key=lambda x: x[1])
    for code, name in sorted_items:
        if any(w in name.lower() for w in ["fence", "zatka", "rotavator", "cutter", "brush", "pump", "tufaan"]):
            print(f"Code: {code} | Name: {name}")
