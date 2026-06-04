/**
 * Unifilaire pro — gabarit type bureau d’études (CYPE / Caneco).
 * SVG fixe : symboles + fils H/V + libellés à droite (aperçu lisible, sans iframe).
 */
(function (g) {
  'use strict';

  var WIRE = '#1d4ed8';
  var INK = '#0f172a';
  var MUTED = '#64748b';
  var FONT = 'Segoe UI,system-ui,sans-serif';

  var INX = 88;
  var SYM = 36;
  var BRK_W = 44;
  var BRK_H = 22;
  var COL = 108;
  var GAP = 10;

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function vWire(x, y1, y2) {
    return (
      '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="' + WIRE + '" stroke-width="2"/>'
    );
  }

  function hWire(x1, x2, y, thick) {
    return (
      '<line x1="' +
      x1 +
      '" y1="' +
      y +
      '" x2="' +
      x2 +
      '" y2="' +
      y +
      '" stroke="' +
      WIRE +
      '" stroke-width="' +
      (thick ? 4 : 2) +
      '"/>'
    );
  }

  function lbl(x, y, text, size, anchor) {
    return (
      '<text x="' +
      x +
      '" y="' +
      y +
      '" font-family="' +
      FONT +
      '" font-size="' +
      (size || 9) +
      '" fill="' +
      INK +
      '" text-anchor="' +
      (anchor || 'start') +
      '">' +
      esc(text) +
      '</text>'
    );
  }

  /** Source AC — cercle + ~ */
  function gAc(cx, cy) {
    var r = 16;
    return (
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      r +
      '" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<path d="M' +
      (cx - 9) +
      ' ' +
      cy +
      'c3-7 6-7 9 0s6 7 9 0" fill="none" stroke="' +
      INK +
      '" stroke-width="1.3"/>'
    );
  }

  /** Compteur M */
  function gMeter(cx, cy) {
    return (
      '<rect x="' +
      (cx - 18) +
      '" y="' +
      (cy - 14) +
      '" width="36" height="28" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<text x="' +
      cx +
      '" y="' +
      (cy + 5) +
      '" text-anchor="middle" font-family="' +
      FONT +
      '" font-size="14" font-weight="700" fill="' +
      INK +
      '">M</text>'
    );
  }

  /** Disjoncteur — symbole seul (fils dessinés par le gabarit) */
  function gBreaker(cx, cy) {
    var x = cx - BRK_W / 2;
    var y = cy - BRK_H / 2;
    return (
      '<g>' +
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      BRK_W +
      '" height="' +
      BRK_H +
      '" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.4"/>' +
      '<line x1="' +
      (x + 6) +
      '" y1="' +
      (y + BRK_H - 5) +
      '" x2="' +
      (x + BRK_W - 6) +
      '" y2="' +
      (y + 5) +
      '" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<line x1="' +
      (x + 6) +
      '" y1="' +
      (y + 5) +
      '" x2="' +
      (x + BRK_W - 6) +
      '" y2="' +
      (y + BRK_H - 5) +
      '" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '</g>'
    );
  }

  /** DDR = disjoncteur + triangle */
  function gRcd(cx, cy) {
    var x = cx - BRK_W / 2;
    var y = cy - BRK_H / 2;
    return (
      '<g>' +
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      BRK_W +
      '" height="' +
      BRK_H +
      '" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.4"/>' +
      '<line x1="' +
      (x + 6) +
      '" y1="' +
      (y + BRK_H - 5) +
      '" x2="' +
      (x + BRK_W - 6) +
      '" y2="' +
      (y + 5) +
      '" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<path d="M' +
      (cx - 5) +
      ' ' +
      (y + BRK_H + 2) +
      ' L' +
      cx +
      ' ' +
      (y + BRK_H + 8) +
      ' L' +
      (cx + 5) +
      ' ' +
      (y + BRK_H + 2) +
      ' Z" fill="none" stroke="' +
      INK +
      '" stroke-width="1.2"/>' +
      '</g>'
    );
  }

  function gLamp(cx, cy) {
    return (
      '<g>' +
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="12" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<line x1="' +
      (cx - 7) +
      '" y1="' +
      (cy - 7) +
      '" x2="' +
      (cx + 7) +
      '" y2="' +
      (cy + 7) +
      '" stroke="' +
      INK +
      '" stroke-width="1.4"/>' +
      '<line x1="' +
      (cx + 7) +
      '" y1="' +
      (cy - 7) +
      '" x2="' +
      (cx - 7) +
      '" y2="' +
      (cy + 7) +
      '" stroke="' +
      INK +
      '" stroke-width="1.4"/>' +
      '</g>'
    );
  }

  function gMotor(cx, cy) {
    return (
      '<g>' +
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="14" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      lbl(cx, cy + 5, 'M', 13, 'middle') +
      '</g>'
    );
  }

  function gSocket(cx, cy) {
    return (
      '<g>' +
      '<path d="M' +
      (cx - 10) +
      ' ' +
      (cy + 2) +
      ' A10 10 0 0 1 ' +
      (cx + 10) +
      ' ' +
      (cy + 2) +
      '" fill="none" stroke="' +
      INK +
      '" stroke-width="1.5"/>' +
      '<line x1="' +
      (cx - 5) +
      '" y1="' +
      (cy + 2) +
      '" x2="' +
      (cx - 5) +
      '" y2="' +
      (cy + 10) +
      '" stroke="' +
      INK +
      '" stroke-width="1.3"/>' +
      '<line x1="' +
      (cx + 5) +
      '" y1="' +
      (cy + 2) +
      '" x2="' +
      (cx + 5) +
      '" y2="' +
      (cy + 10) +
      '" stroke="' +
      INK +
      '" stroke-width="1.3"/>' +
      '</g>'
    );
  }

  function gLoad(cx, cy) {
    return (
      '<g>' +
      '<rect x="' +
      (cx - 14) +
      '" y="' +
      (cy - 8) +
      '" width="28" height="18" fill="#fff" stroke="' +
      INK +
      '" stroke-width="1.4"/>' +
      '<path d="M' +
      (cx - 10) +
      ' ' +
      (cy + 6) +
      ' L' +
      (cx - 4) +
      ' ' +
      (cy - 2) +
      ' L' +
      cx +
      ' ' +
      (cy + 4) +
      ' L' +
      (cx + 6) +
      ' ' +
      (cy - 4) +
      ' L' +
      (cx + 10) +
      ' ' +
      (cy + 6) +
      '" fill="none" stroke="' +
      INK +
      '" stroke-width="1.3"/>' +
      '</g>'
    );
  }

  function resolveLoad(c) {
    var tid = c.templateId || '';
    if (/^light_/.test(tid) || c.usage === 'lighting') return gLamp;
    if (/^motor_/.test(tid) || c.usage === 'motors' || c.usage === 'welding') return gMotor;
    if (/^sockets_/.test(tid) || c.usage === 'sockets') return gSocket;
    return gLoad;
  }

  function buildProSvg(project, h) {
    h = h || {};
    var circuits = project.circuits || [];
    var n = Math.max(1, circuits.length);
    var busY = 248;
    var busX1 = INX - 8;
    var busX2 = busX1 + Math.max(320, n * COL + 48);
    var protY = busY + 22;
    var loadY = protY + BRK_H + GAP + 28;
    var tableY = loadY + 44;
    var w = busX2 + 140;
    var hPage = tableY + 56;
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        w +
        ' ' +
        hPage +
        '" width="100%" style="max-width:100%;background:#fff;font-family:' +
        FONT +
        '">',
      '<rect width="100%" height="100%" fill="#fff"/>',
      lbl(20, 22, project.meta && project.meta.ref ? project.meta.ref + ' — ' + project.board : project.board, 13),
    ];
    if (h.techShort) lbl(20, 38, (h.techShort(project) || '').split('\n')[0], 9);
    if (h.techShort) lbl(20, 50, (h.techShort(project) || '').split('\n')[1] || '', 9);

    var yTop = 68;
    parts.push(gAc(INX, yTop));
    if (h.sourceShort) lbl(INX + 28, yTop + 4, h.sourceShort(project.supply), 9);
    var y1 = yTop + 20;
    parts.push(vWire(INX, y1, y1 + 12));
    var yM = y1 + 12 + 14;
    parts.push(gMeter(INX, yM));
    var y2 = yM + 16;
    parts.push(vWire(INX, y2, y2 + 12));
    var yDg = y2 + 12 + BRK_H / 2;
    parts.push(gBreaker(INX, yDg));
    lbl(INX + 32, yDg - 4, 'DG C' + project.mainProtection.inA, 9);
    var y3 = yDg + BRK_H / 2 + GAP;
    parts.push(vWire(INX, y3, y3 + 10));
    var yRcd = y3 + 10 + BRK_H / 2 + 4;
    parts.push(gRcd(INX, yRcd));
    lbl(INX + 32, yRcd - 6, 'DDR ' + project.mainProtection.rcdInA + 'A ' + project.mainProtection.rcdMa + 'mA', 8);
    parts.push(vWire(INX, yRcd + BRK_H / 2 + 8, busY));
    parts.push(hWire(busX1, busX2, busY, true));

    circuits.forEach(function (c, i) {
      var bx = busX1 + 56 + i * COL;
      var protH = c.rcd ? BRK_H + 10 : BRK_H;
      var protMid = protY + protH / 2;
      parts.push(vWire(bx, busY, protY));
      if (c.rcd) parts.push(gRcd(bx, protMid));
      else parts.push(gBreaker(bx, protMid));
      parts.push(vWire(bx, protY + protH, loadY - 14));
      parts.push(resolveLoad(c)(bx, loadY));
      if (h.departShort)
        lbl(bx + 32, protY + 6, (h.departShort(c) || '').replace(/\n/g, ' '), 8);
      lbl(bx, loadY + 22, c.schemaRef || '—', 9, 'middle');
    });

    parts.push(lbl(busX1, tableY, 'Réf.', 8, 'start'));
    parts.push(lbl(busX1, tableY + 12, 'Pd (kW)', 8, 'start'));
    circuits.forEach(function (c, i) {
      var bx = busX1 + 56 + i * COL;
      parts.push(lbl(bx, tableY, c.schemaRef || '—', 9, 'middle'));
      parts.push(lbl(bx, tableY + 12, (c.pdemW / 1000).toFixed(2), 9, 'middle'));
    });

    parts.push(
      lbl(20, hPage - 14, 'Indicatif — bilan NFC 15-100. Édition avancée : draw.io.', 7)
    );
    parts.push('</svg>');
    return parts.join('');
  }

  g.ElectroDzUnifilarProSvg = {
    buildProSvg: buildProSvg,
  };
})(typeof window !== 'undefined' ? window : globalThis);
