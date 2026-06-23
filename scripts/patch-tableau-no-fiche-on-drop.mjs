#!/usr/bin/env node
/** Ne pas ouvrir la fiche détail au glisser-déposer — seulement au clic sur le composant. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE = path.join(__dirname, '../simulation-swissdz/assets/index-BiX2UYYQ.js');

let s = fs.readFileSync(BUNDLE, 'utf8');
let n = 0;

function rep(old, neu, label) {
  if (!s.includes(old)) {
    console.warn('SKIP:', label);
    return false;
  }
  s = s.replace(old, neu);
  n++;
  console.log('OK:', label);
  return true;
}

rep(
  't(e=>[...e,o]),r(o.uid)}function F(n,i,a)',
  't(e=>[...e,o]),r(null)}function F(n,i,a)',
  'P: pas de sélection auto au dépôt'
);

rep(
  't(e=>e.map(e=>e.uid===n?{...e,rangee:i,slot:a}:e)),r(n)))}',
  't(e=>e.map(e=>e.uid===n?{...e,rangee:i,slot:a}:e)),r(null)))}',
  'F: pas de sélection auto au déplacement'
);

rep(
  'onTouchEnd:e=>{e.target.closest(`.composant-suppr`)||O(s.uid)}',
  'onTouchEnd:e=>{S||e.target.closest(`.composant-suppr`)||O(s.uid)}',
  'touch: pas de fiche après drag'
);

fs.writeFileSync(BUNDLE, s);
console.log(`\nDone: ${n} patches.`);
