// =============================================
// Market2U — Configuración de Servicios
// =============================================
// INSTRUCCIONES:
// 1. Supabase: crea proyecto en https://supabase.com
//    Settings > API > copia URL y anon key
// 2. Mercado Libre: regístrate en https://developers.mercadolibre.com
//    Mis apps > Nueva app > copia client_id y client_secret
//    Luego ejecuta (en terminal o Supabase Edge Function):
//    curl -X POST https://api.mercadolibre.com/oauth/token \
//      -d 'grant_type=client_credentials&client_id=TU_ID&client_secret=TU_SECRET'
//    y pega el access_token resultante abajo.

const CONFIG = {
    // --- SUPABASE ---
    SUPABASE_URL: 'https://yiolvrhxjkozebcorqep.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2x2cmh4amtvemViY29ycWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTcwOTksImV4cCI6MjA5MTc3MzA5OX0.bYMXCyH4lsmHhS2Y4zNNhy5EV_otw8X4qtsu9Wxee_Q',
    // Edge Function para proxy de ML (ya desplegada)
    ML_SEARCH_URL: 'https://yiolvrhxjkozebcorqep.supabase.co/functions/v1/ml-search',

    // --- MERCADO LIBRE ---
    // access_token que obtuviste con client_credentials:
    ML_ACCESS_TOKEN: 'APP_USR-3207441237450946-041419-aecf139c2ba8bd740d3509fb1ac78b76-376188817',
    ML_CLIENT_ID: '3207441237450946',
    ML_CLIENT_SECRET: 'vZtmvA8gaiQtwupw3ftM2XblUQ7kXfAv',
    ML_SITE_ID: 'MLM',   // MLM = México
    
    // --- APP ---
    APP_NAME: 'Market2U',
    APP_VERSION: '2.0.0',
    IS_PRODUCTION: true,
};
