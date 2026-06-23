#!/usr/bin/env node
/**
 * Android — le drop HTML5 échoue souvent (dataTransfer vide) ; repli état React + touchend.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE = path.join(__dirname, '../simulation-swissdz/assets/index-BiX2UYYQ.js');
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

// --- Ref anti-double + D() avec repli dragend ---
rep(
  'h=(0,l.useRef)(null),_=(0,l.useRef)(0),y=d||c',
  'h=(0,l.useRef)(null),_=(0,l.useRef)(0),qe=(0,l.useRef)(!1),y=d||c',
  'dropCommitted ref'
);

rep(
  'D=()=>{Wt(),w(!1),E(null),x(null)};',
  'D=(e=!1)=>{if(e&&!qe.current&&T&&b){let t=ie(),n=T?.kind===`pose`?T.uid:void 0;ae(b.rangee,b.slot,t,n)&&(qe.current=!0,T.kind===`pose`?F(T.uid,b.rangee,b.slot):T.kind===`palette`&&P(b.rangee,b.slot,T.catalogueId))}Wt(),w(!1),E(null),x(null)};',
  'D with dragend fallback'
);

// --- Touchend Android : cible réelle sous le doigt ---
rep(
  '},[]),(0,l.useEffect)(()=>{y||!n||!h.current||h.current.scrollIntoView',
  '},[]),(0,l.useEffect)(()=>{if(!S)return;let t=e=>{let t=e.changedTouches?.[0];if(!t||qe.current||!T)return;let n=document.elementFromPoint(t.clientX,t.clientY)?.closest?.(`[data-slot-idx]`);if(n){let r=+n.getAttribute(`data-rangee`),i=+n.getAttribute(`data-slot-idx`),a=ie(),o=T?.kind===`pose`?T.uid:void 0;ae(r,i,a,o)&&(qe.current=!0,T.kind===`pose`?F(T.uid,r,i):T.kind===`palette`&&P(r,i,T.catalogueId))}D(!0)};return window.addEventListener(`touchend`,t,{capture:!0,passive:!1}),()=>window.removeEventListener(`touchend`,t,{capture:!0})},[S,T]),(0,l.useEffect)(()=>{if(S)document.body.style.touchAction=`none`;else document.body.style.removeProperty(`touch-action`);return()=>document.body.style.removeProperty(`touch-action`)},[S]),(0,l.useEffect)(()=>{y||!n||!h.current||h.current.scrollIntoView',
  'touchend drop fallback + touch-action'
);

// --- Drop : état React en priorité (pas dataTransfer) ---
rep(
  'onDrop:e=>{e.preventDefault();let t=e.dataTransfer.getData(`text/pose-uid`),n=e.dataTransfer.getData(`text/composant-id`);D(),t?F(t,i,a):n&&P(i,a,n)}',
  'onDrop:e=>{e.preventDefault();if(!qe.current){if(T?.kind===`pose`)qe.current=!0,F(T.uid,i,a);else if(T?.kind===`palette`)qe.current=!0,P(i,a,T.catalogueId);else{let t=e.dataTransfer.getData(`text/pose-uid`)||e.dataTransfer.getData(`text/plain`),n=e.dataTransfer.getData(`text/composant-id`)||e.dataTransfer.getData(`text/plain`);t?(qe.current=!0,F(t,i,a)):n&&(qe.current=!0,P(i,a,n))}}D()}',
  'onDrop use React state T'
);

// --- dragenter requis sur Chrome Android ---
rep(
  'onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect=T?.kind===`pose`?`move`:`copy`,x({rangee:i,slot:a})}',
  'onDragEnter:e=>{e.preventDefault(),x({rangee:i,slot:a})},onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect=T?.kind===`pose`?`move`:`copy`,x({rangee:i,slot:a})}',
  'onDragEnter on slots'
);

// --- data-slot sur les emplacements ---
rep(
  'return(0,C.jsx)(`div`,{className:`slot ${S?`disponible`:``} ${q?d?`survol-invalide`:`survol`:``}`,onDragEnter:',
  'return(0,C.jsx)(`div`,{"data-rangee":i,"data-slot-idx":a,className:`slot ${S?`disponible`:``} ${q?d?`survol-invalide`:`survol`:``}`,onDragEnter:',
  'data attributes on slots'
);

// --- dragend composant : repli si drop absent ---
rep(
  'onDragEnd:D,title:`${m(e)} — ${e.reference} · Glisser pour déplacer',
  'onDragEnd:()=>D(!0),title:`${m(e)} — ${e.reference} · Glisser pour déplacer',
  'composant onDragEnd fallback'
);

// --- palette : dragend + text/plain pour Android ---
rep(
  'onDragStateChange:(e,t)=>{w(e),E(e&&t?{kind:`palette`,catalogueId:t}:null),e||x(null)}',
  'onDragStateChange:(e,t)=>{if(e)qe.current=!1,w(!0),E({kind:`palette`,catalogueId:t});else D(!0)}',
  'palette dragend fallback via D'
);

rep(
  'onDragStart:n=>{n.dataTransfer.setData(`text/composant-id`,t.id),n.dataTransfer.effectAllowed=`copy`,GtPal(n,t),e?.(!0,t.id)}',
  'onDragStart:n=>{n.dataTransfer.setData(`text/plain`,t.id),n.dataTransfer.setData(`text/composant-id`,t.id),n.dataTransfer.effectAllowed=`copy`,GtPal(n,t),e?.(!0,t.id)}',
  'palette text/plain setData'
);

rep(
  'onDragStart:e=>{Gt(e.currentTarget,e),e.dataTransfer.setData(`text/pose-uid`,s.uid),e.dataTransfer.effectAllowed=`move`,w(!0),E({kind:`pose`,uid:s.uid})}',
  'onDragStart:e=>{qe.current=!1,Gt(e.currentTarget,e),e.dataTransfer.setData(`text/plain`,s.uid),e.dataTransfer.setData(`text/pose-uid`,s.uid),e.dataTransfer.effectAllowed=`move`,w(!0),E({kind:`pose`,uid:s.uid})}',
  'composant text/plain setData'
);

rep(
  'className:`module-tableau vue-${i}`,children:[(0,C.jsx)(je,{masquee:!1,onDragStateChange:',
  'className:`module-tableau vue-${i}${S?` drag-actif`:``}`,children:[(0,C.jsx)(je,{masquee:!1,onDragStateChange:',
  'drag-actif class during drag'
);

fs.writeFileSync(BUNDLE, s);

let css = fs.readFileSync(CSS, 'utf8');
if (!css.includes('.slot.disponible{touch-action:none}')) {
  css += '.slot.disponible{touch-action:none}.module-tableau.drag-actif .palette-corps,.module-tableau.drag-actif .zone-tableau{-webkit-overflow-scrolling:auto}';
  console.log('OK: css touch-action slots');
}
fs.writeFileSync(CSS, css);

console.log(`\nDone: ${n} JS patches.`);
