/**
 * Moteur unifilaire — méthode diagrams.net / draw.io (mxgraph.electrical).
 * Pas de dessin maison : mêmes symboles et lignes que l’éditeur « Electrical » intégré.
 * Réf. https://www.diagrams.net/blog/use-draw-io-for-your-electrical-diagrams
 */
(function (g) {
  'use strict';

  /** Styles mxgraph (bibliothèque Engineering → Electrical de draw.io). */
  var MX = {
    ac: 'shape=mxgraph.electrical.signal_sources.ac_source;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    meter:
      'shape=mxgraph.electrical.meters.voltmeter;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    breaker:
      'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    rcd: 'shape=mxgraph.electrical.miscellaneous.residual_current_device;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    motor:
      'shape=mxgraph.electrical.rot_mechanical.motor;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    lamp: 'shape=mxgraph.electrical.lamps.incandescent_bulb;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    load: 'shape=mxgraph.electrical.miscellaneous.load;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    socket:
      'shape=mxgraph.electrical.electro_mechanical.receptacle;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    heater:
      'shape=mxgraph.electrical.resistors.heating_element;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
  };

  var WIRE_V = 'line;strokeWidth=2;strokeColor=#0284c7;direction=south;html=1;';
  var WIRE_H = 'line;strokeWidth=2;strokeColor=#0284c7;html=1;';
  var BUS_H = 'line;strokeWidth=4;strokeColor=#0284c7;html=1;';
  var TXT =
    'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=10;fontColor=#1e293b;';

  var SYM = 56;
  var BRK = 70;
  var BRK_H = 24;

  function escXml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveLoadMx(c) {
    var tid = c.templateId || '';
    if (/^light_/.test(tid) || c.usage === 'lighting') return MX.lamp;
    if (/^motor_/.test(tid) || c.usage === 'motors' || c.usage === 'welding') return MX.motor;
    if (/^sockets_/.test(tid) || c.usage === 'sockets') return MX.socket;
    if (
      tid === 'water_heater' ||
      tid === 'heating_electric' ||
      tid === 'cooker' ||
      tid === 'oven' ||
      tid === 'dryer' ||
      c.usage === 'heating'
    )
      return MX.heater;
    return MX.load;
  }

  /**
   * Génère le XML draw.io (méthode pro : symboles mxgraph + fils ligne droite H/V).
   */
  function buildDrawioXml(project, helpers) {
    var h = helpers || {};
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var colW = 120;
    var cx = 140;
    var busY = 320;
    var busLen = Math.max(400, n * colW + 60);
    var pageW = cx + busLen + 200;
    var pageH = 780;
    var cells = [];
    var id = 2;

    function nid() {
      return String(id++);
    }

    function vtx(value, style, x, y, w, ht) {
      var cid = nid();
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
          ht +
          '" as="geometry"/></mxCell>'
      );
      return cid;
    }

    function wireV(x, y, len) {
      vtx('', WIRE_V, x - 1, y, 3, len);
    }

    function wireH(x, y, len, thick) {
      vtx('', thick ? BUS_H : WIRE_H, x, y - (thick ? 2 : 1), len, thick ? 4 : 3);
    }

    var title = project.meta && project.meta.ref ? project.meta.ref + ' — ' + project.board : project.board;
    vtx(title, 'text;html=1;fontSize=14;fontStyle=1;align=left;fillColor=none;strokeColor=none;', 24, 12, 420, 22);
    if (h.techShort) vtx(h.techShort(project), TXT, 24, 38, 200, 36);

    var y = 72;
    vtx('', MX.ac, cx - SYM / 2, y, SYM, SYM);
    if (h.sourceShort) vtx(h.sourceShort(project.supply), TXT, cx + 36, y + 18, 100, 18);
    y += SYM + 6;
    wireV(cx, y, 16);
    y += 16;
    vtx('M', MX.meter, cx - SYM / 2, y, SYM, SYM);
    y += SYM + 6;
    wireV(cx, y, 20);
    y += 20;
    vtx('', MX.breaker, cx - BRK / 2, y, BRK, BRK_H);
    if (h.mainShort) vtx('DG C' + project.mainProtection.inA, TXT, cx + 40, y + 4, 80, 16);
    y += BRK_H + 6;
    wireV(cx, y, 14);
    y += 14;
    vtx('', MX.rcd, cx - BRK / 2, y, BRK, BRK_H);
    vtx(
      'DDR ' + project.mainProtection.rcdInA + 'A ' + project.mainProtection.rcdMa + 'mA',
      TXT + 'fontSize=9;',
      cx + 40,
      y + 2,
      110,
      28
    );
    y += BRK_H + 6;
    wireV(cx, y, busY - y);
    wireH(cx - 20, busY, busLen, true);

    var protY = busY + 24;
    var loadY = protY + BRK_H + 56;

    circuits.forEach(function (c, i) {
      var bx = cx + 50 + i * colW;
      wireV(bx, busY, protY - busY);
      var protStyle = c.rcd ? MX.rcd : MX.breaker;
      vtx('', protStyle, bx - BRK / 2, protY, BRK, BRK_H);
      wireV(bx, protY + BRK_H, loadY - (protY + BRK_H));
      if (h.departShort) vtx(h.departShort(c), TXT + 'fontSize=8;fontColor=#475569;', bx + 38, protY + 2, 100, 32);
      vtx('', resolveLoadMx(c), bx - SYM / 2, loadY, SYM, SYM);
      vtx(c.schemaRef || '—', TXT + 'fontSize=8;align=center;', bx - 30, loadY + SYM - 2, 60, 14);
    });

    var tableY = loadY + SYM + 28;
    vtx('Réf.', TXT + 'fontSize=8;fontStyle=1;', cx + 8, tableY, 36, 14);
    vtx('Pd', TXT + 'fontSize=8;fontStyle=1;', cx + 8, tableY + 14, 36, 14);
    circuits.forEach(function (c, i) {
      var bx = cx + 50 + i * colW;
      vtx(c.schemaRef || '—', TXT + 'fontSize=9;align=center;', bx - 32, tableY, 64, 14);
      vtx((c.pdemW / 1000).toFixed(2) + ' kW', TXT + 'fontSize=9;align=center;', bx - 32, tableY + 14, 64, 14);
    });

    vtx(
      'draw.io — symboles Electrical (mxgraph). Indicatif bilan NFC 15-100.',
      TXT + 'fontSize=8;fontColor=#94a3b8;',
      24,
      pageH - 28,
      520,
      16
    );

    return (
      '<mxfile host="DZSWISS ELEC" agent="unifilar-drawio-engine" version="22.1.0" type="device">' +
      '<diagram name="' +
      escXml(project.board) +
      '" id="unifilar-pro">' +
      '<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="0" arrows="0" fold="1" page="1" pageScale="1" pageWidth="' +
      pageW +
      '" pageHeight="' +
      pageH +
      '" math="0" shadow="0">' +
      '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
      cells.join('') +
      '</root></mxGraphModel></diagram></mxfile>'
    );
  }

  g.ElectroDzUnifilarDrawio = {
    MX: MX,
    buildDrawioXml: buildDrawioXml,
    resolveLoadMx: resolveLoadMx,
  };
})(typeof window !== 'undefined' ? window : globalThis);
