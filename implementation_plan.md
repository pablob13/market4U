# Reparación de Inicio de Sesión y Alertas (Supabase)

El objetivo es estabilizar el flujo de autenticación y vincular el modal de alertas a la base de datos persistente.

## Cambios Propuestos

### 1. Panel de Configuración de Alertas (App.js y Services.js)
El botón actual de "Activar Alerta" guarda la alerta de precio en la memoria local (RAM/Navegador), la cual desaparece o no se sincroniza con la nube. 
- Crearé una nueva función `MLService.saveAlert(productId, targetPrice, promo)` en `services.js` que se comunique mediante la API de Supabase para insertar el registro directamente en la tabla `price_alerts` asegurando el mapeo con el ID de usuario activo.
- Refactorizaré el `saveAlertBtn.addEventListener` en `app.js` para que espere la confirmación de la base de datos antes de cerrar el modal e inyectar un *toast* verde de éxito real.

### 2. Estabilización de Autenticación (Supabase UI Flow)
La principal razón por la que "falla" el inicio de sesión en Supabase recién creado es que bloquea a los usuarios hasta que confirmen su correo por defecto.
- Refactorizaré el mensaje de error de `signIn` y `signUp` en `app.js` para capturar el error `Email not confirmed` e instruir al usuario visualmente a revisar su correo (o apagar el candado de confirmación en su consola).

## Preguntas Abiertas
Para el inicio de sesión: ¿Te sale el error rojo de "Invalid login credentials"? 

## User Review Required
> [!IMPORTANT]
> Aprobar este plan modificará la arquitectura de persistencia de las alertas (pasando de memoria temporal a base de datos real).
