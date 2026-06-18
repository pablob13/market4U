// Usamos variables globales desde mockData.js ya que estamos corriendo sin servidor
console.log('%c✅ Market4U app.js v4 cache-busted cargado correctamente', 'background:#10b981; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;');
console.log('MLService disponible:', typeof MLService !== 'undefined');
console.log('CONFIG.ML_SEARCH_URL:', typeof CONFIG !== 'undefined' ? CONFIG.ML_SEARCH_URL : 'CONFIG no definido');

const IconManager = {
    render: (options) => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            try {
                lucide.createIcons(options);
            } catch (e) {
                console.warn('[IconManager] Error rendering icons:', e);
            }
        } else {
            console.warn('[IconManager] Lucide library not loaded.');
        }
    }
};

const safeCreateIcons = (options) => IconManager.render(options);

const CITY_STORES = {
    default: ['soriana', 'chedraui', 'lacomer', 'fresko', 'citymarket', 'justo', 'heb', 'waldos', 'farmacias_gdl'],
    cdmx: ['soriana', 'chedraui', 'lacomer', 'fresko', 'citymarket', 'justo', 'waldos', 'farmacias_gdl'],
    mty: ['soriana', 'chedraui', 'heb', 'justo', 'waldos', 'farmacias_gdl'],
    gdl: ['soriana', 'chedraui', 'heb', 'lacomer', 'fresko', 'justo', 'waldos', 'farmacias_gdl'],
    qro: ['soriana', 'chedraui', 'heb', 'lacomer', 'fresko', 'justo', 'waldos', 'farmacias_gdl']
};



const CatalogState = {
    currentPage: 1,
    activeFilters: new Set(),
    get sortBy() { return document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : 'default'; },
    set sortBy(val) {
        const select = document.getElementById('sortSelect');
        if (select) select.value = val;
    },
    resetPage: () => {
        CatalogState.currentPage = 1;
        currentOffset = 0;
    },
    update: (triggerML = false) => {
        if (typeof applyFilters !== 'undefined') {
            applyFilters(triggerML);
        }
    }
};

const activeStoreFilters = CatalogState.activeFilters;
Object.defineProperty(window, 'activeStoreFilters', {
    get() { return CatalogState.activeFilters; }
});
Object.defineProperty(window, 'currentPage', {
    get() { return CatalogState.currentPage; },
    set(val) { CatalogState.currentPage = val; }
});


// DOM Elements
const resultsGrid = document.getElementById('resultsGrid');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const sortSelect = document.getElementById('sortSelect');

// Antiguo element ComparisonModal eliminado

const openCartBtn = document.getElementById('openCartBtn');
const closeCartModal = document.getElementById('closeCartModal');
const cartModal = document.getElementById('cartModal');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalsContainer = document.getElementById('cartTotalsContainer');
const cartCount = document.getElementById('cartCount');

const saveListBtn = document.getElementById('saveListBtn');
const listNameInput = document.getElementById('listNameInput');

// User & Profile DOM
const userNavControl = document.getElementById('userNavControl');
const openLoginBtn = document.getElementById('openLoginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');

const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const logoutBtn = document.getElementById('logoutBtn');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const profileContentArea = document.getElementById('profileContentArea');
const tabBtns = document.querySelectorAll('.tab-btn');

// Notifications DOM
const openNotificationsBtn = document.getElementById('openNotificationsBtn');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const notifCount = document.getElementById('notifCount');
const notifList = document.getElementById('notifList');

// Alert Modal DOM
const alertModal = document.getElementById('alertModal');
const closeAlertModal = document.getElementById('closeAlertModal');

// OCR Modal DOM
const ocrModal = document.getElementById('ocrModal');
const openOcrBtn = document.getElementById('openOcrBtn');
const closeOcrModal = document.getElementById('closeOcrModal');
const ocrInputFile = document.getElementById('ocrInputFile');
const ocrDropzone = document.getElementById('ocrDropzone');
const ocrProgressContainer = document.getElementById('ocrProgressContainer');
const ocrProgressStatus = document.getElementById('ocrProgressStatus');
const ocrProgressPercent = document.getElementById('ocrProgressPercent');
const ocrProgressBar = document.getElementById('ocrProgressBar');
const ocrResultsContainer = document.getElementById('ocrResultsContainer');
const ocrDetectedItems = document.getElementById('ocrDetectedItems');
const ocrCancelBtn = document.getElementById('ocrCancelBtn');
const ocrImportBtn = document.getElementById('ocrImportBtn');
const alertProductImage = document.getElementById('alertProductImage');
const alertProductTitle = document.getElementById('alertProductTitle');
const alertProductPrice = document.getElementById('alertProductPrice');
const alertPriceInput = document.getElementById('alertPriceInput');
const alertPromoInput = document.getElementById('alertPromoInput');
const saveAlertBtn = document.getElementById('saveAlertBtn');

// Redirect DOM
const redirectModal = document.getElementById('redirectModal');
const redirectSpinner = document.getElementById('redirectSpinner');
const redirectStoreLogo = document.getElementById('redirectStoreLogo');
const redirectTitle = document.getElementById('redirectTitle');
const redirectSubtitle = document.getElementById('redirectSubtitle');
const redirectSuccess = document.getElementById('redirectSuccess');
const closeRedirectBtn = document.getElementById('closeRedirectBtn');

// Scanner DOM
const openScannerBtn = document.getElementById('openScannerBtn');
const scannerModal = document.getElementById('scannerModal');
const closeScannerBtn = document.getElementById('closeScannerBtn');

// PDP DOM
const pdpPage = document.getElementById('pdpPage');
const pdpContentBody = document.getElementById('pdpContentBody');
const closePdpBtn = document.getElementById('closePdpBtn');

// State
let allData = [];
let currentData = [];
let cart = [];
let savedLists = [];
let user = null; 
let favorites = new Set();
let alerts = []; // Ahora es array de objetos
let addresses = []; // Direcciones de envío
let currentAlertProductId = null;
let activeTab = 'listas'; // Modificado para que sea la primera pestaña
let currentOffset = 0;
let currentSearchLimit = 48;
let mockNotifications = [
    { id: 1, title: '¡Alerta de Precio Cumplida!', body: 'El Papel Pétalo bajó un 15% en HEB. Está en $65.00.', time: 'Hace 5 min', unread: true },
    { id: 2, title: 'Promoción 3x2 Detectada', body: 'Soriana acaba de lanzar 3x2 en Café Nescafé Soluble.', time: 'Hace 2 horas', unread: true },
    { id: 3, title: 'Bienvenido a Market4U', body: 'Tu cuenta y pre-configuración se han cargado exitosamente.', time: 'Ayer', unread: false }
];

// State Persistence Manager
const saveState = () => {
    const data = {
        user,
        cart,
        savedLists,
        favorites: Array.from(favorites),
        alerts,
        addresses
    };
    SafeStorage.setItem('market4u_state', JSON.stringify(data));
};

const loadState = () => {
    const saved = SafeStorage.getItem('market4u_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            user = data.user;
            favorites = new Set(data.favorites || []);
            alerts = data.alerts || [];
            addresses = data.addresses || [];
            
            cart = (data.cart || []).map(c => {
                if(c && c.product && c.product.id) {
                    const fp = allData.find(x => x.id === c.product.id);
                    return fp ? { product: fp, quantity: c.quantity || 1 } : null;
                } else if(c && c.id) {
                    const fp = allData.find(x => x.id === c.id);
                    return fp ? { product: fp, quantity: 1 } : null;
                }
                return null;
            }).filter(x => x !== null);
            
            savedLists = (data.savedLists || []).map(list => {
                if(!list || !list.items) return null;
                const fItems = list.items.map(i => {
                    if(i && i.product && i.product.id) return { product: allData.find(x => x.id === i.product.id), quantity: i.quantity || 1 };
                    else if(i && i.id) return { product: allData.find(x => x.id === i.id), quantity: 1 };
                    return null;
                }).filter(x => x && x.product);
                return { name: list.name || 'Sin Nombre', items: fItems };
            }).filter(Boolean);
        } catch(e) { console.error('Error load state', e); }
    } else {
        // MOCK USER DATA INICIAL POR DEFECTO
        user = { name: "Pablo" };
        favorites = new Set(['p1', 'p3']); 
        alerts = [
            { productId: 'p4', targetPrice: 70.00, promo: true },
            { productId: 'p5', targetPrice: 110.00, promo: false }
        ]; 
        addresses = [
            { id: 'addr_1', alias: 'Casa', street: 'Av. Paseo de la Reforma 222', default: true },
            { id: 'addr_2', alias: 'Oficina', street: 'Insurgentes Sur 105', default: false }
        ];
        savedLists = [
            { 
                name: "Súper de Lunes", 
                items: [
                    {product: currentData[0], quantity: 1}, 
                    {product: currentData[1], quantity: 2}, 
                    {product: currentData[4], quantity: 1}
                ].filter(i => i.product !== undefined) 
            },
            { 
                name: "Limpieza del Mes", 
                items: [
                    {product: currentData[2], quantity: 1}, 
                    {product: currentData[3], quantity: 1}
                ].filter(i => i.product !== undefined) 
            }
        ].filter(list => list.items.length > 0);
        cart = [];
        saveState();
    }
};

// Currency Formatter
const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(num);
};

// Fuzzy Merging Algorithm for External Scraping
const mergeProducts = (products) => {
    const merged = [];
    
    // Busca patrones amplios de súper: 3l, 500g, 18 rollos, 90 pañuelos, etc.
    const sizeRegex = /([0-9.,]+)\s*(ml|l|lt|g|kg|grs|gr|mg|oz|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas)/i;
    // Buscar cantidades de piezas (12 pack, 6 botellas, etc)
    const qtyRegex = /(?:([0-9]+)\s*(?:pack|botellas|latas|piezas|pz|pzas|x))/i;

    const extractSize = (title) => {
        const match = title.toLowerCase().match(sizeRegex);
        if (!match) return null;
        let num = match[1].replace(/\s/g, '');
        let unit = match[2].replace('grs', 'g').replace('gr', 'g').replace('lt', 'l');
        return num + unit;
    };
    
    const extractQuantity = (title) => {
        const match = title.toLowerCase().match(qtyRegex);
        return match ? parseInt(match[1]) : 1; 
    };

    const getTokens = (title) => {
        let clean = title.toLowerCase().replace(sizeRegex, ' ').replace(qtyRegex, ' ');
        clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return clean.replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
    };

    for (const p of products) {
        const pSize = extractSize(p.title);
        const pQty = extractQuantity(p.title);
        const pTokens = getTokens(p.title);
        
        let foundMatch = null;
        for (const existing of merged) {
            const exSize = extractSize(existing.title);
            const exQty = extractQuantity(existing.title);
            
            // Regla estricta 1: Si difieren en volumen/tamaño empírico, NO se fusionan
            if (pSize && exSize && pSize !== exSize) continue;
            
            // Regla estricta 2: Si difieren en cantidad de piezas en el empaque, NO se fusionan
            if (pQty !== exQty) continue;

            const exTokens = getTokens(existing.title);
            
            // Calculo de similitud: Intersección sobre la longitud mínima
            const intersection = pTokens.filter(t => exTokens.includes(t)).length;
            const minTokens = Math.min(pTokens.length, exTokens.length);
            
            // Si provienen de la misma tienda, requieren un umbral muy alto para evitar fusionar variaciones del mismo catálogo
            const pStores = p.offers ? p.offers.map(o => o.store) : [];
            const exStores = existing.offers ? existing.offers.map(o => o.store) : [];
            const sharesStore = pStores.some(s => exStores.includes(s));
            
            const threshold = sharesStore ? 0.85 : 0.55;

            if (minTokens > 0 && (intersection / minTokens >= threshold)) {
                foundMatch = existing;
                break;
            }
        }
        
        if (foundMatch) {
            foundMatch.offers.push(...p.offers);
            // Siempre dar preferencia gráfica a las fotografías de Chedraui sobre las de Soriana
            if (p.source === 'chedraui' && p.image) {
                foundMatch.image = p.image;
            }
        } else {
            merged.push({ ...p, offers: [...p.offers] });
        }
    }
    return merged;
};

// Process Data to find best pricing
const processProducts = (productList) => {
    const city = document.getElementById('globalCitySelector')?.value || 'default';
    const activeStoresInCity = CITY_STORES[city.toLowerCase()] || CITY_STORES.default;

    return productList.map(item => {
        // Filter offers to keep only the ones present in the selected city/region
        const localOffers = (item.offers || []).filter(o => activeStoresInCity.includes(o.store));

        // Deduplicate multiple variants from the same store (pick cheapest)
        const storeMap = new Map();
        for (const o of localOffers) {
            const currentTotal = (o.price ?? Infinity) + (o.shipping ?? 0);
            if (!storeMap.has(o.store)) {
                storeMap.set(o.store, { raw: o, total: currentTotal });
            } else {
                if (currentTotal < storeMap.get(o.store).total) {
                    storeMap.set(o.store, { raw: o, total: currentTotal });
                }
            }
        }
        const uniqueOffers = Array.from(storeMap.values()).map(x => x.raw);

        const sortedOffers = uniqueOffers.sort((a, b) => {
            const totalA = (a.price ?? Infinity) + (a.shipping ?? 0);
            const totalB = (b.price ?? Infinity) + (b.shipping ?? 0);
            return totalA - totalB;
        });
        const bestOffer = sortedOffers[0];
        return { ...item, bestOffer, sortedOffers };
    });
};

/* --- USER & PROFILE LOGIC --- */
const renderUserNav = () => {
    if(!user) {
        userNavControl.innerHTML = '<button class="btn-login" id="reopenLoginBtn">Iniciar Sesión</button>';
        document.getElementById('reopenLoginBtn').addEventListener('click', () => loginModal.classList.add('active'));
    } else {
        userNavControl.innerHTML = `
            <button class="btn-user-logged" id="openProfileBtn">
                <i data-lucide="user-circle" style="width: 20px;"></i> <span class="nav-user-name">${user.name}</span>
            </button>
        `;
        document.getElementById('openProfileBtn').addEventListener('click', () => {
            profileNameDisplay.innerText = `Hola, ${user.name}`;
            profileModal.classList.add('active');
            renderProfileTab();
        });
    }
    safeCreateIcons();
};

