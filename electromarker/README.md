# Electromarker — clone local

Clone fidèle des assets publics de [electromarker.com](https://electromarker.com) (SPA d’étiquetage de tableaux électriques).

## Lancer en local

```bash
cd electromarker
python3 -m http.server 8765
```

Puis ouvrir :
- EN : http://localhost:8765/
- FR : http://localhost:8765/fr/

## Contenu

- `index.html` / `fr/index.html` — coques HTML capturées
- `main.css`, `bundle.js` — bundle front public
- `fonts/`, `images/`, `i/` — polices, image de mesure, PDF privacy
- Favicons

## Limites

L’auth, la sauvegarde cloud, Stripe et les APIs backend restent côté `electromarker.com` (le JS d’origine les appelle). Ce dossier est une reconstitution visuelle/structurelle offline des assets publics, pas un backend.
