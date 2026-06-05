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

# The 27 products hardcoded in the React frontend
WEB_PRODUCTS = [
    {"title": "Smart Guard GBRU 4G Solar Powered Security Camera | 360 degree view", "price": "9,757.19", "item_code": "WH001"},
    {"title": "GBRU Mobile Mitra Smart", "price": "6,287", "item_code": "SW001"},
    {"title": "16 Teeth Seeder - Premium", "price": "9,948", "item_code": "LS001"},
    {"title": "GBRU PowerMax 35 Premium,25L", "price": "14,225", "item_code": "CM001"},
    {"title": "GBRU (गब्रू) 9 HP Diesel Power Weeder 🔥 Electric Start", "price": "1,53,469", "item_code": "CM001"},
    {"title": "GBRU EarthMax 63 Super Pro", "price": "12,874", "item_code": "CM001"},
    {"title": "GBRU AquaForce 80CC Pro 1.5 Pump", "price": "18,115", "item_code": "CM001"},
    {"title": "BRUSH CUTTER 4 STROKE AGT-YT-BC-504 (Agrictools)", "price": "13,998", "item_code": "CM001"},
    {"title": "GBRU Spraying Drone - AgriVeer", "price": "6,75,951", "item_code": "CM001"},
    {"title": "Spray Pump 12×8 Single Motor, 16 Liter", "price": "2,340", "item_code": "CM001"},
    {"title": "Gbru Chaff Cutter Champion Pro Model with Motor", "price": "35,276", "item_code": "CM001"},
    {"title": "12 Teeth Seeder - Premium", "price": "8,660", "item_code": "17374"},
    {"title": "Size 12 x 18 120 GSM (FT) Tarpaulin (Weight 2.89 kg) + 3-5% Tollerance", "price": "855", "item_code": "CM001"},
    {"title": "Seed + Fertilizer Seeder", "price": "9,714", "item_code": "17375"},
    {"title": "12 Teeth Seeder - (Without Handle & Roller)", "price": "8,192", "item_code": "27694"},
    {"title": "GBRU 30x30 FT Tarpaulin - 180 GSM, 15 kg, Heavy Duty with 3-5% Tolerance", "price": "4,435", "item_code": "27545"},
    {"title": "GBRU rain pipe 20 MM - 200 MTR ( 2.5 Kg ) 250 Micron", "price": "1,029", "item_code": "27319"},
    {"title": "6 FT ROTAVATOR 42 BLADE L TYPE FARM-PRO MAX", "price": "1,25,500", "item_code": "CM001"},
    {"title": "GBRU rain pipe 40 MM - 100 MTR ( 3.5 Kg )", "price": "1,029", "item_code": "27205"},
    {"title": "Spray Pump 12×14 Double Motor, 20 Liter", "price": "3,569", "item_code": "17415"},
    {"title": "GBRU Solar Trap", "price": "1,245", "item_code": "24919"},
    {"title": "GBRU 50x50 FT Tarpaulin - 180 GSM, 42.5 kg, Durable & Heavy Duty (3-5% Tolerance)", "price": "12,567", "item_code": "32081"},
    {"title": "Heavy Duty GBRU Solar Zatka Machine for 100 Acres | High Power Electric Fence Energizer | Waterproof Farm Protection Guard", "price": "13,118", "item_code": "CM001"},
    {"title": "GBRU 24x50 Meter Tarpaulin - 180 GSM, 67 kg, Heavy Duty, 3-5% Tolerance for Maximum Durability", "price": "19,811", "item_code": "32082"},
    {"title": "GBRU rain pipe 32 MM - 100 MTR ( 3.0 Kg )", "price": "960", "item_code": "27309"},
    {"title": "Tufaan 12x14 Spray Pump Double Motor  | 16 Liter", "price": "4,797", "item_code": "CM001"},
    {"title": "Gbru Cycle Kolape", "price": "1,930", "item_code": "24529"}
]

def clean_filename(name: str) -> str:
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace(" ", "_").replace("__", "_").lower().strip("_")
    return name[:50]

def clean_name(name: str) -> str:
    name = name.lower()
    name = re.sub(r'[^\w\s]', '', name)
    return " ".join(name.split())

def fetch_all_database_items():
    logger.info("Fetching all items from database across all brands and categories...")
    all_items = {}
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    
    # Fetch paginated pages with brand=None to get absolutely everything
    for page in range(1, 100):
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
                    item_code = item.get("item_code")
                    if item_code:
                        all_items[item_code] = item
                if len(items) < 100:
                    break
            else:
                logger.error(f"Failed to fetch page {page}: {response.status_code}")
                break
        except Exception as e:
            logger.error(f"Error on page {page}: {e}")
            break
            
    logger.info(f"Total retrieved unique database items: {len(all_items)}")
    return list(all_items.values())

