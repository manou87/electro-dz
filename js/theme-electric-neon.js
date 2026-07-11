/**
 * Thème Electric Neon — actif sur tout le site (prod + localhost).
 * Désactivation globale : NEON_ENABLED = false ci-dessous.
 * Désactivation visiteur : ?neon=0 (mémorisé) · réactivation : ?neon=1
 */
(function () {
  'use strict';

  var NEON_ENABLED = true;
  var STORAGE_KEY = 'edz-neon-preview';
  var params = new URLSearchParams(window.location.search);
  var cssInjected = false;

  function isLocalPreview() {
    var h = location.hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '[::1]' ||
      h === '::1' ||
      location.protocol === 'file:'
    );
  }

  function shouldActivate() {
    if (!NEON_ENABLED) return false;
    if (params.get('neon') === '0') {
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch (e) { /* ignore */ }
      return false;
    }
    if (params.get('neon') === '1') {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
      return true;
    }
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '0') return false;
      if (stored === '1') return true;
    } catch (e) { /* ignore */ }
    return true;
  }

  if (!shouldActivate()) return;
  if (window.__EDZ_NEON_BOOTED__) return;
  window.__EDZ_NEON_BOOTED__ = true;

  function resolveCssHref() {
    var scripts = document.getElementsByTagName('script');
    var i;
    for (i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute('src');
      if (!src) continue;
      if (src.indexOf('theme-electric-neon') !== -1) {
        return src.replace(/js\/theme-electric-neon[^/]*\.js(?:\?.*)?$/, 'css/theme-electric-neon.css');
      }
    }
    return 'css/theme-electric-neon.css';
  }

  function injectCriticalCss() {
    if (document.getElementById('en-critical-css')) return;
    var style = document.createElement('style');
    style.id = 'en-critical-css';
    style.textContent =
      'html.theme-electric-neon,html.theme-electric-neon body{background:#030508!important;background-image:none!important;color:#e2e8f0}' +
      'html.theme-electric-neon .en-bg{position:fixed;inset:0;z-index:-1!important;pointer-events:none}' +
      'html.theme-electric-neon .nav,html.theme-electric-neon .site-header{background:rgba(8,12,22,.92)!important}';
    document.head.appendChild(style);
  }

  function enableStylesheet() {
    document.documentElement.classList.add('theme-electric-neon');
    injectCriticalCss();
    if (cssInjected) return;

    var href = resolveCssHref();
    var existing = document.getElementById('en-theme-css');
    if (existing) {
      existing.disabled = false;
      existing.removeAttribute('disabled');
      existing.media = 'all';
      if (existing.sheet || existing.styleSheet) {
        cssInjected = true;
        return;
      }
      existing.remove();
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.id = 'en-theme-css';
    link.media = 'all';
    link.onload = function () { link.media = 'all'; };
    document.head.appendChild(link);
    cssInjected = true;
    window.setTimeout(function () { link.media = 'all'; }, 50);
  }

  function decorateInternalLinks() {
    if (!isLocalPreview()) return;

    function withNeon(href) {
      if (!href || href.charAt(0) === '#') return href;
      if (/^(mailto|tel|javascript):/i.test(href)) return href;
      try {
        var u = new URL(href, location.href);
        if (u.origin !== location.origin) return href;
        if (u.searchParams.get('neon') === '1') return href;
        u.searchParams.set('neon', '1');
        return u.pathname + u.search + u.hash;
      } catch (e) {
        return href;
      }
    }

    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var next = withNeon(a.getAttribute('href'));
      if (next && next !== a.getAttribute('href')) a.setAttribute('href', next);
    });

    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var next = withNeon(a.getAttribute('href'));
      if (next && next !== a.getAttribute('href')) a.setAttribute('href', next);
    }, true);
  }

  enableStylesheet();

  function scheduleIdle(fn) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: 800 });
    } else {
      window.setTimeout(fn, 16);
    }
  }

  function injectBackground() {
    if (document.querySelector('.en-bg')) return;
    var bg = document.createElement('div');
    bg.className = 'en-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML =
      '<div class="en-grid"></div>' +
      '<div class="en-glow-orb en-glow-orb--y"></div>' +
      '<div class="en-glow-orb en-glow-orb--c"></div>' +
      '<svg class="en-circuit" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      '<path class="en-flow" d="M0 200 H200 L280 120 L400 200 L520 80 L680 200 L820 140 L1000 200 L1200 200"/>' +
      '<path class="en-flow en-flow--2" d="M0 280 H150 L240 320 L380 240 L500 300 L650 220 L800 280 L950 260 L1200 280"/>' +
      '</svg>';
    document.body.insertBefore(bg, document.body.firstChild);
  }

  function wrapHero(hero) {
    if (!hero || hero.dataset.enDone) return;
    /* Page calcul : pas de grand bandeau néon — on garde le hero compact */
    if (document.body && document.body.querySelector('.calc-workspace')) {
      hero.dataset.enDone = '1';
      hero.classList.add('en-hero-calc-compact');
      return;
    }
    hero.dataset.enDone = '1';

    var frame = document.createElement('div');
    frame.className = 'en-hero-frame';

    var inner = document.createElement('div');
    inner.className = 'en-hero-inner';
    while (hero.firstChild) inner.appendChild(hero.firstChild);

    frame.appendChild(inner);
    hero.replaceWith(frame);
  }

  function markAnimatedCards() {
    document.querySelectorAll('.quick-item, .type-card, .book-card-inner, .devis-card').forEach(function (el, i) {
      el.style.setProperty('--en-i', String(i % 12));
    });
  }

  function initDecorations() {
    if (!document.body) return;
    scheduleIdle(function () {
      injectBackground();
      wrapHero(document.querySelector('.hero'));
      markAnimatedCards();
    });
  }

  function onReady() {
    initDecorations();
    decorateInternalLinks();
  }

  if (document.body) {
    onReady();
  } else {
    document.addEventListener('DOMContentLoaded', onReady);
  }
})();
