# Versions du site Electro DZ

## Version actuelle (référence « finale » avant unifilaire auto)

- **Tag Git :** `v-finale-avant-unifilar-auto`
- **Commit :** `b8ada88` — Schémas et plans (diagrams.net) intégrés
- **Contenu :** quiz NFC, formations, bilan de puissance pro, calculs, bibliothèque, **sans** générateur unifilaire automatique

### Revenir à cette version

```bash
cd /chemin/vers/electro-dz
git fetch origin
git checkout main
git reset --hard v-finale-avant-unifilar-auto
git push origin main --force   # uniquement si vous voulez annuler la prod
```

Pour **tester** l’ancienne version sans toucher `main` :

```bash
git checkout v-finale-avant-unifilar-auto
```

Puis redéployer (push sur `main` ou branche de preview).

---

## Branche de développement — unifilaire auto

- **Branche :** `feature/unifilar-auto-bilan`
- **Fonction :** bilan de puissance → schéma unifilaire assisté (génération + édition)
- **Pages :** `unifilaire-auto.html`, bouton **Générer unifilaire** dans Calculs → Bilan
- **Flux :** Calculer le bilan → Générer unifilaire → prévisualisation / ajuster In → Ouvrir dans Schémas et plans

Après validation, fusionner dans `main` :

```bash
git checkout main
git merge feature/unifilar-auto-bilan
git push origin main
```
