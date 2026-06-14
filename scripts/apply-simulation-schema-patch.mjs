#!/usr/bin/env node
/**
 * Patches simulation-swissdz bundle: schémas câblage (va-et-vient, PE lampes, minuterie, crépusculaire, pompe niveau).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE = path.join(__dirname, '../simulation-swissdz/assets/index-DX842G5j.js');

let s = fs.readFileSync(BUNDLE, 'utf8');
let n = 0;

function rep(old, neu, label) {
  if (!s.includes(old)) {
    console.warn('SKIP (not found):', label);
    return;
  }
  s = s.replace(old, neu);
  n++;
  console.log('OK:', label);
}

// --- Enum EVC : crépusculaire + flotteurs ---
rep(
  'CAPTEUR:`SENSORS/Interruptor de nivel - Flotador`,MINUTERIE:',
  'CAPTEUR:`SENSORS/Interruptor de nivel - Flotador`,CREPUSCUL:`SENSORS/Detecteur crepuscule`,MINUTERIE:',
  'enum CREPUSCUL'
);
rep(
  '[N.CAPTEUR]:{w:4800,h:8400},[N.MINUTERIE]',
  '[N.CAPTEUR]:{w:4800,h:8400},[N.CREPUSCUL]:{w:4800,h:8400},[N.MINUTERIE]',
  'size CREPUSCUL'
);

// --- Helpers composants ---
rep(
  'At=(e,t)=>P(e,N.CAPTEUR,295,48,40,t);',
  'At=(e,t)=>P(e,N.CREPUSCUL,295,48,40,t),Sn=(e,t,n,r,i=40)=>P(e,N.INTER_DOUBLE,n,r,i,t),Zn=(e,t,n,r,i=36)=>P(e,N.CAPTEUR,n,r,i,t);',
  'helpers Sn Zn At crepuscule'
);

// --- Routage navettes va-et-vient : couloir horizontal au-dessus des interrupteurs ---
rep(
  'let m=42-o;return at([$e(e,{x:e.x,y:m},{x:t.x,y:m},t),$e(e,{x:d,y:m},{x:d,y:t.y},t),F(e,t,Math.abs(e.x-t.x)<16)],i.composants,s)',
  'let m=42-o;if((n.id===`interA`||n.id===`interB`)&&(r.id===`interA`||r.id===`interB`))return at([$e(e,{x:e.x,y:m},{x:t.x,y:m},t)],i.composants,s);return at([$e(e,{x:e.x,y:m},{x:t.x,y:m},t),$e(e,{x:d,y:m},{x:d,y:t.y},t),F(e,t,Math.abs(e.x-t.x)<16)],i.composants,s)',
  'navette couloir VV'
);

// --- Interrupteur B (droite) : image miroir ---
rep(
  'return(0,A.jsxs)(`g`,{className:`sc-evc ${o?`sc-evc-presse`:``}`,children:[(0,A.jsx)(`defs`,{children:(0,A.jsx)(`clipPath`,{id:c.clipId,children:(0,A.jsx)(`rect`,{x:l.x,y:l.y,width:l.width,height:l.height,rx:2})})}),(0,A.jsx)(`image`,{href:c.href,x:c.x,y:c.y,width:c.width,height:c.height,clipPath:`url(#${c.clipId})`,preserveAspectRatio:`xMidYMin meet`,className:`sc-evc-image`})',
  'return(0,A.jsxs)(`g`,{className:`sc-evc ${o?`sc-evc-presse`:``}`,children:[(0,A.jsx)(`defs`,{children:(0,A.jsx)(`clipPath`,{id:c.clipId,children:(0,A.jsx)(`rect`,{x:l.x,y:l.y,width:l.width,height:l.height,rx:2})})}),(0,A.jsx)(`image`,{href:c.href,x:e.id===`interB`?c.x+c.width:c.x,y:c.y,width:c.width,height:c.height,transform:e.id===`interB`?`scale(-1,1)`:void 0,transformOrigin:e.id===`interB`?`${c.x+c.width/2}px ${c.y}px`:void 0,clipPath:`url(#${c.clipId})`,preserveAspectRatio:`xMidYMin meet`,className:`sc-evc-image`})',
  'miroir interB'
);

// --- Double allumage : interrupteur double (pas va-et-vient) ---
rep(
  'Et(`inter`,`Inter double`,280,48,40)',
  'Sn(`inter`,`Inter double`,280,48,40)',
  'double allumage Sn'
);

// --- Va-et-vient : 2 interrupteurs espacés verticalement ---
rep(
  'Et(`interA`,`V&V A`,278,44,36),Et(`interB`,`V&V B`,278,128,36)',
  'Et(`interA`,`V&V A`,282,52,36),Et(`interB`,`V&V B`,368,52,36)',
  'VV positions 2 inter côte à côte'
);

// --- qt double → INTER_DOUBLE ---
rep(
  'case`inter`:case`double`:return N.INTER_SIMPLE;',
  'case`inter`:return N.INTER_SIMPLE;case`double`:return N.INTER_DOUBLE;',
  'qt double evc'
);

// --- Crépusculaire : bon symbole ---
rep(
  'At(`crep`,`Crépusculaire`)',
  'At(`crep`,`Crépusculaire`)',
  'crep At (noop check)'
);

// --- Retirer PE lampes (double) ---
rep(
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`},{id:`pe-bar`,evc:N.PE_BAR,titre:`Barre PE`}]),Ft(`inter`,`Inter double`,280,48,40),Ct(`lampeA`,`Lampe 1`,276,70),Ct(`lampeB`,`Lampe 2`,372,70),wt(`pe-a`,300,218),wt(`pe-b`,396,218)]',
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`}]),Sn(`inter`,`Inter double`,280,48,40),Ct(`lampeA`,`Lampe 1`,276,70),Ct(`lampeB`,`Lampe 2`,372,70)]',
  'double sans PE'
);
rep(
  ',L(`pe`,`PE : barre PE → borne ⏚ lampe 1`,`Le PE vert-jaune relie la barre de terre à la borne verte du point lumineux 1.`,vt,`PE (vert-jaune)`,R(`pe-bar`,`PE1`),R(`pe-a`,`1`),`Tableau — barre PE`,`Borne PE lampe 1 — (1)`,!0),L(`pont-pe`,`Pont de PE : lampe 1 → lampe 2`,`Repiquage du PE vers la borne de la lampe 2 : toutes les masses doivent être reliées à la terre.`,vt,`Pont PE`,R(`pe-a`,`2`),R(`pe-b`,`1`),`Borne PE lampe 1 — (2)`,`Borne PE lampe 2 — (1)`,!0)]',
  ']',
  'double etapes PE'
);

// --- Retirer PE vv ---
rep(
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`},{id:`pe-bar`,evc:N.PE_BAR,titre:`Barre PE`}]),Et(`interA`,`V&V A`,278,44,36),Et(`interB`,`V&V B`,278,128,36),Ct(`lampe`,`Lampe`),wt(`pe-lampe`,375,218)]',
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`}]),Et(`interA`,`V&V A`,282,52,36),Et(`interB`,`V&V B`,368,52,36),Ct(`lampe`,`Lampe`,325,200)]',
  'vv sans PE composants'
);
rep(
  ',L(`pe`,`PE : barre PE → borne ⏚`,`PE vert-jaune de la barre de terre à la borne verte du point lumineux.`,vt,`PE (vert-jaune)`,R(`pe-bar`,`PE1`),R(`pe-lampe`,`1`),`Tableau — barre PE`,`Borne PE — (1)`,!0)]},{id:`minuterie`',
  ']},{id:`minuterie`',
  'vv etape PE'
);

// --- Retirer PE minuterie ---
rep(
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`},{id:`module`,evc:N.MINUTERIE,titre:`MINUTERIE`,sousTitre:`ON delay · 1–30 s`},{id:`pe-bar`,evc:N.PE_BAR,titre:`Barre PE`}]),Dt(`bp`,`BP`),Ct(`lampe`,`Lampe`),wt(`pe-lampe`,375,218)]',
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`},{id:`module`,evc:N.MINUTERIE,titre:`MINUTERIE`,sousTitre:`ON delay · 1–30 s`}]),Dt(`bp`,`BP`),Ct(`lampe`,`Lampe`)]',
  'minuterie sans PE'
);
rep(
  ',L(`pe`,`PE → borne ⏚`,`PE vert-jaune vers la borne de terre du point lumineux.`,vt,`PE (vert-jaune)`,R(`pe-bar`,`PE1`),R(`pe-lampe`,`1`),`Tableau — barre PE`,`Borne PE — (1)`,!0)]},{id:`crepusculaire`',
  ']},{id:`crepusculaire`',
  'minuterie etape PE'
);

// --- Retirer PE crépusculaire (projecteur extérieur garde PE? user said lampes - projecteur might need PE; user said no PE on lamps) ---
rep(
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`},{id:`pe-bar`,evc:N.PE_BAR,titre:`Barre PE`}]),At(`crep`,`Crépusculaire`),Ct(`projo`,`Projecteur`),wt(`pe-projo`,375,218)]',
  '[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C10`}]),At(`crep`,`Crépusculaire`),Ct(`projo`,`Projecteur`)]',
  'crepusculaire sans PE'
);
rep(
  ',L(`pe`,`PE → projecteur (classe I, extérieur)`,`PE OBLIGATOIRE : luminaire extérieur classe I, masse métallique exposée aux intempéries.`,vt,`PE (vert-jaune)`,R(`pe-bar`,`PE1`),R(`pe-projo`,`1`),`Tableau — barre PE`,`Borne PE projecteur — (1)`,!0)]},{id:`pompe`',
  ']},{id:`pompe`',
  'crepusculaire etape PE'
);

// --- VV hauteur ---
rep(
  '{id:`vv`,titre:`Va-et-vient`,description:`2 interrupteurs commandent la même lampe depuis 2 points (couloir, escalier).`,commande:`vv`,recepteurs:[{id:`lampe`,nom:`Éclairage couloir`,type:`lampe`}],circuit:{In:10,courbe:`C`,section_mm2:1.5,longueur_m:18,puissance_W:60},composants:',
  '{id:`vv`,titre:`Va-et-vient`,description:`2 interrupteurs commandent la même lampe depuis 2 points (couloir, escalier).`,hauteur:420,commande:`vv`,recepteurs:[{id:`lampe`,nom:`Éclairage couloir`,type:`lampe`}],circuit:{In:10,courbe:`C`,section_mm2:1.5,longueur_m:18,puissance_W:60},composants:',
  'vv hauteur'
);

// --- Minuterie : chronomètre HUD ---
rep(
  '[fe,pe]=(0,l.useState)(0),O=(0,l.useRef)(0),k=(0,l.useRef)(0),me=(0,l.useRef)(0)',
  '[fe,pe]=(0,l.useState)(0),[chronoMs,chronoSet]=(0,l.useState)(0),O=(0,l.useRef)(0),k=(0,l.useRef)(0),me=(0,l.useRef)(0),chronoRef=(0,l.useRef)(null)',
  'chrono state'
);

rep(
  'i.commande===`poussoir`?(m([!0,!1]),clearTimeout(k.current),k.current=window.setTimeout(()=>m([!1,!1]),5e3))',
  'i.commande===`poussoir`?(m([!0,!1]),clearTimeout(k.current),clearInterval(chronoRef.current),chronoSet(3e4),chronoRef.current=window.setInterval(()=>chronoSet(e=>e<=100?0:e-100),100),k.current=window.setTimeout(()=>{m([!1,!1]),clearInterval(chronoRef.current),chronoSet(0)},3e4))',
  'minuterie 30s chrono'
);

rep(
  '(0,A.jsxs)(`div`,{className:`ar-hud`,children:[(0,A.jsx)(`span`,{className:`hud-titre`,children:i.titre})',
  '(0,A.jsxs)(`div`,{className:`ar-hud`,children:[(0,A.jsx)(`span`,{className:`hud-titre`,children:i.titre}),i.id===`minuterie`&&chronoMs>0?(0,A.jsxs)(`span`,{className:`hud-chrono`,title:`Temps restant`,children:[`⏱ `,(chronoMs/1e3).toFixed(1),` s`]}):null',
  'hud chrono display'
);

// --- Symbole SVG crépusculaire sur le schéma ---
rep(
  'return(0,A.jsx)(Vt,{comp:t,meta:n,actif:i[t.id]??l??t.actif,boutonPresse:a===t.id,simulationActive:o,onActionEVC:s?e=>s(t.id,e):void 0})},t.id)}),ee.map',
  'return(0,A.jsxs)(`g`,{children:[(0,A.jsx)(Vt,{comp:t,meta:n,actif:i[t.id]??l??t.actif,boutonPresse:a===t.id,simulationActive:o,onActionEVC:s?e=>s(t.id,e):void 0}),t.id===`crep`?(0,A.jsxs)(`g`,{className:`sc-crep-sym`,transform:`translate(${t.x+t.w/2-14} ${t.y+8})`,children:[(0,A.jsx)(`circle`,{cx:14,cy:14,r:11,fill:`#ffd24a33`,stroke:`#ffd24a`,strokeWidth:1.5}),(0,A.jsx)(`line`,{x1:14,y1:3,x2:14,y2:8,stroke:`#ffd24a`,strokeWidth:1.5}),(0,A.jsx)(`line`,{x1:14,y1:20,x2:14,y2:25,stroke:`#ffd24a`,strokeWidth:1.5}),(0,A.jsx)(`line`,{x1:3,y1:14,x2:8,y2:14,stroke:`#ffd24a`,strokeWidth:1.5}),(0,A.jsx)(`line`,{x1:20,y1:14,x2:25,y2:14,stroke:`#ffd24a`,strokeWidth:1.5})]}):null]},t.id)}),ee.map',
  'svg crepuscule sun'
);

// --- Nouveau scénario pompe 3 flotteurs (Z) ---
const pompeNiveau =
  "{id:`pompe-niveau`,titre:`Pompe citerne — 3 flotteurs`,niveau:`pro`,hauteur:720,description:`Remplissage / vidange avec capteurs bas · moyen · haut (schéma en Z).`,commande:`marche`,recepteurs:[{id:`pompe`,nom:`Pompe 1~ 750 W`,type:`moteur`}],circuit:{In:16,courbe:`C`,section_mm2:2.5,longueur_m:25,puissance_W:750},composants:[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C16`},{id:`km`,evc:N.CONTACTOR_3P,titre:`KM1`,sousTitre:`230 V`},{id:`pe-bar`,evc:N.PE_BAR,titre:`Barre PE`}]),Zn(`f-bas`,`Flotteur BAS`,300,52,32),Zn(`f-moy`,`Flotteur MOYEN`,300,120,32),Zn(`f-haut`,`Flotteur HAUT`,300,188,32),Dt(`marche`,`MARCHE`,!1,360,55),Dt(`arret`,`ARRÊT`,!0,412,55),kt(`pompe`,`Pompe`)],etapes:[L(`phase`,`Phase → KM1 (A1)`,`Alimentation bobine contacteur.`,gt,`Phase (L)`,R(`disj`,`2`),R(`km`,`A1`),`Disjoncteur — L`,`KM1 — A1`),L(`neutre`,`Neutre → KM1 (A2)`,`Neutre bobine.`,_t,`Neutre (N)`,R(`disj`,`4`),R(`km`,`A2`),`Disjoncteur — N`,`KM1 — A2`),L(`puissance`,`KM1 → pompe`,`Puissance vers pompe.`,gt,`Phase pompe`,R(`km`,`2`),R(`pompe`,`U1`),`KM1 — 2`,`Pompe — U1`),L(`n-pompe`,`Neutre → pompe`,`Neutre direct.`,_t,`Neutre pompe`,R(`disj`,`4`),R(`pompe`,`W1`),`Disjoncteur — N`,`Pompe — W1`),L(`fb-bk`,`Flotteur bas → moyen`,`Schéma Z : flotteur bas vers moyen.`,bt,`Navette BAS`,R(`f-bas`,`BK`),R(`f-moy`,`BN`),`Flotteur BAS — BK`,`Flotteur MOYEN — BN`),L(`fm-bk`,`Flotteur moyen → haut`,`Suite schéma Z.`,bt,`Navette MOYEN`,R(`f-moy`,`BK`),R(`f-haut`,`BN`),`Flotteur MOYEN — BK`,`Flotteur HAUT — BN`),L(`pe`,`PE → pompe`,`Terre carcasse pompe.`,vt,`PE`,R(`pe-bar`,`PE1`),R(`pompe`,`PE`),`Barre PE`,`Pompe — PE`,!0)]}";

if (!s.includes('id:`pompe-niveau`')) {
  s = s.replace('];function Nt(e){', `,${pompeNiveau}];function Nt(e){`);
  n++;
  console.log('OK: scenario pompe-niveau');
}

// --- CSS chrono (inject via patch in index or separate) ---
const cssPath = path.join(__dirname, '../simulation-swissdz/assets/index-CiOO-aXC.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('hud-chrono')) {
  css += '.hud-chrono{color:#ffd24a;background:#ffd24a1a;border:1px solid #ffd24a66;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:800;font-family:SF Mono,Cascadia Code,monospace}.sc-crep-sym{pointer-events:none}';
  fs.writeFileSync(cssPath, css);
  console.log('OK: css hud-chrono');
}

fs.writeFileSync(BUNDLE, s);
console.log(`\nDone: ${n} patches applied to bundle.`);
