// =============================================
// Market4U — Capa de Servicios Backend
// =============================================
// Maneja: Supabase Auth, DB queries, y API de Mercado Libre
// =============================================

// ---- SUPABASE CLIENT -------------------------
let _sb = null;

const initSupabase = () => {
    if (typeof window.supabase === 'undefined') {
        console.warn('[Market4U] Supabase SDK no cargado. Usando modo localStorage.');
        return null;
    }
    if (!CONFIG.SUPABASE_URL.includes('supabase.co')) {
        console.warn('[Market4U] Supabase no configurado. Completa config.js con tus credenciales.');
        return null;
    }
    _sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    console.log('[Market4U] Supabase conectado ✓');
    return _sb;
};

// ---- SAFE STORAGE -----------------------------
const SafeStorage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('[SafeStorage] Error reading key:', key, e);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('[SafeStorage] Error writing key:', key, e);
            return false;
        }
    },
    removeItem: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('[SafeStorage] Error removing key:', key, e);
            return false;
        }
    },
    keys: () => {
        try {
            return Object.keys(localStorage);
        } catch (e) {
            return [];
        }
    }
};


// ---- ADAPTERS ---------------------------------
const ProductAdapter = {
    toFrontend: (dbProduct) => {
        if (!dbProduct) return null;
        const offersArray = (dbProduct.price_history || []).map(ph => ({
            store: ph.store_id || 'desconocido',
            price: Number(ph.price || 0),
            shipping: Number(ph.shipping || 0),
            delivery: 'Supermercado local',
            url: ph.source_url || dbProduct.permalink || null
        }));

        // Ordenar ofertas por precio menor
        offersArray.sort((a, b) => a.price - b.price);
        const primaryOffer = offersArray[0] || { price: 0, store: 'desconocido', shipping: 0, url: null };

        return {
            id: dbProduct.ml_id || dbProduct.id,
            ml_id: dbProduct.ml_id,
            barcode: dbProduct.barcode || null,
            title: dbProduct.title,
            price: primaryOffer.price,
            thumbnail: dbProduct.image_url || 'https://via.placeholder.com/150',
            image: dbProduct.image_url || 'https://via.placeholder.com/150',
            seller: primaryOffer.store,
            free_shipping: false,
            brand: dbProduct.brand || '',
            category_id: dbProduct.category || '',
            description: dbProduct.description || '',
            offers: offersArray,
            source: primaryOffer.store
        };
    },

    toDatabase: (frontendProduct) => {
        if (!frontendProduct) return null;
        return {
            ml_id: frontendProduct.ml_id || frontendProduct.id,
            title: frontendProduct.title,
            category: frontendProduct.category_id || frontendProduct.category || 'General',
            image_url: frontendProduct.thumbnail || frontendProduct.image || null,
            brand: frontendProduct.brand || ''
        };
    }
};

const ListAdapter = {
    toDatabase: (frontendList) => {
        if (!frontendList) return null;
        return {
            name: frontendList.name,
            user_id: frontendList.userId
        };
    },
    toFrontend: (dbListRow) => {
        if (!dbListRow) return null;
        return {
            id: dbListRow.id,
            name: dbListRow.name,
            created_at: dbListRow.created_at,
            items: (dbListRow.list_items || []).map(li => {
                if (!li.products) return null;
                return {
                    product_id: li.product_id,
                    quantity: li.quantity,
                    product: {
                        id: li.products.id,
                        ml_id: li.products.ml_id,
                        title: li.products.title,
                        thumbnail: li.products.image_url || 'https://via.placeholder.com/150',
                        brand: li.products.brand || '',
                        category: li.products.category || ''
                    }
                };
            }).filter(Boolean)
        };
    }
};

