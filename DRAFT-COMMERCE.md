# Section Commerce — brouillon (non publiée)

Cette section **n’est pas en ligne** sur electro-dz.com tant que vous ne l’avez pas validée.

## Voir la maquette en local

1. Ouvrir le dossier `website/` sur votre ordinateur.
2. Lancer un petit serveur local (obligatoire pour charger le JSON) :
   ```bash
   cd website
   python3 -m http.server 8080
   ```
3. Aller à : **http://localhost:8080/commerce.html**

La page a `noindex` : les moteurs de recherche ne doivent pas l’indexer si elle est déployée par erreur.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `commerce.html` | Page annuaire magasins |
| `js/commerce.js` | Affichage, recherche, filtres ville |
| `css/commerce.css` | Mise en page |
| `data/commerce.json` | **Données** : magasins, adresses, inventaire, prix |
| `data/commerce-legrand.csv` | Source CSV Legrand (25 distributeurs) |
| `scripts/merge-legrand-distributors.js` | Fusion des nouveaux points depuis [legrand.dz](https://www.legrand.dz/fr/nos-distributeurs) |

## Ajouter un magasin réel

Dans `data/commerce.json`, dupliquer un bloc dans `"stores"` :

```json
{
  "id": "mon-magasin-alger",
  "published": true,
  "demo": false,
  "nameFr": "Nom du magasin",
  "nameAr": "اسم المتجر",
  "city": "alger",
  "addressFr": "Adresse complète",
  "addressAr": "العنوان",
  "phone": "+213 …",
  "whatsapp": "213………",
  "hoursFr": "Sam–Jeu 8h–18h",
  "hoursAr": "…",
  "mapUrl": "https://maps.google.com/…",
  "inventory": [
    {
      "id": "ref-unique",
      "category": "cables",
      "labelFr": "Produit en français",
      "labelAr": "المنتج بالعربية",
      "brand": "Marque",
      "unit": "m",
      "price": 100,
      "currency": "DZD",
      "stock": "in_stock",
      "updated": "2026-05-19"
    }
  ]
}
```

**Stock** : `in_stock` | `low` | `on_order` | `out`  
**Villes** : clés dans `"cities"` (`alger`, `oran`, …).

## Mettre en ligne plus tard

Quand vous serez prêt :

1. Remplacer les magasins `demo: true` par de vraies fiches.
2. Ajouter un lien « Commerce » dans le menu (`index.html`, etc.).
3. Retirer ou réduire la bannière brouillon sur `commerce.html`.
4. Valider les prix avec chaque magasin (mention légale : prix indicatifs).
5. Commit + déploiement GitHub Pages comme le reste du site.

## Ce qui n’est pas fait (volontairement)

- Pas de lien depuis l’accueil
- Pas d’indexation SEO
- Pas de synchronisation Supabase (tout est dans le JSON pour l’instant)

On pourra ajouter plus tard : photos, formulaire pour proposer un magasin, import Excel, etc.
