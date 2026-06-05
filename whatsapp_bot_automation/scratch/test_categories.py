import httpx

API_URL = "https://proderp.gbru.in/api/method"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-KEY": "SHOPTION_XYZ_9834SDJKS",
    "X-API-SECRET": "SHOPTION_SECRET_99ASD9A8S9D"
}
MOBILE_NO = "9174611987"

def test_categories():
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    
    # Try multiple category numbers, since it is brand 175
    # Let's see what happens if we set category to None, or different integers as strings
    for cat in [None, "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]:
        payload = {
            "category": cat,
            "subcategory": None,
            "brand": "175",
            "page": 1,
            "page_size": 2000,
            "mobile_no": MOBILE_NO
        }
        try:
            response = httpx.post(url, headers=HEADERS, json=payload, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                items = data.get("message", {}).get("data", {}).get("data", [])
                print(f"Category: {cat} -> Count: {len(items)}")
                if items:
                    print(f"  First item: {items[0].get('item_name')} ({items[0].get('item_code')})")
            else:
                print(f"Category: {cat} -> Status: {response.status_code}")
        except Exception as e:
            print(f"Category: {cat} -> Error: {e}")

if __name__ == "__main__":
    test_categories()
