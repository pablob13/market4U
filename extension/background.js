// background.js - Service Worker de la extensión
// Escucha cuando la página web de Market4U envía una solicitud para hacer auto-checkout a través de content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'AUTO_CHECKOUT') {
        const { store, items } = request;
        
        // Guardar el carrito temporalmente en el storage de la extensión
        chrome.storage.local.set({ pendingCart: { store, items } }, () => {
            // Abrir la pestaña del supermercado correspondiente
            let url = '';
            if (store === 'justo') url = 'https://justo.mx/cart/';
            if (store === 'fresko') url = 'https://www.fresko.com.mx/fresko/';
            if (store === 'soriana') url = 'https://www.soriana.com/carrito/';
            if (store === 'lacomer') url = 'https://www.lacomer.com.mx/lacomer/';
            if (store === 'citymarket') url = 'https://www.citymarket.com.mx/citymarket/';
            
            if (url) {
                chrome.tabs.create({ url });
                sendResponse({ success: true, message: 'Navegando a ' + store });
            } else {
                sendResponse({ success: false, message: 'Tienda no soportada' });
            }
        });
        return true;
    }
});
