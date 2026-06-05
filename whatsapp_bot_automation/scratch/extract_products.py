import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
resp = httpx.get(url, timeout=30.0)
content = resp.text
print(f"Loaded JS bundle of size: {len(content)} characters.")

# Look for patterns like "Price" or product names in the JS bundle
# Let's search for "GBRU Spraying Drone" or "Price:"
matches = [m.start() for m in re.finditer("AgriVeer", content)]
print(f"Found matches for 'AgriVeer' at indices: {matches}")

for idx in matches[:5]:
    start = max(0, idx - 500)
    end = min(len(content), idx + 2000)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
