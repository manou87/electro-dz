# Fluke 1664 dans PanelWire (SwissDZ)

## Best idea (architecture)

Le Fluke PanelWire doit être un **module web autonome** (HTML/CSS/JS) : face appareil + LCD + 3 cordons L/N/PE, sans embarquer le trainer OIBT Flutter (auth, cours, prise fictive, multi-couches).  
PanelWire reste maître du **câblage tableau** (snap tip → borne, simulation tension).  
L’iframe n’affiche que l’appareil et reçoit l’état via `postMessage` : tips branchés / tensions.  
« CHECK LEADS » = tips non branchés aux bornes PanelWire — plus la logique prise OIBT.

## Où est le code

| Rôle | Emplacement |
|------|-------------|
| **PanelWire** (iframe, poignée, tips, snap) | `website/swissdz-panel/index.html` — `mountFlukeMeter`, `flukeMeterSrc()`, `pushFlukeEmbedVoltages` |
| **Module standalone (recommandé)** | `website/swissdz-panel/fluke-standalone/` |
| **Assets face / vignette** | `website/swissdz-panel/assets/fluke/` |
| **Ancien embed Flutter OIBT** (legacy) | `website/oibt-trainer/meter-embed.html` |
| **Sources Dart OIBT** (hors PanelWire) | `/Users/a/swissdz-oibt-trainer` |

## URL d’embed

- **Actuel PanelWire :**  
  `/swissdz-panel/fluke-standalone/index.html?embed=1&lang=fr`
- **Legacy Flutter (ne plus utiliser pour PanelWire) :**  
  `/oibt-trainer/meter-embed.html?embed=1&lang=fr#/meter`

## API postMessage

**Parent → iframe**

```js
{
  type: "panelwire/fluke-state",
  leads: { L: true, N: false, PE: true },  // tip branché à une borne
  tips: { L: { nx, ny }, N: { nx, ny }, PE: { nx, ny } },
  ln: 230, lpe: 230, sim: true, pair: "L-PE"
}
```

**iframe → parent**

```js
{ type: "fluke/ready", version: 1 }
{ type: "fluke/tip-move", tip: "L", nx, ny, phase: "start"|"move"|"end" }
{ type: "fluke/button", button: "test"|"f1"|… }
```

## CHECK LEADS

Affiché tant que la paire active (ex. L-PE) n’a pas ses deux tips câblés aux bornes du tableau.  
Dès que les tips sont branchés et la sim sous tension → lecture V / Hz.

## Test local

```bash
cd /Users/a/Downloads/electrodzch/website
python3 tools/serve_no_cache.py 8777
```

- Panel : http://127.0.0.1:8777/swissdz-panel/index.html  
- Module seul : http://127.0.0.1:8777/swissdz-panel/fluke-standalone/index.html  
- Embed : http://127.0.0.1:8777/swissdz-panel/fluke-standalone/index.html?embed=1  

Ajouter « Fluke 1664 FC » depuis la bibliothèque ; poignée = déplacer ; tips L/N/PE = brancher sur une borne.
