/**
 * Génération unifilaire assistée depuis le bilan de puissance (NFC 15-100 — indicatif).
 */
(function (g) {
  'use strict';

  var STORAGE_PROJECT = 'electrodz-unifilar-project-v2';
  var STORAGE_DRAWIO = 'electrodz-unifilar-drawio-v2';
  var SCHEMA_VERSION = 2;
  var LEGACY_KEYS = [
    'electrodz-unifilar-project-v1',
    'electrodz-unifilar-drawio-v1',
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

  var EDGE_V =
    'edgeStyle=none;rounded=0;html=1;strokeWidth=2;strokeColor=#0284c7;endArrow=none;startArrow=none;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;';
  var FEEDER_V = 'line;strokeWidth=2;strokeColor=#0284c7;direction=south;html=1;';

  function iec() {
    return g.ElectroDzIecSymbols;
  }

  function iecStyle(id, w, h) {
    var lib = iec();
    if (!lib) return FEEDER_V;
    return lib.drawioImageStyle(id, w, h);
  }
  var TXT =
    'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=11;fontColor=#1e293b;';
  function resolveLoadIecId(c) {
    var lib = iec();
    return lib ? lib.resolveLoadSymbol(c) : 'resistor_load';
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

  var SYM_W = 48;
  var SYM_H = 48;
  var BRK_W = 48;
  var BRK_H = 48;
  /** Gabarit pro : symboles IEC (Hager/NIBT), liaisons H/V uniquement. */
  function projectToDrawioXml(project) {
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var colW = 108;
    var cxFeed = 130;
    var busX0 = cxFeed;
    var busLen = Math.max(320, n * colW + 40);
    var pageW = Math.max(1100, busX0 + busLen + 220);
    var pageH = 720;
    var busY = 268;
    var cells = [];
    var id = 2;

    function nextId() {
      return String(id++);
    }

    function addVertex(value, style, x, y, w, h) {
      var cid = nextId();
      cells.push(
        '<mxCell id="' +
          cid +
          '" value="' +
          escXml(value) +
          '" style="' +
          style +
          '" vertex="1" parent="1">' +
          '<mxGeometry x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          w +
          '" height="' +
          h +
          '" as="geometry"/></mxCell>'
      );
      return cid;
    }

    function addSym(style, x, y, w, h) {
      return addVertex('', style, x, y, w, h);
    }

    function addTxt(text, x, y, w, h, extra) {
      return addVertex(text, TXT + (extra || ''), x, y, w, h);
    }

    function addEdge(source, target) {
      var cid = nextId();
      cells.push(
        '<mxCell id="' +
          cid +
          '" style="' +
          EDGE_V +
          '" edge="1" parent="1" source="' +
          source +
          '" target="' +
          target +
          '"><mxGeometry relative="1" as="geometry"/></mxCell>'
      );
      return cid;
    }

    var title = project.meta.ref
      ? project.meta.ref + ' — ' + project.board
      : project.board;
    addVertex(
      title,
      'text;html=1;fontSize=14;fontStyle=1;align=left;fillColor=none;strokeColor=none;',
      24,
      12,
      400,
      24
    );
    addTxt(techShort(project), 24, 40, 140, 40, 'fontSize=10;');

    var lib = iec();
    var srcKey = lib ? lib.resolveSourceSymbol(project.supply) : 'ac_source';

    var y = 80;
    var srcId = addSym(iecStyle(srcKey, SYM_W, SYM_H), cxFeed - SYM_W / 2, y, SYM_W, SYM_H);
    addTxt(sourceShort(project.supply), cxFeed + 34, y + 14, 90, 20, 'fontSize=10;');
    y += SYM_H + 8;
    var meterId = addSym(iecStyle('energy_meter', SYM_W, SYM_H), cxFeed - SYM_W / 2, y, SYM_W, SYM_H);
    y += SYM_H + 4;
    addSym(FEEDER_V, cxFeed - 1, y, 3, 20);
    y += 20;
    var dgId = addSym(iecStyle('circuit_breaker', BRK_W, BRK_H), cxFeed - BRK_W / 2, y, BRK_W, BRK_H);
    addTxt('DG C' + project.mainProtection.inA, cxFeed + 42, y + 14, 72, 16, 'fontSize=9;');
    y += BRK_H + 4;
    addSym(FEEDER_V, cxFeed - 1, y, 3, 16);
    y += 16;
    var rcdMainId = addSym(iecStyle('rcd', BRK_W, BRK_H), cxFeed - BRK_W / 2, y, BRK_W, BRK_H);
    addTxt(
      'DDR ' + project.mainProtection.rcdInA + 'A ' + project.mainProtection.rcdMa + 'mA ' + project.mainProtection.rcdType,
      cxFeed + 42,
      y + 10,
      110,
      28,
      'fontSize=8;'
    );
    y += BRK_H + 4;
    addSym(FEEDER_V, cxFeed - 1, y, 3, busY - y + 4);
    var busJunctionId = addSym(
      'ellipse;fillColor=#0284c7;strokeColor=#0284c7;opacity=80;html=1;',
      cxFeed - 3,
      busY - 3,
      6,
      6
    );
    addSym('line;strokeWidth=4;strokeColor=#0284c7;html=1;', busX0, busY, busLen, 4);

    addEdge(srcId, meterId);
    addEdge(meterId, dgId);
    addEdge(dgId, rcdMainId);
    addEdge(rcdMainId, busJunctionId);

    var branchTop = busY + 24;
    var protY = branchTop + 8;
    var loadY = protY + BRK_H + 56;

    circuits.forEach(function (c, i) {
      var cx = busX0 + 44 + i * colW;
      addSym(FEEDER_V, cx - 1, branchTop, 3, loadY - branchTop + SYM_H + 8);
      var protKey = lib ? lib.resolveBranchProtection(c) : 'circuit_breaker';
      addSym(iecStyle(protKey, BRK_W, BRK_H), cx - BRK_W / 2, protY, BRK_W, BRK_H);
      addTxt(departShort(c), cx + 42, protY + 8, 88, 32, 'fontSize=8;fontColor=#475569;');
      var loadKey = resolveLoadIecId(c);
      addSym(iecStyle(loadKey, SYM_W, SYM_H), cx - SYM_W / 2, loadY, SYM_W, SYM_H);
      addTxt(c.schemaRef || '—', cx - 28, loadY + SYM_H - 4, 56, 14, 'fontSize=8;align=center;');
    });

    var tableY = loadY + 72;
    addTxt('Réf.', 'fontSize=8;fontStyle=1;align=center;', busX0 + 8, tableY, 40, 14);
    addTxt('Pd', 'fontSize=8;fontStyle=1;align=center;', busX0 + 8, tableY + 14, 40, 14);
    circuits.forEach(function (c, i) {
      var cx = busX0 + 44 + i * colW;
      addTxt(c.schemaRef || '—', 'fontSize=9;align=center;', cx - 30, tableY, 60, 16);
      addTxt((c.pdemW / 1000).toFixed(2) + ' kW', 'fontSize=9;align=center;', cx - 30, tableY + 22, 60, 16);
    });

    return (
      '<mxfile host="DZSWISS ELEC" agent="unifilar-from-balance" version="22.1.0">' +
      '<diagram name="' +
      escXml(project.board) +
      '">' +
      '<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="' +
      pageW +
      '" pageHeight="' +
      pageH +
      '" math="0" shadow="0">' +
      '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
      cells.join('') +
      '</root></mxGraphModel></diagram></mxfile>'
    );
  }

  function svgIec(id, cx, cy, size) {
    var lib = iec();
    return lib ? lib.renderSymbolG(id, cx, cy, size || 48) : '';
  }

  function svgFeederV(x, y1, y2) {
    return (
      '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="#0284c7" stroke-width="2"/>'
    );
  }

  /** Aperçu SVG (style CYPELEC) — rendu fiable sans dépendre de draw.io. */
  function projectToSvgPro(project) {
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var colW = 100;
    var cxFeed = 118;
    var busX0 = cxFeed;
    var busLen = Math.max(300, n * colW + 20);
    var w = busX0 + busLen + 160;
    var lib = iec();
    var srcKey = lib ? lib.resolveSourceSymbol(project.supply) : 'ac_source';
    var busY = 300;
    var branchTop = 324;
    var protY = 332;
    var loadY = 420;
    var tableY = 540;
    var pageH = 580;
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        w +
        ' ' +
        pageH +
        '" width="100%" style="max-width:' +
        w +
        'px;background:#fff;font-family:Segoe UI,system-ui,sans-serif">',
      '<style>text{fill:#1e293b}.muted{fill:#64748b;font-size:9px}.hdr{font-size:12px;font-weight:700}</style>',
      '<text class="hdr" x="20" y="22">' +
        escXml(project.meta.ref ? project.meta.ref + ' — ' + project.board : project.board) +
        '</text>',
      '<text class="muted" x="20" y="40">' +
        escXml(techShort(project).split('\n')[1] || '') +
        '</text>',
      svgIec(srcKey, cxFeed, 92, 44),
      '<text x="' +
        (cxFeed + 30) +
        '" y="88" font-size="10">' +
        escXml(sourceShort(project.supply)) +
        '</text>',
      svgIec('energy_meter', cxFeed, 138, 40),
      svgFeederV(cxFeed, 158, 172),
      svgIec('circuit_breaker', cxFeed, 196, 40),
      '<text x="' +
        (cxFeed + 32) +
        '" y="200" font-size="9">DG C' +
        project.mainProtection.inA +
        '</text>',
      svgFeederV(cxFeed, 216, 228),
      svgIec('rcd', cxFeed, 252, 40),
      '<text x="' +
        (cxFeed + 32) +
        '" y="256" font-size="8">DDR ' +
        escXml(
          project.mainProtection.rcdInA +
            'A ' +
            project.mainProtection.rcdMa +
            'mA ' +
            project.mainProtection.rcdType
        ) +
        '</text>',
      svgFeederV(cxFeed, 272, busY),
      '<line x1="' +
        busX0 +
        '" y1="' +
        busY +
        '" x2="' +
        (busX0 + busLen) +
        '" y2="' +
        busY +
        '" stroke="#0284c7" stroke-width="4"/>',
      '<text x="' +
        (busX0 + 8) +
        '" y="' +
        (busY - 6) +
        '" font-size="9" fill="#0369a1">Barre</text>',
    ];

    circuits.forEach(function (c, i) {
      var cx = busX0 + 50 + i * colW;
      var protKey = lib ? lib.resolveBranchProtection(c) : 'circuit_breaker';
      var loadKey = resolveLoadIecId(c);
      parts.push(svgFeederV(cx, busY, loadY + 24));
      parts.push(svgIec(protKey, cx, protY, 40));
      parts.push(
        '<text x="' +
          (cx + 24) +
          '" y="' +
          (protY + 6) +
          '" font-size="8" fill="#475569">' +
          escXml(departShort(c).replace(/\n/g, ' ')) +
          '</text>'
      );
      parts.push(svgIec(loadKey, cx, loadY, 44));
      parts.push(
        '<text x="' +
          cx +
          '" y="' +
          (loadY + 38) +
          '" text-anchor="middle" font-size="8">' +
          escXml(c.schemaRef || '') +
          '</text>'
      );
    });

    parts.push('<text x="' + (busX0 + 4) + '" y="' + tableY + '" font-size="8" font-weight="700">Réf.</text>');
    parts.push('<text x="' + (busX0 + 4) + '" y="' + (tableY + 14) + '" font-size="8" font-weight="700">Pd</text>');
    circuits.forEach(function (c, i) {
      var cx = busX0 + 50 + i * colW;
      parts.push(
        '<text x="' +
          cx +
          '" y="' +
          tableY +
          '" text-anchor="middle" font-size="9">' +
          escXml(c.schemaRef || '—') +
          '</text>'
      );
      parts.push(
        '<text x="' +
          cx +
          '" y="' +
          (tableY + 16) +
          '" text-anchor="middle" font-size="9">' +
          (c.pdemW / 1000).toFixed(2) +
          ' kW</text>'
      );
    });
    parts.push(
      '<text class="muted" x="20" y="568">DZSWISS ELEC — indicatif (bilan). Pas Caneco/CYPELEC. Édition : Schémas et plans.</text></svg>'
    );
    return parts.join('');
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
    if (!iec()) return false;
    try {
      project.schemaVersion = SCHEMA_VERSION;
      purgeLegacyUnifilarCache();
      localStorage.setItem(STORAGE_PROJECT, JSON.stringify(project));
      localStorage.setItem(STORAGE_DRAWIO, projectToDrawioXml(project));
      sessionStorage.setItem(STORAGE_DRAWIO, projectToDrawioXml(project));
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

  function ensureIecLibrary() {
    if (!iec()) {
      console.warn('[unifilar] iec-symbol-library.js manquant — symboles non disponibles.');
      return false;
    }
    return true;
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
    ensureIecLibrary: ensureIecLibrary,
    buildProjectFromReport: buildProjectFromReport,
    projectToDrawioXml: projectToDrawioXml,
    projectToSvg: projectToSvg,
    projectToSvgPro: projectToSvgPro,
    saveProject: saveProject,
    loadProject: loadProject,
    listBoardsFromReport: listBoardsFromReport,
    roundUpStandardIn: roundUpStandardIn,
    resolveLoadIecId: resolveLoadIecId,
  };
})(typeof window !== 'undefined' ? window : globalThis);
