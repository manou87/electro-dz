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
  var SYM = {
    ac: 'shape=mxgraph.electrical.signal_sources.ac_source;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    breaker:
      'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    busH:
      'shape=mxgraph.electrical.transmission.2_line_bus;html=1;strokeWidth=2;strokeColor=#0284c7;fillColor=none;align=center;',
    feeder: 'line;strokeWidth=2;strokeColor=#0284c7;direction=south;html=1;',
  };
  var TXT =
    'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=11;fontColor=#1e293b;';
  var BRK_W = 75;
  var BRK_H = 20;

  var TEMPLATE_ICON = {
    light_rooms: 'lighting',
    light_stairs: 'lighting',
    light_parking: 'lighting',
    outdoor_light: 'lighting',
    sockets_living: 'socket',
    sockets_kitchen: 'socket',
    sockets_bedrooms: 'socket',
    sockets_bathroom: 'socket',
    sockets_office: 'socket',
    sockets_garage: 'socket',
    hvac_ventilation: 'hvac',
    motor_pump: 'motor',
    motor_lift: 'motor',
    washing_machine: 'washing-machine',
    heating_electric: 'water-heater',
    water_heater: 'water-heater',
    cooker: 'oven',
    oven: 'oven',
    dishwasher: 'oven',
    dryer: 'water-heater',
    welding: 'motor',
    ev_charger: 'ev-charger',
  };

  function siteOrigin() {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'https://electro-dz.com';
  }

  function loadIconUrl(iconKey) {
    return siteOrigin() + '/assets/unifilar/' + iconKey + '.svg';
  }

  function resolveLoadIcon(c) {
    var tid = c.templateId || '';
    if (TEMPLATE_ICON[tid]) return TEMPLATE_ICON[tid];
    var label = String(c.label || '').toLowerCase();
    if (/lave|linge|wash/.test(label)) return 'washing-machine';
    if (/lampe|éclair|eclair|luminaire|light/.test(label)) return 'lighting';
    if (/moteur|motor|pompe|ventil|ascenseur|lift|ventilateur/.test(label)) return 'motor';
    if (/prise|socket|pc |informat/.test(label)) return 'socket';
    if (/chauffe|cumulus|eau chaude|ballon/.test(label)) return 'water-heater';
    if (/four|cuisini|plaque|oven|cook/.test(label)) return 'oven';
    if (/clim|hvac|cta|groupe froid/.test(label)) return 'hvac';
    if (/ve |irve|borne|ev /.test(label)) return 'ev-charger';
    switch (c.usage) {
      case 'lighting':
        return 'lighting';
      case 'motors':
        return 'motor';
      case 'sockets':
        return 'socket';
      case 'heating':
        return 'water-heater';
      case 'welding':
        return 'motor';
      default:
        return 'generic';
    }
  }

  function imageStyle(iconKey) {
    return (
      'shape=image;html=1;labelBackgroundColor=none;verticalLabelPosition=bottom;verticalAlign=top;aspect=fixed;imageAspect=0;image=' +
      loadIconUrl(iconKey) +
      ';'
    );
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

  var SYM_METER =
    'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff7ed;strokeColor=#c2410c;align=center;fontStyle=0;fontSize=11;';
  var SYM_LAMP =
    'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffffff;strokeColor=#0f172a;fontSize=16;fontStyle=1;align=center;';
  /** Gabarit type CYPELEC : compteur, DG, barre, départs verticaux, tableau Pd. */
  function projectToDrawioXml(project) {
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var colW = 108;
    var cxFeed = 130;
    var busX0 = cxFeed;
    var busLen = Math.max(320, n * colW + 40);
    var pageW = Math.max(1100, busX0 + busLen + 220);
    var pageH = 640;
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

    var y = 88;
    var srcId = addSym(SYM.ac, cxFeed - 28, y, 56, 56);
    addTxt(sourceShort(project.supply), cxFeed + 34, y + 14, 90, 20, 'fontSize=10;');
    y += 62;
    var meterId = addVertex('M', SYM_METER, cxFeed - 20, y, 40, 32);
    y += 40;
    addSym(SYM.feeder, cxFeed - 1, y, 3, 28);
    y += 28;
    var qgId = addSym(SYM.breaker, cxFeed - BRK_W / 2, y, BRK_W, BRK_H);
    addTxt(mainShort(project), cxFeed + 42, y - 2, 100, 36, 'fontSize=9;');
    y += 30;
    addSym(SYM.feeder, cxFeed - 1, y, 3, busY - y + 6);
    var busId = addSym(SYM.busH, busX0, busY, busLen, 26);

    addEdge(srcId, meterId);
    addEdge(meterId, qgId);
    addEdge(qgId, busId);

    var branchTop = busY + 30;
    var loadY = branchTop + 168;

    circuits.forEach(function (c, i) {
      var cx = busX0 + 44 + i * colW;
      addSym(SYM.feeder, cx - 1, branchTop, 3, loadY - branchTop + 40);
      addSym(SYM.breaker, cx - BRK_W / 2, branchTop + 4, BRK_W, BRK_H);
      addTxt(departShort(c), cx + 42, branchTop + 2, 88, 32, 'fontSize=8;fontColor=#475569;');
      var icon = resolveLoadIcon(c);
      if (c.usage === 'lighting' || icon === 'lighting') {
        addVertex('×', SYM_LAMP, cx - 12, loadY, 24, 24);
      } else {
        addVertex('', imageStyle(icon), cx - 28, loadY - 8, 56, 56);
      }
      addTxt(c.schemaRef || '—', cx - 28, loadY + 34, 56, 14, 'fontSize=8;align=center;');
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

  function svgBreakerG(x, y) {
    return (
      '<g transform="translate(' +
      x +
      ',' +
      y +
      ')"><line x1="0" y1="10" x2="16" y2="10" stroke="#111" stroke-width="2"/>' +
      '<line x1="16" y1="2" x2="16" y2="18" stroke="#111" stroke-width="2"/>' +
      '<line x1="16" y1="10" x2="30" y2="5" stroke="#111" stroke-width="2"/>' +
      '<line x1="16" y1="10" x2="30" y2="15" stroke="#111" stroke-width="2"/></g>'
    );
  }

  function svgMeterG(x, y) {
    return (
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="36" height="30" fill="#fff7ed" stroke="#c2410c" stroke-width="1.5"/>' +
      '<text x="' +
      (x + 18) +
      '" y="' +
      (y + 20) +
      '" text-anchor="middle" font-size="12" font-weight="700" fill="#9a3412">M</text>'
    );
  }

  function svgLoadAt(c, cx, cy) {
    var icon = resolveLoadIcon(c);
    if (c.usage === 'lighting' || icon === 'lighting') {
      return (
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="11" fill="#fff" stroke="#111" stroke-width="1.8"/>' +
        '<text x="' +
        cx +
        '" y="' +
        (cy + 5) +
        '" text-anchor="middle" font-size="15" font-weight="700">×</text>'
      );
    }
    if (c.usage === 'sockets' || icon === 'socket') {
      return (
        '<path d="M' +
        (cx - 10) +
        ' ' +
        (cy + 5) +
        ' A10 10 0 0 1 ' +
        (cx + 10) +
        ' ' +
        (cy + 5) +
        '" fill="none" stroke="#111" stroke-width="1.8"/>' +
        '<line x1="' +
        (cx - 6) +
        '" y1="' +
        (cy + 5) +
        '" x2="' +
        (cx - 6) +
        '" y2="' +
        (cy + 12) +
        '" stroke="#111" stroke-width="1.5"/>' +
        '<line x1="' +
        (cx + 6) +
        '" y1="' +
        (cy + 5) +
        '" x2="' +
        (cx + 6) +
        '" y2="' +
        (cy + 12) +
        '" stroke="#111" stroke-width="1.5"/>'
      );
    }
    return (
      '<image href="' +
      escXml(loadIconUrl(icon)) +
      '" x="' +
      (cx - 24) +
      '" y="' +
      (cy - 24) +
      '" width="48" height="48"/>'
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
    var busY = 268;
    var branchTop = 302;
    var loadY = 470;
    var tableY = 530;
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' +
        w +
        ' 580" width="100%" style="max-width:' +
        w +
        'px;background:#fff;font-family:Segoe UI,system-ui,sans-serif">',
      '<style>text{fill:#1e293b}.muted{fill:#64748b;font-size:9px}.hdr{font-size:12px;font-weight:700}</style>',
      '<text class="hdr" x="20" y="22">' +
        escXml(project.meta.ref ? project.meta.ref + ' — ' + project.board : project.board) +
        '</text>',
      '<text class="muted" x="20" y="40">' +
        escXml(techShort(project).split('\n')[1] || '') +
        '</text>',
      '<circle cx="' +
        cxFeed +
        '" cy="108" r="22" fill="#fff" stroke="#111" stroke-width="1.8"/>',
      '<text x="' +
        (cxFeed + 32) +
        '" y="102" font-size="10">' +
        escXml(sourceShort(project.supply)) +
        '</text>',
      svgMeterG(cxFeed - 23, 138),
      '<line x1="' +
        cxFeed +
        '" y1="176" x2="' +
        cxFeed +
        '" y2="198" stroke="#0284c7" stroke-width="2"/>',
      svgBreakerG(cxFeed - 15, 198),
      '<text x="' +
        (cxFeed + 36) +
        '" y="204" font-size="9">' +
        escXml(mainShort(project).replace(/\n/g, ' ')) +
        '</text>',
      '<line x1="' +
        cxFeed +
        '" y1="218" x2="' +
        cxFeed +
        '" y2="' +
        busY +
        '" stroke="#0284c7" stroke-width="2"/>',
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
      parts.push(
        '<line x1="' +
          cx +
          '" y1="' +
          busY +
          '" x2="' +
          cx +
          '" y2="' +
          (loadY + 20) +
          '" stroke="#0284c7" stroke-width="2"/>'
      );
      parts.push(svgBreakerG(cx - 15, branchTop));
      parts.push(
        '<text x="' +
          (cx + 24) +
          '" y="' +
          (branchTop + 8) +
          '" font-size="8" fill="#475569">' +
          escXml(departShort(c).replace(/\n/g, ' ')) +
          '</text>'
      );
      parts.push(svgLoadAt(c, cx, loadY));
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
    projectToSvgPro: projectToSvgPro,
    saveProject: saveProject,
    loadProject: loadProject,
    listBoardsFromReport: listBoardsFromReport,
    roundUpStandardIn: roundUpStandardIn,
  };
})(typeof window !== 'undefined' ? window : globalThis);
