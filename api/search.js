const CONFIG = require('../config.js');
const supabaseUrl = process.env.SUPABASE_URL || CONFIG.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY;

const fetchSoriana = async (q, limit, offset) => {
    try {
        const querySafe = encodeURIComponent(q).replace(/%20/g, '+');
        const url = `https://www.soriana.com/buscar?q=${querySafe}&sz=${limit}&start=${offset}`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept-Language": "es-MX,es;q=0.9"
            }
        });
        if (!response.ok) return [];

        const html = await response.text();
        const results = [];
        const blocks = html.split('class="product-tile ');
        
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i];
            const pidMatch = block.match(/data-pid="([^"]+)"/);
            const nameMatch = block.match(/class="[^"]*link[^>]+>([^<]+)<\/a>/);
            const priceMatch = block.match(/class="[^"]*value[^"]*"\s+content="([0-9.]+)"/);
            let img = null;
            const imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/class="[^"]*tile-image[^"]*"\s+src="([^"]+)"/);
            if (imgMatch) img = imgMatch[1].split('?')[0];
            const urlMatch = block.match(/href="([^"]+)"/);

            if (nameMatch && priceMatch && pidMatch) {
                results.push({
                    id: 'sor_' + pidMatch[1],
                    title: nameMatch[1].trim(),
                    price: parseFloat(priceMatch[1]),
                    thumbnail: img || 'https://via.placeholder.com/150',
                    permalink: urlMatch ? 'https://www.soriana.com' + urlMatch[1] : null,
                    free_shipping: false,
                    seller: 'Soriana',
                    brand: '',
                    category_id: ''
                });
            }
            if (results.length >= limit) break;
        }
        return results;
    } catch (err) {
        console.error('[Soriana]', err);
        return [];
    }
};

const fetchChedraui = async (q, limit, offset) => {
    try {
        const page = Math.floor(offset / limit) + 1;
        const url = `https://www.chedraui.com.mx/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(q)}&page=${page}&count=${limit}`;
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!response.ok) return [];

        const data = await response.json();
        const results = [];
        const productsList = data.products || [];

        for (const p of productsList) {
            const items = p.items || [];
            if (items.length === 0) continue;
            
            const sellers = items[0].sellers || [];
            if (sellers.length === 0) continue;
            
            const price = sellers[0].commertialOffer?.Price;
            const listPrice = sellers[0].commertialOffer?.ListPrice;
            const available = sellers[0].commertialOffer?.AvailableQuantity || 0;
            if (!price || available <= 0) continue;
            
            results.push({
                id: 'che_' + p.productId,
                title: p.productName,
                price: price,
                list_price: listPrice,
                thumbnail: (items[0].images?.[0]?.imageUrl) || 'https://via.placeholder.com/150',
                permalink: p.linkText ? `https://www.chedraui.com.mx/${p.linkText}/p` : null,
                free_shipping: false,
                seller: 'Chedraui',
                brand: p.brand || '',
                sku_id: items[0].itemId || '',
                category_id: ''
            });
            if (results.length >= limit) break;
        }
        return results;
    } catch (err) {
        console.error('[Chedraui]', err);
        return [];
    }
};

// ============================================
// LA COMER — vía Constructor.io Search API
// (key pública descubierta en el sitio oficial)
// Docs: https://docs.constructor.io/rest_api/
// ============================================
const fetchLaComer = async (q, limit, offset) => {
    try {
        const page = Math.floor(offset / limit) + 1;
        const url = `https://ac.cnstrc.com/search/${encodeURIComponent(q)}?key=key_jFyBbey5lPs8DCW4&num_results_per_page=${limit}&page=${page}`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; Market4U/2.0)"
            }
        });
        if (!response.ok) return [];

        const data = await response.json();
        const items = data.response?.results || [];
        const results = [];

        for (const item of items) {
            const d = item.data || {};
            const price = d.price || d.sale_price;
            if (!price) continue;

            // Construir permalink limpio con el ID del producto (EAN/barcode)
            const productId = d.id || '';
            const permalink = productId
                ? `https://www.lacomer.com.mx/lacomer/#!/detarticulo/${productId}/0/27/1///27`
                : 'https://www.lacomer.com.mx';

            results.push({
                id: 'lac_' + productId,
                title: d.description || item.value || '',
                price: parseFloat(price),
                thumbnail: d.image_url || 'https://via.placeholder.com/150',
                permalink,
                free_shipping: false,
                seller: 'La Comer',
                brand: d.brand || '',
                category_id: ''
            });
            if (results.length >= limit) break;
        }
        return results;
    } catch (err) {
        console.error('[La Comer]', err);
        return [];
    }
};

