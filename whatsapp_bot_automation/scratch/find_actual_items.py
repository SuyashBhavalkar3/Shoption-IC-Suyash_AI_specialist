import os
import re
import json
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

# 27 products hardcoded in the front-end JS bundle
HARDCODED_PRODUCTS = [
    {"title": "Smart Guard GBRU 4G Solar Powered Security Camera | 360 degree view"},
    {"title": "GBRU Mobile Mitra Smart"},
    {"title": "16 Teeth Seeder - Premium"},
    {"title": "GBRU PowerMax 35 Premium,25L"},
    {"title": "GBRU (गब्रू) 9 HP Diesel Power Weeder 🔥 Electric Start"},
    {"title": "GBRU EarthMax 63 Super Pro"},
    {"title": "GBRU AquaForce 80CC Pro 1.5 Pump"},
    {"title": "BRUSH CUTTER 4 STROKE AGT-YT-BC-504 (Agrictools)"},
    {"title": "GBRU Spraying Drone - AgriVeer"},
    {"title": "Spray Pump 12×8 Single Motor, 16 Liter"},
    {"title": "Gbru Chaff Cutter Champion Pro Model with Motor"},
    {"title": "12 Teeth Seeder - Premium"},
    {"title": "Size 12 x 18 120 GSM (FT) Tarpaulin (Weight 2.89 kg) + 3-5% Tollerance"},
    {"title": "Seed + Fertilizer Seeder"},
    {"title": "12 Teeth Seeder - (Without Handle & Roller)"},
    {"title": "GBRU 30x30 FT Tarpaulin - 180 GSM, 15 kg, Heavy Duty with 3-5% Tolerance"},
    {"title": "GBRU rain pipe 20 MM - 200 MTR ( 2.5 Kg ) 250 Micron"},
    {"title": "6 FT ROTAVATOR 42 BLADE L TYPE FARM-PRO MAX"},
    {"title": "GBRU rain pipe 40 MM - 100 MTR ( 3.5 Kg )"},
    {"title": "Spray Pump 12×14 Double Motor, 20 Liter"},
    {"title": "GBRU Solar Trap"},
    {"title": "GBRU 50x50 FT Tarpaulin - 180 GSM, 42.5 kg, Durable & Heavy Duty (3-5% Tolerance)"},
    {"title": "Heavy Duty GBRU Solar Zatka Machine for 100 Acres | High Power Electric Fence Energizer | Waterproof Farm Protection Guard"},
    {"title": "GBRU 24x50 Meter Tarpaulin - 180 GSM, 67 kg, Heavy Duty, 3-5% Tolerance for Maximum Durability"},
    {"title": "GBRU rain pipe 32 MM - 100 MTR ( 3.0 Kg )"},
    {"title": "Tufaan 12x14 Spray Pump Double Motor  | 16 Liter"},
    {"title": "Gbru Cycle Kolape"}
]

def clean_name(name: str) -> str:
    # Clean text to make matching easier
    name = name.lower()
    name = re.sub(r'[^\w\s]', '', name)
    return " ".join(name.split())

def fetch_all_db_items():
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    
    # We will fetch items category by category to ensure we don't miss anything,
    # or just use category: None which returned 100 items. Let's combine category None, 1, 2, 3, 4, 5, 7, 9, 10
    all_items = {}
    for cat in [None, "1", "2", "3", "4", "5", "7", "9", "10"]:
        payload = {
            "category": cat,
            "subcategory": None,
            "brand": "175",
            "page": 1,
            "page_size": 2000,
            "mobile_no": MOBILE_NO
        }
        try:
            response = httpx.post(url, headers=HEADERS, json=payload, timeout=20.0)
            if response.status_code == 200:
                items = response.json().get("message", {}).get("data", {}).get("data", [])
                for item in items:
                    item_code = item.get("item_code")
                    if item_code:
                        all_items[item_code] = item
            else:
                logger.warning(f"Failed to fetch for category {cat}: {response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching category {cat}: {e}")
            
    logger.info(f"Retrieved {len(all_items)} unique items from database across all categories.")
    return list(all_items.values())

def find_match(target_title, db_items):
    target_clean = clean_name(target_title)
    
    # Try exact match first
    for item in db_items:
        db_title = item.get("item_name", "")
        if clean_name(db_title) == target_clean:
            return item
            
    # Try substring match / partial match
    best_match = None
    best_overlap = 0
    target_words = set(target_clean.split())
    
    for item in db_items:
        db_title = item.get("item_name", "")
        db_clean = clean_name(db_title)
        db_words = set(db_clean.split())
        
        # Calculate intersection
        intersection = target_words.intersection(db_words)
        if len(intersection) > best_overlap:
            best_overlap = len(intersection)
            best_match = item
            
    if best_overlap >= 2:  # At least 2 words overlap
        return best_match
        
    return None

def main():
    db_items = fetch_all_db_items()
    
    matches_found = []
    missing = []
    
    for prod in HARDCODED_PRODUCTS:
        title = prod["title"]
        match = find_match(title, db_items)
        if match:
            matches_found.append((title, match))
        else:
            missing.append(title)
            
    print(f"\nMatched {len(matches_found)} / {len(HARDCODED_PRODUCTS)} products.")
    print("\n--- Matches ---")
    for title, match in matches_found:
        print(f"Web: {title[:40]}... -> DB: {match.get('item_name')} ({match.get('item_code')})")
        
    if missing:
        print("\n--- Missing ---")
        for title in missing:
            print(f"- {title}")

if __name__ == "__main__":
    main()
