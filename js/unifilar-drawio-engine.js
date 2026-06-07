/**
 * Moteur unifilaire draw.io — layout CYPELEC + symboles IEC 60617 (images SVG normées).
 */
(function (g) {
  'use strict';

  var WIRE_V = 'line;strokeWidth=2;strokeColor=#2563eb;direction=south;html=1;';
  var WIRE_H = 'line;strokeWidth=2;strokeColor=#2563eb;html=1;';
  var BUS_H = 'line;strokeWidth=3.5;strokeColor=#1d4ed8;html=1;';
  var TXT = 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=9;fontColor=#334155;';
  var TXT_TITLE = 'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=14;fontStyle=1;fontColor=#0f172a;';

  var TRUNK_X = 108;
  var COL_W = 118;
  var PROT = 48;
  var LOAD = 52;
  var LABEL_DX = 34;

  function iec() {
    return g.ElectroDzIecSymbols;
  }

  function escXml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function colX(i) {
    return TRUNK_X + i * COL_W;
  }

  function iecStyle(id, w, h) {
    var I = iec();
    return I ? I.drawioImageStyle(id, w || PROT, h || PROT) : 'rounded=0;whiteSpace=wrap;html=1;';
  }

  function buildDrawioXml(project, helpers) {
    var I = iec();
    if (!I) return '';

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

    var pageW = Math.max(520, 24 + 118 + n * COL_W + 80);
    var pageH = 520;

    var title = project.board || 'TABLEAU';
    if (project.meta && project.meta.ref) title = project.meta.ref + ' — ' + title;
    vtx(title, TXT_TITLE, 24, 16, 400, 24);
    vtx(
      'Pd ' + (supply.pTotalKw || '—') + ' kW · I ' + (supply.ibA || '—') + ' A · symboles IEC 60617',
      TXT,
      24,
      40,
      360,
      18
    );

    var y = 64;
    var trunkIds = [
      I.resolveSourceSymbol(supply),
      'energy_meter',
      'circuit_breaker',
      'rcd',
    ];
    var trunkLabels = [
      supply.isTri ? '400 V 3~ N PE' : '230 V ~ N PE',
      'Compteur',
      'Disj. général — Courbe C, In: ' + (mp.inA || 32) + ' A',
      'DDR ' + (mp.rcdInA || 63) + ' A — ' + (mp.rcdMa || 30) + ' mA ' + (mp.rcdType || 'AC'),
    ];
    var prevBottom = y;
    trunkIds.forEach(function (symId, idx) {
      if (idx > 0) y = prevBottom + 12;
      vtx('', iecStyle(symId, PROT, PROT), TRUNK_X - PROT / 2, y, PROT, PROT);
      vtx(trunkLabels[idx], TXT, TRUNK_X + LABEL_DX, y + 14, 200, 16);
      if (idx > 0) wireV(TRUNK_X, prevBottom + PROT, 12);
      prevBottom = y;
      y += PROT;
    });

    var busY = y + 16;
    wireV(TRUNK_X, y, 16);
    if (n > 1) wireH(colXs[0], busY, colXs[n - 1] - colXs[0], true);

    circuits.forEach(function (c, i) {
      var cx = colXs[i];
      var protY = busY + 14;
      var protId = I.resolveBranchProtection(c);
      var loadId = I.resolveLoadSymbol(c);
      wireV(cx, busY, 14);
      vtx('', iecStyle(protId, PROT, PROT), cx - PROT / 2, protY, PROT, PROT);
      var ref = c.schemaRef || c.circuitRef || '—';
      vtx(
        ref +
          (c.label && c.label !== '—' ? ' — ' + c.label : '') +
          '\nCourbe ' +
          (c.curve || 'C') +
          ', In: ' +
          c.inA +
          ' A · Ib ' +
          c.ibA +
          ' A · Pd ' +
          (c.pdemW / 1000).toFixed(2) +
          ' kW',
        TXT + 'fontSize=8;fontColor=#475569;',
        cx + LABEL_DX,
        protY,
        170,
        40
      );
      var loadY = protY + PROT + 16;
      wireV(cx, protY + PROT, 16);
      vtx('', iecStyle(loadId, LOAD, LOAD), cx - LOAD / 2, loadY, LOAD, LOAD);
      vtx(ref, TXT + 'fontSize=9;fontStyle=1;align=center;', cx - 28, loadY + LOAD - 6, 56, 14);
    });

    var tableY = 400;
    var x0 = 24;
    var labelW = 118;
    vtx('Référence', TXT + 'fontStyle=1;fontColor=#dc2626;', x0 + 8, tableY + 4, 100, 16);
    vtx('Puissance demandée', TXT + 'fontStyle=1;fontColor=#dc2626;', x0 + 8, tableY + 24, 100, 16);
    circuits.forEach(function (c, i) {
      var cx = x0 + labelW + i * COL_W + COL_W / 2 - 28;
      vtx(c.schemaRef || c.circuitRef || '—', TXT + 'align=center;fontStyle=1;', cx, tableY + 4, 56, 16);
      vtx((c.pdemW / 1000).toFixed(2) + ' kW', TXT + 'align=center;fontStyle=1;', cx, tableY + 24, 56, 16);
    });

    return (
      '<mxfile host="DZSWISS ELEC" agent="unifilar-drawio-engine" version="22.1.0" type="device">' +
      '<diagram name="' + escXml(project.board) + '" id="unifilar-iec">' +
      '<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="0" arrows="0" fold="1" page="1" pageScale="1" pageWidth="' + pageW + '" pageHeight="' + pageH + '" math="0" shadow="0">' +
      '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
      cells.join('') +
      '</root></mxGraphModel></diagram></mxfile>'
    );
  }

  g.ElectroDzUnifilarDrawio = {
    buildDrawioXml: buildDrawioXml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
