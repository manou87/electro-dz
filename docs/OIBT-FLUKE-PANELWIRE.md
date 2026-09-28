# Fluke 1664 dans PanelWire (SwissDZ)

## Architecture

- **Iframe** (`fluke-standalone`) = boîtier + LCD uniquement (pas de cordons dedans → plus de clip).
- **Board PanelWire** = cordons SVG (`fluke-lead`) + **pointes** `assets/fluke/cable_{L,N,PE}.png` (même style OIBT).
- Snap pointe → borne composant → fil électrique (sim) + lecture V sur l’appareil via `postMessage`.

Sources appareil / logique mesure OIBT : `website/oibt-trainer/` + `/Users/a/swissdz-oibt-trainer`.

## Où est le code

| Rôle | Emplacement |
|------|-------------|
| **PanelWire** (iframe, poignée, pointes, snap, leads) | `website/swissdz-panel/index.html` |
| **Module appareil (embed)** | `website/swissdz-panel/fluke-standalone/` |
| **Pointes / face** | `website/swissdz-panel/assets/fluke/cable_*.png` |
| **Trainer Flutter (réf.)** | `website/oibt-trainer/meter-embed.html` |

## URL

- Panel : `/swissdz-panel/index.html?v=panel29&ecole=1`
- Embed appareil : `/swissdz-panel/fluke-standalone/index.html?embed=1&lang=fr&v=probes2`

## CHECK LEADS

Affiché tant que la paire active (ex. L-PE) n’a pas ses deux pointes câblées aux bornes du tableau.  
Dès que les pointes sont branchées et la sim sous tension → lecture V / Hz.

## Test local

```bash
cd /Users/a/Downloads/electrodzch/website
python3 tools/serve_no_cache.py 8777
```

- Panel : http://127.0.0.1:8777/swissdz-panel/index.html?ecole=1  
- École : http://127.0.0.1:8777/ecole-electricite.html  
- Embed : http://127.0.0.1:8777/swissdz-panel/fluke-standalone/index.html?embed=1  

Ajouter « Fluke 1664 FC » ; poignée = déplacer ; **pointes** L/N/PE = brancher sur une borne pour mesurer.
