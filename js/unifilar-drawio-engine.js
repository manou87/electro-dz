/**
 * Moteur unifilaire draw.io — même logique de layout que unifilar-pro-svg (type CYPELEC).
 */
(function (g) {
  'use strict';

  var MX = {
    ac: 'shape=mxgraph.electrical.signal_sources.ac_source;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    meter: 'shape=mxgraph.electrical.meters.voltmeter;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    breaker: 'shape=mxgraph.electrical.electro_mechanical.circuit_breaker;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    rcd: 'shape=mxgraph.electrical.miscellaneous.residual_current_device;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    motor: 'shape=mxgraph.electrical.rot_mechanical.motor;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    lamp: 'shape=mxgraph.electrical.lamps.incandescent_bulb;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    load: 'shape=mxgraph.electrical.miscellaneous.load;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    socket: 'shape=mxgraph.electrical.electro_mechanical.receptacle;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
    heater: 'shape=mxgraph.electrical.resistors.heating_element;html=1;whiteSpace=wrap;aspect=fixed;align=center;strokeColor=#0f172a;fillColor=#ffffff;',
  };

  var WIRE_V = 'line;strokeWidth=2;strokeColor=#2563eb;direction=south;html=1;';
  var WIRE_H = 'line;strokeWidth=2;strokeColor=#2563eb;html=1;';
  var BUS_H = 'line;strokeWidth=3.5;strokeColor=#1d4ed8;html=1;';
  var TXT = 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=9;fontColor=#334155;';
  var TXT_TITLE = 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=14;fontStyle=1;fontColor=#0f172a;';

  var TRUNK_X = 108;
  var COL_W = 118;
  var SYM = 48;
  var BRK = 56;
  var BRK_H = 22;
  var LABEL_DX = 32;

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
    if (tid === 'water_heater' || tid === 'heating_electric' || tid === 'cooker' || tid === 'oven' || tid === 'dryer' || c.usage === 'heating')
      return MX.heater;
    return MX.load;
  }

  function colX(i) {
    return TRUNK_X + i * COL_W;
  }

  function buildDrawioXml(project, helpers) {
    var h = helpers || {};
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var mp = project.mainProtection || {};
    var supply = project.supply || {};
    var cells = [];
    var id = 2;

    function nid() {
      return String(id++);
    }

    function vtx(value, style, x, y, w, ht) {
      var cid = nid();
      cells.push(
        '<mxCell id="' + cid + '" value="' + escXml(value) + '" style="' + style + '" vertex="1" parent="1">' +
          '<mxGeometry x="' + x + '" y="' + y + '" width="' + w + '" height="' + ht + '" as="geometry"/></mxCell>'
      );
      return cid;
    }

    function wireV(x, y, len) {
      if (len < 2) return;
      vtx('', WIRE_V, x - 1, y, 3, len);
    }

    function wireH(x, y, len, thick) {
      if (len < 2) return;
      vtx('', thick ? BUS_H : WIRE_H, x, y - (thick ? 2 : 1), len, thick ? 4 : 3);
    }

    var colXs = [];
    for (var i = 0; i < n; i++) colXs.push(colX(i));

    var busY = 198;
    var protY = busY + 24;
    var loadY = protY + 88;
    var tableY = loadY + 42;
    var pageW = Math.max(520, 24 + 118 + n * COL_W + 80);
    var pageH = tableY + 80;

    var title = project.board || 'TABLEAU';
    if (project.meta && project.meta.ref) title = project.meta.ref + ' — ' + title;
    vtx(title, TXT_TITLE, 24, 16, 400, 24);
    vtx(
      'Pd ' + (supply.pTotalKw || '—') + ' kW · I ' + (supply.ibA || '—') + ' A · cos ' + (supply.cosPhi != null ? supply.cosPhi : '—'),
      TXT,
      24,
      40,
      360,
      18
    );

    var y = 72;
    vtx('', MX.ac, TRUNK_X - SYM / 2, y, SYM, SYM);
    if (h.sourceShort) vtx(h.sourceShort(supply), TXT, TRUNK_X + LABEL_DX, y + 14, 120, 16);
    y += SYM + 8;
    wireV(TRUNK_X, y, 14);
    y += 14;
    vtx('M', MX.meter, TRUNK_X - SYM / 2, y, SYM, SYM);
    vtx('Compteur', TXT, TRUNK_X + LABEL_DX, y + 16, 80, 14);
    y += SYM + 10;
    wireV(TRUNK_X, y, 12);
    y += 12;
    vtx('', MX.breaker, TRUNK_X - BRK / 2, y, BRK, BRK_H);
    vtx('Disj. général — Courbe C, In: ' + (mp.inA || 32) + ' A', TXT, TRUNK_X + LABEL_DX, y + 2, 200, 28);
    y += BRK_H + 8;
    wireV(TRUNK_X, y, 12);
    y += 12;
    vtx('', MX.rcd, TRUNK_X - BRK / 2, y, BRK, BRK_H);
    vtx('DDR ' + (mp.rcdInA || 63) + ' A — ' + (mp.rcdMa || 30) + ' mA ' + (mp.rcdType || 'AC'), TXT, TRUNK_X + LABEL_DX, y, 200, 28);
    y += BRK_H + 6;
    wireV(TRUNK_X, y, busY - y);
    if (n > 1) wireH(colXs[0], busY, colXs[n - 1] - colXs[0], true);

    circuits.forEach(function (c, i) {
      var cx = colXs[i];
      wireV(cx, busY, protY - busY);
      vtx('', c.rcd ? MX.rcd : MX.breaker, cx - BRK / 2, protY, BRK, BRK_H);
      var ref = c.schemaRef || c.circuitRef || '—';
      var lines =
        ref +
        (c.label && c.label !== '—' ? ' — ' + c.label : '') +
        '\nMagnétothermique, Courbe ' +
        (c.curve || 'C') +
        ', In: ' +
        c.inA +
        ' A\nIb ' +
        c.ibA +
        ' A — Pd ' +
        (c.pdemW / 1000).toFixed(2) +
        ' kW' +
        (c.rcd ? '\nDDR 30 mA Type A' : '');
      vtx(lines, TXT + 'fontSize=8;fontColor=#475569;', cx + LABEL_DX, protY - 2, 160, 48);
      wireV(cx, protY + BRK_H, loadY - (protY + BRK_H));
      vtx('', resolveLoadMx(c), cx - SYM / 2, loadY, SYM, SYM);
      vtx(ref, TXT + 'fontSize=9;fontStyle=1;align=center;', cx - 28, loadY + SYM - 4, 56, 14);
    });

    var x0 = 24;
    var labelW = 118;
    var tableW = labelW + n * COL_W;
    vtx('Référence', TXT + 'fontStyle=1;fontColor=#dc2626;', x0 + 8, tableY + 4, 100, 16);
    vtx('Puissance demandée', TXT + 'fontStyle=1;fontColor=#dc2626;', x0 + 8, tableY + 24, 100, 16);
    circuits.forEach(function (c, i) {
      var cx = x0 + labelW + i * COL_W + COL_W / 2 - 28;
      vtx(c.schemaRef || c.circuitRef || '—', TXT + 'align=center;fontStyle=1;', cx, tableY + 4, 56, 16);
      vtx((c.pdemW / 1000).toFixed(2) + ' kW', TXT + 'align=center;fontStyle=1;', cx, tableY + 24, 56, 16);
    });

    return (
      '<mxfile host="DZSWISS ELEC" agent="unifilar-drawio-engine" version="22.1.0" type="device">' +
      '<diagram name="' + escXml(project.board) + '" id="unifilar-pro">' +
      '<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="0" arrows="0" fold="1" page="1" pageScale="1" pageWidth="' + pageW + '" pageHeight="' + pageH + '" math="0" shadow="0">' +
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
