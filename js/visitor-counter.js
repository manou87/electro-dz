/**
 * Compteur de visites — barre fixe (toutes pages sauf lecteur PDF).
 * Détail par pays au clic (géoloc IP via API navigateur + Supabase).
 */
(function () {
  'use strict';

  const cfg = window.ElectroDzSite?.supabase || {};
  const SUPABASE_URL = cfg.url || 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  const SUPABASE_ANON_KEY = cfg.anonKey || '';

  const SESSION_COUNTED = 'edz_visit_counted';
  const SESSION_STATS = 'edz_visitor_stats';
  const SESSION_COUNTRY = 'edz_visit_country';

  const path = location.pathname || '';
  const isLibraryPage = /bibliotheque\.html$/i.test(path);
  const skipFixedBar = /lecteur-pdf\.html$/i.test(path);

  const LABELS = {
    fr: { today: "Visiteurs aujourd'hui", total: 'Visites totales' },
    ar: { today: 'زوار اليوم', total: 'إجمالي الزيارات' },
  };

  const PANEL_UI = {
    fr: {
      titleToday: "Visiteurs aujourd'hui par pays",
      titleTotal: 'Visites totales par pays',
      empty: 'Pas encore de données par pays.',
      unknown: 'Pays inconnu',
      close: 'Fermer',
      loading: 'Chargement…',
    },
    ar: {
      titleToday: 'زوار اليوم حسب البلد',
      titleTotal: 'إجمالي الزيارات حسب البلد',
      empty: 'لا توجد بيانات حسب البلد بعد.',
      unknown: 'بلد غير معروف',
      close: 'إغلاق',
      loading: 'جاري التحميل…',
    },
  };

  const PDF_LABELS = {
    fr: { views: 'Lectures PDF', downloads: 'Téléchargements PDF' },
    ar: { views: 'قراءات PDF', downloads: 'تنزيلات PDF' },
  };

  let countryNamesFr;
  let countryNamesAr;

  function getLang() {
    try {
      if (localStorage.getItem('electrodz-site-lang') === 'fr') return 'fr';
    } catch (_) { /* ignore */ }
    const l = (document.documentElement.lang || 'ar').toLowerCase();
    return l === 'fr' ? 'fr' : 'ar';
  }

  function panelUi(lang) {
    return PANEL_UI[lang] || PANEL_UI.fr;
  }

  function formatNum(n, lang) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    try {
      return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-CH').format(v);
    } catch (_) {
      return String(v);
    }
  }

  function countryLabel(code, lang) {
    if (!code || code === 'XX') return panelUi(lang).unknown;
    try {
      if (!countryNamesFr) {
        countryNamesFr = new Intl.DisplayNames(['fr'], { type: 'region' });
        countryNamesAr = new Intl.DisplayNames(['ar'], { type: 'region' });
      }
      const name = (lang === 'ar' ? countryNamesAr : countryNamesFr).of(code);
      return name || code;
    } catch (_) {
      return code;
    }
  }

  function flagEmoji(code) {
    if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return '🌐';
    const u = code.toUpperCase();
    return String.fromCodePoint(
      0x1f1e6 + u.charCodeAt(0) - 65,
      0x1f1e6 + u.charCodeAt(1) - 65
    );
  }

  function labelsForLang(lang) {
    if (window.ElectroDzCalcI18n?.t) {
      return {
        today: window.ElectroDzCalcI18n.t(lang, 'statsToday'),
        total: window.ElectroDzCalcI18n.t(lang, 'statsTotal'),
      };
    }
    const todayNode = document.querySelector('[data-i18n="stats.today"]');
    const totalNode = document.querySelector('[data-i18n="stats.total"]');
    if (todayNode?.textContent) {
      return {
        today: todayNode.textContent,
        total: totalNode?.textContent || LABELS[lang].total,
      };
    }
    return LABELS[lang] || LABELS.fr;
  }

  function injectStyles() {
    if (document.getElementById('edz-visitor-counter-style')) return;
    const s = document.createElement('style');
    s.id = 'edz-visitor-counter-style';
    s.textContent = `
      .edz-visitor-bar{
        position:fixed;bottom:0;left:0;right:0;z-index:180;
        display:flex;flex-wrap:wrap;align-items:center;justify-content:center;
        gap:8px 12px;
        padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));
        font-size:.82rem;color:#e2e8f0;
        background:var(--neon-bg,var(--bg,#030508));
        border-top:1px solid var(--border,rgba(250,204,21,0.22));
        box-shadow:none;
      }
      .edz-visitor-stat{
        cursor:pointer;
        margin:0;
        padding:2px 4px;
        border:none;
        border-radius:6px;
        background:transparent;
        color:#e2e8f0;
        font:inherit;
        font-size:.82rem;
        line-height:1.45;
        box-shadow:none;
        transition:color .15s,background .15s;
        -webkit-appearance:none;
        appearance:none;
      }
      .edz-visitor-stat:hover,.edz-visitor-stat:focus-visible{
        background:rgba(255,255,255,0.06);
        outline:none;
      }
      .edz-visitor-bar strong{
        color:#fff;font-weight:800;font-size:.95rem;
        font-variant-numeric:tabular-nums;
        min-width:1.5em;display:inline-block;text-align:center;
        text-decoration:none;
      }
      .edz-visitor-bar .visitor-sep{opacity:.45;color:#e2e8f0}
      body.edz-has-visitor-bar{
        padding-bottom:calc(52px + env(safe-area-inset-bottom,0px));
      }
      body.edz-visitor-panel-open{
        padding-bottom:calc(52px + env(safe-area-inset-bottom,0px));
      }
      .edz-visitor-panel{
        position:fixed;left:50%;transform:translateX(-50%);z-index:190;
        bottom:calc(52px + env(safe-area-inset-bottom,0px));
        width:min(22rem,calc(100vw - 24px));
        max-height:min(42vh,320px);
        display:flex;flex-direction:column;
        background:var(--neon-panel,rgba(8,12,22,0.96));
        border:1px solid rgba(250,204,21,0.35);
        border-radius:12px 12px 0 0;
        box-shadow:0 -8px 28px rgba(0,0,0,0.4);
        overflow:hidden;
      }
      .edz-visitor-panel[hidden]{display:none!important}
      .edz-visitor-panel__head{
        display:flex;align-items:center;justify-content:space-between;gap:8px;
        flex:0 0 auto;
        padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08);
        font-size:.78rem;font-weight:700;color:#facc15;
      }
      .edz-visitor-panel__close{
        background:transparent;border:none;color:#94a3b8;cursor:pointer;
        font-size:1.1rem;line-height:1;padding:4px 6px;border-radius:6px;
      }
      .edz-visitor-panel__close:hover{color:#facc15}
      /* Corps scrollable : min-height:0 obligatoire en flex column sinon overflow:auto ne s'active pas */
      .edz-visitor-panel__body{
        flex:1 1 auto;
        min-height:0;
        overflow-x:hidden;
        overflow-y:auto;
        -webkit-overflow-scrolling:touch;
        overscroll-behavior:contain;
        touch-action:pan-y;
      }
      .edz-visitor-panel__list{
        margin:0;padding:8px 0;list-style:none;
        font-size:.82rem;color:#e2e8f0;
      }
      .edz-visitor-panel__row{
        display:flex;align-items:center;justify-content:space-between;gap:10px;
        padding:6px 14px;
      }
      .edz-visitor-panel__row:hover{background:rgba(255,255,255,0.04)}
      .edz-visitor-panel__country{display:flex;align-items:center;gap:8px;min-width:0}
      .edz-visitor-panel__flag{font-size:1.15rem;line-height:1;flex-shrink:0}
      .edz-visitor-panel__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .edz-visitor-panel__count{
        color:#facc15;font-weight:800;font-variant-numeric:tabular-nums;flex-shrink:0;
      }
      .edz-visitor-panel__empty{padding:14px;text-align:center;color:#94a3b8;font-size:.8rem}
      .library-pdf-stats{
        display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;
        margin-top:12px;padding:10px 14px;
        font-size:.85rem;color:#94a3b8;
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(250,204,21,0.22);
        border-radius:10px;
      }
      .library-pdf-stats strong{
        color:#facc15;font-weight:800;font-variant-numeric:tabular-nums;
      }
      footer .visitor-stats{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function pdfLabels(lang) {
    return PDF_LABELS[lang] || PDF_LABELS.fr;
  }

  function visitorBarHtml(lang) {
    const t = labelsForLang(lang);
    return (
      '<button type="button" class="edz-visitor-stat edz-visitor-stat--today" data-edz-scope="today">' +
      t.today +
      ' : <strong data-edz-visitors-today>…</strong></button>' +
      '<span class="visitor-sep" aria-hidden="true">·</span>' +
      '<button type="button" class="edz-visitor-stat edz-visitor-stat--total" data-edz-scope="total">' +
      t.total +
      ' : <strong data-edz-visitors-total>…</strong></button>'
    );
  }

  function pdfStatsHtml(lang) {
    const p = pdfLabels(lang);
    return (
      '<span>' +
      p.views +
      ' : <strong data-edz-pdf-views>…</strong></span>' +
      '<span class="visitor-sep" aria-hidden="true">·</span>' +
      '<span>' +
      p.downloads +
      ' : <strong data-edz-pdf-downloads>…</strong></span>'
    );
  }

  function ensurePanel() {
    let panel = document.getElementById('edz-visitor-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'edz-visitor-panel';
    panel.className = 'edz-visitor-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.innerHTML =
      '<div class="edz-visitor-panel__head">' +
      '<span data-edz-panel-title></span>' +
      '<button type="button" class="edz-visitor-panel__close" data-edz-panel-close aria-label="Fermer">×</button>' +
      '</div>' +
      '<div data-edz-panel-body class="edz-visitor-panel__body"></div>';
    document.body.appendChild(panel);

    panel.querySelector('[data-edz-panel-close]').addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    document.addEventListener('click', function (e) {
      const panelEl = document.getElementById('edz-visitor-panel');
      if (!panelEl || panelEl.hidden) return;
      if (panelEl.contains(e.target)) return;
      if (e.target.closest('.edz-visitor-stat')) return;
      closePanel();
    });

    return panel;
  }

  function closePanel() {
    const panel = document.getElementById('edz-visitor-panel');
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove('edz-visitor-panel-open');
  }

  function renderPanelRows(rows, lang) {
    if (!rows || !rows.length) {
      return '<p class="edz-visitor-panel__empty">' + panelUi(lang).empty + '</p>';
    }
    let html = '<ul class="edz-visitor-panel__list">';
    rows.forEach(function (row) {
      const code = (row.country_code || '').toUpperCase();
      const count = formatNum(row.visit_count, lang);
      html +=
        '<li class="edz-visitor-panel__row">' +
        '<span class="edz-visitor-panel__country">' +
        '<span class="edz-visitor-panel__flag" aria-hidden="true">' +
        flagEmoji(code) +
        '</span>' +
        '<span class="edz-visitor-panel__name">' +
        countryLabel(code, lang) +
        '</span></span>' +
        '<span class="edz-visitor-panel__count">' +
        count +
        '</span></li>';
    });
    html += '</ul>';
    return html;
  }

  async function openCountryPanel(scope) {
    const lang = getLang();
    const ui = panelUi(lang);
    const panel = ensurePanel();
    const title = scope === 'today' ? ui.titleToday : ui.titleTotal;
    panel.querySelector('[data-edz-panel-title]').textContent = title;
    panel.querySelector('[data-edz-panel-body]').innerHTML =
      '<p class="edz-visitor-panel__empty">' + ui.loading + '</p>';
    panel.hidden = false;
    document.body.classList.add('edz-visitor-panel-open');

    const sb = await waitSupabase(15);
    if (!sb) {
      panel.querySelector('[data-edz-panel-body]').innerHTML =
        '<p class="edz-visitor-panel__empty">' + ui.empty + '</p>';
      return;
    }

    try {
      const { data, error } = await sb.rpc('get_visits_by_country', { p_scope: scope });
      if (error) throw error;
      panel.querySelector('[data-edz-panel-body]').innerHTML = renderPanelRows(data || [], lang);
    } catch (_) {
      panel.querySelector('[data-edz-panel-body]').innerHTML =
        '<p class="edz-visitor-panel__empty">' + ui.empty + '</p>';
    }
  }

  function bindBarClicks(bar) {
    bar.querySelectorAll('[data-edz-scope]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const scope = btn.getAttribute('data-edz-scope');
        if (scope === 'today' || scope === 'total') openCountryPanel(scope);
      });
    });
  }

  function mountUi() {
    if (skipFixedBar) return;
    injectStyles();
    if (!document.getElementById('edz-visitor-bar')) {
      const lang = getLang();
      const bar = document.createElement('div');
      bar.id = 'edz-visitor-bar';
      bar.className = 'edz-visitor-bar';
      bar.setAttribute('aria-live', 'polite');
      bar.setAttribute('role', 'status');
      bar.innerHTML = visitorBarHtml(lang);
      document.body.appendChild(bar);
      document.body.classList.add('edz-has-visitor-bar');
      bindBarClicks(bar);
    }

    if (isLibraryPage) {
      mountLibraryPdfStats();
    }
  }

  function mountLibraryPdfStats() {
    const host = document.querySelector('[data-library-pdf-stats]');
    if (!host || host.querySelector('[data-edz-pdf-views]')) return;
    const lang = getLang();
    host.hidden = false;
    host.classList.add('library-pdf-stats');
    host.setAttribute('aria-live', 'polite');
    host.innerHTML = pdfStatsHtml(lang);
  }

  function updateDOM(stats) {
    const lang = getLang();
    const todayVal =
      stats && stats.today != null && Number.isFinite(Number(stats.today))
        ? formatNum(stats.today, lang)
        : '—';
    const totalVal =
      stats && stats.total != null && Number.isFinite(Number(stats.total))
        ? formatNum(stats.total, lang)
        : '—';

    document.querySelectorAll('[data-edz-visitors-today]').forEach(function (el) {
      el.textContent = todayVal;
    });
    document.querySelectorAll('[data-edz-visitors-total]').forEach(function (el) {
      el.textContent = totalVal;
    });
  }

  function updatePdfDOM(totals) {
    const lang = getLang();
    const views =
      totals && totals.views != null ? formatNum(totals.views, lang) : '—';
    const dl =
      totals && totals.downloads != null ? formatNum(totals.downloads, lang) : '—';
    document.querySelectorAll('[data-edz-pdf-views]').forEach(function (el) {
      el.textContent = views;
    });
    document.querySelectorAll('[data-edz-pdf-downloads]').forEach(function (el) {
      el.textContent = dl;
    });
  }

  function getSupabase() {
    try {
      if (window.ElectroDzAuth?.getClient) return window.ElectroDzAuth.getClient();
      if (window.supabase?.createClient && SUPABASE_ANON_KEY) {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  async function waitSupabase(tries) {
    for (let i = 0; i < tries; i++) {
      const sb = getSupabase();
      if (sb) return sb;
      await new Promise(function (r) {
        setTimeout(r, 80);
      });
    }
    return null;
  }

  function parseRpcRow(data) {
    if (!data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== 'object') return null;
    const today = row.today_visits ?? row.todayVisits;
    const total = row.total_visits ?? row.totalVisits;
    if (today == null && total == null) return null;
    return { today: today, total: total };
  }

  async function detectCountryCode() {
    try {
      const cached = sessionStorage.getItem(SESSION_COUNTRY);
      if (cached) return cached === 'XX' ? null : cached;
    } catch (_) { /* ignore */ }

    async function tryUrl(url, parse) {
      const ctrl = new AbortController();
      const timer = setTimeout(function () {
        ctrl.abort();
      }, 4500);
      try {
        const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
        if (!res.ok) return null;
        return parse(await res.text());
      } catch (_) {
        return null;
      } finally {
        clearTimeout(timer);
      }
    }

    let code = await tryUrl('https://ipapi.co/country_code/', function (text) {
      const c = text.trim().toUpperCase();
      return /^[A-Z]{2}$/.test(c) ? c : null;
    });

    if (!code) {
      code = await tryUrl('https://api.country.is/', function (text) {
        try {
          const j = JSON.parse(text);
          const c = String(j.country || '').toUpperCase();
          return /^[A-Z]{2}$/.test(c) ? c : null;
        } catch (_) {
          return null;
        }
      });
    }

    if (!code) {
      code = await tryUrl('https://www.cloudflare.com/cdn-cgi/trace', function (text) {
        const m = text.match(/^loc=([A-Za-z]{2})$/m);
        return m ? m[1].toUpperCase() : null;
      });
    }

    try {
      sessionStorage.setItem(SESSION_COUNTRY, code || 'XX');
    } catch (_) { /* ignore */ }
    return code;
  }

  async function incrementVisits(sb, countryCode) {
    const args = countryCode ? { p_country_code: countryCode } : {};
    let res = await sb.rpc('increment_site_visits', args);
    if (!res.error) return res;

    res = await sb.rpc('increment_site_visits');
    return res;
  }

  async function fetchStats(sb, increment) {
    if (increment && !sessionStorage.getItem(SESSION_COUNTED)) {
      const country = await detectCountryCode();
      const { data, error } = await incrementVisits(sb, country);
      if (!error && data) {
        const parsed = parseRpcRow(data);
        if (parsed) {
          sessionStorage.setItem(SESSION_COUNTED, '1');
          return parsed;
        }
      }
    }

    const { data, error } = await sb
      .from('site_visitor_stats')
      .select('total_visits,today_visits')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return null;
    return { today: data.today_visits, total: data.total_visits };
  }

  async function run() {
    mountUi();

    const cached = sessionStorage.getItem(SESSION_STATS);
    if (cached) {
      try {
        updateDOM(JSON.parse(cached));
      } catch (_) { /* ignore */ }
    }

    const sb = await waitSupabase(25);
    if (!sb) return;

    const shouldIncrement = !sessionStorage.getItem(SESSION_COUNTED);
    try {
      const stats = await fetchStats(sb, shouldIncrement);
      if (stats) {
        sessionStorage.setItem(SESSION_STATS, JSON.stringify(stats));
        updateDOM(stats);
      }
    } catch (_) { /* ignore */ }

    if (isLibraryPage && window.ElectroDzPdfStats?.fetchTotals) {
      try {
        const pdfTotals = await window.ElectroDzPdfStats.fetchTotals();
        if (pdfTotals) updatePdfDOM(pdfTotals);
      } catch (_) { /* ignore */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
