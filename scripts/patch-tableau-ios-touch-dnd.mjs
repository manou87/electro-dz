#!/usr/bin/env node
/**
 * iPhone / iPad — zones de dépôt absentes au glisser-déposer tactile.
 *
 * Causes :
 * 1) Listeners touchmove/touchend montés seulement si media `(hover: none) and
 *    (pointer: coarse)` — souvent faux sur iPadOS (site bureau).
 * 2) preventDefault trop tard (après 12px) → Safari verrouille le scroll et
 *    le geste de drag ne démarre jamais.
 * 3) Palette en draggable=true → conflit avec le geste tactile iOS.
 *
 * Correctifs : listeners toujours actifs, preventDefault immédiat, palette
 * alignée sur les composants (draggable:!o), affordance visuelle des slots.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BUNDLE, BUNDLE_NAME } from './resolve-sim-bundle.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACTIVE = path.join(__dirname, '../simulation-swissdz/assets/index-BiX2UYYQ.js');
const CSS = path.join(__dirname, '../simulation-swissdz/assets/index-NkCKKsuf.css');

const targets = [...new Set([ACTIVE, BUNDLE])];

function patchJs(file) {
  let s = fs.readFileSync(file, 'utf8');
  let n = 0;

  function rep(old, neu, label) {
    if (!s.includes(old)) {
      console.warn('SKIP:', label, '@', path.basename(file));
      return false;
    }
    s = s.replace(old, neu);
    n++;
    console.log('OK:', label, '@', path.basename(file));
    return true;
  }

  // 1) Toujours écouter le tactile + preventDefault dès le 1er touchmove
  rep(
    '(0,l.useEffect)(()=>{if(!o)return;let t=e=>{let t=touchDrag;if(!t)return;let n=e.touches[0];if(!n)return;if(!t.started){if(Math.hypot(n.clientX-t.x0,n.clientY-t.y0)<12)return;t.started=!0,qe.current=!1,document.documentElement.classList.add(`drag-tableau-actif`),w(!0),E(t.kind===`pose`?{kind:`pose`,uid:t.uid}:{kind:`palette`,catalogueId:t.catalogueId})}e.preventDefault();let r=document.elementFromPoint(n.clientX,n.clientY)?.closest?.(`[data-slot-idx]`);',
    '(0,l.useEffect)(()=>{let t=e=>{let t=touchDrag;if(!t)return;let n=e.touches[0];if(!n)return;e.preventDefault();if(!t.started){if(Math.hypot(n.clientX-t.x0,n.clientY-t.y0)<8)return;t.started=!0,qe.current=!1,document.documentElement.classList.add(`drag-tableau-actif`),w(!0),E(t.kind===`pose`?{kind:`pose`,uid:t.uid}:{kind:`palette`,catalogueId:t.catalogueId})}let r=document.elementFromPoint(n.clientX,n.clientY)?.closest?.(`[data-slot-idx]`);',
    'touchmove always on + early preventDefault'
  );

  rep(
    '}},[o]),(0,l.useEffect)(()=>{if(S)document.body.style.touchAction=`none`',
    '}},[]),(0,l.useEffect)(()=>{if(S)document.body.style.touchAction=`none`',
    'touch effect deps []'
  );

  // 2) Palette : preventDefault au touchstart pour annuler le DnD HTML5 iOS.
  //    Ne pas utiliser draggable:!n — n est shadowé (tableau filtré) dans le .map.
  rep(
    'className:`palette-item`,draggable:!0,onTouchStart:n=>{let e=n.touches[0];e&&(touchDrag={kind:`palette`,catalogueId:t.id,x0:e.clientX,y0:e.clientY,started:!1})},onDragStart:',
    'className:`palette-item`,draggable:!0,onTouchStart:n=>{let e=n.touches[0];if(!e)return;touchDrag={kind:`palette`,catalogueId:t.id,x0:e.clientX,y0:e.clientY,started:!1};n.touches.length===1&&n.preventDefault()},onDragStart:',
    'palette touchstart preventDefault'
  );

  // 3) Composants posés : bloquer scroll/callout iOS dès le contact
  rep(
    'onTouchStart:e=>{if(e.target.closest(`.composant-suppr`))return;let t=e.touches[0];t&&(touchDrag={kind:`pose`,uid:s.uid,x0:t.clientX,y0:t.clientY,started:!1})},onDragStart:',
    'onTouchStart:e=>{if(e.target.closest(`.composant-suppr`))return;let t=e.touches[0];if(!t)return;touchDrag={kind:`pose`,uid:s.uid,x0:t.clientX,y0:t.clientY,started:!1};e.touches.length===1&&e.preventDefault()},onDragStart:',
    'composant touchstart preventDefault'
  );

  // 4) iPad « site bureau » : o reste souvent false → draggable HTML5 actif.
  //    Forcer le path tactile si maxTouchPoints, sans casser la souris :
  //    on désactive le drag HTML5 seulement pendant un geste touch (via preventDefault).
  //    En plus, si coarse OU maxTouchPoints≥1 sans hover hover, o=true pour layout compact.
  rep(
    'let e=window.matchMedia(`(hover: none) and (pointer: coarse)`),t=window.matchMedia(`(max-width: 1024px), (hover: none) and (pointer: coarse)`),n=()=>{s(e.matches),u(t.matches)};return n(),e.addEventListener(`change`,n),t.addEventListener(`change`,n),()=>{e.removeEventListener(`change`,n),t.removeEventListener(`change`,n)}},[]),',
    'let e=window.matchMedia(`(hover: none) and (pointer: coarse)`),t=window.matchMedia(`(max-width: 1024px), (hover: none) and (pointer: coarse)`),n=()=>{let r=(navigator.maxTouchPoints||0)>0,i=window.matchMedia(`(hover: hover)`).matches;s(e.matches||r&&!i),u(t.matches||r)};return n(),e.addEventListener(`change`,n),t.addEventListener(`change`,n),()=>{e.removeEventListener(`change`,n),t.removeEventListener(`change`,n)}},[]),',
    'o if touch without hover (iPad phone-like)'
  );

  fs.writeFileSync(file, s);
  return n;
}

let total = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.warn('Missing', file);
    continue;
  }
  console.log('\n—', path.basename(file), file === ACTIVE ? '(actif index.html)' : `(resolve: ${BUNDLE_NAME})`);
  total += patchJs(file);
}

let css = fs.readFileSync(CSS, 'utf8');
const cssExtra =
  '.palette-item,.composant.deplacable{-webkit-user-drag:none;-webkit-touch-callout:none}' +
  '.module-tableau.drag-actif .slot.disponible{outline:2px dashed #3dcd58;outline-offset:-2px;background:#3dcd5822}' +
  'html.drag-tableau-actif,html.drag-tableau-actif body{touch-action:none;overscroll-behavior:none}';

if (!css.includes('-webkit-user-drag:none')) {
  css += cssExtra;
  fs.writeFileSync(CSS, css);
  console.log('\nOK: css iOS drag affordance');
} else {
  console.log('\nALREADY: css iOS drag affordance');
}

console.log(`\nDone: ${total} JS patch(es).`);
