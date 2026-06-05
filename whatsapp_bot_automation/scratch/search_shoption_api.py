import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Search for shoption_api methods
matches = [m.start() for m in re.finditer("shoption_api\\.", content)]
print(f"Found matches for 'shoption_api.': {len(matches)}")

seen = set()
for idx in matches:
    start = idx
    end = min(len(content), idx + 200)
    # Find the full API method path
    snippet = content[start:end]
    match = re.search(r'shoption_api\.[a-zA-Z0-9_\.]+', snippet)
    if match:
        method = match.group(0)
        if method not in seen:
            seen.add(method)
            print(f"Method: {method}")
