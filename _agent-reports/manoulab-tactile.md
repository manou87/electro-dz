# ManouLab tactile — méthode qui a marché

Flutter web (CanvasKit). Les boutons +/− zooment bien. Le doigt, non.

## Ne pas deviner

Reproduire le geste et lire les chiffres, avant de changer le code.

- Souris : Playwright, `page.mouse`, puis lire `z` et `Q` du workspace.
- iPhone : contexte mobile (`hasTouch`, `deviceScaleFactor: 3`) et
  `Input.dispatchTouchEvent` en CDP. Poser **un** doigt, le bouger un peu,
  **puis** poser le second et pincer. C’est ce geste-là qui sautait.
- Un zoom qui monte puis redescend dans la série de valeurs = deux
  gestes qui se battent. Un zoom qui monte tout droit = bon.

## Ce qui était cassé

1. Sur le web, `onPanUpdate` ne part jamais. Le déplacement d’un appareil
   et le glissement du canvas s’arrêtaient après `onPanStart`.
2. Le `panEnd` de Flutter retirait les écouteurs DOM trop tôt.
3. Le premier doigt lançait un glissement DOM. Au pincement, cet écouteur
   lisait les deux doigts sans regarder `pointerId`. Le canvas partait
   dans un sens, le zoom dans l’autre : l’effet « par carrés ».
4. Safari envoie en plus `gesturestart` / `gesturechange`, qui zooment
   la page elle-même.

## Correctif

- Déplacement et glissement : `pointermove` / `pointerup` sur `document`,
  deltas `clientX` / `clientY`, **un seul** `pointerId` par geste.
- Pincement : événements `touch`, une mise à jour par frame, même formule
  que les boutons (zoom autour du point entre les doigts, calculé depuis
  le début du geste, pas en empilant des deltas).
- Dès que deux doigts touchent, un drapeau suspend le glissement.
- `preventDefault` sur `gesturestart`, `gesturechange`, `gestureend`.
- Le `Offset` se construit **dans** `main.dart.js` (`new A.d`). Hors de ce
  fichier, `A` n’existe pas et le geste plante sans message visible.
- Changer le `?v=` de `manoulab-simulation.html`, de `index.html` et du
  service worker. Sinon l’iPhone garde l’ancien script.

## Vérifier avant de dire que c’est bon

1. Pincement un doigt puis deux : `z` ne redescend pas, `Q` suit les doigts.
2. Glisser un appareil à la souris : sa position change, une seule fois.
3. Glisser le fond : `Q` change. Molette : `z` change.
4. Aucune erreur en console.
