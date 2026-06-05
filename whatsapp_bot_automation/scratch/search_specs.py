import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Let's search for "description" inside product objects or similar
# e.g., look for "specification" or "specifications"
matches = [m.start() for m in re.finditer("specifications", content, re.IGNORECASE)]
print(f"Found matches for 'specifications' at indices: {matches}")

for idx in matches[:5]:
    start = max(0, idx - 200)
    end = min(len(content), idx + 1000)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
