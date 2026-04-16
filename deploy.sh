#!/bin/bash
# =============================================
# Market4U — Deploy Script para Supabase
# =============================================
# Uso: ./deploy.sh <TU_ACCESS_TOKEN>
# Obtén el token en: https://supabase.com/dashboard/account/tokens
# =============================================

set -e

SUPABASE_CLI="$HOME/bin/supabase"
PROJECT_REF="yiolvrhxjkozebcorqep"
ACCESS_TOKEN="${1:-}"

if [ -z "$ACCESS_TOKEN" ]; then
    echo ""
    echo "❌ Falta el Access Token de Supabase."
    echo ""
    echo "👉 Sigue estos pasos:"
    echo "   1. Ve a: https://supabase.com/dashboard/account/tokens"
    echo "   2. Genera un nuevo token con nombre 'Market4U CLI'"
    echo "   3. Copia el token y ejecuta:"
    echo "      ./deploy.sh sbp_xxxxxxxxxxxxxxxxxxxx"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Market4U — Iniciando deploy en Supabase..."
echo "   Proyecto: $PROJECT_REF"
echo ""

# 1. Login con el token
echo "🔑 Autenticando con Supabase..."
$SUPABASE_CLI logout 2>/dev/null || true
echo "$ACCESS_TOKEN" | $SUPABASE_CLI login --token "$ACCESS_TOKEN" 2>/dev/null || \
    $SUPABASE_CLI login --ci --token "$ACCESS_TOKEN" 2>/dev/null || true

# 2. Vincular proyecto
echo "🔗 Vinculando proyecto $PROJECT_REF..."
$SUPABASE_CLI link --project-ref "$PROJECT_REF" --debug 2>&1 | tail -3

# 3. Configurar Secrets de ML en la Edge Function
echo ""
echo "🔐 Configurando secrets de Mercado Libre..."
$SUPABASE_CLI secrets set \
    ML_CLIENT_ID=3207441237450946 \
    ML_CLIENT_SECRET=vZtmvA8gaiQtwupw3ftM2XblUQ7kXfAv \
    --project-ref "$PROJECT_REF"

# 4. Deploy Edge Function ml-search
echo ""
echo "⚡ Desplegando Edge Function ml-search..."
$SUPABASE_CLI functions deploy ml-search \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt

echo ""
echo "✅ Edge Function desplegada correctamente."
echo "   URL: https://$PROJECT_REF.supabase.co/functions/v1/ml-search"
echo ""

# 5. Ejecutar el schema SQL
echo "🗄️  Ejecutando schema de base de datos..."
$SUPABASE_CLI db push --project-ref "$PROJECT_REF" 2>/dev/null || \
    echo "⚠️  Para ejecutar el SQL, ve al SQL Editor de Supabase (ver instrucciones al final)"

echo ""
echo "========================================"
echo "✅ Deploy completado."
echo ""
echo "📋 Próximos pasos:"
echo "   1. Si el SQL no se ejecutó automáticamente, ve a:"
echo "      https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "      y pega el contenido de database.sql"
echo ""
echo "   2. Habilitar Google OAuth en Supabase:"
echo "      Authentication > Providers > Google"
echo "      https://supabase.com/dashboard/project/$PROJECT_REF/auth/providers"
echo ""
echo "   3. Agregar URL de redirect permitida:"
echo "      Authentication > URL Configuration"
echo "      Redirect URL: http://localhost:3003"
echo "========================================"
