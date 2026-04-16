const fetchChedraui = async (q, limit) => {
    try {
        const url = `https://www.chedraui.com.mx/api/catalog_system/pub/products/search/${encodeURIComponent(q.replace(/ /g, '-'))}`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        const results = [];

        for (const p of data) {
            const name = p.productName;
            const pid = p.productId;
            
            const items = p.items || [];
            if (items.length === 0) continue;
            
            const images = items[0].images || [];
            const img = images.length > 0 ? images[0].imageUrl : null;
            
            const sellers = items[0].sellers || [];
            if (sellers.length === 0) continue;
            
            const commertialOffer = sellers[0].commertialOffer || {};
            const price = commertialOffer.Price;
            if (!price) continue;
            
            const link = p.linkText ? `https://www.chedraui.com.mx/p/${p.linkText}-${pid}` : null;

            results.push({
                id: 'che_' + pid,
                title: name,
                price: price,
                thumbnail: img || 'https://via.placeholder.com/150',
                permalink: link,
                free_shipping: false,
                seller: 'Chedraui',
                brand: p.brand || '',
                category_id: ''
            });

            if (results.length >= limit) break;
        }
        return results;
    } catch (err) {
        console.error('Chedraui Error', err);
        return [];
    }
};

fetchChedraui('coca', 2).then(res => console.log(JSON.stringify(res, null, 2)));
