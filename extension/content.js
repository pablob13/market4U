// content.js - Se ejecuta dentro del supermercado
console.log("Market4U Auto-Checkout cargado en esta página.");

// Revisar si tenemos un carrito pendiente de agregar
chrome.storage.local.get(['pendingCart'], async (result) => {
    if (result.pendingCart) {
        const { store, items } = result.pendingCart;
        
        // Verificar que estemos en la página correcta
        const currentUrl = window.location.href;
        if (!currentUrl.includes(store)) return; // Prevención de errores
        
        console.log("¡Market4U ha detectado un carrito entrante!", items);
        
        // --- AQUÍ IRÁ LA LÓGICA DE INYECCIÓN DE CADA SUPERMERCADO ---
        // Ejemplo para Jüsto (Usando su API de GraphQL internamente o simulando clicks):
        if (store === 'justo') {
            // alert("Auto-agregando " + items.length + " artículos a Jüsto...");
            // Lógica pendiente de desarrollo: iterar items y lanzar fetch('https://api.justo.mx/graphql/...')
            // Una vez completado, limpiar el storage:
            // chrome.storage.local.remove(['pendingCart']);
        }
        
        if (store === 'fresko' || store === 'lacomer') {
            // Lógica pendiente
        }
        
        if (store === 'soriana') {
            // Lógica pendiente
        }
    }
});
