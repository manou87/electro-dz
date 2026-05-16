/**
 * Compteur de visites — aujourd'hui + total (Supabase).
 * Barre fixe en bas (visible sur mobile) + mise à jour du footer si présent.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aXFxY256Y3hzd2RxenVieHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTQ5NzcsImV4cCI6MjA2MDAzMDk3N30.YFkBDCmHIcTmjRJrYWuMbbfQgQkRIFa6PoLtl7Ml1UE';

  const SESSION_COUNTED = 'edz_visit_counted';
  const SESSION_STATS = 'edz_visitor_stats';

  const LABELS = {
    fr: { today: "Visiteurs aujourd'hui", total: 'Visites totales' },
    ar: { today: 'زوار اليوم', total: 'إجمالي الزيارات' },
  };

  const skipFixedBar = /lecteur-pdf\.html$/i.test(location.pathname);

  function getLang() {
    const l = (document.documentElement.lang || 'fr').toLowerCase();
    return l === 'ar' ? 'ar' : 'fr';
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
    const nodes = document.querySelectorAll('[data-i18n="stats.today"]');
    if (nodes.length) {
      return {
        today: nodes[0].textContent || LABELS[lang].today,
        total:
          document.querySelector('[data-i18n="stats.total"]')?.textContent ||
          LABELS[lang].total,
      };
    }
    return LABELS[lang] || LABELS.fr;
  }

  function injectStyles() {
    if (document.getElementById('edz-visitor-counter-style')) return;
    const s = document.createElement('style');
    s.id = 'edz-visitor-counter-style';
    s.textContent = `
      .visitor-stats,.edz-visitor-bar{
        display:flex;flex-wrap:wrap;align-items:center;justify-content:center;
        gap:6px 14px;font-size:.8rem;color:var(--muted,#94a3b8);
      }
      .visitor-stats{margin-top:10px}
      .visitor-stats strong,.edz-visitor-bar strong{
        color:var(--accent,#facc15);font-weight:800;font-variant-numeric:tabular-nums;
      }
      .visitor-sep{opacity:.45}
      .edz-visitor-bar{
        position:fixed;bottom:0;left:0;right:0;z-index:180;
        padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));
        background:rgba(15,23,42,0.97);
        border-top:1px solid rgba(250,204,21,0.35);
        backdrop-filter:blur(10px);
        box-shadow:0 -4px 20px rgba(0,0,0,0.35);
      }
      body.edz-has-visitor-bar{padding-bottom:calc(44px + env(safe-area-inset-bottom,0px))}
    `;
    document.head.appendChild(s);
  }

  function statsHtml(lang) {
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

  function mountUi() {
    injectStyles();
    const lang = getLang();

    document.querySelectorAll('footer').forEach((footer) => {
      if (footer.querySelector('[data-edz-visitors-today]')) return;
      let block = footer.querySelector('.visitor-stats');
      if (!block) {
        block = document.createElement('div');
        block.className = 'visitor-stats';
        block.setAttribute('aria-live', 'polite');
        footer.appendChild(block);
      }
      block.innerHTML = statsHtml(lang);
    });

    if (!skipFixedBar && !document.getElementById('edz-visitor-bar')) {
      const bar = document.createElement('div');
      bar.id = 'edz-visitor-bar';
      bar.className = 'edz-visitor-bar';
      bar.setAttribute('aria-live', 'polite');
      bar.innerHTML = statsHtml(lang);
      document.body.appendChild(bar);
      document.body.classList.add('edz-has-visitor-bar');
    }
  }

  function updateDOM(stats) {
    const lang = getLang();
    document.querySelectorAll('[data-edz-visitors-today]').forEach((el) => {
      el.textContent = formatNum(stats.today, lang);
    });
    document.querySelectorAll('[data-edz-visitors-total]').forEach((el) => {
      el.textContent = formatNum(stats.total, lang);
    });
  }

  function getSupabase() {
    try {
      if (window.ElectroDzAuth?.getClient) return window.ElectroDzAuth.getClient();
      if (window.supabase?.createClient) {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  async function fetchStats(sb, increment) {
    if (increment && !sessionStorage.getItem(SESSION_COUNTED)) {
      const { data, error } = await sb.rpc('increment_site_visits');
      if (!error && data && data.length) {
        sessionStorage.setItem(SESSION_COUNTED, '1');
        const row = data[0];
        return {
          today: row.today_visits ?? row.todayVisits,
          total: row.total_visits ?? row.totalVisits,
        };
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

    const sb = getSupabase();
    if (!sb) {
      updateDOM({ today: 0, total: 0 });
      return;
    }

    const shouldIncrement = !sessionStorage.getItem(SESSION_COUNTED);
    try {
      const stats = await fetchStats(sb, shouldIncrement);
      if (stats) {
        sessionStorage.setItem(SESSION_STATS, JSON.stringify(stats));
        updateDOM(stats);
      } else {
        updateDOM({ today: 0, total: 0 });
      }
    } catch (_) {
      updateDOM({ today: 0, total: 0 });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
