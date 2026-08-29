/**
 * Unifilaire Electro DZ — style tableau SwissDZ.
 * Affichage et impression : fond blanc, traits et textes noirs.
 * Libellés toujours à droite des contacts.
 */
(function (g) {
  'use strict';

  function t(key) {
    if (g.UnifilarAutoI18n && typeof g.UnifilarAutoI18n.t === 'function') {
      return g.UnifilarAutoI18n.t(key);
    }
    return key;
  }

  function currentLang() {
    if (g.UnifilarAutoI18n && g.UnifilarAutoI18n.lang) return g.UnifilarAutoI18n.lang;
    return 'fr';
  }

  function dateLocale() {
    var lang = currentLang();
    if (lang === 'ar') return 'ar';
    if (lang === 'en') return 'en-GB';
    return 'fr-FR';
  }

  var Ve = 1.25;
  /* Bandeau titre : aucune ligne / symbole dans cette zone */
  var HEADER_H = 52;
  var UT = 40;
  var MT = 16;
  var HT = 48;
  var GT = 24;
  var HALF_AGCP = 12;
  var HALF_PROT = 20;
  /* Libellés toujours à droite du fil / contact */
  var LABEL_DX = 28;

  var FONT = 'Arial, Helvetica, sans-serif';
  var GROUP_COLORS = ['#000000', '#000000', '#000000', '#000000', '#000000'];

  var theme = {
    ink: '#000000',
    muted: '#222222',
    bg: '#ffffff',
    groupColors: GROUP_COLORS,
    print: true,
  };

  function setTheme() {
    theme.ink = '#000000';
    theme.muted = '#222222';
    theme.bg = '#ffffff';
    theme.groupColors = GROUP_COLORS;
    theme.print = true;
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function colW(n) {
    /* Colonnes plus larges : libellés toujours à droite */
    if (n >= 3) return 168;
    if (n === 2) return 170;
    return 148;
  }

  function geom(cy, halfH, differential) {
    if (differential) {
      var marqueY = cy - halfH * 0.42;
      var pivot = cy + halfH * 0.18;
      var ovale = pivot + halfH * 0.1 + 4 * Ve;
      var bras = pivot - marqueY;
      var o = bras / Math.SQRT2;
      return {
        entree: cy - halfH,
        sortie: cy + halfH,
        marqueY: marqueY,
        pivot: pivot,
        bladeX: -o,
        bladeY: pivot - o,
        ovale: ovale,
        ovalRx: 8 * Ve,
        ovalRy: 4 * Ve,
      };
    }
    var m2 = cy - halfH * 0.55;
    var p2 = cy + halfH * 0.8;
    var bras2 = p2 - m2;
    var o2 = bras2 / Math.SQRT2;
    return {
      entree: cy - halfH,
      sortie: cy + halfH,
      marqueY: m2,
      pivot: p2,
      bladeX: -o2,
      bladeY: p2 - o2,
      ovale: cy + halfH * 0.58,
      ovalRx: 8 * Ve,
      ovalRy: 4 * Ve,
    };
  }

  function vLine(x, y1, y2) {
    var ya = Math.min(y1, y2);
    var yb = Math.max(y1, y2);
    if (yb - ya < 0.5) return '';
    return (
      '<line class="fil" x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '" stroke="' + theme.ink + '" stroke-width="1.5" fill="none"/>'
    );
  }

  function hLine(x1, x2, y, stroke, thick) {
    var xa = Math.min(x1, x2);
    var xb = Math.max(x1, x2);
    if (xb - xa < 0.5) return '';
    return (
      '<line class="fil' +
      (thick ? ' barre' : '') +
      '" x1="' +
      xa +
      '" y1="' +
      y +
      '" x2="' +
      xb +
      '" y2="' +
      y +
      '" stroke="' +
      (stroke || theme.ink) +
      '" stroke-width="' +
      (thick ? 3 : 1.5) +
      '" fill="none"/>'
    );
  }

  function symbolProtection(type, cx, cy, halfH, stroke) {
    halfH = halfH == null ? HALF_PROT : halfH;
    stroke = stroke || theme.ink;
    var differential = type === 'interrupteur_differentiel' || type === 'disjoncteur_differentiel';
    var g0 = geom(cy, halfH, differential);
    var a = ' fill="none" stroke="' + stroke + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
    var parts = ['<g class="symbole-iec">'];
    parts.push('<line x1="' + cx + '" y1="' + g0.entree + '" x2="' + cx + '" y2="' + g0.marqueY + '"' + a + '/>');

    var marque = type === 'interrupteur' || type === 'interrupteur_differentiel' ? 'o' : 'x';
    if (marque === 'x') {
      var r = 3 * Ve;
      parts.push('<line x1="' + (cx - r) + '" y1="' + (g0.marqueY - r) + '" x2="' + (cx + r) + '" y2="' + (g0.marqueY + r) + '"' + a + '/>');
      parts.push('<line x1="' + (cx - r) + '" y1="' + (g0.marqueY + r) + '" x2="' + (cx + r) + '" y2="' + (g0.marqueY - r) + '"' + a + '/>');
    } else {
      parts.push('<circle cx="' + cx + '" cy="' + g0.marqueY + '" r="' + 2.2 * Ve + '"' + a + '/>');
    }

    parts.push('<line x1="' + cx + '" y1="' + g0.pivot + '" x2="' + cx + '" y2="' + g0.sortie + '"' + a + '/>');
    parts.push('<line x1="' + cx + '" y1="' + g0.pivot + '" x2="' + (cx + g0.bladeX) + '" y2="' + g0.bladeY + '"' + a + '/>');

    if (differential) {
      var i = cx + g0.bladeX;
      var bladeY = g0.bladeY;
      var oLeft = cx - g0.ovalRx;
      var s = i - halfH * 0.22;
      parts.push('<ellipse cx="' + cx + '" cy="' + g0.ovale + '" rx="' + g0.ovalRx + '" ry="' + g0.ovalRy + '"' + a + '/>');
      parts.push(
        '<path d="M ' + i + ' ' + bladeY + ' L ' + s + ' ' + bladeY + ' L ' + s + ' ' + g0.ovale + ' L ' + oLeft + ' ' + g0.ovale + '"' + a + '/>'
      );
    }
    parts.push('</g>');
    return { svg: parts.join(''), top: g0.entree, bottom: g0.sortie };
  }

  function symbolLoad(cx, cy, r, kind) {
    r = r || 8;
    var a = ' fill="none" stroke="' + theme.ink + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
    var parts = ['<g class="symbole-recepteur">'];
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + a + '/>');
    if (kind === 'lampe') {
      parts.push('<line x1="' + (cx - r + 3) + '" y1="' + (cy - r + 3) + '" x2="' + (cx + r - 3) + '" y2="' + (cy + r - 3) + '"' + a + '/>');
      parts.push('<line x1="' + (cx - r + 3) + '" y1="' + (cy + r - 3) + '" x2="' + (cx + r - 3) + '" y2="' + (cy - r + 3) + '"' + a + '/>');
    } else if (kind === 'prise') {
      parts.push('<line x1="' + (cx - 3) + '" y1="' + (cy - 4) + '" x2="' + (cx - 3) + '" y2="' + (cy + 4) + '"' + a + '/>');
      parts.push('<line x1="' + (cx + 3) + '" y1="' + (cy - 4) + '" x2="' + (cx + 3) + '" y2="' + (cy + 4) + '"' + a + '/>');
    } else {
      parts.push('<line x1="' + (cx - 4) + '" y1="' + (cy + 2) + '" x2="' + (cx + 4) + '" y2="' + (cy + 2) + '"' + a + '/>');
    }
    parts.push('</g>');
    return parts.join('');
  }

  function txt(x, y, text, opts) {
    opts = opts || {};
    return (
      '<text class="texte' +
      (opts.cls ? ' ' + opts.cls : '') +
      '" x="' +
      x +
      '" y="' +
      y +
      '" font-family="' +
      FONT +
      '" font-size="' +
      (opts.size || 6) +
      '" font-weight="' +
      (opts.weight || 400) +
      '" fill="' +
      (opts.fill || theme.ink) +
      '" text-anchor="' +
      (opts.anchor || 'start') +
      '" dominant-baseline="middle">' +
      esc(text) +
      '</text>'
    );
  }

  function txtLines(x, y, lines, opts) {
    opts = opts || {};
    var size = opts.size || 5;
    var fill = opts.fill || theme.muted;
    var anchor = opts.anchor || 'start';
    var dy = opts.dy || 8;
    var parts = [
      '<text class="texte hors-fil" x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + anchor + '" dominant-baseline="middle">',
    ];
    lines.forEach(function (line, i) {
      parts.push('<tspan x="' + x + '" dy="' + (i === 0 ? 0 : dy) + '">' + esc(line) + '</tspan>');
    });
    parts.push('</text>');
    return parts.join('');
  }

  function loadKind(c) {
    var u = (c.usage || '').toLowerCase();
    var t = (c.templateId || '').toLowerCase();
    var label = (c.label || '').toLowerCase();
    if (u.indexOf('eclair') >= 0 || t.indexOf('light') >= 0 || label.indexOf('éclair') >= 0 || label.indexOf('eclair') >= 0 || label.indexOf('lampe') >= 0) {
      return 'lampe';
    }
    if (u.indexOf('prise') >= 0 || t.indexOf('socket') >= 0 || label.indexOf('prise') >= 0) {
      return 'prise';
    }
    return 'specialise';
  }

  function loadCount(c) {
    var n = Math.max(1, parseInt(c.count, 10) || 1);
    return Math.min(n, 8);
  }

  function roundUpIn(ibA) {
    var std = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    var ib = Number(ibA) || 0;
    for (var i = 0; i < std.length; i++) {
      if (std[i] >= ib * 1.05) return std[i];
    }
    return std[std.length - 1];
  }

  function idrInA(circuits, fallback) {
    if (!circuits || !circuits.length) return fallback || 40;
    var ibSum = 0;
    var maxIn = 0;
    circuits.forEach(function (c) {
      ibSum += c.ibA || 0;
      maxIn = Math.max(maxIn, c.inA || 0);
    });
    return roundUpIn(Math.max(ibSum, maxIn, fallback || 0));
  }

  function splitGroups(circuits) {
    var withRcd = [];
    var plain = [];
    circuits.forEach(function (c) {
      (c.rcd ? withRcd : plain).push(c);
    });
    var groups = [];
    if (plain.length) {
      groups.push({ titre: t('svg.outgoings'), couleur: theme.groupColors[0], circuits: plain, withHead: false });
    }
    if (withRcd.length) {
      groups.push({ titre: t('svg.rcdGroup'), couleur: theme.groupColors[1], circuits: withRcd, withHead: true });
    }
    if (!groups.length) {
      groups.push({ titre: t('svg.outgoings'), couleur: theme.groupColors[0], circuits: circuits.slice(), withHead: false });
    }
    return groups;
  }

  function circuitMetrics(depuisY, c) {
    var protCy = depuisY + MT + HALF_PROT;
    var bas = protCy + HALF_PROT;
    var w = loadCount(c);
    var gap = 28;
    var D = w > 5 ? 6 : 8;
    var loadCyMin = w === 1 ? bas + gap : bas + gap + 32 + (w > 5 ? 4 : 0);
    return { protCy: protCy, bas: bas, w: w, D: D, loadCyMin: loadCyMin };
  }

  /**
   * Colonne départ → protection → fil → charge.
   * loadCy / kwY fixés globalement pour aligner toutes les charges et kW en bas.
   */
  function drawCircuitColumn(parts, c, cx, depuisY, colIndex, colTotal, cw, loadCy, kwY) {
    var m = circuitMetrics(depuisY, c);
    var protCy = m.protCy;
    var haut = protCy - HALF_PROT;
    var bas = m.bas;
    var w = m.w;
    var D = m.D;
    var kind = loadKind(c);

    parts.push(vLine(cx, depuisY, haut));
    var prot = symbolProtection('disjoncteur', cx, protCy, HALF_PROT);
    parts.push(prot.svg);

    /* Nom + calibre toujours à droite du disjoncteur */
    var lx = cx + LABEL_DX;
    var cos = c.cosPhi != null && c.cosPhi !== '' ? Number(c.cosPhi) : null;
    var curve = (c.curve || 'C').toString().toUpperCase();
    var ref = c.schemaRef || c.circuitRef || 'Q';
    var ibLine =
      'Ib ' +
      (c.ibA || '—') +
      'A' +
      (cos != null && Number.isFinite(cos) ? ' · cos ' + (Math.round(cos * 100) / 100) : '');
    parts.push(
      txtLines(lx, protCy - 6, [String(ref), curve + (c.inA || '—') + 'A', ibLine], {
        size: 5.5,
        fill: theme.ink,
        anchor: 'start',
        dy: 9,
      })
    );

    if (w === 1) {
      parts.push(vLine(cx, bas, loadCy - D));
      parts.push(symbolLoad(cx, loadCy, D, kind));
    } else {
      var gap = 28;
      var yBus = bas + gap;
      var T = Math.min(22, Math.floor((cw - 36) / Math.max(1, w - 1)));
      var xFirst = Math.round(cx - ((w - 1) * T) / 2);
      var xLast = xFirst + (w - 1) * T;
      parts.push(vLine(cx, bas, yBus));
      parts.push(hLine(xFirst, xLast, yBus, theme.ink, false));
      for (var i = 0; i < w; i++) {
        var x = xFirst + i * T;
        parts.push(vLine(x, yBus, loadCy - D));
        parts.push(symbolLoad(x, loadCy, D, kind));
      }
    }

    /* Désignation + kW sous la charge — kW sur la ligne commune */
    var nameY = loadCy + D + 12;
    var label = (c.label || '').slice(0, 26);
    if (label) parts.push(txt(cx, nameY, label, { size: 5, anchor: 'middle', fill: theme.muted }));
    parts.push(
      txt(cx, kwY, (c.pdemW / 1000).toFixed(2) + ' kW' + (w > 1 ? ' ×' + w : ''), {
        size: 5.5,
        anchor: 'middle',
        weight: 700,
        fill: theme.ink,
      })
    );

    return kwY + 16;
  }

  function buildProSvg(project, opts) {
    opts = opts || {};
    setTheme();

    var circuits = ((project && project.circuits) || []).slice();
    var mp = (project && project.mainProtection) || { inA: 32, rcdInA: 63, rcdMa: 30, rcdType: 'AC' };
    var supply = (project && project.supply) || {};
    var groups = splitGroups(circuits);

    /* Géométrie sous le bandeau titre (plus aucun croisement texte / fil) */
    var forPrintSheet = !!opts.print;
    var headerH = forPrintSheet ? 12 : HEADER_H;
    var trunkX = 44;
    var busY = headerH + 78;
    var groupTitleY = busY - 18;
    var idrCy = busY + 44;
    var idrBusY = busY + 96;
    var parts = [];
    var title = (project && project.board) || t('svg.dbFallback');
    if (project && project.meta && project.meta.ref) title = project.meta.ref + ' — ' + title;

    /* —— En-tête texte (écran) ; en feuille d’impression le titre est hors SVG —— */
    if (!forPrintSheet) {
      parts.push(txt(16, 18, t('svg.titlePrefix') + title, { size: 7.5, weight: 700 }));
      parts.push(
        txt(
          16,
          34,
          'Pd ' +
            (supply.pTotalKw || '—') +
            ' kW · Ib ' +
            (Math.round((supply.ibA || 0) * 10) / 10) +
            ' A · ' +
            circuits.length +
            ' ' +
            t('svg.loads'),
          { size: 5.5, fill: theme.muted }
        )
      );
    }

    /* —— Arrivée / coupure générale —— */
    var agcpCy = headerH + 28;
    parts.push(vLine(trunkX, headerH + 6, agcpCy - HALF_AGCP));
    var agcp = symbolProtection('disjoncteur', trunkX, agcpCy, HALF_AGCP);
    parts.push(agcp.svg);
    parts.push(txt(trunkX + LABEL_DX, agcpCy - 6, t('svg.mainSwitch'), { size: 5.5 }));
    parts.push(txt(trunkX + LABEL_DX, agcpCy + 6, 'C ' + (mp.inA || 32) + ' A', { size: 5, fill: theme.muted }));
    parts.push(vLine(trunkX, agcp.bottom, busY));

    var cursorX = 108;
    var layouts = [];
    groups.forEach(function (grp, gi) {
      var nc = Math.max(1, grp.circuits.length);
      var cw = colW(nc);
      var w = Math.max(nc, 1) * cw + HT;
      layouts.push({
        grp: grp,
        x: cursorX,
        w: w,
        colW: cw,
        ySousBarre: grp.withHead ? idrBusY : busY,
        couleur: theme.groupColors[gi % theme.groupColors.length],
      });
      cursorX += w + UT;
    });

    var pageW = Math.max(cursorX + 24, 560);
    parts.push(hLine(trunkX, pageW - UT - 8, busY, theme.ink, true));

    /* Ligne commune des charges (et des kW) : tout en bas, même Y pour tous les départs */
    var loadCy = busY + 120;
    var maxD = 8;
    layouts.forEach(function (layout) {
      layout.grp.circuits.forEach(function (c) {
        var m = circuitMetrics(layout.ySousBarre, c);
        loadCy = Math.max(loadCy, m.loadCyMin);
        maxD = Math.max(maxD, m.D);
      });
    });
    var kwY = loadCy + maxD + 12 + 30;

    var maxBottom = kwY + 16;
    layouts.forEach(function (layout) {
      var grp = layout.grp;
      var nc = grp.circuits.length;
      var cw = layout.colW;
      var colX = function (i) {
        return layout.x + GT + cw / 2 + i * cw;
      };
      /* Centre réel des colonnes (= même axe que les dispositifs) */
      var mid = nc <= 1 ? colX(0) : (colX(0) + colX(nc - 1)) / 2;

      /* Titre de groupe au-dessus de la barre, hors des fils */
      parts.push(txt(layout.x + 8, groupTitleY, grp.titre, { size: 5.5, fill: layout.couleur, cls: 'titre-groupe' }));

      if (grp.withHead) {
        var idrA = idrInA(grp.circuits, mp.rcdInA);
        parts.push(vLine(mid, busY, idrCy - HALF_PROT));
        var head = symbolProtection('interrupteur_differentiel', mid, idrCy, HALF_PROT, layout.couleur);
        parts.push(head.svg);
        parts.push(
          txtLines(mid + LABEL_DX, idrCy - 8, [
            'IDR ' + idrA + ' A',
            (mp.rcdMa || 30) + ' mA type ' + (mp.rcdType || 'A'),
          ], {
            size: 5.5,
            fill: layout.couleur,
            anchor: 'start',
            dy: 10,
          })
        );
        parts.push(vLine(mid, head.bottom, layout.ySousBarre));
        if (nc > 1) {
          parts.push(hLine(colX(0), colX(nc - 1), layout.ySousBarre, layout.couleur, true));
        }
      } else if (nc > 1) {
        parts.push(vLine(mid, busY, layout.ySousBarre));
        parts.push(hLine(colX(0), colX(nc - 1), layout.ySousBarre, layout.couleur, true));
      } else if (nc === 1) {
        parts.push(vLine(colX(0), busY, layout.ySousBarre));
      }

      for (var i = 0; i < nc; i++) {
        var bottom = drawCircuitColumn(parts, grp.circuits[i], colX(i), layout.ySousBarre, i, nc, cw, loadCy, kwY);
        maxBottom = Math.max(maxBottom, bottom);
      }
    });

    var pageH = maxBottom + 32;

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" class="unif-svg-swissdz" viewBox="0 0 ' +
      pageW +
      ' ' +
      pageH +
      '" width="100%" role="img" aria-label="' +
      t('svg.aria') +
      '">' +
      '<rect class="unif-bg" width="100%" height="100%" fill="' +
      theme.bg +
      '"/>' +
      parts.join('') +
      '</svg>'
    );
  }

  function detailsTableHtml(project) {
    var circuits = (project && project.circuits) || [];
    var rows = circuits
      .map(function (c) {
        return (
          '<tr><td>' +
          esc(c.schemaRef || c.circuitRef || '—') +
          '</td><td>' +
          esc(c.label || '—') +
          '</td><td>' +
          esc(c.location || '—') +
          '</td><td>' +
          (c.pdemW / 1000).toFixed(2) +
          ' kW</td><td>' +
          esc(String(c.ibA)) +
          ' A</td><td>C' +
          esc(String(c.inA)) +
          ' A</td><td>' +
          (c.rcd ? '30 mA' : '—') +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<h2>' +
      t('print.detail') +
      '</h2>' +
      '<table><thead><tr>' +
      '<th>' +
      t('col.ref') +
      '</th><th>' +
      t('col.label') +
      '</th><th>' +
      t('print.col.room') +
      '</th><th>Pd</th><th>Ib</th><th>In</th><th>' +
      t('print.col.rcd') +
      '</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table>'
    );
  }

  function buildPrintHtml(project, editorName) {
    var svg = buildProSvg(project, { print: true });
    var name = editorName || 'Electro DZ';
    var supply = (project && project.supply) || {};
    var meta = (project && project.meta) || {};
    return (
      '<!doctype html><html lang="' +
      currentLang() +
      '"><head><meta charset="utf-8"><title>' +
      t('svg.aria') +
      '</title><style>' +
      'html,body{margin:0;padding:0;background:#fff!important;color:#000!important}' +
      'body{margin:16px 20px;font-family:Arial,Helvetica,sans-serif;font-weight:normal}' +
      'h1{font-size:16px;margin:0 0 4px;font-weight:700;color:#000}' +
      'h2{font-size:13px;margin:18px 0 8px;font-weight:700;color:#000}' +
      'p.cartouche{font-size:11px;margin:0 0 14px;color:#000;line-height:1.45}' +
      'svg{width:100%;max-width:1100px;height:auto;border:1px solid #000;display:block;background:#fff!important}' +
      'svg .unif-bg{fill:#fff!important}' +
      'svg *{stroke:#000!important}' +
      'svg text,svg tspan{fill:#000!important;stroke:none!important}' +
      'svg .fil,svg .symbole-iec,svg .symbole-recepteur{fill:none!important}' +
      'svg .fil{stroke-width:1.5}svg .fil.barre{stroke-width:3}' +
      'svg .texte{font-size:6px!important}' +
      'table{width:100%;border-collapse:collapse;font-size:10px;margin-top:4px;color:#000}' +
      'th,td{border:1px solid #000;padding:5px 6px;text-align:left}' +
      'th{background:#f3f3f3;font-weight:700}' +
      '@page{size:A4 landscape;margin:10mm}' +
      '@media print{body{margin:0}svg{border-color:#000}}' +
      '</style></head><body>' +
      '<h1>' +
      t('svg.titlePrefix') +
      esc(project.board || t('print.boardFallback') || t('board')) +
      '</h1>' +
      '<p class="cartouche">' +
      esc(name) +
      (meta.ref ? ' · ' + t('print.ref') + ' ' + esc(meta.ref) : '') +
      (meta.site ? ' · ' + esc(meta.site) : '') +
      (meta.client ? ' · ' + t('print.client') + ' ' + esc(meta.client) : '') +
      ' · Pd ' +
      esc(String(supply.pTotalKw || '—')) +
      ' kW · Ib ' +
      esc(String(Math.round((supply.ibA || 0) * 10) / 10)) +
      ' A · NFC 15-100 / IEC 60364 · ' +
      new Date().toLocaleDateString(dateLocale()) +
      '</p>' +
      svg +
      detailsTableHtml(project) +
      '<p class="cartouche" style="margin-top:12px;font-size:9px">' +
      t('print.disclaimer') +
      '</p>' +
      '</body></html>'
    );
  }

  function openPrint(project, editorName) {
    var w = window.open('', '_blank');
    if (!w) return false;
    w.document.write(buildPrintHtml(project, editorName));
    w.document.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (e) {}
    }, 450);
    return true;
  }

  g.ElectroDzUnifilarProSvg = {
    buildProSvg: buildProSvg,
    buildPrintHtml: buildPrintHtml,
    openPrint: openPrint,
  };
})(typeof window !== 'undefined' ? window : globalThis);
