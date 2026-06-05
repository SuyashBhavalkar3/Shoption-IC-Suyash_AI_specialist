import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Search for fetch, axios, or endpoints
# Let's search for typical endpoint prefixes or fetch calls
matches = [m.start() for m in re.finditer("fetch\\(", content)]
print(f"Found matches for 'fetch(': {matches}")

for idx in matches[:5]:
    start = max(0, idx - 100)
    end = min(len(content), idx + 500)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])

# Also search for "axios"
matches_axios = [m.start() for m in re.finditer("axios", content)]
print(f"Found matches for 'axios': {matches_axios}")
for idx in matches_axios[:5]:
    start = max(0, idx - 100)
    end = min(len(content), idx + 500)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
