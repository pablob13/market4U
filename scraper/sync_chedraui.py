import requests
import json
import os
import re
import math
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno secretas
load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ ERROR: Faltan credenciales. Revisa tu archivo backend/.env")
    exit(1)

supabase: Client = create_client(url, key)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

import unicodedata

def generate_canonical_key(title="", brand=""):
    safe_title = str(title or "").strip()
    safe_brand = str(brand or "").strip()
    
    # normalize and remove accents
    clean = unicodedata.normalize('NFD', safe_title.lower())
    clean = "".join([c for c in clean if not unicodedata.combining(c)])
    
    # remove special characters except spaces and numbers
    clean = re.sub(r'[^a-z0-9\s]', '', clean)
    
    size_regex = re.compile(r'([0-9.,]+)\s*(ml|l|lt|g|kg|grs|gr|mg|oz|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas)', re.IGNORECASE)
    size_match = size_regex.search(clean)
    size = ""
    if size_match:
        size = size_match.group(0).replace(" ", "").replace("lt", "l")
        
    text = clean
    if size_match:
        text = text.replace(size_match.group(0), "")
        
    stop_words = {'de', 'con', 'para', 'en', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'al', 'del'}
    tokens = [t.strip() for t in re.split(r'\s+', text) if t.strip()]
    tokens = [t for t in tokens if len(t) > 2 and t not in stop_words]
    tokens.sort()
    
    base = "-".join(tokens)
    brand_prefix = ""
    if safe_brand:
        brand_clean = re.sub(r'[^a-z0-9]', '', safe_brand.lower())
        if brand_clean:
            brand_prefix = brand_clean + "-"
            
    key = f"{brand_prefix}{base}"
    if size:
        key = f"{key}-{size}"
        
    key = re.sub(r'-+', '-', key).strip('-')
    
    return key[:100] if key else "producto-general"

def clean_html(raw_html):
    if not raw_html: return ""
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleantext = re.sub(cleanr, '', str(raw_html))
    return cleantext.strip()

def scrape_chedraui(query, limit=20):
    print(f"🚀 Buscando '{query}' en Chedraui (Extracción Oculta)...")
    fetch_url = f"https://www.chedraui.com.mx/api/catalog_system/pub/products/search/{query.replace(' ', '-')}"
    
    res = requests.get(fetch_url, headers=headers)
    if res.status_code not in [200, 206]:
        print(f"❌ Error contactando API Chedraui: {res.status_code}")
        return

    data = res.json()
    count = 0

    for p in data:
        if count >= limit: break
            
        pid = p.get('productId')
        name = p.get('productName')
        desc_html = p.get('description', '')
        desc_clean = clean_html(desc_html)
        brand = p.get('brand', 'Chedraui')
        
        items = p.get('items', [])
        if not items: continue
            
        images = items[0].get('images', [])
        img = images[0].get('imageUrl') if images else 'https://via.placeholder.com/150'
        
        sellers = items[0].get('sellers', [])
        if not sellers: continue
            
        offer = sellers[0].get('commertialOffer', {})
        price = offer.get('Price')
        
        if not price or math.isnan(price) or price <= 0: continue
            
        permalink = f"https://www.chedraui.com.mx/p/{p.get('linkText')}-{pid}"

        # 1. Guardar en Catálogo Central (products)
        canonical_key = generate_canonical_key(name, brand)
        product_data = {
            "ml_id": canonical_key,
            "title": name,
            "description": desc_clean if desc_clean else f"{name} de {brand}",
            "image_url": img,
            "brand": brand,
            "category": "Supermercado"
        }
        
        try:
            # Upsert basándose en ml_id
            product_res = supabase.table('products').upsert(
                product_data, 
                on_conflict="ml_id"
            ).execute()
            
            db_id = product_res.data[0]['id']
            
            # 2. Guardar en Historial de Precios
            price_data = {
                "product_id": db_id,
                "store_id": "chedraui",
                "price": price,
                "shipping": 0,
                "in_stock": True,
                "source_url": permalink
            }
            supabase.table('price_history').insert(price_data).execute()
            
            print(f"✅ Inyectado: {name} (${price}) -> Descripción extraída.")
            count += 1
            
        except Exception as e:
            print(f"⚠️ Omisión ({name}): {str(e)}")

if __name__ == "__main__":
    import sys
    search_term = sys.argv[1] if len(sys.argv) > 1 else 'leche'
    scrape_chedraui(search_term, 20)
