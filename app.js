// Usamos variables globales desde mockData.js ya que estamos corriendo sin servidor
console.log('%c✅ Market2U app.js v2 cargado correctamente', 'background:#10b981; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;');
console.log('MLService disponible:', typeof MLService !== 'undefined');
console.log('CONFIG.ML_SEARCH_URL:', typeof CONFIG !== 'undefined' ? CONFIG.ML_SEARCH_URL : 'CONFIG no definido');

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

let activeStoreFilters = new Set();

// Notifications DOM
const openNotificationsBtn = document.getElementById('openNotificationsBtn');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const notifCount = document.getElementById('notifCount');
const notifList = document.getElementById('notifList');

// Alert Modal DOM
const alertModal = document.getElementById('alertModal');
const closeAlertModal = document.getElementById('closeAlertModal');
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
    { id: 3, title: 'Bienvenido a Market2U', body: 'Tu cuenta y pre-configuración se han cargado exitosamente.', time: 'Ayer', unread: false }
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
    localStorage.setItem('market2u_state', JSON.stringify(data));
};

const loadState = () => {
    const saved = localStorage.getItem('market2u_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            user = data.user;
            favorites = new Set(data.favorites || []);
            alerts = data.alerts || [];
            addresses = data.addresses || [];
            
            cart = (data.cart || []).map(c => {
                if(c.product && c.product.id) {
                    const fp = allData.find(x => x.id === c.product.id);
                    return fp ? { product: fp, quantity: c.quantity || 1 } : null;
                } else if(c.id) {
                    const fp = allData.find(x => x.id === c.id);
                    return fp ? { product: fp, quantity: 1 } : null;
                }
                return null;
            }).filter(x => x !== null);
            
            savedLists = (data.savedLists || []).map(list => {
                const fItems = list.items.map(i => {
                    if(i.product && i.product.id) return { product: allData.find(x => x.id === i.product.id), quantity: i.quantity || 1 };
                    else if(i.id) return { product: allData.find(x => x.id === i.id), quantity: 1 };
                    return null;
                }).filter(x => x && x.product);
                return { name: list.name, items: fItems };
            });
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
            { name: "Súper de Lunes", items: [{product: currentData[0], quantity: 1}, {product: currentData[1], quantity: 2}, {product: currentData[4], quantity: 1}] },
            { name: "Limpieza del Mes", items: [{product: currentData[2], quantity: 1}, {product: currentData[3], quantity: 1}] }
        ];
        cart = [];
        saveState();
    }
};

// Currency Formatter
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value);
};

// Fuzzy Merging Algorithm for External Scraping
const mergeProducts = (products) => {
    const merged = [];
    
    const extractSize = (title) => {
        // Busca patrones amplios de súper: 3l, 500g, 18 rollos, 90 pañuelos, etc.
        const match = title.toLowerCase().match(/([0-9.,]+)\s*(ml|l|lt|g|kg|oz|pack|pz|pzas|piezas|rollo|rollos|pañuelo|pañuelos|toallita|toallitas|hojas|hoja|servilletas|caja|cajas)/);
        return match ? match[0].replace(/\s/g, '') : null;
    };

    for (const p of products) {
        const pSize = extractSize(p.title);
        const pTokens = p.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
        
        let foundMatch = null;
        for (const existing of merged) {
            const exSize = extractSize(existing.title);
            
            // Regla estricta: Si ambos tienen un tamaño/volumen extraíble explícito y NO coinciden, jamás son el mismo producto.
            if (pSize && exSize && pSize !== exSize) continue;

            const exTokens = existing.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(x => x.length > 2);
            
            // Calculo de similitud: Intersección sobre la longitud mínima
            const intersection = pTokens.filter(t => exTokens.includes(t)).length;
            const minTokens = Math.min(pTokens.length, exTokens.length);
            
            // Si provienen de la misma tienda, requieren un umbral muy alto para evitar fusionar variaciones del mismo catálogo
            const threshold = (p.seller === existing.seller) ? 0.85 : 0.55;

            if (minTokens > 0 && (intersection / minTokens >= threshold)) {
                foundMatch = existing;
                break;
            }
        }
        
        if (foundMatch) {
            foundMatch.offers.push(...p.offers);
        } else {
            merged.push({ ...p, offers: [...p.offers] });
        }
    }
    return merged;
};

