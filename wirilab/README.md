# WiriLab — clone local (shell public)

Clone fidèle des assets publics de [wirilab.com](https://wirilab.com) : landing, blog, pages légales, et application Flutter web (`/app/`) telle que servie en accès free.

Aucune modification du design, aucun patch d’auth, aucune invention de contenu.

## Lancer sur ta machine

```bash
git checkout cursor/wirilab-clone-a16d   # ou pull la branche
cd wirilab
python3 -m http.server 8766
```

Puis ouvrir dans ton navigateur :

- Landing : http://localhost:8766/
- App (éditeur free) : http://localhost:8766/app/
- Blog : http://localhost:8766/blog/
- Légal : http://localhost:8766/legal/privacy/

> Important : servir depuis le dossier `wirilab/` (pas la racine du repo). L’app Flutter utilise `<base href="/app/">`.

## Contenu

| Chemin | Rôle |
|--------|------|
| `index.html`, `css/`, `js/`, `assets/` | Landing publique |
| `blog/` | Articles + `blog.js` |
| `legal/` | Privacy, terms, cookies, refunds, subscription |
| `app/` | Shell Flutter web (HTML, `main.dart.*.js`, CanvasKit, assets circuits/composants/academy) |

## Limites (non clonées / restent live)

- Auth compte, sauvegarde cloud, paiements / Stripe / checkout (`?checkout=…`)
- Liens partagés `/s/…` (API PHP live)
- Mesure d’audience Webful (`webful.fr`)
- Polices Google Fonts (CDN, comme le site)

Le shell free (UI éditeur, grille, outils, bibliothèque embarquée dans le bundle + JSON circuits/composants publics) se charge **sans login**.
