/**
 * Bilan de puissance pro — nomenclature type Caneco (réf., repère, désignation, local, tableau).
 */
(function (g) {
  'use strict';

  const STORAGE_META = 'electrodz-bal-pro-meta';
  const STORAGE_SAVES = 'electrodz-bal-saved-v1';
  const MAX_SAVED = 30;
  const MIN_ROWS = 1;
  const MAX_ROWS = 40;

  const FALLBACK_CATALOG = {
    boards: ['TGBT', 'TD-RDC', 'TD-ETAGE1', 'LOCAL-TECH'],
    locations: ['RDC', 'R+1', 'R+2', 'SOUS-SOL', 'LOCAL-TECH'],
    templates: [{ id: 'custom', usage: 'custom' }],
  };

  let catalog = null;
  let lastReport = null;

  function getLang() {
    try {
      return localStorage.getItem('electrodz-site-lang') === 'fr' ? 'fr' : 'ar';
    } catch (_) {
      return 'ar';
    }
  }

  function tr(key) {
    const I = g.ElectroDzCalcI18n;
    return I ? I.t(getLang(), key) : key;
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Champ + unité affichée en permanence à droite de la case */
  function withUnit(innerHtml, unitKey) {
    return `<div class="bal-input-unit">${innerHtml}<span class="bal-unit" data-bal-unit="${esc(unitKey)}">${esc(tr(unitKey))}</span></div>`;
  }

  function applyAllUnits() {
    document.querySelectorAll('[data-bal-unit]').forEach((el) => {
      const key = el.getAttribute('data-bal-unit');
      if (key) el.textContent = tr(key);
    });
  }

  async function loadCatalog() {
    if (catalog) return catalog;
    try {
      const r = await fetch('data/balance-catalog.json');
      if (r.ok) catalog = await r.json();
    } catch (_) { /* ignore */ }
    if (!catalog?.templates?.length) catalog = FALLBACK_CATALOG;
    return catalog;
  }

  function desigOptionsHtml() {
    const tpls = [...(catalog?.templates || [{ id: 'custom', usage: 'custom' }])].sort((a, b) => {
      if (a.id === 'custom') return 1;
      if (b.id === 'custom') return -1;
      return 0;
    });
    return tpls
      .map((t) => {
        const label = t.labelKey ? tr(t.labelKey) : tr('balDesig_custom');
        return `<option value="${t.id}">${esc(label)}</option>`;
      })
      .join('');
  }

  function rebuildDatalists() {
    const boards = catalog?.boards || [];
    const locs = catalog?.locations || [];
    const fill = (id, items) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = items.map((v) => `<option value="${esc(v)}"></option>`).join('');
    };
    fill('bal-list-board', boards);
    fill('bal-list-location', locs);
  }

  function getTpl(id) {
    return (catalog?.templates || []).find((t) => t.id === id);
  }

  function applyDesig(row, templateId) {
    const tpl = getTpl(templateId);
    if (!tpl || tpl.id === 'custom') return;
    const set = (sel, val) => {
      const el = row.querySelector(sel);
      if (el && val != null && val !== '') el.value = String(val);
    };
    if (tpl.pi != null) set('.bal-p', tpl.pi);
    if (tpl.ku != null) set('.bal-ku', tpl.ku);
    if (tpl.ks != null) set('.bal-ks', tpl.ks);
    if (tpl.cosPhi != null) set('.bal-cos', tpl.cosPhi);
  }

  function syncDesigRow(row) {
    const id = row.querySelector('.bal-desig')?.value || 'custom';
    const custom = row.querySelector('.bal-label-custom');
    const showCustom = id === 'custom';
    if (custom) {
      custom.hidden = !showCustom;
      custom.required = showCustom;
    }
    if (!showCustom) applyDesig(row, id);
  }

  function rowLabel(row) {
    const id = row.querySelector('.bal-desig')?.value || 'custom';
    if (id === 'custom') {
      return row.querySelector('.bal-label-custom')?.value?.trim() || '';
    }
    const tpl = getTpl(id);
    return tpl?.labelKey ? tr(tpl.labelKey) : '';
  }

  function renumberRefs() {
    host()?.querySelectorAll('[data-balance-row]').forEach((row, i) => {
      const el = row.querySelector('.bal-ref');
      if (el) el.value = `C${i + 1}`;
    });
  }

  function createRowEl(data) {
    const row = document.createElement('div');
    row.className = 'bal-row';
    row.setAttribute('data-balance-row', '');
    const d = data || {};
    row.innerHTML = `
      <div class="bal-col-ref bal-field-unit-only"><input type="text" class="bal-ref" readonly tabindex="-1" aria-label="${esc(tr('balColRef'))}"><span class="bal-unit" data-bal-unit="unitRef"></span></div>
      <div class="bal-col-schema">${withUnit(`<input type="text" class="bal-schema" maxlength="8" placeholder="${esc(tr('phBalanceSchema'))}" value="${esc(d.schemaRef || '')}" list="bal-list-schema">`, 'unitSchema')}</div>
      <div class="bal-col-desig" data-lbl="${esc(tr('balColLabel'))}">
        ${withUnit(`<select class="bal-desig" title="${esc(tr('balColLabel'))}">${desigOptionsHtml()}</select>`, 'unitCatalog')}
        <input type="text" class="bal-label-custom" maxlength="100" hidden placeholder="${esc(tr('phBalanceLabelCustom'))}" value="${esc(d.label || '')}">
      </div>
      <div class="bal-col-location">${withUnit(`<input type="text" class="bal-location" maxlength="40" placeholder="${esc(tr('phBalanceLocation'))}" value="${esc(d.location || '')}" list="bal-list-location">`, 'unitText')}</div>
      <div class="bal-col-board">${withUnit(`<input type="text" class="bal-board" maxlength="16" placeholder="${esc(tr('phBalanceBoard'))}" value="${esc(d.board || '')}" list="bal-list-board">`, 'unitText')}</div>
      <div class="bal-col-pi" data-lbl="${esc(tr('balColPi'))}">${withUnit(`<input type="number" class="bal-p" min="0" step="1" placeholder="0" title="${esc(tr('balPiTooltip'))}" aria-label="${esc(tr('balColPi'))}" value="${d.p != null ? esc(d.p) : ''}">`, 'unitW')}</div>
      <div class="bal-col-ku" data-lbl="${esc(tr('balColKuLong'))}">${withUnit(`<input type="number" class="bal-ku" min="0" max="1" step="0.01" title="${esc(tr('balKuTooltip'))}" aria-label="${esc(tr('balColKuLong'))}" value="${d.ku != null ? esc(d.ku) : '1'}">`, 'unitCoef')}</div>
      <div class="bal-col-ks" data-lbl="${esc(tr('balColKsLong'))}">${withUnit(`<input type="number" class="bal-ks" min="0" max="1" step="0.01" title="${esc(tr('balKsTooltip'))}" aria-label="${esc(tr('balColKsLong'))}" value="${d.ks != null ? esc(d.ks) : '1'}">`, 'unitCoef')}</div>
      <div class="bal-col-cos" data-lbl="${esc(tr('balColCos'))}">${withUnit(`<input type="number" class="bal-cos" min="0.01" max="1" step="0.01" title="${esc(tr('balCosTooltip'))}" aria-label="${esc(tr('balColCos'))}" value="${d.cosPhi != null && d.cosPhi !== '' ? esc(d.cosPhi) : ''}" placeholder="${esc(tr('balCosPlaceholder'))}">`, 'unitCoef')}</div>
      <button type="button" class="bal-row-remove" title="${esc(tr('balRemoveRow'))}" aria-label="${esc(tr('balRemoveRow'))}"><span aria-hidden="true">×</span><span>${esc(tr('balRemoveShort'))}</span></button>`;
    const desigSel = row.querySelector('.bal-desig');
    if (desigSel) desigSel.value = d.templateId || d.desigId || 'custom';
    if (d.circuitRef) {
      const ref = row.querySelector('.bal-ref');
      if (ref) ref.value = d.circuitRef;
    }
    syncDesigRow(row);
    return row;
  }

  function host() {
    return document.getElementById('balance-rows-host');
  }

  function updateRemoveButtons() {
    const rows = host()?.querySelectorAll('[data-balance-row]') || [];
    rows.forEach((row) => {
      const btn = row.querySelector('.bal-row-remove');
      if (btn) btn.disabled = rows.length <= MIN_ROWS;
    });
  }

  function addRow(data) {
    const h = host();
    if (!h || h.querySelectorAll('[data-balance-row]').length >= MAX_ROWS) return;
    const row = createRowEl(data);
    h.appendChild(row);
    bindRow(row);
    renumberRefs();
    updateRemoveButtons();
    applyMobileLabels();
  }

  function bindRow(row) {
    row.querySelector('.bal-desig')?.addEventListener('change', () => syncDesigRow(row));
    row.querySelector('.bal-row-remove')?.addEventListener('click', () => {
      const h = host();
      if (!h || h.querySelectorAll('[data-balance-row]').length <= MIN_ROWS) return;
      row.remove();
      renumberRefs();
      updateRemoveButtons();
    });
  }

  const MOBILE_COL_CLASSES = [
    'bal-col-ref',
    'bal-col-schema',
    'bal-col-desig',
    'bal-col-location',
    'bal-col-board',
    'bal-col-pi',
    'bal-col-ku',
    'bal-col-ks',
    'bal-col-cos',
  ];

  /** Libellé complet par champ (titre + sous-titre + unité) pour affichage mobile. */
  function mobileFieldLabel(cls) {
    switch (cls) {
      case 'bal-col-ref':
        return `${tr('balColRef')} (${tr('unitRef')})`;
      case 'bal-col-schema':
        return `${tr('balColSchema')} (${tr('unitSchema')})`;
      case 'bal-col-desig':
        return `${tr('balColLabel')} (${tr('unitCatalog')})`;
      case 'bal-col-location':
        return tr('balColLocation');
      case 'bal-col-board':
        return tr('balColBoard');
      case 'bal-col-pi':
        return `${tr('balColPi')} (${tr('unitW')})`;
      case 'bal-col-ku':
        return `${tr('balColKu')} — ${tr('balColKuSub')} (${tr('unitCoef')})`;
      case 'bal-col-ks':
        return `${tr('balColKs')} — ${tr('balColKsSub')} (${tr('unitCoef')})`;
      case 'bal-col-cos':
        return `${tr('balColCos')} — ${tr('balColCosSub')}`;
      default:
        return '';
    }
  }

  function applyMobileLabels() {
    host()?.querySelectorAll('[data-balance-row]').forEach((row) => {
      MOBILE_COL_CLASSES.forEach((cls) => {
        const el = row.querySelector(`.${cls}`);
        if (el) el.setAttribute('data-lbl', mobileFieldLabel(cls));
      });
      const rm = row.querySelector('.bal-row-remove');
      if (rm) rm.setAttribute('data-lbl', tr('balColActions'));
    });
  }

  function reportHeaderCells() {
    return [
      tr('balColRef'),
      tr('balColSchema'),
      tr('balColLabel'),
      tr('balColLocation'),
      tr('balColBoard'),
      tr('balColPi'),
      tr('balColKu'),
      tr('balColKs'),
      tr('balColCos'),
      tr('balColPd'),
      tr('balColQd'),
      tr('balColSd'),
    ];
  }

  function reportRowCells(line) {
    return [
      line.circuitRef || '—',
      line.schemaRef || '—',
      line.label,
      line.location || '—',
      line.board || '—',
      line.pi.toFixed(0),
      String(line.ku),
      String(line.ks),
      line.cosPhi != null ? line.cosPhi.toFixed(2) : '—',
      `${line.pdem.toFixed(0)} W`,
      `${(line.qdVar / 1000).toFixed(2)} kvar`,
      `${(line.sdVA / 1000).toFixed(2)} kVA`,
    ];
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(STORAGE_META);
      if (!raw) return;
      const m = JSON.parse(raw);
      ['bal-pro-ref', 'bal-pro-site', 'bal-pro-client', 'bal-pro-engineer'].forEach((id) => {
        const el = document.getElementById(id);
        if (el && m[id]) el.value = m[id];
      });
    } catch (_) { /* ignore */ }
  }

  function saveMeta() {
    try {
      const m = {};
      ['bal-pro-ref', 'bal-pro-site', 'bal-pro-client', 'bal-pro-engineer'].forEach((id) => {
        m[id] = document.getElementById(id)?.value?.trim() || '';
      });
      localStorage.setItem(STORAGE_META, JSON.stringify(m));
    } catch (_) { /* ignore */ }
  }

  function getMeta() {
    return {
      ref: document.getElementById('bal-pro-ref')?.value?.trim() || '',
      site: document.getElementById('bal-pro-site')?.value?.trim() || '',
      client: document.getElementById('bal-pro-client')?.value?.trim() || '',
      engineer: document.getElementById('bal-pro-engineer')?.value?.trim() || '',
    };
  }

  function collectRows() {
    const rows = [];
    host()?.querySelectorAll('[data-balance-row]').forEach((row) => {
      const templateId = row.querySelector('.bal-desig')?.value || 'custom';
      const tpl = getTpl(templateId);
      rows.push({
        circuitRef: row.querySelector('.bal-ref')?.value?.trim() || '',
        schemaRef: row.querySelector('.bal-schema')?.value?.trim() || '',
        label: rowLabel(row),
        location: row.querySelector('.bal-location')?.value || '',
        board: row.querySelector('.bal-board')?.value || '',
        templateId,
        usage: tpl?.usage || 'custom',
        p: row.querySelector('.bal-p')?.value || '',
        ku: row.querySelector('.bal-ku')?.value || '1',
        ks: row.querySelector('.bal-ks')?.value || '1',
        cosPhi: row.querySelector('.bal-cos')?.value?.trim() || '',
      });
    });
    return rows;
  }

  function collectForm() {
    saveMeta();
    return {
      rows: collectRows(),
      voltage: document.getElementById('balance-u')?.value || '230',
      lang: getLang(),
      meta: getMeta(),
    };
  }

  /** Corps du rapport (site + export) — fond blanc, même mise en page que le PDF */
  function buildReportInnerHtml(r, meta) {
    const rtl = getLang() === 'ar';
    const ad = r.data.additionalData;
    const rows = ad.detailRows || [];
    const headCells = reportHeaderCells();
    const locale = rtl ? 'ar-DZ' : 'fr-CH';
    const dateStr = new Date().toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

    let tableRows = rows
      .map(
        (line, i) =>
          `<tr class="${i % 2 ? 'alt' : ''}">${reportRowCells(line).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`
      )
      .join('');
    tableRows += `<tr class="tot"><td colspan="8"><strong>${esc(tr('balTotal'))}</strong></td><td><strong>${esc(ad.pTotalW)} W</strong><br><span class="muted">(${esc(r.data.result)} kW)</span></td><td><strong>${esc(ad.qTotalKvar)} kvar</strong></td><td><strong>${esc(ad.sTotalKva)} kVA</strong></td></tr>`;

    const metaRows = [
      [tr('balProRef'), meta.ref],
      [tr('balProSite'), meta.site],
      [tr('balProClient'), meta.client],
      [tr('balProEngineer'), meta.engineer],
      [tr('labelVoltage'), `${ad.Uline} V — ${tr(ad.isTri ? 'voltageTri' : 'voltageMono')}`],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join('');

    const inner = `<div class="page">
<header class="hdr">
  <div>
    <div class="brand">DZSWISS ELEC</div>
    <h1>${esc(tr('balExportTitle'))}</h1>
    <div class="date">${esc(dateStr)}</div>
  </div>
</header>
<table class="meta-tbl"><tbody>${metaRows}</tbody></table>
<table class="data-tbl">
<thead><tr>${headCells.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
<tbody>${tableRows}</tbody>
</table>
<div class="sum">
  <div class="box"><span class="lbl">${esc(tr('balTotal'))} Pd</span><strong>${esc(r.data.result)} kW</strong></div>
  <div class="box"><span class="lbl">${esc(tr('balColSd'))}</span><strong>${esc(ad.sTotalKva)} kVA</strong></div>
  <div class="box"><span class="lbl">${esc(tr('balanceIbApprox'))}</span><strong>${esc(ad.ibA)} ${esc(tr('unitA'))}</strong></div>
  <div class="box"><span class="lbl">${esc(tr('balCosFinal'))}</span><strong>${esc(ad.cosPhiFinal)}</strong></div>
</div>
${reportGroupsHtml(tr('balByBoard'), ad.byBoard)}
${reportGroupsHtml(tr('balByLocation'), ad.byLocation)}
<p class="formula">${esc(r.data.formula)}</p>
<footer class="foot">${esc(tr('balDisclaimer'))}<br>electro-dz.com</footer>
</div>`;

    return { inner, rtl };
  }

  function formatResultHtml(r) {
    if (!r.ok) return esc(r.message || '');
    const meta = getMeta();
    const { inner, rtl } = buildReportInnerHtml(r, meta);
    return `<div class="bal-result-sheet" dir="${rtl ? 'rtl' : 'ltr'}">${inner}</div>`;
  }

  function buildReportLines(r, meta) {
    const ad = r.data.additionalData;
    const lang = getLang();
    const lines = [
      tr('balExportTitle'),
      '—'.repeat(52),
      new Date().toLocaleString(lang === 'fr' ? 'fr-CH' : 'ar-DZ'),
      '',
    ];
    if (meta.ref) lines.push(`${tr('balProRef')}: ${meta.ref}`);
    if (meta.site) lines.push(`${tr('balProSite')}: ${meta.site}`);
    if (meta.client) lines.push(`${tr('balProClient')}: ${meta.client}`);
    if (meta.engineer) lines.push(`${tr('balProEngineer')}: ${meta.engineer}`);
    if (meta.ref || meta.site || meta.client || meta.engineer) lines.push('');
    lines.push(`${tr('labelVoltage')}: ${ad.Uline} V (${ad.isTri ? tr('voltageTri') : tr('voltageMono')})`);
    lines.push(`${tr('balCosFinal')}: ${ad.cosPhiFinal}`);
    lines.push('');
    lines.push(reportHeaderCells().join('\t'));
    (ad.detailRows || []).forEach((line) => {
      lines.push(reportRowCells(line).join('\t'));
    });
    lines.push('');
    lines.push(`${tr('balTotal')}: Pd = ${r.data.result} kW · Qd = ${ad.qTotalKvar} kvar · Sd = ${ad.sTotalKva} kVA`);
    lines.push(`${tr('balanceIbApprox')} ${ad.ibA} ${tr('unitA')} · ${tr('balCosFinal')} ${ad.cosPhiFinal}`);
    appendGroupToTxt(lines, tr('balByBoard'), ad.byBoard);
    appendGroupToTxt(lines, tr('balByLocation'), ad.byLocation);
    lines.push('', r.data.formula, '', tr('balDisclaimer'), '—', 'DZSWISS ELEC — electro-dz.com');
    return lines;
  }

  function appendGroupToTxt(lines, title, groups) {
    const keys = Object.keys(groups || {}).filter((k) => k && k !== '—');
    if (keys.length <= 1) return;
    lines.push('', title + ':');
    keys.forEach((k) => {
      const x = groups[k];
      lines.push(`  ${k}: ${(x.pdW / 1000).toFixed(2)} kW — Ib ≈ ${x.ibA.toFixed(1)} A`);
    });
  }

  function reportGroupsHtml(title, groups) {
    const keys = Object.keys(groups || {}).filter((k) => k && k !== '—');
    if (keys.length <= 1) return '';
    let h = `<h2 class="sub-h">${esc(title)}</h2><table class="sub-tbl"><tbody>`;
    keys.forEach((k) => {
      const x = groups[k];
      h += `<tr><td>${esc(k)}</td><td>${(x.pdW / 1000).toFixed(2)} kW</td><td>Ib ≈ ${x.ibA.toFixed(1)} A</td></tr>`;
    });
    return h + '</tbody></table>';
  }

  function reportFileSlug(meta) {
    const ref = (meta?.ref || 'bilan').replace(/[^\w\u0600-\u06FF-]+/gi, '-').replace(/-+/g, '-').slice(0, 40);
    const d = new Date().toISOString().slice(0, 10);
    return `bilan-puissance-${ref || 'projet'}-${d}`;
  }

  function exportReportStyles(rtl) {
    const align = rtl ? 'right' : 'left';
    return `*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff!important;color:#0f172a!important}@page{size:A4;margin:15mm 12mm}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:11pt;line-height:1.4;padding:12mm 10mm}.bal-result-sheet,.page{max-width:210mm;margin:0 auto;background:#fff}.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 16px;padding:12px 14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px}.toolbar button{padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;background:#059669;color:#fff;border:none;border-radius:6px}.toolbar .hint{font-size:11px;color:#475569}.hdr{border-bottom:3px solid #059669;padding-bottom:12px;margin-bottom:14px}.brand{font-size:11pt;font-weight:800;color:#047857}.hdr h1{margin:0;font-size:17pt;font-weight:800;color:#0f172a}.hdr .date{font-size:9.5pt;color:#64748b;margin-top:4px}.meta-tbl,.data-tbl,.sub-tbl{width:100%;border-collapse:collapse}.meta-tbl{margin:0 0 14px;font-size:10pt}.meta-tbl th,.meta-tbl td{border:1px solid #e2e8f0;padding:6px 10px;text-align:${align};background:#fff}.meta-tbl th{width:28%;background:#f8fafc;color:#334155;font-weight:700}.data-tbl{margin:12px 0 16px;font-size:9.5pt}.data-tbl th,.data-tbl td{border:1px solid #94a3b8;padding:5px 7px;text-align:${align};background:#fff}.data-tbl th{background:#ecfdf5;color:#065f46;font-weight:700}.data-tbl tr.alt td{background:#f8fafc}.data-tbl tr.tot td{background:#fef9c3;font-weight:700;border-top:2px solid #ca8a04}.data-tbl .muted{font-size:8.5pt;color:#64748b}.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.sum .box{padding:10px 12px;border:2px solid #86efac;border-radius:8px;background:#f0fdf4;text-align:center}.sum .lbl{display:block;font-size:9pt;color:#047857;font-weight:600;margin-bottom:4px}.sum strong{font-size:14pt;color:#065f46}.sub-h{font-size:11pt;color:#047857;margin:16px 0 6px}.sub-tbl{font-size:10pt;margin-bottom:12px}.sub-tbl td,.sub-tbl th{border:1px solid #e2e8f0;padding:5px 8px;background:#fff}.formula{font-size:9pt;color:#475569;margin:8px 0;font-style:italic}.foot{margin-top:18px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:8.5pt;color:#64748b}@media print{.no-print{display:none!important}html,body{background:#fff!important}.data-tbl tr{page-break-inside:avoid}}`;
  }

  /** Rapport HTML fond blanc — fichier pro imprimable */
  function buildReportHtml(opts) {
    if (!lastReport?.r?.ok) return null;
    const autoPrint = !!(opts && opts.autoPrint);
    const embedToolbar = !(opts && opts.noToolbar);
    const { r, meta } = lastReport;
    const { inner, rtl } = buildReportInnerHtml(r, meta);
    const toolbar = embedToolbar
      ? `<div class="no-print toolbar"><button type="button" onclick="window.print()">${esc(tr('balExportPrint'))}</button><span class="hint">${esc(tr('balExportPdfHint'))}</span></div>`
      : '';
    const printScript = autoPrint
      ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},350);});<\/script>`
      : '';
    return `<!DOCTYPE html>