const fetchHeb = async (q, limit, offset) => {
    try {
        const page = Math.floor(offset / limit) + 1;
        const url = `https://www.heb.com.mx/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(q)}&page=${page}&count=${limit}`;
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!response.ok) return [];

        const data = await response.json();
        const results = [];
        const productsList = data.products || [];

        for (const p of productsList) {
            const items = p.items || [];
            if (items.length === 0) continue;
            
            const sellers = items[0].sellers || [];
            if (sellers.length === 0) continue;
            
            const price = sellers[0].commertialOffer?.Price;
            const listPrice = sellers[0].commertialOffer?.ListPrice;
            const available = sellers[0].commertialOffer?.AvailableQuantity || 0;
            if (!price || available <= 0) continue;
            
            results.push({
                id: 'heb_' + p.productId,
                title: p.productName,
                price: price,
                list_price: listPrice,
                thumbnail: (items[0].images?.[0]?.imageUrl) || 'https://via.placeholder.com/150',
                permalink: p.linkText ? `https://www.heb.com.mx/${p.linkText}/p` : null,
                free_shipping: false,
                seller: 'HEB',
                brand: p.brand || '',
                sku_id: items[0].itemId || '',
                category_id: ''
            });
            if (results.length >= limit) break;
        }
        return results;
    } catch (err) {
        console.error('[HEB]', err);
        return [];
    }
};

const fetchCityMarket = async (q, limit, offset) => {
    try {
        // City Market comparte la misma infraestructura y API key (Constructor.io) que La Comer
        const results = await fetchLaComer(q, limit, offset);
        return results.map(r => ({
            ...r,
            id: r.id.replace('lac_', 'cm_'),
            seller: 'City Market',
            permalink: r.permalink.replace('lacomer', 'citymarket') // Intento de adaptar el link
        }));
    } catch (err) {
        console.error('[City Market]', err);
        return [];
    }
};

// FRESKO — Vía La Comer (Reutilizamos la API porque comparten infraestructura)
const fetchFresko = async (q, limit, offset) => {
    try {
        const lacomerResults = await fetchLaComer(q, limit, offset);
        return lacomerResults.map(p => ({
            ...p,
            id: p.id.replace('lac_', 'fre_'),
            seller: 'Fresko',
            permalink: p.permalink.replace('/lacomer/', '/fresko/')
        }));
    } catch (e) {
        return [];
    }
};

