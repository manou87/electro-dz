/**
 * Catalogue courbes constructeur — Schneider, ABB, Hager (sources publiques, traçabilité pro).
 */
(function (g) {
  'use strict';

  const INDEX_URL = 'data/trip-curves/index.json';
  const METHODOLOGY_URL = 'data/trip-curves/methodology.json';
  const VALIDATION_URL = 'data/trip-curves/pro-validation.json';
  const BRANDS = ['schneider', 'abb', 'hager'];
  const LS_OVERRIDE_PREFIX = 'electrodz-trip-catalog-';

  let index = null;
  let catalog = null;
  let methodology = null;
  let proValidation = null;
  let loadPromise = null;
  let currentBrand = 'schneider';
  let hasLocalOverride = false;

  function fetchJson(url) {
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  function loadProMeta() {
    if (methodology && proValidation) return Promise.resolve({ methodology, proValidation });
    return Promise.all([
      fetchJson(METHODOLOGY_URL).catch(() => null),
      fetchJson(VALIDATION_URL).catch(() => null),
    ]).then(([m, v]) => {
      methodology = m;
      proValidation = v;
      return { methodology: m, proValidation: v };
    });
  }

  function lang() {
    try {
      const s = localStorage.getItem('electrodz-site-lang');
      if (s === 'fr' || s === 'ar' || s === 'en') return s;
    } catch (_) { /* ignore */ }
    return 'ar';
  }
  function tr(key) {
    const I = g.ElectroDzCalcI18n;
    return I ? I.t(lang(), key) : key;
  }
  function familyLabel(f) {
    const key = 'tcMfgFam_' + getBrandId() + '_' + f.id;
    let lbl = tr(key);
    if (lbl === key) lbl = tr('tcMfgFam_' + f.id);
    if (lbl.startsWith('tcMfgFam_')) lbl = f.label;
    return lbl;
  }
  function tripUnitLabel(t) {
    const raw = t?.label || '';
    const m = /^Courbe\s+(\S+)$/i.exec(raw.trim());
    if (m) return tr('tcCurveWord') + ' ' + m[1];
    return raw;
  }
  function brandLabel(b) {
    const map = { schneider: 'tcBrandSchneider', abb: 'tcBrandAbb', hager: 'tcBrandHager' };
    const key = map[b.id];
    if (!key) return b.label;
    const lbl = tr(key);
    return !lbl || lbl === key ? b.label : lbl;
  }
  function trTpl(key, vars) {
    return tr(key).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }

  function inRatingsForDevice(dev) {
    if (!dev?.inRatings?.length) return [];
    const frame = Number(dev.frameA);
    if (!Number.isFinite(frame)) return dev.inRatings;
    const list = dev.inRatings.filter((n) => n > 0 && n <= frame);
    return list.length ? list : dev.inRatings;
  }

  function pickInForDevice(dev, prevIn) {
    const ratings = inRatingsForDevice(dev);
    if (!ratings.length) return '';
    const prev = prevIn != null ? parseFloat(prevIn) : NaN;
    if (Number.isFinite(prev) && ratings.some((n) => n === prev)) return String(prev);
    const frame = Number(dev.frameA);
    if (Number.isFinite(frame) && ratings.includes(frame)) return String(frame);
    const below = ratings.filter((n) => n <= frame);
    if (below.length) return String(below[below.length - 1]);
    return String(ratings[ratings.length - 1]);
  }

  function updateMfgInHint(dev) {
    const hint = document.getElementById('tc-mfg-in-hint');
    if (!hint) return;
    if (!dev || !dev.inRatings?.length) {
      hint.hidden = true;
      hint.textContent = '';
      return;
    }
    const ratings = inRatingsForDevice(dev);
    hint.hidden = false;
    hint.textContent = trTpl('tcMfgInHint', {
      ref: dev.label,
      frame: dev.frameA,
      min: ratings[0],
      max: ratings[ratings.length - 1],
    });
  }

  function expandCatalog(data) {
    if (!data || !data.tripUnits) return data;
    const templates = data.tripUnits;
    data.devices = (data.devices || []).map((dev) => {
      const ids = dev.tripUnitIds || [];
      const tripUnits = ids.map((id) => templates[id]).filter(Boolean);
      const frame = Number(dev.frameA);
      let inRatings = dev.inRatings || [];
      if (Number.isFinite(frame) && inRatings.length) {
        const clamped = inRatings.filter((n) => n > 0 && n <= frame);
        if (clamped.length) inRatings = clamped;
      }
      return { ...dev, inRatings, tripUnits };
    });
    return data;
  }

  function getLocalOverride(brandId) {
    try {
      const raw = localStorage.getItem(LS_OVERRIDE_PREFIX + brandId);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function mergeCatalogData(base, patch) {
    if (!patch) return base;
    const out = {
      ...base,
      source: patch.source || base.source,
      revision: patch.revision || base.revision,
      tripUnits: { ...(base.tripUnits || {}) },
      devices: [...(base.devices || [])],
      families: patch.families?.length ? patch.families : base.families,
    };
    if (patch.tripUnits) Object.assign(out.tripUnits, patch.tripUnits);
    const byId = new Map(out.devices.map((d) => [d.id, d]));
    (patch.devices || []).forEach((d) => {
      const prev = byId.get(d.id);
      if (prev) byId.set(d.id, { ...prev, ...d });
      else byId.set(d.id, d);
    });
    out.devices = [...byId.values()];
    out.brandId = base.brandId || patch.brandId;
    out.brand = patch.brand || base.brand;
    out.breakerCount = out.devices.filter((x) => x.kind !== 'switch').length;
    return out;
  }

  function applyBrandOverride(data, brandId) {
    const patch = getLocalOverride(brandId);
    hasLocalOverride = !!patch;
    if (!patch) return data;
    return mergeCatalogData(data, patch);
  }

  function setLocalOverride(brandId, patch) {
    if (!patch) {
      localStorage.removeItem(LS_OVERRIDE_PREFIX + brandId);
      hasLocalOverride = false;
      return;
    }
    localStorage.setItem(LS_OVERRIDE_PREFIX + brandId, JSON.stringify(patch));
    hasLocalOverride = true;
  }

  function clearLocalOverride(brandId) {
    const bid = brandId || getBrandId();
    localStorage.removeItem(LS_OVERRIDE_PREFIX + bid);
    hasLocalOverride = false;
    catalog = null;
    return reloadCatalog();
  }

  function importCatalogFromFile(file) {
    if (!file) return Promise.reject(new Error('no file'));
    return file.text().then((text) => {
      const patch = JSON.parse(text);
      const bid = patch.brandId || getBrandId();
      if (!BRANDS.includes(bid)) throw new Error('brand');
      setLocalOverride(bid, patch);
      if (bid !== getBrandId()) {
        const brandEl = document.getElementById('tc-mfg-brand');
        if (brandEl) brandEl.value = bid;
      }
      catalog = null;
      return reloadCatalog();
    });
  }

  function updateImportStatus() {
    const el = document.getElementById('tc-custom-catalog-status');
    if (!el) return;
    el.textContent = hasLocalOverride ? tr('tcCustomCatalogActive') : '';
  }

  function getActiveTripUnit() {
    const dev = findDevice(document.getElementById('tc-mfg-device')?.value);
    return findTripUnit(dev, document.getElementById('tc-mfg-trip')?.value);
  }

  function scaleAnchorsByTr(anchors, trSec, refTr) {
    if (!anchors?.length || !trSec || trSec === refTr) return anchors;
    const k = trSec / refTr;
    return anchors.map(([m, t]) => [m, t >= 1e5 ? t : Math.max(t * k, 0.001)]);
  }

  function snapCatalogTsd(v, spec) {
    const vals = spec?.values;
    if (!vals?.length) return v;
    if (!Number.isFinite(v)) return spec.default;
    let best = vals[0];
    let d = Math.abs(v - best);
    vals.forEach((x) => {
      const dd = Math.abs(v - x);
      if (dd < d) { d = dd; best = x; }
    });
    return best;
  }

  function formatTsdOption(sec) {
    if (sec < 0.01) return `${Math.round(sec * 1000)} ms`;
    return `${String(sec).replace('.', ',')} s`;
  }

  function formatTsdCatalogList(spec) {
    if (!spec?.values?.length) return '';
    return spec.values.map(formatTsdOption).join(' · ');
  }

  function setTsdControlValue(sec, spec) {
    const tsdEl = document.getElementById('tc-tsd');
    const selectEl = document.getElementById('tc-tsd-select');
    const rangeEl = document.getElementById('tc-tsd-range');
    const v = snapCatalogTsd(sec, spec);
    if (tsdEl) tsdEl.value = String(v);
    if (selectEl && spec?.values?.length) {
      selectEl.value = String(v);
      if (!selectEl.value && selectEl.options.length) {
        selectEl.selectedIndex = 0;
        if (tsdEl) tsdEl.value = selectEl.value;
      }
    }
    if (rangeEl && spec?.values?.length) {
      const idx = spec.values.findIndex((x) => Math.abs(x - v) < 1e-9);
      rangeEl.value = String(idx >= 0 ? idx : 0);
    }
  }

  function getActiveTsdSpec() {
    if (getMode() !== 'mfg') {
      const cat = document.getElementById('tc-mccb-cat')?.value;
      const ref = document.getElementById('tc-ref-model')?.value;
      if (cat === 'B' || ref === 'mccb-b') {
        return {
          min: 0.001,
          max: 0.4,
          step: 0.001,
          default: 0.2,
          values: [0.001, 0.005, 0.1, 0.2, 0.3, 0.4],
        };
      }
      return null;
    }
    return getActiveTripUnit()?.settings?.tsd || null;
  }

  function stepTsd(delta) {
    const spec = getActiveTsdSpec();
    if (!spec) return;
    const tsdEl = document.getElementById('tc-tsd');
    const selectEl = document.getElementById('tc-tsd-select');
    const cur = parseFloat(selectEl?.value || tsdEl?.value || String(spec.default));
    if (spec.values?.length) {
      const vals = spec.values;
      let idx = vals.findIndex((x) => Math.abs(x - cur) < 1e-9);
      if (idx < 0) idx = vals.indexOf(spec.default);
      if (idx < 0) idx = 0;
      idx = Math.min(Math.max(idx + delta, 0), vals.length - 1);
      setTsdControlValue(vals[idx], spec);
      return;
    }
    const step = spec.step > 0 ? spec.step : 0.05;
    let v = (Number.isFinite(cur) ? cur : spec.default) + delta * step;
    v = Math.min(Math.max(v, spec.min), spec.max);
    v = Math.round(v * 1000) / 1000;
    setTsdControlValue(v, spec);
  }

  /** Liste déroulante + curseur + champ numérique (catalogue constructeur). */
  function applyTsdInputBounds(tsdEl, spec) {
    const hintEl = document.getElementById('tc-tsd-range-hint');
    const selectEl = document.getElementById('tc-tsd-select');
    const rangeEl = document.getElementById('tc-tsd-range');
    const stepper = document.getElementById('tc-tsd-stepper');
    const decBtn = document.getElementById('tc-tsd-dec');
    const incBtn = document.getElementById('tc-tsd-inc');
    if (!tsdEl || !spec) {
      if (hintEl) { hintEl.hidden = true; hintEl.textContent = ''; }
      return;
    }
    const vals = spec.values;
    const fixed = !!spec.fixed || (vals?.length === 1);
    const discrete = !!(vals?.length);
    if (discrete) {
      tsdEl.min = Math.min(...vals);
      tsdEl.max = Math.max(...vals);
      const step = vals.length > 1
        ? Math.min(...vals.slice(1).map((v, i) => Math.abs(v - vals[i])))
        : 0.001;
      tsdEl.step = step > 0 ? step : (vals.some((x) => x < 0.01) ? 0.001 : 0.01);
      tsdEl.readOnly = fixed;
      setTsdControlValue(parseFloat(tsdEl.value) || spec.default, spec);
      if (selectEl) {
        selectEl.innerHTML = vals.map((v) =>
          `<option value="${v}">${formatTsdOption(v)}</option>`).join('');
        selectEl.hidden = false;
        selectEl.disabled = fixed;
        setTsdControlValue(parseFloat(tsdEl.value), spec);
      }
      if (rangeEl) {
        rangeEl.min = 0;
        rangeEl.max = String(vals.length - 1);
        rangeEl.step = 1;
        rangeEl.hidden = fixed;
        rangeEl.disabled = fixed;
        const idx = vals.findIndex((x) => Math.abs(x - parseFloat(tsdEl.value)) < 1e-9);
        rangeEl.value = String(idx >= 0 ? idx : 0);
      }
      tsdEl.hidden = true;
      if (hintEl) {
        hintEl.hidden = false;
        hintEl.textContent = fixed
          ? tr('tcTsdFixed') + (spec.source ? ` — ${spec.source}` : '')
          : trTpl('tcTsdRangeHint', { min: formatTsdOption(tsdEl.min), values: formatTsdCatalogList(spec) });
      }
    } else {
      tsdEl.hidden = false;
      if (selectEl) selectEl.hidden = true;
      tsdEl.readOnly = false;
      tsdEl.min = spec.min;
      tsdEl.max = spec.max;
      tsdEl.step = spec.step;
      if (!tsdEl.value) tsdEl.value = String(spec.default);
      if (selectEl) selectEl.innerHTML = '';
      if (rangeEl) rangeEl.hidden = true;
      if (hintEl) {
        hintEl.hidden = false;
        hintEl.textContent = trTpl('tcTsdRangeHint', {
          min: `${spec.min} s`,
          values: `${spec.min}–${spec.max} s`,
        });
      }
    }
    if (stepper) stepper.hidden = false;
    if (decBtn) decBtn.disabled = fixed;
    if (incBtn) incBtn.disabled = fixed;
  }

  let tsdStepperBound = false;
  function bindTsdStepperUI(onChange) {
    if (tsdStepperBound) return;
    tsdStepperBound = true;
    const fire = () => {
      const spec = getActiveTsdSpec();
      if (spec) applyTsdInputBounds(document.getElementById('tc-tsd'), spec);
      updateProvenancePanel();
      if (onChange) onChange();
    };
    document.getElementById('tc-tsd-dec')?.addEventListener('click', () => { stepTsd(-1); fire(); });
    document.getElementById('tc-tsd-inc')?.addEventListener('click', () => { stepTsd(1); fire(); });
    document.getElementById('tc-tsd-select')?.addEventListener('change', () => {
      const spec = getActiveTsdSpec();
      const sel = document.getElementById('tc-tsd-select');
      if (spec && sel) setTsdControlValue(parseFloat(sel.value), spec);
      fire();
    });
    document.getElementById('tc-tsd-range')?.addEventListener('input', () => {
      const spec = getActiveTsdSpec();
      const vals = spec?.values;
      const rangeEl = document.getElementById('tc-tsd-range');
      if (!vals?.length || !rangeEl || spec?.fixed) return;
      const i = Math.min(Math.max(parseInt(rangeEl.value, 10) || 0, 0), vals.length - 1);
      setTsdControlValue(vals[i], spec);
      fire();
    });
  }

  function updateSettingsLive() {
    /* Récap Isd/Tsd : panneau sous le graphe (tc-isd-live / tc-tsd-live). */
  }

  function getValidationTools(brandId) {
    const bid = brandId || getBrandId();
    const b = proValidation?.brands?.[bid];
    if (!b?.tools?.length) return [];
    const L = lang();
    return b.tools.map((t) => ({
      id: t.id,
      title: L === 'ar'
        ? (t.titleAr || t.titleFr)
        : L === 'en'
          ? (t.titleEn || t.titleFr || t.title)
          : (t.titleFr || t.title),
      url: t.url,
    }));
  }

  function updateProvenancePanel() {
    const panel = document.getElementById('tc-mfg-provenance');
    const proOpen = document.getElementById('tc-pro') && !document.getElementById('tc-pro').hasAttribute('hidden');
    if (!panel || !proOpen) {
      if (panel) panel.innerHTML = '';
      return;
    }
    const tu = getActiveTripUnit();
    const dev = findDevice(document.getElementById('tc-mfg-device')?.value);
    const lines = [];
    if (tu?.curveSource) {
      lines.push(`<p class="tc-prov-source"><strong>${tr('tcProvSource')}:</strong> ${tu.curveSource}</p>`);
    }
    if (dev && tu) {
      const inA = document.getElementById('tc-mfg-in')?.value || '';
      lines.push(`<p class="tc-prov-sel"><strong>${tr('tcProvSelection')}:</strong> ${dev.label} · In ${inA} A · ${tu.label}</p>`);
    }
    if (catalog?.revision) {
      lines.push(`<p class="tc-prov-rev">${trTpl('tcProvRevision', { rev: catalog.revision })}</p>`);
    }
    const tools = getValidationTools();
    if (tools.length) {
      const links = tools.map((t) =>
        `<a class="tc-mini-btn" href="${t.url}" target="_blank" rel="noopener">${t.title}</a>`).join('');
      lines.push(`<div class="tc-prov-tools"><span class="tc-prov-tools-label">${tr('tcValidateMfg')}</span>${links}</div>`);
    }
    panel.innerHTML = lines.join('') || `<p class="tc-prov-lead">${tr('tcMfgDisclaimer')}</p>`;
  }

  function getBrandId() {
    const el = document.getElementById('tc-mfg-brand');
    const v = el?.value || currentBrand;
    return BRANDS.includes(v) ? v : 'schneider';
  }

  function catalogUrl(brandId) {
    const entry = index?.brands?.find((b) => b.id === brandId);
    return 'data/trip-curves/' + (entry?.file || `${brandId}.json`);
  }

  function loadCatalog(brandId) {
    const bid = brandId || getBrandId();
    if (catalog && catalog.brandId === bid) return Promise.resolve(catalog);

    return fetch(INDEX_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((idx) => {
        index = idx;
        return fetch(catalogUrl(bid));
      })
      .then((r) => {
        if (!r.ok) throw new Error('catalog fetch');
        return r.json();
      })
      .then((data) => {
        data.brandId = bid;
        catalog = expandCatalog(applyBrandOverride(data, bid));
        currentBrand = bid;
        updateImportStatus();
        return catalog;
      })
      .catch(() => {
        catalog = null;
        showCatalogLoadError();
        return null;
      });
  }

  function showCatalogLoadError() {
    const hint = document.getElementById('tc-settings-hint');
    if (hint) {
      hint.style.color = '#fde68a';
      hint.textContent = tr('tcNeedLocalServer');
    }
  }

  function reloadCatalog(onReady) {
    catalog = null;
    return loadCatalog(getBrandId()).then((data) => {
      if (data) initMfgSelectors();
      if (onReady) onReady();
      return data;
    });
  }

  function getCatalog() { return catalog; }

  function findDevice(deviceId) {
    if (!catalog) return null;
    return catalog.devices.find((d) => d.id === deviceId) || null;
  }

  function findTripUnit(device, tripUnitId) {
    if (!device) return null;
    return device.tripUnits.find((t) => t.id === tripUnitId) || null;
  }

  /** Mode documentation constructeur (sources publiques) */
  function getMode() {
    const el = document.getElementById('tc-mode');
    const v = el?.value;
    return v === 'mfg' || v === 'schneider' ? 'mfg' : 'norm';
  }

  function fillSelect(el, options, valueKey, labelKey) {
    if (!el) return;
    el.innerHTML = options.map((o) => {
      const v = typeof o === 'object' ? o[valueKey] : o;
      const lbl = typeof o === 'object' ? o[labelKey] : String(o);
      return `<option value="${v}">${lbl}</option>`;
    }).join('');
  }

  function getMfgScope() {
    return document.getElementById('tc-mfg-scope')?.value === 'acb' ? 'acb' : 'catalog';
  }

  function setMfgScope(scope) {
    const el = document.getElementById('tc-mfg-scope');
    if (el) el.value = scope === 'acb' ? 'acb' : 'catalog';
  }

  function devicesForScope(devices) {
    const scope = getMfgScope();
    return (devices || []).filter((d) => {
      if (scope === 'acb') return d.deviceType === 'acb';
      return d.deviceType !== 'acb';
    });
  }

  function getFilteredDevices() {
    if (!catalog) return [];
    const fam = document.getElementById('tc-mfg-family')?.value || 'all';
    const q = (document.getElementById('tc-mfg-filter')?.value || '').trim().toLowerCase();
    return devicesForScope(catalog.devices).filter((d) => {
      if (fam !== 'all' && d.family !== fam) return false;
      if (q && !(d.label + ' ' + (d.group || '') + ' ' + (d.id || '')).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function fillDeviceSelect(el, devices) {
    if (!el || !devices) return;
    const prev = el.value;
    const fam = document.getElementById('tc-mfg-family')?.value || 'all';
    const q = (document.getElementById('tc-mfg-filter')?.value || '').trim().toLowerCase();
    let list = devicesForScope(devices);
    if (fam !== 'all') list = list.filter((d) => d.family === fam);
    if (q) list = list.filter((d) => (d.label + ' ' + (d.group || '') + ' ' + d.id).toLowerCase().includes(q));

    const groups = new Map();
    list.forEach((d) => {
      const gn = d.group || tr('tcMfgGroupOther');
      if (!groups.has(gn)) groups.set(gn, []);
      groups.get(gn).push(d);
    });
    let html = '';
    groups.forEach((items, groupName) => {
      html += `<optgroup label="${groupName}">`;
      items.forEach((d) => {
        const suffix = d.kind === 'switch' ? ` (${tr('tcMfgSwitch')})` : '';
        html += `<option value="${d.id}">${d.label}${suffix}</option>`;
      });
      html += '</optgroup>';
    });
    el.innerHTML = html || `<option value="">${tr('tcMfgNoMatch')}</option>`;
    if (prev && list.some((d) => d.id === prev)) el.value = prev;
    else if (list.length && !list.find((d) => d.id === el.value)) {
      el.value = list.find((d) => d.kind !== 'switch')?.id || list[0].id;
    }
  }

  function updateMfgDisclaimer() {
    const box = document.getElementById('tc-mfg-disclaimer');
    if (box) box.hidden = true;
    updateProvenancePanel();
  }

  /**
   * tr (long retard @ 6·Ir) : réservé aux organes Micrologic électroniques réglables.
   * Pas MCB IEC 60898, pas TM-D/G, pas MA, pas mode norme CEI.
   */
  function tripUnitSupportsTr(tu) {
    return !!(
      tu
      && !tu.mcb
      && tu.supportsTr === true
      && tu.settings?.tr
      && /^micrologic_/i.test(String(tu.id || ''))
    );
  }

  /** Au moins un réglage réel sur l’organe (pas MCB / pas courbe fixe seule). */
  function deviceHasAdjustableThresholds(dev, tu) {
    if (!dev || !tu || dev.deviceType === 'mcb' || tu.mcb || !tu.settings) return false;
    const s = tu.settings;
    return !!(
      (!tu.fixedIr && s.ir)
      || (tu.hasShortTime && s.isd && s.tsd)
      || tripUnitSupportsTr(tu)
      || s.ii
    );
  }

  function formHasAdjustableThresholds() {
    if (getMode() !== 'mfg') return false;
    const dev = findDevice(document.getElementById('tc-mfg-device')?.value);
    const tu = findTripUnit(dev, document.getElementById('tc-mfg-trip')?.value);
    return deviceHasAdjustableThresholds(dev, tu);
  }

  function setGroupVisible(el, show) {
    if (!el) return;
    if (show) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  }

  function syncMfgCascade() {
    const devEl = document.getElementById('tc-mfg-device');
    const inEl = document.getElementById('tc-mfg-in');
    const tuEl = document.getElementById('tc-mfg-trip');
    if (!catalog || !devEl) return;

    const dev = findDevice(devEl.value);
    if (!dev) return;

    const prevIn = inEl?.value;
    const ratings = inRatingsForDevice(dev);
    fillSelect(inEl, ratings.map((n) => ({
      v: n,
      l: n === dev.frameA ? `${n} A — ${tr('tcInFrameNom')}` : `${n} A`,
    })), 'v', 'l');
    inEl.value = pickInForDevice(dev, prevIn);
    updateMfgInHint(dev);
    const tuWrap = document.getElementById('tc-mfg-trip-group');
    if (dev.kind === 'switch' || !dev.tripUnits.length) {
      if (tuWrap) tuWrap.style.display = 'none';
      const hint = document.getElementById('tc-settings-hint');
      if (hint) hint.textContent = tr('tcMfgSwitchHint');
      return;
    }
    if (tuWrap) tuWrap.style.display = '';
    const hint = document.getElementById('tc-settings-hint');
    if (hint && (hint.textContent === tr('tcMfgSwitchHint') || hint.textContent === tr('tcMcbNoAdjustHint'))) {
      hint.textContent = '';
    }
    const prevTu = tuEl?.value;
    fillSelect(tuEl, dev.tripUnits.map((t) => ({ id: t.id, label: tripUnitLabel(t) })), 'id', 'label');
    if (prevTu && dev.tripUnits.some((t) => t.id === prevTu)) tuEl.value = prevTu;
    syncMfgSettings();
    updateProvenancePanel();
  }

  function syncMfgSettings() {
    const devEl = document.getElementById('tc-mfg-device');
    const tuEl = document.getElementById('tc-mfg-trip');
    const irEl = document.getElementById('tc-ir');
    const isdEl = document.getElementById('tc-isd');
    const tsdEl = document.getElementById('tc-tsd');
    const iiEl = document.getElementById('tc-ii');
    const iiOffEl = document.getElementById('tc-ii-off');
    const isdGroup = document.getElementById('tc-isd-group');
    const tsdGroup = document.getElementById('tc-tsd-group');
    const iiGroup = document.getElementById('tc-ii-group');
    const irGroup = document.getElementById('tc-ir-group');
    const trGroup = document.getElementById('tc-tr-group');
    const trEl = document.getElementById('tc-tr');

    const dev = findDevice(devEl?.value);
    const tu = findTripUnit(dev, tuEl?.value);
    if (!tu) return;

    const isMcb = dev.deviceType === 'mcb' || tu.mcb;
    const trHint = document.getElementById('tc-tr-hint');
    const hint = document.getElementById('tc-settings-hint');
    if (isMcb) {
      setGroupVisible(irGroup, false);
      setGroupVisible(trGroup, false);
      setGroupVisible(isdGroup, false);
      setGroupVisible(tsdGroup, false);
      setGroupVisible(iiGroup, false);
      if (hint) hint.textContent = tr('tcMcbNoAdjustHint');
      updateProvenancePanel();
      updateSettingsLive();
      if (g.ElectroDzTripCurve?.syncGraphThresholdsPanel) g.ElectroDzTripCurve.syncGraphThresholdsPanel();
      return;
    }

    const s = tu.settings;
    const fixedIr = tu.fixedIr;
    const showTr = tripUnitSupportsTr(tu);
    const hasSt = !!(tu.hasShortTime && s?.isd && s?.tsd);
    setGroupVisible(irGroup, !fixedIr && !!s?.ir);
    setGroupVisible(trGroup, showTr);
    if (trHint) trHint.hidden = !showTr;
    if (showTr && trEl && s?.tr) {
      trEl.innerHTML = s.tr.values.map((v) => `<option value="${v}">${v} s</option>`).join('');
      if (!trEl.value || !s.tr.values.some((v) => String(v) === trEl.value)) {
        trEl.value = String(s.tr.default);
      }
    }

    if (!s) return;
    if (irEl && s.ir) {
      irEl.min = s.ir.min;
      irEl.max = s.ir.max;
      irEl.step = s.ir.step;
      if (!irEl.value || parseFloat(irEl.value) < s.ir.min) irEl.value = s.ir.default;
    }
    setGroupVisible(isdGroup, hasSt);
    setGroupVisible(tsdGroup, hasSt);
    if (isdEl && s.isd) {
      isdEl.min = s.isd.min;
      isdEl.max = s.isd.max;
      isdEl.step = s.isd.step;
      if (!isdEl.value) isdEl.value = s.isd.default;
    }
    if (tsdEl && s.tsd) applyTsdInputBounds(tsdEl, s.tsd);
    setGroupVisible(iiGroup, !!s.ii);
    if (iiEl && s.ii) {
      iiEl.min = s.ii.min;
      iiEl.max = s.ii.max;
      iiEl.step = s.ii.step;
      if (!iiEl.value) iiEl.value = s.ii.default;
      if (iiOffEl) {
        iiOffEl.style.display = s.ii.off ? '' : 'none';
        iiEl.disabled = !!(s.ii.off && iiOffEl.checked);
      }
    }
    updateProvenancePanel();
    updateSettingsLive();
    if (g.ElectroDzTripCurve?.syncGraphThresholdsPanel) g.ElectroDzTripCurve.syncGraphThresholdsPanel();
  }

  function syncModeUI() {
    const mode = getMode();
    const mfgRef = document.getElementById('tc-ref-mfg');
    const disclaimer = document.getElementById('tc-mfg-disclaimer');
    const note = document.querySelector('#tripcurve .tc-note');

    // Masquer le bloc norme en mode catalogue ; ne pas forcer display:'' sur les
    // champs déjà [hidden] (ex. retard fusible hors type Fusible).
    document.querySelectorAll('.tc-norm-only').forEach((el) => {
      if (mode === 'mfg' || mode === 'schneider') {
        el.style.display = 'none';
      } else {
        el.style.removeProperty('display');
      }
    });
    if (mfgRef) {
      if (mode === 'mfg') mfgRef.classList.remove('tc-mfg-hidden');
      else mfgRef.classList.add('tc-mfg-hidden');
    }
    if (disclaimer) disclaimer.hidden = true;
    if (mode === 'mfg') {
      updateMfgDisclaimer();
      updateImportStatus();
    }

    if (mode === 'mfg') {
      const hint = document.getElementById('tc-settings-hint');
      if (hint) hint.textContent = getMfgScope() === 'acb' ? tr('tcKindAcbHint') : '';
      if (catalog) {
        refreshMfgBrandOptions();
        refreshMfgFamilyOptions();
        fillDeviceSelect(document.getElementById('tc-mfg-device'), catalog.devices);
      }
      syncMfgCascade();
      if (g.ElectroDzTripCurve?.syncGraphThresholdsPanel) g.ElectroDzTripCurve.syncGraphThresholdsPanel();
      if (note && g.ElectroDzCalcI18n) note.textContent = tr('tcNoteMfg');
    } else {
      ['tc-tr-group', 'tc-ir-group', 'tc-isd-group', 'tc-tsd-group', 'tc-ii-group'].forEach((id) => {
        setGroupVisible(document.getElementById(id), false);
      });
      if (g.ElectroDzTripCurve?.applyRefModel) g.ElectroDzTripCurve.applyRefModel();
      if (g.ElectroDzTripCurve?.syncNormDeviceUI) g.ElectroDzTripCurve.syncNormDeviceUI();
      if (g.ElectroDzTripCurve?.syncGraphThresholdsPanel) g.ElectroDzTripCurve.syncGraphThresholdsPanel();
      if (note && g.ElectroDzCalcI18n) note.textContent = tr('tcNote');
    }
    syncKindCardsUI();
  }

  function kindFromForm() {
    const mode = getMode();
    if (mode === 'mfg' || mode === 'schneider') {
      return getMfgScope() === 'acb' ? 'acb' : 'mfg';
    }
    const ref = document.getElementById('tc-ref-model')?.value || 'mcb';
    if (ref === 'mccb-a' || ref === 'mccb-b') return 'mccb';
    if (ref === 'gg' || ref === 'am' || ref === 't') return 'fuse';
    return 'mcb';
  }

  function syncKindCardsUI() {
    const kind = kindFromForm();
    const ref = document.getElementById('tc-ref-model')?.value || 'mcb';
    const kindEl = document.getElementById('tc-kind');
    if (kindEl && kindEl.value !== kind) kindEl.value = kind;
    const mccbSub = document.getElementById('tc-kind-mccb-sub');
    const fuseSub = document.getElementById('tc-kind-fuse-sub');
    if (mccbSub) mccbSub.hidden = kind !== 'mccb';
    if (fuseSub) fuseSub.hidden = kind !== 'fuse';
    document.querySelectorAll('#tc-kind-mccb-sub .tc-kind-pill, #tc-kind-fuse-sub .tc-kind-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tcRef === ref);
    });
  }

  function applyProtectionKind(kind) {
    const modeEl = document.getElementById('tc-mode');
    const refEl = document.getElementById('tc-ref-model');
    if (!modeEl || !refEl) return;
    if (kind === 'mfg' || kind === 'acb') {
      modeEl.value = 'mfg';
      setMfgScope(kind === 'acb' ? 'acb' : 'catalog');
    } else {
      modeEl.value = 'norm';
      setMfgScope('catalog');
      if (kind === 'mcb') refEl.value = 'mcb';
      else if (kind === 'mccb') {
        if (refEl.value !== 'mccb-a' && refEl.value !== 'mccb-b') refEl.value = 'mccb-a';
      } else if (kind === 'fuse') {
        if (refEl.value !== 'gg' && refEl.value !== 'am' && refEl.value !== 't') refEl.value = 'gg';
      }
    }
    syncModeUI();
  }

  function applyProtectionRef(ref) {
    const modeEl = document.getElementById('tc-mode');
    const refEl = document.getElementById('tc-ref-model');
    if (!modeEl || !refEl || !ref) return;
    modeEl.value = 'norm';
    refEl.value = ref;
    syncModeUI();
  }

  function initMfgSelectors() {
    if (!catalog) return;
    const devEl = document.getElementById('tc-mfg-device');
    const famEl = document.getElementById('tc-mfg-family');
    const filterEl = document.getElementById('tc-mfg-filter');
    const countEl = document.getElementById('tc-mfg-count');

    refreshMfgFamilyOptions();

    const applyFilter = () => {
      fillDeviceSelect(devEl, catalog.devices);
      if (countEl) {
        const n = getFilteredDevices().filter((d) => d.kind !== 'switch').length;
        countEl.textContent = trTpl('tcMfgCount', {
          n,
          total: devicesForScope(catalog.devices).filter((d) => d.kind !== 'switch').length,
          brand: catalog.brand,
        });
      }
    };
    applyFilter();
    filterEl?.addEventListener('input', applyFilter);
    famEl?.addEventListener('change', applyFilter);

    const scoped = devicesForScope(catalog.devices).filter((d) => d.kind !== 'switch');
    const defaults = {
      schneider: getMfgScope() === 'acb' ? 'nw16' : 'nsx160',
      abb: getMfgScope() === 'acb' ? 'e2' : 'xt2',
      hager: 'nbn',
    };
    const defId = defaults[getBrandId()] || scoped[0]?.id;
    if (defId && scoped.some((d) => d.id === defId)) devEl.value = defId;
    else if (scoped[0]) devEl.value = scoped[0].id;
    syncMfgCascade();
    updateMfgDisclaimer();
  }

  function refreshMfgBrandOptions() {
    const brandEl = document.getElementById('tc-mfg-brand');
    if (!brandEl || !index?.brands) return;
    const prev = brandEl.value;
    fillSelect(brandEl, index.brands.map((b) => ({ id: b.id, label: brandLabel(b) })), 'id', 'label');
    if (prev && [...brandEl.options].some((o) => o.value === prev)) brandEl.value = prev;
  }

  function refreshMfgFamilyOptions() {
    const famEl = document.getElementById('tc-mfg-family');
    if (!famEl || !catalog?.families) return;
    const scoped = devicesForScope(catalog.devices);
    const used = new Set(scoped.map((d) => d.family));
    const fams = catalog.families.filter((f) => f.id === 'all' || used.has(f.id));
    const prev = famEl.value;
    fillSelect(famEl, fams.map((f) => ({ id: f.id, label: familyLabel(f) })), 'id', 'label');
    if (prev && [...famEl.options].some((o) => o.value === prev)) famEl.value = prev;
    else famEl.value = 'all';
  }

  function getActiveProfile() {
    const devEl = document.getElementById('tc-mfg-device');
    const inEl = document.getElementById('tc-mfg-in');
    const tuEl = document.getElementById('tc-mfg-trip');
    const dev = findDevice(devEl?.value);
    const tu = findTripUnit(dev, tuEl?.value);
    if (!dev || !tu) return null;

    const ratings = inRatingsForDevice(dev);
    const inA = parseFloat(inEl?.value || pickInForDevice(dev, null) || String(ratings[ratings.length - 1] || dev.frameA || 160));

    if (dev.deviceType === 'mcb' || tu.mcb) {
      return {
        brandId: getBrandId(),
        brand: catalog.brand,
        deviceType: 'mcb',
        deviceId: dev.id,
        deviceLabel: dev.label,
        frameA: dev.frameA,
        tripUnitId: tu.id,
        tripUnitLabel: tu.label,
        in: inA,
        curve: tu.curve || 'C',
        longAnchors: tu.longAnchors,
        magMult: tu.magMult,
        instTS: tu.instTS,
        hasShortTime: false,
        supportsTr: false,
        tr: null,
        curveSource: tu.curveSource,
        catalogRevision: catalog?.revision || '',
      };
    }

    const ir = tu.fixedIr ? 1 : parseFloat(document.getElementById('tc-ir')?.value || '1');
    const supportsTr = tripUnitSupportsTr(tu);
    const tr = supportsTr
      ? parseFloat(document.getElementById('tc-tr')?.value || String(tu.settings?.tr?.default || 1))
      : null;
    const s = tu.settings;
    const isd = parseFloat(document.getElementById('tc-isd')?.value || '2');
    const tsdRaw = parseFloat(document.getElementById('tc-tsd')?.value || '0.2');
    const tsd = tu.hasShortTime && s.tsd ? snapCatalogTsd(tsdRaw, s.tsd) : tsdRaw;
    const iiOff = document.getElementById('tc-ii-off')?.checked;
    let ii = parseFloat(document.getElementById('tc-ii')?.value || '10');
    const irClamped = Math.min(Math.max(ir, s.ir.min), s.ir.max);
    let isdClamped = isd;
    if (tu.hasShortTime && s.isd) {
      isdClamped = Math.min(Math.max(isd, s.isd.min), s.isd.max);
      if (isdClamped < 1.5) isdClamped = 1.5;
    }
    if (iiOff && s.ii?.off) ii = null;
    else if (s.ii) ii = Math.min(Math.max(ii, s.ii.min), s.ii.max);

    const irAbs = irClamped * inA;
    if (tu.hasShortTime && ii != null && !iiOff) {
      const isdAbs = isdClamped * irAbs;
      const minIiMult = Math.ceil((isdAbs / inA) * 1.02 * 10) / 10;
      if (ii * inA <= isdAbs) ii = Math.min(s.ii?.max ?? ii, Math.max(minIiMult, s.ii?.min ?? 2));
    }

    return {
      brandId: getBrandId(),
      brand: catalog.brand,
      deviceType: dev.deviceType === 'mcb' ? 'mcb' : (dev.deviceType === 'acb' ? 'acb' : 'mccb'),
      deviceId: dev.id,
      deviceLabel: dev.label,
      frameA: dev.frameA,
      tripUnitId: tu.id,
      tripUnitLabel: tu.label,
      in: inA,
      ir: irClamped,
      isd: tu.hasShortTime ? isdClamped : null,
      tsd: tu.hasShortTime ? tsd : null,
      ii,
      hasShortTime: tu.hasShortTime,
      fixedIr: !!tu.fixedIr,
      supportsTr,
      tr: supportsTr ? tr : null,
      trRefSec: tu.trRefSec || 1,
      longAnchors: tu.longAnchors,
      instTS: tu.instTS,
      iiMin: s.ii?.min ?? null,
      iiMax: s.ii?.max ?? null,
      curveSource: tu.curveSource || catalog?.source || '',
      curveSourceId: tu.curveSourceId || null,
      catalogRevision: catalog?.revision || '',
    };
  }

  function getCatalogMeta() {
    return {
      brand: catalog?.brand,
      brandId: getBrandId(),
      revision: catalog?.revision,
      source: catalog?.source,
      methodologyRevision: methodology?.revision,
    };
  }

  /** Recharge le formulaire constructeur depuis un profil déjà sur le graphe. */
  function loadProfileIntoForm(profile) {
    if (!profile || !profile.deviceId) return Promise.resolve();
    const finish = () => {
      const devEl = document.getElementById('tc-mfg-device');
      const inEl = document.getElementById('tc-mfg-in');
      const tuEl = document.getElementById('tc-mfg-trip');
      if (devEl) devEl.value = profile.deviceId;
      syncMfgCascade();
      if (inEl) inEl.value = String(profile.in);
      syncMfgCascade();
      if (tuEl && profile.tripUnitId) tuEl.value = profile.tripUnitId;
      syncMfgCascade();
      syncMfgSettings();
      const trEl = document.getElementById('tc-tr');
      if (trEl && profile.supportsTr && profile.tr != null) trEl.value = String(profile.tr);
      const irEl = document.getElementById('tc-ir');
      if (irEl && profile.ir != null) irEl.value = String(profile.ir);
      const isdEl = document.getElementById('tc-isd');
      if (isdEl && profile.isd != null) isdEl.value = String(profile.isd);
      const tsdEl = document.getElementById('tc-tsd');
      if (tsdEl && profile.tsd != null) tsdEl.value = String(profile.tsd);
      const iiEl = document.getElementById('tc-ii');
      if (iiEl && profile.ii != null) iiEl.value = String(profile.ii);
      const iiOff = document.getElementById('tc-ii-off');
      if (iiOff) {
        iiOff.checked = profile.ii == null;
        if (iiEl) iiEl.disabled = iiOff.checked;
      }
      updateProvenancePanel();
      updateSettingsLive();
    };
    const modeEl = document.getElementById('tc-mode');
    if (modeEl) modeEl.value = 'mfg';
    setMfgScope(profile.deviceType === 'acb' ? 'acb' : 'catalog');
    syncModeUI();
    const brandEl = document.getElementById('tc-mfg-brand');
    const needReload = profile.brandId && brandEl && brandEl.value !== profile.brandId;
    if (needReload) {
      brandEl.value = profile.brandId;
      return reloadCatalog(finish);
    }
    return Promise.resolve(finish());
  }

  function validateSettings(msgEl) {
    if (!msgEl) return true;
    const dev = findDevice(document.getElementById('tc-mfg-device')?.value);
    if (dev?.kind === 'switch') {
      msgEl.textContent = tr('tcMfgSwitchHint');
      return false;
    }
    const p = getActiveProfile();
    if (!p) { msgEl.textContent = ''; return false; }
    if (p.deviceType === 'mcb') { msgEl.textContent = ''; return true; }
    if (p.hasShortTime && p.isd < 1.5) {
      msgEl.textContent = tr('tcWarnIsdMin');
      return false;
    }
    if (p.hasShortTime && p.ii != null) {
      const irA = (p.fixedIr ? 1 : (p.ir || 1)) * p.in;
      if (p.ii * p.in <= p.isd * irA) {
        msgEl.textContent = tr('tcWarnIiAboveIsd');
        return false;
      }
    }
    msgEl.textContent = '';
    return true;
  }

  function bindUI(onChange) {
    bindTsdStepperUI(onChange);
    const modeEl = document.getElementById('tc-mode');
    modeEl?.addEventListener('change', () => {
      syncModeUI();
      if (onChange) onChange();
    });

    document.getElementById('tc-kind')?.addEventListener('change', () => {
      const kind = document.getElementById('tc-kind')?.value || 'mcb';
      applyProtectionKind(kind);
      g.ElectroDzTripCurve?.markCurveRebuildFromForm?.();
      if (onChange) onChange();
    });
    document.getElementById('tc-kind-mccb-sub')?.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-tc-ref]');
      if (!pill) return;
      applyProtectionRef(pill.dataset.tcRef);
      g.ElectroDzTripCurve?.markCurveRebuildFromForm?.();
      if (onChange) onChange();
    });
    document.getElementById('tc-kind-fuse-sub')?.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-tc-ref]');
      if (!pill) return;
      applyProtectionRef(pill.dataset.tcRef);
      g.ElectroDzTripCurve?.markCurveRebuildFromForm?.();
      if (onChange) onChange();
    });

    const brandEl = document.getElementById('tc-mfg-brand');
    brandEl?.addEventListener('change', () => {
      reloadCatalog(() => {
        g.ElectroDzTripCurve?.markCurveRebuildFromForm?.();
        if (onChange) onChange();
      });
    });

    const fireMfgSelection = () => {
      syncMfgCascade();
      g.ElectroDzTripCurve?.markCurveRebuildFromForm?.();
      if (onChange) onChange();
    };
    ['tc-mfg-device', 'tc-mfg-in', 'tc-mfg-trip'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', fireMfgSelection);
    });

    ['tc-tr', 'tc-ir', 'tc-isd', 'tc-tsd', 'tc-ii'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        updateProvenancePanel();
        if (onChange) onChange();
      });
      document.getElementById(id)?.addEventListener('change', () => {
        updateProvenancePanel();
        if (onChange) onChange();
      });
    });

    document.getElementById('tc-ii-off')?.addEventListener('change', () => {
      const iiEl = document.getElementById('tc-ii');
      if (iiEl) iiEl.disabled = document.getElementById('tc-ii-off').checked;
      if (onChange) onChange();
    });

    const importFile = document.getElementById('tc-custom-catalog-file');
    const importBtn = document.getElementById('tc-custom-catalog-btn');
    const importClear = document.getElementById('tc-custom-catalog-clear');
    importBtn?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', () => {
      const f = importFile.files?.[0];
      if (!f) return;
      const status = document.getElementById('tc-custom-catalog-status');
      importCatalogFromFile(f)
        .then(() => {
          if (status) status.textContent = tr('tcCustomCatalogOk');
          syncModeUI();
          if (onChange) onChange();
        })
        .catch(() => {
          if (status) status.textContent = tr('tcCustomCatalogErr');
        })
        .finally(() => { importFile.value = ''; });
    });
    importClear?.addEventListener('click', () => {
      clearLocalOverride(getBrandId()).then(() => {
        updateImportStatus();
        syncModeUI();
        if (onChange) onChange();
      });
    });

    if (brandEl && index?.brands) {
      fillSelect(brandEl, index.brands.map((b) => ({ id: b.id, label: brandLabel(b) })), 'id', 'label');
    }

    return loadProMeta().then(() => loadCatalog(getBrandId())).then((data) => {
      if (data) initMfgSelectors();
      syncModeUI();
      updateProvenancePanel();
      return data;
    });
  }

  g.ElectroDzTripCurveCatalog = {
    loadCatalog,
    reloadCatalog,
    loadProMeta,
    getCatalog,
    getCatalogMeta,
    getMode,
    getBrandId,
    getActiveProfile,
    getValidationTools,
    updateProvenancePanel,
    syncModeUI,
    syncKindCardsUI,
    applyProtectionKind,
    syncMfgCascade,
    syncMfgSettings,
    bindUI,
    validateSettings,
    loadProfileIntoForm,
    findDevice,
    findTripUnit,
    formHasAdjustableThresholds,
    deviceHasAdjustableThresholds,
    importCatalogFromFile,
    clearLocalOverride,
    hasLocalOverride: () => hasLocalOverride,
    getMethodology: () => methodology,
    BRANDS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
