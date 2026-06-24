#!/usr/bin/env node
/** Masquer le panneau conformité en embed ; résumé repliable sous le titre du coffret. */
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
  '})]}),(0,C.jsxs)(`div`,{className:`enveloppe-corps`,children:[Array.from({length:4},(e,i)=>',
  '})]}),y&&ne.nonConformites.length>0&&(0,C.jsxs)(`details`,{className:`conformite-resume`,children:[(0,C.jsxs)(`summary`,{children:[ne.nonConformites.length,` alerte`,ne.nonConformites.length>1?`s`:``,` NFC 15-100 (optionnel — touchez pour le détail)`]}),(0,C.jsx)(`ul`,{className:`conformite-resume-list`,children:ne.nonConformites.map((e,t)=>(0,C.jsxs)(`li`,{className:`nc nc-${e.gravite}`,children:[(0,C.jsxs)(`strong`,{children:[`[`,e.gravite.toUpperCase(),`]`]}),` `,e.regle,(0,C.jsx)(`span`,{className:`nc-article`,children:e.article}),(0,C.jsx)(`span`,{className:`nc-message`,children:e.message})]},t))})]}),(0,C.jsxs)(`div`,{className:`enveloppe-corps`,children:[Array.from({length:4},(e,i)=>',
  'conformite-resume details under titre'
);

rep(
  'onSelectCircuit:O}),(0,C.jsxs)(`section`,{className:`conformite`,children:[(0,C.jsx)(`h3`,{children:`Validation NFC 15-100 en temps réel`})',
  'onSelectCircuit:O}),!y&&(0,C.jsxs)(`section`,{className:`conformite`,children:[(0,C.jsx)(`h3`,{children:`Validation NFC 15-100 en temps réel`})',
  'hide conformite panel in embed'
);

fs.writeFileSync(BUNDLE, s);

let css = fs.readFileSync(CSS, 'utf8');
const EXTRA =
  '.conformite-resume{margin:0 0 10px;padding:8px 10px;border-radius:8px;border:1px solid var(--bordure);background:rgba(255,255,255,.03);font-size:12px}' +
  '.conformite-resume summary{cursor:pointer;font-weight:700;color:var(--texte-2);list-style:none}' +
  '.conformite-resume summary::-webkit-details-marker{display:none}' +
  '.conformite-resume[open] summary{margin-bottom:8px;color:#facc15}' +
  '.conformite-resume-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}' +
  '.application--embed .module-tableau.vue-coffret .conformite{display:none!important}' +
  '@media (max-width:1024px),(hover:none) and (pointer:coarse){.module-tableau.vue-coffret .conformite{display:none!important}}';

if (!css.includes('.conformite-resume{')) {
  css += EXTRA;
  console.log('OK: css conformite-resume');
}
fs.writeFileSync(CSS, css);

console.log(`\n${n} patch(s) JS → ${BUNDLE}`);
