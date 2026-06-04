/**
 * Génération unifilaire assistée depuis le bilan de puissance (NFC 15-100 — indicatif).
 */
(function (g) {
  'use strict';

  var STORAGE_PROJECT = 'electrodz-unifilar-project-v1';
  var STORAGE_DRAWIO = 'electrodz-unifilar-drawio-v1';

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

  function needsTypeA(usage) {
    return usage === 'ev_charger' || usage === 'washing_machine' || usage === 'welding';
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
          pdemW: 0,
          cosPhi: row.cosPhi,
          count: 0,
        };
      }
      var g0 = map[key];
      g0.pdemW += row.pdem;
      g0.count += 1;
      if (!g0.label || g0.label === '—') g0.label = row.label;
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
        rcd: needsTypeA(g1.usage),
        usage: g1.usage,
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

  /** Fils et symboles diagrams.net — bibliothèque mxgraph.electrical (open source). */
  var EDGE_WIRE =
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#0f172a;endArrow=none;startArrow=none;';
  var SYM = {
    ac: 'shape=mxgraph.electrical.signal_sources.ac_source;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    breaker:
      'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#0f172a;fillColor=#ffffff;',
    ddr:
      'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#2563eb;fillColor=#ffffff;',
    fuse: 'shape=mxgraph.electrical.electro_mechanical.fuse;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    load:
      'shape=mxgraph.electrical.electro_mechanical.motor_1;html=1;whiteSpace=wrap;aspect=fixed;align=center;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#64748b;fillColor=#ffffff;',
    bus: 'line;strokeWidth=5;strokeColor=#0f172a;direction=south;html=1;',
  };

  /** Schéma draw.io avec symboles IEC (diagrams.net — bibliothèque Électrique). */
  function projectToDrawioXml(project) {
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var rowH = 96;
    var startY = 300;
    var pageW = 1169;
    var pageH = Math.max(827, startY + n * rowH + 120);
    var busX = 260;
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

    function addEdge(source, target) {
      var cid = nextId();
      cells.push(
        '<mxCell id="' +
          cid +
          '" style="' +
          EDGE_WIRE +
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
      40,
      20,
      520,
      28
    );
    var sub =
      (project.meta.client ? 'Client: ' + project.meta.client + ' · ' : '') +
      'Pd ≈ ' +
      project.supply.pTotalKw +
      ' kW · Ib ≈ ' +
      project.supply.ibA +
      ' A · ' +
      (project.supply.isTri ? '400 V tri' : '230 V mono') +
      ' — symboles diagrams.net (Électrique)';
    addVertex(
      sub,
      'text;html=1;fontSize=11;align=left;fontColor=#64748B;fillColor=none;strokeColor=none;',
      40,
      48,
      760,
      22
    );

    var acId = addVertex(
      project.supply.isTri ? '~400 V\n50 Hz' : '~230 V\n50 Hz',
      SYM.ac,
      busX - 8,
      88,
      60,
      60
    );
    var dgId = addVertex(
      'DG\n' + project.mainProtection.inA + ' A',
      SYM.breaker,
      busX - 37,
      168,
      75,
      20
    );
    var ddrId = addVertex(
      'DDR\n' +
        project.mainProtection.rcdInA +
        ' A / ' +
        project.mainProtection.rcdMa +
        ' mA ' +
        project.mainProtection.rcdType,
      SYM.ddr,
      busX - 37,
      208,
      75,
      20
    );

    var busTop = 248;
    var busBot = startY + (n - 1) * rowH + 36;
    var busId = addVertex('', SYM.bus, busX, busTop, 4, busBot - busTop);

    addEdge(acId, dgId);
    addEdge(dgId, ddrId);
    addEdge(ddrId, busId);

    circuits.forEach(function (c, i) {
      var y = startY + i * rowH;
      var brkLabel =
        c.schemaRef +
        '\n' +
        c.inA +
        ' A ' +
        c.curve +
        (c.rcd ? '\nDDR type A' : '');
      var brkId = addVertex(brkLabel, SYM.breaker, busX + 36, y + 8, 75, 20);
      var loadLabel =
        (c.label || 'Charge') +
        (c.location ? '\n' + c.location : '') +
        '\nPd ' +
        c.pdemW +
        ' W';
      var loadId = addVertex(loadLabel, SYM.load, busX + 200, y - 4, 100, 60);
      if (c.rcd) {
        var fuseId = addVertex('30 mA A', SYM.fuse, busX + 120, y + 10, 60, 20);
        addEdge(busId, fuseId);
        addEdge(fuseId, brkId);
      } else {
        addEdge(busId, brkId);
      }
      addEdge(brkId, loadId);
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

  /** Aperçu : message — le rendu fiable est dans diagrams.net (symboles IEC). */
  function projectToSvg(project) {
    var n = (project.circuits || []).length;
    return (
      '<div class="unif-preview-note" style="padding:20px;text-align:center;background:#fff;border-radius:12px;color:#334155;font-family:system-ui,sans-serif">' +
      '<p style="font-size:1rem;font-weight:700;margin:0 0 8px">' +
      escXml(project.board) +
      '</p>' +
      '<p style="font-size:0.9rem;margin:0 0 12px">' +
      n +
      ' départ(s) — symboles <strong>diagrams.net</strong> (bibliothèque Électrique : disjoncteurs, fusibles, moteurs, bus…)</p>' +
      '<p style="font-size:0.82rem;color:#64748b;margin:0">L’aperçu ci-dessus utilise l’éditeur intégré. Cliquez « Ouvrir dans l’éditeur » pour modifier avec tous les symboles pro.</p></div>'
    );
  }

  function saveProject(project) {
    try {
      localStorage.setItem(STORAGE_PROJECT, JSON.stringify(project));
      localStorage.setItem(STORAGE_DRAWIO, projectToDrawioXml(project));
    } catch (e) {
      return false;
    }
    return true;
  }

  function loadProject() {
    try {
      var raw = localStorage.getItem(STORAGE_PROJECT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
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
    buildProjectFromReport: buildProjectFromReport,
    projectToDrawioXml: projectToDrawioXml,
    projectToSvg: projectToSvg,
    saveProject: saveProject,
    loadProject: loadProject,
    listBoardsFromReport: listBoardsFromReport,
    roundUpStandardIn: roundUpStandardIn,
  };
})(typeof window !== 'undefined' ? window : globalThis);
