#!/bin/bash
# Ouvre les réglages token GitHub, attend un token avec droit push, puis git push.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== SwissDZ — configuration push GitHub ==="

open "https://github.com/settings/personal-access-tokens?type=beta" 2>/dev/null || true

cat <<'TXT'

1. Ouvrez « electro-dz-mac » → Edit (ou Regenerate)
2. Repository : manou87/electro-dz
3. Contents → Read and write
4. Copiez le token (github_pat_…)
5. Le script détecte le presse-papiers et pousse automatiquement…

TXT

OLD=""
if [[ -f .github-token.local ]]; then OLD="$(tr -d '[:space:]' < .github-token.local)"; fi

for i in $(seq 1 90); do
  CLIP="$(pbpaste 2>/dev/null | tr -d '[:space:]' || true)"
  case "$CLIP" in
    github_pat_*|ghp_*) ;;
    *) sleep 2; continue ;;
  esac

  if [[ -n "$OLD" && "$CLIP" == "$OLD" ]]; then
    if node scripts/verify-github-token.mjs 2>/dev/null; then
      echo "Token actuel OK — push…"
      bash scripts/push-now.sh
      exit 0
    fi
    sleep 2
    continue
  fi

  printf '%s' "$CLIP" > .github-token.local
  chmod 600 .github-token.local
  export GITHUB_TOKEN="$CLIP"

  if node scripts/verify-github-token.mjs 2>/dev/null; then
    echo "Nouveau token valide — push…"
    bash scripts/push-now.sh
    exit 0
  fi

  echo "Token copié mais toujours sans droit push — vérifiez Contents: Read and write."
  OLD="$CLIP"
  sleep 2
done

echo "Délai dépassé. Copiez un token avec Contents: Read and write puis relancez :"
echo "  bash scripts/setup-github-push-mac.sh"
exit 1
