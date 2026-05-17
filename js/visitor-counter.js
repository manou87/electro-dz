/**
 * Compteur de visites — barre fixe (toutes pages sauf lecteur PDF).
 * Stats PDF (lectures / téléchargements) : uniquement sur bibliotheque.html.
 */
(function () {
  'use strict';

  const cfg = window.ElectroDzSite?.supabase || {};
  const SUPABASE_URL = cfg.url || 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  const SUPABASE_ANON_KEY = cfg.anonKey || '';

  const SESSION_COUNTED = 'edz_visit_counted';
  const SESSION_STATS = 'edz_visitor_stats';

  const path = location.pathname || '';
  const isLibraryPage = /bibliotheque\.html$/i.test(path);
  const skipFixedBar = /lecteur-pdf\.html$/i.test(path);

  const LABELS = {
    fr: { today: "Visiteurs aujourd'hui", total: 'Visites totales' },
    ar: { today: 'زوار اليوم', total: 'إجمالي الزيارات' },
  };

  const PDF_LABELS = {
    fr: { views: 'Lectures PDF', downloads: 'Téléchargements PDF' },
    ar: { views: 'قراءات PDF', downloads: 'تنزيلات PDF' },
  };

  function getLang() {
    try {
      if (localStorage.getItem('electrodz-site-lang') === 'fr') return 'fr';
    } catch (_) { /* ignore */ }
    const l = (document.documentElement.lang || 'ar').toLowerCase();
    return l === 'fr' ? 'fr' : 'ar';
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
        gap:8px 18px;
        padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));
        font-size:.88rem;color:#e2e8f0;
        background:rgba(15,23,42,0.98);
        border-top:2px solid rgba(250,204,21,0.55);
        backdrop-filter:blur(12px);
        box-shadow:0 -6px 24px rgba(0,0,0,0.45);
      }
      .edz-visitor-bar strong{
        color:#facc15;font-weight:900;font-size:1.05rem;
        font-variant-numeric:tabular-nums;
        min-width:1.5em;display:inline-block;text-align:center;
      }
      .edz-visitor-bar .visitor-sep{opacity:.5}
      body.edz-has-visitor-bar{
        padding-bottom:calc(52px + env(safe-area-inset-bottom,0px));
      }
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
      '<span>' +
      t.today +
      ' : <strong data-edz-visitors-today>…</strong></span>' +
      '<span class="visitor-sep" aria-hidden="true">·</span>' +
      '<span>' +
      t.total +
      ' : <strong data-edz-visitors-total>…</strong></span>'
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

    document.querySelectorAll('[data-edz-visitors-today]').forEach((el) => {
      el.textContent = todayVal;
    });
    document.querySelectorAll('[data-edz-visitors-total]').forEach((el) => {
      el.textContent = totalVal;
    });
  }

  function updatePdfDOM(totals) {
    const lang = getLang();
    const views =
      totals && totals.views != null ? formatNum(totals.views, lang) : '—';
    const dl =
      totals && totals.downloads != null ? formatNum(totals.downloads, lang) : '—';
    document.querySelectorAll('[data-edz-pdf-views]').forEach((el) => {
      el.textContent = views;
    });
    document.querySelectorAll('[data-edz-pdf-downloads]').forEach((el) => {
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
      await new Promise((r) => setTimeout(r, 80));
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
    return { today, total };
  }

  async function fetchStats(sb, increment) {
    if (increment && !sessionStorage.getItem(SESSION_COUNTED)) {
      const { data, error } = await sb.rpc('increment_site_visits');
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