def find_best_db_match(web_title, db_items):
    # Some special manual rules for items we know:
    wt_lower = web_title.lower()
    if "solar zatka machine" in wt_lower:
        # Check if there is an item with zatka/fence/energizer
        for item in db_items:
            name = item.get("item_name", "").lower()
            if "zatka" in name or "fence" in name or "energizer" in name:
                return item
    if "rotavator" in wt_lower:
        for item in db_items:
            name = item.get("item_name", "").lower()
            if "rotavator" in name:
                return item
    if "brush cutter" in wt_lower and "504" in wt_lower:
        for item in db_items:
            name = item.get("item_name", "").lower()
            if "brush cutter" in name:
                return item
    if "tufaan" in wt_lower:
        for item in db_items:
            name = item.get("item_name", "").lower()
            if "tufaan" in name and "12x14" in name:
                return item

    target_clean = clean_name(web_title)
    
    # Try exact match first
    for item in db_items:
        if clean_name(item.get("item_name", "")) == target_clean:
            return item
            
    # Try high overlap match
    target_words = set(target_clean.split())
    best_match = None
    best_overlap = 0
    
    for item in db_items:
        db_title = item.get("item_name", "")
        db_clean = clean_name(db_title)
        db_words = set(db_clean.split())
        
        intersection = target_words.intersection(db_words)
        if len(intersection) > best_overlap:
            best_overlap = len(intersection)
            best_match = item
            
    if best_overlap >= 2:
        return best_match
        
    return None

def fetch_item_details(item_code: str):
    url = f"{API_URL}/shoption_api.erp_api.Item_details.get_item_details"
    payload = {
        "page": 1,
        "page_size": 10,
        "item_code": item_code,
        "mobile_no": MOBILE_NO
    }
    try:
        response = httpx.post(url, headers=HEADERS, json=payload, timeout=20.0)
        if response.status_code == 200:
            return response.json().get("message", {})
        else:
            logger.error(f"Failed to fetch details for {item_code}: {response.status_code}")
            return {}
    except Exception as e:
        logger.error(f"Error fetching details for {item_code}: {e}")
        return {}

def format_doc(web_prod, db_item, details) -> str:
    title = web_prod["title"]
    web_price = web_prod["price"]
    
    if db_item:
        item_code = db_item.get("item_code", web_prod.get("item_code"))
        item_name = db_item.get("item_name", title)
    else:
        item_code = web_prod.get("item_code")
        item_name = title

    details_data = details.get("data", {}) if details else {}
    brand = details_data.get("brand", "GBRU")
    mrp = details_data.get("mrp") or db_item.get("mrp") if db_item else "N/A"
    price = details_data.get("price") or db_item.get("price") or web_price if db_item else web_price
    description = details_data.get("description", "").strip()
    description = re.sub('<[^<]+?>', '', description)
    
    payment_opts = details_data.get("payment_options", {})
    full_payment_str = ""
    booking_payment_str = ""
    
    if payment_opts:
        fp = payment_opts.get("full_payment", {})
        if fp:
            full_payment_str = (
                f"Full Payment:\n"
                f"- Pay Now: ₹{fp.get('pay_now', 'N/A')}\n"
                f"- Actual Price: ₹{fp.get('actual_price', 'N/A')}\n"
                f"- You Save: ₹{fp.get('you_save', 'N/A')}\n"
            )
            
        bp = payment_opts.get("booking_amount", {})
        if bp:
            booking_payment_str = (
                f"Booking Amount (Cash on Delivery / COD):\n"
                f"- Pay Now: ₹{bp.get('pay_now', 'N/A')}\n"
                f"- Actual Price: ₹{bp.get('actual_price', 'N/A')}\n"
                f"- Pay on Delivery (Remaining Amount): ₹{bp.get('pay_on_delivery', 'N/A')}\n"
            )

    specs = details_data.get("specifications", [])
    specs_str = ""
    if specs:
        specs_str = "specifications:\n"
        for spec in specs:
            label = spec.get("label", "").strip()
            val = spec.get("value", "").strip()
            if label and val:
                specs_str += f"- {label}: {val}\n"
            elif val:
                specs_str += f"- {val}\n"
                
    features = details_data.get("key_features", [])
    features_str = ""
    if features:
        features_str = "key features:\n"
        for feat in features:
            label = feat.get("label", "").strip()
            val = feat.get("value", "").strip()
            if label and val:
                features_str += f"- {label}: {val}\n"
            elif val:
                features_str += f"- {val}\n"

    # Assemble Document
    doc = f"{item_name}\n\n"
    doc += f"description:\n"
    doc += f"Brand: {brand}\n"
    doc += f"Item Code: {item_code}\n"
    doc += f"Price: ₹{price}\n"
    if mrp and mrp != "N/A":
        doc += f"MRP: ₹{mrp}\n"
    doc += "\n"
    
    if description:
        doc += f"{description}\n\n"
        
    if full_payment_str:
        doc += f"{full_payment_str}\n"
        
    if booking_payment_str:
        doc += f"{booking_payment_str}\n"
        
    if specs_str:
        doc += f"{specs_str}\n"
        
    if features_str:
        doc += f"{features_str}\n"
        
    return doc.strip()

def main():
    os.makedirs("knowledge_base", exist_ok=True)
    db_items = fetch_all_database_items()
    
    for index, web_prod in enumerate(WEB_PRODUCTS):
        title = web_prod["title"]
        logger.info(f"[{index+1}/{len(WEB_PRODUCTS)}] Matching: {title}...")
        
        db_match = find_best_db_match(title, db_items)
        details = {}
        if db_match:
            logger.info(f"  -> Found DB Match: {db_match.get('item_name')} ({db_match.get('item_code')})")
            details = fetch_item_details(db_match.get("item_code"))
        else:
            logger.warning(f"  -> NO DB Match found for: {title}")
            
        content = format_doc(web_prod, db_match, details)
        
        # Write to file
        filename = clean_filename(title) + ".txt"
        file_path = os.path.join("knowledge_base", filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info(f"  -> Saved file: {file_path}")

    logger.info("Done writing all knowledge base files!")

if __name__ == "__main__":
    main()
