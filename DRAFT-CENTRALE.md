# Électro-Centrale — brouillon (structure Sonepar)

Maquette **non publiée** (`noindex`). Inspirée de [Sonepar Suisse](https://www.sonepar.ch/fr) : même logique de navigation, **photos produits/promos du site Sonepar** (copiées localement dans `assets/electro-centrale/sonepar/`), **sans affiliation**.

## Visuels Sonepar

```bash
node scripts/fetch-sonepar-images.js   # télécharge depuis sonepar.ch
node scripts/patch-electro-centrale-images.js   # met à jour le JSON
```

## Nom proposé

**Électro-Centrale** — webshop pro pour l’électricien et l’industrie (équivalent local du modèle Sonepar, pour l’Algérie + lien distributeurs réels).

## Pages

| URL | Rôle (équivalent Sonepar) |
|-----|---------------------------|
| `electro-centrale.html` | Accueil : promos, assortiment, nouveautés, actions, services |
| `electro-centrale-catalogue.html` | Catégories / sous-catégories / recherche |
| `electro-centrale-produit.html` | Fiche produit + liste de courses |

## Données

`data/electro-centrale.json` — libellés et familles repris du site Sonepar (ex. Fils/câbles avec sous-familles 700 / 1239 produits, promos Signify, TRADEFORCE, etc.).

## Algérie

Bouton **🇩🇿 Algérie** → `commerce.html` (25 distributeurs Legrand réels). Sonepar n’existe pas en Algérie.

## Aperçu local

```bash
cd website
python3 -m http.server 8080
```

- http://localhost:8080/electro-centrale.html
- http://localhost:8080/electro-centrale-catalogue.html?cat=filscables
- http://localhost:8080/electro-centrale-produit.html?id=p-wago-221

## Suite

- Plus de fiches produit dans le JSON
- Prix en DZD + stocks réels (partenaires)
- Lien panier → devis / WhatsApp magasin
