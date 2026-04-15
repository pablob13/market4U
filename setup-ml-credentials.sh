#!/bin/bash
# =============================================
# Market2U — Setup de Credenciales ML en Supabase
# USO: bash setup-ml-credentials.sh <CLIENT_ID> <CLIENT_SECRET>
# =============================================

set -e

PROJECT_REF="yiolvrhxjkozebcorqep"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpb2x2cmh4amtvemViY29ycWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTcwOTksImV4cCI6MjA5MTc3MzA5OX0.bYMXCyH4lsmHhS2Y4zNNhy5EV_otw8X4qtsu9Wxee_Q"

ML_CLIENT_ID="${1}"
ML_CLIENT_SECRET="${2}"

if [ -z "$ML_CLIENT_ID" ] || [ -z "$ML_CLIENT_SECRET" ]; then
  echo "❌ Uso: bash setup-ml-credentials.sh <CLIENT_ID> <CLIENT_SECRET>"
  echo ""
  echo "Obtén tus credenciales en: https://developers.mercadolibre.com.mx/apps/list"
  exit 1
fi

echo "======================================="
echo "  Market2U — Configurando ML en Supabase"
echo "======================================="
echo ""

# ---- PASO 1: Verificar que client_credentials funciona ----
echo "▶ Paso 1/3: Verificando credenciales de Mercado Libre..."
TOKEN_RESPONSE=$(curl -s -X POST "https://api.mercadolibre.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${ML_CLIENT_ID}&client_secret=${ML_CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ No se pudo obtener token. Verifica tu Client ID y Client Secret."
  echo "Respuesta de ML: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido correctamente: ${ACCESS_TOKEN:0:30}..."

# ---- PASO 2: Verificar búsqueda funciona ----
echo ""
echo "▶ Paso 2/3: Probando búsqueda en ML API..."
SEARCH_RESPONSE=$(curl -s "https://api.mercadolibre.com/sites/MLM/search?q=leche&limit=2" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

RESULT_COUNT=$(echo "$SEARCH_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('results',[])))" 2>/dev/null)
FIRST_TITLE=$(echo "$SEARCH_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('results',[]); print(r[0]['title'][:50] if r else 'N/A')" 2>/dev/null)

if [ "$RESULT_COUNT" -gt "0" ] 2>/dev/null; then
  echo "✅ ML API funciona. Resultados: $RESULT_COUNT"
  echo "   Primer resultado: $FIRST_TITLE"
else
  echo "⚠️  ML API respondió pero sin resultados. Respuesta: ${SEARCH_RESPONSE:0:200}"
fi

# ---- PASO 3: Subir secrets a Supabase via Management API ----
echo ""
echo "▶ Paso 3/3: Configurando Supabase Secrets..."
echo ""
echo "  IMPORTANTE: Para subir secrets necesitas tu Service Role Key de Supabase."
echo "  Ve a: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
echo "  Copia la 'service_role' key y ejecútalo así:"
echo ""
echo "  bash setup-ml-credentials.sh $ML_CLIENT_ID $ML_CLIENT_SECRET <SERVICE_ROLE_KEY>"
echo ""

SERVICE_ROLE_KEY="${3}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "  (Sin service key, saltando configuración automática de secrets)"
  echo ""
  echo "  ============================================="
  echo "  OPCIÓN MANUAL — Configura en Supabase así:"
  echo "  ============================================="
  echo "  1. Ve a: https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
  echo "  2. Haz clic en la función 'ml-search'"
  echo "  3. Ve a 'Secrets & Variables'"
  echo "  4. Agrega:"
  echo "     ML_CLIENT_ID = $ML_CLIENT_ID"
  echo "     ML_CLIENT_SECRET = $ML_CLIENT_SECRET"
  echo ""
else
  # Subir secrets via Management API
  echo "  Subiendo ML_CLIENT_ID..."
  curl -s -X PATCH \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "[{\"name\":\"ML_CLIENT_ID\",\"value\":\"${ML_CLIENT_ID}\"},{\"name\":\"ML_CLIENT_SECRET\",\"value\":\"${ML_CLIENT_SECRET}\"}]"
  echo ""
  echo "✅ Secrets configurados en Supabase"
fi

# ---- INSTRUCCIONES PARA DESPLEGAR LA EDGE FUNCTION ----
echo ""
echo "======================================="
echo "  SIGUIENTE PASO: Desplegar Edge Function"
echo "======================================="
echo ""
echo "  Copia el contenido de:"
echo "  supabase-functions/ml-search/index.ts"
echo ""
echo "  Y pégalo en Supabase Dashboard:"
echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/functions/ml-search/details"
echo ""
echo "  O instala Supabase CLI y ejecuta:"
echo "  npx supabase functions deploy ml-search --project-ref ${PROJECT_REF}"
echo ""
echo "======================================="
echo "✅ Setup completado"
echo "======================================="
