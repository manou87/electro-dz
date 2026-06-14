#!/usr/bin/env node
/**
 * Vérifie les points DOCA0141 (Micrologic tr=1 s) pour le pilote NSX160.
 * node scripts/validate-trip-pilot.mjs
 */
import { SCHNEIDER_NSX_MIC_TR1, scaleAnchorsByTr } from './public-trip-curve-data.js';

function interpLogLog(anchors, m) {
  if (m <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [m1, t1] = anchors[i];
    const [m2, t2] = anchors[i + 1];
    if (m >= m1 && m <= m2) {
      const lm = Math.log10(m);
      const lm1 = Math.log10(m1);
      const lm2 = Math.log10(m2);
      const lt1 = Math.log10(t1);
      const lt2 = Math.log10(t2);
      const lt = lt1 + ((lt2 - lt1) * (lm - lm1)) / (lm2 - lm1);
      return Math.pow(10, lt);
    }
  }
  const [m1, t1] = anchors[anchors.length - 2];
  const [m2, t2] = anchors[anchors.length - 1];
  const lm = Math.log10(m);
  const lm1 = Math.log10(m1);
  const lm2 = Math.log10(m2);
  const lt1 = Math.log10(t1);
  const lt2 = Math.log10(t2);
  const lt = lt1 + ((lt2 - lt1) * (lm - lm1)) / (lm2 - lm1);
  return Math.pow(10, lt);
}

const CASES = [
  { m: 1.5, t: 25, label: '1,5·Ir' },
  { m: 6, t: 1, label: '6·Ir (tr=1s)' },
  { m: 7.2, t: 0.7, label: '7,2·Ir' },
];

const anchors = SCHNEIDER_NSX_MIC_TR1.anchors;
let ok = 0;
let fail = 0;

console.log('Pilote Micrologic — DOCA0141EN (tr=1 s)\n');
for (const c of CASES) {
  const got = interpLogLog(anchors, c.m);
  const err = Math.abs(got - c.t) / c.t;
  const pass = err < 0.05;
  console.log(`${pass ? 'OK' : 'FAIL'} ${c.label}: attendu ${c.t} s, calculé ${got.toFixed(3)} s (${(err * 100).toFixed(1)} %)`);
  if (pass) ok++;
  else fail++;
}

const tr16 = scaleAnchorsByTr(anchors, 16, 1);
const t6 = interpLogLog(tr16, 6);
const pass16 = Math.abs(t6 - 16) / 16 < 0.05;
console.log(`${pass16 ? 'OK' : 'FAIL'} tr=16 s @ 6·Ir: attendu 16 s, calculé ${t6.toFixed(2)} s`);
if (pass16) ok++;
else fail++;

console.log(`\n${ok} OK, ${fail} échec(s)`);
process.exit(fail > 0 ? 1 : 0);
