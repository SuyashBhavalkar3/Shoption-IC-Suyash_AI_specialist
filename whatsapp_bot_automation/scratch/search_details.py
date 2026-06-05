import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Search for Booking Amount or Full Payment
matches = [m.start() for m in re.finditer("Booking Amount", content, re.IGNORECASE)]
print(f"Found matches for 'Booking Amount' at indices: {matches}")

for idx in matches[:5]:
    start = max(0, idx - 300)
    end = min(len(content), idx + 1500)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
