# Fix: no auto-download / no invented PDF sheets on marking open

## SHA
`5e283c78c591d85c915b3f605bc0dd71a9a725e3` — branch `cursor/em-no-auto-pdf-2168` (push blocked 403)

## Root cause
`offline-pdf.js` called `downloadSavePdf()` on every `POST /v3.5.1/marking` and `PUT /v3.5.1/marking/:id`. Opening the marking page (authorized bootstrap / autosave timer / Enregistrer path) therefore force-downloaded a PDF and registered it into the floating **« Fichiers PDF prêts »** panel. Preview also registered files immediately, so the panel could appear without a Générer click.

## Fix (`em32noauto`)
- Marking save/create persists to `localStorage` only — **no** PDF generation or download.
- Clear/hide the offline files panel on boot / `DOMContentLoaded` / `load`.
- `POST /preview` still mirrors Electromarker’s prepare response (`EMKEY`, `previews`, `pdf`/`xls` token URLs) but does **not** show the panel or download.
- Download only on explicit Générer / Télécharger (`fetch(__dz_offline/.../pdf)` → `<a download>` + optional panel).
- PDF body = html2canvas capture of the live marking DOM (rails/legend/labels), not invented label-strip / schematic dumps. No REA `/preview` binary cache was available in-store; response shape still matches the official API contract from the bundle.

## Verify
- Open: no panel, 0 offline files, no download.
- PUT marking: saved, still no panel/files.
- Preview: URLs ready, panel stays hidden.
- Générer token fetch: `%PDF-1.3` download + panel « Fichiers PDF prêts (1) ».
- Artifact: `media/electro-marker/em32-noauto-verify.json`, `em32-noauto-generer.pdf`
