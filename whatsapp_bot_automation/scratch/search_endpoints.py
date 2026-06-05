import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Find all endpoints matching Prabhat_URL
matches = [m.start() for m in re.finditer("Prabhat_URL", content)]
print(f"Found matches for 'Prabhat_URL' at indices: {matches}")

for idx in matches:
    start = max(0, idx - 100)
    end = min(len(content), idx + 400)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
