# assets/branding

Emplacement des **fichiers image** dérivés du logo WiriLab (PNG / ICO / store).

## Source de vérité

Le dessin officiel est le code :

- `lib/ui/branding/wirilab_icon_painter.dart`
- `lib/ui/branding/wirilab_logo.dart` (`WiriLabLogoLayout.iconOnly`)

Quand un agent génère des rasters (favicon, app icon Android/iOS/macOS, PWA) :
les déposer **ici**, puis les brancher vers :

- `web/favicon.png` / `web/icons/`
- `android/app/src/main/res/mipmap-*/`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/`
- `macos/Runner/Assets.xcassets/AppIcon.appiconset/`

## Noms suggérés

| Fichier | Usage |
|---------|--------|
| `wirilab_icon_1024.png` | Master app icon (carré) |
| `wirilab_icon_512.png` | PWA / store |
| `wirilab_favicon_32.png` | Favicon |
| `wirilab_logo_stacked_navy.png` | Export bandeau B (optionnel) |
| `wir_file.ico` | Icône Explorateur Windows pour `*.wir` (format B) |
| `wir_file_preview_256.png` | Aperçu raster 256 px (même dessin) |

Icône fichiers `.wir` : générée par `tool/branding/generate_wir_file_icon.py`,
également copiée dans `windows/runner/resources/wir_file.ico` (index 1 de
l'EXE). Voir `windows/packaging/README.md`.

Ne pas inventer une autre forme de W — exporter depuis le painter.
