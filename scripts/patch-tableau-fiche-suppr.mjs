#!/usr/bin/env node
/** Fiche composant — bouton « Retirer du rail » + × visible sur composant sélectionné. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BUNDLE } from './resolve-sim-bundle.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(__dirname, '../simulation-swissdz/assets/index-NkCKKsuf.css');

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
  'function Oe({pose:e,resultat:t,onModifier:n,className:r,onFermer:i})',
  'function Oe({pose:e,resultat:t,onModifier:n,onSupprimer:l,className:r,onFermer:i})',
  'Oe onSupprimer prop'
);

rep(
  '}),i&&(0,C.jsx)(`button`,{type:`button`,className:`fiche-fermer`,onClick:i,"aria-label":`Fermer la fiche`,children:`✕ Fermer`})]}),h(a)',
  '}),((l||i)&&(0,C.jsxs)(`div`,{className:`fiche-actions`,children:[l&&(0,C.jsx)(`button`,{type:`button`,className:`fiche-suppr`,onClick:()=>l(e.uid),"aria-label":`Retirer du rail`,children:`Retirer du rail`}),i&&(0,C.jsx)(`button`,{type:`button`,className:`fiche-fermer`,onClick:i,"aria-label":`Fermer la fiche`,children:`✕ Fermer`})]}))]}),h(a)',
  'fiche header delete button'
);

rep(
  'onModifier:te})})]}),y&&ce&&fe',
  'onModifier:te,onSupprimer:o=>{t(e=>e.filter(e=>e.uid!==o)),n===o&&r(null)}})})]}),y&&ce&&fe',
  'inline fiche onSupprimer'
);

rep(
  'onModifier:te,onFermer:()=>r(null)})})}),fe)]})}',
  'onModifier:te,onSupprimer:o=>{t(e=>e.filter(e=>e.uid!==o)),r(null)},onFermer:()=>r(null)})})}),fe)]})}',
  'sheet fiche onSupprimer'
);

fs.writeFileSync(BUNDLE, s);

let css = fs.readFileSync(CSS, 'utf8');
const EXTRA =
  '.fiche-actions{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}' +
  '.fiche-suppr{background:rgba(228,0,43,.14);color:#ff6b70;border:1px solid rgba(228,0,43,.5);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}' +
  '.fiche-suppr:hover{background:rgba(228,0,43,.28);color:#fecaca}' +
  '.composant.selectionne .composant-suppr{display:flex;align-items:center;justify-content:center}' +
  '@media (hover:none) and (pointer:coarse){.composant.selectionne .composant-suppr{width:22px;height:22px;font-size:14px;top:-8px;right:-8px}}' +
  '.fiche.fiche--sheet .fiche-actions{flex-direction:row;flex-wrap:wrap;justify-content:flex-end}';

if (!css.includes('.fiche-suppr{')) {
  css = css.replace(
    '.composant:hover .composant-suppr{display:block}',
    '.composant:hover .composant-suppr,.composant.selectionne .composant-suppr{display:flex;align-items:center;justify-content:center}'
  );
  css += EXTRA;
  console.log('OK: css fiche-suppr');
}
fs.writeFileSync(CSS, css);

console.log(`\n${n} patch(s) JS → ${BUNDLE}`);
