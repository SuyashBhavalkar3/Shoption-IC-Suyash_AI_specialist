import httpx
import re

url = "https://gbru.shoption.in/assets/index.0e502a8c.js"
content = httpx.get(url, timeout=30.0).text

idx = content.find("GBRU Spraying Drone - AgriVeer")
if idx != -1:
    sub = content[idx-10000:idx]
    array_start_offset = sub.rfind("[{id:1,")
    if array_start_offset != -1:
        array_start = idx - 10000 + array_start_offset
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
            # Print a portion of the raw string to see the properties of the objects
            print("First 2000 chars of the array:")
            print(array_str[:2000])