window.toggleFavorite = (e, id) => {
    e.stopPropagation();
    if(!user) return loginModal.classList.add('active'); // Must be logged in

    if(favorites.has(id)) favorites.delete(id);
    else favorites.add(id);

    saveState();
    renderProducts(currentData); // re-render to update icon states
    if(profileModal.classList.contains('active')) renderProfileTab();
};

window.toggleAlert = (e, id) => {
    e.stopPropagation();
    if(!user) return loginModal.classList.add('active'); // Must be logged in

    let alertIdx = alerts.findIndex(a => a.productId === id);
    if(alertIdx > -1) {
        alerts.splice(alertIdx, 1);
        saveState();
        renderProducts(currentData);
        if(profileModal.classList.contains('active')) renderProfileTab();
    } else {
        openAlertModal(id);
    }
};

const openAlertModal = (id) => {
    const product = allData.find(p => p.id === id);
    currentAlertProductId = id;
    alertProductImage.src = product.image;
    alertProductTitle.innerText = product.title;
    alertProductPrice.innerText = formatCurrency(product.bestOffer.price);
    alertPriceInput.value = Math.floor(product.bestOffer.price * 0.9); // Sugerir 10% menos
    
    alertModal.classList.add('active');
    safeCreateIcons();
};

saveAlertBtn.addEventListener('click', async () => {
    const targetPrice = parseFloat(alertPriceInput.value);
    const promo = alertPromoInput.checked;
    
    if(!targetPrice || isNaN(targetPrice)) {
       return showToast('Por favor introduce un precio numérico válido.', 'warning');
    }
    
    const product = allData.find(p => p.id === currentAlertProductId);
    if (!product) return showToast('Error: Producto no encontrado en caché.', 'error');

    saveAlertBtn.innerHTML = 'Guardando <span style="display:inline-block; animation:spin 1s linear infinite;">↻</span>';
    saveAlertBtn.style.opacity = '0.7';
    saveAlertBtn.style.pointerEvents = 'none';

    // 1. Guardar en Base de Datos de Supabase
    if (AuthService.isReady()) {
        const { error } = await AuthService.saveAlert(product, targetPrice, promo);
        if (error) {
            saveAlertBtn.innerHTML = 'Activar Alarma';
            saveAlertBtn.style.opacity = '1';
            saveAlertBtn.style.pointerEvents = 'auto';
            if (error.message.includes('Inicia sesión')) {
               alertModal.classList.remove('active');
               return loginModal.classList.add('active'); // Cierra alerta, abre login
            }
            return showToast(error.message, 'error');
        }
    }
    
    // 2. Insertar en capa visual local y purgar UI
    alerts.push({ productId: currentAlertProductId, targetPrice, promo });
    saveState();
    
    saveAlertBtn.innerHTML = 'Activar Alarma';
    saveAlertBtn.style.opacity = '1';
    saveAlertBtn.style.pointerEvents = 'auto';
    alertModal.classList.remove('active');
    
    showToast('Alerta vinculada exitosamente', 'success');
    renderProducts(currentData);
    if(profileModal.classList.contains('active')) renderProfileTab();
});

// Addresses Logic
const addressModal = document.getElementById('addressModal');
const closeAddressModal = document.getElementById('closeAddressModal');
const saveAddressModalBtn = document.getElementById('saveAddressModalBtn');
const inAlias = document.getElementById('addressAliasInput');
const inStreet = document.getElementById('addressStreetInput');
const inCp = document.getElementById('addressCpInput');
const inColonia = document.getElementById('addressColoniaInput');
const inNotes = document.getElementById('addressNotesInput');

window.promptNewAddress = () => {
    inAlias.value = '';
    inStreet.value = '';
    inCp.value = '';
    inColonia.value = '';
    inNotes.value = '';
    addressModal.classList.add('active');
};

closeAddressModal.addEventListener('click', () => {
    addressModal.classList.remove('active');
});
addressModal.addEventListener('click', (e) => { if (e.target === addressModal) addressModal.classList.remove('active'); });

saveAddressModalBtn.addEventListener('click', () => {
    const alias = inAlias.value.trim();
    const street = inStreet.value.trim();
    const cp = inCp.value.trim();
    const colonia = inColonia.value.trim();
    const notes = inNotes.value.trim();
    
    if(!alias || !street || !cp) return showToast('Por favor llena: Alias, Calle y C.P.', 'warning');
    
    let fullStreet = `${street}, Col. ${colonia}, C.P. ${cp}`;
    if(notes) fullStreet += ` (Instrucciones: ${notes})`;

    addresses.push({ id: 'addr_'+Date.now(), alias, street: fullStreet, default: addresses.length === 0 });
    saveState();
    renderProfileTab();
    addressModal.classList.remove('active');
});
window.setDefaultAddress = (id) => {
    addresses.forEach(a => a.default = (a.id === id));
    saveState();
    renderProfileTab();
};
window.deleteAddress = (id) => {
    addresses = addresses.filter(a => a.id !== id);
    if(addresses.length > 0 && !addresses.some(a => a.default)) {
        addresses[0].default = true;
    }
    saveState();
    renderProfileTab();
};

const storeFiltersContainer = document.getElementById('storeFiltersContainer');
const initStoreFilters = () => {
    const city = document.getElementById('globalCitySelector')?.value || 'default';
    const activeStoresInCity = CITY_STORES[city.toLowerCase()] || CITY_STORES.default;
    const liveStoreKeys = Object.keys(stores).filter(k => stores[k].live && activeStoresInCity.includes(k));
    storeFiltersContainer.innerHTML = liveStoreKeys.map(k => `
        <button onclick="toggleStoreFilter('${k}')" class="btn-outline" style="border-radius: 99px; padding: 0.25rem 0.75rem; font-size: 0.8rem; flex:none; user-select:none; transition:var(--transition); display:flex; align-items:center; gap:0.25rem; background: ${activeStoreFilters.has(k) ? stores[k].bgColor : 'transparent'}; color: ${activeStoreFilters.has(k) ? stores[k].color : 'var(--text-secondary)'}; border-color: ${activeStoreFilters.has(k) ? 'transparent' : 'var(--border-color)'};">
            <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background-color: ${stores[k].bgColor}; color: ${stores[k].color};">${stores[k].logo}</span> ${stores[k].name}
        </button>
    `).join('');
};

window.toggleStoreFilter = (storeKey) => {
    if(activeStoreFilters.has(storeKey)) activeStoreFilters.delete(storeKey);
    else activeStoreFilters.add(storeKey);
    initStoreFilters();
    CatalogState.resetPage();
    renderProducts(currentData);
};

// Home Nav Button
document.getElementById('homeNavBtn').addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    currentData = allData;
    activeStoreFilters.clear();
    initStoreFilters();
    CatalogState.resetPage();
    renderProducts(allData);
    document.getElementById('pdpPage').classList.remove('active');
    document.getElementById('mainCatalog').style.display = 'block';
    document.querySelector('.hero-section').style.display = 'block';
    
    // Reset search animation if exist
    const htg = document.getElementById('heroTextGroup');
    if (htg) htg.classList.remove('hero-text-hidden');
    const hs = document.querySelector('.hero-section');
    if (hs) hs.classList.remove('hero-compact');
    if(cartModal.classList.contains('active')) cartModal.classList.remove('active');
    if(profileModal.classList.contains('active')) profileModal.classList.remove('active');
    window.scrollTo({top: 0, behavior: 'smooth'});
});

const renderProfileTab = () => {
    profileContentArea.innerHTML = '';
    
    if (activeTab === 'listas') {
        if(savedLists.length === 0) {
            profileContentArea.innerHTML = '<p style="color:var(--text-tertiary); text-align:center; padding-top: 2rem;">No tienes listas guardadas aún.</p>';
            return;
        }
        
        profileContentArea.innerHTML = savedLists.map((list, idx) => `
            <div class="my-list-card" onclick="loadListToCart(${idx})" style="margin: 0.5rem; margin-bottom: 1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 0.5rem;">
                    <h3 style="font-size: 1.1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="list-checks" style="width:18px; color:var(--accent-color);"></i> ${list.name}</h3>
                    <span class="best-price-badge" style="position:static; margin:0; padding: 0.1rem 0.5rem;">${list.items.length} arts.</span>
                </div>
                <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom: 1rem;">
                    ${list.items.slice(0,3).map(i => (i.product && i.product.title) ? i.product.title.split(' ')[0] : 'Producto').join(', ')}...
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <button class="btn-outline" style="width: 100%;">Cargar Canasta</button>
                    <button onclick="event.stopPropagation(); deleteList(${idx});" class="btn-outline" style="padding: 0.75rem; border-color: transparent;"><i data-lucide="trash-2" style="width:18px;"></i></button>
                </div>
            </div>
        `).join('');
    } else if (activeTab === 'direcciones') {
        profileContentArea.innerHTML = `
            <div style="margin-bottom: 1.5rem; padding: 0 0.5rem;">
                <button onclick="promptNewAddress()" style="width: 100%; border: 2px dashed var(--border-color); background: var(--bg-tertiary); padding: 1.5rem; font-size: 1rem; color: var(--text-secondary); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;" onmouseover="this.style.borderColor='var(--accent-color)'; this.style.color='var(--accent-color)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-secondary)';">
                    <div style="background:var(--bg-secondary); padding:0.6rem; border-radius:50%; display:flex; align-items:center; justify-content:center; color: var(--text-primary);">
                        <i data-lucide="plus" style="width:20px; height:20px;"></i>
                    </div>
                    <span style="font-weight:600; color:var(--text-primary);">Agregar Nueva Dirección</span>
                </button>
            </div>
        ` + (addresses.length === 0 ? '<p style="color:var(--text-tertiary); text-align:center; padding-top: 1rem;">No tienes direcciones guardadas.</p>' : 
        addresses.map(a => `
            <div class="my-list-card" style="margin: 0.5rem; margin-bottom: 1rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 0.2rem;">
                    <h3 style="font-size: 1rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="${a.default ? 'check-circle' : 'map-pin'}" style="width:16px; color:var(--accent-color);"></i> ${a.alias} ${a.default ? '<span style="font-size:0.7rem; color:var(--success); font-weight:normal;">(Próx. Entregas)</span>' : ''}</h3>
                </div>
                <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom: 1rem; margin-top: 0.5rem;">
                    ${a.street}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                   ${!a.default ? `<button onclick="setDefaultAddress('${a.id}')" class="btn-outline" style="width: 100%; border-color:var(--accent-color); color:var(--accent-color);">Fijar Entrega</button>` : `<div style="flex:1;"></div>`}
                   <button onclick="deleteAddress('${a.id}')" class="btn-outline" style="padding: 0.75rem; border-color: transparent;"><i data-lucide="trash-2" style="width:18px;"></i></button>
                </div>
            </div>
        `).join(''));
        safeCreateIcons();
    } else if (activeTab === 'ahorros') {
        renderSavingsDashboard();
    } else {
        const isFavorites = activeTab === 'favoritos';
        const rawIds = isFavorites ? Array.from(favorites) : alerts.map(a => a.productId);
        const itemsArray = rawIds.map(id => allData.find(p => p.id === id)).filter(Boolean);

        if(itemsArray.length === 0) {
            profileContentArea.innerHTML = `<p style="color:var(--text-tertiary); text-align:center; padding-top: 2rem;">No tienes productos en ${activeTab}.</p>`;
            return;
        }

        profileContentArea.innerHTML = itemsArray.map(item => {
            let extraInfoHTML = `<div style="font-size: 0.8rem; color: var(--text-secondary)">Mejor precio indiv: ${formatCurrency(item.bestOffer.price)}</div>`;
            
            if(!isFavorites) {
                const alertData = alerts.find(a => a.productId === item.id);
                extraInfoHTML = `<div style="font-size: 0.8rem; color: var(--text-secondary)">
                    Alerta en: <strong style="color: var(--accent-color);">${formatCurrency(alertData.targetPrice)}</strong>
                    ${alertData.promo ? '<br><span style="color:var(--text-tertiary); font-size:0.75rem;">+ Buscando Ofertas 2x1</span>' : ''}
                </div>`;
            }

            return `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/150'}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2322c55e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'9\' cy=\'21\' r=\'1\'/><circle cx=\'20\' cy=\'21\' r=\'1\'/><path d=\'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6\'/></svg>'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    ${extraInfoHTML}
                </div>
                <button onclick="openProductModal('${item.id}')" class="btn-outline" style="border:1px solid var(--border-color); padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 4px;">Ver</button>
            </div>
            `;
        }).join('');
    }
    
    safeCreateIcons();
};