// JÜSTO — Vía GraphQL
const fetchJusto = async (q, limit, offset) => {
    try {
        const query = `
        {
          products(first: ${limit}, filter: { search: "${q}" }) {
            edges {
              node {
                id
                name
                thumbnail { url }
                pricing { priceRange { start { net { amount } } } }
              }
            }
          }
        }`;
        
        const response = await fetch("https://api.justo.mx/graphql/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await response.json();
        const edges = data?.data?.products?.edges || [];
        
        return edges.map(edge => {
            const p = edge.node;
            return {
                id: 'jus_' + p.id.replace(/=/g, ''),
                title: p.name,
                price: p.pricing?.priceRange?.start?.net?.amount || 0,
                thumbnail: p.thumbnail?.url || 'https://via.placeholder.com/150',
                permalink: `https://justo.mx/search?q=${encodeURIComponent(q)}`,
                free_shipping: false,
                seller: 'Jüsto',
                brand: '',
                category_id: ''
            };
        }).filter(p => p.price > 0);
    } catch (e) {
        console.error('Justo error:', e);
        return [];
    }
};

const saveProductsToSupabase = async (products) => {
    if (!supabaseUrl || !supabaseAnonKey || products.length === 0) return;
    
    try {
        // Prepare products payload for bulk upsert
        // Table: products (ml_id, title, category, image_url, brand)
        const productsPayload = products.map(p => ({
            ml_id: p.id,
            title: p.title,
            image_url: p.thumbnail || null,
            brand: p.brand || null,
            category: 'Supermercado'
        }));

        // Bulk upsert to Supabase
        const upsertRes = await fetch(`${supabaseUrl}/rest/v1/products`, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates, return=representation'
            },
            body: JSON.stringify(productsPayload)
        });

        if (!upsertRes.ok) {
            const errBody = await upsertRes.text();
            console.warn('[Supabase Sync] Products upsert failed:', upsertRes.status, errBody);
            return;
        }

        const upsertedData = await upsertRes.json();
        if (!Array.isArray(upsertedData) || upsertedData.length === 0) return;

        // Map ml_id to database generated UUID
        const uuidMap = new Map();
        for (const row of upsertedData) {
            uuidMap.set(row.ml_id, row.id);
        }

        // Prepare price history payload for bulk insert
        const historyPayload = [];
        for (const p of products) {
            const productUuid = uuidMap.get(p.id);
            if (!productUuid) continue;

            let storeId = p.seller.toLowerCase().replace(/\s+/g, '');
            // Map store display names to database store IDs
            if (storeId === 'lacomer') storeId = 'lacomer';
            else if (storeId === 'citymarket') storeId = 'citymarket';
            else if (storeId === 'fresko') storeId = 'fresko';
            else if (storeId === 'soriana') storeId = 'soriana';
            else if (storeId === 'chedraui') storeId = 'chedraui';
            else if (storeId === 'heb') storeId = 'heb';
            else if (storeId === 'justo') storeId = 'justo';

            historyPayload.push({
                product_id: productUuid,
                store_id: storeId,
                price: p.price,
                shipping: 0,
                in_stock: true,
                source_url: p.permalink || null
            });
        }

        if (historyPayload.length === 0) return;

        // Bulk insert price history
        const historyRes = await fetch(`${supabaseUrl}/rest/v1/price_history`, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyPayload)
        });

        if (!historyRes.ok) {
            const errBody = await historyRes.text();
            console.warn('[Supabase Sync] Price history insert failed:', historyRes.status, errBody);
        } else {
            console.log(`[Supabase Sync] Successfully saved ${upsertedData.length} products and ${historyPayload.length} price entries.`);
        }

    } catch (err) {
        console.warn('[Supabase Sync] Error during saving products:', err.message);
    }
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { q, limit = 48, offset = 0, city = 'default' } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    // TODO: Implementar mapeo de ciudades a "Sales Channels (sc)" para VTEX y "sucursales" para Constructor.io
    // Ejemplo (no implementado por falta de catálogos exactos):
    // const cityMap = { 'cdmx': { chedrauiSC: '1', hebSC: '1', lacomerId: '27' }, 'mty': { ... } }
    // if (city !== 'default') { apply_regional_filters... }

    try {
        // Ejecutar todos los scrapers en paralelo para máxima velocidad
        const [soriana, chedraui, heb, lacomer, citymarket, fresko, justo] = await Promise.all([
            fetchSoriana(q, Number(limit), Number(offset)),
            fetchChedraui(q, Number(limit), Number(offset)),
            fetchHeb(q, Number(limit), Number(offset)),
            fetchLaComer(q, Number(limit), Number(offset)),
            fetchCityMarket(q, Number(limit), Number(offset)),
            fetchFresko(q, Number(limit), Number(offset)),
            fetchJusto(q, Number(limit), Number(offset))
        ]);

        // Intercalar resultados por tienda para mejor UX (no todos los de una tienda juntos)
        const merged = [];
        const sources = [soriana, chedraui, heb, lacomer, citymarket, fresko, justo];
        const maxLen = Math.max(...sources.map(s => s.length));
        for (let i = 0; i < maxLen; i++) {
            for (const source of sources) {
                if (source[i]) merged.push(source[i]);
            }
        }

        // Guardar los productos recolectados en Supabase
        if (merged.length > 0) {
            try {
                await saveProductsToSupabase(merged);
            } catch (saveErr) {
                console.error('[Supabase Sync] Error during saveProductsToSupabase execution:', saveErr);
            }
        }

        return res.status(200).json({
            results: merged,
            total: merged.length,
            breakdown: {
                soriana: soriana.length,
                chedraui: chedraui.length,
                heb: heb.length,
                lacomer: lacomer.length,
                citymarket: citymarket.length,
                fresko: fresko.length,
                justo: justo.length
            }
        });
    } catch (err) {
        console.error('[Aggregator] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
