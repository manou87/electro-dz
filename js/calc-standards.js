/**
 * Valeurs normalisées — alignées app/calculator.tsx
 */
(function (g) {
  'use strict';

  const SECTIONS_MM2 = [
    1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000,
  ];

  const BREAKER_A = [
    6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
    800, 1000, 1250, 1600, 2000, 2500,
  ];

  /** Calibres Tableau 10 NF / Ib câble (+ TGBT industriel jusqu'à 2500 A) */
  const IB_A = [
    10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
    800, 1000, 1250, 1600, 2000, 2500,
  ];

  const DDR_MA = [10, 30, 100, 300, 500, 1000, 3000, 5000];

  const TRANSFO_KVA = [25, 50, 100, 160, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150];

  const DDR_TYPES = ['AC', 'A', 'B', 'F', 'EV', 'B+'];

  const BREAKER_CURVES = ['B', 'C', 'D', 'K', 'Z'];

  g.ElectroDzCalcStandards = {
    SECTIONS_MM2,
    BREAKER_A,
    IB_A,
    DDR_MA,
    TRANSFO_KVA,
    DDR_TYPES,
    BREAKER_CURVES,
  };

  function i18n(key) {
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('electrodz-site-lang') === 'fr') ? 'fr' : 'ar';
    const i = g.ElectroDzCalcI18n;
    return i ? i.t(lang, key) : key;
  }

  function fmtSection(v) {
    return `${v} ${i18n('unitMm2')}`;
  }

  function fmtA(v) {
    return `${v} ${i18n('unitA')}`;
  }

  function fmtMa(v) {
    return `${v} ${i18n('unitMa')}`;
  }

  function fmtKva(v) {
    return `${v} ${i18n('unitKva')}`;
  }

  function fillSelect(el, values, options) {
    if (!el || el.tagName !== 'SELECT') return;
    const opts = options || {};
    const cur = el.value;
    el.innerHTML = '';
    if (opts.placeholder) {
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = opts.placeholder;
      el.appendChild(ph);
    }
    values.forEach((v) => {
      const o = document.createElement('option');
      o.value = String(v);
      o.textContent = opts.format ? opts.format(v) : String(v);
      el.appendChild(o);
    });
    const pick = opts.defaultValue != null ? String(opts.defaultValue) : cur;
    if (pick && [...el.options].some((o) => o.value === pick)) {
      el.value = pick;
    }
  }

  function initAll() {
    const S = g.ElectroDzCalcStandards;
    const thermal = g.ElectroDzCableThermal;
    const sections = thermal?.IEC_SECTIONS_MM2 || S.SECTIONS_MM2;
    const ibList = thermal?.NFC_BREAKER_COLUMNS || S.IB_A;

    document.querySelectorAll('select[data-std="section"]').forEach((el) => {
      const def = el.dataset.default || '6';
      fillSelect(el, sections, { format: fmtSection, defaultValue: def });
    });

    document.querySelectorAll('select[data-std="ib"]').forEach((el) => {
      const def = el.dataset.default || '32';
      fillSelect(el, ibList, { format: fmtA, defaultValue: def });
    });

    document.querySelectorAll('select[data-std="breaker"]').forEach((el) => {
      const def = el.dataset.default || '16';
      fillSelect(el, S.BREAKER_A, { format: fmtA, defaultValue: def });
    });

    document.querySelectorAll('select[data-std="ddr-ma"]').forEach((el) => {
      const def = el.dataset.default || '300';
      fillSelect(el, S.DDR_MA, { format: fmtMa, defaultValue: def });
    });

    document.querySelectorAll('select[data-std="transfo-kva"]').forEach((el) => {
      const def = el.dataset.default || '250';
      fillSelect(el, S.TRANSFO_KVA, { format: fmtKva, defaultValue: def });
    });

    document.querySelectorAll('select[data-std="ddr-type"]').forEach((el) => {
      const def = el.dataset.default || 'AC';
      fillSelect(el, S.DDR_TYPES, { defaultValue: def });
    });

    document.querySelectorAll('select[data-std="curve"]').forEach((el) => {
      const def = el.dataset.default || 'C';
      fillSelect(el, S.BREAKER_CURVES, { defaultValue: def });
    });

    const core = g.ElectroDzCalcCore;
    if (core?._getT) {
      const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('electrodz-site-lang') === 'fr') ? 'fr' : 'ar';
      const t = core._getT(lang);
      const methods = ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2', 'E', 'F', 'G'];
      document.querySelectorAll('select#section-method').forEach((el) => {
        const cur = el.value || 'B1';
        el.innerHTML = '';
        methods.forEach((code) => {
          const o = document.createElement('option');
          o.value = code;
          o.textContent = t[`installMethod_${code}_name`] || code;
          el.appendChild(o);
        });
        if ([...el.options].some((o) => o.value === cur)) el.value = cur;
      });
    }
  }

  g.ElectroDzCalcStandards.init = initAll;
  g.ElectroDzCalcStandards.fillSelect = fillSelect;
})(typeof window !== 'undefined' ? window : globalThis);
