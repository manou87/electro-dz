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

  var EDGE_WIRE =
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#0284c7;endArrow=none;startArrow=none;';
  var SYM = {
    ac: 'shape=mxgraph.electrical.signal_sources.ac_source;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    earth:
      'shape=mxgraph.electrical.signal_sources.protective_earth;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#16a34a;fillColor=#ffffff;',
    breaker:
      'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#0f172a;fillColor=#ffffff;fontSize=10;',
    ddr:
      'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;verticalLabelPosition=bottom;verticalAlign=top;strokeColor=#2563eb;fillColor=#ffffff;fontSize=10;',
    fuse: 'shape=mxgraph.electrical.electro_mechanical.fuse;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;fontSize=10;',
    busH:
      'shape=mxgraph.electrical.transmission.2_line_bus;html=1;strokeWidth=2;strokeColor=#0284c7;fillColor=none;align=center;',
    wireV: 'line;strokeWidth=2;strokeColor=#0284c7;direction=south;html=1;',
  };

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

  function sourceLabel(supply) {
    if (supply.isTri) {
      return '400 V — 3Ph + N + PE\n50 Hz\nL1 · L2 · L3 · N · PE';
    }
    return '230 V — 1Ph + N + PE\n50 Hz\nL · N · PE';
  }

  function departProtectionLabel(c) {
    var lines = [c.schemaRef || 'Q'];
    lines.push('Disj. ' + c.inA + ' A — curbe ' + c.curve);
    lines.push('Ib ≈ ' + c.ibA + ' A');
    if (c.rcd) lines.push('DDR 30 mA — type A');
    return lines.join('\n');
  }

  /** Unifilaire type bureau d’études : barre horizontale + départs verticaux + icône charge. */
  function projectToDrawioXml(project) {
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var colW = 148;
    var busY = 228;
    var busX0 = 100;
    var busLen = Math.max(360, n * colW + 120);
    var pageW = Math.max(1169, busX0 + busLen + 80);
    var pageH = 620;
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
      'text;html=1;fontSize=15;fontStyle=1;align=left;fillColor=none;strokeColor=none;',
      40,
      16,
      520,
      28
    );
    addVertex(
      (project.meta.client ? 'Client: ' + project.meta.client + ' · ' : '') +
        'Pd ≈ ' +
        project.supply.pTotalKw +
        ' kW · Ib ≈ ' +
        project.supply.ibA +
        ' A',
      'text;html=1;fontSize=11;align=left;fontColor=#64748B;fillColor=none;strokeColor=none;',
      40,
      42,
      700,
      20
    );

    var feedX = busX0 - 20;
    var srcId = addVertex(sourceLabel(project.supply), SYM.ac, feedX - 22, 72, 64, 64);
    addVertex(
      'PE',
      SYM.earth,
      feedX + 52,
      108,
      28,
      28
    );
    var dgId = addVertex(
      'DG — disj. général\nIn ' +
        project.mainProtection.inA +
        ' A\nIb tableau ≈ ' +
        Math.round(project.supply.ibA * 10) / 10 +
        ' A',
      SYM.breaker,
      feedX - 38,
      152,
      80,
      36
    );
    var ddrMainId = addVertex(
      'DDR général\n' +
        project.mainProtection.rcdInA +
        ' A · ' +
        project.mainProtection.rcdMa +
        ' mA\nType ' +
        project.mainProtection.rcdType,
      SYM.ddr,
      feedX - 38,
      198,
      80,
      36
    );

    var busId = addVertex(
      project.supply.isTri ? '0,4 kV — L1 L2 L3 N' : '230 V — L N',
      SYM.busH,
      busX0,
      busY,
      busLen,
      28
    );

    addEdge(srcId, dgId);
    addEdge(dgId, ddrMainId);
    addEdge(ddrMainId, busId);

    circuits.forEach(function (c, i) {
      var cx = busX0 + 50 + i * colW;
      var y = busY + 36;
      var prev = busId;

      if (c.rcd) {
        var ddrDepId = addVertex(
          'DDR départ\n30 mA type A',
          SYM.ddr,
          cx - 38,
          y,
          76,
          32
        );
        addEdge(prev, ddrDepId);
        prev = ddrDepId;
        y += 44;
      }

      var brkId = addVertex(departProtectionLabel(c), SYM.breaker, cx - 38, y, 76, 40);
      addEdge(prev, brkId);
      y += 52;

      var wireId = addVertex('', SYM.wireV, cx - 2, y, 4, 48);
      addEdge(brkId, wireId);
      y += 52;

      var iconKey = resolveLoadIcon(c);
      var imgId = addVertex(
        (c.label || 'Charge') + '\n' + c.pdemW + ' W',
        imageStyle(iconKey),
        cx - 36,
        y,
        72,
        72
      );
      addEdge(wireId, imgId);

      addVertex(
        c.location ? c.location : '',
        'text;html=1;fontSize=9;align=center;fontColor=#64748B;fillColor=none;strokeColor=none;',
        cx - 40,
        y + 76,
        80,
        16
      );
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
      ' départ(s) — barre horizontale, protections détaillées, icône par charge (lave-linge, lampe, moteur…)</p>' +
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
