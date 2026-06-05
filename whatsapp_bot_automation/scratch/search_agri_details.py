import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Let's search for "GBRU Spraying Drone" or "description:" or similar
# Let's search for "specifications" and check if it's an array for AgriVeer or others
# We can search for the term "description:" near product titles
matches = [m.start() for m in re.finditer("GBRU Spraying Drone", content)]
for idx in matches:
    start = max(0, idx - 100)
    end = min(len(content), idx + 1500)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
