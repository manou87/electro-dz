#!/bin/bash
# Push vers GitHub — token saisi une fois via fenêtre macOS (ne pas l'envoyer dans le chat).
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="https://github.com/manou87/electro-dz.git"
USER="manou87"

echo "=== Publication electro-dz sur GitHub ==="

TOKEN=""
LOCAL_FILE=".github-token.local"

if [[ -f "$LOCAL_FILE" ]]; then
  TOKEN="$(tr -d '[:space:]' < "$LOCAL_FILE")"
  echo "Token lu depuis $LOCAL_FILE (fichier local, non envoyé sur GitHub)."
elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
  TOKEN="$GITHUB_TOKEN"
else
  echo "Ouvrez la fenêtre et collez votre token GitHub (repo)…"
  TOKEN="$(osascript 2>/dev/null <<'APPLE' || true
display dialog "Collez votre token GitHub (Personal Access Token) :" default answer "" with hidden answer buttons {"Annuler", "OK"} default button "OK"
if button returned of result is "OK" then
  return text returned of result
else
  return ""
end if
APPLE
)"
fi

if [[ -z "$TOKEN" ]]; then
  echo "❌ Aucun token. Créez le fichier .github-token.local avec le token dedans, ou relancez le script."
  exit 1
fi

export GIT_TERMINAL_PROMPT=0
git push "https://${USER}:${TOKEN}@github.com/manou87/electro-dz.git" main

echo ""
echo "✅ Push réussi."
echo "   Dépôt : https://github.com/manou87/electro-dz"
echo "   Site  : https://electro-dz.com/bibliotheque.html (2–5 min)"
echo ""
echo "Conseil : révoquez ce token s'il a déjà été collé dans un chat, puis créez-en un nouveau."
