import sys
import re
import json

body = sys.stdin.read()

# Buscar bloques JSON que tienen tanto precio como titulo juntos
# ML embeds product data in a specific pattern in their HTML
# Look for the main product grid data

# Pattern: find JSON objects with both price and title
# In ML's HTML, products are usually in a list/results structure

# Strategy: find all script tags and look for ones with product arrays
scripts = re.findall(r'<script[^>]*>(.*?)</script>', body, re.DOTALL)
print(f'Total scripts: {len(scripts)}')

found_products = []

for i, script in enumerate(scripts):
    # Look for scripts with price AND title AND MLM ID structure
    if '"value"' in script and '"title"' in script and 'MLM' in script and len(script) > 1000:
        # Try to find JSON arrays or objects with product data
        # Look for the pattern used by ML for their product cards
        
        # Try: window.__initialProps or similar
        match = re.search(r'"results"\s*:\s*\[(.*?)\]\s*,\s*"(?:paging|filters)"', script, re.DOTALL)
        if match:
            print(f'Script {i}: Found results array! Length: {len(match.group(1))}')
            # Try to parse a few items
            items_raw = '[' + match.group(1) + ']'
            try:
                items = json.loads(items_raw)
                print(f'  Parsed {len(items)} items')
                for item in items[:3]:
                    print(f'  - {item.get("title","?")[:50]} | ${item.get("price",0):,.2f}')
                found_products = items
                break
            except Exception as e:
                print(f'  Parse error: {e}')
                # Show around prices
                price_ctx = re.findall(r'(?:"title":"[^"]{5,60}".{0,200}"value":\d+)', script)
                if price_ctx:
                    print(f'  Title+Price contexts: {len(price_ctx)}')
                    print(f'  Sample: {price_ctx[0][:200]}')
                    break

if not found_products:
    # Alternative: find the price objects and their surrounding context (50 chars before)
    price_contexts = re.finditer(r'(.{0,300})"value"\s*:\s*(\d+)\s*,"decimal_value"\s*:\s*"(\d+)"\s*,"currency_id"\s*:\s*"MXN"', body)
    
    seen_prices = []
    for match in price_contexts:
        prefix = match.group(1)
        price_int = int(match.group(2))
        price_dec = match.group(3)
        price = float(f'{price_int}.{price_dec}')
        
        # Try to find title in prefix
        title_match = re.search(r'"(?:title|name|label)"\s*:\s*"([^"]{10,80})"', prefix)
        id_match = re.search(r'"id"\s*:\s*"(MLM\d+)"', prefix)
        
        if title_match and price not in seen_prices:
            seen_prices.append(price)
            print(f'PRODUCT: {title_match.group(1)[:55]}')
            print(f'  Price: ${price:,.2f} MXN')
            if id_match:
                print(f'  ID: {id_match.group(1)}')
            if len(seen_prices) >= 8:
                break

print(f'\nTotal unique price contexts found: {len(seen_prices)}')
