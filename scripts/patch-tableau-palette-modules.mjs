#!/usr/bin/env node
/**
 * Tableau — bibliothèque toujours visible (bas du coffret) + aperçu drag 1/2 modules.
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

// --- Aperçu drag depuis la palette (largeur = modules × rail DIN) ---
rep(
  'function Gt(e,t){Wt();let n=e.getBoundingClientRect(),r=e.cloneNode(!0);',
  'function GtPal(e,t){Wt();let n=Math.max(t.modules,1),r=n*Mt-6,i=104,a=document.createElement(`div`);a.className=`composant deplacable type-${t.type} composant-apercu-drag ${t.marque===`SwissDz`?`swissdz`:``}`,Object.assign(a.style,{position:`fixed`,left:`-9999px`,top:`0`,width:`${r}px`,height:`${i}px`,margin:`0`,pointerEvents:`none`,display:`flex`,flexDirection:`column`,justifyContent:`space-between`,alignItems:`center`,padding:`4px 2px`,boxSizing:`border-box`,...g(t)??{}}),document.body.appendChild(a),a.offsetWidth,Ut=a,e.dataTransfer.setDragImage(a,r/2,i/2)}function Gt(e,t){Wt();let n=e.getBoundingClientRect(),r=e.cloneNode(!0);',
  'GtPal drag image catalogue'
);

rep(
  'onDragStart:n=>{n.dataTransfer.setData(`text/composant-id`,t.id),n.dataTransfer.effectAllowed=`copy`,e?.(!0,t.id)}',
  'onDragStart:n=>{n.dataTransfer.setData(`text/composant-id`,t.id),n.dataTransfer.effectAllowed=`copy`,GtPal(n,t),e?.(!0,t.id)}',
  'palette onDragStart GtPal'
);

// --- Bibliothèque toujours ouverte (sans bouton bascule) ---
rep(
  'function je({onDragStateChange:e,masquee:t}){let[n,r]=(0,l.useState)(!1),[i,a]=(0,l.useState)(!1);',
  'function je({onDragStateChange:e,masquee:t}){let[n,r]=(0,l.useState)(!1);',
  'je remove toggle state'
);

rep(
  '},[]),(0,l.useEffect)(()=>{t&&a(!1)},[t]);let o=(0,C.jsxs)',
  '},[]);let o=(0,C.jsxs)',
  'je remove masquee close effect'
);

rep(
  'return t&&n?null:(0,C.jsx)(`aside`,{className:`palette${n?` palette--compacte`:``}${i?` palette--ouverte`:``}`,children:n?(0,C.jsxs)(C.Fragment,{children:[(0,C.jsxs)(`button`,{type:`button`,className:`palette-bascule`,"aria-expanded":i,onClick:()=>a(e=>!e),children:[(0,C.jsx)(`span`,{children:`Bibliothèque de composants`}),(0,C.jsx)(`span`,{className:`palette-bascule-ico`,"aria-hidden":!0,children:i?`▲`:`▼`})]}),i&&(0,C.jsx)(`div`,{className:`palette-corps`,children:o})]}):(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(`h2`,{children:`Bibliothèque de composants`}),o]})})}',
  'return t&&n?null:(0,C.jsx)(`aside`,{className:`palette${n?` palette--compacte palette--ouverte`:``}`,children:(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(`h2`,{children:`Bibliothèque de composants`}),(0,C.jsx)(`div`,{className:`palette-corps`,children:o})]})})}',
  'je always show palette body'
);

// --- Ne plus masquer la palette en mode embed / sélection ---
rep(
  'className:`module-tableau vue-${i}${y&&n?` selection-active`:``}`,children:[(0,C.jsx)(je,{masquee:y&&!!n,onDragStateChange:',
  'className:`module-tableau vue-${i}`,children:[(0,C.jsx)(je,{masquee:!1,onDragStateChange:',
  'palette always visible in tableau'
);

// --- Survol multi-modules sur le rail ---
rep(
  'let l=ie(),u=S&&ae(i,a,l,oe),d=S&&b?.rangee===i&&b?.slot===a&&!u;return(0,C.jsx)(`div`,{className:`slot ${S?`disponible`:``} ${b?.rangee===i&&b?.slot===a?d?`survol-invalide`:`survol`:``}',
  'let l=ie(),u=S&&ae(i,a,l,oe),q=S&&b?.rangee===i&&a>=b.slot&&a<b.slot+l,d=q&&!u;return(0,C.jsx)(`div`,{className:`slot ${S?`disponible`:``} ${q?d?`survol-invalide`:`survol`:``}',
  'multi-slot hover highlight'
);

rep(
  '(0,C.jsxs)(`div`,{className:`rangee`,children:[(0,C.jsx)(`div`,{className:`rail-din`}),Array.from({length:13}',
  '(0,C.jsxs)(`div`,{className:`rangee`,children:[(0,C.jsx)(`div`,{className:`rail-din`}),S&&b?.rangee===i&&(()=>{let Z=ie(),$t=b.slot,q=ae(i,$t,Z,oe),J=Z*Mt-6,Y=T?.kind===`palette`?v(T.catalogueId):T?.kind===`pose`&&T.uid?(pe=>pe?v(pe.catalogueId):null)((()=>{for(let _s=0;_s<13;_s++){let _p=N(i,_s);if(_p?.uid===T.uid)return _p}return null})()):null;return(0,C.jsx)(`div`,{className:`drop-apercu ${q?``: `invalide`}`,style:{left:`${8+$t*58}px`,width:`${J}px`,...Y?g(Y)??{}:{}}})})(),Array.from({length:13}',
  'drop-apercu ghost on rail'
);

fs.writeFileSync(BUNDLE, s);

// --- CSS ---
let css = fs.readFileSync(CSS, 'utf8');

if (css.includes('.module-tableau.selection-active .palette{display:none!important}')) {
  css = css.replace(
    '.module-tableau.selection-active .palette{display:none!important}',
    '.module-tableau.selection-active .palette{display:block!important}'
  );
  console.log('OK: css palette not hidden on selection');
}

if (css.includes('.zone-tableau{order:1;width:100%}.palette{flex-shrink:0;order:0;width:100%}')) {
  css = css.replace(
    '.zone-tableau{order:1;width:100%}.palette{flex-shrink:0;order:0;width:100%}',
    '.zone-tableau{order:1;width:100%}.palette{flex-shrink:0;order:2;width:100%}'
  );
  console.log('OK: css palette below coffret');
}

const DROP_CSS =
  '.drop-apercu{pointer-events:none;z-index:2;color:#222;box-sizing:border-box;background:linear-gradient(#f2f2ee,#d8d8d2);border:2px dashed var(--accent);border-radius:4px;flex-direction:column;justify-content:space-between;align-items:center;height:104px;padding:4px 2px;display:flex;position:absolute;top:16px;opacity:.92}.drop-apercu.invalide{border-color:#e4002b;background:#e4002b1a}';

if (!css.includes('.drop-apercu{')) {
  css += DROP_CSS;
  console.log('OK: css drop-apercu');
}

const COMPACT_PALETTE_CSS =
  '.palette--compacte{flex-shrink:0;max-height:none;padding:6px 8px;overflow:visible}.palette--compacte .palette-bascule{display:none!important}.palette--compacte .bandeau-marque{display:none}.palette--compacte h2{margin:0 0 4px;font-size:11px;font-weight:700}.palette--compacte h3{text-transform:uppercase;letter-spacing:.3px;color:var(--texte-2);margin:2px 0 3px;font-size:9px}.palette--compacte section{margin-bottom:2px}.palette--compacte .palette-corps{-webkit-overflow-scrolling:touch;overscroll-behavior:contain;max-height:min(24dvh,170px);margin-top:0;overflow:hidden auto}.palette--compacte .palette-grille{-webkit-overflow-scrolling:touch;scrollbar-width:thin;flex-flow:row nowrap;gap:6px;padding-bottom:4px;overflow-x:auto;overflow-y:hidden}.palette--compacte .palette-item{flex:none;grid-template-columns:22px 1fr;grid-template-areas:"pastille libelle""pastille ref";min-width:68px;max-width:88px;padding:4px 6px}.palette--compacte .palette-vignette{width:22px;height:30px}.palette--compacte .palette-libelle{white-space:nowrap;text-overflow:ellipsis;font-size:10px;overflow:hidden}.palette--compacte .palette-ref{white-space:nowrap;text-overflow:ellipsis;font-size:8px;overflow:hidden}.module-tableau.vue-coffret .zone-tableau{flex:1 1 auto;min-height:min(46dvh,400px);width:100%}.module-tableau.vue-coffret .palette--compacte{flex:0 0 auto}';

if (!css.includes('.palette--compacte .palette-grille{-webkit-overflow-scrolling:touch;scrollbar-width:thin;flex-flow:row nowrap')) {
  css += COMPACT_PALETTE_CSS;
  console.log('OK: css palette compacte miniatures horizontales (iPad)');
}

fs.writeFileSync(CSS, css);

console.log(`\nDone: ${n} JS patches.`);
