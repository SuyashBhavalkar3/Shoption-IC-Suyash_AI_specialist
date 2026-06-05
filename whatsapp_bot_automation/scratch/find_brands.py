import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
content = httpx.get(url, timeout=30.0).text

matches = [m.start() for m in re.finditer("brand:", content)]
for idx in matches:
    start = max(0, idx - 100)
    end = min(len(content), idx + 200)
    print(f"\n--- Snippet around index {idx} ---")
    print(content[start:end])