/* --- RENDER PRODUCTS --- */
const renderProducts = (data) => {
    resultsGrid.innerHTML = '';
    
    let displayData = data.map(product => {
        let sorted = product.sortedOffers;
        if(activeStoreFilters.size > 0) {
            sorted = product.sortedOffers.filter(o => activeStoreFilters.has(o.store));
        }
        if(sorted.length === 0) return null;
        return { ...product, displayBestOffer: sorted[0] };
    }).filter(p => p !== null);

    const totalCalculated = displayData.length;
    displayData = displayData.slice((currentPage - 1) * currentSearchLimit, currentPage * currentSearchLimit);

    if (displayData.length === 0) {
        resultsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">No se encontraron productos en las tiendas seleccionadas.</p>';
        return;
    }
    
    displayData.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const bestStore = stores[product.displayBestOffer.store] || { name: product.displayBestOffer.store, logo: '?', color: '#fff', bgColor: '#999' };

        const isFav = favorites.has(product.id);
        const isAlert = alerts.some(a => a.productId === product.id);
        
        const hasPromo = product.displayBestOffer.list_price && product.displayBestOffer.list_price > product.displayBestOffer.price;
        const discountPct = hasPromo ? Math.round((1 - product.displayBestOffer.price / product.displayBestOffer.list_price) * 100) : 0;
        
        card.innerHTML = `
            <div class="product-image-container" onclick="openProductModal('${product.id}')">
                <div class="product-actions-overlay" style="z-index: 10;">
                    <button class="icon-action-btn ${isFav ? 'active' : ''}" title="Favorito" onclick="toggleFavorite(event, '${product.id}')">
                        <i data-lucide="heart" style="width: 16px;"></i>
                    </button>
                    <button class="icon-action-btn ${isAlert ? 'active' : ''}" title="Alerta de precio" onclick="toggleAlert(event, '${product.id}')">
                        <i data-lucide="bell" style="width: 16px;"></i>
                    </button>
                </div>
                ${hasPromo ? `<span style="position: absolute; top:0.5rem; left:0.5rem; background:#cc0000; color:white; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:4px; z-index:5;">-${discountPct}%</span>` : ''}
                ${product.image
                    ? `<img src="${product.image}" alt="${product.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div style="display:none; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--bg-secondary) 0%,var(--bg-tertiary) 100%); color:var(--accent-color); font-weight:700; font-size:1.1rem; gap:8px;">
                           <div class="m4u-float" style="display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%; background:rgba(34,197,94,0.1);">
                               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                           </div>
                           <span style="font-size:0.85rem; font-weight:600; letter-spacing:-0.3px; color:var(--text-primary);">Market<span style="color:var(--accent-color); font-weight:800;">4U</span></span>
                       </div>`
                    : `<div style="display:flex; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--bg-secondary) 0%,var(--bg-tertiary) 100%); color:var(--accent-color); font-weight:700; font-size:1.1rem; gap:8px;">
                           <div class="m4u-float" style="display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%; background:rgba(34,197,94,0.1);">
                               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                           </div>
                           <span style="font-size:0.85rem; font-weight:600; letter-spacing:-0.3px; color:var(--text-primary);">Market<span style="color:var(--accent-color); font-weight:800;">4U</span></span>
                       </div>`
                }
                <div class="best-price-badge" style="${product.source === 'mercadolibre' ? 'background:#ffe600; color:#2d3277;' : ''}">
                    <i data-lucide="tag" style="width:12px; height:12px;"></i> ${product.source === 'mercadolibre' ? 'Mercado Libre' : 'Mejor Precio'}
                </div>
            </div>
            
            <div class="product-details">
                <div style="cursor: pointer;" onclick="openProductModal('${product.id}')">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price-section" style="flex-direction:column; align-items:flex-start; gap:0.2rem;">
                        <span class="price-label">${product.displayBestOffer.price ? 'Desde' : ''}</span>
                        <div style="display:flex; align-items:center; justify-content: space-between; width: 100%;">
                            ${product.displayBestOffer.price
                                ? `<span class="best-price">${formatCurrency(product.displayBestOffer.price)}</span>
                                   <div style="display:flex; gap:0.25rem;">
                                      ${product.sortedOffers.slice(0,3).map(o => {
                                         const s = stores[o.store] || { name: o.store, logo: '?', color: '#666', bgColor: '#eee' };
                                         if(!s) return '';
                                         return `<div class="store-logo-small" title="${formatCurrency(o.price)}" style="background-color: ${s.bgColor}; color: ${s.color}; font-size:0.7rem; width:22px; height:22px;">${s.logo}</div>`;
                                      }).join('')}
                                      ${product.sortedOffers.length > 3 ? `<div class="store-logo-small" style="background:#eee; color:#666; font-size:0.7rem; width:22px; height:22px;">+</div>` : ''}
                                   </div>`
                                : `<a href="${product.permalink || product.displayBestOffer.url || '#'}" target="_blank"
                                      style="font-size:0.85rem; color:var(--accent-color); font-weight:600; text-decoration:none; display:flex; align-items:center; gap:4px;"
                                      onclick="event.stopPropagation()">
                                      <div class="store-logo-small" style="background-color:${bestStore.bgColor}; color:${bestStore.color}">${bestStore.logo}</div>
                                      Ver precio en ML &rarr;
                                   </a>`
                            }
                        </div>
                    </div>
                </div>
                <button class="btn-add-list" onclick="addToCart('${product.id}')">
                    <i data-lucide="plus" style="width: 16px;"></i> Agregar a Carrito
                </button>
            </div>
        `;
        resultsGrid.appendChild(card);
    });

    // Add True Pagination Controls at the end of the grid
    if (typeof searchInput !== 'undefined') {
        const q = searchInput.value.toLowerCase().trim();
        if (q.length >= 3) {
            const hasMoreLocal = (currentPage * currentSearchLimit) < totalCalculated;
            
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = "grid-column: 1/-1; display:flex; justify-content:center; align-items:center; gap: 1rem; padding: 2rem 0;";
            
            let html = ``;
            if (currentPage > 1) {
                html += `<button class="btn-outline" onclick="window.prevPage()" style="padding: 0.6rem 1.5rem; border-radius: 20px; font-weight:600;"><i data-lucide="chevron-left" style="width:18px; vertical-align:middle; margin-right:4px;"></i> Anterior</button>`;
            }
            
            html += `<span style="font-weight:bold; color:var(--text-secondary);">Página ${currentPage}</span>`;
            
            // We always show Next if there's any data, because our backend might have more.
            // But if displayData is exactly 0 and it's not page 1, maybe we hide Next.
            if (displayData.length > 0) {
                 html += `<button class="btn-primary" onclick="window.nextPage()" style="padding: 0.6rem 1.5rem; border-radius: 20px; font-weight:600;">Siguiente <i data-lucide="chevron-right" style="width:18px; vertical-align:middle; margin-left:4px;"></i></button>`;
            }
            
            btnContainer.innerHTML = html;
            resultsGrid.appendChild(btnContainer);
            
            window.prevPage = () => {
                if (currentPage > 1) {
                    currentPage--;
                    applyFilters();
                    document.getElementById('resultsTitle')?.scrollIntoView({ behavior: 'smooth' });
                }
            };
            
            window.nextPage = () => {
                const hasMoreLocal = (currentPage * currentSearchLimit) < totalCalculated;
                currentPage++;
                if (hasMoreLocal) {
                    // Ya tenemos los datos en memoria, solo re-renderizamos.
                    applyFilters();
                    document.getElementById('resultsTitle')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                    // No tenemos los datos, llamamos a Vercel para expandir allData
                    currentOffset += currentSearchLimit; 
                    runMLSearch(q, true);
                    document.getElementById('resultsTitle')?.scrollIntoView({ behavior: 'smooth' });
                }
            };
        }
    }
    
    safeCreateIcons();
};

/* --- CART LOGIC --- */
window.addToCart = (productId, qty = 1) => {
    const p = allData.find(x => x.id === productId);
    if(p) {
        const fetchQty = parseInt(qty) || 1;
        const exist = cart.find(c => c.product.id === productId);
        if(exist) exist.quantity += fetchQty;
        else cart.push({ product: p, quantity: fetchQty });
        saveState();
        updateCartUI();
        cartCount.style.transform = 'scale(1.5)';
        setTimeout(() => { cartCount.style.transform = 'scale(1)'; }, 200);
        showToast(`${p.title} añadido al carrito`, 'success', 2000);
    }
};

