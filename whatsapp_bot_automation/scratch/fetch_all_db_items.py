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

def fetch_all_items_paginated():
    all_items = {}
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    
    # We will try categories from 1 to 15, and for each category, fetch pages 1, 2, 3...
    for cat in [None, "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]:
        for page in range(1, 10):
            payload = {
                "category": cat,
                "subcategory": None,
                "brand": "175",
                "page": page,
                "page_size": 100,
                "mobile_no": MOBILE_NO
            }
            try:
                response = httpx.post(url, headers=HEADERS, json=payload, timeout=20.0)
                if response.status_code == 200:
                    data = response.json()
                    items = data.get("message", {}).get("data", {}).get("data", [])
                    if not items:
                        break  # No more items in this category/page
                    
                    for item in items:
                        item_code = item.get("item_code")
                        if item_code:
                            all_items[item_code] = item
                    
                    logger.info(f"Category {cat}, Page {page} -> Got {len(items)} items. Total unique: {len(all_items)}")
                    if len(items) < 100:
                        break  # This is the last page
                else:
                    logger.warning(f"Failed category {cat}, page {page}: {response.status_code}")
                    break
            except Exception as e:
                logger.error(f"Error category {cat}, page {page}: {e}")
                break
                
    return list(all_items.values())

def main():
    items = fetch_all_items_paginated()
    print(f"\nSuccessfully retrieved {len(items)} unique items in total.")
    
    # Let's search for some of the missing keywords
    for kw in ["zatka", "rotavator", "brush", "seeder", "solar", "drone", "tufaan", "mitra"]:
        matches = [i for i in items if kw.lower() in i.get("item_name", "").lower()]
        print(f"\nKeyword '{kw}' matches ({len(matches)}):")
        for m in matches[:5]:
            print(f"  - {m.get('item_name')} ({m.get('item_code')})")

if __name__ == "__main__":
    main()
