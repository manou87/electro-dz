#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
rm -rf "$ROOT/www"
mkdir -p "$ROOT/www"
cp -a "$ROOT/../simu-plc-pro/." "$ROOT/www/"
rm -rf "$ROOT/www/android-apk"
python3 - <<'PY'
import json
from pathlib import Path
p=Path('www/manifest.json')
m=json.loads(p.read_text())
m.update({'name':'Simu PLC Pro','short_name':'SimuPLC Pro','start_url':'./index.html','scope':'./','display':'standalone','lang':'fr'})
p.write_text(json.dumps(m, ensure_ascii=False, indent=2)+'\n')
PY
npx cap sync android
