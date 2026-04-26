// content.js - Inyectado en Market4U y en los Supermercados

// 1. MODO PUENTE (Cuando estamos en Market4U)
if (window.location.hostname.includes('localhost') || window.location.hostname.includes('vercel.app')) {
    console.log("🛒 Market4U Extension Bridge activado.");
    
    // Escuchar mensajes de la página web de Market4U
    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        if (event.data && event.data.type === "MARKET4U_AUTO_CHECKOUT") {
            console.log("Enviando carrito a la extensión...", event.data.payload);
            // Reenviar el mensaje al background.js
            chrome.runtime.sendMessage({
                action: 'AUTO_CHECKOUT',
                store: event.data.payload.store,
                items: event.data.payload.items
            }, (response) => {
                console.log("Background respondió:", response);
                window.postMessage({ type: "MARKET4U_EXTENSION_ACK" }, "*");
            });
        }
    });
}

// 2. MODO ROBOT (Cuando estamos en un Supermercado)
else {
    console.log("🤖 Market4U Robot activado en", window.location.hostname);
    
    chrome.storage.local.get(['pendingCart'], async (result) => {
        if (!result.pendingCart) return;
        
        const { store, items } = result.pendingCart;
        
        // --- LÓGICA SORIANA ---
        if (store === 'soriana' && window.location.hostname.includes('soriana.com')) {
            console.log("Iniciando inyección en Soriana...", items);
            
            // 1. Obtener el CSRF token de la página
            let csrfToken = '';
            const csrfInput = document.querySelector('input[name="csrf_token"]');
            if (csrfInput) {
                csrfToken = csrfInput.value;
            } else {
                // Alternativa: buscar en los forms
                const forms = document.querySelectorAll('form');
                for (let f of forms) {
                    let input = f.querySelector('[name="csrf_token"]');
                    if (input) { csrfToken = input.value; break; }
                }
            }
            
            if (!csrfToken) {
                alert("Market4U: No se pudo encontrar el token de seguridad de Soriana. Asegúrate de haber seleccionado una ubicación/código postal primero.");
                return;
            }
            
            // 2. Iterar e inyectar cada producto al carrito
            let addedCount = 0;
            
            for (const item of items) {
                // El id de soriana viene como 'sor_11400966'. Necesitamos extraer el número.
                const pid = item.product.id.split('_')[1] || item.product.sku_id || item.product.id;
                
                const formData = new URLSearchParams();
                formData.append('pid', pid);
                formData.append('quantity', item.quantity);
                formData.append('csrf_token', csrfToken);
                
                try {
                    const res = await fetch('/on/demandware.store/Sites-Soriana-Site/default/Cart-AddProduct', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: formData.toString()
                    });
                    
                    if (res.ok) {
                        addedCount++;
                        console.log(`✅ Agregado: ${item.product.title} (${item.quantity})`);
                    } else {
                        console.error(`❌ Falló agregar: ${item.product.title}`);
                    }
                } catch (err) {
                    console.error("Fetch error:", err);
                }
                
                // Esperar 500ms entre peticiones para no saturar al servidor
                await new Promise(r => setTimeout(r, 500));
            }
            
            // 3. Limpiar carrito y redirigir al checkout
            chrome.storage.local.remove(['pendingCart'], () => {
                alert(`¡Market4U agregó ${addedCount} productos a tu carrito exitosamente!`);
                window.location.href = 'https://www.soriana.com/carrito/';
            });
        }
    });
}
