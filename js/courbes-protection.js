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
  const Y_DATA_CAP = 36000;             // plafond pour le calcul des courbes (s)
  const Y_AXIS_MAX_CAP = 36000;
  /** Paliers d'échelle temps pour l'axe Y (s). */
  const Y_AXIS_TICKS = [0.001, 0.005, 0.01, 0.1, 1, 10, 100, 1000, 3600, 10000, 36000];
  const Y_AXIS_MIN = 0.001;
  let plotYLo = 0.01;
  let plotYHi = 3600;

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
  // Temps de coupure instantané UNIQUE (~10 ms) : une seule ligne horizontale
  // au plancher (déclenchement magnétique + temps d'arc), comme les courbes pro.
  const T_INST_SLOW = 0.01;
  const T_INST_FAST = 0.01;

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
  function isMfgMccb(p) { return p.dev === 'mfg_mccb'; }
  function isNormMccbB(p) { return isMccb(p) && p.mccbCat === 'B'; }

  /** MCCB mode IEC Cat. B : courbe long + court retard (enveloppe 60947-2 générique). */
  function enrichNormMccb(p) {
    if (!isMccb(p)) return p;
    const ir = p.ir || 1;
    const im = p.im || 10;
    if (p.mccbCat === 'B') {
      const isd = IEC_CAT_B.isdMult;
      const tsd = IEC_CAT_B.tsdSec;
      return {
        ...p,
        ir,
        im,
        isd,
        tsd,
        ii: im,
        hasShortTime: true,
        longAnchors: THERMAL_SLOW,
        instTS: T_INST_SLOW,
        normRef: 'IEC 60947-2 Cat. B',
      };
    }
    return { ...p, ir, im, mccbCat: 'A', hasShortTime: false, normRef: 'IEC 60947-2 Cat. A' };
  }

  function isMfgMcb(p) { return p.dev === 'mfg_mcb'; }
  function isMfg(p) { return isMfgMccb(p) || isMfgMcb(p); }

  const MFG_TOL_FAST = 0.88;
  const MFG_TOL_SLOW = 1.12;

  /** Enveloppe indicative MCCB cat. B (IEC 60947-2) — Isd/Tsd tracés sur le graphe, pas en « données ». */
  const IEC_CAT_B = {
    isdMult: 2,
    tsdSec: 0.2,
    isdMin: 1.5,
    isdMax: 10,
    tsdValues: [0.001, 0.005, 0.1, 0.2, 0.3, 0.4],
  };

  /** Seuils absolus (A) et temporisations pour un profil Schneider Micrologic. */
  function scaleAnchorsByTr(anchors, trSec, refTr) {
    if (!anchors?.length || !trSec || trSec === refTr) return anchors;
    const k = trSec / refTr;
    return anchors.map(([m, t]) => [m, t >= 1e5 ? t : Math.max(t * k, 0.001)]);
  }

  /** tr (long retard @ 6·Ir) : uniquement Micrologic / MCCB avec supportsTr explicite dans le catalogue. */
  function mfgUsesTr(p) {
    return isMfgMccb(p) && p.supportsTr === true && p.tr != null && Number(p.tr) > 0;
  }

  function mfgScaledAnchors(p, anchors) {
    if (!anchors?.length) return anchors || [];
    if (!mfgUsesTr(p)) return anchors;
    return scaleAnchorsByTr(anchors, p.tr, p.trRefSec || 1);
  }

  function mfgThresholds(p) {
    const irA = p.fixedIr ? p.in : (p.ir || 1) * p.in;
    const isdA = p.hasShortTime && p.isd != null ? p.isd * irA : irA * 6;
    const iiA = p.ii != null && p.ii > 0 ? p.ii * p.in : X_MAX * 0.5;
    return {
      irA,
      isdA,
      iiA,
      tsd: p.tsd != null ? p.tsd : 0,
      instTS: p.instTS || 0.02,
      noTripMult: 1.05,
    };
  }

  function mfgLongTimeAt(p, I) {
    const th = mfgThresholds(p);
    const m = I / th.irA;
    if (m <= th.noTripMult) return Infinity;
    if (p.hasShortTime && I >= th.isdA) return null;
    if (!p.hasShortTime && I >= th.iiA) return null;
    const raw = p.longAnchors || [];
    if (!raw.length) return Infinity;
    const anchors = mfgScaledAnchors(p, raw);
    return interpLogLog(anchors, m);
  }

  /** Temps de coupure catalogue au courant I (bande rapide / lente). */
  function mfgTripTimeAt(p, I) {
    if (p.magMult && p.longAnchors) {
      const mag = p.magMult;
      const inA = p.in;
      if (I < inA * 1.13) return { tf: Infinity, ts: Infinity };
      if (I >= mag[1] * inA) {
        const t = p.instTS || T_INST_SLOW;
        return { tf: t * MFG_TOL_FAST, ts: t * MFG_TOL_SLOW };
      }
      const m = I / inA;
      const anchors = mfgScaledAnchors(p, p.longAnchors);
      const tLong = interpLogLog(anchors, m);
      return { tf: tLong * MFG_TOL_FAST, ts: tLong * MFG_TOL_SLOW };
    }
    const th = mfgThresholds(p);
    if (I < th.irA * th.noTripMult) return { tf: Infinity, ts: Infinity };

    if (p.hasShortTime && I >= th.isdA) {
      if (p.ii != null && p.ii > 0 && I >= th.iiA) {
        const t = th.instTS;
        return { tf: t * MFG_TOL_FAST, ts: t * MFG_TOL_SLOW };
      }
      const t = th.tsd;
      return { tf: t * MFG_TOL_FAST, ts: t * MFG_TOL_SLOW };
    }

    if (!p.hasShortTime && p.ii > 0 && I >= th.iiA) {
      const t = th.instTS;
      return { tf: t * MFG_TOL_FAST, ts: t * MFG_TOL_SLOW };
    }

    const tLong = mfgLongTimeAt(p, I);
    if (tLong == null || !isFinite(tLong)) {
      const t = th.instTS;
      return { tf: t * MFG_TOL_FAST, ts: t * MFG_TOL_SLOW };
    }
    return { tf: tLong * MFG_TOL_FAST, ts: tLong * MFG_TOL_SLOW };
  }

  /** Points de tracé : long (courbe), palier court (Tsd), palier instantané. */
  function curveDataManufacturer(p) {
    const th = mfgThresholds(p);
    const long = [];
    const startM = th.noTripMult * 1.002;
    const endM = p.hasShortTime ? th.isdA / th.irA : th.iiA / th.irA;
    const scaled = mfgScaledAnchors(p, p.longAnchors || []);
    for (let m = startM; m < endM * 0.998; m *= 1.04) {
      const t = interpLogLog(scaled, m);
      long.push({ i: m * th.irA, t: Math.min(t, Y_DATA_CAP * 5) });
    }
    long.push({ i: endM * th.irA * 0.998, t: long.length ? long[long.length - 1].t : 1 });

    const shortI = th.isdA;
    const instI = th.iiA;
    return {
      long,
      shortI,
      instI,
      tsd: th.tsd,
      instTS: th.instTS,
      hasShortTime: p.hasShortTime,
      irA: th.irA,
    };
  }

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
    // Zone magnétique = bande de tolérance normative (forme « tunnel » pro) :
    //  borne rapide au multiple bas (ne PAS déclencher en dessous),
    //  borne lente au multiple haut (déclenchement instantané GARANTI).
    //  C : 5–10·In, B : 3–5·In, D : 10–20·In.
    const c = CURVES[p.curve] || CURVES.C;
    return { base: p.in, magFast: c.mag[0], magSlow: c.mag[1] };
  }

  function deviceTag(p) {
    if (p.dev === 'gg') return 'gG';
    if (p.dev === 'am') return 'aM';
    if (p.dev === 'mccb') return p.mccbCat === 'B' ? 'MCCB·B' : 'MCCB·A';
    if (isMfg(p)) return p.deviceLabel || 'NSX';
    return (CURVES[p.curve] || CURVES.C).label;
  }
  function deviceLabel(p) {
    if (isMfg(p)) {
      const irA = Math.round((p.ir || 1) * p.in);
      return `${p.deviceLabel || 'NSX'} ${p.in}A`;
    }
    if (isMccb(p)) {
      const cat = p.mccbCat === 'B' ? ' B' : ' A';
      return `MCCB${cat} ${Math.round((p.ir || 1) * p.in)}A`;
    }
    return deviceTag(p) + p.in;
  }
  function mfgLegendDesc(p) {
    const brand = p.brand ? `${p.brand} · ` : '';
    if (isMfgMcb(p)) {
      return `${brand}${p.deviceLabel} · ${p.tripUnitLabel || ''} · ${tr('tcCurveWord')} ${p.curve || 'C'}`;
    }
    const irA = Math.round((p.fixedIr ? p.in : (p.ir || 1) * p.in));
    let s = brand + trTpl('tcMfgLegend', { ref: p.deviceLabel, tu: p.tripUnitLabel, ir: irA });
    if (mfgUsesTr(p)) s += ` · tr ${p.tr}s`;
    if (p.hasShortTime) s += trTpl('tcMfgLegendSt', { isd: p.isd, tsd: fmtTime(p.tsd != null ? p.tsd : 0.2) });
    if (p.ii != null && p.ii > 0) s += trTpl('tcMfgLegendIi', { ii: p.ii });
    else if (p.hasShortTime) s += ' · Ii OFF';
    return s;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /** Libellé court sur le bouton : référence + calibre In. */
  function legendChipShort(p) {
    const inA = Math.round(p.in);
    let name = '';
    if (isMfg(p)) name = String(p.deviceLabel || p.deviceId || 'MCCB').trim();
    else if (isFuse(p)) name = p.dev === 'am' ? 'aM' : 'gG';
    else if (isMccb(p)) name = `MCCB${p.mccbCat === 'B' ? ' B' : ''}`;
    else name = deviceTag(p);
    const curve = isMfgMcb(p) ? ` ${p.curve || 'C'}` : '';
    return `${name}${curve} · ${inA} A`;
  }

  function legendChipTitle(p) {
    const c = CURVES[p.curve] || CURVES.C;
    if (isMfg(p)) return mfgLegendDesc(p);
    if (isFuse(p)) return `${tr(p.dev === 'am' ? 'tcDevAm' : 'tcDevGg')} · ${p.in} A`;
    if (isMccb(p)) {
      return p.mccbCat === 'B'
        ? `MCCB Cat.B · Ir ${Math.round((p.ir || 1) * p.in)} A · Isd ${p.isd || 2}×Ir · Tsd ${fmtTime(p.tsd != null ? p.tsd : 0.2)}`
        : `MCCB Cat.A · Ir ${Math.round((p.ir || 1) * p.in)} A · Im ${p.im || 10}×In`;
    }
    return `${deviceTag(p)} · ${tr('tcCurveWord')} ${p.curve} · ${p.in} A`;
  }

  let state = [];        // protections affichées : { in, curve, color }
  let nextColor = 0;
  let editIndex = -1;    // index en cours de modification (-1 = ajout)
  let previewIndex = -1; // courbe fantôme (nouvelle protection, formulaire touché)
  let editSnapshot = null;
  let formTouched = false;
  /** Référence / In / organe / position : reconstruire la courbe amont ou aval sur le graphe. */
  let rebuildCurveFromForm = false;
  let refreshPending = false;
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

  /** Thème écran (fond sombre) vs export / impression (fond blanc, texte sombre). */
  const DRAW_THEME = {
    screen: {
      bg: '#0b1424',
      selTint: SEL_TINT,
      gridDecade: 'rgba(255,255,255,0.20)',
      gridLabeled: 'rgba(255,255,255,0.10)',
      gridMinor: 'rgba(255,255,255,0.04)',
      gridTime: 'rgba(255,255,255,0.12)',
      gridTimeDec: 'rgba(255,255,255,0.16)',
      axisXMajor: '#cbd5e1',
      axisXMinor: '#7c8aa0',
      axisY: '#cbd5e1',
      axisTitle: '#94a3b8',
      frame: 'rgba(255,255,255,0.18)',
      iccLine: '#ffffff',
      iccText: '#ffffff',
      deviceLabel: null,
      badgeBg: 'rgba(2,6,18,0.85)',
      badgeText: '#e2e8f0',
      zoneThermal: { fill: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.45)', text: '#fde68a' },
      zoneShort: { fill: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.45)', text: '#7dd3fc' },
      zoneMag: { fill: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.45)', text: '#fecaca' },
      legendBg: 'rgba(2,6,18,0.88)',
      legendTitle: '#e2e8f0',
      pointerCross: 'rgba(255,255,255,0.55)',
      pointerBubbleBg: 'rgba(2,6,18,0.94)',
      pointerBubbleStroke: 'rgba(255,255,255,0.28)',
      pointerText: '#e2e8f0',
      pointerMuted: '#94a3b8',
    },
    export: {
      bg: '#ffffff',
      selTint: {
        total: 'rgba(22,163,74,0.10)',
        partial: 'rgba(234,88,12,0.10)',
        warn: 'rgba(220,38,38,0.10)',
      },
      gridDecade: 'rgba(15,23,42,0.22)',
      gridLabeled: 'rgba(15,23,42,0.12)',
      gridMinor: 'rgba(15,23,42,0.05)',
      gridTime: 'rgba(15,23,42,0.14)',
      gridTimeDec: 'rgba(15,23,42,0.18)',
      axisXMajor: '#334155',
      axisXMinor: '#64748b',
      axisY: '#334155',
      axisTitle: '#1e293b',
      frame: 'rgba(15,23,42,0.25)',
      iccLine: '#0f172a',
      iccText: '#0f172a',
      deviceLabel: null,
      badgeBg: 'rgba(255,255,255,0.95)',
      badgeText: '#0f172a',
      zoneThermal: { fill: 'rgba(251,191,36,0.22)', border: '#d97706', text: '#92400e' },
      zoneShort: { fill: 'rgba(14,165,233,0.18)', border: '#0284c7', text: '#075985' },
      zoneMag: { fill: 'rgba(239,68,68,0.15)', border: '#dc2626', text: '#991b1b' },
      legendBg: 'rgba(255,255,255,0.96)',
      legendTitle: '#0f172a',
      pointerCross: 'rgba(15,23,42,0.4)',
      pointerBubbleBg: '#ffffff',
      pointerBubbleStroke: 'rgba(15,23,42,0.35)',
      pointerText: '#0f172a',
      pointerMuted: '#64748b',
    },
  };

  let activeDrawTheme = DRAW_THEME.screen;

  /** Interpolation (et extrapolation) log-log entre points d'essai. */
  // Spline cubique MONOTONE (Fritsch–Carlson) en log-log : courbe vraiment lisse
  // passant par les points d'essai, sans oscillation ni segments droits visibles.
  const _splineCache = new WeakMap();
  function buildSpline(anchors) {
    const xs = anchors.map((p) => Math.log10(p[0]));
    const ys = anchors.map((p) => Math.log10(p[1]));
    const n = xs.length;
    const d = new Array(n - 1);            // pentes des sécantes
    for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
    const m = new Array(n);                // tangentes aux nœuds
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      m[i] = (d[i - 1] * d[i] <= 0) ? 0 : (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return { xs, ys, m };
  }
  function interpLogLog(anchors, x) {
    if (x <= anchors[0][0]) return anchors[0][1];
    const last = anchors.length - 1;
    if (x >= anchors[last][0]) {
      // extrapolation linéaire en log-log (au-delà du dernier point d'essai)
      const a = anchors[last - 1], b = anchors[last];
      const f = (Math.log10(x) - Math.log10(a[0])) / (Math.log10(b[0]) - Math.log10(a[0]));
      return Math.pow(10, Math.log10(a[1]) + f * (Math.log10(b[1]) - Math.log10(a[1])));
    }
    let sp = _splineCache.get(anchors);
    if (!sp) { sp = buildSpline(anchors); _splineCache.set(anchors, sp); }
    const { xs, ys, m } = sp;
    const lx = Math.log10(x);
    let i = 0;
    while (i < xs.length - 1 && lx > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (lx - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    // base de Hermite
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    const ly = h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
    return Math.pow(10, ly);
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
      thermal.push({ i: m * inA, t: Math.min(interpLogLog(anchors, m), Y_DATA_CAP * 5) });
    }
    thermal.push({ i: magMult * inA, t: Math.min(interpLogLog(anchors, magMult), Y_DATA_CAP * 5) });
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
      pts.push({ i: m * inA, t: Math.min(Math.max(t, T_INST_FAST / 2), Y_DATA_CAP * 5) });
      if (t < T_INST_FAST / 2) break;
    }
    return pts;
  }

  /** Bande de coupure [tf, ts] d'une protection au courant I (disjoncteur OU fusible). */
  function deviceTripBand(p, I) {
    if (isNormMccbB(p)) return mfgTripTimeAt(enrichNormMccb(p), I);
    if (isMfgMccb(p) || (isMfgMcb(p) && p.longAnchors)) return mfgTripTimeAt(p, I);
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
    const i0 = (isMfgMccb(p) || isNormMccbB(p)) ? mfgThresholds(enrichNormMccb(p)).irA * 1.05 : p.in * 1.05;
    for (let I = i0; I <= X_MAX; I *= 1.02) {
      const tf = deviceTripBand(p, I).tf;
      if (isFinite(tf) && tf <= targetT) return prev || I;
      prev = I;
    }
    return X_MAX;
  }

  /** Limite de sélectivité Is (A) pour profil constructeur : seuil court retard ou instantané. */
  function mfgSelectivityLimitA(p) {
    const th = mfgThresholds(p);
    if (p.hasShortTime) return Math.round(th.isdA);
    if (p.ii != null && p.ii > 0) return Math.round(th.iiA);
    return Math.round(th.irA * 6);
  }

  function mfgEffectiveIn(p) {
    if (isMfgMccb(p) || isMccb(p)) return (p.fixedIr ? 1 : (p.ir || 1)) * p.in;
    return p.in;
  }

  function mfgMagLimitA(p) {
    if (isMfgMcb(p) && p.magMult) return Math.round(p.magMult[0] * p.in);
    if (isMfgMccb(p) || isNormMccbB(p)) return mfgSelectivityLimitA(enrichNormMccb(p));
    return Math.round((CURVES[p.curve] || CURVES.C).mag[0] * p.in);
  }

  /** Temps de déclenchement rapide (borne basse) au courant I. */
  function tripTimeFastAt(p, I) {
    const b = deviceTripBand(p, I);
    return isFinite(b.tf) ? b.tf : Infinity;
  }

  // --- Rendu canvas ---------------------------------------------------------
  function lerpLog(v, vmin, vmax) {
    return (Math.log10(v) - Math.log10(vmin)) / (Math.log10(vmax) - Math.log10(vmin));
  }

  function snapYMax(t) {
    for (let i = 0; i < Y_AXIS_TICKS.length; i++) {
      if (Y_AXIS_TICKS[i] >= t) return Y_AXIS_TICKS[i];
    }
    return Y_AXIS_MAX_CAP;
  }

  /** Axe temps : bas = plancher magnétique (~10 ms), haut = temps max utile des courbes affichées. */
  function computePlotYRange() {
    let yHi = 60;
    let yLo = T_INST_FAST;
    const sampleI = (k, n) => Math.pow(
      10,
      Math.log10(X_MIN) + (k / n) * (Math.log10(X_MAX) - Math.log10(X_MIN)),
    );
    state.forEach((p) => {
      if ((isMfgMccb(p) || isNormMccbB(p)) && p.hasShortTime && p.tsd > 0) {
        yLo = Math.min(yLo, p.tsd * MFG_TOL_FAST);
      }
      for (let k = 0; k <= 48; k++) {
        const I = sampleI(k, 48);
        const b = deviceTripBand(p, I);
        if (isFinite(b.ts)) yHi = Math.max(yHi, b.ts);
        if (isFinite(b.tf)) yHi = Math.max(yHi, b.tf);
        if (isFinite(b.tf)) yLo = Math.min(yLo, b.tf);
      }
    });
    yLo = Math.max(Y_AXIS_MIN, yLo);
    const cable = getCable();
    if (cable) {
      for (let k = 0; k <= 24; k++) {
        const I = sampleI(k, 24);
        yHi = Math.max(yHi, cableTime(cable, I));
      }
    }
    yHi = snapYMax(yHi * 1.15);
    yHi = Math.min(yHi, Y_AXIS_MAX_CAP);
    yHi = Math.max(yHi, 1);
    return { yLo, yHi };
  }

  function zoneLineColors() {
    const th = activeDrawTheme;
    return {
      thermal: th.zoneThermal.border,
      short: th.zoneShort.border,
      mag: th.zoneMag.border,
    };
  }

  function prepCurveStroke(ctx) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
  }

  function strokePts(ctx, pts, color, width, startNew) {
    if (!pts.length) return;
    prepCurveStroke(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    smoothSubPath(ctx, pts, startNew);
    ctx.stroke();
  }

  function strokeSeg(ctx, x1, y1, x2, y2, color, width, dash) {
    prepCurveStroke(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Courbe dont les seuils Ir/Isd/Ii sont affichés sur le graphe (une seule à la fois). */
  function labelCurveIndex() {
    if (editIndex >= 0 && state[editIndex]) return editIndex;
    if (state.length === 1) return 0;
    const avalIdx = state.findIndex((p) => p.role === 'aval' && (isMfgMccb(p) || isNormMccbB(p)));
    if (avalIdx >= 0) return avalIdx;
    return state.findIndex((p) => isMfgMccb(p) || isNormMccbB(p));
  }

  /** Pastilles en tête : au plus 2 si plusieurs courbes (amont/aval ou courbe en édition). */
  function shouldDrawTopLabel(p) {
    if (state.length <= 2) return true;
    if (editIndex >= 0) return state[editIndex] === p;
    return p.role === 'amont' || p.role === 'aval';
  }

  /** Libellé court sur le graphe (évite les textes longs qui se chevauchent). */
  function shortCanvasLabel(p) {
    const role = p.role === 'amont' ? ' ↑' : p.role === 'aval' ? ' ↓' : '';
    const compact = state.length > 2;
    if (isMfg(p)) {
      const irA = Math.round(mfgEffectiveIn(p));
      if (compact) return `${irA}A${role}`;
      const ref = String(p.deviceLabel || 'NSX').replace(/\s+/g, ' ');
      return `${ref} ${irA}A${role}`;
    }
    if (isMccb(p)) {
      const irA = Math.round((p.ir || 1) * p.in);
      if (compact) return `${irA}A${role}`;
      const cat = p.mccbCat === 'B' ? '·B' : '·A';
      return `MCCB${cat} ${irA}A${role}`;
    }
    if (isFuse(p)) return compact ? `${p.in}A${role}` : `${deviceTag(p)} ${p.in}A${role}`;
    return compact ? `${p.in}A${role}` : `${deviceTag(p)} ${p.in}A${role}`;
  }

  /** Pastille texte (fond lisible sur la courbe). */
  function drawLabelPill(ctx, text, cx, cy, color, th, align) {
    const font = 'bold 8px system-ui,sans-serif';
    ctx.font = font;
    const padX = 4;
    const h = 11;
    const w = ctx.measureText(text).width + padX * 2;
    let x = cx;
    if (align === 'right') x = cx - w;
    else if (align === 'center') x = cx - w / 2;
    const y = cy - h / 2;
    ctx.fillStyle = th.badgeBg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.75;
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, cy);
  }

  /** Étiquettes en tête de courbe : pastille + empilement si les In sont proches. */
  function drawCurveTopLabels(ctx, sx, padL, padT, plotW) {
    const visible = state.filter(shouldDrawTopLabel);
    if (!visible.length) return;
    const th = activeDrawTheme;
    const topY = padT + 2;
    const font = 'bold 9px system-ui,sans-serif';
    const rowH = 14;
    const maxRows = 3;
    const padEdge = 8;
    const minGap = 10;

    ctx.font = font;
    const items = visible.map((p) => {
      const anchorI = (isMfgMccb(p) || isMccb(p)) ? mfgEffectiveIn(enrichNormMccb(p)) : p.in;
      const text = shortCanvasLabel(p);
      const w = ctx.measureText(text).width + 12;
      return { p, text, anchorX: sx(anchorI), w };
    }).sort((a, b) => a.anchorX - b.anchorX);

    const placed = [];
    items.forEach((it) => {
      let row = 0;
      for (; row < maxRows; row++) {
        const conflict = placed.some(
          (o) => o.row === row && Math.abs(it.anchorX - o.anchorX) < (it.w + o.w) / 2 + minGap,
        );
        if (!conflict) break;
      }
      row = Math.min(row, maxRows - 1);
      const half = it.w / 2;
      let x = it.anchorX;
      if (x - half < padL + padEdge) x = padL + padEdge + half;
      if (x + half > padL + plotW - padEdge) x = padL + plotW - padEdge - half;
      const y = topY + 6 + row * rowH;
      placed.push({ ...it, x, y, row });
    });

    placed.forEach((it) => {
      const half = it.w / 2;
      const h = 12;
      ctx.fillStyle = th.badgeBg;
      ctx.strokeStyle = it.p.color;
      ctx.lineWidth = 1;
      roundRect(ctx, it.x - half, it.y - h / 2, it.w, h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = it.p.color;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, it.x, it.y);
      if (it.row > 0) {
        ctx.strokeStyle = hexA(it.p.color, 0.45);
        ctx.lineWidth = 0.75;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(it.anchorX, topY + 4);
        ctx.lineTo(it.x, it.y - h / 2 - 1);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    ctx.textBaseline = 'middle';
  }

  /** Légende zones — petite pastille (traits colorés, pas de carrés sur le graphe). */
  function drawTripZoneLegend(ctx, padL, padT) {
    if (!state.length) return;
    const th = activeDrawTheme;
    const showShort = state.some((p) => (isMfgMccb(p) || isNormMccbB(p)) && p.hasShortTime);
    const sample = th.legendTitle;
    const items = [
      { label: tr('tcZoneThermal'), color: sample, dash: [] },
      { label: tr('tcZoneMagnetic'), color: sample, dash: [] },
    ];
    if (showShort) items.splice(1, 0, { label: tr('tcZoneShortTime'), color: sample, dash: [5, 3] });

    const padX = 5;
    const padY = 3;
    const rowH = 10;
    const noteH = 11;
    const lineW = 12;
    const gap = 4;
    const title = tr('tcZoneLegend');
    const fontItem = '8px system-ui,sans-serif';
    const fontTitle = 'bold 8px system-ui,sans-serif';
    const note = tr('tcZoneColorNote');

    ctx.font = fontTitle;
    let rowW = ctx.measureText(title).width;
    ctx.font = fontItem;
    items.forEach((it) => {
      rowW = Math.max(rowW, lineW + gap + ctx.measureText(it.label).width);
    });
    ctx.font = '9px system-ui,sans-serif';
    rowW = Math.max(rowW, ctx.measureText(note).width);
    const boxW = rowW + padX * 2;
    const boxH = padY * 2 + rowH + items.length * rowH + noteH;
    const plotW = geom ? geom.plotW : 0;
    const bx = padL + Math.max(6, plotW - boxW - 6);
    const by = padT + 6;

    ctx.fillStyle = th.legendBg;
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 0.75;
    roundRect(ctx, bx, by, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = th.legendTitle;
    ctx.font = fontTitle;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, bx + padX, by + padY);

    items.forEach((it, i) => {
      const ly = by + padY + rowH + i * rowH;
      const midY = ly + rowH * 0.55;
      strokeSeg(ctx, bx + padX, midY, bx + padX + lineW, midY, it.color, 2, it.dash);
      ctx.fillStyle = th.legendTitle;
      ctx.font = fontItem;
      ctx.fillText(it.label, bx + padX + lineW + gap, ly + 1);
    });
    ctx.font = '9px system-ui,sans-serif';
    ctx.fillStyle = th.axisTitle;
    ctx.fillText(note, bx + padX, by + padY + rowH + items.length * rowH + 1);
  }

  /** Disjoncteur norme / MCB catalogue — lignes colorées par zone physique. */
  function drawNormBreakerZoned(ctx, p, sx, sy) {
    const c = p.color;
    const curveP = isMfgMcb(p) ? { in: p.in, curve: p.curve || 'C', dev: 'mcb' } : p;
    const d = curveData(curveP);
    const slowTh = d.slow.thermal.map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
    const fastTh = d.fast.thermal.map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
    const sMagX = sx(d.slow.magI);
    const fMagX = sx(d.fast.magI);
    const sInstY = sy(d.slow.tInst);
    const fInstY = sy(d.fast.tInst);
    const xEnd = sx(X_MAX);
    const slowEnd = slowTh[slowTh.length - 1];
    const fastEnd = fastTh[fastTh.length - 1];

    ctx.beginPath();
    smoothSubPath(ctx, slowTh, true);
    ctx.lineTo(sMagX, sInstY);
    ctx.lineTo(xEnd, sInstY);
    ctx.lineTo(xEnd, fInstY);
    ctx.lineTo(fMagX, fInstY);
    if (fastEnd) ctx.lineTo(fMagX, fastEnd.y);
    smoothSubPath(ctx, fastTh.slice().reverse(), false);
    ctx.closePath();
    ctx.fillStyle = hexA(p.color, 0.06);
    ctx.fill();

    strokePts(ctx, slowTh, c, 2.2, true);
    if (slowEnd) {
      strokeSeg(ctx, slowEnd.x, slowEnd.y, sMagX, sInstY, c, 2.4);
      strokeSeg(ctx, sMagX, sInstY, xEnd, sInstY, c, 2.4);
    }
    strokePts(ctx, fastTh, c, 1.5, true);
    if (fastEnd) {
      strokeSeg(ctx, fastEnd.x, fastEnd.y, fMagX, fInstY, c, 1.6);
      strokeSeg(ctx, fMagX, fInstY, xEnd, fInstY, c, 1.6);
    }

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(c, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(p.in), sy(plotYLo));
    ctx.lineTo(sx(p.in), sy(plotYHi));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw(canvas, opts) {
    if (!canvas) return;
    activeDrawTheme = opts?.export ? DRAW_THEME.export : DRAW_THEME.screen;
    const th = activeDrawTheme;
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

    const yRange = computePlotYRange();
    plotYLo = yRange.yLo;
    plotYHi = yRange.yHi;

    const sx = (i) => padL + lerpLog(i, X_MIN, X_MAX) * plotW;
    const sy = (t) => {
      const tc = Math.max(plotYLo, Math.min(plotYHi, t));
      return padT + (1 - lerpLog(tc, plotYLo, plotYHi)) * plotH;
    };
    geom = { padL, padT, plotW, plotH, plotYLo, plotYHi };

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);

    // Teinte de fond selon la sélectivité (très légère, derrière la grille)
    const tint = th.selTint[selStatus];
    if (tint) {
      ctx.fillStyle = tint;
      ctx.fillRect(padL, padT, plotW, plotH);
    }

    // Grille
    ctx.lineWidth = 1;
    ctx.font = '10px system-ui,sans-serif';
    ctx.textBaseline = 'middle';
    drawGridX(ctx, sx, padT, plotH, plotW);
    drawGridY(ctx, sy, padL, plotW, plotYLo, plotYHi);

    // Axes labels
    ctx.fillStyle = th.axisTitle;
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
      ctx.strokeStyle = th.iccLine;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx(iccA), sy(plotYLo));
      ctx.lineTo(sx(iccA), sy(plotYHi));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = th.iccText;
      ctx.textAlign = 'left';
      ctx.font = '11px system-ui,sans-serif';
      ctx.fillText(tr('tcIccLine') + ' ' + fmtCurrent(Math.round(iccA)) + ' A', sx(iccA) + 4, sy(plotYLo) - 6);
    }

    // Courbes (écrêtées au cadre pour des tracés nets, sans débordement)
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();
    state.forEach((p) => {
      if (isFuse(p)) { drawFuse(ctx, p, sx, sy); return; }
      if (isMfgMccb(p)) { drawManufacturer(ctx, p, sx, sy); return; }
      if (isNormMccbB(p)) { drawManufacturer(ctx, enrichNormMccb(p), sx, sy); return; }
      if (isMfgMcb(p) && p.longAnchors) { drawMfgMcb(ctx, p, sx, sy); return; }
      drawNormBreakerZoned(ctx, p, sx, sy);
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
        if (t > plotYHi * 1.2 || t < plotYLo / 1.2) { started = false; continue; }
        const X = padL + px, Y = sy(t);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // étiquette de la courbe câble (au point t ≈ 1 s)
      const Ilbl = cable.k * cable.S;  // I tel que t = 1 s
      if (Ilbl >= X_MIN && Ilbl <= X_MAX && state.length <= 2) {
        ctx.fillStyle = '#e879f9';
        ctx.font = 'bold 9px system-ui,sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${tr('tcCableLine')} ${cable.S} mm²`, sx(Ilbl) + 4, sy(1) - 3);
        ctx.textBaseline = 'middle';
      }
    }
    ctx.restore();

    drawTripZoneLegend(ctx, padL, padT);
    drawCurveTopLabels(ctx, sx, padL, padT, plotW);

    // Cadre
    ctx.strokeStyle = th.frame;
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Badge sélectivité — coin bas-gauche du graphe, compact
    if (selStatus && SEL_ACCENT[selStatus]) {
      const accent = SEL_ACCENT[selStatus];
      const txt = selStatus === 'total' ? tr('tcBadgeTotal')
        : selStatus === 'partial' ? tr('tcBadgePartial') : tr('tcBadgeNone');
      ctx.font = '9px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const padX = 6;
      const dotR = 3;
      const gap = 5;
      const bw = padX * 2 + dotR * 2 + gap + ctx.measureText(txt).width;
      const bh = 16;
      const bx = padL + 8;
      const by = padT + plotH - bh - 8;
      ctx.fillStyle = th.badgeBg;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(bx + padX + dotR, by + bh / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th.badgeText;
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
    const { plotYLo: yLo, plotYHi: yHi } = geom;
    return Math.pow(10, Math.log10(yLo) + f * (Math.log10(yHi) - Math.log10(yLo)));
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
    const th = activeDrawTheme;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = th.pointerCross;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH);
    ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.setLineDash([]);
    // point
    ctx.fillStyle = th.pointerText;
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
      else if (ts > geom.plotYHi) verdict = '> ' + fmtTexact(geom.plotYHi);
      else if (Math.abs(tf - ts) / ts < 0.02) verdict = fmtTexact(ts); // bornes confondues
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

    ctx.fillStyle = th.pointerBubbleBg;
    ctx.strokeStyle = th.pointerBubbleStroke;
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = th.pointerText;
    ctx.font = 'bold 11px system-ui,sans-serif';
    ctx.fillText(header, bx + 9, by + 13);
    ctx.font = '11px system-ui,sans-serif';
    lines.forEach((l, i) => {
      const ly = by + 13 + (i + 1) * rowH;
      ctx.fillStyle = l.color;
      ctx.beginPath(); ctx.arc(bx + 13, ly, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = l.trips ? th.pointerText : th.pointerMuted;
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
    if (s < 0.01) return (s * 1000).toFixed(s < 0.001 ? 2 : 1).replace(/\.?0+$/, '') + ' ms';
    if (s < 1) return Math.round(s * 1000) + ' ms';
    if (s < 60) return (Number.isInteger(s) ? s : s.toFixed(1)) + ' s';
    if (s < 3600) return (s / 60) + ' min';
    return (s / 3600) + ' h';
  }

  function drawGridX(ctx, sx, padT, plotH, plotW) {
    const th = activeDrawTheme;
    // multiples étiquetés par décade : graduations riches façon courbe constructeur
    const labelMults = [1, 2, 3, 4, 5, 6, 8];
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'center';
    // 1) tracer toutes les lignes de grille
    for (let dec = 0; dec <= 4; dec++) {
      const base = Math.pow(10, dec);
      for (let m = 1; m < 10; m++) {
        const v = base * m;
        if (v < X_MIN || v > X_MAX) continue;
        const X = sx(v);
        const labeled = labelMults.includes(m);
        ctx.strokeStyle = m === 1 ? th.gridDecade
          : labeled ? th.gridLabeled : th.gridMinor;
        ctx.beginPath();
        ctx.moveTo(X, padT);
        ctx.lineTo(X, padT + plotH);
        ctx.stroke();
      }
    }
    // 2) étiquettes avec espacement minimal pour éviter le chevauchement (mobile)
    const candidates = [];
    for (let dec = 0; dec <= 4; dec++) {
      const base = Math.pow(10, dec);
      for (const m of labelMults) {
        const v = base * m;
        if (v < X_MIN || v > X_MAX) continue;
        candidates.push({ v, m, X: sx(v) });
      }
    }
    let lastRight = -Infinity;
    for (const c of candidates) {
      const txt = fmtCurrent(c.v);
      const halfW = ctx.measureText(txt).width / 2;
      // marge mini de 6px entre deux libellés ; on garde toujours les débuts de décade (m===1)
      if (c.X - halfW < lastRight + 6 && c.m !== 1) continue;
      if (c.X - halfW < lastRight + 6 && c.m === 1) {
        // décade prioritaire : on l'affiche quand même mais on évite le doublon trop proche
        if (c.X - halfW < lastRight + 2) continue;
      }
      ctx.fillStyle = c.m === 1 ? th.axisXMajor : th.axisXMinor;
      ctx.fillText(txt, c.X, padT + plotH + 12);
      lastRight = c.X + halfW;
    }
  }

  // Paliers de temps étiquetés : de 1 ms à 10 h
  const TIME_LABELS = [
    0.001, 0.005, 0.01, 0.05, 0.1, 0.5,
    1, 2, 5, 10, 30, 60, 120, 300, 600, 1800, 3600, 7200, 18000, 36000,
  ];

  function drawGridY(ctx, sy, padL, plotW, yLo, yHi) {
    const th = activeDrawTheme;
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'right';
    const decMin = Math.floor(Math.log10(yLo));
    const decMax = Math.ceil(Math.log10(yHi));
    // lignes mineures (log) discrètes
    for (let dec = decMin; dec <= decMax; dec++) {
      const base = Math.pow(10, dec);
      for (let m = 1; m < 10; m++) {
        const v = base * m;
        if (v < yLo || v > yHi) continue;
        ctx.strokeStyle = m === 1 ? th.gridTimeDec : th.gridMinor;
        ctx.beginPath();
        ctx.moveTo(padL, sy(v));
        ctx.lineTo(padL + plotW, sy(v));
        ctx.stroke();
      }
    }
    // lignes + libellés sur les paliers ronds
    TIME_LABELS.forEach((v) => {
      if (v < yLo || v > yHi) return;
      const Y = sy(v);
      ctx.strokeStyle = th.gridTime;
      ctx.beginPath();
      ctx.moveTo(padL, Y);
      ctx.lineTo(padL + plotW, Y);
      ctx.stroke();
      ctx.fillStyle = th.axisY;
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

  /** MCB constructeur — thermique IEC 60898 + bande magnétique B/C/D/K/Z. */
  function drawMfgMcb(ctx, p, sx, sy) {
    const c = p.color;
    const mag = p.magMult || (CURVES[p.curve] || CURVES.C).mag;
    const anchors = p.longAnchors || THERMAL_SLOW;
    const inA = p.in;
    const slowPts = [];
    const fastPts = [];
    for (let m = 1.13; m < mag[0] * 0.98; m *= 1.06) {
      const tS = interpLogLog(anchors, m);
      const tF = tS * 0.35;
      slowPts.push({ x: sx(m * inA), y: sy(Math.min(tS * MFG_TOL_SLOW, plotYHi)) });
      fastPts.push({ x: sx(m * inA), y: sy(Math.min(tF * MFG_TOL_FAST, plotYHi)) });
    }
    const sMagX = sx(mag[0] * inA);
    const fMagX = sx(mag[1] * inA);
    const instY = sy(p.instTS || T_INST_SLOW);
    const xEnd = sx(X_MAX);
    if (!slowPts.length) return;
    const slowEnd = slowPts[slowPts.length - 1];
    const fastEnd = fastPts[fastPts.length - 1];

    ctx.beginPath();
    smoothSubPath(ctx, slowPts, true);
    ctx.lineTo(sMagX, slowEnd.y);
    ctx.lineTo(fMagX, instY);
    ctx.lineTo(xEnd, instY);
    if (fastEnd) ctx.lineTo(fMagX, fastEnd.y);
    smoothSubPath(ctx, fastPts.slice().reverse(), false);
    ctx.closePath();
    ctx.fillStyle = hexA(p.color, 0.06);
    ctx.fill();

    strokePts(ctx, slowPts, c, 2.2, true);
    strokeSeg(ctx, slowEnd.x, slowEnd.y, fMagX, instY, c, 2.4);
    strokeSeg(ctx, fMagX, instY, xEnd, instY, c, 2.4);
    strokePts(ctx, fastPts, c, 1.5, true);
    if (fastEnd) strokeSeg(ctx, fastEnd.x, fastEnd.y, fMagX, instY, c, 1.6);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(c, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(inA), sy(plotYLo));
    ctx.lineTo(sx(inA), sy(plotYHi));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Tracé MCCB constructeur (long / court Tsd / instantané Ii). */
  function drawManufacturer(ctx, p, sx, sy) {
    const d = curveDataManufacturer(p);
    const slowPts = d.long.map((pt) => ({ x: sx(pt.i), y: sy(pt.t * MFG_TOL_SLOW) }));
    const fastPts = d.long.map((pt) => ({ x: sx(pt.i), y: sy(pt.t * MFG_TOL_FAST) }));
    const xEnd = sx(X_MAX);

    let sMagX = sx(d.shortI);
    let sInstY = sy(d.tsd * MFG_TOL_SLOW);
    let fInstY = sy(d.tsd * MFG_TOL_FAST);
    const instX = sx(d.instI);
    const instY = sy(d.instTS);

    if (!d.hasShortTime) {
      sMagX = instX;
      sInstY = instY;
      fInstY = instY;
    }

    const c = p.color;
    const shortDash = [5, 3];
    const slowEnd = slowPts[slowPts.length - 1];

    ctx.beginPath();
    smoothSubPath(ctx, slowPts, true);
    if (d.hasShortTime) {
      ctx.lineTo(sMagX, sInstY);
      ctx.lineTo(instX, sInstY);
    }
    ctx.lineTo(instX, instY);
    ctx.lineTo(xEnd, instY);
    ctx.lineTo(xEnd, fInstY);
    if (d.hasShortTime) ctx.lineTo(instX, fInstY);
    ctx.lineTo(fastPts.length ? fastPts[fastPts.length - 1].x : sx(d.irA), fInstY);
    smoothSubPath(ctx, fastPts.slice().reverse(), false);
    ctx.closePath();
    ctx.fillStyle = hexA(c, 0.06);
    ctx.fill();

    strokePts(ctx, slowPts, c, 2.2, true);
    if (d.hasShortTime && slowEnd) {
      strokeSeg(ctx, slowEnd.x, slowEnd.y, sMagX, sInstY, c, 2.2, shortDash);
      strokeSeg(ctx, sMagX, sInstY, instX, sInstY, c, 2.2, shortDash);
    } else if (slowEnd) {
      strokeSeg(ctx, slowEnd.x, slowEnd.y, instX, instY, c, 2.4);
    }
    strokeSeg(ctx, instX, instY, xEnd, instY, c, 2.4);
    strokePts(ctx, fastPts, c, 1.5, true);
    if (d.hasShortTime) {
      const fastEnd = fastPts[fastPts.length - 1];
      if (fastEnd) strokeSeg(ctx, fastEnd.x, fastEnd.y, sMagX, fInstY, c, 1.6, shortDash);
    }
    strokeSeg(ctx, instX, fInstY, xEnd, fInstY, c, 1.6);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(c, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(p.in), sy(plotYLo));
    ctx.lineTo(sx(p.in), sy(plotYHi));
    ctx.stroke();
    ctx.setLineDash([]);

    drawThresholdLabels(ctx, p, sx, sy, d);
  }

  /** Seuils Ir / Isd / Ii — colonne marge droite, une seule courbe à la fois. */
  function drawThresholdLabels(ctx, p, sx, sy, d) {
    const idx = labelCurveIndex();
    if (idx < 0 || state[idx] !== p || !d.hasShortTime || !geom) return;
    const th = activeDrawTheme;
    const { padL, padT, plotW, plotH } = geom;
    const c = p.color;
    const marginX = padL + plotW - 5;
    const lines = [
      `Ir ${fmtIexact(d.irA)}`,
      `Isd ${fmtIexact(d.shortI)} · ${fmtTime(d.tsd)}`,
      `Ii ${fmtIexact(d.instI)}`,
    ];
    let y = padT + 58;
    const step = 14;
    lines.forEach((text) => {
      drawLabelPill(ctx, text, marginX, y, c, th, 'right');
      y += step;
    });
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

    const c = p.color;
    strokePts(ctx, slow, c, 2.2, true);
    strokePts(ctx, fast, c, 1.5, true);

    // ligne verticale In
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(c, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(p.in), sy(plotYLo));
    ctx.lineTo(sx(p.in), sy(plotYHi));
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
  function getProIccFormOpts() {
    return {
      icc1Ka: document.getElementById('tc-ik1')?.value?.trim() || '',
      earthing: document.getElementById('tc-icc-earth')?.value || 'TN',
      transfoKva: document.getElementById('tc-icc-kva')?.value,
      transfoUcc: document.getElementById('tc-icc-ucc')?.value || '4',
      upstreamPcc: document.getElementById('tc-icc-pcc')?.value || '500',
      length: document.getElementById('tc-icc-l')?.value,
      section: document.getElementById('tc-icc-s')?.value,
      voltage: document.getElementById('tc-icc-u')?.value || '400',
      conductorType: document.getElementById('tc-icc-conductor')?.value || 'Cu',
      lang: lang(),
    };
  }

  let proIccForceCalc = false;
  let lastProIccResult = null;

  const ICC_GRAPH_SRC_LABEL = {
    ik3max: 'tcIccSrcIk3Max',
    ik3min: 'tcIccSrcIk3Min',
    ik2max: 'tcIccSrcIk2Max',
    ik2min: 'tcIccSrcIk2Min',
    ik1max: 'tcIccSrcIk1Max',
    ik1min: 'tcIccSrcIk1Min',
  };

  function proIccCanCalc() {
    const L = parseFloat(document.getElementById('tc-icc-l')?.value || '');
    const S = parseFloat(document.getElementById('tc-icc-s')?.value || '');
    const Sn = parseFloat(document.getElementById('tc-icc-kva')?.value || '');
    return Number.isFinite(L) && L > 0 && Number.isFinite(S) && S > 0 && Number.isFinite(Sn) && Sn > 0;
  }

  function runProIccCalc() {
    const extra = g.ElectroDzCalcExtra;
    if (!extra?.calculateProIccFaults) return null;
    const r = extra.calculateProIccFaults(getProIccFormOpts());
    lastProIccResult = r.ok ? r : null;
    renderProIccResults(r);
    return r;
  }

  function renderProIccResults(r) {
    const box = document.getElementById('tc-pro-icc-results');
    if (!box) return;
    if (!r?.ok) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const fmt = (ka) => (Number.isFinite(ka) ? ka.toFixed(2) : '—');
    box.innerHTML = `
      <h4>${escapeAttr(tr('tcProIccTableTitle'))}</h4>
      <table class="tc-pro-icc-table">
        <thead><tr>
          <th>${escapeAttr(tr('tcProIccColType'))}</th>
          <th>${escapeAttr(tr('tcProIccColMax'))}</th>
          <th>${escapeAttr(tr('tcProIccColMin'))}</th>
        </tr></thead>
        <tbody>
          <tr><td>${escapeAttr(tr('tcProIccRowIk3'))}</td><td>${fmt(r.max?.ik3Ka)}</td><td>${fmt(r.min?.ik3Ka)}</td></tr>
          <tr><td>${escapeAttr(tr('tcProIccRowIk2'))}</td><td>${fmt(r.max?.ik2Ka)}</td><td>${fmt(r.min?.ik2Ka)}</td></tr>
          <tr><td>${escapeAttr(tr('tcProIccRowIk1'))}</td><td>${fmt(r.max?.ik1Ka)}</td><td>${fmt(r.min?.ik1Ka)}</td></tr>
        </tbody>
      </table>`;
    box.hidden = false;
  }

  function proIccAmpFromResult(r, sourceKey) {
    if (!r?.ok) return null;
    const key = sourceKey || document.getElementById('tc-icc-graph-source')?.value || 'ik3max';
    const map = {
      ik3max: r.ik3MaxA,
      ik3min: r.ik3MinA,
      ik2max: r.ik2MaxA,
      ik2min: r.ik2MinA,
      ik1max: r.ik1MaxA,
      ik1min: r.ik1MinA,
    };
    const a = map[key];
    return Number.isFinite(a) && a > 0 ? a : null;
  }

  /** Lignes Ik max/min (IEC 60909) pour le panneau mode pro. */
  function analyzeProIccLines(force) {
    const extra = g.ElectroDzCalcExtra;
    if (!extra?.calculateProIccFaults) return [];
    if (!force && !proIccForceCalc && !lastProIccResult && !proIccCanCalc()) return [];
    const r = lastProIccResult && !force && !proIccForceCalc
      ? lastProIccResult
      : extra.calculateProIccFaults(getProIccFormOpts());
    if (!r.ok) {
      lastProIccResult = null;
      renderProIccResults(null);
      return [{ cls: 'bad', html: r.message || tr('iccAlertInvalidValues') }];
    }
    lastProIccResult = r;
    if (force || proIccForceCalc) renderProIccResults(r);
    const out = (r.lines || []).map((html) => ({ cls: 'info', html }));
    if (r.mismatch) out.push({ cls: 'bad', html: tr('iccIk1Mismatch') });
    return out;
  }

  function applyProIkToIcc() {
    let r = lastProIccResult;
    if (!r?.ok) r = runProIccCalc();
    if (!r?.ok) return false;
    const src = document.getElementById('tc-icc-graph-source')?.value || 'ik3max';
    const amp = proIccAmpFromResult(r, src);
    if (!amp) return false;
    const iccEl = document.getElementById('tc-icc');
    if (!iccEl) return false;
    iccEl.value = String(Math.round(amp));
    const hint = document.getElementById('tc-settings-live');
    if (hint) {
      const lblKey = ICC_GRAPH_SRC_LABEL[src] || 'tcIccSrcIk3Max';
      hint.hidden = false;
      hint.textContent = trTpl('tcProIccApplied', { icc: Math.round(amp), label: tr(lblKey) });
    }
    return true;
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

    const Is = mfgMagLimitA(up);
    const upEff = mfgEffectiveIn(up);
    const downEff = mfgEffectiveIn(down);
    const ratio = downEff > 0 ? upEff / downEff : up.in / down.in;
    const iccA = getIccA();

    let cls = 'partial';
    let html = '';

    if (ratio < 1.6) {
      cls = 'warn';
      html = trTpl('tcVerdictRatio', {
        up: Math.round(upEff),
        down: Math.round(downEff),
        ratio: ratio.toFixed(2),
      });
    } else if (iccA) {
      const tUp = tripTimeFastAt(up, iccA);
      const tDown = tripTimeFastAt(down, iccA);
      const downTrips = isFinite(tDown) && tDown < 30;
      const upTrips = isFinite(tUp) && tUp < 30;
      if (iccA <= Is) {
        cls = 'total';
        html = trTpl('tcVerdictTotalSite', { is: Is, icc: Math.round(iccA) });
      } else if (downTrips && (!upTrips || tDown < tUp * 0.5)) {
        cls = 'total';
        html = trTpl('tcVerdictTotalTime', {
          icc: Math.round(iccA),
          tDown: tDown < 0.01 ? '<10 ms' : tDown.toFixed(3) + ' s',
          tUp: upTrips ? (tUp < 0.01 ? '<10 ms' : tUp.toFixed(3) + ' s') : '—',
        });
      } else {
        cls = 'partial';
        html = trTpl('tcVerdictPartialSite', { is: Is, icc: Math.round(iccA) });
        if (downTrips && upTrips) {
          html += `<small>${trTpl('tcVerdictBothTrip', { tDown: tDown.toFixed(3), tUp: tUp.toFixed(3) })}</small>`;
        }
      }
      html += `<small>${tr('tcIccPoint')}</small>`;
      if (isMfgMccb(up) && up.hasShortTime) {
        html += `<small>${trTpl('tcVerdictMfgDetail', {
          isd: Math.round((up.isd || 2) * (up.ir || 1) * up.in),
          tsd: up.tsd,
        })}</small>`;
      }
    } else {
      cls = 'partial';
      html = isMfg(up) || isMfg(down)
        ? trTpl('tcVerdictLimitMfg', { is: Is })
        : trTpl('tcVerdictLimitOnly', { is: Is });
    }

    box.className = 'tc-verdict show ' + cls;
    box.innerHTML = html;
    selStatus = cls;
  }

  function fmtOhmBrief(x) {
    if (x == null || !Number.isFinite(x)) return '—';
    if (x < 0.001) return `${(x * 1000).toFixed(1)} mΩ`;
    return `${x.toFixed(3)} Ω`;
  }

  function fmtABrief(x) {
    if (x == null || !Number.isFinite(x)) return '—';
    if (x >= 1000) return `${(x / 1000).toFixed(2)} kA`;
    return `${Math.round(x)} A`;
  }

  /** Outils pro : boucle Zs (Rac 90 °C), Icu, tenue câble — logique type Caneco. */
  function analyzePro() {
    const box = document.getElementById('tc-pro-result');
    if (!box || !proOpen()) { if (box) box.innerHTML = ''; return; }
    const lines = analyzeProIccLines(false);
    const cable = getCable();
    const ze = parseFloat(document.getElementById('tc-ze')?.value || '');
    const lengthM = parseFloat(document.getElementById('tc-length')?.value || '');
    const BT = g.ElectroDzCanecoBT;

    const canecoBtOn = g.ElectroDzCalcFlags?.enableCanecoBt === true;
    if (canecoBtOn && BT && cable && Number.isFinite(ze) && ze >= 0 && Number.isFinite(lengthM) && lengthM > 0) {
      const loop = BT.loopStudy({
        zeOhm: ze,
        lengthM,
        sectionMm2: cable.S,
        sectionPeMm2: cable.S,
        material: cable.mat,
        insulation: cable.ins,
        u0Volts: document.getElementById('tc-u0')?.value || 230,
        earthing: document.getElementById('tc-earth')?.value || 'TN',
      });
      if (loop.zsOhm != null) {
        lines.push({
          cls: 'info',
          html: `${tr('canecoProTitle')} — ${tr('canecoLineRac').replace('{r}', fmtOhmBrief(loop.racOhm))} · `
            + `${tr('canecoLineZs').replace('{z}', fmtOhmBrief(loop.zsOhm))} · `
            + `${tr('canecoLineIa').replace('{i}', fmtABrief(loop.iaA))}`,
        });
        const ref = state.find((p) => p.role === 'aval') || [...state].sort((a, b) => a.in - b.in)[0];
        const inA = ref?.in || parseFloat(document.getElementById('tc-in')?.value);
        const curve = ref?.curve || 'C';
        const extra = g.ElectroDzCalcExtra;
        const u0n = parseFloat(document.getElementById('tc-u0')?.value) || 230;
        const ckt = document.getElementById('tc-circuit-kind')?.value || 'socket_32';
        if (extra?.computeMaxDisconnectionTimeIEC) {
          const { seconds: tMax } = extra.computeMaxDisconnectionTimeIEC(
            document.getElementById('tc-earth')?.value || 'TN',
            u0n,
            ckt
          );
          if (tMax != null && loop.iaA != null && extra.estimateMcBreakingTimeSeconds && inA > 0) {
            const est = extra.estimateMcBreakingTimeSeconds(inA, curve, loop.iaA / 1000);
            if (est.seconds != null) {
              const ok = est.seconds <= tMax;
              lines.push({
                cls: ok ? 'ok' : 'bad',
                html: trTpl(ok ? 'canecoOkTrip' : 'canecoBadTrip', {}),
              });
            }
          }
        }
      }
    }

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
  function setAddButtonMode() {
    const btn = document.getElementById('tc-add');
    const cancel = document.getElementById('tc-cancel-edit');
    const hint = document.getElementById('tc-edit-hint');
    if (editIndex >= 0) {
      if (btn) btn.textContent = tr('tcApplyEdit');
      if (cancel) cancel.hidden = false;
      if (hint) {
        hint.hidden = false;
        hint.textContent = trTpl('tcEditing', { n: editIndex + 1 });
      }
    } else {
      if (btn) btn.textContent = tr('tcAdd');
      if (cancel) cancel.hidden = true;
      if (hint) hint.hidden = true;
    }
  }

  function cancelEdit() {
    if (editIndex >= 0 && editSnapshot) state[editIndex] = editSnapshot;
    editIndex = -1;
    editSnapshot = null;
    clearPreview();
    formTouched = false;
    setAddButtonMode();
    refresh();
  }

  function clearPreview() {
    if (previewIndex < 0 || previewIndex >= state.length) {
      previewIndex = -1;
      return;
    }
    if (state[previewIndex]._preview) {
      state.splice(previewIndex, 1);
      if (editIndex > previewIndex) editIndex--;
    }
    previewIndex = -1;
  }

  function deviceKey(p) {
    if (!p) return '';
    if (isMfg(p)) return `${p.brandId || ''}|${p.deviceId || ''}|${p.tripUnitId || ''}|${p.in}`;
    if (isMccb(p)) return `norm-mccb|${p.in}|${p.mccbCat || 'A'}|${p.ir}|${p.im}`;
    return `${p.dev || 'mcb'}|${p.in}|${p.curve}`;
  }

  function mergeThresholdFields(base, from) {
    const o = { ...base };
    if (from.ir != null) o.ir = from.ir;
    if (from.isd != null) o.isd = from.isd;
    if (from.tsd != null) o.tsd = from.tsd;
    if (from.ii !== undefined) o.ii = from.ii;
    if (from.tr !== undefined) o.tr = from.tr;
    if (from.supportsTr !== undefined) o.supportsTr = from.supportsTr;
    if (from.hasShortTime != null) o.hasShortTime = from.hasShortTime;
    return o;
  }

  function markCurveRebuildFromForm() {
    rebuildCurveFromForm = true;
  }

  /** Met à jour state depuis le formulaire avant chaque tracé (courbe qui bouge en direct). */
  function applyLivePreview() {
    const p = makeDeviceFromForm(null, { preview: true });
    if (editIndex >= 0 && editIndex < state.length) {
      clearPreview();
      if (!p) return;
      const r = p.role;
      if (r === 'amont' || r === 'aval') {
        state.forEach((x, j) => { if (j !== editIndex && x.role === r) x.role = 'autre'; });
      }
      p.color = state[editIndex].color;
      state[editIndex] = p;
      rebuildCurveFromForm = false;
      return;
    }
    if (rebuildCurveFromForm && p) {
      rebuildCurveFromForm = false;
      const r = p.role;
      if (r === 'amont' || r === 'aval') {
        const idx = state.findIndex((x) => x.role === r && !x._preview);
        if (idx >= 0) {
          clearPreview();
          p.color = state[idx].color;
          state[idx] = p;
          return;
        }
      }
    }
    const tuneIdx = labelCurveIndex();
    if (editIndex < 0 && formTouched && tuneIdx >= 0 && tuneIdx < state.length && p
      && deviceKey(p) === deviceKey(state[tuneIdx])) {
      clearPreview();
      const merged = mergeThresholdFields(state[tuneIdx], p);
      merged.color = state[tuneIdx].color;
      delete merged._preview;
      state[tuneIdx] = merged;
      return;
    }
    if (editIndex < 0 && !formTouched) return;
    if (!p) {
      clearPreview();
      return;
    }
    const r = p.role;
    if (previewIndex >= 0 && previewIndex < state.length && state[previewIndex]._preview) {
      if (r === 'amont' || r === 'aval') {
        state.forEach((x, j) => { if (j !== previewIndex && x.role === r) x.role = 'autre'; });
      }
      p.color = state[previewIndex].color;
      p._preview = true;
      state[previewIndex] = p;
    } else if (state.length < 8) {
      if (r === 'amont' || r === 'aval') {
        state.forEach((x) => { if (x.role === r) x.role = 'autre'; });
      }
      p.color = PALETTE[nextColor % PALETTE.length];
      p._preview = true;
      state.push(p);
      previewIndex = state.length - 1;
    }
  }

  function scheduleRefresh() {
    formTouched = true;
    if (refreshPending) return;
    refreshPending = true;
    requestAnimationFrame(() => {
      refreshPending = false;
      refresh();
    });
  }

  function loadNormIntoForm(p) {
    const modeEl = document.getElementById('tc-mode');
    if (modeEl) modeEl.value = 'norm';
    g.ElectroDzTripCurveCatalog?.syncModeUI?.();
    const roleEl = document.getElementById('tc-role');
    if (roleEl) roleEl.value = p.role || 'autre';
    let dev = p.dev || 'mcb';
    if (dev === 'mfg_mcb') dev = 'mcb';
    if (dev === 'mfg_mccb') dev = 'mccb';
    const refEl = document.getElementById('tc-ref-model');
    if (refEl) refEl.value = refModelFromDevice(dev, p.mccbCat);
    applyRefModel();
    const inEl = document.getElementById('tc-in');
    if (inEl) inEl.value = String(p.in);
    const cEl = document.getElementById('tc-curve');
    if (cEl && p.curve) cEl.value = p.curve;
    if (dev === 'mccb') {
      const catEl = document.getElementById('tc-mccb-cat');
      if (catEl) catEl.value = p.mccbCat === 'B' ? 'B' : 'A';
      const irEl = document.getElementById('tc-ir-norm');
      const imEl = document.getElementById('tc-im');
      if (irEl) irEl.value = String(p.ir != null ? p.ir : 1);
      if (imEl) imEl.value = String(p.im != null ? p.im : 10);
    }
    syncNormDeviceUI();
  }

  function loadIntoForm(p) {
    const Cat = g.ElectroDzTripCurveCatalog;
    if (isMfg(p) && Cat?.loadProfileIntoForm) {
      return Cat.loadProfileIntoForm(p).then(() => {
        const roleEl = document.getElementById('tc-role');
        if (roleEl) roleEl.value = p.role || 'autre';
      });
    }
    loadNormIntoForm(p);
    return Promise.resolve();
  }

  function startEdit(i) {
    if (i < 0 || i >= state.length) return;
    if (editIndex >= 0 && editIndex !== i) cancelEdit();
    clearPreview();
    editIndex = i;
    editSnapshot = JSON.parse(JSON.stringify(state[i]));
    setAddButtonMode();
    renderLegend();
    loadIntoForm(state[i]).then(() => {
      refresh();
      document.getElementById('tc-settings-hint')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function renderLegend() {
    const box = document.getElementById('tc-legend');
    if (!box) return;
    if (!state.length) {
      box.innerHTML = `<span style="color:var(--muted);font-size:0.85rem">${tr('tcEmpty')}</span>`;
      return;
    }
    box.innerHTML = state.map((p, i) => {
      const roleCls = p.role === 'amont' ? ' tc-role-amont' : p.role === 'aval' ? ' tc-role-aval' : '';
      const roleLbl = p.role === 'amont' ? tr('tcRoleAmont') : p.role === 'aval' ? tr('tcRoleAval') : '';
      const editCls = i === editIndex ? ' tc-chip-edit' : '';
      const prevCls = p._preview ? ' tc-chip-preview' : '';
      const title = `${roleLbl ? roleLbl + ' — ' : ''}${legendChipTitle(p)} · ${tr('tcEditHint')}`;
      return `<button type="button" class="tc-chip-btn${roleCls}${editCls}${prevCls}" style="--tc-chip:${p.color}" data-tc-edit="${i}" title="${escapeAttr(title)}" aria-pressed="${i === editIndex ? 'true' : 'false'}">
        <span class="tc-dot" style="background:${p.color}"></span>
        <span class="tc-chip-lbl">${escapeAttr(legendChipShort(p))}</span>
        <span class="tc-chip-remove" data-tc-remove="${i}" role="presentation" aria-hidden="true">×</span>
      </button>`;
    }).join('');
    box.querySelectorAll('.tc-chip-btn[data-tc-edit]').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        if (e.target.closest('[data-tc-remove]')) return;
        startEdit(parseInt(chip.dataset.tcEdit, 10));
      });
    });
    box.querySelectorAll('[data-tc-remove]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.dataset.tcRemove, 10);
        state.splice(idx, 1);
        if (editIndex === idx) cancelEdit();
        else if (editIndex > idx) editIndex--;
        refresh();
      });
    });
    setAddButtonMode();
  }

  function updateGraphThresholdLive() {
    const irEl = document.getElementById('tc-ir-live');
    const isdEl = document.getElementById('tc-isd-live');
    const tsdEl = document.getElementById('tc-tsd-live');
    const iiEl = document.getElementById('tc-ii-live');
    const clear = () => {
      if (irEl) irEl.textContent = '';
      if (isdEl) isdEl.textContent = '';
      if (tsdEl) tsdEl.textContent = '';
      if (iiEl) iiEl.textContent = '';
    };
    const p = makeDeviceFromForm(null, { preview: true });
    if (!p || p.dev === 'mfg_mcb') { clear(); return; }
    const irA = Math.round((p.fixedIr ? 1 : (p.ir || 1)) * p.in);
    if (irEl && !p.fixedIr) irEl.textContent = trTpl('tcLiveIr', { ir: p.ir || 1, irA });
    if (p.hasShortTime && p.isd != null) {
      const isdA = Math.round(p.isd * irA);
      if (isdEl) isdEl.textContent = trTpl('tcLiveIsd', { isd: p.isd, isdA });
      if (tsdEl && p.tsd != null) tsdEl.textContent = trTpl('tcLiveTsd', { tsd: fmtTime(p.tsd) });
    } else if (isdEl || tsdEl) {
      if (isdEl) isdEl.textContent = '';
      if (tsdEl) tsdEl.textContent = '';
    }
    if (iiEl) {
      if (p.ii == null) iiEl.textContent = tr('tcLiveIiOff');
      else iiEl.textContent = trTpl('tcLiveIi', { ii: p.ii, iiA: Math.round(p.ii * p.in) });
    }
  }

  function refresh() {
    syncNormDeviceUI();
    applyLivePreview();
    syncGraphThresholdsPanel();
    updateGraphThresholdLive();
    renderLegend();
    analyzeSelectivity();
    analyzePro();
    draw(document.getElementById('tc-canvas'));
  }

  function makeDeviceFromForm(roleOverride, opts) {
    const Cat = g.ElectroDzTripCurveCatalog;
    const mode = Cat ? Cat.getMode() : 'norm';
    const role = roleOverride || document.getElementById('tc-role')?.value || 'autre';

    if (mode === 'mfg' || mode === 'schneider') {
      const hint = document.getElementById('tc-settings-hint');
      if (!opts?.preview && !Cat?.validateSettings(hint)) return null;
      const profile = Cat.getActiveProfile();
      if (!profile) return null;
      const devType = profile.deviceType === 'mcb' ? 'mfg_mcb' : 'mfg_mccb';
      const p = { in: profile.in, curve: profile.curve || 'C', role, dev: devType, color: '' };
      Object.assign(p, profile, { dev: devType });
      if (devType === 'mfg_mcb') {
        p.curve = profile.curve || 'C';
        p.supportsTr = false;
        p.tr = null;
      }
      return p;
    }

    applyRefModel();
    const inEl = document.getElementById('tc-in');
    const cEl = document.getElementById('tc-curve');
    const dEl = document.getElementById('tc-device');
    const inA = parseFloat(inEl?.value || '16');
    const curve = cEl?.value || 'C';
    const dev = dEl?.value || 'mcb';
    if (isNaN(inA) || inA <= 0) return null;
    const p = {
      in: inA, curve, role, dev, color: '',
      supportsTr: false,
      tr: null,
    };
    if (dev === 'mccb') {
      const cat = document.getElementById('tc-mccb-cat')?.value === 'B' ? 'B' : 'A';
      p.mccbCat = cat;
      p.ir = 1;
      p.im = 10;
      if (cat === 'B') {
        p.isd = IEC_CAT_B.isdMult;
        p.tsd = IEC_CAT_B.tsdSec;
        p.hasShortTime = true;
      }
    }
    return p;
  }

  function parseRefModel() {
    const ref = document.getElementById('tc-ref-model')?.value || 'mcb';
    if (ref === 'mccb-a') return { dev: 'mccb', cat: 'A' };
    if (ref === 'mccb-b') return { dev: 'mccb', cat: 'B' };
    if (ref === 'gg' || ref === 'am') return { dev: ref, cat: 'A' };
    return { dev: 'mcb', cat: 'A' };
  }

  function refModelFromDevice(dev, mccbCat) {
    if (dev === 'mccb') return mccbCat === 'B' ? 'mccb-b' : 'mccb-a';
    if (dev === 'gg' || dev === 'am') return dev;
    return 'mcb';
  }

  /** Synchronise les champs cachés tc-device / tc-mccb-cat depuis la référence modèle IEC. */
  function applyRefModel() {
    const { dev, cat } = parseRefModel();
    const devEl = document.getElementById('tc-device');
    const catEl = document.getElementById('tc-mccb-cat');
    if (devEl) devEl.value = dev;
    if (catEl) catEl.value = cat;
  }

  /** Caractéristiques visibles selon le modèle choisi en référence (pas de familles redondantes). */
  function syncNormDeviceUI() {
    const modeEl = document.getElementById('tc-mode');
    if (modeEl && (modeEl.value === 'mfg' || modeEl.value === 'schneider')) return;
    applyRefModel();
    const { dev, cat } = parseRefModel();
    const show = (id, on) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !on;
    };
    const isMcb = dev === 'mcb';
    show('tc-in-group', true);
    show('tc-curve-group', isMcb);
    show('tc-ir-group-norm', false);
    show('tc-im-group', false);
    updateNormSettingsHint(dev, cat);
    syncGraphThresholdsPanel();
  }

  function updateNormSettingsHint(dev, cat) {
    const hint = document.getElementById('tc-settings-hint');
    if (!hint) return;
    const parts = [];
    if (dev === 'mcb') parts.push(tr('tcNormHintMcb'));
    else if (dev === 'mccb' && cat === 'A') parts.push(tr('tcNormHintMccbA'));
    else if (dev === 'mccb' && cat === 'B') parts.push(tr('tcNormHintMccbB'));
    else if (dev === 'gg' || dev === 'am') parts.push(tr('tcNormHintFuse'));
    if (dev === 'mcb' || dev === 'mccb') parts.push(tr('tcNormNoAdjustHint'));
    hint.textContent = parts.filter(Boolean).join(' ');
  }

  /** Panneau sous le graphe : Tsd/Isd constructeur ou lecture seule IEC Cat. B. */
  function syncGraphThresholdsPanel() {
    const panel = document.getElementById('tc-graph-thresholds');
    const normRo = document.getElementById('tc-graph-norm-readonly');
    const mfgTune = document.getElementById('tc-graph-mfg-tune');
    const modeEl = document.getElementById('tc-mode');
    const mode = modeEl?.value || 'mfg';
    if (!panel) return;
    if (mode === 'mfg' || mode === 'schneider') {
      if (normRo) normRo.hidden = true;
      const showMfg = g.ElectroDzTripCurveCatalog?.formHasAdjustableThresholds?.() === true;
      if (mfgTune) {
        mfgTune.classList.toggle('tc-mfg-hidden', !showMfg);
        mfgTune.hidden = !showMfg;
      }
      panel.hidden = !showMfg;
      const studio = document.getElementById('tc-graph-studio');
      if (studio) studio.hidden = false;
    } else {
      const { dev, cat } = parseRefModel();
      const isCatB = dev === 'mccb' && cat === 'B';
      if (normRo) {
        normRo.hidden = !isCatB;
        if (isCatB) {
          const irA = Math.round((parseFloat(document.getElementById('tc-ir-norm')?.value) || 1)
            * (parseFloat(document.getElementById('tc-in')?.value) || 16));
          normRo.textContent = trTpl('tcGraphNormCatB', {
            isd: IEC_CAT_B.isdMult,
            tsd: fmtTime(IEC_CAT_B.tsdSec),
            ir: irA,
            im: document.getElementById('tc-im')?.value || '10',
          });
        }
      }
      if (mfgTune) mfgTune.hidden = true;
      panel.hidden = !isCatB;
    }
  }

  function pushDevice(p, skipRoleDedup) {
    if (!p) return false;
    clearPreview();
    formTouched = false;
    if (state.length >= 8 && editIndex < 0) return false;
    const r = p.role;
    if (!skipRoleDedup && (r === 'amont' || r === 'aval')) {
      state.forEach((x) => { if (x.role === r) x.role = 'autre'; });
    }
    p.color = PALETTE[nextColor % PALETTE.length];
    state.push(p);
    nextColor++;
    refresh();
    return true;
  }

  function add(inA, curve, role, dev, opts) {
    const r = role || 'autre';
    const p = { in: inA, curve, role: r, dev: dev || 'mcb', color: '' };
    if (dev === 'mccb') {
      p.mccbCat = (opts && opts.mccbCat) || 'A';
      p.ir = (opts && opts.ir) || 1;
      p.im = (opts && opts.im) || 10;
      if (p.mccbCat === 'B') {
        p.isd = (opts && opts.isd) || 2;
        p.tsd = (opts && opts.tsd) || 0.2;
        p.hasShortTime = true;
      }
    }
    if (opts && opts.profile) {
      const dt = opts.profile.deviceType === 'mcb' ? 'mfg_mcb' : 'mfg_mccb';
      Object.assign(p, opts.profile, { dev: dt });
      if (dt === 'mfg_mcb') p.curve = opts.profile.curve || 'C';
    }
    return pushDevice(p);
  }

  function addMfg(role) {
    const p = makeDeviceFromForm(role);
    if (!p) return;
    pushDevice(p);
  }

  function updateDeviceAt(i) {
    const p = makeDeviceFromForm();
    if (!p || i < 0 || i >= state.length) return false;
    const r = p.role;
    if (r === 'amont' || r === 'aval') {
      state.forEach((x, j) => { if (j !== i && x.role === r) x.role = 'autre'; });
    }
    p.color = state[i].color;
    state[i] = p;
    refresh();
    return true;
  }

  function applyCurrent() {
    if (editIndex >= 0) {
      if (updateDeviceAt(editIndex)) {
        editSnapshot = null;
        cancelEdit();
      }
      return;
    }
    const p = makeDeviceFromForm();
    if (!p) return;
    if (previewIndex >= 0) {
      const idx = previewIndex;
      clearPreview();
      formTouched = false;
      const r = p.role;
      if (r === 'amont' || r === 'aval') {
        state.forEach((x) => { if (x.role === r) x.role = 'autre'; });
      }
      p.color = PALETTE[nextColor % PALETTE.length];
      state.push(p);
      nextColor++;
      refresh();
      return;
    }
    if (state.length >= 8) return;
    pushDevice(p);
  }

  function clearAll() {
    state = [];
    nextColor = 0;
    previewIndex = -1;
    formTouched = false;
    editSnapshot = null;
    cancelEdit();
    refresh();
  }

  function scrollGraphStudioIntoView() {
    document.getElementById('tc-graph-studio')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }

  function bindGraphThresholdFocus() {
    const Cat = g.ElectroDzTripCurveCatalog;
    if (!Cat?.loadProfileIntoForm) return;
    const onTune = () => {
      scrollGraphStudioIntoView();
      if (editIndex >= 0) return;
      const idx = labelCurveIndex();
      if (idx < 0 || idx >= state.length) return;
      const target = state[idx];
      if (!isMfgMccb(target) && !isNormMccbB(target)) return;
      Cat.loadProfileIntoForm(target);
    };
    ['tc-isd', 'tc-tsd', 'tc-tsd-select', 'tc-tsd-range', 'tc-ir', 'tc-ii', 'tc-tr', 'tc-tsd-dec', 'tc-tsd-inc'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('focus', onTune);
      if (id.startsWith('tc-tsd-') && id !== 'tc-tsd-select' && id !== 'tc-tsd-range') {
        el?.addEventListener('click', onTune);
      }
    });
  }

  function bindFormLiveRefresh() {
    const ids = [
      'tc-curve', 'tc-in', 'tc-ir-norm', 'tc-im', 'tc-mode', 'tc-ref-model',
      'tc-ir', 'tc-isd', 'tc-tsd', 'tc-tsd-select', 'tc-tsd-range', 'tc-ii', 'tc-tr',
      'tc-mfg-brand', 'tc-mfg-family',
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', scheduleRefresh);
      el?.addEventListener('change', scheduleRefresh);
    });
    document.getElementById('tc-role')?.addEventListener('change', () => {
      markCurveRebuildFromForm();
      scheduleRefresh();
    });
    document.getElementById('tc-ii-off')?.addEventListener('change', scheduleRefresh);
  }

  // --- Export --------------------------------------------------------------
  /** Redessine sans le viseur puis renvoie le PNG en dataURL. */
  function snapshotPNG() {
    const cv = document.getElementById('tc-canvas');
    if (!cv) return null;
    const keep = pointer;
    pointer = null;
    draw(cv, { export: true });
    const url = cv.toDataURL('image/png');
    draw(cv);
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
  function formatStudyLine(p, idx) {
    const role = p.role === 'amont' ? tr('tcRoleAmont') : p.role === 'aval' ? tr('tcRoleAval') : tr('tcRoleNone');
    let line = `${idx + 1}. [${role}] `;
    if (isMfg(p)) {
      line += `${p.brand || ''} ${p.deviceLabel || ''} · ${p.tripUnitLabel || ''} · In ${p.in} A`;
      if (isMfgMccb(p)) {
        line += ` · Ir ${Math.round((p.ir || 1) * p.in)} A`;
        if (mfgUsesTr(p)) line += ` · tr ${p.tr}s (@ 6·Ir)`;
        if (p.hasShortTime) line += ` · Isd ${p.isd}×Ir · Tsd ${p.tsd}s`;
        if (p.ii != null && p.ii > 0) line += ` · Ii ${p.ii}×In`;
      } else {
        line += ` · ${tr('tcCurveWord')} ${p.curve || 'C'}`;
      }
      if (p.curveSource) line += `\n   Source: ${p.curveSource}`;
      if (p.catalogRevision) line += `\n   Révision: ${p.catalogRevision}`;
    } else if (isMccb(p)) {
      line += `${deviceTag(p)} · In ${p.in} A · Ir ${Math.round((p.ir || 1) * p.in)} A · Im ${p.im || 10}×In`;
      if (p.mccbCat === 'B') line += ` · Isd ${p.isd || 2}×Ir · Tsd ${fmtTime(p.tsd != null ? p.tsd : 0.2)}`;
      if (p.normRef) line += `\n   ${p.normRef}`;
    } else if (isFuse(p)) {
      line += `${deviceTag(p)} · In ${p.in} A`;
    } else {
      line += `${deviceTag(p)} · In ${p.in} A · ${tr('tcCurveWord')} ${p.curve || 'C'}`;
    }
    return line;
  }

  function exportStudyTXT() {
    const Cat = g.ElectroDzTripCurveCatalog;
    const icc = parseFloat(document.getElementById('tc-icc')?.value || '0');
    const lines = [
      tr('tcExportStudyTitle'),
      '—'.repeat(48),
      new Date().toISOString(),
      '',
      tr('tcMfgDisclaimer'),
      '',
    ];
    const meta = Cat?.getCatalogMeta?.();
    if (meta?.revision) lines.push(`Catalogue: ${meta.brand || ''} · révision ${meta.revision}`);
    const meth = Cat?.getMethodology?.();
    if (meth?.standard) lines.push(`Normes: ${meth.standard}`);
    lines.push('');
    if (!state.length) {
      lines.push(tr('tcEmpty'));
    } else {
      lines.push('Protections tracées:');
      state.forEach((p, i) => lines.push(formatStudyLine(p, i)));
    }
    lines.push('');
    if (icc > 0) lines.push(`Icc aval saisi: ${icc} A`);
    const verdict = document.getElementById('tc-verdict');
    if (verdict?.textContent?.trim()) {
      lines.push('', 'Sélectivité (indicatif):', verdict.textContent.trim());
    }
    const tools = Cat?.getValidationTools?.() || [];
    if (tools.length) {
      lines.push('', tr('tcValidateMfg') + ':');
      tools.forEach((t) => lines.push(`  - ${t.title}: ${t.url}`));
    }
    lines.push('', '—', 'ElectroDZ — electrodzch.github.io');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rapport-courbes-protection-electrodz.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

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
      <style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a;background:#fff}
      h1{font-size:18px;margin:0 0 12px;color:#0f172a}
      img{width:100%;max-width:1000px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}
      .v{margin-top:14px;font-size:13px;line-height:1.5;color:#1e293b}
      .v .tc-verdict,.v .tc-pro-line{border-radius:8px;padding:10px 12px;margin:8px 0}
      .v .total{color:#166534;background:#dcfce7;border:1px solid #86efac}
      .v .partial{color:#92400e;background:#fef9c3;border:1px solid #fde047}
      .v .warn,.v .bad{color:#991b1b;background:#fee2e2;border:1px solid #fca5a5}
      .v .ok{color:#166534;background:#ecfdf5;border:1px solid #6ee7b7}
      .v .info{color:#475569;background:#f1f5f9;border:1px solid #cbd5e1}
      .v small{color:#64748b}
      .d{margin-top:18px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px}
      </style></head>
      <body><h1>${tr('tcExportTitle')}</h1><img src="${url}">
      <div class="v">${blocks.join('<hr>')}</div>
      <div class="d">${state.some(isMfg) ? tr('tcMfgDisclaimer') : tr('tcDisclaimer')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
      </body></html>`);
    w.document.close();
  }

  let bound = false;
  function init() {
    const sec = document.getElementById('tripcurve');
    if (!sec || bound) { refresh(); return; }
    bound = true;
    document.getElementById('tc-add')?.addEventListener('click', applyCurrent);
    document.getElementById('tc-cancel-edit')?.addEventListener('click', cancelEdit);
    document.getElementById('tc-icc')?.addEventListener('input', scheduleRefresh);
    bindFormLiveRefresh();
    bindGraphThresholdFocus();

    // type d'appareil : courbe B/C/D pour MCB ; réglages Ir/Im pour MCCB
    const syncDevice = () => {
      syncNormDeviceUI();
      scheduleRefresh();
    };
    document.getElementById('tc-ref-model')?.addEventListener('change', syncDevice);
    syncDevice();

    const Cat = g.ElectroDzTripCurveCatalog;
    if (Cat) {
      Cat.bindUI(scheduleRefresh);
    }

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
        if (open && g.ElectroDzTripCurveCatalog?.updateProvenancePanel) {
          g.ElectroDzTripCurveCatalog.updateProvenancePanel();
        }
        refresh();
      });
    }
    ['tc-icu', 'tc-cable-s', 'tc-cable-mat', 'tc-cable-ins', 'tc-ze', 'tc-length', 'tc-u0', 'tc-earth', 'tc-circuit-kind',
      'tc-ik1', 'tc-icc-earth', 'tc-icc-kva', 'tc-icc-ucc', 'tc-icc-pcc', 'tc-icc-l', 'tc-icc-s', 'tc-icc-u', 'tc-icc-conductor',
    ].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', scheduleRefresh);
      el?.addEventListener('change', scheduleRefresh);
    });
    document.getElementById('tc-icc-calc')?.addEventListener('click', () => {
      proIccForceCalc = true;
      runProIccCalc();
      refresh();
      proIccForceCalc = false;
    });
    document.getElementById('tc-icc-apply')?.addEventListener('click', () => {
      if (!applyProIkToIcc()) {
        proIccForceCalc = true;
        runProIccCalc();
        refresh();
        proIccForceCalc = false;
        return;
      }
      refresh();
    });
    ['tc-ik1', 'tc-icc-earth', 'tc-icc-kva', 'tc-icc-ucc', 'tc-icc-pcc', 'tc-icc-l', 'tc-icc-s', 'tc-icc-u', 'tc-icc-conductor'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => { lastProIccResult = null; });
      el?.addEventListener('change', () => { lastProIccResult = null; });
    });
    document.getElementById('tc-export-png')?.addEventListener('click', exportPNG);
    document.getElementById('tc-export-pdf')?.addEventListener('click', exportPDF);
    document.getElementById('tc-export-study')?.addEventListener('click', exportStudyTXT);

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
      if (Cat) {
        Cat.loadCatalog().then((data) => {
          if (data) loadPilotNsx160();
          else {
            add(63, 'C', 'amont');
            add(16, 'C', 'aval');
          }
        });
      } else {
        add(63, 'C', 'amont');
        add(16, 'C', 'aval');
      }
    } else {
      refresh();
    }
  }

  /** Exemple pro : NSX160 Micrologic 2.3 (amont) + NSX100 Micrologic 2.3 (aval) — DOCA0141. */
  function loadPilotNsx160() {
    const Cat = g.ElectroDzTripCurveCatalog;
    const run = () => {
      state = [];
      nextColor = 0;
      const modeEl = document.getElementById('tc-mode');
      if (modeEl) modeEl.value = 'mfg';
      Cat?.syncModeUI();
      const devEl = document.getElementById('tc-mfg-device');
      const inEl = document.getElementById('tc-mfg-in');
      const tuEl = document.getElementById('tc-mfg-trip');
      const brandEl = document.getElementById('tc-mfg-brand');
      if (brandEl) brandEl.value = 'schneider';
      Cat?.reloadCatalog(() => {
        const roleEl = document.getElementById('tc-role');
        if (devEl) devEl.value = 'nsx160';
        Cat?.syncMfgCascade();
        if (inEl) inEl.value = '160';
        if (tuEl) tuEl.value = 'micrologic_2_3';
        Cat?.syncMfgCascade();
        Cat?.syncMfgSettings?.();
        const trEl = document.getElementById('tc-tr');
        if (trEl) trEl.value = '1';
        document.getElementById('tc-ir').value = '1';
        document.getElementById('tc-isd').value = '2';
        document.getElementById('tc-tsd').value = '0.2';
        document.getElementById('tc-ii').value = '10';
        const iiOff = document.getElementById('tc-ii-off');
        if (iiOff) iiOff.checked = false;
        const iccEl = document.getElementById('tc-icc');
        if (iccEl) iccEl.value = '6000';
        if (roleEl) roleEl.value = 'amont';
        addMfg('amont');
        if (devEl) devEl.value = 'nsx100';
        Cat?.syncMfgCascade();
        const dev100 = Cat?.findDevice?.('nsx100');
        const inAval = dev100?.inRatings?.length
          ? String(dev100.inRatings[dev100.inRatings.length - 1])
          : '63';
        if (inEl) inEl.value = inAval;
        if (tuEl) tuEl.value = 'micrologic_2_3';
        Cat?.syncMfgCascade();
        document.getElementById('tc-ir').value = '0.8';
        document.getElementById('tc-isd').value = '2';
        if (roleEl) roleEl.value = 'aval';
        addMfg('aval');
        refresh();
      });
    };
    if (Cat?.getCatalog()) run();
    else Cat?.loadCatalog().then(run);
  }

  // appelé quand la section devient visible (canvas a alors une taille réelle)
  function onShow() { requestAnimationFrame(() => draw(document.getElementById('tc-canvas'))); }

  g.ElectroDzTripCurve = {
    init,
    onShow,
    applyCurrent,
    startEdit,
    cancelEdit,
    clearAll,
    redraw: refresh,
    markCurveRebuildFromForm,
    syncNormDeviceUI,
    syncGraphThresholdsPanel,
    applyRefModel,
    parseRefModel,
    loadPilotNsx160,
    CURVES,
  };
})(typeof window !== 'undefined' ? window : globalThis);
