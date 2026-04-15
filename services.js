// =============================================
// Market2U — Capa de Servicios Backend
// =============================================
// Maneja: Supabase Auth, DB queries, y API de Mercado Libre
// =============================================

// ---- SUPABASE CLIENT -------------------------
let supabase = null;

const initSupabase = () => {
    if (typeof window.supabase === 'undefined') {
        console.warn('[Market2U] Supabase SDK no cargado. Usando modo localStorage.');
        return null;
    }
    if (!CONFIG.SUPABASE_URL.includes('supabase.co')) {
        console.warn('[Market2U] Supabase no configurado. Completa config.js con tus credenciales.');
        return null;
    }
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    console.log('[Market2U] Supabase conectado ✓');
    return supabase;
};

// ---- AUTH ------------------------------------
const AuthService = {
    isReady: () => supabase !== null,

    signUp: async (email, password, name) => {
        if (!supabase) return { error: 'Supabase no configurado' };
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { name } }
        });
        return { data, error };
    },

    signIn: async (email, password) => {
        if (!supabase) return { error: 'Supabase no configurado' };
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    signInWithGoogle: async () => {
        if (!supabase) return { error: 'Supabase no configurado' };
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        return { data, error };
    },

    signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    },

    getSession: async () => {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    onAuthChange: (callback) => {
        if (!supabase) return;
        supabase.auth.onAuthStateChange((_event, session) => callback(session));
    }
};

// ---- MERCADO LIBRE API -----------------------
// Auto-renew token when it expires
const MLTokenManager = {
    _expiresAt: null,

    isExpired: () => {
        if (!MLTokenManager._expiresAt) return true;
        return Date.now() >= MLTokenManager._expiresAt;
    },

    refresh: async () => {
        if (!CONFIG.ML_CLIENT_ID || !CONFIG.ML_CLIENT_SECRET) return false;
        try {
            // Usamos un proxy público de CORS para la renovación desde el browser
            const res = await fetch('https://api.mercadolibre.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `grant_type=client_credentials&client_id=${CONFIG.ML_CLIENT_ID}&client_secret=${CONFIG.ML_CLIENT_SECRET}`
            });
            if (!res.ok) return false;
            const data = await res.json();
            if (data.access_token) {
                CONFIG.ML_ACCESS_TOKEN = data.access_token;
                MLTokenManager._expiresAt = Date.now() + (data.expires_in - 300) * 1000; // 5min antes
                console.log('[ML Token] Renovado correctamente, expira en', data.expires_in / 3600, 'horas');
                return true;
            }
        } catch (err) {
            console.warn('[ML Token] No se pudo renovar:', err.message);
        }
        return false;
    },

    ensureValid: async () => {
        if (MLTokenManager.isExpired()) {
            await MLTokenManager.refresh();
        }
    }
};

// Pre-marcar token actual como válido por 6hrs desde ahora
if (CONFIG.ML_ACCESS_TOKEN) {
    MLTokenManager._expiresAt = Date.now() + 6 * 60 * 60 * 1000;
}

