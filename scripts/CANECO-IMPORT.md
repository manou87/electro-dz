# Import Caneco BT (optionnel)

**Caneco n’est pas requis.** Le site propose le mode **Documentation constructeur** avec traçabilité des sources et liens vers les outils officiels — voir `data/trip-curves/METHODOLOGY.md`.

## Sources publiques (déjà intégrées au site)

Les catalogues du site sont regénérés à partir de **documentations constructeurs publiques** (pas Caneco) :

| Source | Usage |
|--------|--------|
| Schneider **DOCA0217EN** | Micrologic — temps @ 1,5·Ir, 6·Ir, 7,2·Ir (tr=1 s) |
| ABB **1SDC210099D0205** | Tmax XT TMA — zone thermique |
| **IEC 60898-1** | MCB B/C/D (modulaire) |
| `data/trip-curves/public-sources.json` | Bibliographie + liens |

```bash
node scripts/build-all-trip-catalogs.js    # regénère schneider.json, abb.json, hager.json
node scripts/fetch-public-trip-docs.mjs    # PDF locaux → data/trip-curves/refs/
```

---

Les courbes et catalogues **Caneco BT** sont au format **EDIELEC** (propriétaire ALPI). Ils ne peuvent pas être copiés dans ce dépôt public sans licence.

## 1. Inventaire depuis votre installation (recommandé)

Sur la machine où **Caneco BT** est installé, repérez le dossier **BASE** (souvent `…/PAYS/BASE`, voir manuel §2.8.4).

```bash
cd website
node scripts/import-caneco-base.mjs --base "/chemin/vers/BASE"
node scripts/import-caneco-base.mjs --base "/chemin/vers/BASE" --brand schneider
node scripts/import-caneco-base.mjs --base "/chemin/vers/BASE" --merge data/trip-curves/schneider.json
```

Sortie par défaut : `data/trip-curves/imported/<marque>-caneco.json` (ignoré par git).

Le script liste les fichiers `.dug` / `.dmd` / `.dmi` et extrait des **libellés** (noms de gammes). Il **ne décode pas** les courbes t(I) EDIELEC.

Variable d’environnement : `CANECO_BASE=/chemin/vers/BASE`

## 2. Import dans l’outil Courbes (navigateur)

1. Mode **Constructeur (type Caneco BT)**.
2. **Charger un catalogue…** → fichier JSON au format du [modèle](../data/trip-curves/caneco-import.example.json).
3. Les données sont fusionnées avec le catalogue du site et stockées dans **localStorage** (par navigateur).

Pour générer le JSON : compléter `tripUnits` / `devices` à partir de l’inventaire, ou fusionner avec `--merge` puis copier le fichier.

## 3. Export texte Caneco (Pack Import/Export)

Caneco peut exporter un projet en texte / Excel (manuel §24.2–24.3). Ces exports décrivent surtout les **circuits**, pas les courbes constructeur. Utilisez-les pour vérifier les références, pas comme source directe des courbes t(I).

## Limites

| Objectif | Possible ici ? |
|----------|----------------|
| Même liste de références que Caneco | Oui (inventaire BASE + fusion) |
| Courbes t(I) identiques à Caneco | Non sans parser EDIELEC / données ALPI |
| Publier la base Caneco sur GitHub | Non (droits ALPI / constructeurs) |
