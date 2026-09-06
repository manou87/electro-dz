/**
 * Sélecteur d’accent (visiteurs).
 * — Première pastille « Multi » = accents arc-en-ciel par tuile (look d’origine)
 * — Pastilles 1–7 = accent unifié sur tout le site
 * — ?test=1…7 ou ?test=multi (deep link)
 * — Choix persisté dans localStorage ; défaut = multi
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'edz-site-accent';
  var DEFAULT_ID = 'multi';
  var MULTI_SWATCH =
    'conic-gradient(from 210deg,#facc15,#34d399,#2dd4bf,#38bdf8,#a78bfa,#c084fc,#f87171,#f97316,#facc15)';

  /* Ordre d’affichage (Object.keys mettrait 1–7 avant « multi ») */
  var ORDER = ['multi', '1', '2', '3', '4', '5', '6', '7'];

  var TESTS = {
    multi: {
      name: 'Multi',
      hex: '#facc15',
      soft: '#facc15',
      multi: true,
      swatch: MULTI_SWATCH
    },
    '1': { name: 'Blanc', hex: '#f1f5f9', soft: '#ffffff' },
    '2': { name: 'Gris', hex: '#cbd5e1', soft: '#e2e8f0' },
    '3': { name: 'Cyan', hex: '#22d3ee', soft: '#22d3ee' },
    '4': { name: 'Ambre', hex: '#fbbf24', soft: '#fbbf24' },
    '5': { name: 'Vert', hex: '#84cc16', soft: '#84cc16' },
    '6': { name: 'Bleu', hex: '#60a5fa', soft: '#60a5fa' },
    '7': { name: 'Violet', hex: '#a78bfa', soft: '#c084fc' }
  };

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6) return { r: 226, g: 232, b: 240 };
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }

  function applyAccent(id) {
    var t = TESTS[id];
    if (!t) return;
    var root = document.documentElement;
    var accent = t.hex;

    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-glow', rgba(accent, 0.4));
    root.style.setProperty('--en-glow', rgba(accent, 0.22));
    root.style.setProperty('--accent-soft', t.soft);
    root.style.setProperty('--neon-yellow', accent);
    root.style.setProperty('--neon-cyan', t.multi ? '#22d3ee' : accent);
    root.style.setProperty('--neon-magenta', t.multi ? '#e879f9' : accent);
    root.style.setProperty('--neon-violet', t.multi ? '#a78bfa' : accent);
    root.style.setProperty('--primary', accent);

    if (t.multi) {
      root.style.removeProperty('--quick-accent');
      root.setAttribute('data-accent', 'multi');
      root.setAttribute('data-accent-test', 'multi');
      root.removeAttribute('data-accent-unified');
    } else {
      root.style.setProperty('--quick-accent', accent);
      root.setAttribute('data-accent', id);
      root.setAttribute('data-accent-test', id);
      root.setAttribute('data-accent-unified', '');
    }
  }

  function saveAccent(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) { /* private mode */ }
  }

  function loadStoredAccent() {
    try {
      var id = localStorage.getItem(STORAGE_KEY);
      return id && TESTS[id] ? id : '';
    } catch (e) {
      return '';
    }
  }

  function urlTestId() {
    var id = new URLSearchParams(location.search).get('test');
    return id && TESTS[id] ? id : '';
  }

  function syncSwatches(activeId) {
    document.querySelectorAll('.edz-accent-swatch').forEach(function (btn) {
      var on = btn.getAttribute('data-accent') === activeId;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var trigger = document.getElementById('edz-accent-picker-btn');
    if (!trigger || !TESTS[activeId]) return;
    var t = TESTS[activeId];
    if (t.multi) {
      trigger.style.setProperty('--picker-dot', 'transparent');
      trigger.classList.add('is-multi');
    } else {
      trigger.style.setProperty('--picker-dot', t.hex);
      trigger.classList.remove('is-multi');
    }
  }

  function injectStyles() {
    if (document.getElementById('edz-accent-test-css')) return;
    var css = [
      /* Mode unifié uniquement : force --quick-accent sur les tuiles */
      'html[data-accent-unified] .quick-item{',
      '  --quick-accent:var(--accent)!important;',
      '  --en-glow:var(--accent-glow);',
      '  border-color:color-mix(in srgb,var(--accent) 40%,transparent);',
      '  box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 10px var(--accent-glow);',
      '}',
      'html[data-accent-unified] .quick-item:hover{',
      '  border-color:color-mix(in srgb,var(--accent) 70%,transparent);',
      '  box-shadow:0 8px 18px rgba(0,0,0,.32),0 0 16px var(--accent-glow);',
      '}',
      'html[data-accent-unified] .quick-item .ico-label,',
      'html[data-accent-unified] .quick-item[data-preview] .ico-label{',
      '  color:var(--quick-accent,#e2e8f0);',
      '}',
      'html[data-accent-unified] .edz-ticker{',
      '  border-bottom-color:color-mix(in srgb,var(--accent) 45%,transparent);',
      '}',
      'html[data-accent-unified] .visitor-stats strong{',
      '  text-shadow:0 0 8px var(--accent-glow);',
      '}',
      'html[data-accent-unified] .btn-dl:hover{',
      '  box-shadow:0 6px 16px var(--accent-glow);',
      '}',
      'html[data-accent-unified] body{',
      '  background-image:',
      '    radial-gradient(ellipse 80% 50% at 50% -20%,color-mix(in srgb,var(--accent) 14%,transparent),transparent),',
      '    radial-gradient(ellipse 60% 40% at 100% 50%,rgba(59,130,246,.06),transparent);',
      '}',
      '.edz-accent-picker{',
      '  position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;',
      '  line-height:0;vertical-align:middle;',
      '}',
      '.lang-tools{',
      '  position:absolute!important;top:50%!important;right:12px!important;left:auto!important;',
      '  bottom:auto!important;margin:0!important;transform:translateY(-50%);',
      '  z-index:40;display:inline-flex!important;align-items:center!important;gap:6px;',
      '  flex-direction:row!important;direction:ltr!important;unicode-bidi:isolate;flex-shrink:0;',
      '}',
      '.lang-tools .lang-group,.lang-tools .edz-lang-pin{',
      '  position:static!important;top:auto!important;right:auto!important;left:auto!important;',
      '  bottom:auto!important;transform:none!important;margin:0!important;',
      '}',
      '#edz-accent-picker-btn{',
      '  --picker-dot:var(--accent,#e2e8f0);',
      '  position:relative;box-sizing:border-box;',
      '  width:30px;height:30px;min-width:30px;min-height:30px;padding:0;margin:0;border-radius:999px;',
      '  display:inline-flex;align-items:center;justify-content:center;',
      '  background:rgba(255,255,255,0.05);border:1px solid var(--border,rgba(255,255,255,0.1));',
      '  color:var(--muted,#94a3b8);cursor:pointer;line-height:0;flex-shrink:0;',
      '  transition:border-color .15s,color .15s,background .15s;',
      '}',
      '#edz-accent-picker-btn:hover,#edz-accent-picker-btn[aria-expanded="true"]{',
      '  color:var(--accent,#e2e8f0);border-color:color-mix(in srgb,var(--accent,#e2e8f0) 45%,transparent);',
      '}',
      '#edz-accent-picker-btn:focus-visible{',
      '  outline:2px solid var(--accent,#e2e8f0);outline-offset:2px;',
      '}',
      '#edz-accent-picker-btn svg{width:15px;height:15px;display:block;flex-shrink:0}',
      '#edz-accent-picker-btn .edz-accent-dot{',
      '  position:absolute;width:7px;height:7px;border-radius:50%;',
      '  background:var(--picker-dot);border:1.5px solid #0a0f1a;',
      '  right:2px;bottom:2px;pointer-events:none;',
      '}',
      '#edz-accent-picker-btn.is-multi .edz-accent-dot{',
      '  background:' + MULTI_SWATCH + ';',
      '}',
      '.edz-accent-menu{',
      '  position:absolute;top:calc(100% + 6px);right:0;left:auto;',
      '  display:none;grid-template-columns:repeat(4,22px);',
      '  gap:5px;padding:7px;box-sizing:border-box;',
      '  width:auto;min-width:0;max-width:min(calc(100vw - 16px),118px);',
      '  border-radius:12px;background:#0f172a;',
      '  border:1px solid rgba(255,255,255,0.12);',
      '  box-shadow:0 12px 28px rgba(0,0,0,.45);',
      '  z-index:100;direction:ltr;pointer-events:auto;',
      '  overflow:visible;',
      '}',
      'html[dir="rtl"] .edz-accent-menu{right:0;left:auto}',
      '.edz-accent-picker.is-open .edz-accent-menu{display:grid}',
      '.edz-accent-swatch{',
      '  box-sizing:border-box;appearance:none;-webkit-appearance:none;',
      '  width:22px;height:22px;min-width:22px;min-height:22px;max-width:22px;max-height:22px;',
      '  border-radius:50%;padding:0;margin:0;cursor:pointer;flex:none;',
      '  border:2px solid rgba(255,255,255,0.18);',
      '  box-shadow:inset 0 0 0 1px rgba(0,0,0,0.25);',
      '  transition:transform .12s,box-shadow .12s,border-color .12s;',
      '  font-size:0;line-height:0;overflow:hidden;',
      '}',
      '.edz-accent-swatch:hover{transform:scale(1.1);border-color:rgba(255,255,255,0.45)}',
      '.edz-accent-swatch:focus-visible{outline:2px solid #fff;outline-offset:2px}',
      '.edz-accent-swatch.is-active{',
      '  border-color:#fff;',
      '  box-shadow:0 0 0 2px #0a0f1a,0 0 0 3px var(--accent,#e2e8f0);',
      '}',
      '@media(max-width:640px){',
      '  #edz-accent-picker-btn{width:28px;height:28px;min-width:28px;min-height:28px}',
      '  .edz-accent-menu{',
      '    grid-template-columns:repeat(4,20px);',
      '    gap:4px;padding:6px;max-width:min(calc(100vw - 12px),108px);',
      '  }',
      '  .edz-accent-swatch{',
      '    width:20px;height:20px;min-width:20px;min-height:20px;max-width:20px;max-height:20px;',
      '  }',
      '}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'edz-accent-test-css';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function closePicker(picker) {
    if (!picker) return;
    picker.classList.remove('is-open');
    var btn = picker.querySelector('#edz-accent-picker-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function openPicker(picker) {
    picker.classList.add('is-open');
    var btn = picker.querySelector('#edz-accent-picker-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function mountPicker(activeId) {
    if (document.getElementById('edz-accent-picker')) return;

    var langGroup = document.querySelector('.lang-group');
    if (!langGroup || !langGroup.parentNode) return;

    var picker = document.createElement('div');
    picker.className = 'edz-accent-picker';
    picker.id = 'edz-accent-picker';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'edz-accent-picker-btn';
    btn.setAttribute('aria-label', 'Choisir la couleur d’accent');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-controls', 'edz-accent-menu');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="3"/>' +
      '<path d="M12 3v2.5M12 18.5V21M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M3 12h2.5M18.5 12H21M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/>' +
      '</svg><span class="edz-accent-dot" aria-hidden="true"></span>';

    var menu = document.createElement('div');
    menu.className = 'edz-accent-menu';
    menu.id = 'edz-accent-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Couleurs d’accent');

    ORDER.forEach(function (id) {
      var t = TESTS[id];
      var sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'edz-accent-swatch' + (id === activeId ? ' is-active' : '');
      sw.setAttribute('role', 'option');
      sw.setAttribute('data-accent', id);
      sw.setAttribute('aria-label', t.name);
      sw.setAttribute('aria-selected', id === activeId ? 'true' : 'false');
      sw.title = t.name;
      sw.style.background = t.swatch || t.hex;
      sw.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        applyAccent(id);
        saveAccent(id);
        syncSwatches(id);
        closePicker(picker);
      });
      menu.appendChild(sw);
    });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (picker.classList.contains('is-open')) closePicker(picker);
      else openPicker(picker);
    });

    picker.appendChild(btn);
    picker.appendChild(menu);

    langGroup.parentNode.insertBefore(picker, langGroup);

    var needsWrap =
      getComputedStyle(langGroup).position === 'absolute' ||
      langGroup.classList.contains('edz-lang-pin') ||
      !!langGroup.closest('.nav, nav');
    if (needsWrap && !langGroup.closest('.lang-tools')) {
      var wrap = document.createElement('div');
      wrap.className = 'lang-tools';
      wrap.setAttribute('dir', 'ltr');
      langGroup.parentNode.insertBefore(wrap, picker);
      wrap.appendChild(picker);
      wrap.appendChild(langGroup);
      langGroup.style.position = 'static';
      langGroup.style.top = 'auto';
      langGroup.style.right = 'auto';
      langGroup.style.left = 'auto';
      langGroup.style.transform = 'none';
      if (window.ElectroDzHomeNav && typeof window.ElectroDzHomeNav.pinLangSwitcher === 'function') {
        window.ElectroDzHomeNav.pinLangSwitcher();
      } else {
        var host = wrap.closest('.nav, nav, .edz-lang-pin-host') || wrap.parentElement;
        if (host) {
          var w = Math.ceil(wrap.getBoundingClientRect().width);
          if (w > 40) host.style.setProperty('--edz-lang-pin-w', w + 16 + 'px');
        }
      }
    }

    document.addEventListener('click', function (e) {
      if (!picker.contains(e.target)) closePicker(picker);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePicker(picker);
    });

    syncSwatches(activeId || DEFAULT_ID);
  }

  injectStyles();

  var fromUrl = urlTestId();
  var fromStore = loadStoredAccent();
  var activeId = fromUrl || fromStore || DEFAULT_ID;

  applyAccent(activeId);
  if (fromUrl) saveAccent(fromUrl);

  function bootPicker() {
    mountPicker(activeId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPicker);
  } else {
    bootPicker();
  }
})();
