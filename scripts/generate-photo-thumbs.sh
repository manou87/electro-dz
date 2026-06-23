#!/usr/bin/env bash
# Miniatures tableau coffret — thumbs ~72px, medium ~240px (sips macOS / Linux: ImageMagick)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PHOTOS="$ROOT/simulation-swissdz/photos"
mkdir -p "$PHOTOS/thumbs" "$PHOTOS/medium"
count=0
for f in "$PHOTOS"/photo-*.png; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")
  [[ "$base" == debug* ]] && continue
  if command -v sips >/dev/null 2>&1; then
    sips -Z 72 "$f" --out "$PHOTOS/thumbs/$base" >/dev/null
    sips -Z 240 "$f" --out "$PHOTOS/medium/$base" >/dev/null
  elif command -v convert >/dev/null 2>&1; then
    convert "$f" -resize 72x72\> "$PHOTOS/thumbs/$base"
    convert "$f" -resize 240x240\> "$PHOTOS/medium/$base"
  else
    echo "Installez sips (macOS) ou ImageMagick (convert)." >&2
    exit 1
  fi
  count=$((count + 1))
done
echo "OK: $count paires thumbs/ + medium/ dans simulation-swissdz/photos/"
