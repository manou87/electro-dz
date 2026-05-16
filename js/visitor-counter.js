/**
 * Compteur de visites — aujourd'hui + total (Supabase).
 * Une visite = une session navigateur (sessionStorage).
 */
(function () {
  'use strict';

  const SESSION_COUNTED = 'edz_visit_counted';
  const SESSION_STATS = 'edz_visitor_stats';

  const LABELS = {
    fr: { today: "Visiteurs aujourd'hui", total: 'Visites totales' },
    ar: { today: 'زوار اليوم', total: 'إجمالي الزيارات' },
  };

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

  function injectStyles() {
    if (document.getElementById('edz-visitor-counter-style')) return;
    const s = document.createElement('style');
    s.id = 'edz-visitor-counter-style';
    s.textContent = `
      .visitor-stats{
        display:flex;flex-wrap:wrap;align-items:center;justify-content:center;
        gap:6px 14px;margin-top:10px;font-size:.78rem;color:var(--muted,#94a3b8);
      }
      .visitor-stats strong{color:var(--accent,#facc15);font-weight:800;font-variant-numeric:tabular-nums}
      .visitor-sep{opacity:.45}
    `;
    document.head.appendChild(s);
  }

  function labelsForLang(lang) {
    if (window.ElectroDzCalcI18n?.t) {
      return {
        today: window.ElectroDzCalcI18n.t(lang, 'statsToday'),
        total: window.ElectroDzCalcI18n.t(lang, 'statsTotal'),
      };
    }
    const t = LABELS[lang] || LABELS.fr;
    return { today: t.today, total: t.total };
  }

  function renderBlock(lang) {
    const t = labelsForLang(lang);
    const wrap = document.createElement('div');
    wrap.className = 'visitor-stats';
    wrap.setAttribute('aria-live', 'polite');
    wrap.innerHTML =
      '<span>' +
      t.today +
      ' : <strong data-edz-visitors-today>—</strong></span>' +
      '<span class="visitor-sep" aria-hidden="true">·</span>' +
      '<span>' +
      t.total +
      ' : <strong data-edz-visitors-total>—</strong></span>';
    return wrap;
  }

  function mountInFooters() {
    injectStyles();
    const lang = getLang();
    document.querySelectorAll('footer').forEach((footer) => {
      if (footer.querySelector('.visitor-stats')) return;
      footer.appendChild(renderBlock(lang));
    });
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

  async function fetchStats(sb, increment) {
    if (increment && !sessionStorage.getItem(SESSION_COUNTED)) {
      const { data, error } = await sb.rpc('increment_site_visits');
      sessionStorage.setItem(SESSION_COUNTED, '1');
      if (!error && data && data.length) {
        const row = data[0];
        return { today: row.today_visits, total: row.total_visits };
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
    mountInFooters();

    const cached = sessionStorage.getItem(SESSION_STATS);
    if (cached) {
      try {
        updateDOM(JSON.parse(cached));
      } catch (_) { /* ignore */ }
    }

    if (!window.ElectroDzAuth?.getClient) return;

    let sb;
    try {
      sb = window.ElectroDzAuth.getClient();
    } catch (_) {
      return;
    }

    const shouldIncrement = !sessionStorage.getItem(SESSION_COUNTED);
    const stats = await fetchStats(sb, shouldIncrement);
    if (!stats) return;

    sessionStorage.setItem(SESSION_STATS, JSON.stringify(stats));
    updateDOM(stats);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
