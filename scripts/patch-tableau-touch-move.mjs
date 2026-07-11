#!/usr/bin/env node
/**
 * Mobile / tablette — déplacer les composants posés au doigt (HTML5 drag désactivé sur tactile).
 */
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

rep('var Ut=null;', 'var Ut=null,touchDrag=null;', 'module touchDrag state');

// Remplacer l'ancien touchend Android (ne démarre jamais sans touchmove) par glisser tactile complet.
// Listeners toujours montés (pas de garde `o`) : iPadOS « site bureau » ne matche pas coarse.
// preventDefault dès le 1er touchmove pour empêcher Safari de verrouiller le scroll.
rep(
  '(0,l.useEffect)(()=>{if(!S)return;let t=e=>{let t=e.changedTouches?.[0];if(!t||qe.current||!T)return;let n=document.elementFromPoint(t.clientX,t.clientY)?.closest?.(`[data-slot-idx]`);if(n){let r=+n.getAttribute(`data-rangee`),i=+n.getAttribute(`data-slot-idx`),a=ie(),o=T?.kind===`pose`?T.uid:void 0;ae(r,i,a,o)&&(qe.current=!0,T.kind===`pose`?F(T.uid,r,i):T.kind===`palette`&&P(r,i,T.catalogueId))}D(!0)};return window.addEventListener(`touchend`,t,{capture:!0,passive:!1}),()=>window.removeEventListener(`touchend`,t,{capture:!0})},[S,T]),',
  '(0,l.useEffect)(()=>{let t=e=>{let t=touchDrag;if(!t)return;let n=e.touches[0];if(!n)return;e.preventDefault();if(!t.started){if(Math.hypot(n.clientX-t.x0,n.clientY-t.y0)<8)return;t.started=!0,qe.current=!1,w(!0),E(t.kind===`pose`?{kind:`pose`,uid:t.uid}:{kind:`palette`,catalogueId:t.catalogueId})}let r=document.elementFromPoint(n.clientX,n.clientY)?.closest?.(`[data-slot-idx]`);r?x({rangee:+r.getAttribute(`data-rangee`),slot:+r.getAttribute(`data-slot-idx`)}):x(null)},n=e=>{let r=touchDrag,i=e.changedTouches[0];if(touchDrag=null,r&&!r.started){r.kind===`pose`&&O(r.uid);return}if(!i||!r?.started)return;e.preventDefault();let a=document.elementFromPoint(i.clientX,i.clientY)?.closest?.(`[data-slot-idx]`);if(a){let e=+a.getAttribute(`data-rangee`),t=+a.getAttribute(`data-slot-idx`),n=ie(),i=r.kind===`pose`?r.uid:void 0;ae(e,t,n,i)&&(qe.current=!0,r.kind===`pose`?F(r.uid,e,t):r.kind===`palette`&&P(e,t,r.catalogueId))}D(!0)};return window.addEventListener(`touchmove`,t,{capture:!0,passive:!1}),window.addEventListener(`touchend`,n,{capture:!0,passive:!1}),window.addEventListener(`touchcancel`,n,{capture:!0,passive:!1}),()=>{window.removeEventListener(`touchmove`,t,{capture:!0}),window.removeEventListener(`touchend`,n,{capture:!0}),window.removeEventListener(`touchcancel`,n,{capture:!0})}},[]),',
  'touchmove + touchend tactile (déplacement composants)'
);

rep(
  'onTouchEnd:e=>{S||e.target.closest(`.composant-suppr`)||O(s.uid)},onDragStart:e=>{qe.current=!1,Gt(e.currentTarget,e)',
  'onTouchStart:e=>{if(e.target.closest(`.composant-suppr`))return;let t=e.touches[0];if(!t)return;touchDrag={kind:`pose`,uid:s.uid,x0:t.clientX,y0:t.clientY,started:!1};e.touches.length===1&&e.preventDefault()},onDragStart:e=>{qe.current=!1,Gt(e.currentTarget,e)',
  'composant onTouchStart drag'
);

rep(
  'className:`palette-item`,draggable:!0,onDragStart:n=>{n.dataTransfer.setData(`text/plain`,t.id)',
  'className:`palette-item`,draggable:!0,onTouchStart:n=>{let e=n.touches[0];if(!e)return;touchDrag={kind:`palette`,catalogueId:t.id,x0:e.clientX,y0:e.clientY,started:!1};n.touches.length===1&&n.preventDefault()},onDragStart:n=>{n.dataTransfer.setData(`text/plain`,t.id)',
  'palette onTouchStart drag'
);

fs.writeFileSync(BUNDLE, s);

let css = fs.readFileSync(CSS, 'utf8');
if (!css.includes('.palette-item{touch-action:none}')) {
  css += '.composant.deplacable,.palette-item{touch-action:none}';
  console.log('OK: css touch-action composants');
}
if (!css.includes('.module-tableau.drag-actif .zone-tableau')) {
  css += '.module-tableau.drag-actif .zone-tableau,.module-tableau.drag-actif .palette-corps{-webkit-overflow-scrolling:auto}';
  console.log('OK: css drag-actif scroll');
}
fs.writeFileSync(CSS, css);

console.log(`\n${n} patch(s) JS → ${BUNDLE}`);
