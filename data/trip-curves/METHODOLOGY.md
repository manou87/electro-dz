# Méthodologie — Courbe de déclenchement ElectroDZ

## Positionnement professionnel

ElectroDZ propose une **étude indicative** de courbes temps-courant et de sélectivité, calée sur les **documentations constructeurs publiques** (Schneider, ABB, Hager) et les essais normatifs **IEC 60898-1** / **IEC 60947-2**.

Ce n’est **pas** un substitut à :

- **Caneco BT** (base EDIELEC propriétaire ALPI) ;
- les **tables officielles** de sélectivité, filiation et coordination ;
- une **note de calcul** validée par un bureau d’études ou un installateur qualifié.

## Workflow recommandé (sans Caneco)

1. **Sélectionner** marque → référence → In → organe → réglages (comme dans un logiciel d’étude BT).
2. **Tracer** amont / aval et saisir l’**Icc** au point de sélectivité.
3. **Lire** le verdict indicatif (totale / partielle / non garantie).
4. **Valider** sur l’outil constructeur (bouton « Valider chez le constructeur ») — ex. [TCC Schneider](https://www.se.com/us/en/work/support/resources-and-tools/calculators-and-online-tools/time-current-curves/).
5. **Exporter** le rapport d’étude (TXT) ou le PDF graphique pour le dossier.
6. **Confirmer** sélectivité / filiation avec le guide coordination du fabricant (ex. `ZXTHPLANCHF` pour Schneider).

## Sources des courbes

| Zone | Source |
|------|--------|
| MCCB Schneider Micrologic | DOCA0141EN / DOCA0217EN — points long-time @ tr réglé |
| MCCB ABB Tmax TMA / Ekip | 1SDC210099D0205, Ekip Touch |
| MCB modulaire | IEC 60898-1 + fiches S200 / Acti9 / Hager |
| Sélectivité BT (logique) | Schneider ZXTHPLANCHF (coordination, pas t(I) point par point) |

Liste complète : `public-sources.json` — PDF locaux : `refs/` (téléchargement via `node scripts/fetch-public-trip-docs.mjs`).

## Import catalogue personnalisé (optionnel)

Un fichier JSON au format `caneco-import.example.json` peut **fusionner** des références bureau d’études dans le navigateur (localStorage). Utile si vous disposez d’un export **licencié** ; ne pas publier de données EDIELEC sur GitHub.

## Révision des données

Champ `revision` dans `schneider.json`, `abb.json`, `hager.json` — régénération :

```bash
node scripts/build-all-trip-catalogs.js
```
