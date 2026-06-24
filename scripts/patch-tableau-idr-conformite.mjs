#!/usr/bin/env node
/**
 * Conformité IDR : règle 1,6×In, règle aval/amont, tableau 771E (2 DDR 30 mA, A + AC).
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
  'ZamontDefaut_ohm:.35,tempsCoupureMax_s:{circuitTerminal_32A:.4,distribution:5}},sectionsCircuits:',
  'ZamontDefaut_ohm:.35,inAbonnement_A:60,tempsCoupureMax_s:{circuitTerminal_32A:.4,distribution:5}},dimensionnementIdr:{coefficientSommeCalibre:1.6,ddr30mA_minimum:2,coeffAval_plein_usages:[`irve`],coeffAval_plein_nom:`chauffe|ecs|eau.?chaude|convect|radiateur`},sectionsCircuits:',
  'normes: inAbonnement + dimensionnementIdr'
);

const oldIdrLoop =
  'for(let n of e.idrs){let r=e.circuits.filter(e=>e.idrAmontId===n.id).length;r>D.differentiel.nbMaxDeparts_parIDR&&t.push({circuitId:null,gravite:`majeure`,regle:`${r} départs sous l\'IDR ${n.reference} (max ${D.differentiel.nbMaxDeparts_parIDR})`,article:`NFC 15-100 §771.531.2.3.2 (A5)`,message:`Ajouter un interrupteur différentiel et répartir les circuits.`})}return t}function ge(e,t){';

const newIdrLoop = `for(let n of e.idrs){let r=e.circuits.filter(e=>e.idrAmontId===n.id),i=r.length;i>D.differentiel.nbMaxDeparts_parIDR&&t.push({circuitId:null,gravite:\`majeure\`,regle:\`\${i} départs sous l'IDR \${n.reference} (max \${D.differentiel.nbMaxDeparts_parIDR})\`,article:\`NFC 15-100 §771.531.2.3.2 (A5)\`,message:\`Ajouter un interrupteur différentiel et répartir les circuits.\`});if(n.sensibilite>30||i===0)continue;let a=r.reduce((e,t)=>e+t.disjoncteur.In,0),o=(D.dimensionnementIdr?.coefficientSommeCalibre??1.6)*n.In;a>o&&t.push({circuitId:null,gravite:\`mineure\`,regle:\`Σ calibres \${a} A > \${(D.dimensionnementIdr?.coefficientSommeCalibre??1.6)} × In (\${n.In} A) = \${o.toFixed(1)} A sous IDR \${n.reference}\`,article:\`NFC 15-100 §535.2 (règle pratique)\`,message:\`Répartir les départs sur un autre IDR ou augmenter le calibre.\`});let s=0;for(let e of r){let t=.5;e.usage===\`irve\`?t=1:e.usage===\`specialise_20A\`&&/chauffe|ecs|eau.?chaude|convect|radiateur/i.test(e.nom)&&(t=1),s+=t*e.disjoncteur.In}s>n.In&&t.push({circuitId:null,gravite:\`majeure\`,regle:\`Courant aval \${s.toFixed(1)} A > In IDR \${n.In} A (\${n.reference})\`,article:\`NFC 15-100 §771.531 / règle de l'aval\`,message:\`Chauffage, ECS et IRVE à 100 % des calibres, autres circuits à 50 % (simultanéité).\`});let c=D.reseau.inAbonnement_A??60;n.In<c&&t.push({circuitId:null,gravite:\`majeure\`,regle:\`IDR \${n.In} A < abonnement \${c} A (\${n.reference})\`,article:\`NFC 15-100 §771.314 / règle de l'amont\`,message:\`Le calibre de chaque IDR 30 mA doit être ≥ au disjoncteur d'abonnement (réglage Linky).\`})}let l=e.idrs.filter(e=>e.sensibilite<=30),u=l.length,d=l.some(e=>e.typeDiff===\`A\`||e.typeDiff===\`A-S\`),f=l.some(e=>e.typeDiff===\`AC\`||e.typeDiff===\`AC-S\`);u<(D.dimensionnementIdr?.ddr30mA_minimum??2)&&t.push({circuitId:null,gravite:\`critique\`,regle:\`\${u} DDR 30 mA (minimum \${D.dimensionnementIdr?.ddr30mA_minimum??2} — tableau 771E)\`,article:\`NFC 15-100 Tableau 771E\`,message:\`Prévoir au moins 2 interrupteurs différentiels 30 mA (1 type A + 1 type AC).\`});u>=(D.dimensionnementIdr?.ddr30mA_minimum??2)&&(!d||!f)&&t.push({circuitId:null,gravite:\`critique\`,regle:\`DDR 30 mA : type A=\${d?\`oui\`:\`non\`}, type AC=\${f?\`oui\`:\`non\`}\`,article:\`NFC 15-100 Tableau 771E / §771.531\`,message:\`Un logement exige au moins un IDR 30 mA type A et un type AC.\`});return t}function ge(e,t){`;

rep(oldIdrLoop, newIdrLoop, 'validation: 1.6×In, aval, amont, 771E');

if (n === 0) {
  console.error('Aucun patch appliqué.');
  process.exit(1);
}

fs.writeFileSync(BUNDLE, s);
console.log(`\n${n} patch(s) → ${BUNDLE}`);
