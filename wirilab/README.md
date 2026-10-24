# WiriLab — clone local (shell public)

Clone fidèle des assets publics de [wirilab.com](https://wirilab.com) : landing, blog, pages légales, et application Flutter web (`/app/`) telle que servie en accès free.

Aucune invention de contenu / redesign. Patches **minimaux login-remove** dans `app/main.dart.*.js` pour utiliser composants + câblage sans compte (voir section ci-dessous).

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

## Mode sans restriction

Dans `app/main.dart.4736b44047b0.js` (clone local uniquement) :

- entitlements découverte/gratuit/premium : flags ouverts + `ala()` toujours vrai
- `mv` / `cb9` / `aYx` no-op → plus de modale **Les offres WiriLab**
- `a3L` montre la feature ; badges `Hf` / bandeau `ayn` masqués
- `bBF` / `adu` no-op ; CTA Sign in retirés ; save-account soft-skip

## Projets showcase (locaux)

Les 8 cartes « Des projets à ouvrir » ouvrent `app/?c=<id>` ; le payload est dans `shared/<id>.json` (plus d’appel `wirilab.com/share.php` pour l’ouverture).

## Limites (restent live)

- Auth réelle, sync cloud, Stripe / checkout (`?checkout=…`)
- Création de nouveaux liens `/s/…` (POST share), Webful, Google Fonts (CDN)
