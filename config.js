// =============================================
// Market2U — Configuración de Servicios
// =============================================
// INSTRUCCIONES:
// 1. Crea un proyecto en https://supabase.com (gratis)
// 2. Ve a Project Settings > API
// 3. Pega aquí tu URL y Anon Key

const CONFIG = {
    // --- SUPABASE ---
    SUPABASE_URL: 'TU_SUPABASE_URL_AQUI',         // ej: https://xyzxyz.supabase.co
    SUPABASE_ANON_KEY: 'TU_SUPABASE_ANON_KEY_AQUI', // ej: eyJhbGciOiJIUzI1NiIs...

    // --- MERCADO LIBRE ---
    // No requiere credenciales para búsquedas públicas
    ML_SITE_ID: 'MLM', // MLM = México

    // --- APP ---
    APP_NAME: 'Market2U',
    APP_VERSION: '2.0.0',
    IS_PRODUCTION: false, // Cambia a true cuando desplegues en Vercel
};
