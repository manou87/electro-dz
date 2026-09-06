/**
 * Aperçu photo des sections :
 * 1) Tuiles .quick-item — photo toujours visible via --peek-img (CSS)
 * 2) Autres [data-preview] — survol / focus (CSS)
 * 3) Bulle fixe géante — desktop fin pointer uniquement (évite le jank tactile)
 *
 * Perf mobile : WebP légers + IntersectionObserver (pas de préchargement
 * de toutes les PNG 2 Mo). Les url() de --peek-img doivent être absolues.
 */
(function () {
  'use strict';

  var PEEK_ID = 'section-peek';
  var STYLE_ID = 'edz-peek-runtime-css';
  var Z = '2147483646';
  var lazyObserver = null;

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
        'opacity:0;transition:opacity .18s ease;pointer-events:none;border-radius:inherit' +
      '}' +
      '.quick-item[data-preview].is-peek-loaded::after{opacity:1!important}' +
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
      '#' + PEEK_ID + '.is-visible{display:block!important;opacity:1!important;visibility:visible!important}' +
      '.section-peek__promo{' +
        'display:block;padding:7px 10px;font-size:.62rem;font-weight:800;line-height:1.25;' +
        'text-align:center;color:#1e1033;background:linear-gradient(90deg,#c084fc,#a78bfa);' +
        'border-top:1px solid rgba(255,255,255,.12)' +
      '}' +
      '.section-peek__promo[hidden]{display:none!important}' +
      'html[data-oibt-free] .quick-item--oibt{position:relative}' +
      'html[data-oibt-free] .quick-item--oibt .edz-free-badge{' +
        'position:absolute;left:6px;right:6px;top:6px;z-index:3;' +
        'padding:4px 6px;border-radius:7px;font-size:.55rem;font-weight:800;line-height:1.2;' +
        'text-align:center;color:#1e1033;background:rgba(167,139,250,.92);' +
        'box-shadow:0 2px 10px rgba(0,0,0,.35);pointer-events:none' +
      '}';
    (document.head || document.documentElement).appendChild(s);
  }

  function oibtFreeUntilIso() {
    return (window.ElectroDzSite && window.ElectroDzSite.oibtFreeUntil) || '2026-09-16';
  }

  function isOibtFreeAccess() {
    var until = oibtFreeUntilIso();
    var end = new Date(until + 'T23:59:59');
    if (isNaN(end.getTime())) return false;
    return Date.now() <= end.getTime();
  }

  function freePromoText(short) {
    if (!isOibtFreeAccess()) return '';
    var until = oibtFreeUntilIso();
    var parts = String(until).split('-');
    var date = parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : until;
    var lang = 'fr';
    try {
      var s = localStorage.getItem('electrodz-site-lang');
      if (s === 'ar' || s === 'en' || s === 'fr') lang = s;
    } catch (e) { /* ignore */ }
    if (short) {
      if (lang === 'ar') return 'بدون رمز حتى ' + date;
      if (lang === 'en') return 'No code until ' + date;
      return 'Sans code jusqu’au ' + date;
    }
    if (lang === 'ar') return 'دخول مجاني — جرّب بدون رمز حتى ' + date;
    if (lang === 'en') return 'Free access — try without a code until ' + date;
    return 'Accès libre — testez sans code jusqu’au ' + date;
  }

  function applyFreePromoUi() {
    var msg = freePromoText(false);
    var peekPromo = document.getElementById('section-peek-promo');
    if (!msg) {
      try { document.documentElement.removeAttribute('data-oibt-free'); } catch (e) { /* ignore */ }
      if (peekPromo) {
        peekPromo.hidden = true;
        peekPromo.textContent = '';
      }
      var leftover = document.querySelectorAll('.edz-free-badge');
      var k;
      for (k = 0; k < leftover.length; k++) leftover[k].remove();
      return;
    }
    try {
      document.documentElement.setAttribute('data-oibt-free', oibtFreeUntilIso());
    } catch (e) { /* ignore */ }

    if (peekPromo) {
      peekPromo.hidden = true;
      peekPromo.textContent = '';
    }

    var short = freePromoText(true);
    var tiles = document.querySelectorAll('.quick-item--oibt');
    var i;
    for (i = 0; i < tiles.length; i++) {
      var tile = tiles[i];
      if (tile.querySelector('.edz-free-badge')) continue;
      var badge = document.createElement('span');
      badge.className = 'edz-free-badge';
      badge.textContent = short;
      tile.appendChild(badge);
    }
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
        '<img id="section-peek-img" src="" alt="" width="480" height="320" decoding="async" loading="lazy"/>' +
        '<span class="section-peek__promo" id="section-peek-promo" hidden></span>' +
        '<span class="section-peek__label" id="section-peek-label"></span>' +
        '</div>';
    }
    if (!document.getElementById('section-peek-promo')) {
      var frame = peek.querySelector('.section-peek__frame');
      var labelEl = peek.querySelector('.section-peek__label');
      if (frame && !peek.querySelector('.section-peek__promo')) {
        var promo = document.createElement('span');
        promo.className = 'section-peek__promo';
        promo.id = 'section-peek-promo';
        promo.hidden = true;
        if (labelEl) frame.insertBefore(promo, labelEl);
        else frame.appendChild(promo);
      }
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

  function applyPeek(el) {
    if (!el || el.__edzPeekApplied) return;
    var src = el.getAttribute('data-preview');
    if (!src) return;
    el.style.setProperty('--peek-img', cssUrl(src));
    el.__edzPeekApplied = true;
    el.classList.add('is-peek-loaded');
  }

  /**
   * Charge --peek-img seulement près du viewport (évite 12×2 Mo d’un coup).
   * Pas de new Image() : le background CSS charge déjà le fichier.
   */
  function paintVars() {
    var nodes = document.querySelectorAll('[data-preview]');
    var i;
    var el;

    if (!('IntersectionObserver' in window)) {
      for (i = 0; i < nodes.length; i++) applyPeek(nodes[i]);
      return nodes.length;
    }

    if (!lazyObserver) {
      lazyObserver = new IntersectionObserver(
        function (entries) {
          var j;
          var entry;
          for (j = 0; j < entries.length; j++) {
            entry = entries[j];
            if (!entry.isIntersecting) continue;
            applyPeek(entry.target);
            lazyObserver.unobserve(entry.target);
          }
        },
        { rootMargin: '240px 0px', threshold: 0.01 }
      );
    }

    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (el.__edzPeekApplied) continue;
      lazyObserver.observe(el);
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
    applyFreePromoUi();
    /* library-protected peut charger après : réessayer une fois */
    window.setTimeout(applyFreePromoUi, 400);

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
      applyPeek(item);
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