window.updateCartQty = (index, delta) => {
    if(cart[index]) {
        cart[index].quantity += delta;
        if(cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveState();
        updateCartUI();
    }
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    saveState();
    updateCartUI();
};

window.loadListToCart = (listIndex) => {
    cart = savedLists[listIndex].items.map(item => ({ product: item.product, quantity: item.quantity }));
    saveState();
    updateCartUI();
    profileModal.classList.remove('active');
    cartModal.classList.add('active'); 
};

window.deleteList = (idx) => {
    savedLists.splice(idx, 1);
    saveState();
    renderProfileTab();
};

const updateCartUI = () => {
    cartCount.innerText = cart.reduce((acc, current) => acc + current.quantity, 0);
    if(cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color:var(--text-tertiary); text-align:center; padding-top: 2rem;">Tu carrito está vacío.</p>';
        cartTotalsContainer.innerHTML = '';
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map((citem, idx) => `
        <div class="cart-item">
            <img src="${citem.product.image || 'https://via.placeholder.com/150'}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2322c55e\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'9\' cy=\'21\' r=\'1\'/><circle cx=\'20\' cy=\'21\' r=\'1\'/><path d=\'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6\'/></svg>'">
            <div class="cart-item-info">
                <div class="cart-item-title">${citem.product.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary)">Mejor precio indiv: ${formatCurrency(citem.product.bestOffer.price)}</div>
                
                <div class="qty-controls" style="margin-top:0.75rem; display:flex; align-items:center; gap:10px;">
                    <button onclick="updateCartQty(${idx}, -1)" class="btn-qty">-</button>
                    <span style="font-weight:600; font-size:0.9rem; min-width:20px; text-align:center;">${citem.quantity}</span>
                    <button onclick="updateCartQty(${idx}, 1)" class="btn-qty">+</button>
                </div>
            </div>
            <button onclick="removeFromCart(${idx})" style="background:none; border:none; cursor:pointer; color:var(--text-tertiary); margin-left: 0.5rem;">
                <i data-lucide="trash-2" style="width:18px;"></i>
            </button>
        </div>
    `).join('');
    
    const storeTotals = {};
    Object.keys(stores).forEach(key => storeTotals[key] = { cost: 0, missing: 0 });
    
    // Calcular costo multiplicador
    const totalItems = cart.reduce((acc, citem) => acc + citem.quantity, 0);
    
    cart.forEach(citem => {
        const offers = citem.product.offers || [];
        Object.keys(stores).forEach(storeKey => {
            const offer = offers.find(o => o.store === storeKey);
            if(offer) storeTotals[storeKey].cost += (offer.price * citem.quantity);
            else storeTotals[storeKey].missing += citem.quantity;
        });
    });
    
    // Sumar envío plano base (Mock) para fines de calculo de la tienda ganadora
    Object.keys(stores).forEach(storeKey => {
        if(storeTotals[storeKey].cost > 0) storeTotals[storeKey].cost += 49; 
    });
    
    // Filtrar los que no tienen todos los productos de la lista
    const validStoreKeys = Object.keys(storeTotals).filter(k => storeTotals[k].missing < totalItems);
    const sortedTotals = validStoreKeys.map(k => ({
        storeKey: k,
        store: stores[k],
        total: storeTotals[k].cost,
        missing: storeTotals[k].missing
    })).sort((a,b) => {
        if(a.missing !== b.missing) return a.missing - b.missing;
        return a.total - b.total;
    });
    
    cartTotalsContainer.innerHTML = sortedTotals.map((t, idx) => {
        const isWinner = idx === 0 && t.missing === 0;
        const missingText = t.missing > 0 ? `<span style="color: var(--danger, red); font-size: 0.75rem;">(Falta ${t.missing} art.)</span>` : `<span style="color: var(--success); font-size: 0.75rem;">(Ticket Completo)</span>`;
        return `
            <div class="total-row ${isWinner ? 'winner' : ''}">
                <div style="display:flex; align-items:center; gap: 0.4rem; font-weight: 500; font-size: 0.85rem;">
                    <div class="store-logo-small" style="background-color: ${t.store.bgColor}; color: ${t.store.color}; margin:0; width:20px; height:20px; font-size:rem;">
                        ${t.store.logo}
                    </div>
                    ${t.store.name}
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap: 0.2rem;">
                    <div style="text-align: right; line-height:1.2;">
                        <strong style="font-size:0.95rem; ${isWinner? 'color:var(--success)' : ''}">${formatCurrency(t.total)}</strong><br>
                        ${missingText}
                    </div>
                    <button onclick="startRedirect('${t.storeKey}', true)" class="btn-goto" style="font-size: 0.7rem; padding: 0.25rem 0.5rem; width: 100%; border: none; cursor: pointer; border-radius: var(--radius-sm);">Comprar Aquí</button>
                </div>
            </div>
        `;
    }).join('');
    safeCreateIcons();
};

/* --- SAVED LISTS LOGIC --- */
const saveListModal = document.getElementById('saveListModal');

// Sincronizar listas desde Supabase al perfil local
const syncListsFromSupabase = async () => {
    if (!user?.id || !ListsService) return;
    const { data, error } = await ListsService.getAll(user.id);
    if (error || !data) return;
    const remoteLists = data.map(row => ({
        id: row.id,
        name: row.name,
        items: (row.items || []).map(i => {
            if (!i.product) return null;
            // Buscar por el ml_id o el id canónico del producto en allData
            let product = allData.find(p => p.id === i.product.ml_id || p.ml_id === i.product.ml_id || p.id === i.product.id);
            if (!product) {
                // Reconstruir un producto fallback para evitar descartarlo de la lista
                product = {
                    id: i.product.ml_id || i.product.id,
                    ml_id: i.product.ml_id,
                    title: i.product.title,
                    image: i.product.thumbnail || 'https://via.placeholder.com/150',
                    thumbnail: i.product.thumbnail || 'https://via.placeholder.com/150',
                    brand: i.product.brand || '',
                    category: i.product.category || 'Supermercado',
                    bestOffer: { price: 0, store: 'desconocido' },
                    sortedOffers: [],
                    offers: []
                };
            }
            return { product, quantity: i.quantity || 1 };
        }).filter(Boolean)
    })).filter(l => l.items.length > 0);
    
    // Combinar listas locales existentes y listas remotas evitando duplicar nombres
    const mergedLists = [...remoteLists];
    for (const localList of savedLists) {
        if (!mergedLists.some(l => l.name.toLowerCase() === localList.name.toLowerCase())) {
            mergedLists.push(localList);
        }
    }
    
    savedLists = mergedLists;
    saveState();
    renderProfileTab();
};

document.getElementById('openSaveListPopupBtn').addEventListener('click', () => {
    if(!user) { loginModal.classList.add('active'); return; }
    if(cart.length === 0) { showToast('Tu carrito está vacío.', 'warning'); return; }
    document.getElementById('listNameInput').value = '';
    saveListModal.classList.add('active');
    safeCreateIcons();
});

document.getElementById('closeSaveListModal').addEventListener('click', () => {
    saveListModal.classList.remove('active');
});

saveListModal.addEventListener('click', (e) => {
    if(e.target === saveListModal) saveListModal.classList.remove('active');
});

saveListBtn.addEventListener('click', async () => {
    if(cart.length === 0) return showToast('Tu carrito está vacío.', 'warning');
    const name = listNameInput.value.trim() || 'Mi Super Custom';
    const newList = { name, items: [...cart] };
    savedLists.push(newList);
    
    listNameInput.value = '';
    saveListModal.classList.remove('active');
    cartModal.classList.remove('active');
    saveState();
    showToast(`Lista "${name}" guardada correctamente`, 'success');
    
    // Guardar en Supabase si hay sesión
    if (user?.id && typeof ListsService !== 'undefined') {
        const supabaseItems = cart.map(c => ({ product: c.product, quantity: c.quantity }));
        await ListsService.save(user.id, name, supabaseItems);
    }
    
    profileModal.classList.add('active');
    activeTab = 'listas';
    tabBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="listas"]').classList.add('active');
    renderProfileTab();
});

/* --- SINGLE PRODUCT MODAL --- */
window.openProductModal = async (id, tab = 'stores') => {
    console.info('MODAL CLICK INTERCEPTED! KICKING OFF FOR ID:', id);
    try {
        const product = allData.find(x => x.id === id || String(x.id) === String(id));
        if(!product) {
            alert('CRITICAL MATCH ERROR: Producto no encontrado en memoria. ID buscado: [' + id + ']. Total en DB actual: ' + allData.length);
            return;
        }
        
        const tabsHTML = `
            <div class="pdp-tabs-container">
                <button class="pdp-tab-btn ${tab === 'stores' ? 'active' : ''}" onclick="openProductModal('${id}', 'stores')"><i data-lucide="store" style="width:16px; margin-right:4px;"></i> Comparar Tiendas</button>
                <button class="pdp-tab-btn ${tab === 'brands' ? 'active' : ''}" onclick="openProductModal('${id}', 'brands')"><i data-lucide="tags" style="width:16px; margin-right:4px;"></i> Comparar Marcas</button>
            </div>
        `;

        let dynamicContentHTML = '';

        if (tab === 'stores') {
            const tableRows = product.sortedOffers.map((offer, index) => {
                const store = stores[offer.store] || { name: offer.store, logo: '?', color: '#fff', bgColor: '#999' };
                const isBest = index === 0;
                const total = offer.price + offer.shipping;
                const hasPromoOffer = offer.list_price && offer.list_price > offer.price;
                const discountPctOffer = hasPromoOffer ? Math.round((1 - offer.price / offer.list_price) * 100) : 0;
                
                return `
                    <tr class="${isBest ? 'best-row' : ''}">
                        <td>
                            <div class="store-cell">
                                <div class="store-badge" style="background-color: ${store.bgColor}; color: ${store.color}">${store.logo}</div>
                                ${store.name}
                            </div>
                        </td>
                        <td class="price-cell">
                            ${hasPromoOffer ? `<span style="display:block; font-size:0.7rem; color:var(--text-tertiary); text-decoration:line-through; line-height:1;">${formatCurrency(offer.list_price)}</span>` : ''}
                            <div style="display:flex; align-items:center; gap:0.3rem;">
                                <span>${formatCurrency(offer.price)}</span>
                                ${hasPromoOffer ? `<span style="font-size:0.7rem; background:#cc0000; color:white; padding:1px 4px; border-radius:3px; font-weight:bold;">-${discountPctOffer}%</span>` : ''}
                            </div>
                        </td>
                        <td class="shipping-cell">${offer.shipping === 0 ? '<span style="color:var(--success); font-weight:600;">Gratis</span>' : formatCurrency(offer.shipping)}</td>
                        <td class="delivery-cell">${offer.delivery}</td>
                        <td style="font-weight: 600;">${formatCurrency(total)}</td>
                        <td style="text-align: right;"><button onclick="startRedirect('${offer.store}', false, '${product.id}')" class="btn-goto ${!isBest ? 'outline' : ''}" style="border-radius:var(--radius-sm); border: ${isBest ? 'none' : '1px solid var(--border-color)'}; cursor: pointer;">Ir a Tienda</button></td>
                    </tr>
                `;
            }).join('');
            
            const curP = (product.bestOffer && product.bestOffer.price) || 0;
            
            // Generar las etiquetas y límites de fecha para los últimos 5 meses (incluyendo Hoy)
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const now = new Date();
            let points = [];
            for (let i = 4; i >= 0; i--) {
                let label = '';
                let boundaryDate;
                if (i === 0) {
                    label = 'Hoy';
                    boundaryDate = new Date(now);
                } else {
                    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
                    label = monthNames[d.getMonth()];
                    boundaryDate = d;
                }
                points.push({
                    boundaryDate: boundaryDate,
                    label: label,
                    price: curP
                });
            }
            
            if (typeof MLService !== 'undefined' && MLService.getRealHistory) {
                // Promise race to prevent total freeze if Supabase hangs on auth locks
                const rawHistory = await Promise.race([
                    MLService.getRealHistory(product.ml_id || product.id),
                    new Promise(resolve => setTimeout(() => resolve(null), 1500))
                ]);
                if (rawHistory && rawHistory.length > 0 && product.bestOffer) {
                    // Filter specifically for the history of the winning store
                    const storeHistory = rawHistory.filter(h => h.store_id === product.bestOffer.store);
                    if (storeHistory.length > 0) {
                        // Para cada uno de los 5 puntos, buscar el precio correspondiente a esa fecha límite
                        points.forEach((pt) => {
                            let activePrice = null;
                            for (let idx = storeHistory.length - 1; idx >= 0; idx--) {
                                const entry = storeHistory[idx];
                                const entryDate = new Date(entry.scraped_at);
                                if (entryDate <= pt.boundaryDate) {
                                    activePrice = entry.price;
                                    break;
                                }
                            }
                            if (activePrice === null) {
                                activePrice = storeHistory[0].price;
                            }
                            pt.price = Number(activePrice);
                        });
                    }
                }
            }
            
            const vals = points.map(pt => pt.price);
            const labels = points.map(pt => pt.label);
            
            const maxV = Math.max(...vals) * 1.05;
            const minV = Math.min(...vals) * 0.90;
            const getY = (v) => (maxV === minV) ? 85 : 85 - ((v - minV) / (maxV - minV)) * 65;
            const xCoords = [25, 87.5, 150, 212.5, 275];
            const yCoords = vals.map(getY);
            const linePoints = xCoords.map((x, idx) => `${x},${yCoords[idx]}`).join(' ');
            const areaPoints = `${linePoints} ${xCoords[4]},130 ${xCoords[0]},130`;
            
            dynamicContentHTML = `
                <div class="compare-table-container" style="box-shadow:none; border: 1px solid var(--border-color); margin-bottom: 2rem;">
                    <table class="compare-table">
                        <thead><tr><th>Tienda</th><th>Precio</th><th>Envío</th><th>Entrega</th><th>Total</th><th></th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                
                <div class="price-chart-container" style="margin-top: 0;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i data-lucide="trending-down" style="color:var(--success); width:18px;"></i> Historial Analítico (En Vivo)</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">El precio actual es tu ventana histórica perfecta para comprar.</p>
                    <div style="position:relative; width: 100%; max-width: 480px; margin: 2rem auto 0; padding-bottom: 1rem;">
                        <svg viewBox="0 0 300 135" style="width: 100%; display:block; overflow: visible;">
                            <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--success)" stop-opacity="0.4"></stop><stop offset="100%" stop-color="var(--success)" stop-opacity="0.0"></stop></linearGradient></defs>
                            <polygon points="${areaPoints}" fill="url(#areaGradient)"></polygon>
                            <polyline points="${linePoints}" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
                            ${vals.map((v, i) => `
                                <circle cx="${xCoords[i]}" cy="${yCoords[i]}" r="${i === 4 ? '4.5' : '3.5'}" fill="var(--bg-primary)" stroke="var(--success)" stroke-width="2"></circle>
                                <text x="${xCoords[i]}" y="${yCoords[i] - 12}" text-anchor="middle" font-size="9" fill="var(--text-primary)" font-weight="600" style="font-family: inherit;">$${Math.floor(v)}</text>
                                <text x="${xCoords[i]}" y="${125}" text-anchor="middle" font-size="9" fill="${i === 4 ? 'var(--text-primary)' : 'var(--text-secondary)'}" font-weight="${i === 4 ? '600' : '400'}" style="font-family: inherit;">${labels[i]}</text>
                            `).join('')}
                        </svg>
                    </div>
                </div>
            `;
        } else if (tab === 'brands') {
            const competitors = allData.filter(p => p.category === product.category && p.id !== product.id);
            
            if (competitors.length === 0) {
                dynamicContentHTML = `<p style="padding: 2rem; text-align: center; color: var(--text-tertiary); background: var(--bg-secondary); border-radius: var(--radius-md);">No encontramos marcas competidoras para esta categoría actualmente.</p>`;
            } else {
                dynamicContentHTML = `
                    <div class="brand-compare-grid">
                        ${competitors.map(comp => `
                            <div class="product-card" style="margin:0; box-shadow:none; border:1px solid var(--border-color);">
                                <div class="product-image-container" onclick="openProductModal('${comp.id}', 'brands')">
                                    ${comp.image
                                        ? `<img src="${comp.image}" alt="${comp.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                           <div style="display:none; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--bg-secondary) 0%,var(--bg-tertiary) 100%); color:var(--accent-color); font-weight:700; font-size:1.1rem; gap:8px;">
                                               <div class="m4u-float" style="display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%; background:rgba(34,197,94,0.1);">
                                                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                               </div>
                                               <span style="font-size:0.85rem; font-weight:600; letter-spacing:-0.3px; color:var(--text-primary);">Market<span style="color:var(--accent-color); font-weight:800;">4U</span></span>
                                           </div>`
                                        : `<div style="display:flex; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--bg-secondary) 0%,var(--bg-tertiary) 100%); color:var(--accent-color); font-weight:700; font-size:1.1rem; gap:8px;">
                                               <div class="m4u-float" style="display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%; background:rgba(34,197,94,0.1);">
                                                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                               </div>
                                               <span style="font-size:0.85rem; font-weight:600; letter-spacing:-0.3px; color:var(--text-primary);">Market<span style="color:var(--accent-color); font-weight:800;">4U</span></span>
                                           </div>`
                                    }
                                </div>
                                <div class="product-info" style="padding: 1rem;">
                                    <h3 class="product-title" style="font-size: 0.95rem;">${comp.title}</h3>
                                    <div class="product-price">
                                        <span class="price-amount">${formatCurrency(comp.bestOffer ? comp.bestOffer.price : 0)}</span>
                                    </div>
                                    <button onclick="openProductModal('${comp.id}', 'brands')" class="btn-primary" style="width:100%; margin-top:0.5rem; justify-content:center; padding: 0.5rem; font-size:0.85rem;">Analizar Producto</button>
                                    
                                    <details style="margin-top: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-secondary);">
                                        <summary style="padding: 0.5rem; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; justify-content: space-between; align-items: center; outline: none;">
                                            Ver Precios por Tienda <span style="color:var(--text-tertiary); font-size:0.7rem;">&#9662;</span>
                                        </summary>
                                        <ul style="list-style: none; padding: 0; margin: 0; background: var(--bg-primary); border-top: 1px solid var(--border-color);">
                                            ${(comp.sortedOffers || []).map(coff => {
                                                const hasPromoCoff = coff.list_price && coff.list_price > coff.price;
                                                const coffDiscount = hasPromoCoff ? Math.round((1 - coff.price / coff.list_price) * 100) : 0;
                                                return `
                                                <li style="padding: 0.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); font-size: 0.75rem;">
                                                    <div style="display:flex; align-items:center; gap:0.25rem;">
                                                        <div style="width:12px; height:12px; border-radius:2px; background:${(stores[coff.store]||{bgColor:'#999'}).bgColor};"></div>
                                                        ${(stores[coff.store]||{name:coff.store}).name}
                                                    </div>
                                                    <div style="display:flex; align-items:center; gap:0.3rem;">
                                                        ${hasPromoCoff ? `<span style="text-decoration:line-through; color:var(--text-tertiary); font-size:0.65rem;">${formatCurrency(coff.list_price)}</span> <span style="background:#cc0000; color:white; padding:1px 3px; border-radius:2px; font-weight:bold; font-size:0.65rem;">-${coffDiscount}%</span>` : ''}
                                                        <span style="font-weight:600;">${formatCurrency(coff.price)}</span>
                                                    </div>
                                                </li>
                                                `;
                                            }).join('')}
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }

            const hasPromoModal = product.bestOffer.list_price && product.bestOffer.list_price > product.bestOffer.price;
            const discountPctModal = hasPromoModal ? Math.round((1 - product.bestOffer.price / product.bestOffer.list_price) * 100) : 0;

        pdpContentBody.innerHTML = `
            <div class="pdp-container">
                <div class="pdp-image-col" style="position:relative;">
                    ${hasPromoModal ? `<span style="position: absolute; top:0.5rem; left:0.5rem; background:#cc0000; color:white; font-size:0.85rem; font-weight:700; padding:4px 10px; border-radius:4px; z-index:5;">-${discountPctModal}%</span>` : ''}
                    <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display:none; width:100%; aspect-ratio:1; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--bg-secondary) 0%,var(--bg-tertiary) 100%); color:var(--accent-color); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); margin-bottom:2rem; gap:12px;">
                        <div class="m4u-float" style="display:flex; align-items:center; justify-content:center; width:80px; height:80px; border-radius:50%; background:rgba(34,197,94,0.1);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        </div>
                        <span style="font-size:1.2rem; font-weight:600; letter-spacing:-0.5px; color:var(--text-primary);">Market<span style="color:var(--accent-color); font-weight:800;">4U</span></span>
                    </div>
                    <div class="pdp-desc-box">
                        <h3><i data-lucide="info" style="width:18px;"></i> Detalles del Producto</h3>
                        <p>${product.description || 'Descripción del producto no disponible.'}</p>
                    </div>
                </div>
                
                <div class="pdp-info-col">
                    <span class="product-category" style="margin-bottom:0.5rem; display:inline-block;">${product.category}</span>
                    <h1 class="pdp-title">${product.title}</h1>
                    
                    <div class="pdp-action-bar" style="display:flex; gap: 0.5rem; margin-top: 1.5rem; margin-bottom: 2rem; align-items: stretch;">
                        
                        <div style="display:flex; align-items:center; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-primary);">
                            <button onclick="const q = document.getElementById('pdpQty'); q.value = Math.max(1, (parseInt(q.value) || 1) - 1);" style="padding: 0 0.75rem; border:none; background:none; cursor:pointer; font-size:1.2rem; font-weight:bold; color:var(--text-secondary);">&minus;</button>
                            <input id="pdpQty" type="number" value="1" min="1" style="width: 40px; border:none; background:none; text-align:center; font-weight:600; color:var(--text-primary); outline:none; font-family:inherit; -webkit-appearance: none; margin: 0;" onchange="this.value = Math.max(1, parseInt(this.value) || 1)">
                            <button onclick="const q = document.getElementById('pdpQty'); q.value = (parseInt(q.value) || 1) + 1;" style="padding: 0 0.75rem; border:none; background:none; cursor:pointer; font-size:1.2rem; font-weight:bold; color:var(--text-secondary);">&plus;</button>
                        </div>

                        <button onclick="addToCart('${product.id}', document.getElementById('pdpQty').value)" class="btn-primary" style="flex:1; padding: 0.75rem; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; display:flex; align-items:center; justify-content:center; gap: 0.5rem; font-size:1rem;">
                            <i data-lucide="shopping-cart"></i> Añadir al Carrito
                        </button>
                        <button onclick="toggleFavorite(event, '${product.id}')" class="btn-outline" style="padding: 0.75rem; border-radius: var(--radius-sm); cursor:pointer;"><i data-lucide="heart" fill="${favorites.has(product.id) ? 'currentColor' : 'none'}" color="${favorites.has(product.id) ? 'var(--danger)' : 'currentColor'}"></i></button>
                        <button onclick="toggleAlert(event, '${product.id}')" class="btn-outline" style="padding: 0.75rem; border-radius: var(--radius-sm); cursor:pointer;"><i data-lucide="bell" fill="${alerts.some(a => a.productId === product.id) ? 'currentColor' : 'none'}" color="${alerts.some(a => a.productId === product.id) ? '#eab308' : 'currentColor'}"></i></button>
                    </div>
                    
                    ${tabsHTML}
                    ${dynamicContentHTML}
                </div>
            </div>
        `;
        
        document.querySelector('.hero-section').style.display = 'none';
        document.getElementById('mainCatalog').style.display = 'none';
        pdpPage.classList.add('active');
        
        safeCreateIcons();
        window.scrollTo(0,0);
    } catch(e) {
        alert('ERROR:' + e.message + ' ' + e.stack);
    }
};

/* --- REDIRECT LOGIC --- */
window.startRedirect = (storeKey, isCart, singleProductId = null) => {
    if(cartModal.classList.contains('active')) cartModal.classList.remove('active');

    const store = stores[storeKey] || { name: storeKey, logo: '🛒', color: '#ffffff', bgColor: '#9b9b9b' };
    
    // UI Reset
    redirectStoreLogo.innerHTML = store.logo;
    redirectStoreLogo.style.backgroundColor = store.bgColor;
    redirectStoreLogo.style.color = store.color;
    redirectStoreLogo.style.display = 'flex';
    redirectStoreLogo.style.alignItems = 'center';
    redirectStoreLogo.style.justifyContent = 'center';
    
    redirectTitle.style.display = 'block';
    redirectSubtitle.style.display = 'block';
    redirectSpinner.style.display = 'block';
    redirectSuccess.style.display = 'none';
    
    let itemsToExport = [];
    if (isCart) {
        // Obtenemos los items del carrito global que están disponibles en esta tienda
        itemsToExport = cart.map(citem => {
            const offer = citem.product.offers.find(o => o.store === storeKey);
            if (offer) return { product: citem.product, offer, quantity: citem.quantity };
            return null;
        }).filter(Boolean);
        redirectTitle.innerText = `Armando Canasta en ${store.name}...`;
        redirectSubtitle.innerText = 'Transfiriendo tu lista con los mejores precios garantizados.';
    } else {
        // Caso de comprar un solo item desde el comparador
        const p = currentData.find(x => x.id === singleProductId) || allData.find(x => x.id === singleProductId);
        if (p) {
            const offer = p.offers.find(o => o.store === storeKey) || p.bestOffer;
            itemsToExport = [{ product: p, offer, quantity: 1 }];
        }
        redirectTitle.innerText = `Conectando con ${store.name}...`;
        redirectSubtitle.innerText = 'Asegurando tu mejor precio unitario de afiliado.';
    }
    
    redirectModal.classList.add('active');
    safeCreateIcons();
    
    // Populating UI for success state
    const successStoreName = document.getElementById('redirectSuccessStoreName');
    const itemsContainer = document.getElementById('redirectCartItems');
    const autoBtn = document.getElementById('autoCheckoutBtn');
    if (autoBtn) {
        autoBtn.style.backgroundColor = "";
        autoBtn.style.color = "";
        autoBtn.classList.remove('extension-success');
    }
    
    if (successStoreName) successStoreName.innerText = store.name;
    
    if (itemsContainer) {
        itemsContainer.innerHTML = itemsToExport.map(item => `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary);">
                <img src="${item.product.image}" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); text-align: left;">${item.product.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); text-align: left;">${item.quantity} un. x ${formatCurrency(item.offer.price)}</div>
                </div>
                <a href="${item.product.permalink || item.offer.url || '#'}" target="_blank" class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; text-decoration: none;">Ver</a>
            </div>
        `).join('');
    }
    
    // Auto-checkout for VTEX (Chedraui, HEB)
    if (autoBtn) {
        if (storeKey === 'chedraui' || storeKey === 'heb') {
            const domain = storeKey === 'chedraui' ? 'www.chedraui.com.mx' : 'www.heb.com.mx';
            const params = itemsToExport.map(i => {
                const sku = i.product.sku_id || i.product.id.split('_')[1];
                return `sku=${sku}&qty=${i.quantity}&seller=1`;
            }).join('&');
            
            autoBtn.innerText = "Auto-agregar al carrito";
            autoBtn.href = `https://${domain}/checkout/cart/add?${params}`;
            autoBtn.onclick = null;
            autoBtn.style.display = 'flex';
            autoBtn.style.pointerEvents = "auto";
        } else if (storeKey === 'soriana' || storeKey === 'justo' || storeKey === 'fresko' || storeKey === 'lacomer' || storeKey === 'citymarket') {
            // Trigger Extensión Chrome
            autoBtn.innerText = "Auto-checkout con Extensión 🪄";
            autoBtn.href = "#";
            autoBtn.style.display = 'flex';
            autoBtn.style.pointerEvents = "auto";
            autoBtn.onclick = (e) => {
                e.preventDefault();
                autoBtn.innerText = "Transfiriendo...";
                autoBtn.style.pointerEvents = "none";
                autoBtn.classList.remove('extension-success');
                
                // Agregamos un listener temporal para el ACK
                const ackListener = (event) => {
                    if (event.data && event.data.type === "MARKET4U_EXTENSION_ACK") {
                        autoBtn.innerText = "Abriendo carrito...";
                        autoBtn.style.backgroundColor = "#007a4c";
                        autoBtn.style.color = "white";
                        autoBtn.classList.add('extension-success');
                        window.removeEventListener("message", ackListener);
                    }
                };
                window.addEventListener("message", ackListener);

                window.postMessage({
                    type: "MARKET4U_AUTO_CHECKOUT",
                    payload: { store: storeKey, items: itemsToExport }
                }, "*");
                
                // Fallback por si no tienen la extensión instalada
                setTimeout(() => {
                    if(!autoBtn.classList.contains('extension-success')) {
                        autoBtn.innerText = "Requiere la extensión instalada";
                        autoBtn.style.backgroundColor = "var(--text-secondary)";
                        autoBtn.style.color = "white";
                        window.removeEventListener("message", ackListener);
                    }
                }, 2000);
            };
        } else {
            autoBtn.style.display = 'none';
        }
    }
    
    // Simular tiempo de transferencia
    setTimeout(() => {
        redirectSpinner.style.display = 'none';
        redirectStoreLogo.style.display = 'none';
        redirectTitle.style.display = 'none';
        redirectSubtitle.style.display = 'none';
        
        redirectSuccess.style.display = 'flex';
    }, 2800);
};
// Notification Logic 
const renderNotifications = () => {
    let unreads = mockNotifications.filter(n => n.unread).length;
    notifCount.innerText = unreads;
    notifCount.style.display = unreads > 0 ? 'flex' : 'none';
    
    if(mockNotifications.length === 0) {
        notifList.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-tertiary);">No hay nada nuevo.</div>';
    } else {
        notifList.innerHTML = mockNotifications.map((n, idx) => `
            <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markNotifRead(${idx})">
                <div style="flex:1">
                    <h4 style="font-size:0.9rem; margin-bottom:0.25rem;">${n.title}</h4>
                    <p style="font-size:0.8rem; color:var(--text-secondary);">${n.body}</p>
                    <span style="font-size:0.7rem; color:var(--text-tertiary); display:block; margin-top:0.5rem;">${n.time}</span>
                </div>
                ${n.unread ? '<div class="notif-indicator"></div>' : ''}
            </div>
        `).join('');
    }
};

window.markNotifRead = (idx) => {
    mockNotifications[idx].unread = false;
    renderNotifications();
};

openNotificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationsDropdown.classList.toggle('active');
});
document.addEventListener('click', (e) => {
    if(!notificationsDropdown.contains(e.target) && e.target !== openNotificationsBtn && !openNotificationsBtn.contains(e.target)) {
        notificationsDropdown.classList.remove('active');
    }
});

