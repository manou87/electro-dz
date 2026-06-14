#!/usr/bin/env node
/**
 * Pompe citerne — 3 flotteurs : citerne simulée, 2 pompes (remplissage / vidange), flotteurs actifs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE = path.join(__dirname, '../simulation-swissdz/assets/index-DX842G5j.js');
const CSS = path.join(__dirname, '../simulation-swissdz/assets/index-CiOO-aXC.css');

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

// --- Barres PE/N compactes (SVG + vis) + helper Pb + kt(x,y,w) ---
rep(
  '[N.PE_BAR]:{w:1200,h:7200},[N.BORNE_PE]',
  '[N.PE_BAR]:{w:1200,h:7200},[N.N_BAR]:{w:1200,h:7200},[N.BORNE_PE]',
  'Be N_BAR'
);

rep(
  'Zn=(e,t,n,r,i=36)=>P(e,N.CAPTEUR,n,r,i,t);function jt(',
  'Zn=(e,t,n,r,i=36)=>P(e,N.CAPTEUR,n,r,i,t),Pb=(e,t,n,r,i,a,o,s)=>{let c=P(e,t,n,r,a,o,s);return c.h=i,c};function jt(',
  'Pb helper'
);

rep(
  'kt=(e,t,n=278,r=56)=>P(e,N.MOTEUR_6T,n,200,r,t),',
  'kt=(e,t,x=278,y=200,w=56)=>P(e,N.MOTEUR_6T,x,y,w,t),',
  'kt x,y,w signature'
);

const VT_OLD = 'function Vt({comp:e,meta:t,actif:n,boutonPresse:r,simulationActive:i,onActionEVC:a}){let o=r??!1,s=n||o?t.imageOn:t.imageOff,c=Ft(e,t,ze(e.evc,s)),l=It(e),u=Nt(e.evc);return(0,A.jsxs)(`g`,{className:`sc-evc ${o?`sc-evc-presse`:``}`,children:[(0,A.jsx)(`defs`,{children:(0,A.jsx)(`clipPath`,{id:c.clipId,children:(0,A.jsx)(`rect`,{x:l.x,y:l.y,width:l.width,height:l.height,rx:2})})}),(0,A.jsx)(`image`,{href:c.href,x:e.id===`interB`?c.x+c.width:c.x,y:c.y,width:c.width,height:c.height,transform:e.id===`interB`?`scale(-1,1)`:void 0,transformOrigin:e.id===`interB`?`${c.x+c.width/2}px ${c.y}px`:void 0,clipPath:`url(#${c.clipId})`,preserveAspectRatio:`xMidYMin meet`,className:`sc-evc-image`}),u.map(r=>(0,A.jsx)(Bt,{comp:e,meta:t,hs:r,actif:n||o,enabled:i||r.action===`mcb_toggle`,onAction:a},r.id))]})}';

const VT_NEW = 'function Vt({comp:e,meta:t,actif:n,boutonPresse:r,simulationActive:i,onActionEVC:a}){let o=r??!1;if(e.evc===N.PE_BAR||e.evc===N.N_BAR){let s=e.evc===N.PE_BAR,c=It(e),l=Nt(e.evc),u=s?[`PE`,`PE1`,`PE2`,`PE3`,`PE4`,`PE5`]:[`N`,`N1`,`N2`,`N3`,`N4`,`N5`];return(0,A.jsxs)(`g`,{className:`sc-evc sc-barre`,children:[(0,A.jsx)(`rect`,{x:c.x,y:c.y,width:c.width,height:c.height,rx:4,className:s?`sc-barre-pe`:`sc-barre-ne`}),u.map((e,t)=>{let n=c.y+10+t*(c.height-20)/5;return(0,A.jsxs)(`g`,{children:[(0,A.jsx)(`circle`,{cx:c.x+c.width-7,cy:n,r:3.5,className:`sc-barre-vis`}),(0,A.jsx)(`text`,{x:c.x+5,y:n+3.5,className:`sc-borne-libelle`,children:e})]},t)}),(0,A.jsx)(`text`,{x:c.x+c.width/2,y:c.y-5,className:`sc-barre-libelle`,children:e.titre}),l.map(r=>(0,A.jsx)(Bt,{comp:e,meta:t,hs:r,actif:n||o,enabled:i||r.action===`mcb_toggle`,onAction:a},r.id))]})}let s=n||o?t.imageOn:t.imageOff,c=Ft(e,t,ze(e.evc,s)),l=It(e),u=Nt(e.evc);return(0,A.jsxs)(`g`,{className:`sc-evc ${o?`sc-evc-presse`:``}`,children:[(0,A.jsx)(`defs`,{children:(0,A.jsx)(`clipPath`,{id:c.clipId,children:(0,A.jsx)(`rect`,{x:l.x,y:l.y,width:l.width,height:l.height,rx:2})})}),(0,A.jsx)(`image`,{href:c.href,x:e.id===`interB`?c.x+c.width:c.x,y:c.y,width:c.width,height:c.height,transform:e.id===`interB`?`scale(-1,1)`:void 0,transformOrigin:e.id===`interB`?`${c.x+c.width/2}px ${c.y}px`:void 0,clipPath:`url(#${c.clipId})`,preserveAspectRatio:`xMidYMin meet`,className:`sc-evc-image`}),u.map(r=>(0,A.jsx)(Bt,{comp:e,meta:t,hs:r,actif:n||o,enabled:i||r.action===`mcb_toggle`,onAction:a},r.id))]})}';

rep(VT_OLD, VT_NEW, 'Vt barre PE/N SVG');

// --- Scénario pompe-niveau (remplace l'ancien) ---
const POMPE = String.raw`{id:`pompe-niveau`,titre:`Pompe citerne — 3 flotteurs`,niveau:`pro`,hauteur:820,description:`Citerne simulée : flotteurs BAS · MOY · HAUT enclenchent les contacts — pompe remplissage & pompe vidange.`,commande:`citerne`,recepteurs:[{id:`pompe-r`,nom:`Pompe remplissage 1~ 750 W`,type:`moteur`},{id:`pompe-v`,nom:`Pompe vidange 1~ 750 W`,type:`moteur`}],circuit:{In:16,courbe:`C`,section_mm2:2.5,longueur_m:25,puissance_W:750},composants:[...jt([{id:`disj`,evc:N.DISJ_2P_C10,titre:`C16`},{id:`km-r`,evc:N.CONTACTOR_3P,titre:`KM-R`,sousTitre:`Remplissage`},{id:`km-v`,evc:N.CONTACTOR_3P,titre:`KM-V`,sousTitre:`Vidange`}]),Pb(`pe-bar`,N.PE_BAR,54,448,70,32,`Barre PE`),Pb(`n-bar`,N.N_BAR,92,448,70,32,`Barre N`),Zn(`f-bas`,`Flotteur BAS`,306,248,28),Zn(`f-moy`,`Flotteur MOYEN`,306,188,28),Zn(`f-haut`,`Flotteur HAUT`,306,128,28),Dt(`marche-r`,`M. REMPL.`,!1,284,48),Dt(`arret-r`,`A. REMPL.`,!0,332,48),Dt(`marche-v`,`M. VID.`,!1,284,368),Dt(`arret-v`,`A. VID.`,!0,332,368),kt(`pompe-r`,`Pompe R`,352,470,44),kt(`pompe-v`,`Pompe V`,352,535,44)],etapes:[L(`phase-r`,`Phase → KM-R (A1)`,`Alimentation bobine contacteur remplissage.`,gt,`Phase (L)`,R(`disj`,`2`),R(`km-r`,`A1`),`Disjoncteur — L`,`KM-R — A1`),L(`neutre-r`,`Neutre → KM-R (A2)`,`Neutre bobine KM remplissage.`,_t,`Neutre (N)`,R(`disj`,`4`),R(`km-r`,`A2`),`Disjoncteur — N`,`KM-R — A2`),L(`phase-v`,`Phase → KM-V (A1)`,`Alimentation bobine contacteur vidange.`,gt,`Phase (L)`,R(`disj`,`2`),R(`km-v`,`A1`),`Disjoncteur — L`,`KM-V — A1`),L(`neutre-v`,`Neutre → KM-V (A2)`,`Neutre bobine KM vidange.`,_t,`Neutre (N)`,R(`disj`,`4`),R(`km-v`,`A2`),`Disjoncteur — N`,`KM-V — A2`),L(`pu-r`,`KM-R → pompe remplissage`,`Puissance vers pompe de remplissage.`,gt,`Phase pompe R`,R(`km-r`,`2`),R(`pompe-r`,`U1`),`KM-R — 2`,`Pompe R — U1`),L(`n-pr`,`Neutre → pompe R`,`Neutre direct pompe remplissage.`,_t,`Neutre pompe R`,R(`disj`,`4`),R(`pompe-r`,`W1`),`Disjoncteur — N`,`Pompe R — W1`),L(`pu-v`,`KM-V → pompe vidange`,`Puissance vers pompe de vidange.`,gt,`Phase pompe V`,R(`km-v`,`2`),R(`pompe-v`,`U1`),`KM-V — 2`,`Pompe V — U1`),L(`n-pv`,`Neutre → pompe V`,`Neutre direct pompe vidange.`,_t,`Neutre pompe V`,R(`disj`,`4`),R(`pompe-v`,`W1`),`Disjoncteur — N`,`Pompe V — W1`),L(`fb-bk`,`Flotteur BAS → MOYEN (Z)`,`Schéma en Z : liaison entre flotteurs bas et moyen.`,bt,`Navette BAS`,R(`f-bas`,`BK`),R(`f-moy`,`BN`),`Flotteur BAS — BK`,`Flotteur MOYEN — BN`),L(`fm-bk`,`Flotteur MOYEN → HAUT (Z)`,`Suite du schéma Z vers le flotteur haut.`,bt,`Navette MOYEN`,R(`f-moy`,`BK`),R(`f-haut`,`BN`),`Flotteur MOYEN — BK`,`Flotteur HAUT — BN`),L(`pe-r`,`PE → pompe R`,`Terre carcasse pompe remplissage.`,vt,`PE`,R(`pe-bar`,`PE1`),R(`pompe-r`,`PE`),`Barre PE`,`Pompe R — PE`,!0),L(`pe-v`,`PE → pompe V`,`Terre carcasse pompe vidange.`,vt,`PE`,R(`pompe-r`,`PE`),R(`pompe-v`,`PE`),`Pompe R — PE`,`Pompe V — PE`,!0)]}`;

if (s.includes('id:`pompe-niveau`')) {
  const start = s.indexOf('{id:`pompe-niveau`');
  const end = s.indexOf('];function Nt(e){');
  s = s.slice(0, start) + POMPE + s.slice(end);
  n++;
  console.log('OK: scenario pompe-niveau remplacé');
} else {
  console.warn('SKIP: scenario pompe-niveau introuvable');
}

// --- Hotspot flotteur cliquable ---
rep(
  ':e.includes(`Interuptor`)?[{id:`levier`,action:`bp_press`,nx:.5,ny:.48,nw:.38,nh:.2,title:`Levier interrupteur`}]:[]}',
  ':e.includes(`Interuptor`)?[{id:`levier`,action:`bp_press`,nx:.5,ny:.48,nw:.38,nh:.2,title:`Levier interrupteur`}]:e.includes(`Flotador`)?[{id:`float`,action:`bp_press`,nx:.5,ny:.42,nw:.55,nh:.35,title:`Simuler niveau eau sur ce flotteur`}]:[]}',
  'hotspot flotteur'
);

// --- Yt labels commande citerne ---
rep(
  'case`telerupteur`:return[`BP — impulsion`]}}function Xt({scenario:e',
  'case`telerupteur`:return[`BP — impulsion`];case`citerne`:return[`Pompe remplissage`,`Pompe vidange`]}}function CiternePanel({niveau:e,fill:t,drain:n,auto:r,flBas:i,flMoy:a,flHaut:o,onNiveau:c,onFill:l,onDrain:u,onAuto:d}){return(0,A.jsxs)(`div`,{className:`citerne-sim`,children:[(0,A.jsx)(`h5`,{children:`Citerne — simulation niveau`}),(0,A.jsxs)(`div`,{className:`citerne-reservoir`,children:[(0,A.jsx)(`div`,{className:`citerne-eau`,style:{height:`${e}%`}}),(0,A.jsxs)(`div`,{className:`citerne-flotteurs`,children:[(0,A.jsxs)(`span`,{className:`citerne-fl ${i?`actif`:``}`,style:{bottom:`18%`},children:[`BAS`]}),(0,A.jsxs)(`span`,{className:`citerne-fl ${a?`actif`:``}`,style:{bottom:`48%`},children:[`MOY`]}),(0,A.jsxs)(`span`,{className:`citerne-fl ${o?`actif`:``}`,style:{bottom:`78%`},children:[`HAUT`]})]}),(0,A.jsxs)(`span`,{className:`citerne-niveau-val`,children:[Math.round(e),` %`]})]}),(0,A.jsx)(`input`,{type:`range`,className:`citerne-slider`,min:0,max:100,value:e,onChange:e=>c(+e.target.value),title:`Niveau eau`}),(0,A.jsxs)(`div`,{className:`citerne-pompes`,children:[(0,A.jsxs)(`span`,{className:`citerne-pompe ${t?`actif`:``}`,children:[`Remplissage `,t?`ON`:`OFF`]}),(0,A.jsxs)(`span`,{className:`citerne-pompe ${n?`actif`:``}`,children:[`Vidange `,n?`ON`:`OFF`]})]}),(0,A.jsxs)(`label`,{className:`citerne-auto`,children:[(0,A.jsx)(`input`,{type:`checkbox`,checked:r,onChange:e=>d(e.target.checked)}),` Mode auto (BAS remplissage · HAUT vidange)`]})]})}function Xt({scenario:e',
  'Yt citerne + CiternePanel'
);

// --- Xt : panneau citerne + props ---
rep(
  'function Xt({scenario:e,etapesTerminees:t,recepteursActifs:n,commande:r,onActionner:i,poste:a,onPoste:o}){let s=t>=e.etapes.length,c=e.commande===`marche`||e.commande===`telerupteur`,l=Yt(e),u=qt(e);return(0,A.jsxs)(`div`,{className:`vue-installation`,children:[(0,A.jsx)(`div`,{className:`recepteurs`,children:e.recepteurs.map((e,t)=>(0,A.jsx)(Jt,{type:e.type,nom:e.nom,actif:n[t]??!1},e.id))}),c&&a&&o?(0,A.jsx)(Kt,{scenario:e,termine:s,poste:a,onPoste:o}):(0,A.jsx)(`div`,{className:`commandes evc-commandes`,children:l.map((t,n)=>(0,A.jsx)(Gt,{evc:e.commande===`vv`&&n===1?N.INTER_VV:u,label:t,disabled:!s,actif:r[n]&&e.commande!==`vv`,onClick:()=>i(n)},t))}),',
  'function Xt({scenario:e,etapesTerminees:t,recepteursActifs:n,commande:r,onActionner:i,poste:a,onPoste:o,citerne:f}){let s=t>=e.etapes.length,c=e.commande===`marche`||e.commande===`telerupteur`,p=e.commande===`citerne`,l=Yt(e),u=qt(e);return(0,A.jsxs)(`div`,{className:`vue-installation`,children:[(0,A.jsx)(`div`,{className:`recepteurs`,children:e.recepteurs.map((e,t)=>(0,A.jsx)(Jt,{type:e.type,nom:e.nom,actif:n[t]??!1},e.id))}),f?(0,A.jsx)(CiternePanel,{...f}):null,p&&s?(0,A.jsxs)(`div`,{className:`poste-commande`,children:[(0,A.jsx)(`h5`,{children:`Poste — 2 pompes (EVC)`}),(0,A.jsxs)(`div`,{className:`poste-boutons`,children:[(0,A.jsx)(Gt,{evc:N.BP_VERT,label:`MARCHE remplissage`,disabled:!s,actif:f?.fill,onClick:()=>i(0)}),(0,A.jsx)(Gt,{evc:N.BP_ROUGE,label:`ARRÊT remplissage`,disabled:!s,onClick:()=>i(2)}),(0,A.jsx)(Gt,{evc:N.BP_VERT,label:`MARCHE vidange`,disabled:!s,actif:f?.drain,onClick:()=>i(1)}),(0,A.jsx)(Gt,{evc:N.BP_ROUGE,label:`ARRÊT vidange`,disabled:!s,onClick:()=>i(3)})]})]}):c&&a&&o?(0,A.jsx)(Kt,{scenario:e,termine:s,poste:a,onPoste:o}):(0,A.jsx)(`div`,{className:`commandes evc-commandes`,children:l.map((t,n)=>(0,A.jsx)(Gt,{evc:e.commande===`vv`&&n===1?N.INTER_VV:u,label:t,disabled:!s,actif:r[n]&&e.commande!==`vv`,onClick:()=>i(n)},t))}),',
  'Xt citerne UI'
);

// --- Ut : citerne SVG + prop niveauCiterne ---
rep(
  'function Ut({scenario:e,etapeIndex:t,progression:n,recepteursActifs:r,etatsEVC:i={},boutonPresse:a=null,simulationActive:o=!1,onActionEVC:s,interactif:c=!1,borneSelectionnee:u=null,borneErreur:d=null,montrerCible:f=!0,onClicBorne:p}){',
  'function Ut({scenario:e,etapeIndex:t,progression:n,recepteursActifs:r,etatsEVC:i={},boutonPresse:a=null,simulationActive:o=!1,onActionEVC:s,interactif:c=!1,borneSelectionnee:u=null,borneErreur:d=null,montrerCible:f=!0,onClicBorne:p,niveauCiterne:q}){',
  'Ut prop niveauCiterne'
);

rep(
  '(0,A.jsx)(`text`,{x:366,y:28,className:`sc-zone-titre`,children:`APPAREILLAGE`}),x.map(t=>{',
  '(0,A.jsx)(`text`,{x:366,y:28,className:`sc-zone-titre`,children:`APPAREILLAGE`}),q!=null?(0,A.jsxs)(`g`,{className:`sc-citerne`,children:[(0,A.jsx)(`rect`,{x:292,y:96,width:158,height:250,rx:8,className:`sc-citerne-cuve`}),(0,A.jsx)(`rect`,{x:296,y:346-Math.round(2.45*q),width:150,height:Math.max(2,Math.round(2.45*q)),className:`sc-citerne-eau`}),(0,A.jsx)(`text`,{x:371,y:88,className:`sc-citerne-titre`,children:`CITERNE`}),[[248,`BAS`,18],[188,`MOY`,48],[128,`HAUT`,78]].map(([e,t,n])=>(0,A.jsxs)(`g`,{children:[(0,A.jsx)(`line`,{x1:288,y1:e,x2:454,y2:e,className:`sc-citerne-repere`}),(0,A.jsx)(`text`,{x:456,y:e+3,className:`sc-citerne-label`,children:t})]},t)),(0,A.jsxs)(`text`,{x:371,y:360,className:`sc-citerne-niv`,children:[Math.round(q),` %`]})]}):null,x.map(t=>{',
  'Ut SVG citerne'
);

// --- $t : état citerne ---
rep(
  'chronoRef=(0,l.useRef)(null),[he,ge]=(0,l.useState)(null)',
  'chronoRef=(0,l.useRef)(null),[niveauEau,setNiveauEau]=(0,l.useState)(35),[pompeFill,setPompeFill]=(0,l.useState)(!1),[pompeDrain,setPompeDrain]=(0,l.useState)(!1),[autoCiterne,setAutoCiterne]=(0,l.useState)(!1),[he,ge]=(0,l.useState)(null)',
  'state citerne'
);

rep(
  'function Se(e){r(e),s(0),u(0),f(!1),m([!1,!1]),g(!1),v(!1),b(!1),te(!0),re(null),le(null),D(null),de(0),pe(0),clearTimeout(k.current),clearTimeout(me.current)}',
  'function Se(e){r(e),s(0),u(0),f(!1),m([!1,!1]),g(!1),v(!1),b(!1),te(!0),re(null),le(null),D(null),de(0),pe(0),setNiveauEau(35),setPompeFill(!1),setPompeDrain(!1),setAutoCiterne(!1),clearTimeout(k.current),clearTimeout(me.current),clearInterval(chronoRef.current),chronoSet(0)}',
  'Se reset citerne'
);

// --- Animation niveau eau (après définition de j) ---
rep(
  'let j=xe&&o>=i.etapes.length,M=j||!xe?null:be[o]??null,Te=i.commande===`marche`||i.commande===`telerupteur`',
  'let j=xe&&o>=i.etapes.length;(0,l.useEffect)(()=>{if(i.id!==`pompe-niveau`)return;let e=window.setInterval(()=>{setNiveauEau(t=>{let n=t;if(pompeFill&&S&&!_)n=Math.min(100,n+1.8);if(pompeDrain&&S&&!_)n=Math.max(0,n-2.2);return n})},180);return()=>clearInterval(e)},[i.id,pompeFill,pompeDrain,S,_]),(0,l.useEffect)(()=>{if(i.id!==`pompe-niveau`||!autoCiterne||!j)return;let e=niveauEau;e<22&&!pompeFill&&!pompeDrain&&setPompeFill(!0);e>=82&&pompeFill&&setPompeFill(!1);e>78&&!pompeDrain&&!pompeFill&&setPompeDrain(!0);e<=18&&pompeDrain&&setPompeDrain(!1)},[i.id,autoCiterne,j,niveauEau,pompeFill,pompeDrain]);let M=j||!xe?null:be[o]??null,Te=i.commande===`marche`||i.commande===`telerupteur`',
  'useEffect animation eau'
);

// --- De recepteurs citerne ---
rep(
  'let Te=i.commande===`marche`||i.commande===`telerupteur`,Ee=j&&h&&!_&&!y&&S,De=Te?i.recepteurs.map(()=>Ee):Zt(i,p,j),',
  'let Te=i.commande===`marche`||i.commande===`telerupteur`,Citerne=i.id===`pompe-niveau`,Ee=j&&h&&!_&&!y&&S,EeR=j&&pompeFill&&!_&&!y&&S,EeV=j&&pompeDrain&&!_&&!y&&S,De=Citerne?i.recepteurs.map((e,t)=>t===0?EeR:EeV):Te?i.recepteurs.map(()=>Ee):Zt(i,p,j),',
  'De 2 pompes'
);

// --- ke etatsEVC flotteurs + KM + boutons ---
rep(
  'else if(t.evc.includes(`CONTACTORS/`))e[t.id]=Ee;else if(t.id===`marche`||t.id===`bp`)',
  'else if(t.evc.includes(`CONTACTORS/`))e[t.id]=t.id===`km-r`?EeR:t.id===`km-v`?EeV:Ee;else if(t.id===`f-bas`)e[t.id]=niveauEau>=18;else if(t.id===`f-moy`)e[t.id]=niveauEau>=48;else if(t.id===`f-haut`)e[t.id]=niveauEau>=78;else if(t.id===`marche-r`)e[t.id]=pompeFill;else if(t.id===`arret-r`)e[t.id]=!pompeFill;else if(t.id===`marche-v`)e[t.id]=pompeDrain;else if(t.id===`arret-v`)e[t.id]=!pompeDrain;else if(t.id===`marche`||t.id===`bp`)',
  'ke flotteurs KM'
);

rep(
  'return e},[i,S,y,Ee,w,_,p,j,De]);',
  'return e},[i,S,y,Ee,EeR,EeV,w,_,p,j,De,niveauEau,pompeFill,pompeDrain]);',
  'ke deps'
);

// --- Ae : boutons pompe + flotteurs ---
rep(
  'case`bp_press`:if(!j)return;if(n(),Te)e===`marche`?je(`marche`):e===`arret`?je(`arret`):e===`au`?je(`au`):e===`bp`&&je(`bp`);else{let t=[`inter`,`interA`,`interB`,`crep`,`bp`].indexOf(e);Ne(t>=0?t:0)}break}',
  'case`bp_press`:if(!j)return;if(n(),i.id===`pompe-niveau`){e===`marche-r`?setPompeFill(!0):e===`arret-r`?setPompeFill(!1):e===`marche-v`?setPompeDrain(!0):e===`arret-v`?setPompeDrain(!1):e===`f-bas`?setNiveauEau(e=>e<22?25:15):e===`f-moy`?setNiveauEau(e=>e<52?55:42):e===`f-haut`?setNiveauEau(e=>e<82?85:72):void 0;break}if(Te)e===`marche`?je(`marche`):e===`arret`?je(`arret`):e===`au`?je(`au`):e===`bp`&&je(`bp`);else{let t=[`inter`,`interA`,`interB`,`crep`,`bp`].indexOf(e);Ne(t>=0?t:0)}break}',
  'Ae pompe citerne'
);

// --- Ne : commandes citerne depuis panneau droit ---
rep(
  'function Ne(e){j&&(i.commande===`poussoir`?',
  'function Ne(e){if(j&&i.id===`pompe-niveau`){e===0?setPompeFill(!0):e===1?setPompeDrain(!0):e===2?setPompeFill(!1):e===3&&setPompeDrain(!1);return}j&&(i.commande===`poussoir`?',
  'Ne citerne pompes'
);

// --- Pass props Ut + Xt ---
rep(
  'onClicBorne:Me}),(0,A.jsxs)(`div`,{className:`ar-controles`,children:[!j&&xe',
  'onClicBorne:Me,niveauCiterne:i.id===`pompe-niveau`?niveauEau:void 0}),(0,A.jsxs)(`div`,{className:`ar-controles`,children:[!j&&xe',
  'Ut niveauCiterne prop'
);

rep(
  'onPoste:Te?je:void 0})]})]}),(0,A.jsxs)(`div`,{className:`ar-bas`,children:[',
  'onPoste:Te?je:void 0,citerne:i.id===`pompe-niveau`?{niveau:niveauEau,fill:pompeFill,drain:pompeDrain,auto:autoCiterne,flBas:niveauEau>=18,flMoy:niveauEau>=48,flHaut:niveauEau>=78,onNiveau:setNiveauEau,onFill:setPompeFill,onDrain:setPompeDrain,onAuto:setAutoCiterne}:void 0})]})]}),(0,A.jsxs)(`div`,{className:`ar-bas`,children:[',
  'Xt citerne props'
);

fs.writeFileSync(BUNDLE, s);

// --- CSS ---
let css = fs.readFileSync(CSS, 'utf8');
const CSS_CITERNE = `.sc-citerne{pointer-events:none}.sc-citerne-cuve{fill:#1a2332;stroke:#4a6fa5;stroke-width:2px}.sc-citerne-eau{fill:#2196f399;stroke:#42a5f5;stroke-width:1px;transition:height .25s,y .25s}.sc-citerne-titre{fill:#7eb8ff;text-anchor:middle;font-size:10px;font-weight:800;letter-spacing:1px}.sc-citerne-repere{stroke:#5a9fd466;stroke-width:1px;stroke-dasharray:5 4}.sc-citerne-label{fill:#64748b;font-size:7px;font-weight:700}.sc-citerne-niv{fill:#42a5f5;text-anchor:middle;font-size:11px;font-weight:800;font-family:SF Mono,monospace}.citerne-sim{background:var(--fond-2);border:1px solid var(--bordure);border-radius:10px;flex-direction:column;gap:10px;padding:12px;display:flex}.citerne-sim h5{text-transform:uppercase;letter-spacing:.5px;color:var(--texte-2);margin:0;font-size:11px}.citerne-reservoir{background:linear-gradient(#0f172a,#1e293b);border:2px solid #4a6fa5;border-radius:8px 8px 12px 12px;height:180px;position:relative;overflow:hidden}.citerne-eau{background:linear-gradient(#2196f3cc,#1565c0);border-radius:0 0 8px 8px;width:100%;transition:height .25s;position:absolute;bottom:0;left:0}.citerne-flotteurs{pointer-events:none;position:absolute;inset:0}.citerne-fl{color:#64748b;background:#0006;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:800;position:absolute;left:8px;transition:color .2s,background .2s}.citerne-fl.actif{color:#ffd24a;background:#ffd24a33;box-shadow:0 0 8px #ffd24a66}.citerne-niveau-val{color:#42a5f5;font-family:SF Mono,monospace;font-size:18px;font-weight:800;position:absolute;top:8px;right:10px}.citerne-slider{width:100%;accent-color:#42a5f5}.citerne-pompes{justify-content:center;gap:16px;display:flex}.citerne-pompe{color:var(--texte-2);background:#14161b;border:1px solid var(--bordure);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:800}.citerne-pompe.actif{color:var(--accent);border-color:var(--accent);background:#3dcd581f}.citerne-auto{color:var(--texte-2);align-items:center;gap:8px;font-size:11px;display:flex}`;

if (!css.includes('citerne-sim')) {
  css += CSS_CITERNE;
  console.log('OK: css citerne');
}
if (!css.includes('sc-barre-ne')) {
  css = css.replace(
    '.sc-barre-pe{fill:#2f9e44;stroke:#1d6b2e}',
    '.sc-barre-pe{fill:#2f9e4433;stroke:#2f9e44;stroke-width:1.5px}.sc-barre-ne{fill:#2a6fdb33;stroke:#2a6fdb;stroke-width:1.5px}'
  );
  console.log('OK: css sc-barre-ne');
}
fs.writeFileSync(CSS, css);

console.log(`\nDone: ${n} patches.`);
