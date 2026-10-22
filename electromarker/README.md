# Electromarker — clone local

Clone fidèle des assets publics de [electromarker.com](https://electromarker.com) (SPA d’étiquetage de tableaux électriques).

## Lancer sur ta machine

Le lien `http://127.0.0.1:8765` cité par l’agent cloud **ne s’ouvre pas dans ton navigateur** : ce serveur tourne dans la VM de l’agent. Pour le voir chez toi :

```bash
git checkout cursor/electromarker-clone-b01a   # ou pull la branche
cd electromarker
python3 -m http.server 8765
```

Puis ouvrir **dans ton navigateur** :
- EN : http://localhost:8765/
- FR : http://localhost:8765/fr/

Sur le bureau cloud (Try Live), le même serveur est déjà démarré dans la VM.

## Contenu

- `index.html` / `fr/index.html` — coques HTML capturées
- `main.css`, `bundle.js` — bundle front public
- `fonts/`, `images/`, `i/` — polices, images, PDF privacy
- Favicons

## Limites

L’auth, la sauvegarde cloud, Stripe et les APIs backend restent côté `electromarker.com`.
