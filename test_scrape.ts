import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function handler(req: Request) {
    const url = "https://listado.mercadolibre.com.mx/coca";
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const html = await response.text();
        const priceCount = (html.match(/"price":\{"value":/g) || []).length;
        
        return new Response(JSON.stringify({
            status: response.status,
            pricesFound: priceCount,
            blocked: html.includes("captcha")
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
serve(handler);
