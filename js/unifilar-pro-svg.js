/**
 * Unifilaire — layout type CYPELEC, symboles strictement IEC 60617 (ElectroDzIecSymbols).
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
  var PROT_SIZE = 40;
  var LOAD_SIZE = 44;
  var LABEL_DX = 30;

  function iec() {
    return g.ElectroDzIecSymbols;
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function portY(sym, cy, size, which) {
    var I = iec();
    var half = size / 2;
    var p = sym.ports[which];
    var vb = I && I.symVb ? I.symVb(sym) : (sym.viewBox || 48);
    return cy - half + p[1] * (size / vb);
  }

  function placeIec(parts, id, cx, cy, size) {
    var I = iec();
    if (!I) return { top: cy - size / 2, bottom: cy + size / 2 };
    parts.push(I.renderSymbolG(id, cx, cy, size));
    var sym = I.getSymbol(id);
    return { top: portY(sym, cy, size, 'n'), bottom: portY(sym, cy, size, 's'), cy: cy, id: id };
  }

  function vWire(x, y1, y2) {
    var ya = Math.min(y1, y2);
    var yb = Math.max(y1, y2);
    if (yb - ya < 0.5) return '';
    return (
      '<line x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '" stroke="' + WIRE + '" stroke-width="2"/>'
    );
  }

  function hWire(x1, x2, y, thick) {
    var xa = Math.min(x1, x2);
    var xb = Math.max(x1, x2);
    if (xb - xa < 0.5) return '';
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

  function chainTrunk(parts, I, supply, mp) {
    var items = [
      { id: I.resolveSourceSymbol(supply), size: PROT_SIZE, label: I.getSymbol(I.resolveSourceSymbol(supply)).label },
      { id: 'energy_meter', size: PROT_SIZE, label: 'Compteur' },
      { id: 'circuit_breaker', size: PROT_SIZE, label: mainBreakerLabel(mp) },
      { id: 'rcd', size: PROT_SIZE, label: mainRcdLabel(mp) },
    ];
    var cy = 74;
    var prev = null;
    items.forEach(function (item, idx) {
      if (idx > 0) cy = prev.bottom + 18 + item.size / 2;
      var p = placeIec(parts, item.id, TRUNK_X, cy, item.size);
      if (prev) parts.push(vWire(TRUNK_X, prev.bottom, p.top));
      if (idx === 0 && supply) {
        parts.push(lbl(TRUNK_X + LABEL_DX, cy - 4, supply.isTri ? '400 V 3~ N PE' : '230 V ~ N PE', 8));
      } else if (item.label) {
        var lines = item.label.indexOf('\n') >= 0 ? item.label.split('\n') : [item.label];
        if (idx === 2 || idx === 3) parts.push(lblBlock(TRUNK_X + LABEL_DX, cy - 8, lines, 8));
        else parts.push(lbl(TRUNK_X + LABEL_DX, cy - 4, item.label, 8));
      }
      prev = p;
    });
    return prev;
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
    var I = iec();
    if (!I) {
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" width="100%">' +
        '<text x="20" y="40" font-size="12" fill="#b91c1c">Bibliothèque IEC non chargée — rechargez la page.</text></svg>'
      );
    }

    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var mp = project.mainProtection || { inA: 32, rcdInA: 63, rcdMa: 30, rcdType: 'AC' };
    var supply = project.supply || {};

    var colXs = [];
    for (var i = 0; i < n; i++) colXs.push(colX(i));
    var busX1 = colXs[0];
    var busX2 = colXs[n - 1];

    var busY = 0;
    var loadY = 0;
    var tableY = 0;
    var pageW = Math.max(420, 24 + 118 + n * COL_W + 48);
    var pageH = 0;

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + pageW + ' 400" width="100%" style="max-width:100%;background:#fff;font-family:' + FONT + '">',
      '<rect width="100%" height="100%" fill="#fff"/>',
    ];

    var title = project.board || 'TABLEAU';
    if (project.meta && project.meta.ref) title = project.meta.ref + ' — ' + title;
    parts.push(lbl(24, 26, title, 14, 'start', 800));
    parts.push(
      lbl(
        24,
        42,
        'Pd ' + (supply.pTotalKw || '—') + ' kW · I ' + (Math.round((supply.ibA || 0) * 10) / 10) + ' A · cos ' + (supply.cosPhi != null ? supply.cosPhi : '—'),
        9,
        'start',
        400
      )
    );
    parts.push(lbl(24, 56, 'Symboles Hager Normen — IEC 60617 (base officielle PDF)', 7, 'start', 400));

    var trunkEnd = chainTrunk(parts, I, supply, mp);
    busY = trunkEnd.bottom + 22;
    parts.push(vWire(TRUNK_X, trunkEnd.bottom, busY));
    if (n > 1) parts.push(hWire(busX1, busX2, busY, true));

    circuits.forEach(function (c, i) {
      var cx = colXs[i];
      var protId = I.resolveBranchProtection(c);
      var loadId = I.resolveLoadSymbol(c);
      var protCy = busY + 16 + PROT_SIZE / 2;
      var prot = placeIec(parts, protId, cx, protCy, PROT_SIZE);
      parts.push(vWire(cx, busY, prot.top));
      parts.push(lblBlock(cx + LABEL_DX, protCy - 10, branchLabels(c), 7.5, MUTED));
      var loadCy = prot.bottom + 18 + LOAD_SIZE / 2;
      var load = placeIec(parts, loadId, cx, loadCy, LOAD_SIZE);
      parts.push(vWire(cx, prot.bottom, load.top));
      parts.push(lbl(cx, load.bottom + 12, c.schemaRef || c.circuitRef || '—', 9, 'middle', 700));
      loadY = Math.max(loadY, load.bottom);
    });

    tableY = loadY + 36;
    drawTable(parts, circuits, tableY);
    pageH = tableY + 56;

    parts[0] =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + pageW + ' ' + pageH + '" width="100%" style="max-width:100%;background:#fff;font-family:' + FONT + '">';
    parts.push(lbl(24, pageH - 10, 'Généré depuis le bilan — indicatif NFC 15-100. Symboles IEC 60617.', 7, 'start', 400));
    parts.push('</svg>');
    return parts.join('');
  }

  g.ElectroDzUnifilarProSvg = {
    buildProSvg: buildProSvg,
  };
})(typeof window !== 'undefined' ? window : globalThis);
