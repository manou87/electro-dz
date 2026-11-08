# EM offline save + PDF (local)

## Broken
- Save called Electromarker `PUT /v3.5.1/marking/:id` with no local backend → no-op / errors; guest path only cleared auth UI.
- Bootstrap marking had no `id` / `profile.id`, so authorized save never ran safely.
- PDF « Générer le fichier » needs `POST /v3.5.1/preview` (already stubbed by `offline-pdf.js`) — kept and extended.

## Fix
- Extended `dzmarker-app/offline-pdf.js` to mock `/v3.5.1/marking` (localStorage) and trigger a local `.json` download on save/create.
- `index.html` + `fr/index.html`: offline user id, marking id `dz-local-1`, seed project list; cache-bust `?v=em26savepdf`.
- 8-brand filter unchanged (`empty`, `abb`, `hager`, `legrand`, `siemens`, `chint`, `eaton`, `bticino`).

## Local test
- App: http://127.0.0.1:8765/dzmarker-app/
- Hard refresh: http://127.0.0.1:8765/dzmarker-app/index.html?em=26savepdf&t=NOW
- Verified: JSON download (1 rail / 1 module), PDF `%PDF-1.3` (~74 KB).
- Screenshots: `media/electro-marker/offline-*.png` + `offline-verify-report.json` / `offline-generated.pdf`.
