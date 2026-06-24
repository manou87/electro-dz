#!/usr/bin/env node
/**
 * Nombre de points : liste déroulante 1–16 (évite le blocage du champ number à « 1 »)
 * + répartition lampes/prises visible dès 1 point pour éclairage/prises.
 */
import fs from 'fs';
import { BUNDLE } from './resolve-sim-bundle.mjs';

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
  'onChange:e=>{let t=e.target.value,r=Se(t,o.nbPoints);n({...o,usage:t,...r})}',
  'onChange:e=>{let t=e.target.value,a=o.nbPoints<=1?xe(t)?4:be(t)?5:1:o.nbPoints,r=Se(t,a);n({...o,usage:t,nbPoints:a,...r})}',
  'usage: défaut 4/5 points si bloqué à 1'
);

rep(
  'children:[`Nombre de points`,(0,C.jsx)(`input`,{type:`number`,min:1,max:16,value:o.nbPoints,onChange:e=>{let t=Math.max(1,Math.min(16,Number(e.target.value))),{nbLampes:r,nbPrises:i}=t>o.nbPoints?Te(o,t):Ce({...o,nbPoints:t});n({...o,nbPoints:t,nbLampes:r,nbPrises:i})}})]}),o.nbPoints>1&&(0,C.jsxs)(C.Fragment,',
  'children:[`Nombre de points`,(0,C.jsx)(`select`,{value:o.nbPoints,onChange:e=>{let t=Number(e.target.value),{nbLampes:r,nbPrises:i}=t>o.nbPoints?Te(o,t):Ce({...o,nbPoints:t});n({...o,nbPoints:t,nbLampes:r,nbPrises:i})},children:Array.from({length:16},(e,t)=>t+1).map(e=>(0,C.jsx)(`option`,{value:e,children:e},e))})]}),(xe(o.usage)||be(o.usage)||o.nbPoints>1)&&(0,C.jsxs)(C.Fragment,',
  'select 1–16 + répartition éclairage/prises dès 1 point'
);

if (n === 0) {
  console.error('Aucun patch appliqué — bundle déjà à jour ou format changé.');
  process.exit(1);
}

fs.writeFileSync(BUNDLE, s);
console.log(`\n${n} patch(s) → ${BUNDLE}`);
