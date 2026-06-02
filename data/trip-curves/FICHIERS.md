# Fichiers courbes t(I) — inventaire

Généré automatiquement. Commandes :

```bash
node scripts/fetch-public-trip-docs.mjs   # PDF constructeurs → refs/
node scripts/build-all-trip-catalogs.js   # schneider.json, abb.json, hager.json
node scripts/inventory-trip-files.mjs     # file-inventory.json
node scripts/import-caneco-base.mjs --base "/chemin/BASE"   # si Caneco installé
```

## Catalogues site (versionnés Git)

| Fichier | Rôle |
|---------|------|
| `index.json` | Index 3 marques |
| `schneider.json` | Schneider NSX/NS/CVS/Acti9 |
| `abb.json` | ABB Tmax/Emax/S200 |
| `hager.json` | Hager NBN/NXN/CDC/HX |
| `public-sources.json` | Bibliographie + URLs |
| `caneco-import.example.json` | Modèle import JSON navigateur |

## PDF de référence (local, `refs/`, non sur GitHub)

Voir `refs/manifest.json` après `fetch-public-trip-docs.mjs`.

**Compléments techniques BT** (`schneider-ZXTHPLANCHF-complements-techniques.pdf`, ~6,4 Mo) : protection, coordination, sélectivité, filiation Schneider — référence type étude Caneco, pas les courbes Micrologic détaillées.

**Hub Schneider** : [Catalogues et guides](https://www.se.com/fr/fr/work/support/catalogues-brochures/#PublicationsActuelles) — index local : `schneider-catalogues-index.json`

**Catalogues NSX** (téléchargés localement) :
- `refs/schneider-LVPED221001EN-NSX-NSXm-catalog.pdf` (~89 Mo, version récente)
- `refs/schneider-NSX_NSXm_Catalog_2021.pdf` (~80 Mo, édition 2021)

## Méthodologie professionnelle (sans Caneco)

- `methodology.json` — approche, validation, limites
- `pro-validation.json` — liens outils officiels constructeurs (TCC Schneider, etc.)
- `METHODOLOGY.md` — workflow bureau d’études

## Caneco BT (optionnel)

- Format **EDIELEC** : uniquement si Caneco est installé et licencié.
- Import local : `scripts/import-caneco-base.mjs` ou fusion JSON navigateur (options avancées).

## Inventaire machine

`file-inventory.json` (généré, gitignored) liste tous les fichiers du dossier + recherche Caneco.
