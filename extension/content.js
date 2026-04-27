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
            
            // 1. Intentar obtener el CSRF token de la página actual
            let csrfToken = '';
            let csrfInput = document.querySelector('input[name="csrf_token"]');
            
            if (csrfInput) {
                csrfToken = csrfInput.value;
            } else {
                // Alternativa: buscar en todos los forms
                const forms = document.querySelectorAll('form');
                for (let f of forms) {
                    let input = f.querySelector('[name="csrf_token"]');
                    if (input) { csrfToken = input.value; break; }
                }
            }
            
            // Si la página actual no tiene formularios (ej. carrito vacío), lo robamos haciendo un fetch a la página principal
            if (!csrfToken) {
                console.log("No se encontró token en el DOM. Obteniendo de la página principal...");
                try {
                    const homeRes = await fetch('/');
                    const homeText = await homeRes.text();
                    const match = homeText.match(/name="csrf_token"\s+value="([^"]+)"/);
                    if (match && match[1]) {
                        csrfToken = match[1];
                        console.log("Token extraído exitosamente del background!");
                    }
                } catch(e) {
                    console.error("No se pudo obtener el token remoto", e);
                }
            }
            
            if (!csrfToken) {
                const banner = document.createElement('div');
                banner.innerHTML = `
                    <div style="position: fixed; bottom: 0; left: 0; width: 100%; background: #E41D2C; color: white; padding: 15px; text-align: center; z-index: 999999; font-family: sans-serif; font-size: 16px; box-shadow: 0 -4px 6px rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; gap: 20px;">
                        <span>🛒 <strong>Market4U:</strong> ¡Pausa! Necesitamos que ingreses tu <strong>Código Postal</strong> o Inicies Sesión para poder inyectar tus productos.</span>
                        <button id="m4u-retry" style="padding: 8px 16px; background: white; color: #E41D2C; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s;">Ya lo ingresé, Inyectar Carrito</button>
                    </div>
                `;
                document.body.appendChild(banner);
                
                document.getElementById('m4u-retry').addEventListener('click', () => {
                    window.location.reload();
                });
                return;
            }
            
            // Si hay token, mostramos banner de que estamos trabajando
            const workBanner = document.createElement('div');
            workBanner.innerHTML = `
                <div style="position: fixed; bottom: 0; left: 0; width: 100%; background: #007a4c; color: white; padding: 15px; text-align: center; z-index: 999999; font-family: sans-serif; font-size: 16px; box-shadow: 0 -4px 6px rgba(0,0,0,0.2);">
                    🪄 <strong>Market4U:</strong> Agregando productos mágicamente. Por favor no cierres esta pestaña...
                </div>
            `;
            document.body.appendChild(workBanner);
            
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
                workBanner.innerHTML = `
                    <div style="position: fixed; bottom: 0; left: 0; width: 100%; background: #007a4c; color: white; padding: 15px; text-align: center; z-index: 999999; font-family: sans-serif; font-size: 16px; box-shadow: 0 -4px 6px rgba(0,0,0,0.2);">
                        ✅ <strong>¡Éxito!</strong> Se inyectaron ${addedCount} productos a tu carrito. Llevándote a la caja...
                    </div>
                `;
                setTimeout(() => {
                    window.location.href = 'https://www.soriana.com/carrito/';
                }, 1500);
            });
        }
    });
}
