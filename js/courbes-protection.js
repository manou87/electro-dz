/**
 * Courbes de déclenchement temps-courant t(I) — disjoncteurs modulaires.
 *
 * Données 100 % génériques issues des normes publiques :
 *   - CEI / IEC 60898-1 (disjoncteurs domestiques) : seuils magnétiques B/C/D
 *   - CEI / IEC 60947-2 (disjoncteurs industriels)  : courbes K/Z
 *   - Zone thermique : modèle inverse I²t calibré sur le temps conventionnel
 *     (1 h pour In ≤ 63 A, point conventionnel 1,45·In — norme 60898).
 *
 * Aucune donnée constructeur (Schneider, Hager, ABB, …) n'est utilisée :
 * ces courbes sont les enveloppes normatives génériques, indicatives.
 */
(function (g) {
  'use strict';

  // Seuils magnétiques normalisés (multiples de In) : [min, max]
  const CURVES = {
    B: { mag: [3, 5], label: 'B', norm: 'IEC 60898' },
    C: { mag: [5, 10], label: 'C', norm: 'IEC 60898' },
    D: { mag: [10, 20], label: 'D', norm: 'IEC 60898' },
    K: { mag: [8, 14], label: 'K', norm: 'IEC 60947-2' },
    Z: { mag: [2, 3], label: 'Z', norm: 'IEC 60947-2' },
  };

  const PALETTE = ['#facc15', '#22d3ee', '#f472b6', '#4ade80', '#fb923c', '#a78bfa', '#f87171', '#38bdf8'];

  // Bornes du graphe
  const X_MIN = 1, X_MAX = 20000;       // courant (A), échelle log
  const Y_MIN = 0.001, Y_MAX = 36000;   // temps (s) : 1 ms → 10 h

  // Enveloppe thermique calée sur les POINTS D'ESSAI de la CEI 60898-1
  // (multiple de In → temps), interpolée en log-log. Points clés :
  //   1,13·In : ne déclenche pas (courant conventionnel de non-déclenchement)
  //   1,45·In : déclenche dans le temps conventionnel (≤ 1 h pour In ≤ 63 A)
  //   2,55·In : déclenche entre 1 s et 60 s (essai normatif, In ≤ 32 A)
  // Borne LENTE (droite) = limite haute ; borne RAPIDE (gauche) = limite basse.
  // Asymptote verticale à 1,13·In : EN DESSOUS, le disjoncteur NE COUPE JAMAIS
  // (courant conventionnel de non-déclenchement, CEI 60898).
  const I_NO_TRIP = 1.13;
  const THERMAL_SLOW = [[I_NO_TRIP, 1e6], [1.45, 3600], [2.0, 300], [2.55, 60], [4, 12]];
  const THERMAL_FAST = [[I_NO_TRIP, 1e6], [1.45, 400], [2.0, 20], [2.55, 1], [4, 0.3]];

  // Zone de déclenchement instantané (magnétique) — quelques millisecondes.
  // Au-delà du seuil magnétique, le temps de coupure est ~constant jusqu'au
  // pouvoir de coupure : c'est le « plancher » horizontal du tunnel.
  const T_INST_SLOW = 0.012;  // borne lente : ~12 ms (déclenchement + arc)
  const T_INST_FAST = 0.007;  // borne rapide : ~7 ms

  // Fusibles CEI 60269 — courbes temps/courant GÉNÉRIQUES (multiple de In → temps
  // de préarc nominal), interpolées en log-log. Valeurs indicatives, non constructeur.
  //  gG (usage général) : protège surcharge + court-circuit. Non-fusion ≈ 1,25·In.
  //  aM (accompagnement moteur) : protège SEULEMENT le court-circuit, démarre ≈ 4·In.
  const FUSE_GG = [[1.25, 1e6], [1.6, 3600], [2, 120], [2.5, 30], [3, 10], [4, 2], [5, 0.7], [6.3, 0.2], [8, 0.06], [10, 0.02], [20, 0.0018], [40, 2.5e-4]];
  const FUSE_AM = [[2.8, 1e6], [4, 3600], [5, 60], [6.3, 10], [8, 1.5], [10, 0.3], [12.5, 0.08], [16, 0.02], [20, 0.007], [40, 7e-4]];
  const FUSE_TOL_SLOW = 1.35;  // borne lente (fusion + arc, dispersion +)
  const FUSE_TOL_FAST = 0.7;   // borne rapide (préarc mini, dispersion -)
  function fuseAnchors(dev) { return dev === 'am' ? FUSE_AM : FUSE_GG; }
  function isFuse(p) { return p.dev === 'gg' || p.dev === 'am'; }
  function isMccb(p) { return p.dev === 'mccb'; }

  /**
   * Géométrie thermique/magnétique d'un disjoncteur (fixe OU réglable MCCB).
   *  base    : courant de réf. du thermique (= In, ou Ir = ir·In pour un MCCB)
   *  magFast : multiple (de base) du seuil magnétique bas (tolérance −)
   *  magSlow : multiple (de base) du seuil magnétique haut (tolérance +)
   */
  function geomOf(p) {
    if (isMccb(p)) {
      const ir = p.ir || 1;            // réglage thermique Ir = ir·In
      const im = p.im || 10;           // réglage magnétique Im = im·In
      const base = ir * p.in;          // le thermique est calé sur Ir
      const magMult = (im * p.in) / base; // seuil magnétique en multiples de Ir
      return { base, magFast: magMult * 0.8, magSlow: magMult * 1.2 }; // ±20 % CEI 60947-2
    }
    // Seuil magnétique = multiple HAUT garanti par la norme (déclenchement
    // instantané certain) : B = 5·In, C = 10·In, D = 20·In, K = 14·In, Z = 3·In.
    const c = CURVES[p.curve] || CURVES.C;
    return { base: p.in, magFast: c.mag[1], magSlow: c.mag[1] };
  }

  function deviceTag(p) {
    if (p.dev === 'gg') return 'gG';
    if (p.dev === 'am') return 'aM';
    if (p.dev === 'mccb') return 'MCCB';
    return (CURVES[p.curve] || CURVES.C).label;
  }
  function deviceLabel(p) {
    if (isMccb(p)) return `MCCB ${Math.round((p.ir || 1) * p.in)}A`;
    return deviceTag(p) + p.in;
  }

  let state = [];        // protections affichées : { in, curve, color }
  let nextColor = 0;
  let geom = null;       // géométrie du tracé (pour le viseur)
  let pointer = null;    // position souris {x,y} en px CSS
  let selStatus = '';    // verdict sélectivité : '', 'total', 'partial', 'warn'

  // Teinte de fond très légère selon la sélectivité (n'altère pas la lisibilité)
  const SEL_TINT = {
    total: 'rgba(34,197,94,0.07)',    // vert très clair
    partial: 'rgba(249,115,22,0.08)', // orange très clair
    warn: 'rgba(239,68,68,0.08)',     // rouge très clair
  };
  const SEL_ACCENT = { total: '#22c55e', partial: '#f97316', warn: '#ef4444' };

  /** Interpolation (et extrapolation) log-log entre points d'essai. */
  function interpLogLog(anchors, x) {
    if (x <= anchors[0][0]) return anchors[0][1];
    let a = anchors[anchors.length - 2], b = anchors[anchors.length - 1];
    for (let i = 1; i < anchors.length; i++) {
      if (x <= anchors[i][0]) { a = anchors[i - 1]; b = anchors[i]; break; }
    }
    const f = (Math.log10(x) - Math.log10(a[0])) / (Math.log10(b[0]) - Math.log10(a[0]));
    return Math.pow(10, Math.log10(a[1]) + f * (Math.log10(b[1]) - Math.log10(a[1])));
  }

  /**
   * Points d'une borne d'enveloppe :
   *  1) zone thermique (interpolée sur les points d'essai CEI),
   *  2) chute verticale au seuil magnétique,
   *  3) PALIER INSTANTANÉ horizontal jusqu'au bord droit (forts courants / Icc).
   */
  /**
   * Renvoie une borne décomposée en parties physiques distinctes :
   *  - thermal : zone de surcharge (vraie COURBE inverse) jusqu'au seuil magnétique
   *  - magI    : courant du seuil magnétique (chute verticale = LIGNE DROITE)
   *  - tInst   : palier instantané (LIGNE DROITE horizontale)
   */
  function boundary(inA, magMult, anchors, tInst) {
    const thermal = [];
    // démarre juste au-dessus de 1,13·In (asymptote de non-déclenchement)
    for (let m = I_NO_TRIP * 1.005; m < magMult; m *= 1.04) {
      thermal.push({ i: m * inA, t: Math.min(interpLogLog(anchors, m), Y_MAX * 5) });
    }
    thermal.push({ i: magMult * inA, t: Math.min(interpLogLog(anchors, magMult), Y_MAX * 5) });
    return { thermal, magI: magMult * inA, tInst };
  }

  function curveData(p) {
    const g = geomOf(p);
    return {
      fast: boundary(g.base, g.magFast, THERMAL_FAST, T_INST_FAST),  // gauche (rapide)
      slow: boundary(g.base, g.magSlow, THERMAL_SLOW, T_INST_SLOW),  // droite (lente)
    };
  }

  /** Points d'une borne fusible (multiple → temps × tolérance), du non-fusion au fort courant. */
  function fuseBoundary(inA, anchors, tol) {
    const pts = [];
    const m0 = anchors[0][0];
    for (let m = m0 * 1.005; m <= X_MAX / inA; m *= 1.035) {
      const t = interpLogLog(anchors, m) * tol;
      pts.push({ i: m * inA, t: Math.min(Math.max(t, Y_MIN / 2), Y_MAX * 5) });
      if (t < Y_MIN / 2) break;
    }
    return pts;
  }

  /** Bande de coupure [tf, ts] d'une protection au courant I (disjoncteur OU fusible). */
  function deviceTripBand(p, I) {
    if (isFuse(p)) {
      const anchors = fuseAnchors(p.dev);
      const m = I / p.in;
      if (m <= anchors[0][0]) return { tf: Infinity, ts: Infinity };
      const base = interpLogLog(anchors, m);
      return { tf: base * FUSE_TOL_FAST, ts: base * FUSE_TOL_SLOW };
    }
    const g = geomOf(p);
    return {
      tf: boundaryTimeAt(g.base, I, THERMAL_FAST, g.magFast, T_INST_FAST),
      ts: boundaryTimeAt(g.base, I, THERMAL_SLOW, g.magSlow, T_INST_SLOW),
    };
  }

  /** Courant (A) auquel la borne 'fast' d'une protection atteint le temps cible (balayage). */
  function currentAtTripTime(p, targetT) {
    let prev = null;
    for (let I = p.in * 1.05; I <= X_MAX; I *= 1.02) {
      const tf = deviceTripBand(p, I).tf;
      if (isFinite(tf) && tf <= targetT) return prev || I;
      prev = I;
    }
    return X_MAX;
  }

  // --- Rendu canvas ---------------------------------------------------------
  function lerpLog(v, vmin, vmax) {
    return (Math.log10(v) - Math.log10(vmin)) / (Math.log10(vmax) - Math.log10(vmin));
  }

  function draw(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 900;
    const cssH = canvas.clientHeight || 560;
    const wantW = Math.round(cssW * dpr);
    const wantH = Math.round(cssH * dpr);
    if (canvas.width !== wantW || canvas.height !== wantH) {
      canvas.width = wantW;
      canvas.height = wantH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW, H = cssH;
    const padL = 56, padR = 16, padT = 16, padB = 44;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const sx = (i) => padL + lerpLog(i, X_MIN, X_MAX) * plotW;
    const sy = (t) => padT + (1 - lerpLog(t, Y_MIN, Y_MAX)) * plotH;
    geom = { padL, padT, plotW, plotH };

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b1424';
    ctx.fillRect(0, 0, W, H);

    // Teinte de fond selon la sélectivité (très légère, derrière la grille)
    const tint = SEL_TINT[selStatus];
    if (tint) {
      ctx.fillStyle = tint;
      ctx.fillRect(padL, padT, plotW, plotH);
    }

    // Grille
    ctx.lineWidth = 1;
    ctx.font = '10px system-ui,sans-serif';
    ctx.textBaseline = 'middle';
    drawGridX(ctx, sx, padT, plotH);
    drawGridY(ctx, sy, padL, plotW);

    // Axes labels
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.font = '11px system-ui,sans-serif';
    ctx.fillText(axisCurrentLabel(), padL + plotW / 2, H - 12);
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axisTimeLabel(), 0, 0);
    ctx.restore();

    // Ligne verticale Icc (courant de court-circuit sur place)
    const iccA = getIccA();
    if (iccA && iccA >= X_MIN && iccA <= X_MAX) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx(iccA), sy(Y_MIN));
      ctx.lineTo(sx(iccA), sy(Y_MAX));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = '11px system-ui,sans-serif';
      ctx.fillText(tr('tcIccLine') + ' ' + fmtCurrent(Math.round(iccA)) + ' A', sx(iccA) + 4, sy(Y_MAX) + 10);
    }

    // Courbes (écrêtées au cadre pour des tracés nets, sans débordement)
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();
    state.forEach((p) => {
      if (isFuse(p)) { drawFuse(ctx, p, sx, sy); return; }
      const d = curveData(p);
      const slowTh = d.slow.thermal.map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
      const fastTh = d.fast.thermal.map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
      const sMagX = sx(d.slow.magI), fMagX = sx(d.fast.magI);
      const sInstY = sy(d.slow.tInst), fInstY = sy(d.fast.tInst);
      const xEnd = sx(X_MAX);

      // bande : thermique lissé (courbe) + verticales/horizontales droites
      ctx.beginPath();
      smoothSubPath(ctx, slowTh, true);             // courbe thermique (lente)
      ctx.lineTo(sMagX, sInstY);                    // chute verticale droite
      ctx.lineTo(xEnd, sInstY);                     // palier instantané droit
      ctx.lineTo(xEnd, fInstY);                     // bord droit
      ctx.lineTo(fMagX, fInstY);                    // palier rapide (retour)
      ctx.lineTo(fMagX, fastTh[fastTh.length - 1].y); // remontée verticale
      smoothSubPath(ctx, fastTh.slice().reverse(), false); // courbe thermique (rapide)
      ctx.closePath();
      ctx.fillStyle = hexA(p.color, 0.12);
      ctx.fill();

      // borne lente (épaisse)
      ctx.beginPath();
      smoothSubPath(ctx, slowTh, true);
      ctx.lineTo(sMagX, sInstY);
      ctx.lineTo(xEnd, sInstY);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // borne rapide (fine)
      ctx.beginPath();
      smoothSubPath(ctx, fastTh, true);
      ctx.lineTo(fMagX, fInstY);
      ctx.lineTo(xEnd, fInstY);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // ligne verticale In
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = hexA(p.color, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(p.in), sy(Y_MIN));
      ctx.lineTo(sx(p.in), sy(Y_MAX));
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Courbe de tenue thermique du câble (I²t = k²·S²) — outil pro
    const cable = getCable();
    if (cable) {
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= plotW; px += 2) {
        const I = Math.pow(10, Math.log10(X_MIN) + (px / plotW) * (Math.log10(X_MAX) - Math.log10(X_MIN)));
        const t = cableTime(cable, I);
        if (t > Y_MAX * 1.2 || t < Y_MIN / 1.2) { started = false; continue; }
        const X = padL + px, Y = sy(t);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // étiquette de la courbe câble (au point t ≈ 1 s)
      const Ilbl = cable.k * cable.S;  // I tel que t = 1 s
      if (Ilbl >= X_MIN && Ilbl <= X_MAX) {
        ctx.fillStyle = '#e879f9';
        ctx.font = 'bold 10px system-ui,sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${tr('tcCableLine')} ${cable.S} mm²`, sx(Ilbl) + 4, sy(1) - 3);
        ctx.textBaseline = 'middle';
      }
    }
    ctx.restore();

    // étiquettes In + rôle au sommet des courbes (hors clip)
    state.forEach((p) => {
      const roleTxt = p.role === 'amont' ? tr('tcRoleAmont')
        : p.role === 'aval' ? tr('tcRoleAval') : '';
      const lbl = deviceLabel(p) + (roleTxt ? ' · ' + roleTxt : '');
      ctx.fillStyle = p.color;
      ctx.font = 'bold 10px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(lbl, sx(p.in), sy(Y_MAX) - 2);
      ctx.textBaseline = 'middle';
    });

    // Cadre
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Petit badge de résultat de sélectivité (coin bas-droit)
    if (selStatus && SEL_ACCENT[selStatus]) {
      const accent = SEL_ACCENT[selStatus];
      const txt = selStatus === 'total' ? tr('tcBadgeTotal')
        : selStatus === 'partial' ? tr('tcBadgePartial') : tr('tcBadgeNone');
      ctx.font = '11px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const padX = 9, dotR = 4, gap = 7;
      const bw = padX * 2 + dotR * 2 + gap + ctx.measureText(txt).width;
      const bh = 22;
      const bx = padL + plotW - bw - 10;
      const by = padT + plotH - bh - 10;
      ctx.fillStyle = 'rgba(2,6,18,0.85)';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(bx + padX + dotR, by + bh / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(txt, bx + padX + dotR * 2 + gap, by + bh / 2 + 0.5);
    }

    // Viseur (croix + valeurs au pointeur)
    if (pointer) drawPointer(ctx);
  }

  // --- Viseur interactif ---------------------------------------------------
  function invX(px) {
    const f = (px - geom.padL) / geom.plotW;
    return Math.pow(10, Math.log10(X_MIN) + f * (Math.log10(X_MAX) - Math.log10(X_MIN)));
  }
  function invY(py) {
    const f = 1 - (py - geom.padT) / geom.plotH;
    return Math.pow(10, Math.log10(Y_MIN) + f * (Math.log10(Y_MAX) - Math.log10(Y_MIN)));
  }
  function fmtIexact(v) {
    if (v >= 1000) return (v / 1000).toFixed(2) + ' kA';
    if (v >= 100) return Math.round(v) + ' A';
    if (v >= 10) return v.toFixed(1) + ' A';
    return v.toFixed(2) + ' A';
  }
  function fmtTexact(s) {
    if (s < 1) return (s * 1000).toFixed(s < 0.01 ? 1 : 0) + ' ms';
    if (s < 60) return s.toFixed(2) + ' s';
    if (s < 3600) return (s / 60).toFixed(1) + ' min';
    return (s / 3600).toFixed(2) + ' h';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPointer(ctx) {
    if (!geom) return;
    const { padL, padT, plotW, plotH } = geom;
    const x = pointer.x, y = pointer.y;
    if (x < padL || x > padL + plotW || y < padT || y > padT + plotH) return;

    const I = invX(x), t = invY(y);

    // croix
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH);
    ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.setLineDash([]);
    // point
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();

    // bulle : courant pointé + VRAI temps de coupure de chaque disjoncteur à ce courant
    ctx.font = '11px system-ui,sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const header = 'À ' + fmtIexact(I) + ' :';
    const lines = state.map((p) => {
      const { tf, ts } = deviceTripBand(p, I);
      let verdict;
      if (!isFinite(tf) && !isFinite(ts)) verdict = tr('tcNoTrip');
      else if (ts > Y_MAX) verdict = '> ' + fmtTexact(Y_MAX);
      else verdict = fmtTexact(tf) + ' – ' + fmtTexact(ts);
      return { txt: `${deviceLabel(p)} : ${verdict}`, color: p.color, trips: isFinite(ts) };
    });

    const rowH = 15;
    const bh = 12 + rowH + lines.length * rowH;
    ctx.font = 'bold 11px system-ui,sans-serif';
    let maxW = ctx.measureText(header).width;
    ctx.font = '11px system-ui,sans-serif';
    lines.forEach((l) => { maxW = Math.max(maxW, ctx.measureText(l.txt).width + 14); });
    const bw = maxW + 18;
    let bx = x + 12, by = y - bh - 10;
    if (bx + bw > padL + plotW) bx = x - bw - 12;
    if (bx < padL) bx = padL + 2;
    if (by < padT) by = y + 12;
    if (by + bh > padT + plotH) by = padT + plotH - bh - 2;

    ctx.fillStyle = 'rgba(2,6,18,0.94)';
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px system-ui,sans-serif';
    ctx.fillText(header, bx + 9, by + 13);
    ctx.font = '11px system-ui,sans-serif';
    lines.forEach((l, i) => {
      const ly = by + 13 + (i + 1) * rowH;
      ctx.fillStyle = l.color;
      ctx.beginPath(); ctx.arc(bx + 13, ly, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = l.trips ? '#e2e8f0' : '#94a3b8';
      ctx.fillText(l.txt, bx + 22, ly);
    });
  }

  /** Temps de coupure d'une borne au courant I (cohérent avec la courbe tracée). */
  function boundaryTimeAt(inA, I, anchors, magMult, tInst) {
    const x = I / inA;
    if (x <= I_NO_TRIP) return Infinity;   // ne coupe pas
    if (x >= magMult) return tInst;        // instantané (au-delà du seuil magnétique)
    return interpLogLog(anchors, x);       // zone thermique
  }

  function fmtCurrent(v) {
    if (v >= 1000) {
      const k = v / 1000;
      return (Number.isInteger(k) ? k : k.toFixed(1)) + 'k';
    }
    return String(v);
  }

  function fmtTime(s) {
    if (s < 1) return Math.round(s * 1000) + ' ms';
    if (s < 60) return (Number.isInteger(s) ? s : s.toFixed(1)) + ' s';
    if (s < 3600) return (s / 60) + ' min';
    return (s / 3600) + ' h';
  }

  function drawGridX(ctx, sx, padT, plotH) {
    // multiples étiquetés par décade : graduations riches façon courbe constructeur
    const labelMults = [1, 2, 3, 4, 5, 6, 8];
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'center';
    for (let dec = 0; dec <= 4; dec++) {
      const base = Math.pow(10, dec);
      for (let m = 1; m < 10; m++) {
        const v = base * m;
        if (v < X_MIN || v > X_MAX) continue;
        const X = sx(v);
        const labeled = labelMults.includes(m);
        ctx.strokeStyle = m === 1 ? 'rgba(255,255,255,0.20)'
          : labeled ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.moveTo(X, padT);
        ctx.lineTo(X, padT + plotH);
        ctx.stroke();
        if (labeled) {
          ctx.fillStyle = m === 1 ? '#cbd5e1' : '#7c8aa0';
          ctx.fillText(fmtCurrent(v), X, padT + plotH + 12);
        }
      }
    }
  }

  // Paliers de temps étiquetés : de 1 ms à 10 h
  const TIME_LABELS = [
    0.001, 0.005, 0.01, 0.05, 0.1, 0.5,
    1, 2, 5, 10, 30, 60, 120, 300, 600, 1800, 3600, 7200, 18000, 36000,
  ];

  function drawGridY(ctx, sy, padL, plotW) {
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'right';
    // lignes mineures (log) discrètes
    for (let dec = -3; dec <= 4; dec++) {
      const base = Math.pow(10, dec);
      for (let m = 1; m < 10; m++) {
        const v = base * m;
        if (v < Y_MIN || v > Y_MAX) continue;
        ctx.strokeStyle = m === 1 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.moveTo(padL, sy(v));
        ctx.lineTo(padL + plotW, sy(v));
        ctx.stroke();
      }
    }
    // lignes + libellés sur les paliers ronds
    TIME_LABELS.forEach((v) => {
      if (v < Y_MIN || v > Y_MAX) return;
      const Y = sy(v);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(padL, Y);
      ctx.lineTo(padL + plotW, Y);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(fmtTime(v), padL - 5, Y);
    });
  }

  /**
   * Ajoute au chemin courant une courbe lissée (spline de Catmull-Rom convertie
   * en Béziers cubiques) passant par les points écran fournis.
   * @param startNew si vrai, démarre par moveTo ; sinon enchaîne (lineTo) depuis le point courant.
   */
  function smoothSubPath(ctx, pts, startNew) {
    if (!pts.length) return;
    if (pts.length < 3) {
      startNew ? ctx.moveTo(pts[0].x, pts[0].y) : ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      return;
    }
    startNew ? ctx.moveTo(pts[0].x, pts[0].y) : ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const gg = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${gg},${b},${a})`;
  }

  /** Tracé d'une protection FUSIBLE (bande préarc lente/rapide, courbe lisse). */
  function drawFuse(ctx, p, sx, sy) {
    const anchors = fuseAnchors(p.dev);
    const slow = fuseBoundary(p.in, anchors, FUSE_TOL_SLOW).map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
    const fast = fuseBoundary(p.in, anchors, FUSE_TOL_FAST).map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
    if (!slow.length || !fast.length) return;

    // bande remplie entre borne lente et borne rapide
    ctx.beginPath();
    smoothSubPath(ctx, slow, true);
    smoothSubPath(ctx, fast.slice().reverse(), false);
    ctx.closePath();
    ctx.fillStyle = hexA(p.color, 0.12);
    ctx.fill();

    ctx.strokeStyle = p.color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath(); smoothSubPath(ctx, slow, true); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); smoothSubPath(ctx, fast, true); ctx.lineWidth = 1.4; ctx.stroke();

    // ligne verticale In
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(p.color, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(p.in), sy(Y_MIN));
    ctx.lineTo(sx(p.in), sy(Y_MAX));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- i18n helpers ---------------------------------------------------------
  function lang() {
    try { return localStorage.getItem('electrodz-site-lang') === 'fr' ? 'fr' : 'ar'; }
    catch (_) { return 'ar'; }
  }
  function tr(key) {
    const I = g.ElectroDzCalcI18n;
    return I ? I.t(lang(), key) : key;
  }
  function axisCurrentLabel() { return tr('tcAxisCurrent'); }
  function axisTimeLabel() { return tr('tcAxisTime'); }

  function trTpl(key, vars) {
    return tr(key).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }

  // --- Sélectivité ---------------------------------------------------------
  function getIccA() {
    const el = document.getElementById('tc-icc');
    const a = parseFloat(el?.value || '');
    return isNaN(a) || a <= 0 ? null : a;
  }

  // --- Outils pro ----------------------------------------------------------
  // Coefficient k de tenue thermique du câble (CEI 60364-4-43).
  const CABLE_K = { cu: { pvc: 115, pr: 143 }, al: { pvc: 76, pr: 94 } };

  function proOpen() {
    const p = document.getElementById('tc-pro');
    return p && !p.hasAttribute('hidden');
  }
  function getIcuA() {
    const el = document.getElementById('tc-icu');
    const kA = parseFloat(el?.value || '');
    return isNaN(kA) || kA <= 0 ? null : kA * 1000;
  }
  function getCable() {
    if (!proOpen()) return null;
    const S = parseFloat(document.getElementById('tc-cable-s')?.value || '');
    if (isNaN(S) || S <= 0) return null;
    const mat = document.getElementById('tc-cable-mat')?.value || 'cu';
    const ins = document.getElementById('tc-cable-ins')?.value || 'pvc';
    const k = (CABLE_K[mat] || CABLE_K.cu)[ins] || 115;
    return { S, mat, ins, k };
  }
  /** Temps de tenue thermique du câble au courant I : t = (k·S)² / I². */
  function cableTime(cable, I) {
    return Math.pow(cable.k * cable.S, 2) / (I * I);
  }

  /**
   * Analyse de sélectivité entre amont (plus grand In) et aval (plus petit In).
   * Limite de sélectivité Is ≈ seuil magnétique bas de l'amont :
   *   sous Is, l'amont ne déclenche qu'en thermique (lent) → seul l'aval coupe.
   *   au-delà, l'amont peut déclencher en magnétique → risque de coupure simultanée.
   * Modèle générique indicatif (CEI 60898) — pas une table constructeur.
   */
  function analyzeSelectivity() {
    const box = document.getElementById('tc-verdict');
    selStatus = '';
    if (!box) return;
    box.className = 'tc-verdict';
    if (state.length < 2) { box.innerHTML = ''; return; }

    // Rôles explicites prioritaires ; sinon repli sur le calibre (plus gros = amont)
    let up = state.find((p) => p.role === 'amont');
    let down = state.find((p) => p.role === 'aval');
    if (!up || !down) {
      const sorted = [...state].sort((a, b) => b.in - a.in);
      up = up || sorted[0];
      down = down || sorted[sorted.length - 1];
    }
    if (!up || !down || up === down || up.in === down.in) { box.innerHTML = ''; selStatus = ''; return; }
    // cohérence : l'amont doit avoir un calibre ≥ aval
    if (up.in < down.in) { const tmp = up; up = down; down = tmp; }

    // Limite de sélectivité Is : courant où l'amont commence à pouvoir couper vite.
    //  - disjoncteur : seuil magnétique bas ;
    //  - fusible : courant où le préarc amont descend à ~0,1 s (zone de fusion rapide).
    const Is = isFuse(up)
      ? Math.round(currentAtTripTime(up, 0.1))
      : Math.round((() => { const g = geomOf(up); return g.magFast * g.base; })());
    const ratio = up.in / down.in;
    const iccA = getIccA();

    let cls = 'partial';
    let html = '';

    // Garde-fou : rapport de calibre amont/aval trop faible (sélectivité thermique douteuse)
    if (ratio < 1.6) {
      cls = 'warn';
      html = trTpl('tcVerdictRatio', { up: up.in, down: down.in, ratio: ratio.toFixed(2) });
    } else if (iccA) {
      if (iccA <= Is) {
        cls = 'total';
        html = trTpl('tcVerdictTotalSite', { is: Is, icc: Math.round(iccA) });
      } else {
        cls = 'partial';
        html = trTpl('tcVerdictPartialSite', { is: Is, icc: Math.round(iccA) });
      }
      html += `<small>${tr('tcIccPoint')}</small>`;
    } else {
      cls = 'partial';
      html = trTpl('tcVerdictLimitOnly', { is: Is });
    }

    box.className = 'tc-verdict show ' + cls;
    box.innerHTML = html;
    selStatus = cls;
  }

  /** Outils pro : pouvoir de coupure (Icu vs Icc) + protection thermique du câble. */
  function analyzePro() {
    const box = document.getElementById('tc-pro-result');
    if (!box || !proOpen()) { if (box) box.innerHTML = ''; return; }
    const lines = [];

    // 1) Pouvoir de coupure
    const icu = getIcuA(), icc = getIccA();
    if (icu && icc) {
      const ok = icu >= icc;
      lines.push({ cls: ok ? 'ok' : 'bad', html: trTpl(ok ? 'tcIcuOk' : 'tcIcuBad',
        { icu: (icu / 1000).toFixed(1), icc: (icc / 1000).toFixed(1) }) });
    } else {
      lines.push({ cls: 'info', html: tr('tcIcuMissing') });
    }

    // 2) Protection thermique du câble
    const cable = getCable();
    if (!cable) {
      lines.push({ cls: 'info', html: tr('tcCableInfo') });
    } else {
      // disjoncteur de référence : l'aval explicite, sinon le plus petit calibre
      const ref = state.find((p) => p.role === 'aval')
        || [...state].sort((a, b) => a.in - b.in)[0];
      const matLbl = tr(cable.mat === 'al' ? 'tcMatAl' : 'tcMatCu');
      if (!ref) {
        lines.push({ cls: 'info', html: tr('tcCableInfo') });
      } else {
        if (!icc) {
          // la tenue adiabatique du câble ne concerne QUE le court-circuit : Icc requis
          lines.push({ cls: 'info', html: tr('tcCableNeedIcc') });
        } else {
          // Vérification adiabatique CEI 60364-4-43 AU COURANT DE COURT-CIRCUIT Icc :
          //   énergie laissée passer  I²·t  ≤  k²·S²  (tenue thermique du câble).
          // (En surcharge, la protection du câble relève de l'ampacité In ≤ Iz,
          //  non traitée ici.) Temps de coupure conservateur = borne lente.
          const tClear = deviceTripBand(ref, icc).ts;
          const eBreaker = icc * icc * tClear;          // A²·s laissés passer (estimé)
          const eCable = Math.pow(cable.k * cable.S, 2); // A²·s admissibles par le câble
          if (eBreaker <= eCable) {
            lines.push({ cls: 'ok', html: trTpl('tcCableOk',
              { s: cable.S, mat: matLbl, k: cable.k, icc: fmtIexact(icc) }) });
          } else {
            lines.push({ cls: 'bad', html: trTpl('tcCableBad',
              { s: cable.S, mat: matLbl, icc: fmtIexact(icc) }) });
          }
        }
      }
    }

    box.innerHTML = lines.map((l) => `<div class="tc-pro-line ${l.cls}">${l.html}</div>`).join('');
  }

  // --- Contrôleur ----------------------------------------------------------
  function renderLegend() {
    const box = document.getElementById('tc-legend');
    if (!box) return;
    if (!state.length) {
      box.innerHTML = `<span style="color:var(--muted);font-size:0.85rem">${tr('tcEmpty')}</span>`;
      return;
    }
    box.innerHTML = state.map((p, i) => {
      let badge = '';
      if (p.role === 'amont') badge = `<b class="tc-role tc-role-amont">${tr('tcRoleAmont')}</b>`;
      else if (p.role === 'aval') badge = `<b class="tc-role tc-role-aval">${tr('tcRoleAval')}</b>`;
      const c = CURVES[p.curve] || CURVES.C;
      const desc = isFuse(p)
        ? `${tr(p.dev === 'am' ? 'tcDevAm' : 'tcDevGg')}`
        : isMccb(p)
          ? `MCCB · Ir ${Math.round((p.ir || 1) * p.in)}A · Im ${p.im || 10}·In`
          : `${tr('tcCurveWord')} ${deviceTag(p)} · ${tr('tcMagZone')} ${c.mag[1]}·In (${Math.round(c.mag[1] * p.in)} A)`;
      return `<span class="tc-chip" style="border-color:${p.color}">
        <span class="tc-dot" style="background:${p.color}"></span>
        ${badge}${p.in} A · ${desc}
        <button type="button" class="tc-x" data-tc-remove="${i}" aria-label="x">✕</button>
      </span>`;
    }).join('');
    box.querySelectorAll('[data-tc-remove]').forEach((btn) => {
      btn.onclick = () => {
        state.splice(parseInt(btn.dataset.tcRemove, 10), 1);
        refresh();
      };
    });
  }

  function refresh() {
    renderLegend();
    analyzeSelectivity();
    analyzePro();
    draw(document.getElementById('tc-canvas'));
  }

  function add(inA, curve, role, dev, opts) {
    if (state.length >= 8) return;
    const r = role || 'autre';
    // un seul amont et un seul aval à la fois (comme un vrai schéma)
    if (r === 'amont' || r === 'aval') {
      state.forEach((p) => { if (p.role === r) p.role = 'autre'; });
    }
    const p = { in: inA, curve, role: r, dev: dev || 'mcb', color: PALETTE[nextColor % PALETTE.length] };
    if (dev === 'mccb') { p.ir = (opts && opts.ir) || 1; p.im = (opts && opts.im) || 10; }
    state.push(p);
    nextColor++;
    refresh();
  }

  function addCurrent() {
    const inEl = document.getElementById('tc-in');
    const cEl = document.getElementById('tc-curve');
    const rEl = document.getElementById('tc-role');
    const dEl = document.getElementById('tc-device');
    const inA = parseFloat(inEl?.value || '16');
    const curve = cEl?.value || 'C';
    const role = rEl?.value || 'autre';
    const dev = dEl?.value || 'mcb';
    const opts = {};
    if (dev === 'mccb') {
      const ir = parseFloat(document.getElementById('tc-ir')?.value || '1');
      const im = parseFloat(document.getElementById('tc-im')?.value || '10');
      opts.ir = (!isNaN(ir) && ir > 0) ? Math.min(Math.max(ir, 0.4), 1) : 1;
      opts.im = (!isNaN(im) && im > 0) ? im : 10;
    }
    if (!isNaN(inA) && inA > 0) add(inA, curve, role, dev, opts);
  }

  function clearAll() { state = []; nextColor = 0; refresh(); }

  // --- Export --------------------------------------------------------------
  /** Redessine sans le viseur puis renvoie le PNG en dataURL. */
  function snapshotPNG() {
    const cv = document.getElementById('tc-canvas');
    if (!cv) return null;
    const keep = pointer;
    pointer = null;
    draw(cv);
    const url = cv.toDataURL('image/png');
    pointer = keep;
    return url;
  }
  function exportPNG() {
    const url = snapshotPNG();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courbes-ti-electrodz.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  /** Ouvre une fenêtre imprimable (image + verdicts) → l'utilisateur enregistre en PDF. */
  function exportPDF() {
    const url = snapshotPNG();
    if (!url) return;
    const verdict = document.getElementById('tc-verdict');
    const pro = document.getElementById('tc-pro-result');
    const proVisible = proOpen() && pro && pro.innerHTML.trim();
    const rtl = lang() === 'ar';
    const blocks = [];
    if (verdict && verdict.innerHTML.trim()) blocks.push(verdict.innerHTML);
    if (proVisible) blocks.push(pro.innerHTML);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
      <title>${tr('tcExportTitle')}</title>
      <style>body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}
      h1{font-size:18px;margin:0 0 12px}img{width:100%;max-width:1000px;border:1px solid #ccc;border-radius:8px}
      .v{margin-top:14px;font-size:13px;line-height:1.5}.v small{color:#555}
      .d{margin-top:18px;font-size:11px;color:#777;border-top:1px solid #ddd;padding-top:10px}</style></head>
      <body><h1>${tr('tcExportTitle')}</h1><img src="${url}">
      <div class="v">${blocks.join('<hr>')}</div>
      <div class="d">${tr('tcDisclaimer')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
      </body></html>`);
    w.document.close();
  }

  let bound = false;
  function init() {
    const sec = document.getElementById('tripcurve');
    if (!sec || bound) { refresh(); return; }
    bound = true;
    document.getElementById('tc-add')?.addEventListener('click', addCurrent);
    document.getElementById('tc-clear')?.addEventListener('click', clearAll);
    document.getElementById('tc-icc')?.addEventListener('input', refresh);

    // type d'appareil : courbe B/C/D pour MCB ; réglages Ir/Im pour MCCB
    const devEl = document.getElementById('tc-device');
    const curveGroup = document.getElementById('tc-curve-group');
    const irGroup = document.getElementById('tc-ir-group');
    const imGroup = document.getElementById('tc-im-group');
    const syncDevice = () => {
      const v = devEl ? devEl.value : 'mcb';
      if (curveGroup) curveGroup.style.display = (v === 'mcb') ? '' : 'none';
      if (irGroup) irGroup.style.display = (v === 'mccb') ? '' : 'none';
      if (imGroup) imGroup.style.display = (v === 'mccb') ? '' : 'none';
    };
    devEl?.addEventListener('change', syncDevice);
    syncDevice();

    // Mode professionnel : bascule d'affichage du panneau d'outils pro
    const proToggle = document.getElementById('tc-pro-toggle');
    const proPanel = document.getElementById('tc-pro');
    if (proToggle && proPanel) {
      proToggle.addEventListener('click', () => {
        const open = proPanel.hasAttribute('hidden');
        if (open) proPanel.removeAttribute('hidden'); else proPanel.setAttribute('hidden', '');
        proToggle.classList.toggle('active', open);
        proToggle.setAttribute('aria-expanded', String(open));
        proToggle.textContent = tr(open ? 'tcProHide' : 'tcProToggle');
        refresh();
      });
    }
    ['tc-icu', 'tc-cable-s', 'tc-cable-mat', 'tc-cable-ins'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', refresh);
      el?.addEventListener('change', refresh);
    });
    document.getElementById('tc-export-png')?.addEventListener('click', exportPNG);
    document.getElementById('tc-export-pdf')?.addEventListener('click', exportPDF);

    const cv = document.getElementById('tc-canvas');
    if (cv) {
      const move = (e) => {
        const r = cv.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        pointer = { x: src.clientX - r.left, y: src.clientY - r.top };
        draw(cv);
      };
      cv.addEventListener('mousemove', move);
      cv.addEventListener('mousedown', move);
      cv.addEventListener('touchstart', move, { passive: true });
      cv.addEventListener('touchmove', move, { passive: true });
      cv.addEventListener('mouseleave', () => { pointer = null; draw(cv); });
      cv.style.cursor = 'crosshair';
    }
    window.addEventListener('resize', () => {
      if (document.getElementById('tripcurve')?.classList.contains('active')) {
        draw(document.getElementById('tc-canvas'));
      }
    });
    if (!state.length) {
      // exemple par défaut : sélectivité amont 63 A / aval 16 A
      add(63, 'C', 'amont');
      add(16, 'C', 'aval');
    } else {
      refresh();
    }
  }

  // appelé quand la section devient visible (canvas a alors une taille réelle)
  function onShow() { requestAnimationFrame(() => draw(document.getElementById('tc-canvas'))); }

  g.ElectroDzTripCurve = { init, onShow, addCurrent, clearAll, redraw: refresh, CURVES };
})(typeof window !== 'undefined' ? window : globalThis);
