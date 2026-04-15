import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. Manejo de CORS (Preflight)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const urlObj = new URL(req.url);
        const query = urlObj.searchParams.get('q');
        const limitStr = urlObj.searchParams.get('limit') || '20';
        const limit = parseInt(limitStr, 10);

        if (!query) {
            return new Response(JSON.stringify({ error: 'Falta parámetro q' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Búsqueda directa en el listado HTML de Mercado Libre (Bypassing APIs bloqueadas)
        const mlUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(query.replace(/ /g, '-'))}`;
        
        const response = await fetch(mlUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Accept-Language": "es-MX,es;q=0.9"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extraer Data estucturada LD+JSON (schema.org/Product)
        const ldJsonMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
        
        if (!ldJsonMatch) {
            console.log('No LD+JSON found, fallback to empty array');
            return new Response(JSON.stringify({ results: [], total: 0, source: "html_scrape" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const ldData = JSON.parse(ldJsonMatch[1]);
        const graph = ldData['@graph'] || [];
        
        const results = [];
        
        for (const item of graph) {
            if (item['@type'] !== 'Product') continue;
            
            // Generate deterministic ID from URL if possible
            const urlMatch = item.offers?.url?.match(/MLM-?(\d+)/) || item.offers?.url?.match(/p\/(MLM\d+)/);
            const rawId = urlMatch ? (urlMatch[1].startsWith('MLM') ? urlMatch[1] : `MLM${urlMatch[1]}`) : `scraped_${Math.floor(Math.random()*1000000)}`;

            results.push({
                id: rawId,
                title: item.name || '',
                price: item.offers?.price ? parseFloat(item.offers.price) : null,
                permalink: item.offers?.url || '',
                thumbnail: item.image || '',
                shipping: { free_shipping: false } // No podemos sacarlo confiablemente de ld+json
            });

            if (results.length >= limit) break;
        }

        return new Response(
            JSON.stringify({
                results: results,
                total: results.length,
                source: "html_scrape"
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('[ML HTML Scrape] Error local:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
