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

  /** Schéma vectoriel draw.io (mxGraph) — disposition unifilaire verticale */
  function projectToDrawioXml(project) {
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var rowH = 88;
    var startY = 200;
    var pageH = Math.max(827, startY + n * rowH + 120);
    var pageW = 1169;
    var busX = 280;
    var cells = [];
    var id = 2;

    function cell(value, style, x, y, w, h, edge, parent, source, target) {
      var cid = String(id++);
      var geo =
        '<mxGeometry x="' +
        x +
        '" y="' +
        y +
        '" width="' +
        w +
        '" height="' +
        h +
        '" as="geometry"/>';
      if (edge) {
        cells.push(
          '<mxCell id="' +
            cid +
            '" style="' +
            style +
            '" edge="1" parent="' +
            parent +
            '" source="' +
            source +
            '" target="' +
            target +
            '">' +
            geo +
            '</mxCell>'
        );
      } else {
        cells.push(
          '<mxCell id="' +
            cid +
            '" value="' +
            escXml(value) +
            '" style="' +
            style +
            '" vertex="1" parent="' +
            parent +
            '">' +
            geo +
            '</mxCell>'
        );
      }
      return cid;
    }

    var title = project.meta.ref
      ? project.meta.ref + ' — ' + project.board
      : project.board;
    cell(
      title,
      'text;html=1;fontSize=14;fontStyle=1;align=left;fillColor=none;strokeColor=none;',
      40,
      24,
      520,
      28,
      false,
      '1'
    );
    var sub =
      (project.meta.client ? 'Client: ' + project.meta.client + ' · ' : '') +
      'Pd ≈ ' +
      project.supply.pTotalKw +
      ' kW · Ib ≈ ' +
      project.supply.ibA +
      ' A · ' +
      (project.supply.isTri ? '400 V tri' : '230 V mono');
    cell(
      sub,
      'text;html=1;fontSize=11;align=left;fontColor=#64748B;fillColor=none;strokeColor=none;',
      40,
      52,
      700,
      22,
      false,
      '1'
    );

    var supplyId = cell(
      'Alimentation\n' +
        (project.supply.isTri ? '400 V ~ 50 Hz' : '230 V ~ 50 Hz') +
        '\nCompteur',
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#ca8a04;fontStyle=1;',
      40,
      120,
      120,
      70,
      false,
      '1'
    );

    var mainId = cell(
      'Disj. général\n' +
        project.mainProtection.inA +
        ' A\nDDR ' +
        project.mainProtection.rcdInA +
        ' A ' +
        project.mainProtection.rcdMa +
        ' mA ' +
        project.mainProtection.rcdType,
      'rounded=0;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;',
      40,
      210,
      140,
      72,
      false,
      '1'
    );

    cell('', 'endArrow=block;strokeWidth=2;strokeColor=#334155;', 0, 0, 0, 0, true, '1', supplyId, mainId);

    var busTop = startY - 20;
    var busBot = startY + (n - 1) * rowH + 40;
    var busId = cell(
      '',
      'line;strokeWidth=4;strokeColor=#0f172a;',
      busX,
      busTop,
      4,
      busBot - busTop,
      false,
      '1'
    );

    cell('', 'endArrow=block;strokeWidth=2;strokeColor=#334155;', 0, 0, 0, 0, true, '1', mainId, busId);

    circuits.forEach(function (c, i) {
      var y = startY + i * rowH;
      var brkId = cell(
        c.schemaRef + '\n' + c.inA + ' A curv. ' + c.curve + (c.rcd ? '\nDDR dédié' : ''),
        'rounded=0;whiteSpace=wrap;html=1;fillColor=#ecfdf5;strokeColor=#059669;fontStyle=1;',
        busX + 24,
        y,
        110,
        56,
        false,
        '1'
      );
      var loadId = cell(
        c.label + (c.location ? '\n(' + c.location + ')' : '') + '\nPd ' + c.pdemW + ' W · Ib ' + c.ibA + ' A',
        'rounded=0;whiteSpace=wrap;html=1;fillColor=#f8fafc;strokeColor=#94a3b8;',
        busX + 180,
        y - 4,
        280,
        64,
        false,
        '1'
      );
      cell('', 'endArrow=block;strokeWidth=2;strokeColor=#334155;', 0, 0, 0, 0, true, '1', busId, brkId);
      cell('', 'endArrow=block;strokeWidth=2;strokeColor=#64748b;dashed=1;', 0, 0, 0, 0, true, '1', brkId, loadId);
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

  function projectToSvg(project) {
    var circuits = project.circuits || [];
    var n = circuits.length;
    var rowH = 72;
    var w = 820;
    var h = 160 + n * rowH;
    var busX = 200;
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:' + w + 'px;background:#fff">',
      '<style>text{font-family:Segoe UI,system-ui,sans-serif}.t{font-size:13px;fill:#0f172a}.s{font-size:11px;fill:#64748b}.h{font-size:16px;font-weight:700;fill:#047857}</style>',
      '<text class="h" x="24" y="32">' + escXml(project.board) + '</text>',
      '<text class="s" x="24" y="52">' +
        escXml(
          (project.meta.client ? project.meta.client + ' — ' : '') +
            'Pd ' +
            project.supply.pTotalKw +
            ' kW · Ib ' +
            project.supply.ibA +
            ' A'
        ) +
        '</text>',
      '<rect x="24" y="72" width="110" height="48" rx="6" fill="#fef3c7" stroke="#ca8a04"/>',
      '<text class="t" x="34" y="94">Alimentation</text>',
      '<text class="s" x="34" y="110">' +
        escXml(project.supply.isTri ? '400 V tri' : '230 V mono') +
        '</text>',
      '<rect x="24" y="132" width="130" height="56" rx="4" fill="#dbeafe" stroke="#2563eb"/>',
      '<text class="t" x="34" y="154">DG ' + project.mainProtection.inA + ' A</text>',
      '<text class="s" x="34" y="172">DDR ' +
        project.mainProtection.rcdInA +
        'A / ' +
        project.mainProtection.rcdMa +
        'mA ' +
        project.mainProtection.rcdType +
        '</text>',
      '<line x1="' + busX + '" y1="100" x2="' + busX + '" y2="' + (140 + n * rowH) + '" stroke="#0f172a" stroke-width="4"/>',
    ];
    circuits.forEach(function (c, i) {
      var y = 140 + i * rowH;
      parts.push('<line x1="' + busX + '" y1="' + (y + 20) + '" x2="' + (busX + 40) + '" y2="' + (y + 20) + '" stroke="#334155" stroke-width="2"/>');
      parts.push(
        '<rect x="' +
          (busX + 40) +
          '" y="' +
          (y + 2) +
          '" width="100" height="40" fill="#ecfdf5" stroke="#059669"/>'
      );
      parts.push(
        '<text class="t" x="' +
          (busX + 48) +
          '" y="' +
          (y + 20) +
          '">' +
          escXml(c.schemaRef + ' ' + c.inA + 'A') +
          '</text>'
      );
      parts.push(
        '<text class="s" x="' +
          (busX + 160) +
          '" y="' +
          (y + 18) +
          '">' +
          escXml(c.label + ' — ' + c.pdemW + ' W') +
          '</text>'
      );
    });
    parts.push(
      '<text class="s" x="24" y="' +
        (h - 16) +
        '">DZSWISS ELEC — unifilaire indicatif (vérifier calibres sur site). NFC 15-100.</text></svg>'
    );
    return parts.join('');
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
