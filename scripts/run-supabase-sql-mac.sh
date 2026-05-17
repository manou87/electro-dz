#!/bin/bash
# Colle et exécute TOUT-EXECUTER-UNE-FOIS.sql dans Supabase SQL Editor (Chrome, macOS).
set -euo pipefail
cd "$(dirname "$0")/.."
SQL_FILE="supabase/TOUT-EXECUTER-UNE-FOIS.sql"
URL="https://supabase.com/dashboard/project/wxiqqcnzcxswdqzubxyt/sql/new"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Fichier introuvable: $SQL_FILE"
  exit 1
fi

pbcopy < "$SQL_FILE"
echo "→ SQL copié dans le presse-papiers ($(wc -l < "$SQL_FILE" | tr -d ' ') lignes)"
open "$URL"
echo "→ Ouverture de l’éditeur SQL Supabase…"

sleep 5

osascript <<'APPLESCRIPT' || true
if application "Comet" is running then
  tell application "Comet" to activate
else if application "Safari" is running then
  tell application "Safari" to activate
else
  tell application "Safari" to activate
end if
delay 1.2
tell application "System Events"
  keystroke "a" using command down
  delay 0.25
  keystroke "v" using command down
  delay 0.6
  keystroke return using command down
end tell
APPLESCRIPT

echo "→ Collage + exécution envoyés (navigateur connecté à Supabase)."
echo "  Vérifiez dans le navigateur que le SQL a bien tourné (Success)."
