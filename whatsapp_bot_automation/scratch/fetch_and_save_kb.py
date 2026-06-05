import os
import re
import httpx
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Constants
API_URL = "https://proderp.gbru.in/api/method"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-KEY": "SHOPTION_XYZ_9834SDJKS",
    "X-API-SECRET": "SHOPTION_SECRET_99ASD9A8S9D"
}
MOBILE_NO = "9174611987"

def clean_filename(name: str) -> str:
    """
    Cleans a string to make it a valid filename.
    """
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace(" ", "_").replace("__", "_").lower().strip("_")
    return name[:50]

def fetch_all_items():
    """
    Fetches the list of all items from the ERPNext backend.
    """
    url = f"{API_URL}/shoption_api.erp_api.item_api.get_items"
    # Load all products by setting page_size to 2000
    payload = {
        "category": "1",
        "subcategory": None,
        "brand": "175",
        "page": 1,
        "page_size": 2000,
        "mobile_no": MOBILE_NO
    }
    
    logger.info("Fetching all items from the live ERPNext database...")
    response = httpx.post(url, headers=HEADERS, json=payload, timeout=30.0)
    response.raise_for_status()
    data = response.json()
    
    items = data.get("message", {}).get("data", {}).get("data", [])
    logger.info(f"Retrieved {len(items)} items from database.")
    return items

def fetch_item_details(item_code: str):
    """
    Fetches the detailed specifications, pricing options, and description for a specific item.
    """
    url = f"{API_URL}/shoption_api.erp_api.Item_details.get_item_details"
    payload = {
        "page": 1,
        "page_size": 10,
        "item_code": item_code,
        "mobile_no": MOBILE_NO
    }
    
    try:
        response = httpx.post(url, headers=HEADERS, json=payload, timeout=30.0)
        response.raise_for_status()
        return response.json().get("message", {})
    except Exception as e:
        logger.error(f"Failed to fetch details for {item_code}: {e}")
        return {}

def format_product_content(item, details) -> str:
    """
    Formats product specifications, pricing, and description into a structured text document.
    """
    name = item.get("item_name", "Product Name").strip()
    code = item.get("item_code", "N/A")
    mrp = item.get("mrp", "N/A")
    price = item.get("price", "N/A")
    
    # Extract details metadata
    details_data = details.get("data", {})
    brand = details_data.get("brand", "Gbru")
    item_group = details_data.get("item_group", "General")
    
    # Description
    description = details_data.get("description", "").strip()
    # Strip HTML tags if present in description
    description = re.sub('<[^<]+?>', '', description)
    
    # Payment Options
    payment_opts = details_data.get("payment_options", {})
    full_payment_str = ""
    booking_payment_str = ""
    
    if payment_opts:
        # Full payment
        fp = payment_opts.get("full_payment", {})
        if fp:
            full_payment_str = (
                f"Full Payment:\n"
                f"- Pay Now: ₹{fp.get('pay_now', 'N/A')}\n"
                f"- Actual Price: ₹{fp.get('actual_price', 'N/A')}\n"
                f"- You Save: ₹{fp.get('you_save', 'N/A')}\n"
            )
            
        # Booking/COD payment
        bp = payment_opts.get("booking_amount", {})
        if bp:
            booking_payment_str = (
                f"Booking Amount (Cash on Delivery):\n"
                f"- Pay Now: ₹{bp.get('pay_now', 'N/A')}\n"
                f"- Actual Price: ₹{bp.get('actual_price', 'N/A')}\n"
                f"- Pay on Delivery: ₹{bp.get('pay_on_delivery', 'N/A')}\n"
            )

    # Specifications
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
                
    # Key features
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
    doc = f"{name}\n\n"
    doc += f"description:\n"
    doc += f"Brand: {brand}\n"
    doc += f"Item Code: {code}\n"
    doc += f"Base Price: ₹{price}\n"
    doc += f"MRP: ₹{mrp}\n\n"
    
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
    
    try:
        items = fetch_all_items()
    except Exception as e:
        logger.error(f"Error fetching product list: {e}")
        return
        
    for index, item in enumerate(items):
        item_code = item.get("item_code")
        item_name = item.get("item_name", f"Product_{index}")
        
        logger.info(f"[{index+1}/{len(items)}] Fetching details for: {item_name} ({item_code})...")
        details = fetch_item_details(item_code)
        
        content = format_product_content(item, details)
        
        # Save as text file
        filename = clean_filename(item_name) + ".txt"
        file_path = os.path.join("knowledge_base", filename)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info(f"Saved: {file_path}")

    logger.info("Knowledge base files successfully fetched and saved!")

if __name__ == "__main__":
    main()