// Process Data to find best pricing
const processProducts = (productList) => {
    return productList.map(item => {
        // Manejar precio null (productos de ML sin buy_box)
        const sortedOffers = [...item.offers].sort((a, b) => {
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
                <i data-lucide="user-circle" style="width: 20px;"></i> ${user.name}
            </button>
        `;
        document.getElementById('openProfileBtn').addEventListener('click', () => {
            profileNameDisplay.innerText = `Hola, ${user.name}`;
            profileModal.classList.add('active');
            renderProfileTab();
        });
    }
    lucide.createIcons();
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
    lucide.createIcons();
};

saveAlertBtn.addEventListener('click', () => {
    const targetPrice = parseFloat(alertPriceInput.value);
    const promo = alertPromoInput.checked;
    
    if(!targetPrice || isNaN(targetPrice)) {
       return showToast('Por favor introduce un precio numérico válido.', 'warning');
    }
    
    alerts.push({ productId: currentAlertProductId, targetPrice, promo });
    saveState();
    
    alertModal.classList.remove('active');
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
    storeFiltersContainer.innerHTML = Object.keys(stores).map(k => `
        <button onclick="toggleStoreFilter('${k}')" class="btn-outline" style="border-radius: 99px; padding: 0.25rem 0.75rem; font-size: 0.8rem; flex:none; user-select:none; transition:var(--transition); display:flex; align-items:center; gap:0.25rem; background: ${activeStoreFilters.has(k) ? stores[k].bgColor : 'transparent'}; color: ${activeStoreFilters.has(k) ? stores[k].color : 'var(--text-secondary)'}; border-color: ${activeStoreFilters.has(k) ? 'transparent' : 'var(--border-color)'};">
            <span style="font-weight:bold;">${stores[k].logo}</span> ${stores[k].name}
        </button>
    `).join('');
};

window.toggleStoreFilter = (storeKey) => {
    if(activeStoreFilters.has(storeKey)) activeStoreFilters.delete(storeKey);
    else activeStoreFilters.add(storeKey);
    initStoreFilters();
    renderProducts(currentData);
};

// Home Nav Button
document.getElementById('homeNavBtn').addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    currentData = allData;
    activeStoreFilters.clear();
    initStoreFilters();
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
                    ${list.items.slice(0,3).map(i => i.product.title.split(' ')[0]).join(', ')}...
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
        lucide.createIcons();
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
                <img src="${item.image}" alt="">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    ${extraInfoHTML}
                </div>
                <button onclick="openProductModal('${item.id}')" class="btn-outline" style="border:1px solid var(--border-color); padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 4px;">Ver</button>
            </div>
            `;
        }).join('');
    }
    
    lucide.createIcons();
};

/* --- RENDER PRODUCTS --- */
const renderProducts = (data) => {
    resultsGrid.innerHTML = '';
    
    const displayData = data.map(product => {
        let sorted = product.sortedOffers;
        if(activeStoreFilters.size > 0) {
            sorted = product.sortedOffers.filter(o => activeStoreFilters.has(o.store));
        }
        if(sorted.length === 0) return null;
        return { ...product, displayBestOffer: sorted[0] };
    }).filter(p => p !== null);

    if (displayData.length === 0) {
        resultsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">No se encontraron productos en las tiendas seleccionadas.</p>';
        return;
    }
    
    displayData.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const bestStore = stores[product.displayBestOffer.store];

        const isFav = favorites.has(product.id);
        const isAlert = alerts.some(a => a.productId === product.id);
        
        card.innerHTML = `
            <div class="product-image-container" onclick="openProductModal('${product.id}')">
                <div class="product-actions-overlay">
                    <button class="icon-action-btn ${isFav ? 'active' : ''}" title="Favorito" onclick="toggleFavorite(event, '${product.id}')">
                        <i data-lucide="heart" style="width: 16px;"></i>
                    </button>
                    <button class="icon-action-btn ${isAlert ? 'active' : ''}" title="Alerta de precio" onclick="toggleAlert(event, '${product.id}')">
                        <i data-lucide="bell" style="width: 16px;"></i>
                    </button>
                </div>
                ${product.image
                    ? `<img src="${product.image}" alt="${product.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div style="display:none; flex-direction:column; align-items:center; justify-content:center; height:100%; background:linear-gradient(135deg,#ffe600,#f5c500); color:#2d3277; font-weight:700; font-size:1.1rem; gap:4px;">
                           <span style="font-size:2rem;">🛒</span><span>ML</span>
                       </div>`
                    : `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; background:linear-gradient(135deg,#ffe600,#f5c500); color:#2d3277; font-weight:700; font-size:1.1rem; gap:4px;">
                           <span style="font-size:2rem;">🛒</span>
                           <span style="font-size:0.8rem; opacity:0.8;">${product.title.split(' ').slice(0,3).join(' ')}</span>
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
                                         const s = stores[o.store];
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

    // Add Load More Button at the end of the grid if there are any results
    if (displayData.length > 0 && typeof searchInput !== 'undefined') {
        const q = searchInput.value.toLowerCase().trim();
        if (q.length >= 3) {
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = "grid-column: 1/-1; display:flex; justify-content:center; padding: 2rem 0;";
            btnContainer.innerHTML = `<button id="loadMoreBtn" class="btn-primary" style="padding: 0.8rem 2rem; border-radius: 30px; font-weight:600; cursor:pointer;">Cargar más resultados <i data-lucide="chevron-down" style="width:20px; vertical-align:middle; margin-left:8px;"></i></button>`;
            resultsGrid.appendChild(btnContainer);
            
            document.getElementById('loadMoreBtn').addEventListener('click', () => {
                currentOffset += currentSearchLimit; // Avanzar offset
                runMLSearch(q, true); // Pasar isPagination = true
            });
        }
    }
    
    lucide.createIcons();
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
            <img src="${citem.product.image}" alt="">
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
        Object.keys(stores).forEach(storeKey => {
            const offer = citem.product.offers.find(o => o.store === storeKey);
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
    lucide.createIcons();
};

/* --- SAVED LISTS LOGIC --- */
const saveListModal = document.getElementById('saveListModal');

// Sincronizar listas desde Supabase al perfil local
const syncListsFromSupabase = async () => {
    if (!user?.id || !ListsService) return;
    const { data, error } = await ListsService.getAll(user.id);
    if (error || !data) return;
    // Mergear: conservar listas con productos reales (locales y remote)
    const remoteLists = data.map(row => ({
        id: row.id,
        name: row.name,
        items: (row.items || []).map(i => {
            const product = allData.find(p => p.id === i.product_id);
            return product ? { product, quantity: i.quantity || 1 } : null;
        }).filter(Boolean)
    })).filter(l => l.items.length > 0);
    if (remoteLists.length > 0) {
        savedLists = remoteLists;
        saveState();
    }
};

document.getElementById('openSaveListPopupBtn').addEventListener('click', () => {
    if(!user) { loginModal.classList.add('active'); return; }
    if(cart.length === 0) { showToast('Tu carrito está vacío.', 'warning'); return; }
    document.getElementById('listNameInput').value = '';
    saveListModal.classList.add('active');
    lucide.createIcons();
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
        const supabaseItems = cart.map(c => ({ product_id: c.product.id, quantity: c.quantity }));
        await ListsService.save(user.id, name, supabaseItems);
    }
    
    profileModal.classList.add('active');
    activeTab = 'listas';
    tabBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="listas"]').classList.add('active');
    renderProfileTab();
});

/* --- SINGLE PRODUCT MODAL --- */
window.openProductModal = (id, tab = 'stores') => {
    const product = allData.find(x => x.id === id);
    if(!product) return;
    
    const tabsHTML = `
        <div class="pdp-tabs-container">
            <button class="pdp-tab-btn ${tab === 'stores' ? 'active' : ''}" onclick="openProductModal('${id}', 'stores')"><i data-lucide="store" style="width:16px; margin-right:4px;"></i> Comparar Tiendas</button>
            <button class="pdp-tab-btn ${tab === 'brands' ? 'active' : ''}" onclick="openProductModal('${id}', 'brands')"><i data-lucide="tags" style="width:16px; margin-right:4px;"></i> Comparar Marcas</button>
        </div>
    `;

    let dynamicContentHTML = '';

    if (tab === 'stores') {
        const tableRows = product.sortedOffers.map((offer, index) => {
            const store = stores[offer.store];
            const isBest = index === 0;
            const total = offer.price + offer.shipping;
            return `
                <tr class="${isBest ? 'best-row' : ''}">
                    <td>
                        <div class="store-cell">
                            <div class="store-badge" style="background-color: ${store.bgColor}; color: ${store.color}">${store.logo}</div>
                            ${store.name}
                        </div>
                    </td>
                    <td class="price-cell">${formatCurrency(offer.price)}</td>
                    <td class="shipping-cell">${offer.shipping === 0 ? '<span style="color:var(--success); font-weight:600;">Gratis</span>' : formatCurrency(offer.shipping)}</td>
                    <td class="delivery-cell">${offer.delivery}</td>
                    <td style="font-weight: 600;">${formatCurrency(total)}</td>
                    <td style="text-align: right;"><button onclick="startRedirect('${offer.store}', false)" class="btn-goto ${!isBest ? 'outline' : ''}" style="border-radius:var(--radius-sm); border: ${isBest ? 'none' : '1px solid var(--border-color)'}; cursor: pointer;">Ir a Tienda</button></td>
                </tr>
            `;
        }).join('');
        
        const curP = product.bestOffer.price;
        const vals = [curP * 1.18, curP * 1.05, curP * 1.10, curP];
        const maxV = Math.max(...vals);
        const minV = Math.min(...vals) * 0.90;
        const getY = (v) => 85 - ((v - minV) / (maxV - minV)) * 65;
        const xCoords = [25, 108, 191, 275];
        const yCoords = vals.map(getY);
        const linePoints = `${xCoords[0]},${yCoords[0]} ${xCoords[1]},${yCoords[1]} ${xCoords[2]},${yCoords[2]} ${xCoords[3]},${yCoords[3]}`;
        const areaPoints = `${linePoints} ${xCoords[3]},130 ${xCoords[0]},130`;
        
        dynamicContentHTML = `
            <div class="compare-table-container" style="box-shadow:none; border: 1px solid var(--border-color); margin-bottom: 2rem;">
                <table class="compare-table">
                    <thead><tr><th>Tienda</th><th>Precio</th><th>Envío</th><th>Entrega</th><th>Total</th><th></th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            
            <div class="price-chart-container" style="margin-top: 0;">
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i data-lucide="trending-down" style="color:var(--success); width:18px;"></i> Historial de Precios</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">El precio actual es tu ventana histórica perfecta para comprar.</p>
                <div style="position:relative; width: 100%; max-width: 480px; margin: 2rem auto 0; padding-bottom: 1rem;">
                    <svg viewBox="0 0 300 135" style="width: 100%; display:block; overflow: visible;">
                        <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--success)" stop-opacity="0.4"></stop><stop offset="100%" stop-color="var(--success)" stop-opacity="0.0"></stop></linearGradient></defs>
                        <polygon points="${areaPoints}" fill="url(#areaGradient)"></polygon>
                        <polyline points="${linePoints}" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
                        ${vals.map((v, i) => `
                            <circle cx="${xCoords[i]}" cy="${yCoords[i]}" r="${i === 3 ? '4.5' : '3.5'}" fill="var(--bg-primary)" stroke="var(--success)" stroke-width="2"></circle>
                            <text x="${xCoords[i]}" y="${yCoords[i] - 12}" text-anchor="middle" font-size="9" fill="var(--text-primary)" font-weight="600" style="font-family: inherit;">$${Math.floor(v)}</text>
                            <text x="${xCoords[i]}" y="${125}" text-anchor="middle" font-size="9" fill="${i === 3 ? 'var(--text-primary)' : 'var(--text-secondary)'}" font-weight="${i === 3 ? '600' : '400'}" style="font-family: inherit;">${['Ene', 'Feb', 'Mar', 'Hoy'][i]}</text>
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
                                <img src="${comp.image}" alt="${comp.title}">
                            </div>
                            <div class="product-info" style="padding: 1rem;">
                                <h3 class="product-title" style="font-size: 0.95rem;">${comp.title}</h3>
                                <div class="product-price">
                                    <span class="price-amount">${formatCurrency(comp.bestOffer.price)}</span>
                                </div>
                                <button onclick="openProductModal('${comp.id}', 'brands')" class="btn-primary" style="width:100%; margin-top:0.5rem; justify-content:center; padding: 0.5rem; font-size:0.85rem;">Analizar Producto</button>
                                
                                <details style="margin-top: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-secondary);">
                                    <summary style="padding: 0.5rem; font-size: 0.75rem; font-weight: 500; cursor: pointer; display: flex; justify-content: space-between; align-items: center; outline: none;">
                                        Ver Precios por Tienda <span style="color:var(--text-tertiary); font-size:0.7rem;">&#9662;</span>
                                    </summary>
                                    <ul style="list-style: none; padding: 0; margin: 0; background: var(--bg-primary); border-top: 1px solid var(--border-color);">
                                        ${comp.sortedOffers.map(coff => `
                                            <li style="padding: 0.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); font-size: 0.75rem;">
                                                <div style="display:flex; align-items:center; gap:0.25rem;">
                                                    <div style="width:12px; height:12px; border-radius:2px; background:${stores[coff.store].bgColor};"></div>
                                                    ${stores[coff.store].name}
                                                </div>
                                                <span style="font-weight:600;">${formatCurrency(coff.price)}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </details>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    pdpContentBody.innerHTML = `
        <div class="pdp-container">
            <div class="pdp-image-col">
                <img src="${product.image}" alt="${product.title}">
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
                        <button onclick="const q = document.getElementById('pdpQty'); q.value = Math.max(1, parseInt(q.value)-1);" style="padding: 0 0.75rem; border:none; background:none; cursor:pointer; font-size:1.2rem; font-weight:bold; color:var(--text-secondary);">&minus;</button>
                        <input id="pdpQty" type="number" value="1" min="1" style="width: 40px; border:none; background:none; text-align:center; font-weight:600; color:var(--text-primary); outline:none; font-family:inherit; -webkit-appearance: none; margin: 0;" onchange="this.value = Math.max(1, parseInt(this.value) || 1)">
                        <button onclick="const q = document.getElementById('pdpQty'); q.value = parseInt(q.value)+1;" style="padding: 0 0.75rem; border:none; background:none; cursor:pointer; font-size:1.2rem; font-weight:bold; color:var(--text-secondary);">&plus;</button>
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
    
    lucide.createIcons();
    window.scrollTo(0,0);
};

/* --- REDIRECT LOGIC --- */
window.startRedirect = (storeKey, isCart) => {
    if(cartModal.classList.contains('active')) cartModal.classList.remove('active');

    const store = stores[storeKey];
    
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
    
    if(isCart) {
        redirectTitle.innerText = `Armando Canasta en ${store.name}...`;
        redirectSubtitle.innerText = 'Transfiriendo tu lista con los mejores precios garantizados de afiliado.';
    } else {
        redirectTitle.innerText = `Conectando con ${store.name}...`;
        redirectSubtitle.innerText = 'Asegurando tu mejor precio unitario de afiliado.';
    }
    
    redirectModal.classList.add('active');
    lucide.createIcons();
    
    // Simular tiempo de transferencia
    setTimeout(() => {
        redirectSpinner.style.display = 'none';
        redirectStoreLogo.style.display = 'none';
        redirectTitle.style.display = 'none';
        redirectSubtitle.style.display = 'none';
        
        redirectSuccess.style.display = 'flex';
    }, 2800);
};
        alertModal.classList.remove('active');
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
    lucide.createIcons({ nodes: [toast] });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

/* --- REAL BARCODE SCANNER --- */
let html5QrCode = null;

openScannerBtn.addEventListener('click', () => {
    scannerModal.classList.add('active');
    lucide.createIcons();
    
    if (typeof Html5Qrcode === 'undefined') {
        showToast('Biblioteca de escáner no disponible', 'error');
        return;
    }
    
    html5QrCode = new Html5Qrcode('readerContainer');
    html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            // Buscar producto por código en el mock (simulamos match)
            const matched = allData.find(p => p.id === decodedText) || allData[Math.floor(Math.random() * allData.length)];
            stopScanner();
            openProductModal(matched.id);
            showToast(`Producto encontrado: ${matched.title}`, 'success');
        },
        () => {} // ignorar errores de frame
    ).catch((err) => {
        document.getElementById('scanStatus').textContent = 'No se pudo acceder a la cámara: ' + err;
        showToast('Permiso de cámara denegado', 'error');
    });
});

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
        html5QrCode = null;
    }
    scannerModal.classList.remove('active');
}

closeScannerBtn.addEventListener('click', stopScanner);

/* --- EVENT LISTENERS --- */
if(closePdpBtn) {
    closePdpBtn.addEventListener('click', () => {
        pdpPage.classList.remove('active');
        document.querySelector('.hero-section').style.display = 'block';
        document.getElementById('mainCatalog').style.display = 'block';
    });
}

closeAlertModal.addEventListener('click', () => alertModal.classList.remove('active'));
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
    lucide.createIcons();
});
closeLoginModal.addEventListener('click', () => loginModal.classList.remove('active'));
loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('active'); });

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
            const msg = error.message?.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message;
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
        if (error) return showAuthError('signupError', error.message);

        // Supabase puede requerir confirmación de email
        if (data?.user && !data?.session) {
            loginModal.classList.remove('active');
            showToast('¡Cuenta creada! Revisa tu correo para confirmar.', 'info', 6000);
        } else if (data?.session) {
            user = {
                id: data.session.user.id,
                email: data.session.user.email,
                name
            };
            saveState();
            loginModal.classList.remove('active');
            renderUserNav();
            showToast(`¡Bienvenido a Market2U, ${name}!`, 'success');
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

// Google OAuth
document.getElementById('googleSigninBtn').addEventListener('click', async () => {
    if (!AuthService.isReady()) return showToast('Supabase no configurado para OAuth', 'warning');
    const { error } = await AuthService.signInWithGoogle();
    if (error) showToast(error.message || 'Error con Google', 'error');
});

// Profile / Logout
closeProfileModal.addEventListener('click', () => profileModal.classList.remove('active'));
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.classList.remove('active'); });
logoutBtn.addEventListener('click', async () => {
    if (AuthService.isReady()) await AuthService.signOut();
    user = null;
    favorites.clear();
    alerts = [];
    savedLists = [];
    cart = [];
    saveState();
    profileModal.classList.remove('active');
    renderUserNav();
    updateCartUI();
    renderProducts(currentData);
    showToast('Sesión cerrada correctamente', 'info');
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        renderProfileTab();
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cartModal.classList.remove('active');
        loginModal.classList.remove('active');
        profileModal.classList.remove('active');
        redirectModal.classList.remove('active');
        alertModal.classList.remove('active');
        addressModal.classList.remove('active');
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
            'position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%);',
            'padding:0.5rem 1.4rem; border-radius:20px; font-size:0.85rem;',
            'font-weight:600; z-index:9999; box-shadow:0 4px 20px rgba(0,0,0,.15);',
            'transition:background 0.3s, opacity 0.3s; color:white;',
        ].join('');
        document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.background = color;
    el.style.opacity = '1';
};
const hideMLBadge = (delay = 0) => {
    const el = document.getElementById('mlLoadingBadge');
    if (!el) return;
    if (delay > 0) setTimeout(() => el.remove(), delay);
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
    showMLBadge(`⚡ Buscando en la Nube (Soriana/Chedraui)... ${isPagination ? '[Pagina ' + ((currentOffset/currentSearchLimit)+1) + ']' : ''}`);

    try {
        const mlResults = await MLService.searchGeneral(query, currentSearchLimit, currentOffset);

        if (!mlResults || mlResults.length === 0) {
            hideMLBadge();
            // Si ya no hay resultados paginados, podríamos ocultar el botón
            const btn = document.getElementById('loadMoreBtn');
            if (btn) btn.style.display = 'none';
            return;
        }

        // Limpiar resultados previos SOLO si es una búsqueda nueva
        if (!isPagination) {
           allData = allData.filter(p => !p.id?.startsWith('sor_') && !p.id?.startsWith('che_'));
        }

        const mergedScraped = mergeProducts(mlResults);
        const processedML = processProducts(mergedScraped);

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

        showMLBadge(`✓ ${newFromML.length} resultados de Mercado Libre`, '#10b981');
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

const applyFilters = () => {
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
    if (query.length >= 3) {
        clearTimeout(mlSearchTimeout);
        lastMLQuery = '';  // reset para permitir re-búsqueda al cambiar query
        currentOffset = 0;
        mlSearchTimeout = setTimeout(() => runMLSearch(query, false), 700);
    } else {
        hideMLBadge();
    }
};

searchInput.addEventListener('input', applyFilters);
sortSelect.addEventListener('change', applyFilters);
searchButton.addEventListener('click', () => {
    clearTimeout(mlSearchTimeout);
    isSearchingML = false;   // forzar re-búsqueda aunque haya una en curso
    lastMLQuery   = '';      // forzar re-búsqueda aunque sea la misma query
    currentOffset = 0;

    applyFilters();
    document.getElementById('resultsTitle')?.scrollIntoView({ behavior: 'smooth' });
    
    // Lanzar ML inmediatamente (sin debounce)
    const query = searchInput.value.toLowerCase().trim();
    if (query.length >= 3) runMLSearch(query, false);
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
    lucide.createIcons();
});

closeMatrixModal.addEventListener('click', () => matrixModal.classList.remove('active'));

// INITIALIZE
allData = processProducts(products);
currentData = [...allData];
loadState();

initStoreFilters();
renderProducts(currentData);
renderUserNav();
updateCartUI();
renderNotifications();

// Restaurar sesión de Supabase al recargar
(async () => {
    if (!AuthService.isReady()) return;
    const session = await AuthService.getSession();
    if (session?.user) {
        user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        };
        saveState();
        renderUserNav();
        await syncListsFromSupabase();
        console.log('[Market2U] Sesión restaurada:', user.name);
    }
    // Escuchar cambios de sesión (ej. OAuth redirect)
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
            showToast(`¡Bienvenido, ${user.name}!`, 'success');
            await syncListsFromSupabase();
        } else if (user) {
            user = null;
            saveState();
            renderUserNav();
        }
    });
})();

// PWA - Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[Market2U PWA] Service Worker registrado:', reg.scope);
        }).catch(err => {
            console.warn('[Market2U PWA] Sin SW (requiere HTTPS o localhost):', err.message);
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
