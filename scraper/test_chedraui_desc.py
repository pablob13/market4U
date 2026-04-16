import requests
import json

url = "https://www.chedraui.com.mx/api/catalog_system/pub/products/search/leche"
headers = {"User-Agent": "Mozilla/5.0"}
res = requests.get(url, headers=headers)
if res.status_code == 200:
    data = res.json()
    if len(data) > 0:
        p = data[0]
        print("Keys:", p.keys())
        print("Description:", p.get("description", "Not found"))