/* --- TOAST SYSTEM --- */
window.showToast = (message, type = 'success', duration = 3500) => {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        display: flex; align-items: center; gap: 0.75rem;
        background: var(--bg-primary); color: var(--text-primary);
        padding: 0.85rem 1.25rem; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15); border: 1px solid var(--border-color);
        border-left: 4px solid ${colors[type]};
        font-size: 0.9rem; font-weight: 500; min-width: 280px; max-width: 360px;
        pointer-events: all; cursor: pointer;
        animation: slideInRight 0.3s ease; transition: all 0.3s ease;
        font-family: inherit;
    `;
    toast.innerHTML = `<i data-lucide="${icons[type]}" style="width:20px; height:20px; color:${colors[type]}; flex-shrink:0;"></i><span>${message}</span>`;
    toast.addEventListener('click', () => toast.remove());
    container.appendChild(toast);
    safeCreateIcons({ nodes: [toast] });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

/* --- REAL BARCODE SCANNER --- */
/* --- REAL BARCODE SCANNER --- */
const BarcodeScannerController = {
    scanner: null,

    start: async (containerId, onScanSuccess, onError) => {
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error('Biblioteca de escáner no disponible');
        }

        // Limpiar cualquier instancia previa antes de arrancar
        await BarcodeScannerController.stop();

        BarcodeScannerController.scanner = new Html5Qrcode(containerId);
        try {
            await BarcodeScannerController.scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                onError || (() => {})
            );
        } catch (err) {
            BarcodeScannerController.cleanup();
            throw err;
        }
    },

    stop: async () => {
        if (BarcodeScannerController.scanner) {
            const currentScanner = BarcodeScannerController.scanner;
            BarcodeScannerController.scanner = null;
            try {
                if (currentScanner.isScanning) {
                    await currentScanner.stop();
                }
            } catch (e) {
                console.warn('[ScannerController] Error stopping scanner:', e);
            } finally {
                try {
                    currentScanner.clear();
                } catch (e) {}
            }
        }
    },

    cleanup: () => {
        BarcodeScannerController.scanner = null;
    }
};

openScannerBtn.addEventListener('click', async () => {
    scannerModal.classList.add('active');
    IconManager.render();
    document.getElementById('scanStatus').textContent = '';
    
    try {
        await BarcodeScannerController.start(
            'readerContainer',
            async (decodedText) => {
                await BarcodeScannerController.stop();
                scannerModal.classList.remove('active');
                showToast('Buscando producto...', 'info');
                try {
                    // 1. Intentar buscar en memoria local primero
                    let matched = allData.find(p => p.barcode === decodedText || p.id === decodedText || p.ml_id === decodedText);
                    
                    // 2. Si no está en memoria, buscar en la base de datos de Supabase
                    if (!matched && typeof ProductsService !== 'undefined') {
                        const dbProd = await ProductsService.getByBarcode(decodedText);
                        if (dbProd) {
                            const processed = processProducts([dbProd])[0];
                            if (processed) {
                                allData.push(processed);
                                matched = processed;
                            }
                        }
                    }
                    
                    // 3. Si no está en la base de datos, intentar buscar por código en la API (gatilla scrapers en tiempo real)
                    if (!matched) {
                        const searchUrl = `/api/search?q=${encodeURIComponent(decodedText)}`;
                        const res = await fetch(searchUrl);
                        if (res.ok) {
                            const searchData = await res.json();
                            if (searchData.results && searchData.results.length > 0) {
                                const processedList = processProducts(searchData.results);
                                processedList.forEach(p => {
                                    if (!allData.some(x => x.id === p.id)) {
                                        allData.push(p);
                                    }
                                });
                                matched = processedList[0];
                            }
                        }
                    }

                    if (matched) {
                        openProductModal(matched.id);
                        showToast(`Producto encontrado: ${matched.title}`, 'success');
                    } else {
                        showToast(`No se encontró ningún producto para el código: ${decodedText}. Intenta buscarlo por nombre.`, 'warning', 6000);
                    }
                } catch (err) {
                    console.error('[Barcode Search Error]', err);
                    showToast('Error al buscar el producto escaneado.', 'error');
                }
            },
            () => {} // ignorar errores de frame
        );
    } catch (err) {
        document.getElementById('scanStatus').textContent = 'No se pudo acceder a la cámara: ' + err.message;
        showToast(err.message || 'Permiso de cámara denegado', 'error');
    }
});

async function stopScanner() {
    await BarcodeScannerController.stop();
    scannerModal.classList.remove('active');
}

closeScannerBtn.addEventListener('click', stopScanner);
scannerModal.addEventListener('click', (e) => { if (e.target === scannerModal || e.target === scannerModal.firstElementChild) stopScanner(); });

/* --- EVENT LISTENERS --- */
if(closePdpBtn) {
    closePdpBtn.addEventListener('click', () => {
        pdpPage.classList.remove('active');
        document.querySelector('.hero-section').style.display = 'block';
        document.getElementById('mainCatalog').style.display = 'block';
    });
}

closeAlertModal.addEventListener('click', () => alertModal.classList.remove('active'));
alertModal.addEventListener('click', (e) => { if (e.target === alertModal) alertModal.classList.remove('active'); });
closeRedirectBtn.addEventListener('click', () => redirectModal.classList.remove('active'));

openCartBtn.addEventListener('click', () => { cartModal.classList.add('active'); updateCartUI(); });
closeCartModal.addEventListener('click', () => cartModal.classList.remove('active'));
cartModal.addEventListener('click', (e) => { if (e.target === cartModal) cartModal.classList.remove('active'); });

// ======================================================
// AUTH UI HELPERS
// ======================================================
window.switchAuthTab = (tab) => {
    const isSignin = tab === 'signin';
    document.getElementById('formSignin').style.display = isSignin ? 'block' : 'none';
    document.getElementById('formSignup').style.display = isSignin ? 'none' : 'block';
    const activeStyle = `background:var(--bg-primary); color:var(--text-primary); box-shadow:var(--shadow-sm)`;
    const inactiveStyle = `background:transparent; color:var(--text-secondary); box-shadow:none`;
    document.getElementById('tabSignin').style.cssText += isSignin ? activeStyle : inactiveStyle;
    document.getElementById('tabSignup').style.cssText += isSignin ? inactiveStyle : activeStyle;
};

const setAuthLoading = (btnId, textId, spinnerId, loading) => {
    document.getElementById(btnId).disabled = loading;
    document.getElementById(textId).style.display = loading ? 'none' : 'inline';
    document.getElementById(spinnerId).style.display = loading ? 'inline' : 'none';
};

const showAuthError = (divId, msg) => {
    const el = document.getElementById(divId);
    el.textContent = msg;
    el.style.display = 'block';
};

const hideAuthErrors = () => {
    ['signinError','signupError'].forEach(id => { document.getElementById(id).style.display = 'none'; });
};

// ---- Login Listeners ----
if(openLoginBtn) openLoginBtn.addEventListener('click', () => {
    hideAuthErrors();
    loginModal.classList.add('active');
    safeCreateIcons();
});
closeLoginModal.addEventListener('click', () => loginModal.classList.remove('active'));
loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('active'); });

// Google Auth
const handleGoogleAuth = async () => {
    if (AuthService.isReady()) {
        const { error } = await AuthService.signInWithGoogle();
        if (error) showToast('Error al conectar con Google', 'error');
    } else {
        showToast('Modo demo local: Google desactivado', 'warning');
    }
};
document.getElementById('googleBtnSignin').addEventListener('click', handleGoogleAuth);
document.getElementById('googleBtnSignup').addEventListener('click', handleGoogleAuth);

// Sign In
document.getElementById('signinBtn').addEventListener('click', async () => {
    hideAuthErrors();
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    if (!email || !password) return showAuthError('signinError', 'Por favor ingresa tu correo y contraseña.');
    
    setAuthLoading('signinBtn', 'signinBtnText', 'signinBtnSpinner', true);
    
    if (AuthService.isReady()) {
        const { data, error } = await AuthService.signIn(email, password);
        setAuthLoading('signinBtn', 'signinBtnText', 'signinBtnSpinner', false);
        if (error) {
            let msg = error.message;
            if (msg.includes('Invalid login')) msg = 'Correo o contraseña incorrectos.';
            if (msg.includes('Email not confirmed')) msg = 'Por favor revisa tu bandeja de entrada y confirma tu correo para poder entrar.';
            return showAuthError('signinError', msg);
        }
        const session = data?.session;
        if (session) {
            user = { 
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email.split('@')[0]
            };
            saveState();
            loginModal.classList.remove('active');
            renderUserNav();
            showToast(`¡Bienvenido, ${user.name}!`, 'success');
            await syncListsFromSupabase();
        }
    } else {
        // Fallback demo cuando Supabase no está disponible
        setAuthLoading('signinBtn', 'signinBtnText', 'signinBtnSpinner', false);
        user = { name: email.split('@')[0] };
        saveState();
        loginModal.classList.remove('active');
        renderUserNav();
        showToast('Modo demo activo (Supabase no conectado)', 'info');
    }
});

// Sign Up
document.getElementById('signupBtn').addEventListener('click', async () => {
    hideAuthErrors();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    if (!name || !email || !password) return showAuthError('signupError', 'Por favor completa todos los campos.');
    if (password.length < 6) return showAuthError('signupError', 'La contraseña debe tener mínimo 6 caracteres.');
    
    setAuthLoading('signupBtn', 'signupBtnText', 'signupBtnSpinner', true);
    
    if (AuthService.isReady()) {
        const { data, error } = await AuthService.signUp(email, password, name);
        setAuthLoading('signupBtn', 'signupBtnText', 'signupBtnSpinner', false);
        if (error) {
            let msg = error.message;
            if (msg.includes('already registered')) msg = 'Este correo ya está registrado.';
            return showAuthError('signupError', msg);
        }

        // Supabase puede requerir confirmación de email
        if (data?.user && !data?.session) {
            loginModal.classList.remove('active');
            showToast('¡Verifica tu cuenta! Te hemos enviado un correo de confirmación.', 'success', 8000);
        } else if (data?.session) {
            user = {
                id: data.session.user.id,
                email: data.session.user.email,
                name
            };
            saveState();
            loginModal.classList.remove('active');
            renderUserNav();
            showToast(`¡Bienvenido a Market4U, ${name}!`, 'success');
        }
    } else {
        setAuthLoading('signupBtn', 'signupBtnText', 'signupBtnSpinner', false);
        user = { name };
        saveState();
        loginModal.classList.remove('active');
        renderUserNav();
        showToast('Modo demo: cuenta simulada creada', 'info');
    }
});



// Profile / Logout
closeProfileModal.addEventListener('click', () => profileModal.classList.remove('active'));
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.classList.remove('active'); });
logoutBtn.addEventListener('click', async () => {
    logoutBtn.innerText = 'Saliendo...';
    logoutBtn.style.pointerEvents = 'none';
    
    try {
        if (AuthService.isReady()) await AuthService.signOut();
    } catch(err) {
        console.warn('[Logout Error]', err);
    }
    
    // Limpieza agresiva frontend
    user = null;
    favorites.clear();
    alerts = [];
    savedLists = [];
    cart = [];
    saveState();
    
    // Limpiar localStorage cache de Supabase genuina
    SafeStorage.keys().forEach(k => {
        if(k.startsWith('sb-') || k.includes('supabase')) SafeStorage.removeItem(k);
    });

    profileModal.classList.remove('active');
    
    // Recarga absoluta para garantizar estado limpio
    setTimeout(() => {
        window.location.href = window.location.pathname;
    }, 200);
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        renderProfileTab();
    });
});

document.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') {
        cartModal.classList.remove('active');
        loginModal.classList.remove('active');
        profileModal.classList.remove('active');
        redirectModal.classList.remove('active');
        alertModal.classList.remove('active');
        addressModal.classList.remove('active');
        if (typeof matrixModal !== 'undefined') matrixModal.classList.remove('active');
        if (typeof ocrModal !== 'undefined') ocrModal.classList.remove('active');
        if (typeof saveListModal !== 'undefined') saveListModal.classList.remove('active');
        if (typeof pdpPage !== 'undefined' && pdpPage.classList.contains('active')) {
            pdpPage.classList.remove('active');
            const heroSec = document.querySelector('.hero-section');
            if (heroSec) heroSec.style.display = 'block';
            const mainCat = document.getElementById('mainCatalog');
            if (mainCat) mainCat.style.display = 'block';
        }
        if (typeof scannerModal !== 'undefined' && scannerModal.classList.contains('active')) {
            await stopScanner();
        }
    }
});

// Search and Sort Logic
const heroTextGroup = document.getElementById('heroTextGroup');
const heroSection = document.querySelector('.hero-section');

const logoBtn = document.getElementById('logoBtn');
logoBtn.addEventListener('click', () => {
    document.getElementById('mainCatalog').style.display = 'none';
    document.getElementById('pdpPage').classList.remove('active');
    heroSection.style.display = 'flex';
    heroSection.classList.remove('hero-compact');
    heroTextGroup.classList.remove('hero-text-hidden');
    
    if(cartModal.classList.contains('active')) cartModal.classList.remove('active');
    if(profileModal.classList.contains('active')) profileModal.classList.remove('active');
    searchInput.value = '';
});

searchInput.addEventListener('focus', () => {
    heroTextGroup.classList.add('hero-text-hidden');
    heroSection.classList.add('hero-compact');
    document.getElementById('mainCatalog').style.display = 'block';
});
searchInput.addEventListener('blur', () => {
    if(searchInput.value.trim() === '') {
        heroTextGroup.classList.remove('hero-text-hidden');
        heroSection.classList.remove('hero-compact');
    }
});

// --- Búsqueda con ML API ---
let mlSearchTimeout  = null;
let isSearchingML    = false;
let lastMLQuery      = '';   // evitar búsquedas repetidas con misma query

// Utilidad: muestra / oculta el badge de carga ML
const showMLBadge = (text, color = 'var(--accent-color)') => {
    let el = document.getElementById('mlLoadingBadge');
    if (!el) {
        el = document.createElement('div');
        el.id = 'mlLoadingBadge';
        el.style.cssText = [
            'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%);',
            'display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 1rem;',
            'z-index:9999; background: var(--bg-primary); padding: 2rem 3rem; border-radius: var(--radius-md);',
            'box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 2px solid var(--border-color);',
            'transition: opacity 0.3s; opacity: 1;'
        ].join('');
        
        el.innerHTML = `
            <div style="position:relative; width: 64px; height: 64px; display:flex; align-items:center; justify-content:center;">
                <div id="mlSpinnerRing" style="position:absolute; top:0; left:0; right:0; bottom:0; border: 3px solid var(--bg-secondary); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <i id="mlSpinnerIcon" data-lucide="shopping-cart" style="color: var(--text-primary); width: 28px; height: 28px;"></i>
            </div>
            <div id="mlLoadingText" style="font-weight: 600; color: var(--text-primary); font-size: 1rem; text-align:center;"></div>
        `;
        document.body.appendChild(el);
    }
    
    // Limpiar el texto visual (quitar el rayo para verse más minimalista)
    const cleanText = text.replace('⚡ ', '');
    document.getElementById('mlLoadingText').textContent = cleanText;

    // Estado éxito o completado
    if (text.startsWith('✓') || color === '#10b981') {
        document.getElementById('mlSpinnerRing').style.display = 'none';
        document.getElementById('mlSpinnerIcon').setAttribute('data-lucide', 'check-circle');
        document.getElementById('mlSpinnerIcon').style.color = 'var(--success)';
        document.getElementById('mlLoadingText').style.color = 'var(--success)';
        el.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
        document.getElementById('mlSpinnerRing').style.display = 'block';
        document.getElementById('mlSpinnerIcon').setAttribute('data-lucide', 'shopping-cart');
        document.getElementById('mlSpinnerIcon').style.color = 'var(--accent-color)';
        document.getElementById('mlLoadingText').style.color = 'var(--text-primary)';
        el.style.borderColor = 'var(--border-color)';
    }
    safeCreateIcons();
};

const hideMLBadge = (delay = 0) => {
    const el = document.getElementById('mlLoadingBadge');
    if (!el) return;
    if (delay > 0) setTimeout(() => { if(document.getElementById('mlLoadingBadge')) document.getElementById('mlLoadingBadge').remove() }, delay);
    else el.remove();
};

// Núcleo: ejecuta la búsqueda en ML y fusiona los resultados
const runMLSearch = async (query, isPagination = false) => {
    if (!query || query.length < 3) return;
    if (typeof MLService === 'undefined') return;
    if (isSearchingML) return;                 // evitar búsquedas paralelas
    if (!isPagination && query === lastMLQuery) return;         // no re-buscar lo mismo si no es paginación

    isSearchingML = true;
    lastMLQuery   = query;
    showMLBadge(`⚡ Comparando en Market4U... ${isPagination ? '[Pagina ' + ((currentOffset/currentSearchLimit)+1) + ']' : ''}`);

    try {
        const city = document.getElementById('globalCitySelector')?.value || 'default';
        const [mlResults, dbResults] = await Promise.all([
            MLService.searchGeneral(query, currentSearchLimit, currentOffset, city),
            Promise.race([
                ProductsService.search(query),
                new Promise(resolve => setTimeout(() => resolve(null), 1500))
            ])
        ]);
        
        let combinedQueue = [];
        if (dbResults && dbResults.length > 0) combinedQueue = combinedQueue.concat(dbResults);
        if (mlResults && mlResults.length > 0) combinedQueue = combinedQueue.concat(mlResults);

        if (combinedQueue.length === 0) {
            hideMLBadge();
            // Si ya no hay resultados paginados, podríamos ocultar el botón
            const btn = document.getElementById('loadMoreBtn');
            if (btn) btn.style.display = 'none';
            return;
        }

        // Limpiar resultados previos SOLO si es una búsqueda nueva
        if (!isPagination) {
           allData = allData.filter(p => !p.id?.startsWith('sor_') && !p.id?.startsWith('che_') && !p.id?.startsWith('heb_') && !p.id?.startsWith('lac_') && !p.id?.startsWith('cm_'));
        }

        const mergedScraped = mergeProducts(combinedQueue);
        const processedML = processProducts(mergedScraped);
        
        // Nota: El almacenamiento y registro de precios ahora se realiza en lotes (bulk)
        // directamente en el servidor (api/search.js) para optimizar el rendimiento y la red.

        // Calcular resultados locales actuales para deduplicar por título
        const localQuery = query.toLowerCase();
        const localItems = allData.filter(p =>
            p.title.toLowerCase().includes(localQuery) ||
            (p.category || '').toLowerCase().includes(localQuery)
        );
        const existingTitles = new Set(localItems.map(p => p.title.toLowerCase()));
        const newFromML = processedML.filter(p => !existingTitles.has(p.title.toLowerCase()));

        if (newFromML.length === 0) {
            hideMLBadge();
            return;
        }

        // Agregar a allData y reconstruir vista
        allData = [...allData, ...newFromML];
        currentData = [...localItems, ...newFromML];
        renderProducts(currentData);

        showMLBadge(`✓ ${newFromML.length} resultados encontrados en Market4U`, '#10b981');
        hideMLBadge(4000);

    } catch (err) {
        hideMLBadge();
        // Token expirado → instrucción clara al usuario
        if (err.message?.includes('401') || err.message?.includes('token')) {
            showToast('Token ML expirado. Actualiza ML_ACCESS_TOKEN en Supabase.', 'warning');
        } else {
            console.warn('[ML]', err.message);
        }
    } finally {
        isSearchingML = false;
    }
};

const applyFilters = (triggerML = false) => {
    const query  = searchInput.value.toLowerCase().trim();
    const sortVal = sortSelect.value;

    // === Filtros locales ===
    // Incluir TODOS los datos (locales y ML) en el cálculo base
    let filtered = allData.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
    );

    if (sortVal === 'price-asc') {
        filtered.sort((a, b) => (a.bestOffer?.price ?? Infinity) - (b.bestOffer?.price ?? Infinity));
    } else if (sortVal === 'savings') {
        filtered.sort((a, b) => {
            const spreadA = (a.sortedOffers?.at(-1)?.price ?? 0) - (a.bestOffer?.price ?? 0);
            const spreadB = (b.sortedOffers?.at(-1)?.price ?? 0) - (b.bestOffer?.price ?? 0);
            return spreadB - spreadA;
        });
    }

    currentData = filtered;
    renderProducts(filtered);

    // === Búsqueda ML con debounce ===
    if (triggerML) {
        if (query.length >= 3) {
            clearTimeout(mlSearchTimeout);
            lastMLQuery = '';  // reset para permitir re-búsqueda al cambiar query
            mlSearchTimeout = setTimeout(() => runMLSearch(query, false), 700);
        } else {
            hideMLBadge();
        }
    }
};

searchInput.addEventListener('input', () => {
    CatalogState.resetPage();
    applyFilters(true);
});
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});
sortSelect.addEventListener('change', () => {
    CatalogState.resetPage();
    applyFilters(false);
});
searchButton.addEventListener('click', () => {
    clearTimeout(mlSearchTimeout);
    isSearchingML = false;   // forzar re-búsqueda aunque haya una en curso
    lastMLQuery   = '';      // forzar re-búsqueda aunque sea la misma query
    CatalogState.resetPage();

    applyFilters(false);
    document.getElementById('resultsTitle')?.scrollIntoView({ behavior: 'smooth' });
    
    // Lanzar ML inmediatamente (sin debounce)
    const query = searchInput.value.toLowerCase().trim();
    if (query.length >= 3) runMLSearch(query, false);
});

document.getElementById('globalCitySelector')?.addEventListener('change', async (e) => {
    const val = e.target.value;
    SafeStorage.setItem('m4u_selected_city', val);
    if (user && typeof UserProfileService !== 'undefined') {
        await UserProfileService.update(user.id, { city: val });
    }
    showToast(`Ubicación actualizada: ${val.toUpperCase()}`, 'success');
    
    // Reprocesar datos según las tiendas válidas de la nueva ciudad
    if (allData && allData.length > 0) {
        allData = processProducts(allData);
    }
    if (currentData && currentData.length > 0) {
        currentData = processProducts(currentData);
    }
    
    // Actualizar botones de filtros y refrescar vista
    initStoreFilters();
    applyFilters(false);
    
    // Si hay una búsqueda activa, re-lanzar con la nueva ciudad
    const query = searchInput.value.toLowerCase().trim();
    if (query.length >= 3) {
        clearTimeout(mlSearchTimeout);
        isSearchingML = false;
        lastMLQuery = '';
        CatalogState.resetPage();
        runMLSearch(query, false);
    }
});

/* --- MASSIVE MATRIX LOGIC --- */
const matrixModal = document.getElementById('matrixModal');
const closeMatrixModal = document.getElementById('closeMatrixModal');

document.getElementById('openMatrixModalBtn').addEventListener('click', () => {
    if(cart.length === 0) return showToast('No hay productos en tu carrito para analizar.', 'warning');
    
    const thead = Object.values(stores).map(s => `<th style="text-align:center; min-width: 140px;"><div class="store-logo-small" style="background-color:${s.bgColor}; color:${s.color}; margin: 0 auto 0.5rem; width:28px; height:28px; font-size:rem;">${s.logo}</div>${s.name}</th>`).join('');
    
    const totals = {};
    const missingCounts = {};
    Object.keys(stores).forEach(k => { totals[k] = 0; missingCounts[k] = 0; });
    
    const tbody = cart.map(citem => {
        const itemRow = Object.keys(stores).map(sKey => {
            const offer = citem.product.offers.find(o => o.store === sKey);
            if(offer) {
                totals[sKey] += (offer.price * citem.quantity);
                return `<td style="text-align:center; font-weight:600;">${formatCurrency(offer.price * citem.quantity)}<br><span style="font-size:0.75rem; font-weight:normal; color:var(--text-tertiary);">${citem.quantity} uni. (${formatCurrency(offer.price)} c/u)</span></td>`;
            } else {
                missingCounts[sKey] += citem.quantity;
                return `<td style="text-align:center; color: var(--danger, red); font-size:0.8rem;">No Disponible</td>`;
            }
        }).join('');
        
        return `
            <tr>
                <td style="min-width: 250px;">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <img src="${citem.product.image}" style="width:45px; height:45px; border-radius:6px; object-fit:cover; border: 1px solid var(--border-color);">
                        <span style="font-size:0.9rem; font-weight:500;">${citem.product.title}</span>
                    </div>
                </td>
                ${itemRow}
            </tr>
        `;
    }).join('');
    
    let minTotal = Infinity;
    Object.keys(stores).forEach(k => {
        if(missingCounts[k] === 0 && totals[k] > 0 && totals[k] < minTotal) {
            minTotal = totals[k];
        }
    });
    
    const registerButtons = `
        <tr style="background:var(--bg-primary);">
            <td style="text-align:right; font-weight:600; font-size:0.9rem; border-right:1px solid var(--border-color); padding: 12px 16px;">Acción:</td>
            ${Object.keys(stores).map(sKey => {
                const total = totals[sKey];
                if (total <= 0) return `<td style="text-align:center; color:var(--text-tertiary);">-</td>`;
                return `
                    <td style="text-align:center; padding: 12px 8px;">
                        <button class="btn-save-purchase" onclick="window.confirmPurchase('${sKey}')" style="background: var(--accent-color); color: white; border: none; padding: 0.5rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; transition: background 0.2s; box-shadow: var(--shadow-sm);">
                            <i data-lucide="piggy-bank" style="width:14px; height:14px;"></i> Registrar
                        </button>
                    </td>
                `;
            }).join('')}
        </tr>
    `;

    const tfoot = `
        <tr style="background:var(--bg-secondary);">
            <td style="text-align:right; font-weight:bold; font-size:1.1rem; border-right:1px solid var(--border-color);">Total Carrito:</td>
            ${Object.keys(stores).map(sKey => {
                const total = totals[sKey];
                const missing = missingCounts[sKey];
                const isBest = (total === minTotal && total > 0 && missing === 0);
                
                let cellContent = '';
                if(missing > 0) {
                    cellContent = `<span style="font-size:1rem;">${formatCurrency(total)}</span><br><span style="font-size:0.75rem; color: var(--danger, red);">Faltan ${missing} art.</span>`;
                } else {
                    cellContent = `<span style="font-size:1.15rem;">${formatCurrency(total)}</span><br><span style="font-size:0.75rem; color: var(--success);">Lista Completa</span>`;
                }
                
                return `<td class="${isBest ? 'best-cell' : ''}" style="text-align:center; color:${total === 0 ? 'var(--text-tertiary)' : 'inherit'}">${total > 0 ? cellContent : 'N/A'}</td>`;
            }).join('')}
        </tr>
        ${registerButtons}
    `;
    
    document.getElementById('matrixTableBody').innerHTML = `
        <thead>
            <tr>
                <th style="min-width:250px; font-size:1.1rem;"><i data-lucide="shopping-cart" style="width:18px; margin-right:6px;"></i> Productos</th>
                ${thead}
            </tr>
        </thead>
        <tbody>
            ${tbody}
        </tbody>
        <tfoot style="position: sticky; bottom: 0; box-shadow: 0 -4px 10px rgba(0,0,0,0.05);">
            ${tfoot}
        </tfoot>
    `;
    
    cartModal.classList.remove('active');
    matrixModal.classList.add('active');
    safeCreateIcons();
});

closeMatrixModal.addEventListener('click', () => matrixModal.classList.remove('active'));
matrixModal.addEventListener('click', (e) => { if (e.target === matrixModal) matrixModal.classList.remove('active'); });

window.confirmPurchase = async (storeId) => {
    if (cart.length === 0) return showToast('No hay productos en tu carrito para registrar.', 'warning');
    
    // Calcular totales para todas las tiendas en el carrito actual
    const totals = {};
    const missingCounts = {};
    Object.keys(stores).forEach(k => { totals[k] = 0; missingCounts[k] = 0; });
    
    cart.forEach(citem => {
        Object.keys(stores).forEach(sKey => {
            const offer = citem.product.offers?.find(o => o.store === sKey);
            if (offer) {
                totals[sKey] += (offer.price * citem.quantity);
            } else {
                missingCounts[sKey] += citem.quantity;
            }
        });
    });
    
    const chosenTotal = totals[storeId];
    if (!chosenTotal || chosenTotal <= 0) return showToast('No se puede registrar compra en esta tienda.', 'error');
    
    // Encontrar el total más caro (entre tiendas con listas completas, o la más cara en general si no hay completas)
    let maxTotal = 0;
    const completeTotals = Object.keys(stores).filter(k => missingCounts[k] === 0 && totals[k] > 0).map(k => totals[k]);
    
    if (completeTotals.length > 0) {
        maxTotal = Math.max(...completeTotals);
    } else {
        maxTotal = Math.max(...Object.keys(stores).map(k => totals[k]));
    }
    
    // Si la opción elegida es más cara que el máximo calculado (por ej, con items faltantes), ajustamos
    if (maxTotal < chosenTotal) {
        maxTotal = chosenTotal;
    }
    
    const savedAmount = maxTotal - chosenTotal;
    const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    const storeName = stores[storeId]?.name || storeId;
    
    // Solicitar confirmación al usuario
    const confirmRegister = confirm(`¿Quieres registrar esta compra en ${storeName}?
