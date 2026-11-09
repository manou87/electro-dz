# EM-33 export match (labels/symbols + official file proposals)

## Answer

**Total clone of Electromarker marking technique for export: NO.**

Official export = server PDF from `/preview` + token JSON `{file, downloads}` + UI `a.downloadLink` / `window.open`.
DZ = on-screen DOM capture (html2canvas) that mirrors API shape and prepare-dialog proposals only.

## SHA

- Fix: `18f9477b8b5065e3bd32dbdcef4564ed0625b53c`
- Docs: `3f6c2bac5b03a375c275d991ea0c3415a8ba31a0` (this file tip; next commit pins both)

## Branch

`cursor/em-export-match-f391`

## Changes

- `offline-pdf.js?v=em33exportmatch`: hide prepare overlays during capture; wait for images; capture editor tab (labels/icons as on screen); no forced auto-download; no invented floating file dump; token JSON for official downloadLink.
- Verify: labels PDF `%PDF-1.3` ~60 KB; panel hidden; 0 autodownloads.

## Push

Blocked — GitHub PAT/keyring invalid (401).
