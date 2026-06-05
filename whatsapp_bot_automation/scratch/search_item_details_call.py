import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Search for get_item_details
matches = [m.start() for m in re.finditer("get_item_details", content)]
print(f"Found matches for 'get_item_details': {matches}")

for idx in matches:
    start = max(0, idx - 200)
    end = min(len(content), idx + 800)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
