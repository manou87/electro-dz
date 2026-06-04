/**
 * Génération unifilaire assistée depuis le bilan de puissance (NFC 15-100 — indicatif).
 */
(function (g) {
  'use strict';

  var STORAGE_PROJECT = 'electrodz-unifilar-project-v4';
  var STORAGE_DRAWIO = 'electrodz-unifilar-drawio-v4';
  var SCHEMA_VERSION = 4;
  var LEGACY_KEYS = [
    'electrodz-unifilar-project-v1',
    'electrodz-unifilar-drawio-v1',
    'electrodz-unifilar-project-v2',
    'electrodz-unifilar-drawio-v2',
    'electrodz-unifilar-project-v3',
    'electrodz-unifilar-drawio-v3',
  ];

  var STANDARD_IN = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

  function roundUpStandardIn(ibA) {
    var ib = Math.max(0, Number(ibA) || 0);
    for (var i = 0; i < STANDARD_IN.length; i++) {
      if (STANDARD_IN[i] >= ib * 1.05) return STANDARD_IN[i];
    }
    return STANDARD_IN[STANDARD_IN.length - 1];
  }

  function circuitIbA(pdemW, cosPhi, isTri, Uline) {
    var pd = Math.max(0, pdemW);
    var cos = Math.max(0.05, Math.min(1, cosPhi || 0.8));
    var sd = pd / cos;
    return isTri ? sd / (Math.sqrt(3) * Uline) : sd / Uline;
  }

  function needsTypeA(usage, templateId) {
    return (
      usage === 'welding' ||
      templateId === 'washing_machine' ||
      templateId === 'ev_charger' ||
      templateId === 'dishwasher'
    );
  }

  function groupCircuits(detailRows) {
    var map = {};
    detailRows.forEach(function (row) {
      var key = (row.schemaRef || '').trim() || (row.circuitRef || '').trim() || row.label;
      if (!map[key]) {
        map[key] = {
          key: key,
          schemaRef: (row.schemaRef || '').trim() || (row.circuitRef || '').trim() || '—',
          circuitRef: (row.circuitRef || '').trim(),
          label: row.label,
          location: row.location,
          board: row.board,
          usage: row.usage,
          templateId: row.templateId || '',
          pdemW: 0,
          cosPhi: row.cosPhi,
          count: 0,
        };
      }
      var g0 = map[key];
      g0.pdemW += row.pdem;
      g0.count += 1;
      if (!g0.label || g0.label === '—') g0.label = row.label;
      if (!g0.templateId && row.templateId) g0.templateId = row.templateId;
    });
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return String(a.schemaRef).localeCompare(String(b.schemaRef), undefined, { numeric: true });
      });
  }

  function buildProjectFromReport(report, boardFilter) {
    if (!report || !report.r || !report.r.ok) return { error: 'no_report' };
    var ad = report.r.data.additionalData;
    var meta = report.meta || {};
    var Uline = parseFloat(ad.Uline) || 230;
    var isTri = !!ad.isTri;
    var board = (boardFilter || '').trim();

    var rows = (ad.detailRows || []).filter(function (r) {
      if (!board) return true;
      var b = (r.board || '').trim() || '—';
      return b === board;
    });
    if (!rows.length) return { error: 'no_rows' };

    var grouped = groupCircuits(rows);
    var circuits = grouped.map(function (g1, idx) {
      var ib = circuitIbA(g1.pdemW, g1.cosPhi, isTri, Uline);
      var inA = roundUpStandardIn(ib);
      return {
        id: 'dep-' + idx,
        schemaRef: g1.schemaRef,
        circuitRef: g1.circuitRef,
        label: g1.label,
        location: g1.location,
        pdemW: Math.round(g1.pdemW),
        ibA: Math.round(ib * 10) / 10,
        inA: inA,
        curve: g1.pdemW > 4000 ? 'C' : 'C',
        rcd: needsTypeA(g1.usage, g1.templateId),
        usage: g1.usage,
        templateId: g1.templateId || '',
      };
    });

    var pBoard = rows.reduce(function (s, r) {
      return s + r.pdem;
    }, 0);
    var qBoard = rows.reduce(function (s, r) {
      return s + r.qdVar;
    }, 0);
    var sBoard = Math.sqrt(pBoard * pBoard + qBoard * qBoard);
    var ibBoard = isTri ? sBoard / (Math.sqrt(3) * Uline) : sBoard / Uline;
    var mainIn = roundUpStandardIn(ibBoard);

    return {
      version: 1,
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      meta: {
        ref: meta.ref || '',
        site: meta.site || '',
        client: meta.client || '',
        engineer: meta.engineer || '',
      },
      board: board || rows[0].board || 'TABLEAU',
      supply: {
        Uline: Uline,
        isTri: isTri,
        ibA: parseFloat(ad.ibA) || ibBoard,
        pTotalKw: (pBoard / 1000).toFixed(2),
        sTotalKva: (sBoard / 1000).toFixed(2),
        cosPhi: ad.cosPhiFinal,
      },
      mainProtection: {
        inA: Math.max(mainIn, circuits.reduce(function (m, c) {
          return Math.max(m, c.inA);
        }, 16)),
        rcdInA: 63,
        rcdMa: 30,
        rcdType: circuits.some(function (c) {
          return c.rcd;
        })
          ? 'A'
          : 'AC',
      },
      circuits: circuits,
    };
  }

  function escXml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function drawioEngine() {
    return g.ElectroDzUnifilarDrawio;
  }

  function proSvgEngine() {
    return g.ElectroDzUnifilarProSvg;
  }

  /** Libellés courts (abréviations bureau d’études). */
  function sourceShort(supply) {
    return supply.isTri ? '400V L1L2L3N' : '230V LN PE';
  }

  function techShort(project) {
    var s = project.supply;
    return (
      project.board +
      '\nPd ' +
      s.pTotalKw +
      'kW · I ' +
      (Math.round(s.ibA * 10) / 10) +
      'A · cos ' +
      (s.cosPhi != null ? s.cosPhi : '—')
    );
  }

  function mainShort(project) {
    var mp = project.mainProtection;
    return 'DG C' + mp.inA + '\nDDR ' + mp.rcdInA + 'A ' + mp.rcdMa + 'mA ' + mp.rcdType;
  }

  function departShort(c) {
    var ref = c.schemaRef || 'Q';
    var cal = 'C' + c.inA;
    var head = c.rcd ? 'DDR ' + cal + ' 30mA A' : ref + ' ' + cal;
    return head + '\nIb' + c.ibA + 'A Pd' + (c.pdemW / 1000).toFixed(1) + 'kW';
  }

  /** Génération draw.io (même moteur que diagrams.net — bibliothèque Electrical). */
  function projectToDrawioXml(project) {
    var D = drawioEngine();
    if (!D) return '';
    return D.buildDrawioXml(project, {
      techShort: techShort,
      sourceShort: sourceShort,
      departShort: departShort,
    });
  }

  function projectToSvgPro(project) {
    var P = proSvgEngine();
    if (!P) return '';
    return P.buildProSvg(project, {
      techShort: techShort,
      sourceShort: sourceShort,
      departShort: departShort,
    });
  }

  function projectToSvg(project) {
    return projectToSvgPro(project);
  }

  function purgeLegacyUnifilarCache() {
    LEGACY_KEYS.forEach(function (key) {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {}
    });
  }

  function saveProject(project) {
    if (!proSvgEngine()) return false;
    try {
      project.schemaVersion = SCHEMA_VERSION;
      purgeLegacyUnifilarCache();
      localStorage.setItem(STORAGE_PROJECT, JSON.stringify(project));
      if (drawioEngine()) {
        var xml = projectToDrawioXml(project);
        localStorage.setItem(STORAGE_DRAWIO, xml);
        sessionStorage.setItem(STORAGE_DRAWIO, xml);
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  function loadProject() {
    try {
      var raw = localStorage.getItem(STORAGE_PROJECT);
      var project = raw ? JSON.parse(raw) : null;
      if (project && project.schemaVersion !== SCHEMA_VERSION) return null;
      return project;
    } catch (e) {
      return null;
    }
  }

  function ensureDrawioEngine() {
    return !!proSvgEngine();
  }

  function listBoardsFromReport(report) {
    if (!report?.r?.ok) return [];
    var set = {};
    (report.r.data.additionalData.detailRows || []).forEach(function (r) {
      var b = (r.board || '').trim() || '—';
      set[b] = true;
    });
    return Object.keys(set).sort();
  }

  g.ElectroDzUnifilarFromBalance = {
    STORAGE_PROJECT: STORAGE_PROJECT,
    STORAGE_DRAWIO: STORAGE_DRAWIO,
    SCHEMA_VERSION: SCHEMA_VERSION,
    purgeLegacyUnifilarCache: purgeLegacyUnifilarCache,
    ensureDrawioEngine: ensureDrawioEngine,
    buildProjectFromReport: buildProjectFromReport,
    projectToDrawioXml: projectToDrawioXml,
    projectToSvg: projectToSvg,
    projectToSvgPro: projectToSvgPro,
    saveProject: saveProject,
    loadProject: loadProject,
    listBoardsFromReport: listBoardsFromReport,
    roundUpStandardIn: roundUpStandardIn,
  };
})(typeof window !== 'undefined' ? window : globalThis);
