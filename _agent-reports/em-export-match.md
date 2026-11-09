# EM-33 export match (labels/symbols + official file proposals)

## Answer

**Total clone of Electromarker marking technique for export: NO.**

Official export = server PDF from `/preview` + token JSON `{file, downloads}` + UI `a.downloadLink` / `window.open`.
DZ = on-screen DOM capture (html2canvas) that mirrors API shape and prepare-dialog proposals only.

## SHA

Code commit: see `git log -1 --oneline` on `cursor/em-export-match-f391` after this docs tip.

## Changes

- `offline-pdf.js?v=em33exportmatch`: hide prepare overlays during capture; wait for images; capture editor tab (labels/icons as on screen); no forced auto-download; no invented floating file dump; token JSON for official downloadLink.
- Verify: labels PDF `%PDF-1.3` ~60 KB; panel hidden; 0 autodownloads.

## Push

Blocked — GitHub PAT/keyring invalid (401). Need fresh PAT then:

```bash
git push -u origin cursor/em-export-match-f391
```