const MLService = {
    BASE_URL: `https://api.mercadolibre.com/sites/${CONFIG.ML_SITE_ID}`,

    _headers: () => {
        const h = { 'Content-Type': 'application/json' };
        if (CONFIG.ML_ACCESS_TOKEN) h['Authorization'] = `Bearer ${CONFIG.ML_ACCESS_TOKEN}`;
        return h;
    },

    search: async (query, limit = 20) => {
        await MLTokenManager.ensureValid();
        try {
            const url = `${MLService.BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}&category=MLM1246`;
            const res = await fetch(url, { headers: MLService._headers() });
            if (res.status === 403) {
                console.warn('[ML API] Se requiere access_token. Ve a developers.mercadolibre.com para obtenerlo.');
                return null;
            }
            if (!res.ok) throw new Error('API error ' + res.status);
            const data = await res.json();
            return MLService.parseResults(data.results || []);
        } catch (err) {
            console.error('[ML API] Error:', err);
            return null;
        }
    },

    searchGeneral: async (query, limit = 20) => {
        try {
            // Usar Supabase Edge Function (proxy seguro, sin bloqueo de IP)
            const edgeUrl = `${CONFIG.ML_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
            const headers = { 'Content-Type': 'application/json' };
            // Si tenemos anon key, la incluimos (requerida por Supabase Edge Functions)
            if (CONFIG.SUPABASE_ANON_KEY && CONFIG.SUPABASE_ANON_KEY !== 'TU_SUPABASE_ANON_KEY_AQUI') {
                headers['Authorization'] = `Bearer ${CONFIG.SUPABASE_ANON_KEY}`;
            }

            const res = await fetch(edgeUrl, { headers });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.warn('[ML Edge] Error:', res.status, errData);
                return null;
            }
            const data = await res.json();
            const items = data.results || [];
            if (items.length === 0) return null;
            return MLService.parseResults(items);
        } catch (err) {
            console.error('[ML Edge] Error de red:', err);
            return null;
        }
    },

    getItem: async (itemId) => {
        try {
            const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
            if (!res.ok) throw new Error('Not found');
            return await res.json();
        } catch (err) {
            return null;
        }
    },

    parseResults: (results) => {
        return results.map(item => {
            // El proxy devuelve formato simplificado; la API directa devuelve formato completo
            // Soportamos ambos:
            const freeShipping = item.free_shipping ?? item.shipping?.free_shipping ?? false;
            const sellerName = typeof item.seller === 'string' ? item.seller : (item.seller?.nickname || '');
            const brand = item.brand || item.attributes?.find(a => a.id === 'BRAND')?.value_name || '';
            const image = item.thumbnail
                ? item.thumbnail.replace('-I.jpg', '-O.jpg').replace('http://', 'https://')
                : null;

            return {
                id: `ml_${item.id}`,
                ml_id: item.id,
                title: item.title,
                category: item.category_id || 'General',
                image,
                description: sellerName ? `Vendedor: ${sellerName}` : 'Mercado Libre',
                brand,
                offers: [{
                    store: 'mercadolibre',
                    price: item.price,
                    shipping: freeShipping ? 0 : 49,
                    delivery: freeShipping ? 'Envío gratis' : '3-5 días',
                    url: item.permalink
                }],
                source: 'mercadolibre',
                permalink: item.permalink
            };
        });
    },
};

// ---- LISTS SERVICE ---------------------------
const ListsService = {
    save: async (userId, name, items) => {
        if (!supabase || !userId) {
            // Fallback a localStorage
            return null;
        }
        const { data, error } = await supabase
            .from('saved_lists')
            .insert({ user_id: userId, name, items });
        return { data, error };
    },

    getAll: async (userId) => {
        if (!supabase || !userId) return null;
        const { data, error } = await supabase
            .from('saved_lists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    delete: async (listId) => {
        if (!supabase) return null;
        const { error } = await supabase
            .from('saved_lists')
            .delete()
            .eq('id', listId);
        return { error };
    }
};

// ---- ADDRESSES SERVICE -----------------------
const AddressService = {
    getAll: async (userId) => {
        if (!supabase || !userId) return null;
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false });
        return { data, error };
    },

    add: async (userId, address) => {
        if (!supabase || !userId) return null;
        const { data, error } = await supabase
            .from('addresses')
            .insert({ user_id: userId, ...address });
        return { data, error };
    },

    setDefault: async (userId, addressId) => {
        if (!supabase) return null;
        await supabase.from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
        const { error } = await supabase.from('addresses')
            .update({ is_default: true })
            .eq('id', addressId);
        return { error };
    },

    delete: async (addressId) => {
        if (!supabase) return null;
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', addressId);
        return { error };
    }
};

// Inicializar Supabase cuando cargue el script
initSupabase();
