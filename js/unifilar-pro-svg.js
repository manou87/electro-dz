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
  var MT = 20;
  var HT = 48;
  var GT = 24;
  /* Encombrement réduit : symboles plus fins, proportionnés aux fils (stroke 1.5) */
  var HALF_AGCP = 20;
  var HALF_PROT = 38;
  /* Libellés toujours à droite du fil / contact */
  var LABEL_DX = 28;

  var FONT = 'Arial, Helvetica, sans-serif';
  var GROUP_COLORS = ['#000000', '#000000', '#000000', '#000000', '#000000'];

  var theme = {
    ink: '#000000',
    muted: '#000000',
    bg: '#ffffff',
    groupColors: GROUP_COLORS,
    print: true,
  };

  function setTheme() {
    theme.ink = '#000000';
    theme.muted = '#000000';
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

  function symbolFileForType(type) {
    if (type === 'disjoncteur_differentiel') return 'rcbo';
    if (type === 'interrupteur_differentiel') return 'ddr-id';
    if (type === 'interrupteur') return 'contact-no';
    if (type === 'contact_nc') return 'contact-nc';
    if (type === 'bobine') return 'bobine';
    if (type === 'ddr_2p') return 'ddr-2p';
    if (type === 'ddr_4p') return 'ddr-4p';
    return 'disjoncteur-1p';
  }

  /**
   * Symboles IEC vectoriels (géométrie légende contacts.png / ddr.png) :
   * bornes ○, X disjoncteur, lame NO ouverte vers le haut-gauche, ovale DDR.
   * Pas de PNG (crops décentrés + flou à petite taille).
   * Encombrement inchangé : top/bottom = cy ± halfH.
   */
  function symbolProtection(type, cx, cy, halfH, stroke) {
    halfH = halfH == null ? HALF_PROT : halfH;
    var file = symbolFileForType(type);
    var ink = stroke || theme.ink;
    var H = halfH * 2;
    var top = cy - halfH;
    var bot = cy + halfH;
    /* Stroke proche des fils (1.5) — pas plus épais que le trait de liaison */
    var sw = Math.max(1.25, Math.min(1.55, H / 55));
    var a =
      ' fill="none" stroke="' +
      ink +
      '" stroke-width="' +
      sw +
      '" stroke-linecap="round" stroke-linejoin="round"';
    var r = Math.max(2.2, Math.min(3.6, H * 0.042));
    var yTop = top + r;
    var yBot = bot - r;
    var parts = ['<g class="symbole-iec">'];

    if (file === 'bobine') {
      var rw = Math.max(8, Math.min(14, H * 0.18));
      var rh = Math.max(6, Math.min(12, H * 0.15));
      parts.push(
        '<line x1="' +
          cx +
          '" y1="' +
          top +
          '" x2="' +
          cx +
          '" y2="' +
          (cy - rh / 2) +
          '"' +
          a +
          '/>'
      );
      parts.push(
        '<rect x="' +
          (cx - rw / 2) +
          '" y="' +
          (cy - rh / 2) +
          '" width="' +
          rw +
          '" height="' +
          rh +
          '"' +
          a +
          '/>'
      );
      parts.push(
        '<line x1="' +
          cx +
          '" y1="' +
          (cy + rh / 2) +
          '" x2="' +
          cx +
          '" y2="' +
          bot +
          '"' +
          a +
          '/>'
      );
      parts.push('</g>');
      return { svg: parts.join(''), top: top, bottom: bot };
    }

    if (file === 'contact-nc') {
      parts.push('<circle cx="' + cx + '" cy="' + yTop + '" r="' + r + '"' + a + '/>');
      parts.push('<circle cx="' + cx + '" cy="' + yBot + '" r="' + r + '"' + a + '/>');
      parts.push(
        '<line x1="' +
          cx +
          '" y1="' +
          (yTop + r) +
          '" x2="' +
          cx +
          '" y2="' +
          (yBot - r) +
          '"' +
          a +
          '/>'
      );
      var mid = (yTop + yBot) / 2;
      var slash = Math.max(4, H * 0.085);
      parts.push(
        '<line x1="' +
          (cx - slash * 0.55) +
          '" y1="' +
          (mid + slash * 0.55) +
          '" x2="' +
          (cx + slash * 0.55) +
          '" y2="' +
          (mid - slash * 0.55) +
          '"' +
          a +
          '/>'
      );
      parts.push('</g>');
      return { svg: parts.join(''), top: top, bottom: bot };
    }

    var hasX = file === 'disjoncteur-1p' || file === 'rcbo';
    var hasDdr = file === 'ddr-id' || file === 'rcbo' || file === 'ddr-2p' || file === 'ddr-4p';
    var poles = file === 'ddr-4p' ? 4 : file === 'ddr-2p' ? 2 : 1;
    var poleGap = poles > 1 ? Math.max(10, H * 0.18) : 0;
    var totalW = (poles - 1) * poleGap;
    var x0 = cx - totalW / 2;

    function drawPole(px) {
      /* Plus d’air (stubs) au-dessus du X / entre X et lame / sous la lame */
      var yX = top + H * 0.26;
      var yStub = top + H * (hasX ? 0.36 : 0.30);
      var yTip = top + H * 0.46;
      var yPivot = top + H * (hasDdr ? 0.58 : 0.62);
      var yOval = top + H * 0.80;

      parts.push('<circle cx="' + px + '" cy="' + yTop + '" r="' + r + '"' + a + '/>');
      parts.push('<circle cx="' + px + '" cy="' + yBot + '" r="' + r + '"' + a + '/>');
      parts.push(
        '<line x1="' + px + '" y1="' + (yTop + r) + '" x2="' + px + '" y2="' + yStub + '"' + a + '/>'
      );
      if (hasX) {
        var s = Math.max(3, Math.min(5.2, H * 0.065));
        parts.push(
          '<line x1="' +
            (px - s) +
            '" y1="' +
            (yX - s) +
            '" x2="' +
            (px + s) +
            '" y2="' +
            (yX + s) +
            '"' +
            a +
            '/>'
        );
        parts.push(
          '<line x1="' +
            (px + s) +
            '" y1="' +
            (yX - s) +
            '" x2="' +
            (px - s) +
            '" y2="' +
            (yX + s) +
            '"' +
            a +
            '/>'
        );
      }
      var tipX = px - Math.max(7, Math.min(13, H * 0.145));
      parts.push(
        '<line x1="' + tipX + '" y1="' + yTip + '" x2="' + px + '" y2="' + yPivot + '"' + a + '/>'
      );
      parts.push(
        '<line x1="' +
          px +
          '" y1="' +
          yPivot +
          '" x2="' +
          px +
          '" y2="' +
          (yBot - r) +
          '"' +
          a +
          '/>'
      );
      if (hasDdr && poles === 1) {
        var rx = Math.max(6.5, Math.min(12, H * 0.13));
        var ry = Math.max(3.2, Math.min(6, H * 0.06));
        parts.push(
          '<ellipse cx="' + px + '" cy="' + yOval + '" rx="' + rx + '" ry="' + ry + '"' + a + '/>'
        );
      }
    }

    if (poles === 1) {
      drawPole(cx);
    } else {
      for (var i = 0; i < poles; i++) drawPole(x0 + i * poleGap);
      var yOvalM = top + H * 0.80;
      var rxM = totalW / 2 + Math.max(7, H * 0.11);
      var ryM = Math.max(3.5, Math.min(7, H * 0.065));
      parts.push(
        '<ellipse cx="' +
          cx +
          '" cy="' +
          yOvalM +
          '" rx="' +
          rxM +
          '" ry="' +
          ryM +
          '"' +
          a +
          '/>'
      );
    }

    parts.push('</g>');
    return { svg: parts.join(''), top: top, bottom: bot };
  }

  function loadStampUrl(file) {
    var base = 'assets/unifilar/legend/symbols/';
    try {
      if (typeof location !== 'undefined' && location.href) {
        var path = location.pathname || '';
        var dir = path.replace(/[^/]*$/, '');
        if (dir) base = dir + 'assets/unifilar/legend/symbols/';
      }
    } catch (e) {}
    return base + file + '.png?v=20260906unify1';
  }

  /** Kinds avec tampon PNG (hors lampe SVG ○+croix). */
  var LOAD_STAMP_KINDS = {
    prise: 'prise',
    chauffage: 'chauffage',
    ecs: 'ecs',
    cuisiniere: 'cuisiniere',
    four: 'four',
    lave_vaisselle: 'lave_vaisselle',
    lave_linge: 'lave_linge',
    seche_linge: 'seche_linge',
    vmc: 'vmc',
    pompe: 'pompe',
    moteur: 'moteur',
    ascenseur: 'ascenseur',
    borne_ve: 'borne_ve',
    souder: 'souder',
    soudure: 'souder',
    specialise: 'specialise',
  };

  /**
   * Récepteurs unifilaires :
   * - lampe : ○ + croix SVG (inchangé)
   * - autres kinds : PNG planche validée, boîte cx±r / cy±r (fil → haut)
   */
  function symbolLoad(cx, cy, r, kind) {
    r = r || 8;
    var sw = 1.35;
    var a =
      ' fill="none" stroke="' +
      theme.ink +
      '" stroke-width="' +
      sw +
      '" stroke-linecap="round" stroke-linejoin="round"';
    var parts = ['<g class="symbole-recepteur">'];
    if (kind === 'lampe') {
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + a + '/>');
      var m = Math.max(2.5, r * 0.55);
      parts.push(
        '<line x1="' + (cx - m) + '" y1="' + (cy - m) + '" x2="' + (cx + m) + '" y2="' + (cy + m) + '"' + a + '/>'
      );
      parts.push(
        '<line x1="' + (cx + m) + '" y1="' + (cy - m) + '" x2="' + (cx - m) + '" y2="' + (cy + m) + '"' + a + '/>'
      );
    } else {
      var halfImg = r;
      var file = LOAD_STAMP_KINDS[kind] || 'specialise';
      var href = loadStampUrl(file);
      parts.push(
        '<image class="symbole-charge-img" href="' +
          href +
          '" xlink:href="' +
          href +
          '" x="' +
          (cx - halfImg) +
          '" y="' +
          (cy - halfImg) +
          '" width="' +
          halfImg * 2 +
          '" height="' +
          halfImg * 2 +
          '" preserveAspectRatio="xMidYMid meet"/>'
      );
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
    /* Spécifiques d’abord (démo villa + templates) */
    if (t.indexOf('water_heater') >= 0 || label.indexOf('chauffe-eau') >= 0 || label.indexOf('ecs') >= 0 || label.indexOf('ballon') >= 0) {
      return 'ecs';
    }
    if (t.indexOf('cooker') >= 0 || label.indexOf('cuisini') >= 0 || label.indexOf('plaque') >= 0) {
      return 'cuisiniere';
    }
    if (t.indexOf('oven') >= 0 || (label.indexOf('four') >= 0 && label.indexOf('chauffe') < 0)) {
      return 'four';
    }
    if (t.indexOf('dishwasher') >= 0 || label.indexOf('lave-vaisselle') >= 0 || label.indexOf('lave vaisselle') >= 0) {
      return 'lave_vaisselle';
    }
    if (t.indexOf('washing') >= 0 || label.indexOf('lave-linge') >= 0 || label.indexOf('lave linge') >= 0) {
      return 'lave_linge';
    }
    if (t.indexOf('dryer') >= 0 || label.indexOf('sèche-linge') >= 0 || label.indexOf('seche-linge') >= 0 || label.indexOf('seche linge') >= 0) {
      return 'seche_linge';
    }
    if (t.indexOf('hvac') >= 0 || t.indexOf('ventil') >= 0 || u.indexOf('vmc') >= 0 || label.indexOf('vmc') >= 0 || label.indexOf('ventilation') >= 0) {
      return 'vmc';
    }
    if (t.indexOf('motor_pump') >= 0 || t.indexOf('pump') >= 0 || label.indexOf('pompe') >= 0) {
      return 'pompe';
    }
    if (t.indexOf('motor_lift') >= 0 || t.indexOf('lift') >= 0 || label.indexOf('ascenseur') >= 0) {
      return 'ascenseur';
    }
    if (t.indexOf('ev_charger') >= 0 || label.indexOf('borne') >= 0 || label.indexOf('ve ') >= 0 || label.indexOf(' véhicule') >= 0) {
      return 'borne_ve';
    }
    if (t.indexOf('weld') >= 0 || u.indexOf('weld') >= 0 || label.indexOf('soud') >= 0) {
      return 'souder';
    }
    if (
      t.indexOf('heating_electric') >= 0 ||
      u.indexOf('radiat') >= 0 ||
      label.indexOf('radiat') >= 0 ||
      (u.indexOf('heat') >= 0 && t.indexOf('water') < 0) ||
      (label.indexOf('chauffage') >= 0 && label.indexOf('chauffe-eau') < 0)
    ) {
      return 'chauffage';
    }
    if (u.indexOf('moteur') >= 0 || u.indexOf('motor') >= 0 || t.indexOf('motor') >= 0 || label.indexOf('moteur') >= 0 || label.indexOf('volet') >= 0) {
      return 'moteur';
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
    var D = w > 5 ? 7 : 9;
    /* Même taille / alignement fil pour lampe et prise */
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
    var protType = c.rcd ? 'disjoncteur_differentiel' : 'disjoncteur';
    var prot = symbolProtection(protType, cx, protCy, HALF_PROT);
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

  /** Une seule légende compacte (réutilisée hors schéma). */
  function legendStripSvg(x0, y0, pageW) {
    var sw = 1.2;
    var a =
      ' fill="none" stroke="' +
      theme.ink +
      '" stroke-width="' +
      sw +
      '" stroke-linecap="round" stroke-linejoin="round"';
    var parts = ['<g class="legende-feuille">'];
    var boxH = 42;
    var boxW = Math.min(pageW - 32, Math.max(420, pageW * 0.72));
    parts.push(
      '<rect x="' +
        x0 +
        '" y="' +
        y0 +
        '" width="' +
        boxW +
        '" height="' +
        boxH +
        '" fill="#fff" stroke="' +
        theme.ink +
        '" stroke-width="0.9"/>'
    );
    parts.push(txt(x0 + 8, y0 + 10, t('legend.title'), { size: 5.5, weight: 700 }));

    var items = [
      { kind: 'dj', label: t('legend.item.dj') },
      { kind: 'ddr', label: t('legend.item.ddr') },
      { kind: 'lampe', label: t('legend.item.lamp') },
      { kind: 'prise', label: t('legend.item.socket') },
    ];
    var ix = x0 + 10;
    var iy = y0 + 28;
    var gap = Math.max(88, (boxW - 20) / items.length);
    items.forEach(function (it, i) {
      var cx = ix + i * gap + 10;
      if (it.kind === 'dj') {
        var dj = symbolProtection('disjoncteur', cx, iy, 11);
        parts.push(dj.svg);
      } else if (it.kind === 'ddr') {
        var ddr = symbolProtection('interrupteur_differentiel', cx, iy, 11);
        parts.push(ddr.svg);
      } else if (it.kind === 'lampe') {
        parts.push(symbolLoad(cx, iy, 6, 'lampe'));
      } else {
        parts.push(symbolLoad(cx, iy, 7, 'prise'));
      }
      parts.push(txt(cx + 14, iy + 1, it.label, { size: 5, fill: theme.muted }));
    });
    parts.push('</g>');
    return { svg: parts.join(''), height: boxH + 8 };
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
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="unif-svg-swissdz" viewBox="0 0 ' +
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

  /** Une seule légende pour tout le dossier (SVG autonome). */
  function buildLegendSvg(pageW) {
    setTheme();
    pageW = pageW || 560;
    var strip = legendStripSvg(8, 6, pageW);
    var h = strip.height + 8;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" class="unif-svg-swissdz unif-legend-once" viewBox="0 0 ' +
      pageW +
      ' ' +
      h +
      '" width="100%" role="img" aria-label="' +
      t('legend.title') +
      '">' +
      '<rect class="unif-bg" width="100%" height="100%" fill="' +
      theme.bg +
      '"/>' +
      strip.svg +
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

  function buildPrintHtml(project, editorName, opts) {
    opts = opts || {};
    var svg = buildProSvg(project, { print: true });
    var name = editorName || 'Electro DZ';
    var supply = (project && project.supply) || {};
    var meta = (project && project.meta) || {};
    var legendBlock = '';
    if (opts.includeLegend !== false) {
      var base = '';
      try {
        if (typeof location !== 'undefined' && location.href) {
          base = location.href.replace(/[^/]*$/, '');
        }
      } catch (e) {}
      legendBlock =
        '<div class="legend-block">' +
        '<div class="legend-sheet">' +
        '<h2>' +
        t('legend.title') +
        '</h2>' +
        '<div class="legend-grid">' +
        [
          ['symbols/disjoncteur-1p.png', 'legend.item.dj'],
          ['symbols/ddr-id.png', 'legend.item.ddr'],
          ['symbols/rcbo.png', 'legend.item.rcbo'],
          ['symbols/contact-no.png', 'legend.item.no'],
          ['symbols/contact-nc.png', 'legend.item.nc'],
          ['symbols/bobine.png', 'legend.item.coil'],
          ['symbols/eclairage.png', 'legend.item.lamp'],
          ['symbols/prise.png', 'legend.item.socket'],
          ['symbols/chauffage.png', 'legend.item.heat'],
          ['symbols/ecs.png', 'legend.item.ecs'],
          ['symbols/cuisiniere.png', 'legend.item.cooker'],
          ['symbols/four.png', 'legend.item.oven'],
          ['symbols/lave_vaisselle.png', 'legend.item.dishwasher'],
          ['symbols/lave_linge.png', 'legend.item.washing'],
          ['symbols/seche_linge.png', 'legend.item.dryer'],
          ['symbols/vmc.png', 'legend.item.vmc'],
          ['symbols/pompe.png', 'legend.item.pump'],
          ['symbols/moteur.png', 'legend.item.motor'],
          ['symbols/ascenseur.png', 'legend.item.lift'],
          ['symbols/borne_ve.png', 'legend.item.ev'],
          ['symbols/souder.png', 'legend.item.weld'],
        ]
          .map(function (it) {
            return (
              '<figure><img src="' +
              base +
              'assets/unifilar/legend/' +
              it[0] +
              '?v=20260906legcompact2" alt=""/><figcaption>' +
              t(it[1]) +
              '</figcaption></figure>'
            );
          })
          .join('') +
        '</div></div></div>';
    }
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
      'th{background:#fff;font-weight:700}' +
      '.legend-block{margin-top:12px;page-break-inside:avoid}' +
      '.legend-sheet{border:1.5px solid #000;padding:8px 10px;background:#fff;color:#000}' +
      '.legend-sheet h2{font-size:11px;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #000;text-transform:uppercase;letter-spacing:.04em}' +
      '.legend-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px 6px}' +
      '.legend-grid figure{margin:0;border:none;background:#fff;text-align:center}' +
      '.legend-grid img{display:block;width:32px;height:32px;margin:0 auto 2px;object-fit:contain}' +
      '.legend-grid figcaption{font-size:8px;padding:0;border:none;font-weight:600;color:#000;line-height:1.15}' +
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
      legendBlock +
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
    buildLegendSvg: buildLegendSvg,
    buildPrintHtml: buildPrintHtml,
    openPrint: openPrint,
  };
})(typeof window !== 'undefined' ? window : globalThis);