Total pagado: ${formatCurrency(chosenTotal)}
Ahorro estimado vs alternativa cara: ${formatCurrency(savedAmount)}`);
    
    if (!confirmRegister) return;
    
    const userId = user?.id || null;
    const { data, error } = await PurchaseService.recordPurchase(
        userId,
        storeId,
        itemsCount,
        chosenTotal,
        maxTotal,
        savedAmount
    );
    
    if (error) {
        showToast(`Error al registrar la compra: ${error}`, 'error');
    } else {
        showToast(`¡Compra registrada con éxito! Ahorro de ${formatCurrency(savedAmount)} guardado.`, 'success');
        matrixModal.classList.remove('active');
        
        // Vaciar el carrito
        cart = [];
        saveState();
        updateCartUI();
        
        // Si la pestaña de perfil está activa, actualizar el panel
        const profileModal = document.getElementById('profileModal');
        if (profileModal && profileModal.classList.contains('active') && activeTab === 'ahorros') {
            renderSavingsDashboard();
        }
    }
};

const renderSavingsDashboard = async () => {
    if (!profileContentArea) return;
    profileContentArea.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; padding: 2rem;">
            <div class="spinner" style="width:32px; height:32px;"></div>
        </div>
    `;
    
    const userId = user?.id || null;
    const history = await PurchaseService.getHistory(userId);
    
    let totalSaved = 0;
    let totalPaid = 0;
    let totalItems = 0;
    
    if (history && history.length > 0) {
        history.forEach(item => {
            totalSaved += parseFloat(item.saved_amount || 0);
            totalPaid += parseFloat(item.total_paid || 0);
            totalItems += parseInt(item.items_count || 0);
        });
    }
    
    let historyRows = '';
    if (!history || history.length === 0) {
        historyRows = `<tr><td colspan="4" style="text-align:center; color:var(--text-tertiary); padding: 1.5rem;">No has registrado compras todavía.</td></tr>`;
    } else {
        historyRows = history.map(item => {
            const s = stores[item.store_id] || { name: item.store_id, logo: '🛒', color: '#666', bgColor: '#eee' };
            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 0.75rem 0.5rem; display:flex; align-items:center; gap:0.4rem;">
                        <div class="store-logo-small" style="background-color: ${s.bgColor}; color: ${s.color}; width:20px; height:20px; font-size:0.7rem; margin:0;">${s.logo}</div>
                        <span style="font-size:0.8rem; font-weight:500;">${s.name}</span>
                    </td>
                    <td style="padding: 0.75rem 0.5rem; font-size:0.8rem; text-align:center;">${item.items_count}</td>
                    <td style="padding: 0.75rem 0.5rem; font-size:0.8rem; font-weight:600; text-align:right;">${formatCurrency(item.total_paid)}</td>
                    <td style="padding: 0.75rem 0.5rem; font-size:0.8rem; font-weight:600; color:var(--success); text-align:right;">${formatCurrency(item.saved_amount)}</td>
                </tr>
            `;
        }).join('');
    }
    
    profileContentArea.innerHTML = `
        <div style="padding: 1rem; font-family: inherit;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1.5rem;">
                <div style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm); text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Total Ahorrado</div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: var(--success);">${formatCurrency(totalSaved)}</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm); text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Total Pagado</div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">${formatCurrency(totalPaid)}</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm); text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Arts. Comprados</div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: var(--accent-color);">${totalItems}</div>
                </div>
            </div>
            
            <h3 style="font-size: 0.95rem; margin-bottom: 0.75rem; font-weight: 600; display:flex; align-items:center; gap:0.25rem;"><i data-lucide="history" style="width:16px;"></i> Historial de Ahorros</h3>
            <div style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); font-size: 0.75rem; color: var(--text-secondary);">
                            <th style="padding: 0.5rem; font-weight:600; text-align:left;">Tienda</th>
                            <th style="padding: 0.5rem; font-weight:600; text-align:center;">Arts.</th>
                            <th style="padding: 0.5rem; font-weight:600; text-align:right;">Pagado</th>
                            <th style="padding: 0.5rem; font-weight:600; text-align:right;">Ahorrado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${historyRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    safeCreateIcons();
};