// ---- AUTH ------------------------------------
const AuthService = {
    isReady: () => _sb !== null,

    signUp: async (email, password, name) => {
        if (!_sb) return { error: 'Supabase no configurado' };
        const { data, error } = await _sb.auth.signUp({
            email, password,
            options: { data: { name } }
        });
        return { data, error };
    },

    signIn: async (email, password) => {
        if (!_sb) return { error: 'Supabase no configurado' };
        const { data, error } = await _sb.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    signInWithGoogle: async () => {
        if (!_sb) return { error: 'Supabase no configurado' };
        const { data, error } = await _sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        return { data, error };
    },

    saveAlert: async (product, targetPrice, promo) => {
        if (!_sb) return { error: { message: 'Demo local sin base de datos' } };
        const session = await AuthService.getSession();
        if (!session) return { error: { message: 'Inicia sesión para guardar tu alerta en la nube.' } };

        // 1. Asegurar que el producto existe en la DB y obtener su UUID (como en savePriceHistory)
        const dbPayload = ProductAdapter.toDatabase(product);
        const { data: prodData, error: prodErr } = await _sb
            .from('products')
            .upsert(dbPayload, { onConflict: 'ml_id' })
            .select('id').single();
            
        if (prodErr || !prodData) return { error: { message: 'Error al registrar el producto.' } };

        // 2. Guardar la alerta vinculada al Usuario y al Producto
        const { data, error } = await _sb
            .from('price_alerts')
            .insert([{
                user_id: session.user.id,
                product_id: prodData.id,
                target_price: targetPrice,
                notify_promo: promo,
                is_active: true
            }]);
            
        return { data, error };
    },

    signOut: async () => {
        if (!_sb) return;
        await _sb.auth.signOut();
    },

    getSession: async () => {
        if (!_sb) return null;
        const { data: { session } } = await _sb.auth.getSession();
        return session;
    },

    onAuthChange: (callback) => {
        if (!_sb) return;
        _sb.auth.onAuthStateChange((_event, session) => callback(session));
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

    searchGeneral: async (query, limit = 48, offset = 0, city = 'default') => {
        try {
            // Pasamos el query, la ciudad y paginación al Vercel Serverless Function
            const vercelUrl = `/api/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&city=${encodeURIComponent(city)}`;
            
            const res = await fetch(vercelUrl);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.warn('[Soriana Vercel] Error:', res.status, errData);
                return null;
            }
            
            const data = await res.json();
            const items = data.results || [];
            if (items.length === 0) return null;

            return MLService.parseItemsResults(items);
        } catch (err) {
            console.error('[Soriana Network] Error de red:', err);
            return null;
        }
    },

    // Parser dinámico para el Agregador Vercel (Soriana + Chedraui)
    parseItemsResults: (items) => {
        return items.map(item => {
            const rawTitle  = item.title || '';
            const title     = rawTitle.length > 65 ? rawTitle.substring(0, 62) + '...' : rawTitle;

            let storeKey = 'soriana';
            if (item.seller === 'Chedraui') storeKey = 'chedraui';
            if (item.seller === 'HEB') storeKey = 'heb';
            if (item.seller === 'La Comer') storeKey = 'lacomer';
            if (item.seller === 'City Market') storeKey = 'citymarket';
            if (item.seller === 'Fresko') storeKey = 'fresko';
            if (item.seller === 'Jüsto') storeKey = 'justo';


            return {
                id:          item.id,
                ml_id:       item.canonical_id || null,
                sku_id:      item.sku_id || null,
                permalink:   item.permalink || null,
                title,
                category:    'General', // API scraper doesn't fetch category yet
                image:       item.thumbnail,
                description: `Disponible en ${item.seller}`,
                bestOffer:   { price: item.price || 0, list_price: item.list_price || item.price || 0, store: storeKey },
                sortedOffers: [{ price: item.price || 0, list_price: item.list_price || item.price || 0, store: storeKey, name: item.seller }],
                offers: [{
                    store:    storeKey,
                    price:    item.price || 0,
                    list_price: item.list_price || item.price || 0,
                    shipping: 0,
                    delivery: 'N/A',
                    url:      item.permalink,
                }],
                source:      storeKey,
                permalink:   item.permalink,
                noPriceLink: !item.price,
            };
        });
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

    // Mapeo de categorías ML → nombres amigables
    _mlCategoryMap: {
        // Catalog API domain IDs
        'MLM-MILK':           'Lácteos',
        'MLM-BREAST_PUMPS':   'Bombas de Leche',
        'MLM-FOOD':           'Alimentos',
        'MLM-BEVERAGES':      'Bebidas',
        'MLM-CLEANING':       'Limpieza',
        'MLM-HEALTH':         'Salud',
        'MLM-BABY_FOOD':      'Alimentos para Bebé',
        'MLM-CEREALS':        'Cereales',
        'MLM-SNACKS':         'Botanas',
        'MLM-PERSONAL_CARE':  'Cuidado Personal',
        'MLM-PET_FOOD':       'Mascotas',
        // Items Search API category IDs (reales de MLM)
        'MLM1055':   'Alimentos y Bebidas',
        'MLM1246':   'Bebidas',
        'MLM1403':   'Despensa',
        'MLM409431': 'Lácteos',
        'MLM1367':   'Limpieza y Hogar',
        'MLM1276':   'Salud y Cuidado Personal',
        'MLM1499':   'Mascotas',
        'MLM1144':   'Electrónicos',
        'MLM1000':   'Moda',
    },

    // Parser para resultados del catálogo de productos (Edge Function v5)
    parseCatalogResults: (items) => {
        const catMap = MLService._mlCategoryMap;
        return items.map(item => {
            // Limpiar categoría
            const rawCat = item.category || '';
            const friendlyCat = catMap[rawCat]
                || rawCat.replace(/^MLM-/, '').replace(/_/g, ' ').toLowerCase()
                         .replace(/\b\w/g, c => c.toUpperCase())
                || 'General';
            
            // Truncar título a máximo 60 caracteres
            const rawTitle = item.title || '';
            const cleanTitle = rawTitle.length > 60
                ? rawTitle.substring(0, 57) + '...'
                : rawTitle;

            return {
                id:          `ml_${item.id}`,
                ml_id:       item.ml_id || item.id,
                title:       cleanTitle,
                category:    friendlyCat,
                image:       item.image || null,
                description: 'Disponible en Mercado Libre',
                brand:       item.brand || '',
                offers:      (item.offers || []).map(o => ({
                    store:    o.store || 'mercadolibre',
                    price:    o.price ?? null,
                    shipping: o.shipping ?? 49,
                    delivery: o.price ? (o.delivery || '3-5 días') : 'Ver en ML',
                    url:      o.url || item.permalink,
                })),
                source:      'mercadolibre',
                permalink:   item.permalink,
                noPriceLink: !(item.offers?.[0]?.price),
            };
        });
    },

    // Parser legacy (API directa de ML, formato antiguo)
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

    savePriceHistory: async (products) => {
        if (!_sb) return;
        try {
            // For analytical cleanliness, we only store the fully merged results
            for (const p of products) {
                if (!p.id) continue;
                // Upsert product using ml_id as unique identifier
                const dbPayload = ProductAdapter.toDatabase(p);
                const { data: prodData, error: prodErr } = await _sb
                    .from('products')
                    .upsert(dbPayload, { onConflict: 'ml_id' })
                    .select('id')
                    .single();
                
                if (prodErr || !prodData) continue;
                
                // Insert price history for each unique offer branch
                for (const o of p.offers) {
                    if (!o.price || !o.store) continue;
                    await _sb
                        .from('price_history')
                        .insert({
                            product_id: prodData.id,
                            store_id: o.store,
                            price: o.price,
                            shipping: o.shipping || 0,
                            source_url: o.url || null
                        });
                }
            }
        } catch (e) {
            console.error('[Supabase History Engine]', e);
        }
    },

    getRealHistory: async (ml_id) => {
        if (!_sb) return null;
        try {
            const { data: prodData } = await _sb
                .from('products')
                .select('id')
                .eq('ml_id', ml_id)
                .single();
            
            if (!prodData) return null;
            
            const { data: historyData } = await _sb
                .from('price_history')
                .select('store_id, price, scraped_at')
                .eq('product_id', prodData.id)
                .order('scraped_at', { ascending: true });
                
            return historyData;
        } catch (e) {
            console.error('[Supabase Query]', e);
            return null;
        }
    }
};

// ---- LISTS SERVICE ---------------------------
const ListsService = {
    save: async (userId, name, items) => {
        if (!_sb || !userId) {
            // Fallback a localStorage
            return null;
        }
        
        try {
            // 1. Asegurar que todos los productos existen en la base de datos de Supabase y obtener sus UUIDs
            const resolvedItems = [];
            if (items && items.length > 0) {
                for (const item of items) {
                    const p = item.product;
                    if (!p) continue;
                    
                    const dbPayload = ProductAdapter.toDatabase(p);
                    const { data: prodData, error: prodErr } = await _sb
                        .from('products')
                        .upsert(dbPayload, { onConflict: 'ml_id' })
                        .select('id')
                        .single();
                        
                    if (prodErr || !prodData) {
                        console.warn('[Supabase Lists] Error upserting product:', prodErr);
                        continue;
                    }
                    resolvedItems.push({ product_uuid: prodData.id, quantity: item.quantity || 1 });
                }
            }

            // 2. Insertar la lista y retornar la fila insertada con su UUID
            const listPayload = ListAdapter.toDatabase({ name, userId });
            const { data: listData, error: listError } = await _sb
                .from('saved_lists')
                .insert(listPayload)
                .select()
                .single();
                
            if (listError) throw listError;
            
            // 3. Si hay productos resueltos, insertarlos en la tabla relacional
            if (resolvedItems.length > 0) {
                const itemsPayload = resolvedItems.map(ri => ({
                    list_id: listData.id,
                    product_id: ri.product_uuid,
                    quantity: ri.quantity
                }));
                
                const { error: itemsError } = await _sb
                    .from('list_items')
                    .insert(itemsPayload);
                    
                if (itemsError) throw itemsError;
            }
            
            return { data: listData, error: null };
        } catch (e) {
            console.error('[ListsService.save] Error:', e);
            return { data: null, error: e };
        }
    },

    getAll: async (userId) => {
        if (!_sb || !userId) return null;
        
        try {
            // Obtener listas y realizar el join relacional con list_items y products en una sola consulta
            const { data, error } = await _sb
                .from('saved_lists')
                .select(`
                    id,
                    name,
                    created_at,
                    list_items (
                        product_id,
                        quantity,
                        products (
                            id,
                            ml_id,
                            title,
                            image_url,
                            brand,
                            category
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Adaptador de formato para mantener compatibilidad con el procesamiento original de app.js
            const formattedData = data.map(row => ListAdapter.toFrontend(row)).filter(Boolean);
            
            return { data: formattedData, error: null };
        } catch (e) {
            console.error('[ListsService.getAll] Error:', e);
            return { data: null, error: e };
        }
    },

    delete: async (listId) => {
        if (!_sb) return null;
        // El delete en saved_lists eliminará en cascada los registros correspondientes en list_items
        const { error } = await _sb
            .from('saved_lists')
            .delete()
            .eq('id', listId);
        return { error };
    }
};

// ---- ADDRESSES SERVICE -----------------------
const AddressService = {
    getAll: async (userId) => {
        if (!_sb || !userId) return null;
        const { data, error } = await _sb
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false });
        return { data, error };
    },

    add: async (userId, address) => {
        if (!_sb || !userId) return null;
        const { data, error } = await _sb
            .from('addresses')
            .insert({ user_id: userId, ...address });
        return { data, error };
    },

    setDefault: async (userId, addressId) => {
        if (!_sb) return null;
        await _sb.from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
        const { error } = await _sb.from('addresses')
            .update({ is_default: true })
            .eq('id', addressId);
        return { error };
    },

    delete: async (addressId) => {
        if (!_sb) return null;
        const { error } = await _sb
            .from('addresses')
            .delete()
            .eq('id', addressId);
        return { error };
    }
};

// ---- PRODUCTS SERVICE ------------------------
// Guarda productos de ML en Supabase para historial y búsquedas futuras
const ProductsService = {
    // Insertar/actualizar un producto y su precio en Supabase
    upsertFromML: async (mlProduct) => {
        if (!_sb) return null;
        try {
            // 1. Upsert del producto en la tabla products
            const { data: product, error: pErr } = await _sb
                .from('products')
                .upsert({
                    ml_id:     mlProduct.ml_id,
                    title:     mlProduct.title,
                    category:  mlProduct.category || 'General',
                    image_url: mlProduct.image,
                    brand:     mlProduct.brand || null,
                }, { onConflict: 'ml_id' })
                .select('id')
                .single();

            if (pErr || !product) return null;

            // 2. Insertar en price_history el precio actual
            const offer = mlProduct.offers?.[0];
            if (offer) {
                await _sb.from('price_history').insert({
                    product_id: product.id,
                    store_id:   'mercadolibre',
                    price:      offer.price,
                    shipping:   offer.shipping ?? 49,
                    in_stock:   true,
                    source_url: mlProduct.permalink,
                });
            }
            return product.id;
        } catch (err) {
            console.warn('[ProductsService] Error:', err.message);
            return null;
        }
    },

    // Buscar productos por texto en Supabase
    search: async (query) => {
        if (!_sb) return null;
        const { data, error } = await _sb
            .from('products')
            .select(`
                id, ml_id, title, category, image_url, brand, description,
                price_history(store_id, price, shipping, scraped_at)
            `)
            .textSearch('title', query, { type: 'plain', config: 'spanish' })
            .limit(20);
            
        if (error || !data) return null;
        
        return data.map(p => ProductAdapter.toFrontend(p)).filter(Boolean);
    },

    // Buscar producto por su código de barras en Supabase
    getByBarcode: async (barcode) => {
        if (!_sb) return null;
        try {
            const { data, error } = await _sb
                .from('products')
                .select(`
                    id, ml_id, barcode, title, category, image_url, brand, description,
                    price_history(store_id, price, shipping, source_url, scraped_at)
                `)
                .eq('barcode', barcode)
                .maybeSingle();

            if (error || !data) return null;

            return ProductAdapter.toFrontend(data);
        } catch (err) {
            console.warn('[ProductsService.getByBarcode] Error:', err.message);
            return null;
        }
    }
};

// ---- ALERTS SERVICE --------------------------
const AlertsService = {
    getAll: async (userId) => {
        if (!_sb || !userId) return null;
        const { data, error } = await _sb
            .from('price_alerts')
            .select('*, products(title, image_url)')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        return error ? null : data;
    },

    add: async (userId, productId, targetPrice, notifyPromo = false) => {
        if (!_sb || !userId) return null;
        const { data, error } = await _sb
            .from('price_alerts')
            .insert({
                user_id:      userId,
                product_id:   productId,
                target_price: targetPrice,
                notify_promo: notifyPromo,
                is_active:    true,
            })
            .select()
            .single();
        return { data, error };
    },

    remove: async (alertId) => {
        if (!_sb) return null;
        const { error } = await _sb
            .from('price_alerts')
            .update({ is_active: false })
            .eq('id', alertId);
        return { error };
    }
};

// ---- USER PROFILE SERVICE --------------------
const UserProfileService = {
    get: async (userId) => {
        if (!_sb || !userId) return null;
        const { data, error } = await _sb
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return error ? null : data;
    },

    update: async (userId, updates) => {
        if (!_sb || !userId) return null;
        const { data, error } = await _sb
            .from('user_profiles')
            .upsert({ id: userId, ...updates })
            .select()
            .single();
        return { data, error };
    },

    setPreferredStores: async (userId, storeIds) => {
        if (!_sb || !userId) return null;
        return UserProfileService.update(userId, { preferred_stores: storeIds });
    }
};

// ---- PURCHASE HISTORY SERVICE ----------------
const PurchaseService = {
    recordPurchase: async (userId, storeId, itemsCount, totalPaid, totalAvoided, savedAmount) => {
        if (!_sb) {
            // LocalStorage fallback for anonymous users
            try {
                const history = JSON.parse(SafeStorage.getItem('m4u_purchase_history') || '[]');
                const newRecord = {
                    id: Math.random().toString(36).substring(2, 11),
                    store_id: storeId,
                    items_count: itemsCount,
                    total_paid: totalPaid,
                    total_avoided: totalAvoided,
                    saved_amount: savedAmount,
                    created_at: new Date().toISOString()
                };
                history.push(newRecord);
                SafeStorage.setItem('m4u_purchase_history', JSON.stringify(history));
                return { data: newRecord, error: null };
            } catch (err) {
                return { data: null, error: err.message };
            }
        }
        if (!userId) return { data: null, error: 'User ID required' };
        const { data, error } = await _sb
            .from('purchase_history')
            .insert({
                user_id: userId,
                store_id: storeId,
                items_count: itemsCount,
                total_paid: totalPaid,
                total_avoided: totalAvoided,
                saved_amount: savedAmount
            })
            .select()
            .single();
        return { data, error };
    },

    getHistory: async (userId) => {
        if (!_sb) {
            try {
                const history = JSON.parse(SafeStorage.getItem('m4u_purchase_history') || '[]');
                return history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } catch (err) {
                return [];
            }
        }
        if (!userId) return [];
        const { data, error } = await _sb
            .from('purchase_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return error ? [] : data;
    }
};

// Inicializar Supabase cuando cargue el script
initSupabase();

