const fetchSoriana = async (q, limit, offset) => {
    try {
        const url = `https://www.soriana.com/buscar?q=${encodeURIComponent(q.replace(/ /g, '+'))}&sz=${limit}&start=${offset}`;
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
            const imgMatch = block.match(/class="[^"]*tile-image[^"]*"\s+src="([^"]+)"/);
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
            if (!price) continue;
            
            results.push({
                id: 'che_' + p.productId,
                title: p.productName,
                price: price,
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

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { q, limit = 48, offset = 0 } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    try {
        const [soriana, chedraui] = await Promise.all([
            fetchSoriana(q, Number(limit), Number(offset)),
            fetchChedraui(q, Number(limit), Number(offset))
        ]);

        const merged = [...soriana, ...chedraui];
        // Shuffle or alternate results so they are mixed
        // But for now, returning as is.

        return res.status(200).json({ results: merged, total: merged.length });
    } catch (err) {
        console.error('[Aggregator] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
