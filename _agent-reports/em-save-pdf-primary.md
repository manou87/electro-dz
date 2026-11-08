# EM Save / Enregistrer → PDF (primary)

## Change
- `dzmarker-app/offline-pdf.js`: Enregistrer (POST/PUT `/v3.5.1/marking`) downloads a **PDF** via the same `generatePdfBlob` path as « Générer le fichier » (html2canvas + jsPDF / `buildPdfDoc`).
- JSON file download removed from the Save click path; project reopen stays on `localStorage` (`marking` + `dz_offline_markings_v1`). `downloadJson` kept as unused optional helper.
- Cache-bust: `offline-pdf.js?v=em28savepdf` (`index.html` + `fr/index.html`).

## Local verify
- URL: `http://127.0.0.1:8765/dzmarker-app/index.html?em=28savepdf&t=…`
- `store.dispatch("markings/save")` → download `No_name-….pdf`, header `%PDF-1.3`, ~101 KB
- Artifacts: `media/electro-marker/offline-save-enregistre.pdf`, `offline-save-pdf-verify.json`, `offline-save-pdf-verify.png`