// --- OCR RECEIPT SCANNER LOGIC ---
let detectedOcrItems = [];

if (openOcrBtn) {
    openOcrBtn.addEventListener('click', () => {
        // Reset modal UI
        ocrDropzone.style.display = 'block';
        ocrProgressContainer.style.display = 'none';
        ocrResultsContainer.style.display = 'none';
        if (ocrInputFile) ocrInputFile.value = '';
        detectedOcrItems = [];
        ocrModal.classList.add('active');
    });
}

if (closeOcrModal) {
    closeOcrModal.addEventListener('click', () => {
        ocrModal.classList.remove('active');
    });
}
if (ocrModal) {
    ocrModal.addEventListener('click', (e) => { if (e.target === ocrModal) ocrModal.classList.remove('active'); });
}

if (ocrCancelBtn) {
    ocrCancelBtn.addEventListener('click', () => {
        ocrModal.classList.remove('active');
    });
}

const cleanReceiptLine = (line) => {
    // Quitar precios finales (ej. $28.50 o 28.50 o .50 o -28)
    let clean = line.replace(/[\s\d.,$+-]+$/, '');
    // Quitar código de barra inicial (ej. de 8 a 14 dígitos)
    clean = clean.replace(/^\d{8,14}\s+/, '');
    // Quitar cantidades iniciales (ej. 1, 2, 1.5, etc.)
    clean = clean.replace(/^\d+(\.\d+)?\s*(x|uni|pz|pza|pcs)?\s+/i, '');
    // Quitar IVA, IEPS y palabras fiscales/generales comunes
    clean = clean.replace(/\s+(iva|ieps|exento|gravado|tasa|rfc|caja|folio)\b.*/i, '');
    return clean.trim();
};

