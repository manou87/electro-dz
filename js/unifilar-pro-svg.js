/**
 * Unifilaire — gabarit type CYPELEC / bureau d’études.
 * Tronc vertical → barre bus (entre 1er et dernier départ) → départs → tableau Réf./Pd.
 */
(function (g) {
  'use strict';

  var WIRE = '#2563eb';
  var BUS = '#1d4ed8';
  var INK = '#0f172a';
  var MUTED = '#475569';
  var FONT = 'Segoe UI,system-ui,sans-serif';

  var COL_W = 118;
  var TRUNK_X = 108;
  var SYM = 34;
  var BRK_W = 40;
  var BRK_H = 20;
  var LABEL_DX = 28;

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function vWire(x, y1, y2) {
    var ya = Math.min(y1, y2);
    var yb = Math.max(y1, y2);
    if (yb - ya < 1) return '';
    return (
      '<line x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '" stroke="' + WIRE + '" stroke-width="2"/>'
    );
  }

  function hWire(x1, x2, y, thick) {
    var xa = Math.min(x1, x2);
    var xb = Math.max(x1, x2);
    if (xb - xa < 1) return '';
    return (
      '<line x1="' + xa + '" y1="' + y + '" x2="' + xb + '" y2="' + y + '" stroke="' + BUS + '" stroke-width="' + (thick ? 3.5 : 2) + '"/>'
    );
  }

  function lbl(x, y, text, size, anchor, weight) {
    return (
      '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + (size || 9) + '" font-weight="' + (weight || 400) + '" fill="' + INK + '" text-anchor="' + (anchor || 'start') + '">' + esc(text) + '</text>'
    );
  }

  function lblBlock(x, y, lines, size, color) {
    var parts = ['<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + (size || 8) + '" fill="' + (color || INK) + '">'];
    lines.forEach(function (line, i) {
      parts.push('<tspan x="' + x + '" dy="' + (i === 0 ? 0 : 10) + '">' + esc(line) + '</tspan>');
    });
    parts.push('</text>');
    return parts.join('');
  }

  function gAc(cx, cy) {
    return (
      '<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="#fff" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<path d="M' + (cx - 8) + ' ' + cy + 'c3-6 5-6 8 0s5 6 8 0" fill="none" stroke="' + INK + '" stroke-width="1.2"/>'
    );
  }

  function gMeter(cx, cy) {
    return (
      '<rect x="' + (cx - 16) + '" y="' + (cy - 12) + '" width="32" height="24" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-family="' + FONT + '" font-size="13" font-weight="700" fill="' + INK + '">M</text>'
    );
  }

  function gBreaker(cx, cy) {
    var x = cx - BRK_W / 2;
    var y = cy - BRK_H / 2;
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + BRK_W + '" height="' + BRK_H + '" fill="#fff" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<line x1="' + (x + 5) + '" y1="' + (y + BRK_H - 4) + '" x2="' + (x + BRK_W - 5) + '" y2="' + (y + 4) + '" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<line x1="' + (x + 5) + '" y1="' + (y + 4) + '" x2="' + (x + BRK_W - 5) + '" y2="' + (y + BRK_H - 4) + '" stroke="' + INK + '" stroke-width="1.4"/>'
    );
  }

  function gRcd(cx, cy) {
    var x = cx - BRK_W / 2;
    var y = cy - BRK_H / 2;
    return (
      gBreaker(cx, cy) +
      '<path d="M' + (cx - 4) + ' ' + (y + BRK_H + 1) + ' L' + cx + ' ' + (y + BRK_H + 6) + ' L' + (cx + 4) + ' ' + (y + BRK_H + 1) + '" fill="none" stroke="' + INK + '" stroke-width="1.1"/>'
    );
  }

  function gLamp(cx, cy) {
    return (
      '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<line x1="' + (cx - 6) + '" y1="' + (cy - 6) + '" x2="' + (cx + 6) + '" y2="' + (cy + 6) + '" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<line x1="' + (cx + 6) + '" y1="' + (cy - 6) + '" x2="' + (cx - 6) + '" y2="' + (cy + 6) + '" stroke="' + INK + '" stroke-width="1.2"/>'
    );
  }

  function gMotor(cx, cy) {
    return (
      '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="#fff" stroke="' + INK + '" stroke-width="1.4"/>' +
      lbl(cx, cy + 4, 'M', 12, 'middle', 700)
    );
  }

  function gSocket(cx, cy) {
    return (
      '<path d="M' + (cx - 9) + ' ' + (cy + 2) + ' A9 9 0 0 1 ' + (cx + 9) + ' ' + (cy + 2) + '" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<line x1="' + (cx - 4) + '" y1="' + (cy + 2) + '" x2="' + (cx - 4) + '" y2="' + (cy + 9) + '" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<line x1="' + (cx + 4) + '" y1="' + (cy + 2) + '" x2="' + (cx + 4) + '" y2="' + (cy + 9) + '" stroke="' + INK + '" stroke-width="1.2"/>'
    );
  }

  function gHeater(cx, cy) {
    return (
      '<rect x="' + (cx - 12) + '" y="' + (cy - 7) + '" width="24" height="16" fill="#fff" stroke="' + INK + '" stroke-width="1.3"/>' +
      '<path d="M' + (cx - 8) + ' ' + (cy + 5) + ' L' + (cx - 3) + ' ' + (cy - 3) + ' L' + cx + ' ' + (cy + 3) + ' L' + (cx + 3) + ' ' + (cy - 3) + ' L' + (cx + 8) + ' ' + (cy + 5) + '" fill="none" stroke="' + INK + '" stroke-width="1.2"/>'
    );
  }

  function gLoad(cx, cy) {
    return gHeater(cx, cy);
  }

  function resolveLoad(c) {
    var tid = c.templateId || '';
    if (/^light_/.test(tid) || c.usage === 'lighting') return gLamp;
    if (/^motor_/.test(tid) || c.usage === 'motors' || c.usage === 'welding') return gMotor;
    if (/^sockets_/.test(tid) || c.usage === 'sockets') return gSocket;
    if (
      tid === 'water_heater' ||
      tid === 'heating_electric' ||
      tid === 'cooker' ||
      tid === 'oven' ||
      tid === 'dryer' ||
      c.usage === 'heating'
    )
      return gHeater;
    return gLoad;
  }

  function colX(i) {
    return TRUNK_X + i * COL_W;
  }

  function mainBreakerLabel(mp) {
    return 'Disj. général — Courbe C, In: ' + mp.inA + ' A';
  }

  function mainRcdLabel(mp) {
    return 'DDR ' + mp.rcdInA + ' A — ' + mp.rcdMa + ' mA ' + (mp.rcdType || 'AC');
  }

  function branchLabels(c) {
    var ref = c.schemaRef || c.circuitRef || '—';
    var lines = [
      ref + (c.label && c.label !== '—' ? ' — ' + c.label : ''),
      'Magnétothermique, Courbe ' + (c.curve || 'C') + ', In: ' + c.inA + ' A',
      'Ib ' + c.ibA + ' A — Pd ' + (c.pdemW / 1000).toFixed(2) + ' kW',
    ];
    if (c.rcd) lines.push('DDR 30 mA Type A');
    return lines;
  }

  function drawTable(parts, circuits, tableY) {
    var rowH = 20;
    var labelW = 118;
    var n = circuits.length;
    var tableW = labelW + n * COL_W;
    var x0 = 24;

    parts.push(
      '<rect x="' + x0 + '" y="' + tableY + '" width="' + tableW + '" height="' + rowH * 2 + '" fill="#fff" stroke="#dc2626" stroke-width="1.5"/>'
    );
    for (var r = 0; r <= 2; r++) {
      var yy = tableY + r * rowH;
      parts.push('<line x1="' + x0 + '" y1="' + yy + '" x2="' + (x0 + tableW) + '" y2="' + yy + '" stroke="#dc2626" stroke-width="1"/>');
    }
    parts.push('<line x1="' + (x0 + labelW) + '" y1="' + tableY + '" x2="' + (x0 + labelW) + '" y2="' + (tableY + rowH * 2) + '" stroke="#dc2626" stroke-width="1"/>');
    circuits.forEach(function (_c, i) {
      var xx = x0 + labelW + i * COL_W;
      parts.push('<line x1="' + xx + '" y1="' + tableY + '" x2="' + xx + '" y2="' + (tableY + rowH * 2) + '" stroke="#dc2626" stroke-width="1"/>');
    });

    parts.push(lbl(x0 + 8, tableY + 13, 'Référence', 8, 'start', 700));
    parts.push(lbl(x0 + 8, tableY + rowH + 13, 'Puissance demandée', 8, 'start', 700));
    circuits.forEach(function (c, i) {
      var cx = x0 + labelW + i * COL_W + COL_W / 2;
      parts.push(lbl(cx, tableY + 13, c.schemaRef || c.circuitRef || '—', 9, 'middle', 600));
      parts.push(lbl(cx, tableY + rowH + 13, (c.pdemW / 1000).toFixed(2) + ' kW', 9, 'middle', 600));
    });
  }

  function buildProSvg(project, h) {
    h = h || {};
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var mp = project.mainProtection || { inA: 32, rcdInA: 63, rcdMa: 30, rcdType: 'AC' };
    var supply = project.supply || {};

    var busY = 198;
    var protY = busY + 24;
    var loadY = protY + 88;
    var tableY = loadY + 42;
    var pageW = Math.max(420, 24 + 118 + n * COL_W + 48);
    var pageH = tableY + 56;

    var colXs = [];
    for (var i = 0; i < n; i++) colXs.push(colX(i));
    var busX1 = colXs[0];
    var busX2 = colXs[n - 1];

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + pageW + ' ' + pageH + '" width="100%" style="max-width:100%;background:#fff;font-family:' + FONT + '">',
      '<rect width="100%" height="100%" fill="#fff"/>',
    ];

    var title = project.board || 'TABLEAU';
    if (project.meta && project.meta.ref) title = project.meta.ref + ' — ' + title;
    parts.push(lbl(24, 26, title, 14, 'start', 800));
    var sub =
      'Pd ' + (supply.pTotalKw || '—') + ' kW · I ' + (Math.round((supply.ibA || 0) * 10) / 10) + ' A · cos ' + (supply.cosPhi != null ? supply.cosPhi : '—');
    parts.push(lbl(24, 42, sub, 9, 'start', 400));
    if (h.sourceShort) parts.push(lbl(24, 56, h.sourceShort(supply), 8, 'start', 400));

    var y = 78;
    parts.push(gAc(TRUNK_X, y));
    if (h.sourceShort) parts.push(lbl(TRUNK_X + LABEL_DX, y + 4, h.sourceShort(supply), 8));

    y += 22;
    parts.push(vWire(TRUNK_X, y - 10, y + 4));
    parts.push(gMeter(TRUNK_X, y + 14));
    parts.push(lbl(TRUNK_X + LABEL_DX, y + 12, 'Compteur', 8));

    y += 32;
    parts.push(vWire(TRUNK_X, y - 4, y + 6));
    var yDg = y + 6 + BRK_H / 2;
    parts.push(gBreaker(TRUNK_X, yDg));
    parts.push(lblBlock(TRUNK_X + LABEL_DX, yDg - 6, [mainBreakerLabel(mp)], 8));

    y = yDg + BRK_H / 2 + 8;
    parts.push(vWire(TRUNK_X, y, y + 10));
    var yRcd = y + 10 + BRK_H / 2;
    parts.push(gRcd(TRUNK_X, yRcd));
    parts.push(lblBlock(TRUNK_X + LABEL_DX, yRcd - 8, [mainRcdLabel(mp)], 8));

    var yBusTop = yRcd + BRK_H / 2 + 6;
    parts.push(vWire(TRUNK_X, yBusTop, busY));
    if (n > 1) parts.push(hWire(busX1, busX2, busY, true));

    circuits.forEach(function (c, i) {
      var cx = colXs[i];
      var brkY = protY + BRK_H / 2;
      parts.push(vWire(cx, busY, protY));
      if (c.rcd) parts.push(gRcd(cx, brkY));
      else parts.push(gBreaker(cx, brkY));
      parts.push(lblBlock(cx + LABEL_DX, protY - 2, branchLabels(c), 7.5, MUTED));
      parts.push(vWire(cx, protY + BRK_H, loadY - 16));
      parts.push(resolveLoad(c)(cx, loadY));
      parts.push(lbl(cx, loadY + 22, c.schemaRef || c.circuitRef || '—', 9, 'middle', 700));
    });

    drawTable(parts, circuits, tableY);

    parts.push(lbl(24, pageH - 10, 'Généré depuis le bilan de puissance — indicatif NFC 15-100.', 7, 'start', 400));
    parts.push('</svg>');
    return parts.join('');
  }

  g.ElectroDzUnifilarProSvg = {
    buildProSvg: buildProSvg,
  };
})(typeof window !== 'undefined' ? window : globalThis);
