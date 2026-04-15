// api/search.js — Vercel Serverless Function (CommonJS)
// Proxy para la API de Mercado Libre
// Las credenciales están en Vercel Environment Variables (no en el código)

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { q, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    // Las credenciales vienen de Vercel Environment Variables
    const CLIENT_ID     = process.env.ML_CLIENT_ID;
    const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

    try {
        // 1. Obtener token fresco
        const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return res.status(500).json({ error: 'No se pudo obtener token de ML' });
        }

        // 2. Buscar en ML
        const searchUrl = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=${limit}`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const searchData = await searchRes.json();

        if (!searchRes.ok) {
            return res.status(searchRes.status).json({ error: searchData.message || 'ML API error' });
        }

        // 3. Devolver solo lo que necesitamos (más liviano)
        const results = (searchData.results || []).map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            thumbnail: item.thumbnail?.replace('-I.jpg', '-O.jpg'),
            permalink: item.permalink,
            free_shipping: item.shipping?.free_shipping || false,
            seller: item.seller?.nickname || '',
            brand: item.attributes?.find(a => a.id === 'BRAND')?.value_name || '',
            category_id: item.category_id
        }));

        return res.status(200).json({ results, total: searchData.paging?.total || 0 });

    } catch (err) {
        console.error('[ML Proxy] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
