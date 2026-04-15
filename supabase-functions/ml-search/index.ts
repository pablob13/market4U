// Supabase Edge Function: ml-search v7 (Catalog Multi-Query)
// Usa ML Products Catalog API con múltiples variantes de query para más cobertura.
// El Items Search API (/sites/MLM/search) está geo-bloqueado desde IPs no-mexicanas.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getMLToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const staticToken = Deno.env.get("ML_ACCESS_TOKEN");
  if (staticToken) {
    cachedToken = staticToken;
    tokenExpiresAt = Date.now() + 5.5 * 60 * 60 * 1000;
    return cachedToken;
  }

  try {
    const clientId     = Deno.env.get("ML_CLIENT_ID")     ?? "";
    const clientSecret = Deno.env.get("ML_CLIENT_SECRET") ?? "";
    if (clientId && clientSecret) {
      const res = await fetch("https://api.mercadolibre.com/oauth/token", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        signal:  AbortSignal.timeout(6000),
      });
      const data = await res.json();
      if (data.access_token) {
        cachedToken    = data.access_token;
        tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
        return cachedToken;
      }
    }
  } catch (_) { /* ignorar */ }

  return null;
}

function buildQueryVariants(q: string, limit: number): { query: string; perQuery: number }[] {
  const base = q.trim().toLowerCase();
  const words = base.split(/\s+/).filter(w => w.length > 2);
  const variants = new Set<string>([base]);

  if (words.length >= 2) variants.add(words.slice(0, 2).join(" "));
  if (words.length >= 3) variants.add(words.slice(1).join(" "));

  const categoryPrefixes: Record<string, string[]> = {
    "leche":       ["leche entera", "leche deslactosada"],
    "coca":        ["refresco coca cola", "coca cola lata", "coca cola botella"],
    "cola":        ["refresco cola", "coca cola"],
    "detergente":  ["detergente ropa", "jabón detergente"],
    "arroz":       ["arroz blanco", "arroz largo"],
    "aceite":      ["aceite cocina", "aceite girasol"],
    "cereal":      ["cereal desayuno", "cereal caja"],
    "pan":         ["pan molde", "pan blanco"],
    "agua":        ["agua purificada", "agua natural"],
    "jugo":        ["jugo fruta", "jugo natural"],
  };

  for (const [keyword, expansions] of Object.entries(categoryPrefixes)) {
    if (base.includes(keyword)) {
      expansions.forEach(e => variants.add(e));
      break;
    }
  }

  const variantList = [...variants].slice(0, 4);
  const perQuery = Math.ceil(limit / variantList.length);
  return variantList.map(query => ({ query, perQuery }));
}

async function catalogSearch(query: string, limit: number, token: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/products/search?site_id=MLM&q=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: { "Authorization": `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      if (res.status === 401) { cachedToken = null; tokenExpiresAt = 0; }
      return [];
    }

    const { results: items = [] } = await res.json();
    if (items.length === 0) return [];

    const details: any[] = [];
    for (let i = 0; i < items.length; i += 5) {
      const batch = await Promise.all(
        items.slice(i, i + 5).map((p: any) =>
          fetch(`https://api.mercadolibre.com/products/${p.id}`, {
            headers: { "Authorization": `Bearer ${token}` },
            signal: AbortSignal.timeout(6000),
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        )
      );
      details.push(...batch);
    }

    return items.map((item: any, idx: number) => {
      const detail    = details[idx];
      const bbw       = detail?.buy_box_winner;
      const pics      = item.pictures || detail?.pictures || [];
      const thumbnail = pics[0]?.url?.replace("http://", "https://") || null;
      const permalink = bbw?.permalink || detail?.permalink || `https://www.mercadolibre.com.mx/p/${item.id}`;

      return {
        id:       item.id,
        ml_id:    bbw?.item_id || item.id,
        title:    item.name,
        category: item.domain_id || "General",
        image:    thumbnail,
        brand:    "",
        offers: [{
          store:    "mercadolibre",
          price:    bbw?.price ?? null,
          shipping: bbw?.shipping?.free_shipping ? 0 : 49,
          delivery: bbw?.shipping?.free_shipping ? "Envío gratis" : "3-5 días",
          url:      permalink,
        }],
        source:    "mercadolibre",
        permalink,
      };
    });
  } catch (err) { return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url   = new URL(req.url);
    const query = url.searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    if (!query) return json({ error: "Falta q", results: [] }, 400);

    const token = await getMLToken();
    if (!token) return json({ error: "Sin token", results: [] }, 503);

    const variants = buildQueryVariants(query, limit);
    const seen = new Set<string>();
    const combined: any[] = [];

    for (const { query: q, perQuery } of variants) {
      const results = await catalogSearch(q, perQuery, token);
      for (const item of results) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }
      if (combined.length >= limit) break;
    }

    return json({ results: combined, total: combined.length, source: "catalog_multi" }, 200);

  } catch (err) {
    return json({ error: err.message, results: [] }, 500);
  }
});

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
