#!/bin/bash
# Attend le token Supabase puis exécute le SQL automatiquement.
set -euo pipefail
cd "$(dirname "$0")/.."
TOKEN_FILE=".supabase-access-token"
WAIT_SEC="${1:-180}"

if [[ -s "$TOKEN_FILE" ]]; then
  echo "Token trouvé."
  node scripts/exec-supabase-sql.mjs
  exit $?
fi

echo "════════════════════════════════════════════════════════"
echo " 1. Créez un token : https://supabase.com/dashboard/account/tokens"
echo "    (cochez : database write + auth, ou « All »)"
echo " 2. Enregistrez-le dans :"
echo "    $(pwd)/$TOKEN_FILE"
echo "    (une seule ligne, commence par sbp_…)"
echo "════════════════════════════════════════════════════════"
open "https://supabase.com/dashboard/account/tokens"

for ((i=1; i<=WAIT_SEC; i++)); do
  if [[ -s "$TOKEN_FILE" ]]; then
    echo ""
    echo "→ Token détecté, exécution du SQL…"
    node scripts/exec-supabase-sql.mjs
    exit $?
  fi
  if (( i % 15 == 0 )); then
    echo "  … en attente du fichier $TOKEN_FILE ($i s)"
  fi
  sleep 1
done

echo ""
echo "Délai dépassé. Relancez : bash scripts/wait-and-setup-supabase.sh"
exit 1
