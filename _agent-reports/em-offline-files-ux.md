# Offline files UX — no fake 9999, clear PDF list

## Problem
After save/generate, UI showed **« 9999 fichiers disponibles »** (fake PRO credit pool) and only a tiny Légende preview thumbnail, so the printable PDF did not feel listed/downloadable.

## Fix
- `offline-pdf.js`: track real `offlineFiles`; sync `profile.downloads` to that count; floating **Fichiers PDF prêts** panel with **Télécharger le PDF**; Générer still force-downloads via `<a download>`; padded preview JPEG; tab-aware capture (legend → `.legend`, fallback rails).
- `index.html` + `fr/index.html`: stop forcing `downloads: 9999`; heal Vuex default 9999 on each PRO tick; cache-bust `em29files`.
- `electro-marker-theme.css`: panel + stronger `.downloadLink`.

## Local verify
- Before generate: `downloads: 0` (not 9999)
- After preview: panel lists PDFs, count matches files
- Générer → `%PDF-1.3` download; API returns real `downloads` (≥1, not 9999)
- Artifacts: `media/electro-marker/offline-files-ux-verify.json`, `offline-files-panel.png`, `offline-generer-listed.pdf`
