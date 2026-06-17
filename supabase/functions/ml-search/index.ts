import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    try {
        const query = new URL(req.url).searchParams.get('q');
        const mlUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(query.replace(/ /g, '-'))}`;
        const response = await fetch(mlUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" }
        });
        const html = await response.text();
        const snippet = html.substring(0, 500);
        return new Response(JSON.stringify({ 
            htmlLength: html.length, 
            hasLd: html.includes("application/ld+json"),
            snippet: snippet
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }));
    }
});
