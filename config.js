// =============================================
// Market2U — Configuración de Servicios
// =============================================
// INSTRUCCIONES:
// 1. Crea un proyecto en https://supabase.com (gratis)
// 2. Ve a Project Settings > API
// 3. Pega aquí tu URL y Anon Key

const CONFIG = {
    // --- SUPABASE ---
    SUPABASE_URL:      'https://yiolvrhxjkozebcorqep.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2x2cmh4amtvemViY29ycWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTcwOTksImV4cCI6MjA5MTc3MzA5OX0.bYMXCyH4lsmHhS2Y4zNNhy5EV_otw8X4qtsu9Wxee_Q',

    // --- MERCADO LIBRE ---
    // La búsqueda usa scraping vía Edge Function de Supabase (sin API bloqueada)
    ML_SITE_ID:      'MLM',  // MLM = México
    ML_SEARCH_URL:   'https://yiolvrhxjkozebcorqep.supabase.co/functions/v1/ml-search',
    ML_CLIENT_ID:    '3207441237450946',
    ML_CLIENT_SECRET: 'gBNcFYhev8aB7IfLOSov2ktuITEQwLFD',
    // Token de usuario (válido 6h) — se renueva via client_credentials automáticamente
    ML_ACCESS_TOKEN: 'APP_USR-3207441237450946-041512-796ab093f7eb1d0cb75e45972c41ff47-376188817',

    // --- APP ---
    APP_NAME:      'Market2U',
    APP_VERSION:   '2.0.0',
    IS_PRODUCTION: false,  // Cambia a true cuando despliegues en Vercel
};
