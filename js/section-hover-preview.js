/**
 * Aperçu photo des sections :
 * 1) Tuiles .quick-item — photo toujours visible via --peek-img (CSS)
 * 2) Autres [data-preview] — survol / focus (CSS)
 * 3) Bulle fixe géante — desktop fin pointer uniquement (évite le jank tactile)
 *
 * Important : les url() de --peek-img doivent être absolues. Une url relative
 * est résolue contre la feuille CSS (/css/…), pas contre la page → 404.
 */
(function () {
  'use strict';

  var PEEK_ID = 'section-peek';
  var STYLE_ID = 'edz-peek-runtime-css';
  var Z = '2147483646';

  function absUrl(src) {
    if (!src) return '';
    try {
      return new URL(src, document.baseURI).href;
    } catch (err) {
      return src;
    }
  }

  function cssUrl(src) {
    var href = absUrl(src);
    return href ? 'url("' + href.replace(/"/g, '\\"') + '")' : 'none';
  }

  /** Bulle flottante : uniquement souris / trackpad (pas tactile). */
  function peekBubbleAllowed() {
    try {
      if (window.matchMedia('(hover: none)').matches) return false;
      if (window.matchMedia('(pointer: coarse)').matches) return false;
      if (window.matchMedia('(max-width: 768px)').matches) return false;
    } catch (err) { /* ignore */ }
    return true;
  }

  function injectRuntimeCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      /* Tuiles outils : photo permanente + scrim (renforce section-hover.css) */
      '.quick-item[data-preview]::after{' +
        'content:"";position:absolute;inset:0;z-index:0;' +
        'background-image:var(--peek-img);background-size:cover;background-position:center;' +
        'opacity:1!important;pointer-events:none;border-radius:inherit' +
      '}' +
      '.quick-item[data-preview]::before{' +
        'content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;' +
        'background:linear-gradient(to top,rgba(4,8,18,.94) 0%,rgba(4,8,18,.72) 28%,rgba(4,8,18,.28) 52%,rgba(4,8,18,.12) 100%)' +
      '}' +
      '.quick-item[data-preview] .ico-wrap{display:none}' +
      '.quick-item[data-preview] .ico-label{position:relative;z-index:2}' +
      /* Autres cartes (hors YouTube social) : survol uniquement */
      '[data-preview]:not(.quick-item):not(.social-card--yt)::after{' +
        'content:"";position:absolute;inset:0;z-index:6;' +
        'background-image:var(--peek-img);background-size:cover;background-position:center;' +
        'opacity:0;pointer-events:none;border-radius:inherit' +
      '}' +
      '[data-preview]:not(.quick-item):not(.social-card--yt):hover::after,' +
      '[data-preview]:not(.quick-item):not(.social-card--yt).is-peek-active::after{opacity:1!important}' +
      /* YouTube social : vignette permanente */
      '.social-card--yt[data-preview]::before{' +
        'content:"";position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;' +
        'background-image:var(--peek-img);background-size:cover;background-position:center;opacity:1' +
      '}' +
      '.social-card--yt[data-preview]::after{' +
        'content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;' +
        'background:linear-gradient(to top,rgba(4,8,18,.92) 0%,rgba(4,8,18,.55) 45%,rgba(4,8,18,.25) 100%);opacity:1!important' +
      '}' +
      '.social-card--yt[data-preview] .ico-wrap,.social-card--yt[data-preview] strong,.social-card--yt[data-preview] span{position:relative;z-index:2}' +
      'html>.section-peek,#' + PEEK_ID + '{' +
        'position:fixed!important;z-index:' + Z + '!important;' +
        'pointer-events:none!important;transform:none!important;filter:none!important;' +
        'margin:0!important;' +
        'width:min(480px,calc(100vw - 24px))!important;' +
        'max-height:calc(100vh - 24px)!important' +
      '}' +
      '#' + PEEK_ID + '.is-visible{display:block!important;opacity:1!important;visibility:visible!important}';
    (document.head || document.documentElement).appendChild(s);
  }

  function ensurePeek() {
    var peek = document.getElementById(PEEK_ID);
    if (!peek) {
      peek = document.createElement('div');
      peek.id = PEEK_ID;
      peek.className = 'section-peek';
      peek.setAttribute('aria-hidden', 'true');
      peek.innerHTML =
        '<div class="section-peek__frame">' +
        '<img id="section-peek-img" src="" alt=""/>' +
        '<span class="section-peek__label" id="section-peek-label"></span>' +
        '</div>';
    }
    if (peek.parentNode !== document.documentElement) {
      document.documentElement.appendChild(peek);
    }
    peek.style.setProperty('position', 'fixed', 'important');
    peek.style.setProperty('z-index', Z, 'important');
    peek.style.setProperty('pointer-events', 'none', 'important');
    peek.style.setProperty('transform', 'none', 'important');
    peek.style.setProperty('filter', 'none', 'important');
    /* Ne pas utiliser le shorthand inset: il efface left/top déjà positionnés. */
    peek.style.setProperty('right', 'auto', 'important');
    peek.style.setProperty('bottom', 'auto', 'important');
    if (!peek.classList.contains('is-visible')) {
      peek.style.setProperty('display', 'none', 'important');
    }
    return peek;
  }

  function paintVars() {
    var nodes = document.querySelectorAll('[data-preview]');
    var i;
    var src;
    var href;
    for (i = 0; i < nodes.length; i++) {
      src = nodes[i].getAttribute('data-preview');
      if (!src) continue;
      href = absUrl(src);
      nodes[i].style.setProperty('--peek-img', cssUrl(href));
      if (!nodes[i].__edzPeekPre) {
        nodes[i].__edzPeekPre = true;
        (new Image()).src = href;
      }
    }
    return nodes.length;
  }

  function labelFor(item) {
    var el = item.querySelector('.ico-label, strong');
    if (el) return el.textContent.trim();
    return (item.getAttribute('aria-label') || item.getAttribute('data-label') || '').trim();
  }

  function itemFrom(node) {
    if (!node) return null;
    if (node.nodeType === 3) node = node.parentElement;
    if (!node || !node.closest) return null;
    return node.closest('[data-preview]');
  }

  function boot() {
    injectRuntimeCss();
    var peek = ensurePeek();
    var peekImg = document.getElementById('section-peek-img');
    var peekLabel = document.getElementById('section-peek-label');
    if (!peekImg || !peekLabel) return;

    paintVars();

    if (window.__EDZ_PEEK_LISTENERS__) return;
    window.__EDZ_PEEK_LISTENERS__ = true;

    var activeItem = null;

    function positionAt(anchor) {
      var pw = peek.offsetWidth || 480;
      var ph = peek.offsetHeight || 340;
      var margin = 12;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var rect = anchor.getBoundingClientRect();
      var left = rect.right + 16;
      var top = Math.max(margin, rect.top);

      if (left + pw > vw - margin) left = rect.left - pw - 16;
      if (left < margin) {
        left = Math.max(margin, (vw - pw) / 2);
        top = rect.bottom + 16;
        if (top + ph > vh - margin) top = rect.top - ph - 16;
      }
      if (left < margin) left = margin;
      if (top < margin) top = margin;
      if (left + pw > vw - margin) left = Math.max(margin, vw - pw - margin);
      if (top + ph > vh - margin) top = Math.max(margin, vh - ph - margin);

      peek.style.setProperty('left', Math.round(left) + 'px', 'important');
      peek.style.setProperty('top', Math.round(top) + 'px', 'important');
      peek.style.setProperty('right', 'auto', 'important');
      peek.style.setProperty('bottom', 'auto', 'important');
    }

    function showPeek(item) {
      if (!peekBubbleAllowed()) return;
      /* Sur les tuiles outils la photo est déjà visible — bulle inutile / redondante */
      if (item.classList && item.classList.contains('quick-item')) return;
      var src = item.getAttribute('data-preview');
      if (!src) return;
      var href = absUrl(src);
      if (activeItem && activeItem !== item) {
        activeItem.classList.remove('is-peek-active');
      }
      activeItem = item;
      item.classList.add('is-peek-active');
      var label = labelFor(item);
      peekLabel.textContent = label;
      peekImg.alt = label;
      if (peekImg.getAttribute('src') !== href) {
        peekImg.onload = function () {
          if (activeItem === item) positionAt(item);
        };
        peekImg.src = href;
      }
      peek.classList.add('is-visible');
      peek.setAttribute('aria-hidden', 'false');
      peek.style.setProperty('display', 'block', 'important');
      peek.style.setProperty('opacity', '1', 'important');
      peek.style.setProperty('visibility', 'visible', 'important');
      positionAt(item);
    }

    function hidePeek() {
      if (activeItem) activeItem.classList.remove('is-peek-active');
      activeItem = null;
      peek.classList.remove('is-visible');
      peek.setAttribute('aria-hidden', 'true');
      peek.style.setProperty('display', 'none', 'important');
    }

    function onOver(e) {
      if (!peekBubbleAllowed()) return;
      var item = itemFrom(e.target);
      if (!item) return;
      if (e.pointerType === 'touch') return;
      showPeek(item);
    }

    function onOut(e) {
      var from = itemFrom(e.target);
      var to = itemFrom(e.relatedTarget);
      if (from && from !== to) hidePeek();
    }

    document.addEventListener('pointerover', onOver, true);
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('pointerout', onOut, true);
    document.addEventListener('mouseout', onOut, true);

    /* Plus de long-press tactile : photo déjà sur la tuile, évite jank / faux clics */

    window.addEventListener(
      'resize',
      function () {
        if (!peekBubbleAllowed()) {
          hidePeek();
          return;
        }
        if (activeItem) positionAt(activeItem);
      },
      { passive: true }
    );

    window.__EDZ_PEEK__ = { show: showPeek, hide: hidePeek, boot: boot };

    try {
      var want = new URLSearchParams(window.location.search).get('peek');
      if (want && peekBubbleAllowed()) {
        var target =
          document.querySelector('[data-preview*="' + want + '"]') ||
          document.querySelector('[data-preview]');
        if (target) showPeek(target);
      }
    } catch (err) { /* ignore */ }
  }

  function start() {
    boot();
    /* Néon / i18n / nav peuvent muter le DOM après coup. */
    window.setTimeout(boot, 200);
    window.setTimeout(boot, 800);
    window.setTimeout(paintVars, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
