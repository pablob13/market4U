module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { q, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    try {
        const url = `https://www.soriana.com/buscar?q=${encodeURIComponent(q.replace(/ /g, '+'))}`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36",
                "Accept-Language": "es-MX,es;q=0.9"
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Soriana fetch error' });
        }

        const html = await response.text();
        const results = [];
        
        // Debugging for Cloudflare blocks on Vercel Node Env
        if (html.includes('Cloudflare') || html.includes('captcha') || html.length < 5000) {
           return res.status(200).json({ results: [], total: 0, debug: html.substring(0, 500) });
        }
        
        // Parsing Soriana HTML structure
        const blocks = html.split('class="product-tile ');
        
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i];
            
            const pidMatch = block.match(/data-pid="([^"]+)"/);
            const pid = pidMatch ? pidMatch[1] : null;
            
            const nameMatch = block.match(/class="[^"]*link[^>]+>([^<]+)<\/a>/);
            const name = nameMatch ? nameMatch[1].trim() : null;
            
            const priceMatch = block.match(/class="[^"]*value[^"]*"\s+content="([0-9.]+)"/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : null;
            
            let img = null;
            const imgMatch = block.match(/class="[^"]*tile-image[^"]*"\s+src="([^"]+)"/);
            if (imgMatch) {
               img = imgMatch[1];
               if (img.includes('?')) img = img.split('?')[0];
            }
            
            const urlMatch = block.match(/href="([^"]+)"/);
            const link = urlMatch ? 'https://www.soriana.com' + urlMatch[1] : null;

            if (name && price && pid) {
                results.push({
                    id: 'sor_' + pid,
                    title: name,
                    price: price,
                    thumbnail: img || 'https://via.placeholder.com/150',
                    permalink: link,
                    free_shipping: false,
                    seller: 'Soriana',
                    brand: '',
                    category_id: ''
                });
            }

            if (results.length >= limit) break;
        }

        return res.status(200).json({ results, total: results.length });
    } catch (err) {
        console.error('[Soriana Scraper] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
