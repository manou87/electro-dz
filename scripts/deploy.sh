#!/bin/bash
# Publie le site sur GitHub (electro-dz.com suit ce dépôt selon votre hébergeur).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Electro DZ — déploiement site ==="
echo ""

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠️  Modifications non commitées. Commit automatique…"
  git add -A
  git -c user.name="${GIT_AUTHOR_NAME:-Othman}" -c user.email="${GIT_AUTHOR_EMAIL:-ot21@gmx.ch}" \
    commit -m "Mise à jour site Electro DZ" || true
fi

if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "Connexion GitHub (une seule fois)…"
    gh auth login
  fi
  echo "Push vers origin/main…"
  git push origin main
  echo ""
  echo "✅ Envoyé sur https://github.com/manou87/electro-dz"
  echo "   Bibliothèque : https://electro-dz.com/bibliotheque.html (après propagation hébergeur)"
  exit 0
fi

echo "GitHub CLI (gh) non installé."
echo ""
echo "Option A — Installer gh puis relancer ce script :"
echo "  brew install gh   # ou https://cli.github.com/"
echo "  bash scripts/deploy.sh"
echo ""
echo "Option B — Push manuel (mot de passe = Personal Access Token, pas le mot de passe du site) :"
echo "  git push origin main"
echo ""
echo "Créer un token : GitHub → Settings → Developer settings → Personal access tokens"
echo ""
exit 1