<html dir="${rtl ? 'rtl' : 'ltr'}" lang="${rtl ? 'ar' : 'fr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(tr('balExportTitle'))}</title>
<style>${exportReportStyles(rtl)}</style>
</head>
<body>
<div class="bal-result-sheet" dir="${rtl ? 'rtl' : 'ltr'}">
${toolbar}
${inner}
</div>
${printScript}
</body>
</html>`;
  }

  function openReportPreview(autoPrint) {
    const html = buildReportHtml({ autoPrint, noToolbar: autoPrint });
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) {
      downloadReportHtml();
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function downloadReportHtml() {
    const html = buildReportHtml({ autoPrint: false, noToolbar: false });
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportFileSlug(lastReport.meta)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  function exportTxt() {
    if (!lastReport?.r?.ok) return;
    const blob = new Blob([buildReportLines(lastReport.r, lastReport.meta).join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bilan-puissance-electrodz.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function setLastReport(r, meta) {
    lastReport = r?.ok ? { r, meta: meta || getMeta() } : null;
    const show = !!lastReport;
    const bar = document.getElementById('bal-export');
    const dock = document.getElementById('bal-export-dock');
    if (bar) bar.classList.toggle('visible', show);
    if (dock) dock.hidden = !show;
    updateUnifilarButtons();
  }

  function formHasCharges() {
    return collectRows().some((row) => {
      const pi = parseFloat(String(row.p).replace(',', '.'));
      return !isNaN(pi) && pi > 0;
    });
  }

  function ensureReport() {
    if (lastReport?.r?.ok) return lastReport;
    const C = g.ElectroDzCalc;
    if (!C?.calculatePowerBalance || !formHasCharges()) return null;
    const form = collectForm();
    const r = C.calculatePowerBalance({
      rows: form.rows,
      voltage: form.voltage,
      lang: form.lang,
    });
    if (r?.ok) {
      setLastReport(r, form.meta);
      return lastReport;
    }
    return null;
  }

  function updateUnifilarButtons() {
    const can = !!(lastReport?.r?.ok) || formHasCharges();
    ['bal-unifilar', 'bal-unifilar-main'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = !can;
    });
  }

  function setSavedStatus(msg) {
    const el = document.getElementById('bal-saved-status');
    if (el) el.textContent = msg || '';
  }

  function loadSavedList() {
    try {
      const raw = localStorage.getItem(STORAGE_SAVES);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function writeSavedList(list) {
    try {
      localStorage.setItem(STORAGE_SAVES, JSON.stringify(list.slice(0, MAX_SAVED)));
    } catch (_) {
      alert(tr('balSaveErrStorage'));
    }
  }

  function defaultSaveName() {
    const m = getMeta();
    const base = m.ref || m.client || m.site || tr('balSaveDefaultName');
    const d = new Date().toLocaleDateString(getLang() === 'ar' ? 'ar-DZ' : 'fr-CH');
    return `${base} — ${d}`;
  }

  function refreshSavedSelect(selectedId) {
    const sel = document.getElementById('bal-saved-select');
    if (!sel) return;
    const list = loadSavedList().sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    const pickLabel = tr('balSavedPick');
    sel.innerHTML =
      `<option value="">${esc(pickLabel)}</option>` +
      list
        .map((item) => {
          const label = item.name || item.id;
          const date = item.savedAt
            ? new Date(item.savedAt).toLocaleString(getLang() === 'ar' ? 'ar-DZ' : 'fr-CH', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : '';
          return `<option value="${esc(item.id)}"${item.id === selectedId ? ' selected' : ''}>${esc(label)}${date ? ' · ' + esc(date) : ''}</option>`;
        })
        .join('');
  }

  function applyVoltage(voltage) {
    const v = String(voltage || '230');
    const hidden = document.getElementById('balance-u');
    if (hidden) hidden.value = v;
    document.querySelectorAll('[data-voltage-target="balance-u"] .voltage-btn').forEach((btn) => {
      const on = btn.getAttribute('data-v') === v;
      btn.classList.toggle('active', on);
    });
  }

  function clearAllRows() {
    const h = host();
    if (!h) return;
    h.querySelectorAll('[data-balance-row]').forEach((row) => row.remove());
  }

  function applyForm(form) {
    if (!form) return;
    const m = form.meta || {};
    const refEl = document.getElementById('bal-pro-ref');
    const siteEl = document.getElementById('bal-pro-site');
    const clientEl = document.getElementById('bal-pro-client');
    const engEl = document.getElementById('bal-pro-engineer');
    if (refEl) refEl.value = m.ref || '';
    if (siteEl) siteEl.value = m.site || '';
    if (clientEl) clientEl.value = m.client || '';
    if (engEl) engEl.value = m.engineer || '';
    saveMeta();
    applyVoltage(form.voltage || '230');
    clearAllRows();
    const rows = form.rows && form.rows.length ? form.rows : [{}];
    rows.forEach((row) => addRow(row));
    while (host().querySelectorAll('[data-balance-row]').length < MIN_ROWS) addRow();
    renumberRefs();
    updateRemoveButtons();
    applyAllUnits();
    const savedReport = form.lastReport;
    if (savedReport?.r?.ok) {
      setLastReport(savedReport.r, savedReport.meta || m);
    } else if (savedReport?.ok) {
      setLastReport(savedReport, m);
    } else {
      lastReport = null;
      const bar = document.getElementById('bal-export');
      const dock = document.getElementById('bal-export-dock');
      if (bar) bar.classList.remove('visible');
      if (dock) dock.hidden = true;
      updateUnifilarButtons();
    }
  }

  function saveBilan() {
    saveMeta();
    if (!formHasCharges()) {
      alert(tr('balSaveNeedRows'));
      return;
    }
    const nameIn = window.prompt(tr('balSavePrompt'), defaultSaveName());
    if (nameIn == null) return;
    const name = nameIn.trim() || defaultSaveName();
    const form = collectForm();
    const entry = {
      id: 'bal-' + Date.now(),
      name,
      savedAt: new Date().toISOString(),
      form: {
        rows: form.rows,
        voltage: form.voltage,
        meta: form.meta,
        lastReport: lastReport?.r?.ok ? lastReport : ensureReport() || null,
      },
    };
    const list = loadSavedList();
    list.unshift(entry);
    writeSavedList(list);
    refreshSavedSelect(entry.id);
    setSavedStatus(tr('balSaveOk').replace('{name}', name));
  }

  function loadBilan() {
    const sel = document.getElementById('bal-saved-select');
    const id = sel?.value;
    if (!id) {
      alert(tr('balLoadPick'));
      return;
    }
    const item = loadSavedList().find((x) => x.id === id);
    if (!item?.form) {
      alert(tr('balLoadErr'));
      return;
    }
    applyForm(item.form);
    refreshSavedSelect(id);
    setSavedStatus(tr('balLoadOk').replace('{name}', item.name || id));
  }

  function deleteBilan() {
    const sel = document.getElementById('bal-saved-select');
    const id = sel?.value;
    if (!id) {
      alert(tr('balLoadPick'));
      return;
    }
    if (!confirm(tr('balDeleteConfirm'))) return;
    const list = loadSavedList().filter((x) => x.id !== id);
    writeSavedList(list);
    refreshSavedSelect('');
    setSavedStatus(tr('balDeleteOk'));
  }

  function goToUnifilarAuto() {
    const report = ensureReport();
    if (!report?.r?.ok) {
      alert(tr('balUnifilarNeedCalc'));
      return;
    }
    const U = g.ElectroDzUnifilarFromBalance;
    if (!U) {
      window.location.href = 'unifilaire-auto.html';
      return;
    }
    const built = U.buildProjectFromReport(lastReport, '');
    if (built.error) {
      alert(tr('balUnifilarErr'));
      return;
    }
    try {
      const payload = JSON.stringify(lastReport);
      sessionStorage.setItem('electrodz-unifilar-source-report-v1', payload);
      localStorage.setItem('electrodz-unifilar-source-report-v1', payload);
    } catch (_) { /* ignore */ }
    if (!U.saveProject(built)) {
      alert(tr('balUnifilarErr') + ' (module unifilaire non chargé — rechargez la page.)');
      return;
    }
    window.location.href = 'unifilaire-auto.html?fresh=1';
  }

  function refreshRowSelects() {
    host()?.querySelectorAll('[data-balance-row]').forEach((row) => {
      const desig = row.querySelector('.bal-desig');
      const val = desig?.value || 'custom';
      if (desig) {
        desig.innerHTML = desigOptionsHtml();
        desig.value = val;
      }
      syncDesigRow(row);
    });
    rebuildDatalists();
    applyMobileLabels();
  }

  async function init() {
    const h = host();
    if (!h || h.dataset.balInit) return;
    await loadCatalog();
    rebuildDatalists();
    applyAllUnits();
    h.dataset.balInit = '1';
    loadMeta();
    while (h.querySelectorAll('[data-balance-row]').length < 3) addRow();
    applyAllUnits();
    document.getElementById('bal-add-row')?.addEventListener('click', () => {
      addRow();
      applyAllUnits();
    });
    document.getElementById('bal-print')?.addEventListener('click', () => openReportPreview(true));
    document.getElementById('bal-export-pdf')?.addEventListener('click', () => openReportPreview(true));
    document.getElementById('bal-export-html')?.addEventListener('click', downloadReportHtml);
    document.getElementById('bal-export-txt')?.addEventListener('click', exportTxt);
    document.getElementById('bal-unifilar')?.addEventListener('click', goToUnifilarAuto);
    document.getElementById('bal-unifilar-main')?.addEventListener('click', goToUnifilarAuto);
    document.getElementById('bal-save-btn')?.addEventListener('click', saveBilan);
    document.getElementById('bal-load-btn')?.addEventListener('click', loadBilan);
    document.getElementById('bal-delete-save-btn')?.addEventListener('click', deleteBilan);
    refreshSavedSelect('');
    updateUnifilarButtons();
    host()?.addEventListener('input', () => updateUnifilarButtons());
    host()?.addEventListener('change', () => updateUnifilarButtons());
    ['bal-pro-ref', 'bal-pro-site', 'bal-pro-client', 'bal-pro-engineer'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', saveMeta);
    });
  }

  function onLangChange() {
    refreshRowSelects();
    applyAllUnits();
    const sel = document.getElementById('bal-saved-select');
    refreshSavedSelect(sel?.value || '');
  }

  g.ElectroDzPowerBalancePro = {
    init,
    collectForm,
    formatResultHtml,
    setLastReport,
    onLangChange,
    goToUnifilarAuto,
    getLastReport: function () {
      return lastReport;
    },
    saveBilan,
    loadBilan,
    refreshSavedSelect,
    ensureReport,
  };
})(typeof window !== 'undefined' ? window : globalThis);
