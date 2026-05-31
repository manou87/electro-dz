/**
 * UI calculateur — même organisation que l'app (grille / bandeau / focus).
 */
(function () {
  'use strict';

  const CALC_TYPES = [
    { id: 'ohm_law', domId: 'ohm', icon: '⚡', color: '#1E40AF' },
    { id: 'power_energy', domId: 'power', icon: '🔋', color: '#FFFFFF' },
    { id: 'copper_resistance', domId: 'copper', icon: '🔶', color: '#F97316' },
    { id: 'voltage_drop', domId: 'drop', icon: '📉', color: '#06B6D4' },
    { id: 'cable_section', domId: 'section', icon: '📏', color: '#7C3AED' },
    { id: 'selectivity', domId: 'selectivity', icon: '🛡️', color: '#FFFFFF' },
    { id: 'icc', domId: 'icc', icon: '💥', color: '#DC2626' },
    { id: 'breaking_time', domId: 'breaking', icon: '⏱️', color: '#0EA5E9' },
    { id: 'power_balance', domId: 'balance', icon: '📊', color: '#059669' },
    { id: 'trip_curve', domId: 'tripcurve', icon: '📈', color: '#10B981' },
  ];

  let activeId = 'ohm_law';
  let focusMode = false;
  let pickerMode = 'grid';

  function getLang() {
    try {
      return localStorage.getItem('electrodz-site-lang') === 'fr' ? 'fr' : 'ar';
    } catch (_) {
      return 'ar';
    }
  }

  function setLang(lang) {
    try {
      localStorage.setItem('electrodz-site-lang', lang);
    } catch (_) { /* ignore */ }
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'fr' ? 'AR' : 'FR';
    const box = document.getElementById('calc-global-result');
    if (box) {
      delete box.dataset.hasResult;
      box.textContent = '';
      box.innerHTML = '';
    }
    applyI18n();
  }

  function tr(key) {
    const I = window.ElectroDzCalcI18n;
    if (!I) return key;
    return I.t(getLang(), key);
  }

  function calcName(id) {
    return tr(`calcName_${id}`);
  }

  function calcDesc(id) {
    return tr(`calcDesc_${id}`);
  }

  function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'ar';
    document.documentElement.dir = lang === 'fr' ? 'ltr' : 'rtl';
    document.title = tr('pageTitle');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', tr('metaDescription'));
    const brandTag = document.getElementById('brand-tagline');
    if (brandTag) brandTag.textContent = tr('brandTagline');
    const heroTag = document.getElementById('hero-tagline');
    if (heroTag) heroTag.textContent = tr('brandTagline');
    const heroSur = document.getElementById('hero-surprise');
    if (heroSur) heroSur.textContent = tr('brandSurprise');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = tr(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = tr(key);
    });

    document.querySelectorAll('[data-i18n-opt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-opt');
      if (key) el.textContent = tr(key);
    });

    document.querySelectorAll('select[data-i18n-select]').forEach((sel) => {
      sel.querySelectorAll('option[data-i18n-opt]').forEach((opt) => {
        const key = opt.getAttribute('data-i18n-opt');
        if (key) opt.textContent = tr(key);
      });
    });

    if (window.ElectroDzCalcStandards?.init) {
      window.ElectroDzCalcStandards.init();
    }
    updateWorkspaceLabels();
    renderTypePickers();
  }

  function mergeCalc() {
    const core = window.ElectroDzCalcCore || {};
    const extra = window.ElectroDzCalcExtra || {};
    window.ElectroDzCalc = Object.assign({}, extra, core);
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function showError(box, msg) {
    if (!box) return;
    box.innerHTML = msg || '—';
    box.style.color = '#f87171';
  }

  function showResult(box, html) {
    if (!box) return;
    box.innerHTML = html;
    box.style.color = 'var(--primary)';
  }

  function fmtSimple(r) {
    if (!r.ok) return r.message || tr('errorGeneric');
    const d = r.data;
    let h = d.formula ? `${d.formula}<br>` : '';
    h += `<strong>${d.result}${d.unit ? ' ' + d.unit : ''}</strong>`;
    if (d.interpretation) {
      h += `<pre style="margin-top:10px;text-align:start;white-space:pre-wrap;font-size:0.85rem;font-weight:400;color:var(--text)">${d.interpretation}</pre>`;
    }
    return h;
  }

  function getActiveDomId() {
    return CALC_TYPES.find((c) => c.id === activeId)?.domId || 'ohm';
  }

  function activateCalc(id, enterFocus) {
    if (!CALC_TYPES.some((c) => c.id === id)) return;
    activeId = id;
    if (enterFocus !== false) focusMode = true;
    document.body.classList.toggle('calc-focus', focusMode);
    document.querySelectorAll('.calc-section').forEach((s) => {
      s.classList.toggle('active', s.id === getActiveDomId());
    });
    document.querySelectorAll('.type-card, .type-chip, .focus-chip').forEach((el) => {
      const on = el.dataset.calcId === id;
      el.classList.toggle('selected', on && el.classList.contains('type-card'));
      el.classList.toggle('active', on);
    });
    updateWorkspaceLabels();
    renderTypePickers();

    const isCurve = id === 'trip_curve';
    const calcBtn = document.getElementById('btn-calculate');
    const resBox = document.getElementById('calc-global-result');
    if (calcBtn) calcBtn.style.display = isCurve ? 'none' : '';
    if (resBox) resBox.style.display = isCurve ? 'none' : '';
    if (isCurve && window.ElectroDzTripCurve) {
      window.ElectroDzTripCurve.init();
      window.ElectroDzTripCurve.onShow();
    }
  }

  function updateWorkspaceLabels() {
    const title = document.getElementById('calc-active-title');
    const helpText = document.getElementById('calc-help-text');
    const helpTitle = document.getElementById('calc-help-title');
    const heroTitle = document.getElementById('hero-title');
    const heroSub = document.getElementById('hero-sub');
    const pickerLabel = document.getElementById('picker-label');
    const calcBtn = document.getElementById('btn-calculate');
    const resultBox = document.getElementById('calc-global-result');
    if (title) title.textContent = calcName(activeId);
    if (helpText) helpText.textContent = calcDesc(activeId);
    if (helpTitle) helpTitle.textContent = tr('helpTitle');
    if (heroTitle) heroTitle.textContent = tr('heroTitle');
    if (heroSub) heroSub.textContent = tr('heroSub');
    if (pickerLabel) pickerLabel.textContent = tr('pickerLabel');
    if (calcBtn) calcBtn.textContent = tr('btnCalculate');
    if (resultBox && !resultBox.dataset.hasResult) {
      resultBox.textContent = tr('resultPlaceholder');
    }
    const expand = document.getElementById('focus-expand');
    if (expand) expand.textContent = tr('focusGrid');
    const pg = document.getElementById('picker-grid');
    const pc = document.getElementById('picker-compact');
    if (pg) pg.textContent = tr('pickerGrid');
    if (pc) pc.textContent = tr('pickerStrip');
  }

  function renderTypePickers() {
    const lang = getLang();
    const grid = document.getElementById('types-grid');
    const strip = document.getElementById('types-strip');
    const chips = document.getElementById('focus-chips');
    if (!grid || !strip || !chips) return;

    const cardHtml = CALC_TYPES.map((c) => {
      const name = calcName(c.id);
      const sel = c.id === activeId ? ' selected' : '';
      return `<div class="type-card${sel}" data-calc-id="${c.id}" role="button" tabindex="0">
        <div class="type-icon" style="background:${c.color}22;color:${c.color}">${c.icon}</div>
        <div class="type-name">${name}</div>
      </div>`;
    }).join('');

    const chipHtml = CALC_TYPES.map((c) => {
      const name = calcName(c.id);
      const act = c.id === activeId ? ' active' : '';
      const label = c.id === activeId ? `<span>${name}</span>` : '';
      return `<div class="focus-chip${act}" data-calc-id="${c.id}" title="${name}">${c.icon}${label}</div>`;
    }).join('');

    const stripHtml = CALC_TYPES.map((c) => {
      const name = calcName(c.id);
      const act = c.id === activeId ? ' active' : '';
      return `<div class="type-chip${act}" data-calc-id="${c.id}">${c.icon} ${name}</div>`;
    }).join('');

    grid.innerHTML = cardHtml;
    strip.innerHTML = stripHtml;
    chips.innerHTML = chipHtml;

    bindPickerClicks(grid);
    bindPickerClicks(strip);
    bindPickerClicks(chips);
  }

  function bindPickerClicks(root) {
    root.querySelectorAll('[data-calc-id]').forEach((el) => {
      el.onclick = () => activateCalc(el.dataset.calcId, true);
      el.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateCalc(el.dataset.calcId, true);
        }
      };
    });
  }

  function setPickerMode(mode) {
    pickerMode = mode;
    document.body.classList.toggle('picker-compact', mode === 'compact');
    document.querySelectorAll('.picker-mode-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.picker === mode);
    });
    try {
      localStorage.setItem('electrodz-calc-picker', mode);
    } catch (_) { /* ignore */ }
  }

  function setOhmSub(mode) {
    document.getElementById('ohm-mode').value = mode;
    document.querySelectorAll('[data-ohm-sub]').forEach((b) => {
      b.classList.toggle('active', b.dataset.ohmSub === mode);
    });
    document.querySelectorAll('[data-ohm-group]').forEach((g) => {
      g.classList.toggle('show', g.getAttribute('data-ohm-group') === mode);
    });
  }

  function setPowerSub(mode) {
    document.getElementById('power-mode').value = mode;
    document.querySelectorAll('[data-power-sub]').forEach((b) => {
      b.classList.toggle('active', b.dataset.powerSub === mode);
    });
    document.querySelectorAll('[data-power-group]').forEach((g) => {
      g.classList.toggle('show', g.getAttribute('data-power-group') === mode);
    });
  }

  function setBrkSub(mode) {
    document.getElementById('breaking-mode').value = mode;
    document.querySelectorAll('[data-brk-sub]').forEach((b) => {
      b.classList.toggle('active', b.dataset.brkSub === mode);
    });
    document.querySelectorAll('[data-brk-group]').forEach((g) => {
      g.classList.toggle('show', g.getAttribute('data-brk-group') === mode);
    });
  }

  function initVoltageSelectors() {
    document.querySelectorAll('.voltage-selector').forEach((wrap) => {
      const targetId = wrap.dataset.voltageTarget;
      const hidden = document.getElementById(targetId);
      if (!hidden) return;
      wrap.querySelectorAll('.voltage-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          wrap.querySelectorAll('.voltage-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          hidden.value = btn.dataset.v;
        });
      });
    });
  }

  function performCalculation() {
    const C = window.ElectroDzCalc;
    const lang = getLang();
    const box = document.getElementById('calc-global-result');
    if (!C || !box) return;

    let r;
    switch (activeId) {
      case 'ohm_law': {
        const mode = val('ohm-mode');
        if (mode === 'voltage') {
          r = C.calculateVoltage({ current: val('ohm-i2'), resistance: val('ohm-r2'), lang });
        } else if (mode === 'current') {
          r = C.calculateIntensity({
            power: val('ohm-p'), voltage: val('ohm-u2'), cosPhi: val('ohm-cos2') || '1', lang,
          });
        } else {
          r = C.calculateResistance({ voltage: val('ohm-u3'), current: val('ohm-i3'), lang });
        }
        break;
      }
      case 'power_energy':
        if (val('power-mode') === 'energy') {
          r = C.calculateEnergy({ power: val('pe-p'), time: val('pe-t'), lang });
        } else {
          r = C.calculatePower({
            current: val('power-i'), voltage: val('power-u'), cosPhi: val('power-cos') || '1', lang,
          });
        }
        break;
      case 'copper_resistance':
        r = C.calculateCopperResistance({
          length: val('copper-l'), section: val('copper-s'), temperature: val('copper-t'), lang,
        });
        break;
      case 'voltage_drop':
        r = C.calculateVoltageDrop({
          current: val('drop-i'), length: val('drop-l'), section: val('drop-s'),
          voltage: val('drop-u'), conductorType: val('drop-conductor') || 'Cu', lang,
        });
        break;
      case 'cable_section':
        r = C.calculateCableSection({
          current: val('section-i'), length: val('section-l'), voltage: val('section-u'),
          cosPhi: val('section-cos') || '0.85', temperature: val('section-temp') || '30',
          circuitCount: val('section-circuits') || '1', conductorType: val('section-conductor') || 'Cu',
          insulationType: val('section-insulation') || 'PVC', selectedMethod: val('section-method') || 'B1', lang,
        });
        break;
      case 'selectivity':
        r = C.calculateSelectivity({
          upstreamBreaker: val('sel-up-b'), downstreamBreaker: val('sel-down-b'),
          upstreamCurve: val('sel-up-c'), downstreamCurve: val('sel-down-c'),
          upstreamDDRType: val('sel-up-ddr'), downstreamDDRType: val('sel-down-ddr'),
          isSelectiveDDR: document.getElementById('sel-chrono')?.checked, lang,
        });
        break;
      case 'icc':
        r = C.calculateICC({
          transfoKva: val('icc-kva'), transfoUcc: val('icc-ucc') || '4',
          upstreamPcc: val('icc-pcc') || '500', length: val('icc-l'), section: val('icc-s'),
          voltage: val('icc-u'), conductorType: val('icc-conductor') || 'Cu', lang,
        });
        break;
      case 'breaking_time': {
        const mode = val('breaking-mode');
        r = C.calculateBreakingTime(
          mode === 'device'
            ? {
                subMode: 'device', deviceIn: val('brk-in'), deviceCurve: val('brk-curve'),
                deviceIk: val('brk-ik'), lang,
              }
            : {
                subMode: 'normative', earthing: val('brk-earth'), u0: val('brk-u0'),
                circuitKind: val('brk-circuit'), lang,
              }
        );
        break;
      }
      case 'power_balance': {
        const rows = [];
        document.querySelectorAll('[data-balance-row]').forEach((row) => {
          rows.push({
            label: row.querySelector('.bal-label')?.value || '',
            p: row.querySelector('.bal-p')?.value || '',
            ku: row.querySelector('.bal-ku')?.value || '1',
            ks: row.querySelector('.bal-ks')?.value || '1',
          });
        });
        r = C.calculatePowerBalance({
          rows, voltage: val('balance-u'), cosPhi: val('balance-cos') || '0.9', lang,
        });
        break;
      }
      default:
        return;
    }

    box.dataset.hasResult = '1';
    if (r.error) showError(box, r.message);
    else if (!r.ok) showError(box, r.message);
    else {
      let h = fmtSimple(r);
      if (r.data.additionalData?.ibA) {
        h += `<br>${tr('balanceIbApprox')} <strong>${r.data.additionalData.ibA} ${tr('unitA')}</strong>`;
      }
      showResult(box, h);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    mergeCalc();
    if (!window.ElectroDzCalc?.calculatePower) {
      console.error('Calculateur non chargé');
      return;
    }

    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = getLang() === 'fr' ? 'AR' : 'FR';

    try {
      const saved = localStorage.getItem('electrodz-calc-picker');
      if (saved === 'compact' || saved === 'grid') setPickerMode(saved);
    } catch (_) { /* ignore */ }

    applyI18n();
    activateCalc('ohm_law', false);

    document.getElementById('picker-grid')?.addEventListener('click', () => setPickerMode('grid'));
    document.getElementById('picker-compact')?.addEventListener('click', () => setPickerMode('compact'));
    document.getElementById('focus-expand')?.addEventListener('click', () => {
      focusMode = false;
      document.body.classList.remove('calc-focus');
    });

    document.querySelectorAll('[data-ohm-sub]').forEach((b) => {
      b.addEventListener('click', () => setOhmSub(b.dataset.ohmSub));
    });
    document.querySelectorAll('[data-power-sub]').forEach((b) => {
      b.addEventListener('click', () => setPowerSub(b.dataset.powerSub));
    });
    document.querySelectorAll('[data-brk-sub]').forEach((b) => {
      b.addEventListener('click', () => setBrkSub(b.dataset.brkSub));
    });

    initVoltageSelectors();
    setOhmSub('voltage');
    setPowerSub('power');
    setBrkSub('normative');

    document.getElementById('btn-calculate')?.addEventListener('click', performCalculation);
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      setLang(getLang() === 'fr' ? 'ar' : 'fr');
    });
  });
})();
