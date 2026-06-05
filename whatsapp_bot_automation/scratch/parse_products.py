import httpx
import re
import json

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
print("Fetching JS bundle...")
content = httpx.get(url, timeout=30.0).text

# Find the array of products
# We know GBRU Spraying Drone is id:9. Let's find where the array starts (usually with [{id:1,...)
# Let's search backwards from the AgriVeer match to find the opening bracket of the list
idx = content.find("GBRU Spraying Drone - AgriVeer")
if idx != -1:
    # Look for the start of the array (bracket '[') up to 10000 characters back
    sub = content[idx-10000:idx]
    array_start_offset = sub.rfind("[{id:1,")
    if array_start_offset != -1:
        array_start = idx - 10000 + array_start_offset
        # Find the matching closing bracket ']'
        bracket_count = 0
        array_end = -1
        for i in range(array_start, len(content)):
            if content[i] == '[':
                bracket_count += 1
            elif content[i] == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    array_end = i + 1
                    break
        
        if array_end != -1:
            array_str = content[array_start:array_end]
            print("Extracted Array String length:", len(array_str))
            # Let's clean it up slightly and print the items
            # Since it's raw JS, we can use regex to find all titles and prices
            items = re.findall(r'\{id:\d+,title:"([^"]+)",tagline:"[^"]*",price:"([^"]+)"', array_str)
            print(f"Parsed {len(items)} items:")
            for item in items:
                print(f"Title: {item[0].strip()} | Price: {item[1].strip()}")
        else:
            print("Could not find end of array")
    else:
        print("Could not find start of array")
else:
    print("Could not find AgriVeer")
