#!/usr/bin/env node
/** Utilise photos/thumbs et photos/medium au lieu des PNG 1–2 Mo. */
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
  ':e.marque===`SwissDz`&&e.type===`minuterie`?p(`photo-swissdz-minuterie.png`):null}function g(e){let t=h(e)',
  ':e.marque===`SwissDz`&&e.type===`minuterie`?p(`photo-swissdz-minuterie.png`):null}function pz(e){let t=h(e);if(!t)return null;let n=t.slice(t.lastIndexOf(`/`) + 1).split(`?`)[0];return`/simulation-swissdz/photos/thumbs/${n}`}function pM(e){let t=h(e);if(!t)return null;let n=t.slice(t.lastIndexOf(`/`) + 1).split(`?`)[0];return`/simulation-swissdz/photos/medium/${n}`}function g(e){let t=pM(e)',
  'pz pM helpers + g uses medium'
);

rep(
  'backgroundImage:`url(${h(t)})`}}):(0,C.jsx)(`span`,{className:`palette-pastille`',
  'backgroundImage:`url(${pz(t)})`}}):(0,C.jsx)(`span`,{className:`palette-pastille`',
  'palette vignette thumbs'
);

rep(
  'h(a)&&(0,C.jsx)(`img`,{className:`fiche-photo`,src:h(a),alt:',
  'h(a)&&(0,C.jsx)(`img`,{className:`fiche-photo`,src:pM(a),alt:',
  'fiche photo medium'
);

fs.writeFileSync(BUNDLE, s);
console.log(`\nDone: ${n} patches.`);
