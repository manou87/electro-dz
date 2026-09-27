# Fluke 1664 dans PanelWire (SwissDZ)

## Où est le code

| Rôle | Emplacement |
|------|-------------|
| **PanelWire** (iframe, poignée, masque, resize) | `website/swissdz-panel/index.html` — `mountFlukeMeter`, `flukeMeterSrc()` |
| **Assets masque / vignette panel** | `website/swissdz-panel/assets/fluke/` |
| **OIBT Trainer web (build Flutter)** | `website/oibt-trainer/` (`main.dart.js`, assets `assets/assets/devices/fluke_parts/`) |
| **Embed appareil seul (`embed=1`)** | Logique dans le **JS compilé** (`main.dart.js`, route `/meter`, classe `M8`) + `index.html` / **`meter-embed.html`** |
| **Sources Dart OIBT (rebuild)** | `/Users/a/swissdz-oibt-trainer` — voir `lib/features/oibt_trainer/device_simulator/meter_fullscreen_screen.dart` et `panel_embed_web.dart` |

Il n’y a **pas** de sources Dart oibt-trainer dans le dépôt `electrodzch` (seulement la build web). `website/electrocad/` est un autre projet Flutter (CAD).

## URL d’embed (appareil + cordons, sans prise / flèche / bandeau LCD)

- **Dédiée PanelWire :**  
  `/oibt-trainer/meter-embed.html?embed=1&lang=fr#/meter`
- Équivalent :  
  `/oibt-trainer/index.html?embed=1&lang=fr#/meter`

Avec `embed=1`, la route `#/meter` masque Retour, « Reset câbles », miroir LCD bas, prise 2P+T et fils « vers le tableau » (`showPrise: false`).

## Rebuild Flutter (machine avec SDK)

```bash
cd /Users/a/swissdz-oibt-trainer
flutter build web --base-href /oibt-trainer/
rsync -a build/web/ /Users/a/Downloads/electrodzch/website/oibt-trainer/
# Conserver ou recopier meter-embed.html si écrasé
```

## Test local PanelWire

```bash
cd /Users/a/Downloads/electrodzch/website
python3 tools/serve_no_cache.py 8777
```

- Panel : http://127.0.0.1:8777/swissdz-panel/index.html  
- Embed seul : http://127.0.0.1:8777/oibt-trainer/meter-embed.html?embed=1&lang=fr#/meter  

Ajouter « Fluke 1664 FC » depuis la bibliothèque ; déplacer via la **poignée** fine en haut ; clics / molette dans l’iframe.
