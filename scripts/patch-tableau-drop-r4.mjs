#!/usr/bin/env node
/**
 * Coffret — dépôt fiable (rangée 4, tactile, dragleave) :
 * - survolRef conservé jusqu'au drop
 * - composant source masqué → slots libres sous le doigt
 * - scroll bloqué pendant le drag
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

rep('var Ut=null,touchDrag=null;', 'var Ut=null,touchDrag=null,survolRef=null;', 'survolRef state');

rep(
  'D=(e=!1)=>{if(e&&!qe.current&&T&&b){let t=ie(),n=T?.kind===`pose`?T.uid:void 0;ae(b.rangee,b.slot,t,n)&&(qe.current=!0,T.kind===`pose`?F(T.uid,b.rangee,b.slot):T.kind===`palette`&&P(b.rangee,b.slot,T.catalogueId))}Wt(),w(!1),E(null),x(null)};',
  'D=(e=!1)=>{if(e&&!qe.current&&T&&survolRef){let t=ie(),n=T?.kind===`pose`?T.uid:void 0;ae(survolRef.rangee,survolRef.slot,t,n)&&(qe.current=!0,T.kind===`pose`?F(T.uid,survolRef.rangee,survolRef.slot):T.kind===`palette`&&P(survolRef.rangee,survolRef.slot,T.catalogueId))}document.documentElement.classList.remove(`drag-tableau-actif`),Wt(),w(!1),E(null),x(null),survolRef=null};',
  'D uses survolRef + unlock scroll'
);

rep(
  't.started=!0,qe.current=!1,w(!0),E(t.kind===`pose`?{kind:`pose`,uid:t.uid}:{kind:`palette`,catalogueId:t.catalogueId})}e.preventDefault();let r=document.elementFromPoint(n.clientX,n.clientY)?.closest?.(`[data-slot-idx]`);r?x({rangee:+r.getAttribute(`data-rangee`),slot:+r.getAttribute(`data-slot-idx`)}):x(null)}',
  't.started=!0,qe.current=!1,document.documentElement.classList.add(`drag-tableau-actif`),w(!0),E(t.kind===`pose`?{kind:`pose`,uid:t.uid}:{kind:`palette`,catalogueId:t.catalogueId})}e.preventDefault();let r=document.elementFromPoint(n.clientX,n.clientY)?.closest?.(`[data-slot-idx]`);if(r){let e=+r.getAttribute(`data-rangee`),t=+r.getAttribute(`data-slot-idx`),i=ie(),a=touchDrag?.kind===`pose`?touchDrag.uid:void 0,o=t;for(let s=Math.max(0,t-i+1);s<=Math.min(t,13-i);s++)if(ae(e,s,i,a)){o=s;break}survolRef={rangee:e,slot:o},x(survolRef)}else survolRef=null,x(null)}',
  'touchmove anchor + survolRef'
);

rep(
  'if(!i||!r?.started)return;e.preventDefault();let a=document.elementFromPoint(i.clientX,i.clientY)?.closest?.(`[data-slot-idx]`);if(a){let e=+a.getAttribute(`data-rangee`),t=+a.getAttribute(`data-slot-idx`),n=ie(),i=r.kind===`pose`?r.uid:void 0;ae(e,t,n,i)&&(qe.current=!0,r.kind===`pose`?F(r.uid,e,t):r.kind===`palette`&&P(e,t,r.catalogueId))}D(!0)}',
  'if(!i||!r?.started)return;e.preventDefault();let a=survolRef;if(a){let e=ie(),t=r.kind===`pose`?r.uid:void 0;ae(a.rangee,a.slot,e,t)&&(qe.current=!0,r.kind===`pose`?F(r.uid,a.rangee,a.slot):r.kind===`palette`&&P(a.rangee,a.slot,r.catalogueId))}D(!0)}',
  'touchend uses survolRef'
);

rep(
  'let c=T?.kind===`pose`&&s?.uid===T.uid;if(s){let e=v(s.catalogueId)',
  'let c=T?.kind===`pose`&&s?.uid===T.uid;if(s&&!c){let e=v(s.catalogueId)',
  'hide source composant during drag'
);

rep(
  'onDragLeave:()=>x(null),onDrop:e=>{e.preventDefault();if(!qe.current){if(T?.kind===`pose`)qe.current=!0,F(T.uid,i,a);else if(T?.kind===`palette`)qe.current=!0,P(i,a,T.catalogueId);else{let t=e.dataTransfer.getData(`text/pose-uid`)||e.dataTransfer.getData(`text/plain`),n=e.dataTransfer.getData(`text/composant-id`)||e.dataTransfer.getData(`text/plain`);t?(qe.current=!0,F(t,i,a)):n&&(qe.current=!0,P(i,a,n))}}D()}',
  'onDrop:e=>{e.preventDefault();if(!qe.current){let t=survolRef?.rangee===i?survolRef.slot:a,n=ie(),r=T?.kind===`pose`?T.uid:void 0;if(ae(i,t,n,r)){qe.current=!0;if(T?.kind===`pose`)F(T.uid,i,t);else if(T?.kind===`palette`)P(i,t,T.catalogueId);else{let o=e.dataTransfer.getData(`text/pose-uid`)||e.dataTransfer.getData(`text/plain`),s=e.dataTransfer.getData(`text/composant-id`)||e.dataTransfer.getData(`text/plain`);o?(qe.current=!0,F(o,i,t)):s&&(qe.current=!0,P(i,t,s))}}}D()}',
  'onDrop anchor + ae check'
);

rep(
  'onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect=T?.kind===`pose`?`move`:`copy`,x({rangee:i,slot:a})}',
  'onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect=T?.kind===`pose`?`move`:`copy`;let t=ie(),n=T?.kind===`pose`?T.uid:void 0,r=a;for(let e=Math.max(0,a-t+1);e<=Math.min(a,13-t);e++)if(ae(i,e,t,n)){r=e;break}survolRef={rangee:i,slot:r},x(survolRef)}',
  'onDragOver anchor + survolRef'
);

rep(
  'onDragStart:e=>{qe.current=!1,Gt(e.currentTarget,e),e.dataTransfer.setData(`text/plain`,s.uid),e.dataTransfer.setData(`text/pose-uid`,s.uid),e.dataTransfer.effectAllowed=`move`,w(!0),E({kind:`pose`,uid:s.uid})}',
  'onDragStart:e=>{qe.current=!1,document.documentElement.classList.add(`drag-tableau-actif`),Gt(e.currentTarget,e),e.dataTransfer.setData(`text/plain`,s.uid),e.dataTransfer.setData(`text/pose-uid`,s.uid),e.dataTransfer.effectAllowed=`move`,w(!0),E({kind:`pose`,uid:s.uid})}',
  'dragstart lock scroll'
);

rep(
  'onDragStart:n=>{n.dataTransfer.setData(`text/plain`,t.id),n.dataTransfer.setData(`text/composant-id`,t.id),n.dataTransfer.effectAllowed=`copy`,GtPal(n,t),e?.(!0,t.id)}',
  'onDragStart:n=>{document.documentElement.classList.add(`drag-tableau-actif`),n.dataTransfer.setData(`text/plain`,t.id),n.dataTransfer.setData(`text/composant-id`,t.id),n.dataTransfer.effectAllowed=`copy`,GtPal(n,t),e?.(!0,t.id)}',
  'palette dragstart lock scroll'
);

fs.writeFileSync(BUNDLE, s);

let css = fs.readFileSync(CSS, 'utf8');
const EXTRA =
  'html.drag-tableau-actif .application--embed .contenu{overflow:hidden!important;touch-action:none}' +
  '.module-tableau.drag-actif .slot.disponible{z-index:2}' +
  '.slot.survol,.slot.survol-invalide{z-index:3}' +
  '.composant-en-deplacement{pointer-events:none!important}' +
  '.module-tableau.vue-coffret .zone-tableau{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:10px}';

if (!css.includes('html.drag-tableau-actif .application--embed .contenu')) {
  css += EXTRA;
  console.log('OK: css drop-r4');
}
fs.writeFileSync(CSS, css);

console.log(`\n${n} patch(s) JS → ${BUNDLE}`);