const isNoiseLine = (line) => {
    const uppercaseLine = line.toUpperCase();
    const noiseKeywords = [
        'SORIANA', 'CHEDRAUI', 'LA COMER', 'HEB', 'WALMART', 'TICKET', 
        'RFC', 'FACTURA', 'COMPRA', 'FECHA', 'HORA', 'CAJA', 'CAJERO', 'FOLIO', 'SUBTOTAL', 
        'TOTAL', 'PAGO', 'CAMBIO', 'EFECTIVO', 'TARJETA', 'DESCUENTO', 'IVA', 'IEPS', 
        'CLIENTE', 'TEL', 'GRACIAS', 'BIENVENIDO', 'PROMO', 'ARTICULOS', 'ITEMS', 'SUCURSAL',
        'DIRECCION', 'REGIMEN', 'MONTO', 'CANTIDAD', 'PRECIO', 'DESCRIPCION'
    ];
    return noiseKeywords.some(kw => uppercaseLine.includes(kw)) || line.length < 4 || /^[0-9\s.,$+*-]+$/.test(line);
};

const findBestOcrMatch = async (query) => {
    if (!query) return null;
    
    // Tokens de la línea del ticket
    const queryTokens = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => t.length > 2);
    if (queryTokens.length === 0) return null;
    
    const calculateScore = (p) => {
        const titleTokens = p.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => t.length > 2);
        const intersection = queryTokens.filter(t => titleTokens.includes(t)).length;
        return intersection / Math.max(queryTokens.length, titleTokens.length);
    };

    // 1. Intentar con memoria local primero
    let bestProduct = null;
    let maxScore = 0;
    
    for (const p of allData) {
        const score = calculateScore(p);
        if (score > maxScore) {
            maxScore = score;
            bestProduct = p;
        }
    }
    
    // Si la coincidencia local es aceptable (>= 0.35), la usamos directamente
    if (maxScore >= 0.35) return bestProduct;
    
    // 2. Si no es suficiente, buscar en la base de datos de Supabase
    if (typeof ProductsService !== 'undefined' && ProductsService.search) {
        try {
            // Limpiar query para búsqueda (tomar las 2-3 palabras más largas/significativas del ticket)
            const searchKeywords = queryTokens.slice(0, 3).join(' ');
            if (searchKeywords.length >= 3) {
                const dbResults = await ProductsService.search(searchKeywords);
                if (dbResults && dbResults.length > 0) {
                    const processedDb = processProducts(dbResults);
                    
                    // Evaluar los resultados de la base de datos
                    for (const p of processedDb) {
                        const score = calculateScore(p);
                        if (score > maxScore) {
                            maxScore = score;
                            bestProduct = p;
                        }
                        // Ir guardando en memoria por si el usuario abre detalles
                        if (!allData.some(x => x.id === p.id)) {
                            allData.push(p);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[OCR Match DB Error]', e);
        }
    }
    
    return maxScore >= 0.25 ? bestProduct : null;
};

const processOcrFile = async (file) => {
    if (typeof Tesseract === 'undefined') {
        showToast('La librería de OCR (Tesseract.js) no se cargó correctamente. Inténtalo de nuevo.', 'error');
        return;
    }
    
    ocrDropzone.style.display = 'none';
    ocrProgressContainer.style.display = 'block';
    ocrProgressBar.style.width = '0%';
    ocrProgressPercent.innerText = '0%';
    ocrProgressStatus.innerText = 'Inicializando motor OCR...';
    
    try {
        const result = await Tesseract.recognize(
            file,
            'spa',
            {
                logger: m => {
                    if (m.status === 'recognizing') {
                        const pct = Math.round(m.progress * 100);
                        ocrProgressBar.style.width = `${pct}%`;
                        ocrProgressPercent.innerText = `${pct}%`;
                        ocrProgressStatus.innerText = 'Reconociendo texto del ticket...';
                    }
                }
            }
        );
        
        const text = result.data.text || '';
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        detectedOcrItems = [];
        const matchPromises = [];
        
        // Filtrar y deduplicar líneas válidas para optimizar la carga a la base de datos
        const uniqueCleanedLines = Array.from(new Set(
            lines.map(line => cleanReceiptLine(line))
                 .filter(cleaned => cleaned && !isNoiseLine(cleaned))
        )).slice(0, 25); // Limitar a un máximo de 25 líneas significativas para no saturar la red/DB
        
        for (const cleaned of uniqueCleanedLines) {
            matchPromises.push((async () => {
                const matchedProduct = await findBestOcrMatch(cleaned);
                return {
                    originalLine: cleaned,
                    match: matchedProduct
                };
            })());
        }
        
        // Esperar que todas las consultas de base de datos se ejecuten concurrentemente
        detectedOcrItems = await Promise.all(matchPromises);
        
        ocrProgressContainer.style.display = 'none';
        ocrResultsContainer.style.display = 'block';
        
        if (detectedOcrItems.length === 0) {
            ocrDetectedItems.innerHTML = `<p style="text-align:center; color:var(--text-tertiary); padding:1.5rem; font-size:0.9rem;">No pudimos detectar productos legibles en esta foto. Intenta con una toma más clara o acércala más.</p>`;
            if (ocrImportBtn) {
                ocrImportBtn.disabled = true;
                ocrImportBtn.style.opacity = 0.5;
            }
        } else {
            if (ocrImportBtn) {
                ocrImportBtn.disabled = false;
                ocrImportBtn.style.opacity = 1;
            }
            ocrDetectedItems.innerHTML = detectedOcrItems.map((item, idx) => {
                const match = item.match;
                const matchHTML = match ? `
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem; font-size:0.8rem; background: var(--bg-tertiary); padding:0.25rem 0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                        <img src="${match.image}" style="width:24px; height:24px; border-radius:2px; object-fit:cover;">
                        <span style="font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:260px;">${match.title}</span>
                        <span style="color:var(--success); font-weight:700; margin-left:auto;">${formatCurrency(match.bestOffer.price)}</span>
                    </div>
                ` : `<div style="font-size:0.75rem; color:var(--text-tertiary); margin-top:0.25rem; font-style:italic;">Sin coincidencia exacta en catálogo local.</div>`;
                
                return `
                    <div style="padding:0.5rem; border-bottom:1px solid var(--border-color); display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.85rem; font-weight:500; color:var(--text-primary);">
                            <input type="checkbox" data-index="${idx}" checked style="cursor:pointer; width:16px; height:16px; accent-color:var(--accent-color);">
                            <span>${item.originalLine}</span>
                        </label>
                        ${matchHTML}
                    </div>
                `;
            }).join('');
        }
        safeCreateIcons();
    } catch (err) {
        console.error('[OCR Error]', err);
        showToast(`Error al procesar OCR: ${err.message}`, 'error');
        ocrProgressContainer.style.display = 'none';
        ocrDropzone.style.display = 'block';
    }
};

if (ocrInputFile) {
    ocrInputFile.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            processOcrFile(e.target.files[0]);
        }
    });
}

// Drag & Drop
if (ocrDropzone) {
    ocrDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        ocrDropzone.style.borderColor = 'var(--accent-color)';
        ocrDropzone.style.backgroundColor = 'var(--bg-secondary)';
    });
    ocrDropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        ocrDropzone.style.borderColor = 'var(--border-color)';
        ocrDropzone.style.backgroundColor = 'var(--bg-tertiary)';
    });
    ocrDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        ocrDropzone.style.borderColor = 'var(--border-color)';
        ocrDropzone.style.backgroundColor = 'var(--bg-tertiary)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processOcrFile(e.dataTransfer.files[0]);
        }
    });
}

// Import Action
if (ocrImportBtn) {
    ocrImportBtn.addEventListener('click', () => {
        const checkboxes = ocrDetectedItems.querySelectorAll('input[type="checkbox"]');
        let importedCount = 0;
        let unmatchedCount = 0;
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const idx = parseInt(cb.getAttribute('data-index'));
                const item = detectedOcrItems[idx];
                if (item && item.match) {
                    addToCart(item.match, 1);
                    importedCount++;
                } else {
                    unmatchedCount++;
                }
            }
        });
        
        if (importedCount > 0) {
            showToast(`¡Importación exitosa! Se agregaron ${importedCount} productos a tu carrito.`, 'success');
        }
        if (unmatchedCount > 0) {
            showToast(`${unmatchedCount} productos no tenían coincidencia local. Por favor, búscalos manualmente.`, 'warning');
        }
        
        ocrModal.classList.remove('active');
    });
}

// INITIALIZE
const syncCityFromProfile = async (userId) => {
    if (typeof UserProfileService !== 'undefined' && userId) {
        try {
            const profile = await UserProfileService.get(userId);
            if (profile && profile.city) {
                const citySelect = document.getElementById('globalCitySelector');
                if (citySelect) {
                    citySelect.value = profile.city;
                    SafeStorage.setItem('m4u_selected_city', profile.city);
                }
            }
        } catch (e) {
            console.warn('[City Sync] Error fetching profile:', e);
        }
    }
};

allData = processProducts(products);
currentData = [...allData];
loadState();

// Restore location selector from local storage
const localCity = SafeStorage.getItem('m4u_selected_city');
if (localCity) {
    const citySelect = document.getElementById('globalCitySelector');
    if (citySelect) citySelect.value = localCity;
}

initStoreFilters();
renderProducts(currentData);
renderUserNav();
updateCartUI();
renderNotifications();

// Restaurar sesión de Supabase al recargar
(async () => {
    if (!AuthService.isReady()) return;

    // Escuchar errores devueltos por Google OAuth en el Hash
    if (window.location.hash && window.location.hash.includes('error=')) {
        const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const errorDesc = urlParams.get('error_description');
        if (errorDesc) setTimeout(() => showToast(`Error de Autenticación: ${errorDesc.replace(/\+/g, ' ')}`, 'error', 8000), 1000);
    }

    // 1. Escuchar cambios ANTES de cualquier `await` para evitar perder el evento INITIAL_SESSION
    AuthService.onAuthChange(async (session) => {
        if (session?.user) {
            user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email.split('@')[0]
            };
            saveState();
            renderUserNav();
            loginModal.classList.remove('active');
            let welcomeName = user.name;
            if (welcomeName === 'pablobesoytrigueros') welcomeName = 'Pablo';
            showToast(`¡Bienvenido, ${welcomeName}!`, 'success');
            await syncCityFromProfile(session.user.id);
            await syncListsFromSupabase();
        } else if (user) {
            user = null;
            saveState();
            renderUserNav();
        }
    });

    // 2. Comprobar sesión pasivamente
    const session = await AuthService.getSession();
    if (session?.user) {
        user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        };
        saveState();
        renderUserNav();
        await syncCityFromProfile(session.user.id);
        await syncListsFromSupabase();
        console.log('[Market4U] Sesión restaurada:', user.name);
    }
})();

// PWA - Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[Market4U PWA] Service Worker registrado:', reg.scope);
        }).catch(err => {
            console.warn('[Market4U PWA] Sin SW (requiere HTTPS o localhost):', err.message);
        });
    });
}

// Inject toast animation keyframes
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(60px); }
        to   { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(toastStyle);
