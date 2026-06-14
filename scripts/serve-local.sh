#!/bin/sh
# Serveur local obligatoire pour tester les courbes constructeur (fetch JSON).
# Usage : ./scripts/serve-local.sh
# Puis ouvrir : http://localhost:8765/calcul-electrique.html
cd "$(dirname "$0")/.." || exit 1
PORT="${PORT:-8765}"
echo "ElectroDZ — http://localhost:${PORT}/"
echo "Thème Liquid Glass — http://localhost:${PORT}/index.html?glass=1"
echo "Thème Electric Neon — http://localhost:${PORT}/preview-neon.html"
echo "Thème Liquid Glass  — http://localhost:${PORT}/preview-glass.html"
echo "Arrêt : Ctrl+C"
exec python3 -m http.server "$PORT"
