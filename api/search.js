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
        const toIndex = offset + limit - 1;
        const url = `https://www.chedraui.com.mx/api/catalog_system/pub/products/search/${encodeURIComponent(q.replace(/ /g, '-'))}?_from=${offset}&_to=${toIndex}`;
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!response.ok) return [];

        const data = await response.json();
        const results = [];

        for (const p of data) {
            const items = p.items || [];
            if (items.length === 0) continue;
            
            const sellers = items[0].sellers || [];
            if (sellers.length === 0) continue;
            
            const price = sellers[0].commertialOffer?.Price;
            const listPrice = sellers[0].commertialOffer?.ListPrice;
            if (!price) continue;
            
            results.push({
                id: 'che_' + p.productId,
                title: p.productName,
                price: price,
                list_price: listPrice,
                thumbnail: (items[0].images?.[0]?.imageUrl) || 'https://via.placeholder.com/150',
                permalink: p.linkText ? `https://www.chedraui.com.mx/p/${p.linkText}-${p.productId}` : null,
                free_shipping: false,
                seller: 'Chedraui',
                brand: p.brand || '',
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
        const toIndex = offset + limit - 1;
        const url = `https://www.heb.com.mx/api/catalog_system/pub/products/search/${encodeURIComponent(q.replace(/ /g, '-'))}?_from=${offset}&_to=${toIndex}`;
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!response.ok) return [];

        const data = await response.json();
        const results = [];

        for (const p of data) {
            const items = p.items || [];
            if (items.length === 0) continue;
            
            const sellers = items[0].sellers || [];
            if (sellers.length === 0) continue;
            
            const price = sellers[0].commertialOffer?.Price;
            const listPrice = sellers[0].commertialOffer?.ListPrice;
            if (!price) continue;
            
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

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { q, limit = 48, offset = 0 } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    try {
        // Ejecutar todos los scrapers en paralelo para máxima velocidad
        const [soriana, chedraui, heb, lacomer] = await Promise.all([
            fetchSoriana(q, Number(limit), Number(offset)),
            fetchChedraui(q, Number(limit), Number(offset)),
            fetchHeb(q, Number(limit), Number(offset)),
            fetchLaComer(q, Number(limit), Number(offset))
        ]);

        // Intercalar resultados por tienda para mejor UX (no todos los de una tienda juntos)
        const merged = [];
        const sources = [soriana, chedraui, heb, lacomer];
        const maxLen = Math.max(...sources.map(s => s.length));
        for (let i = 0; i < maxLen; i++) {
            for (const source of sources) {
                if (source[i]) merged.push(source[i]);
            }
        }

        return res.status(200).json({
            results: merged,
            total: merged.length,
            breakdown: {
                soriana: soriana.length,
                chedraui: chedraui.length,
                heb: heb.length,
                lacomer: lacomer.length
            }
        });
    } catch (err) {
        console.error('[Aggregator] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
