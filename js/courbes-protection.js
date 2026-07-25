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

  const CURVE_COLORS = [
    { hex: '#facc15', key: 'tcColorYellow', fr: 'Jaune', ar: 'أصفر' },
    { hex: '#22d3ee', key: 'tcColorCyan', fr: 'Cyan', ar: 'سماوي' },
    { hex: '#f472b6', key: 'tcColorPink', fr: 'Rose', ar: 'وردي' },
    { hex: '#4ade80', key: 'tcColorGreen', fr: 'Vert', ar: 'أخضر' },
    { hex: '#fb923c', key: 'tcColorOrange', fr: 'Orange', ar: 'برتقالي' },
    { hex: '#a78bfa', key: 'tcColorPurple', fr: 'Violet', ar: 'بنفسجي' },
    { hex: '#f87171', key: 'tcColorRed', fr: 'Rouge', ar: 'أحمر' },
    { hex: '#38bdf8', key: 'tcColorBlue', fr: 'Bleu', ar: 'أزرق' },
  ];
  /** @deprecated — utiliser CURVE_COLORS */
  const PALETTE = CURVE_COLORS.map((c) => c.hex);

  function curveColorEntry(idx) {
    const n = CURVE_COLORS.length;
    return CURVE_COLORS[((idx % n) + n) % n];
  }

  function curveColorName(p, idx) {
    const ci = p.colorIdx != null ? p.colorIdx : idx;
    const entry = curveColorEntry(ci);
    const t = tr(entry.key);
    if (t && t !== entry.key) return t;
    return lang() === 'fr' ? entry.fr : entry.ar;
  }

  /** Courant max tracé à droite de Ii (Icu saisi, Icc, ou borne graphe). */
  function mfgCurveHighI(p, d) {
    const icu = getIcuA();
    const icc = getIccA();
    let hi = X_MAX;
    if (icu && icu > d.instI) hi = Math.min(hi, icu);
    if (icc && icc > d.instI) hi = Math.max(hi, Math.min(icc, X_MAX));
    return Math.max(d.instI * 1.02, hi);
  }

  function assignCurveColor(p) {
    const entry = curveColorEntry(nextColor);
    p.color = entry.hex;
    p.colorIdx = nextColor % CURVE_COLORS.length;
    nextColor++;
  }

  // Bornes du graphe
  const X_MIN = 1, X_MAX = 20000;       // courant (A), échelle log
  /** Axe X catalogue MCCB : multiples de In (comme planches Hager In[%]). */
  const X_MULT_MIN = 0.8;
  const X_MULT_MAX = 100;
  const Y_DATA_CAP = 36000;             // plafond pour le calcul des courbes (s)
  const Y_AXIS_MAX_CAP = 36000;
  /**
   * Échelons de temps des planches constructeur : progression 1 · 2 · 4 par
   * décade (0,004 · 0,01 · 0,02 · 0,04 · 0,1 · 0,2 · 0,4 · 1 · 2 · 4 …).
   */
  const Y_AXIS_TICKS = [
    0.001, 0.002, 0.004, 0.01, 0.02, 0.04, 0.1, 0.2, 0.4,
    1, 2, 4, 10, 20, 40, 100, 200, 400, 1000, 2000, 3600, 6000, 10000, 14400, 36000,
  ];
  /** Libellés Y façon catalogue MCCB (ms / s / m / h), haut = 4 h. */
  const Y_AXIS_TICKS_MCCB = [
    0.005, 0.01, 0.1, 1, 10, 60, 600, 3600, 14400,
  ];
  /** Bas d'axe par défaut (s) — comme la planche officielle qui démarre à 0,004 s. */
  const Y_AXIS_MIN = 0.004;
  /** Plancher absolu : l'axe ne descend plus bas, même avec un tsd très court. */
  const Y_AXIS_HARD_MIN = 0.001;
  let plotYLo = Y_AXIS_MIN;
  let plotYHi = 3600;

  /** Réf. In (A) pour axes catalogue MCCB, ou null → axes MCB en ampères (inchangés). */
  function mccbCatalogInRef() {
    const mccbs = state.filter((p) => isMfgMccb(p));
    if (!mccbs.length) return null;
    // Dès qu'un MCB / fusible est présent, on garde les ampères (coordination).
    if (state.some((p) => !isMfgMccb(p) && !isNormMccbB(p))) return null;
    const idx = labelCurveIndex();
    const ref = (idx >= 0 && (isMfgMccb(state[idx]) || isNormMccbB(state[idx])))
      ? state[idx]
      : mccbs[0];
    const th = mfgThresholds(isNormMccbB(ref) ? enrichNormMccb(ref) : ref);
    return th.irA > 0 ? th.irA : ref.in;
  }

  function plotXRange() {
    const inRef = mccbCatalogInRef();
    if (inRef) return { xLo: inRef * X_MULT_MIN, xHi: inRef * X_MULT_MAX, inRef };
    return { xLo: X_MIN, xHi: X_MAX, inRef: null };
  }

  // Enveloppe thermique — MODÈLE ANALYTIQUE CONTINU (courbe constructeur).
  //
  // t(m) = K · m^b / (m² − 1,13²)^a       avec m = I / In
  //
  // Asymptote verticale à 1,13·In (courant conventionnel de non-déclenchement,
  // CEI 60898-1) et pente qui s'aplatit régulièrement : la courbe est lisse par
  // construction, sans point anguleux ni zigzag (contrairement à une table de
  // points interpolée). Les constantes sont calées sur les points d'essai :
  //
  //   borne LENTE (droite, temps max) : 1,45·In → 3600 s (temps conventionnel 1 h)
  //                                     2,55·In → 60 s (essai CEI, In ≤ 32 A)
  //                                     10·In   → 2 s (raccord seuil magnétique)
  //   borne RAPIDE (gauche, temps min): 1,45·In → 400 s
  //                                     2,55·In → 8 s
  //                                     5·In    → 1,5 s (raccord seuil magnétique)
  const I_NO_TRIP = 1.13;
  const THERMAL_MODEL = {
    slow: { k: 133.30, a: 4.26074, b: 6.67388 },
    fast: { k: 11.611, a: 4.34794, b: 7.28268 },
  };

  function thermalModelTime(model, m) {
    const f = m * m - I_NO_TRIP * I_NO_TRIP;
    if (f <= 0) return Infinity;
    return (model.k * Math.pow(m, model.b)) / Math.pow(f, model.a);
  }

  /** Table dense issue du modèle : interpolation = courbe analytique (aucun angle). */
  function buildThermalAnchors(model) {
    const pts = [];
    for (let m = I_NO_TRIP * 1.0004; m <= 45; m *= 1.02) {
      pts.push([m, Math.min(thermalModelTime(model, m), 1e6)]);
    }
    return pts;
  }

  const THERMAL_SLOW = buildThermalAnchors(THERMAL_MODEL.slow);
  const THERMAL_FAST = buildThermalAnchors(THERMAL_MODEL.fast);

  // Plancher instantané (magnétique + temps d'arc) : 10 ms, comme les planches
  // constructeur où les seuils 5·In et 10·In retombent sur le palier 0,01 s.
  const T_INST_SLOW = 0.01;
  const T_INST_FAST = 0.01;

  // Fusibles — courbes GÉNÉRIQUES (multiple de In → temps de préarc), log-log.
  //  gG (CEI 60269) : usage général, surcharge + court-circuit. Non-fusion ≈ 1,25·In.
  //  aM (CEI 60269) : accompagnement moteur, court-circuit. Démarre ≈ 4·In.
  //  T  (CEI 60127) : time-lag / retardé (marquage « T » ou symbole escargot) —
  //      tolère les appels de courant (moteurs, transformateurs). Indicatif.
  const FUSE_GG = [[1.25, 1e6], [1.6, 3600], [2, 120], [2.5, 30], [3, 10], [4, 2], [5, 0.7], [6.3, 0.2], [8, 0.06], [10, 0.02], [20, 0.0018], [40, 2.5e-4]];
  const FUSE_AM = [[2.8, 1e6], [4, 3600], [5, 60], [6.3, 10], [8, 1.5], [10, 0.3], [12.5, 0.08], [16, 0.02], [20, 0.007], [40, 7e-4]];
  // Time-lag T (IEC 60127-2, feuille type ~0,5–6,3 A) : portes 1,5 / 2,1 / 2,75 / 4 / 10·In —
  // ancrages ≈ milieux géométriques min–max (indicatif, hors I²t constructeur).
  const FUSE_T = [[1.5, 1e6], [2.1, 900], [2.75, 4.5], [4, 0.5], [6.3, 0.12], [10, 0.027], [20, 0.005], [40, 0.001]];
  const FUSE_TOL_SLOW = 1.35;  // borne lente (fusion + arc, dispersion +) — calculs
  const FUSE_TOL_FAST = 0.7;   // borne rapide (préarc mini) — calculs
  function fuseAnchors(dev) {
    if (dev === 'am') return FUSE_AM;
    if (dev === 't') return FUSE_T;
    return FUSE_GG;
  }
  function isFuse(p) { return p.dev === 'gg' || p.dev === 'am' || p.dev === 't'; }
  function isMccb(p) { return p.dev === 'mccb'; }
  function isMfgMccb(p) { return p.dev === 'mfg_mccb'; }
  function isNormMccbB(p) { return isMccb(p) && p.mccbCat === 'B'; }

  /** MCCB mode IEC : enveloppe générique — seuils = réglages utilisateur (essais hors catalogue). */
  function enrichNormMccb(p) {
    if (!isMccb(p)) return p;
    const ir = clampNum(p.ir, 0.4, 1, 1);
    const im = clampNum(p.im, 1.5, 15, 10);
    if (p.mccbCat === 'B') {
      const isd = clampNum(p.isd, IEC_CAT_B.isdMin, IEC_CAT_B.isdMax, IEC_CAT_B.isdMult);
      const tsd = clampNum(p.tsd, 0.001, 0.4, IEC_CAT_B.tsdSec);
      const ii = clampNum(p.ii != null ? p.ii : im, 1.5, 15, im);
      return {
        ...p,
        ir,
        im,
        isd,
        tsd,
        ii,
        hasShortTime: true,
        longAnchors: THERMAL_SLOW,
        instTS: T_INST_SLOW,
        normRef: 'IEC 60947-2 Cat. B (réglages utilisateur)',
      };
    }
    return {
      ...p,
      ir,
      im,
      ii: im,
      mccbCat: 'A',
      hasShortTime: false,
      normRef: 'IEC 60947-2 Cat. A (réglages utilisateur)',
    };
  }

  function clampNum(v, min, max, fallback) {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
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
    let isdA = p.hasShortTime && p.isd != null ? p.isd * irA : irA * 6;
    isdA = Math.max(isdA, irA * 1.05);
    let iiA = p.ii != null && p.ii > 0 ? p.ii * p.in : X_MAX * 0.5;
    if (p.hasShortTime) iiA = Math.max(iiA, isdA * 1.02);
    return {
      irA,
      isdA,
      iiA,
      tsd: p.tsd != null && p.tsd > 0 ? p.tsd : (p.hasShortTime ? 0.2 : 0),
      instTS: p.instTS || T_INST_SLOW,
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
    const scaled = mfgScaledAnchors(p, p.longAnchors || []);
    const long = [];
    const startM = th.noTripMult * 1.002;
    const kneeI = p.hasShortTime ? th.isdA : th.iiA;
    const endM = kneeI / th.irA;
    // Échantillonnage fin (même densité que le tunnel MCB) — courbe lisse, sans zigzag.
    for (let m = startM; m < endM * 0.998; m *= 1.006) {
      const t = interpLogLogDraw(scaled, m, endM);
      long.push({ i: m * th.irA, t: Math.min(t, Y_DATA_CAP * 5) });
    }
    const tKnee = Math.min(interpLogLog(scaled, endM), Y_DATA_CAP * 5);
    if (!long.length || long[long.length - 1].i < kneeI * 0.995) {
      long.push({ i: kneeI, t: tKnee });
    } else {
      long[long.length - 1] = { i: kneeI, t: tKnee };
    }

    return {
      long,
      shortI: th.isdA,
      instI: th.iiA,
      tsd: th.tsd,
      tKnee,
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
    if (p.dev === 't') return 'T';
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

  /** Libellé court sur le bouton : n° couleur + référence + calibre In. */
  function legendChipShort(p, idx) {
    const inA = Math.round(p.in);
    let name = '';
    if (isMfg(p)) name = String(p.deviceLabel || p.deviceId || 'MCCB').trim();
    else if (isFuse(p)) name = p.dev === 'am' ? 'aM' : (p.dev === 't' ? 'T' : 'gG');
    else if (isMccb(p)) name = `MCCB${p.mccbCat === 'B' ? ' B' : ''}`;
    else name = deviceTag(p);
    const curve = isMfgMcb(p) ? ` ${p.curve || 'C'}` : '';
    const tag = `#${idx + 1} ${curveColorName(p, idx)}`;
    return `${tag} · ${name}${curve} · ${inA} A`;
  }

  function legendChipTitle(p) {
    const c = CURVES[p.curve] || CURVES.C;
    if (isMfg(p)) return mfgLegendDesc(p);
    if (isFuse(p)) {
      const key = p.dev === 'am' ? 'tcDevAm' : (p.dev === 't' ? 'tcDevT' : 'tcDevGg');
      return `${tr(key)} · ${p.in} A`;
    }
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
      iccLine: '#ef4444',
      iccText: '#f87171',
      deviceLabel: null,
      badgeBg: 'rgba(2,6,18,0.85)',
      badgeText: '#e2e8f0',
      zoneThermal: { fill: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.45)', text: '#fde68a' },
      zoneShort: { fill: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.45)', text: '#7dd3fc' },
      zoneMag: { fill: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.45)', text: '#fecaca' },
      legendBg: 'rgba(2,6,18,0.88)',
      legendTitle: '#e2e8f0',
      curveThermal: '#ef4444',
      curveMagnetic: '#60a5fa',
      legendThermal: '#ef4444',
      legendMagnetic: '#60a5fa',
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
      iccLine: '#dc2626',
      iccText: '#b91c1c',
      deviceLabel: null,
      badgeBg: 'rgba(255,255,255,0.95)',
      badgeText: '#0f172a',
      zoneThermal: { fill: 'rgba(251,191,36,0.22)', border: '#d97706', text: '#92400e' },
      zoneShort: { fill: 'rgba(14,165,233,0.18)', border: '#0284c7', text: '#075985' },
      zoneMag: { fill: 'rgba(239,68,68,0.15)', border: '#dc2626', text: '#991b1b' },
      legendBg: 'rgba(255,255,255,0.96)',
      legendTitle: '#0f172a',
      curveThermal: '#dc2626',
      curveMagnetic: '#2563eb',
      legendThermal: '#dc2626',
      legendMagnetic: '#2563eb',
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
   * Temps pour le DESSIN thermique catalogue uniquement.
   * Même valeur que interpLogLog aux ancres et au seuil magnétique ;
   * entre le dernier ancre et le seuil, léger cintrage (plus de corde droite
   * visible sur le graphe log-log). Les calculs / tooltip restent sur interpLogLog.
   */
  function interpLogLogDraw(anchors, x, mMag) {
    if (!anchors?.length) return Infinity;
    const last = anchors.length - 1;
    const mLast = anchors[last][0];
    if (x <= mLast || !(mMag > mLast)) return interpLogLog(anchors, x);
    const tLast = anchors[last][1];
    const tMag = interpLogLog(anchors, mMag); // même extrémité que le calcul
    const u = (Math.log10(x) - Math.log10(mLast)) / (Math.log10(mMag) - Math.log10(mLast));
    const ue = u * u * (3 - 2 * u); // smoothstep → courbe sur le graphe log-log
    return Math.pow(10, Math.log10(tLast) + ue * (Math.log10(tMag) - Math.log10(tLast)));
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
    // Échantillonnage fin : la polyligne suit exactement la courbe analytique.
    // Démarre juste au-dessus de 1,13·In (asymptote de non-déclenchement).
    for (let m = I_NO_TRIP * 1.004; m < magMult; m *= 1.008) {
      thermal.push({ i: m * inA, t: Math.min(interpLogLog(anchors, m), Y_DATA_CAP * 5) });
    }
    // Dernier point EXACTEMENT au seuil magnétique : la chute est ensuite
    // verticale (pas de raccord en biais ni de trou).
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

  /** Axe temps : bas = 4 ms ; haut adapté aux courbes affichées.
   *  MCCB catalogue : plancher haut à 4 h (comme les planches constructeur).
   *  MCB seuls : inchangé (pas de forçage à 4 h). */
  function computePlotYRange() {
    let yHi = 60;
    let yLo = Y_AXIS_MIN;
    const sampleI = (k, n) => Math.pow(
      10,
      Math.log10(X_MIN) + (k / n) * (Math.log10(X_MAX) - Math.log10(X_MIN)),
    );
    let hasCatalogMccb = false;
    state.forEach((p) => {
      if (isMfgMccb(p) || isNormMccbB(p)) hasCatalogMccb = true;
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
    yLo = Math.max(Y_AXIS_HARD_MIN, Math.min(Y_AXIS_MIN, yLo));
    const cable = getCable();
    if (cable) {
      for (let k = 0; k <= 24; k++) {
        const I = sampleI(k, 24);
        yHi = Math.max(yHi, cableTime(cable, I));
      }
    }
    // Planches MCCB (ex. Hager h800) : haut d'axe = 4 h, comme le catalogue.
    // Sans le ×1.15 qui sautait à 10 h (prochain cran 36000 s).
    if (hasCatalogMccb) {
      yLo = Math.min(yLo, 0.005);
      yHi = Math.max(yHi, 14400);
      yHi = Math.min(snapYMax(yHi), 14400);
    } else {
      yHi = snapYMax(yHi * 1.15);
    }
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
      const idx = state.indexOf(p);
      const anchorI = (isMfgMccb(p) || isMccb(p)) ? mfgEffectiveIn(enrichNormMccb(p)) : p.in;
      const text = `#${idx + 1} ${curveColorName(p, idx)}`;
      const w = ctx.measureText(text).width + 14;
      return { p, idx, text, anchorX: sx(anchorI), w };
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
    const items = [
      { label: tr('tcZoneThermal'), color: th.legendThermal, dash: [] },
      { label: tr('tcZoneMagnetic'), color: th.legendMagnetic, dash: [] },
    ];
    if (showShort) items.splice(1, 0, { label: tr('tcZoneShortTime'), color: th.legendMagnetic, dash: [5, 3] });

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

  /**
   * Courant max (A) pour le palier instantané MCB.
   * Ne jamais tronquer avant le seuil magnétique haut (ex. 10×In courbe C) :
   * un Icc bas (ex. 80 A sur C16) masquait sinon la verticale à 160 A.
   */
  function mcbCurveHighI(p) {
    const inA = Number(p?.in) > 0 ? Number(p.in) : 16;
    const curveKey = p?.curve || 'C';
    const mag = (Array.isArray(p?.magMult) && p.magMult.length >= 2)
      ? p.magMult
      : (CURVES[curveKey] || CURVES.C).mag;
    const floor = mag[1] * inA * 1.08;
    const icc = getIccA();
    if (icc && icc > floor) return Math.min(X_MAX, icc);
    return X_MAX;
  }

  /**
   * Convertit une borne { i, t } en points écran, en ne gardant que la partie
   * visible : évite le long segment horizontal collé au bord haut du graphe.
   */
  function thermalScreenPts(pts, sx, sy) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const above = pts[i].t > plotYHi;
      if (above && !(i + 1 < pts.length && pts[i + 1].t <= plotYHi)) continue;
      out.push({ x: sx(pts[i].i), y: sy(pts[i].t) });
    }
    return out;
  }

  /** Polyligne dense = courbe analytique (aucun lissage Bézier, donc aucun zigzag). */
  function pathPolyline(ctx, pts, reverse) {
    if (reverse) {
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y);
    } else {
      for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    }
  }

  function strokePolyline(ctx, pts, color, width) {
    if (!pts || pts.length < 2) return;
    prepCurveStroke(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  /**
   * Tracé MCB façon planche constructeur :
   *   thermique lisse → chute VERTICALE au seuil bas (ex. 5·In) pour la borne
   *   rapide et au seuil haut (ex. 10·In) pour la borne lente → palier
   *   instantané horizontal. Le remplissage est d'un seul tenant (aucun vide).
   */
  function drawMcbTunnel(ctx, o) {
    const { color: c, fastPts, slowPts, fMagX, sMagX, instY, bottomY, xEnd, inX } = o;
    // floorFromX : début du palier instantané « vivant » (suit Ii).
    // Par défaut = fMagX (MCB). Sur MCCB TM, = verticale Ii pour éviter
    // une horizontale figée sur Lo quand on règle Ii.
    const floorX = (o.floorFromX != null) ? o.floorFromX : fMagX;
    const slowEnd = slowPts[slowPts.length - 1];
    const fastEnd = fastPts[fastPts.length - 1];
    if (!slowEnd || !fastEnd) return;

    // Enveloppe complète : thermique lent → verticale haute → palier →
    // verticale basse → thermique rapide (retour)
    ctx.beginPath();
    ctx.moveTo(slowPts[0].x, slowPts[0].y);
    pathPolyline(ctx, slowPts, false);
    ctx.lineTo(sMagX, instY);
    ctx.lineTo(fMagX, instY);
    ctx.lineTo(fMagX, fastEnd.y);
    pathPolyline(ctx, fastPts, true);
    ctx.closePath();
    ctx.fillStyle = hexA(c, 0.09);
    ctx.fill();

    // Zone magnétique (entre les deux seuils) — le « C » plein des planches
    if (sMagX > fMagX + 1) {
      const inBand = slowPts.filter((pt) => pt.x >= fMagX - 0.5);
      ctx.beginPath();
      ctx.moveTo(fMagX, instY);
      ctx.lineTo(sMagX, instY);
      ctx.lineTo(sMagX, slowEnd.y);
      if (inBand.length) pathPolyline(ctx, inBand, true);
      ctx.lineTo(fMagX, fastEnd.y);
      ctx.closePath();
      ctx.fillStyle = hexA(c, 0.16);
      ctx.fill();
    }

    // Sous le palier instantané : à partir de floorX (Ii réglé), pas d'une Lo figée
    fillInstantSkirt(ctx, floorX, xEnd, instY, bottomY, c);

    // Contours — rouge thermique, bleu magnétique
    const cTh = activeDrawTheme.curveThermal;
    const cMag = activeDrawTheme.curveMagnetic;
    strokePolyline(ctx, slowPts, cTh, 2.2);
    strokePolyline(ctx, fastPts, cTh, 2);
    // Bande magnétique MCB (Lo≠Hi) : deux verticales. MCCB TM : Lo=Hi=Ii → une seule.
    if (sMagX > fMagX + 2) {
      strokeSeg(ctx, sMagX, slowEnd.y, sMagX, instY, cMag, 2.4);
      strokeSeg(ctx, fMagX, fastEnd.y, fMagX, instY, cMag, 2.2);
      const closeX = Math.min(Math.max(floorX, fMagX), sMagX);
      if (closeX > fMagX + 1) strokeSeg(ctx, fMagX, instY, closeX, instY, cMag, 2.2);
      if (floorX > fMagX + 2 && floorX < sMagX - 2) {
        strokeSeg(ctx, floorX, Math.min(slowEnd.y, fastEnd.y), floorX, instY, cMag, 2.4);
      }
    } else {
      strokeSeg(ctx, floorX, Math.min(slowEnd.y, fastEnd.y), floorX, instY, cMag, 2.4);
    }
    if (xEnd > floorX + 1) strokeSeg(ctx, floorX, instY, xEnd, instY, cMag, 2.4);

    if (inX != null) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = hexA(c, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inX, bottomY);
      ctx.lineTo(inX, o.topY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /** Disjoncteur norme / MCB catalogue — tunnel thermique + bande magnétique IEC 60898. */
  function drawNormBreakerZoned(ctx, p, sx, sy) {
    const curveP = isMfgMcb(p) ? { in: p.in, curve: p.curve || 'C', dev: 'mcb' } : p;
    const d = curveData(curveP);
    drawMcbTunnel(ctx, {
      color: p.color,
      slowPts: thermalScreenPts(d.slow.thermal, sx, sy),
      fastPts: thermalScreenPts(d.fast.thermal, sx, sy),
      sMagX: sx(d.slow.magI),
      fMagX: sx(d.fast.magI),
      instY: sy(d.slow.tInst),
      bottomY: sy(plotYLo),
      topY: sy(plotYHi),
      xEnd: sx(mcbCurveHighI(curveP)),
      inX: sx(p.in),
    });
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
    const xRange = plotXRange();
    const { xLo, xHi, inRef } = xRange;

    const sx = (i) => {
      const ic = Math.max(xLo, Math.min(xHi, i));
      return padL + lerpLog(ic, xLo, xHi) * plotW;
    };
    const sy = (t) => {
      const tc = Math.max(plotYLo, Math.min(plotYHi, t));
      return padT + (1 - lerpLog(tc, plotYLo, plotYHi)) * plotH;
    };
    geom = { padL, padT, plotW, plotH, plotYLo, plotYHi, xLo, xHi, inRef };

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
    drawGridX(ctx, sx, padT, plotH, plotW, xRange);
    drawGridY(ctx, sy, padL, plotW, plotYLo, plotYHi, !!inRef);

    // Axes labels
    ctx.fillStyle = th.axisTitle;
    ctx.textAlign = 'center';
    ctx.font = '11px system-ui,sans-serif';
    ctx.fillText(axisCurrentLabel(!!inRef), padL + plotW / 2, H - 12);
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axisTimeLabel(!!inRef), 0, 0);
    ctx.restore();

    // Ligne verticale Icc min (repère rouge, bien visible sans être trop épais)
    const iccA = getIccA();
    if (iccA && iccA >= xLo && iccA <= xHi) {
      ctx.setLineDash([]);
      ctx.strokeStyle = th.iccLine;
      ctx.lineWidth = 2.25;
      ctx.beginPath();
      ctx.moveTo(sx(iccA), sy(plotYLo));
      ctx.lineTo(sx(iccA), sy(plotYHi));
      ctx.stroke();
      ctx.fillStyle = th.iccText;
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px system-ui,sans-serif';
      const iccLbl = inRef
        ? (tr('tcIccLine') + ' ' + fmtCurrent(Math.round(iccA)) + ' A (' + fmtMult(iccA / inRef) + '×In)')
        : (tr('tcIccLine') + ' ' + fmtCurrent(Math.round(iccA)) + ' A');
      ctx.fillText(iccLbl, sx(iccA) + 5, sy(plotYLo) - 6);
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
        const I = Math.pow(10, Math.log10(xLo) + (px / plotW) * (Math.log10(xHi) - Math.log10(xLo)));
        const t = cableTime(cable, I);
        if (t > plotYHi * 1.2 || t < plotYLo / 1.2) { started = false; continue; }
        const X = padL + px, Y = sy(t);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // étiquette de la courbe câble (au point t ≈ 1 s)
      const Ilbl = cable.k * cable.S;  // I tel que t = 1 s
      if (Ilbl >= xLo && Ilbl <= xHi && state.length <= 2) {
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
    const xLo = geom.xLo ?? X_MIN;
    const xHi = geom.xHi ?? X_MAX;
    return Math.pow(10, Math.log10(xLo) + f * (Math.log10(xHi) - Math.log10(xLo)));
  }
  function invY(py) {
    const f = 1 - (py - geom.padT) / geom.plotH;
    const { plotYLo: yLo, plotYHi: yHi } = geom;
    return Math.pow(10, Math.log10(yLo) + f * (Math.log10(yHi) - Math.log10(yLo)));
  }
  function fmtMult(m) {
    if (!(m > 0) || !isFinite(m)) return '—';
    if (m >= 100) return String(Math.round(m));
    if (m >= 10) return String(Math.round(m * 10) / 10);
    if (m >= 1) return String(Math.round(m * 100) / 100);
    return m.toFixed(2);
  }
  function fmtIexact(v) {
    if (geom?.inRef) {
      return fmtMult(v / geom.inRef) + '×In';
    }
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

    // bulle : lecture exacte des coordonnées du point pointé (courant en X, temps en Y)
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const lines = ['I = ' + fmtIexact(I), 't = ' + fmtTexact(t)];

    const rowH = 16;
    const bh = 10 + lines.length * rowH;
    ctx.font = 'bold 12px system-ui,sans-serif';
    let maxW = 0;
    lines.forEach((l) => { maxW = Math.max(maxW, ctx.measureText(l).width); });
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
    ctx.font = 'bold 12px system-ui,sans-serif';
    lines.forEach((l, i) => {
      ctx.fillText(l, bx + 9, by + 13 + i * rowH);
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
    if (s <= 0) return '0 ms';
    if (s < 0.01) return +(s * 1000).toFixed(1) + ' ms';
    if (s < 1) return Math.round(s * 1000) + ' ms';
    if (s < 60) return (Number.isInteger(s) ? s : +s.toFixed(1)) + ' s';
    // Minutes / heures seulement quand le compte est rond, sinon secondes
    // (échelons constructeur 100, 200, 400, 1000, 2000 s…).
    if (s < 3600) {
      const min = s / 60;
      return Number.isInteger(min) ? min + ' min' : Math.round(s) + ' s';
    }
    const h = s / 3600;
    return Number.isInteger(h) ? h + ' h' : Math.round(s) + ' s';
  }

  /** Libellé axe Y — catalogue MCCB : ms / s / m / h ; sinon échelons MCB. */
  function fmtTimeAxis(v, catalogStyle) {
    if (catalogStyle) {
      if (v < 1) {
        const ms = v * 1000;
        return (Number.isInteger(ms) ? ms : +ms.toFixed(1)) + ' ms';
      }
      if (v < 60) return (Number.isInteger(v) ? v : +v.toFixed(1)) + ' s';
      if (v < 3600) {
        const m = v / 60;
        return (Number.isInteger(m) ? m : +m.toFixed(1)) + ' m';
      }
      const h = v / 3600;
      return (Number.isInteger(h) ? h : +h.toFixed(1)) + ' h';
    }
    return fmtTime(v);
  }

  function drawGridX(ctx, sx, padT, plotH, plotW, xRange) {
    const th = activeDrawTheme;
    const { xLo, xHi, inRef } = xRange || { xLo: X_MIN, xHi: X_MAX, inRef: null };
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'center';

    if (inRef) {
      // Catalogue MCCB : graduations en ×In (1 · 2 · 5 · 10 · 20 · 50 · 100)
      const labelMults = [1, 2, 3, 5, 10, 20, 30, 50, 100];
      const allMults = [];
      for (let dec = -1; dec <= 2; dec++) {
        const base = Math.pow(10, dec);
        for (let m = 1; m < 10; m++) allMults.push(base * m);
      }
      allMults.forEach((mult) => {
        const v = inRef * mult;
        if (v < xLo || v > xHi) return;
        const X = sx(v);
        const labeled = labelMults.includes(mult);
        ctx.strokeStyle = (mult === 1 || mult === 10 || mult === 100) ? th.gridDecade
          : labeled ? th.gridLabeled : th.gridMinor;
        ctx.beginPath();
        ctx.moveTo(X, padT);
        ctx.lineTo(X, padT + plotH);
        ctx.stroke();
      });
      let lastRight = -Infinity;
      for (const mult of labelMults) {
        const v = inRef * mult;
        if (v < xLo || v > xHi) continue;
        const X = sx(v);
        const major = (mult === 1 || mult === 10 || mult === 100);
        const txt = major ? String(mult) : String(mult);
        ctx.font = major ? 'bold 10px system-ui,sans-serif' : '9px system-ui,sans-serif';
        const halfW = ctx.measureText(txt).width / 2;
        if (X - halfW < lastRight + 6 && !major) continue;
        ctx.fillStyle = major ? th.axisXMajor : th.axisXMinor;
        ctx.fillText(txt, X, padT + plotH + 14);
        lastRight = X + halfW;
      }
      return;
    }

    // MCB / ampères — inchangé
    const labelMults = [1, 2, 3, 4, 5, 6, 8];
    for (let dec = 0; dec <= 4; dec++) {
      const base = Math.pow(10, dec);
      for (let m = 1; m < 10; m++) {
        const v = base * m;
        if (v < xLo || v > xHi) continue;
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
    const candidates = [];
    for (let dec = 0; dec <= 4; dec++) {
      const base = Math.pow(10, dec);
      for (const m of labelMults) {
        const v = base * m;
        if (v < xLo || v > xHi) continue;
        candidates.push({ v, m, X: sx(v) });
      }
    }
    let lastRight = -Infinity;
    for (const c of candidates) {
      const txt = fmtCurrent(c.v);
      const halfW = ctx.measureText(txt).width / 2;
      if (c.X - halfW < lastRight + 6 && c.m !== 1) continue;
      if (c.X - halfW < lastRight + 6 && c.m === 1) {
        if (c.X - halfW < lastRight + 2) continue;
      }
      ctx.fillStyle = c.m === 1 ? th.axisXMajor : th.axisXMinor;
      ctx.fillText(txt, c.X, padT + plotH + 12);
      lastRight = c.X + halfW;
    }
  }

  // Paliers de temps étiquetés : de 1 ms à 10 h
  /** Mêmes échelons que les planches constructeur (1 · 2 · 4 par décade). */
  const TIME_LABELS = Y_AXIS_TICKS;

  function drawGridY(ctx, sy, padL, plotW, yLo, yHi, catalogStyle) {
    const th = activeDrawTheme;
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'right';
    const decMin = Math.floor(Math.log10(yLo));
    const decMax = Math.ceil(Math.log10(yHi));
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
    const labels = catalogStyle ? Y_AXIS_TICKS_MCCB : TIME_LABELS;
    labels.forEach((v) => {
      if (v < yLo || v > yHi) return;
      const Y = sy(v);
      ctx.strokeStyle = th.gridTime;
      ctx.beginPath();
      ctx.moveTo(padL, Y);
      ctx.lineTo(padL + plotW, Y);
      ctx.stroke();
      ctx.fillStyle = th.axisY;
      ctx.fillText(fmtTimeAxis(v, catalogStyle), padL - 5, Y);
    });
  }

  /** Remplissage sous le plancher instantané (10 ms → bas du graphe) pour éviter la bande vide. */
  function fillInstantSkirt(ctx, x0, x1, instY, bottomY, color) {
    if (bottomY <= instY + 0.5 || x1 <= x0 + 1) return;
    ctx.beginPath();
    ctx.moveTo(x0, instY);
    ctx.lineTo(x1, instY);
    ctx.lineTo(x1, bottomY);
    ctx.lineTo(x0, bottomY);
    ctx.closePath();
    ctx.fillStyle = hexA(color, 0.06);
    ctx.fill();
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

  /** MCB constructeur — thermique catalogue + bande magnétique B/C/D/K/Z (même tracé que la norme). */
  function drawMfgMcb(ctx, p, sx, sy) {
    const mag = p.magMult || (CURVES[p.curve] || CURVES.C).mag;
    const anchors = p.longAnchors || THERMAL_SLOW;
    const inA = p.in;
    const magLo = mag[0];
    const magHi = mag[1];
    const slowRaw = [];
    const fastRaw = [];
    for (let m = I_NO_TRIP * 1.004; m < magHi; m *= 1.008) {
      const tS = interpLogLog(anchors, m) * MFG_TOL_SLOW;
      slowRaw.push({ i: m * inA, t: Math.min(tS, Y_DATA_CAP * 5) });
      if (m < magLo) {
        const tF = interpLogLog(anchors, m) * 0.35 * MFG_TOL_FAST;
        fastRaw.push({ i: m * inA, t: Math.min(tF, Y_DATA_CAP * 5) });
      }
    }
    slowRaw.push({ i: magHi * inA, t: Math.min(interpLogLog(anchors, magHi) * MFG_TOL_SLOW, Y_DATA_CAP * 5) });
    fastRaw.push({ i: magLo * inA, t: Math.min(interpLogLog(anchors, magLo) * 0.35 * MFG_TOL_FAST, Y_DATA_CAP * 5) });

    drawMcbTunnel(ctx, {
      color: p.color,
      slowPts: thermalScreenPts(slowRaw, sx, sy),
      fastPts: thermalScreenPts(fastRaw, sx, sy),
      sMagX: sx(magHi * inA),
      fMagX: sx(magLo * inA),
      instY: sy(p.instTS || T_INST_SLOW),
      bottomY: sy(plotYLo),
      topY: sy(plotYHi),
      xEnd: sx(mcbCurveHighI(p)),
      inX: sx(inA),
    });
  }

  /**
   * Tracé MCCB constructeur — DESSIN seulement (mêmes calculs / seuils catalogue) :
   *   thermique = courbe lisse (polyligne dense sur ancres catalogue),
   *   magnétique = une verticale au Ii réglé + palier horizontal (style logiciel pro).
   * Aucune diagonale sur la partie thermique.
   */
  function drawManufacturer(ctx, p, sx, sy) {
    const d = curveDataManufacturer(p);
    const c = p.color;
    const shortDash = [5, 3];
    const th = mfgThresholds(p);
    const isdX = sx(d.shortI);
    const iiX = sx(d.instI);
    const xEnd = sx(mfgCurveHighI(p, d));
    const instY = sy(d.instTS);
    const bottomY = sy(plotYLo);
    const topY = sy(plotYHi);
    const tsdPlateau = d.hasShortTime && d.tsd > d.instTS * 2.5;
    const tsdY = sy(Math.min(d.tsd, plotYHi));
    const tsdYFast = sy(Math.min(d.tsd * MFG_TOL_FAST, plotYHi));
    const cTh = activeDrawTheme.curveThermal;
    const cMag = activeDrawTheme.curveMagnetic;

    // ——— TM / Cat.A : thermique jusqu'au Ii réglé, puis 1 verticale + palier ———
    if (!d.hasShortTime) {
      const iiHiMult = (p.iiMax != null && p.iiMax > 0) ? p.iiMax : (p.ii || (th.iiA / p.in));
      const iiLoMult = (p.iiMin != null && p.iiMin > 0) ? p.iiMin : Math.max(2, iiHiMult * 0.7);
      const loMult = Math.min(iiLoMult, iiHiMult);
      const hiMult = Math.max(iiLoMult, iiHiMult);
      const iiSel = (p.ii != null && p.ii > 0)
        ? Math.min(hiMult, Math.max(loMult, p.ii))
        : hiMult;
      const scaled = mfgScaledAnchors(p, p.longAnchors || []);
      const slowRaw = [];
      const fastRaw = [];
      const m0 = th.noTripMult * 1.002;
      for (let m = m0; m < iiSel; m *= 1.006) {
        const t = interpLogLogDraw(scaled, m, iiSel);
        slowRaw.push({ i: m * p.in, t: Math.min(t * MFG_TOL_SLOW, Y_DATA_CAP * 5) });
        const tF = interpLogLogDraw(scaled, m, iiSel);
        fastRaw.push({ i: m * p.in, t: Math.min(tF * MFG_TOL_FAST, Y_DATA_CAP * 5) });
      }
      const tSlowIi = Math.min(interpLogLog(scaled, iiSel) * MFG_TOL_SLOW, Y_DATA_CAP * 5);
      const tFastIi = Math.min(interpLogLog(scaled, iiSel) * MFG_TOL_FAST, Y_DATA_CAP * 5);
      slowRaw.push({ i: iiSel * p.in, t: tSlowIi });
      fastRaw.push({ i: iiSel * p.in, t: tFastIi });

      const magX = sx(iiSel * p.in);
      drawMcbTunnel(ctx, {
        color: c,
        slowPts: thermalScreenPts(slowRaw, sx, sy),
        fastPts: thermalScreenPts(fastRaw, sx, sy),
        sMagX: magX,
        fMagX: magX,
        instY,
        bottomY,
        topY,
        xEnd,
        inX: sx(th.irA),
      });
      drawThresholdLabels(ctx, p, sx, sy, d);
      return;
    }

    // ——— Cat.B / court retard : thermique courbe → verticales Isd / Ii ———
    const slowPts = thermalScreenPts(
      d.long.map((pt) => ({ i: pt.i, t: pt.t * MFG_TOL_SLOW })),
      sx, sy
    );
    const fastPts = thermalScreenPts(
      d.long.map((pt) => ({ i: pt.i, t: pt.t * MFG_TOL_FAST })),
      sx, sy
    );
    if (!slowPts.length) return;

    // Forcer l'extrémité thermique pile sur Isd (évite toute diagonale)
    const kneeX = isdX;
    const slowEndY = slowPts[slowPts.length - 1].y;
    const fastEndY = (fastPts[fastPts.length - 1] || slowPts[slowPts.length - 1]).y;
    slowPts[slowPts.length - 1] = { x: kneeX, y: slowEndY };
    if (fastPts.length) fastPts[fastPts.length - 1] = { x: kneeX, y: fastEndY };

    ctx.beginPath();
    ctx.moveTo(slowPts[0].x, slowPts[0].y);
    pathPolyline(ctx, slowPts, false);
    if (tsdPlateau) {
      ctx.lineTo(kneeX, tsdY);
      ctx.lineTo(iiX, tsdY);
      ctx.lineTo(iiX, tsdYFast);
      ctx.lineTo(kneeX, tsdYFast);
    } else {
      ctx.lineTo(kneeX, instY);
      ctx.lineTo(iiX, instY);
      ctx.lineTo(kneeX, instY);
    }
    ctx.lineTo(fastPts[fastPts.length - 1].x, fastPts[fastPts.length - 1].y);
    pathPolyline(ctx, fastPts, true);
    ctx.closePath();
    ctx.fillStyle = hexA(c, 0.09);
    ctx.fill();
    // Palier instantané collé à Ii (bouge avec le réglage), pas ancré sur Isd
    fillInstantSkirt(ctx, iiX, xEnd, instY, bottomY, c);

    strokePolyline(ctx, slowPts, cTh, 2.2);
    strokePolyline(ctx, fastPts, cTh, 2);

    // Magnétique / SD : verticales + horizontales liées aux seuils (pas de tige orpheline à Ii)
    if (tsdPlateau) {
      strokeSeg(ctx, kneeX, slowEndY, kneeX, tsdY, cMag, 2.4);
      strokeSeg(ctx, kneeX, tsdY, iiX, tsdY, cMag, 2.2, shortDash);
      if (tsdY < instY - 1) strokeSeg(ctx, iiX, tsdY, iiX, instY, cMag, 2.4);
      strokeSeg(ctx, kneeX, fastEndY, kneeX, tsdYFast, cMag, 1.6);
      strokeSeg(ctx, kneeX, tsdYFast, iiX, tsdYFast, cMag, 1.5, shortDash);
    } else {
      // tsd ≈ instantané : chute à Isd, palier jusqu'à Ii, pas de barre verticale libre à Ii
      strokeSeg(ctx, kneeX, slowEndY, kneeX, instY, cMag, 2.4);
      strokeSeg(ctx, kneeX, fastEndY, kneeX, instY, cMag, 1.6);
      if (iiX > kneeX + 2) strokeSeg(ctx, kneeX, instY, iiX, instY, cMag, 2.2, shortDash);
    }
    if (xEnd > iiX + 1) strokeSeg(ctx, iiX, instY, xEnd, instY, cMag, 2.4);

    const inX = sx(d.irA);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(c, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(inX, bottomY);
    ctx.lineTo(inX, topY);
    ctx.stroke();
    ctx.setLineDash([]);

    drawThresholdLabels(ctx, p, sx, sy, d);
  }

  /** Seuils Ir / Isd / Ii — colonne marge droite, une seule courbe à la fois. */
  function drawThresholdLabels(ctx, p, sx, sy, d) {
    const idx = labelCurveIndex();
    if (idx < 0 || state[idx] !== p || !geom) return;
    const th = activeDrawTheme;
    const { padL, padT, plotW } = geom;
    const c = p.color;
    const marginX = padL + plotW - 5;
    const lines = [];
    lines.push(`Ir ${fmtIexact(d.irA)}`);
    if (d.hasShortTime) {
      lines.push(`Isd ${fmtIexact(d.shortI)} · ${fmtTime(d.tsd)}`);
      lines.push(`Ii ${fmtIexact(d.instI)}`);
    } else if (p.ii != null) {
      lines.push(`Ii ${fmtIexact(d.instI)}`);
    }
    let y = padT + 58;
    const step = 14;
    lines.forEach((text) => {
      drawLabelPill(ctx, text, marginX, y, c, th, 'right');
      y += step;
    });
  }

  /** Tracé fusible — une seule courbe nominale (pas de bande double). */
  function drawFuse(ctx, p, sx, sy) {
    const anchors = fuseAnchors(p.dev);
    const mid = fuseBoundary(p.in, anchors, 1).map((pt) => ({ x: sx(pt.i), y: sy(pt.t) }));
    if (!mid.length) return;
    strokePts(ctx, mid, p.color, 2.2, true);

    // ligne verticale In
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexA(p.color, 0.5);
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
  function axisCurrentLabel(catalogStyle) {
    return catalogStyle ? tr('tcAxisCurrentMult') : tr('tcAxisCurrent');
  }
  function axisTimeLabel(catalogStyle) {
    return catalogStyle ? tr('tcAxisTimeCatalog') : tr('tcAxisTime');
  }

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
    if (isMccb(p)) return `norm-mccb|${p.in}|${p.mccbCat || 'A'}|${p.ir}|${p.im}|${p.isd}|${p.tsd}|${p.ii}`;
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
        const target = state.find((x) => x.role === r && !x._preview);
        if (target) {
          // clearPreview() peut retirer une entrée : on repère la cible par référence
          clearPreview();
          const at = state.indexOf(target);
          if (at >= 0) {
            p.color = target.color;
            state[at] = p;
            return;
          }
        }
      }
    }
    const tuneIdx = labelCurveIndex();
    const tuneTarget = tuneIdx >= 0 && tuneIdx < state.length ? state[tuneIdx] : null;
    if (editIndex < 0 && formTouched && tuneTarget && p
      && deviceKey(p) === deviceKey(tuneTarget)) {
      clearPreview();
      const at = state.indexOf(tuneTarget);
      if (at >= 0) {
        const merged = mergeThresholdFields(tuneTarget, p);
        merged.color = tuneTarget.color;
        delete merged._preview;
        state[at] = merged;
        return;
      }
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
      assignCurveColor(p);
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
      if (p.mccbCat === 'B') {
        const isdEl = document.getElementById('tc-isd');
        const tsdEl = document.getElementById('tc-tsd');
        const iiEl = document.getElementById('tc-ii');
        const iiOff = document.getElementById('tc-ii-off');
        if (isdEl) isdEl.value = String(p.isd != null ? p.isd : 2);
        if (tsdEl) tsdEl.value = String(p.tsd != null ? p.tsd : 0.2);
        if (iiOff) iiOff.checked = p.ii == null;
        if (iiEl) {
          iiEl.value = String(p.ii != null ? p.ii : (p.im != null ? p.im : 10));
          iiEl.disabled = !!iiOff?.checked;
        }
      }
    }
    syncNormDeviceUI();
    g.ElectroDzTripCurveCatalog?.syncKindCardsUI?.();
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
    const hint = document.getElementById('tc-curve-color-hint');
    if (!box) return;
    if (!state.length) {
      box.innerHTML = `<span style="color:var(--muted);font-size:0.85rem">${tr('tcEmpty')}</span>`;
      if (hint) hint.hidden = true;
      return;
    }
    if (hint) hint.hidden = false;
    box.innerHTML = state.map((p, i) => {
      const roleCls = p.role === 'amont' ? ' tc-role-amont' : p.role === 'aval' ? ' tc-role-aval' : '';
      const roleLbl = p.role === 'amont' ? tr('tcRoleAmont') : p.role === 'aval' ? tr('tcRoleAval') : '';
      const editCls = i === editIndex ? ' tc-chip-edit' : '';
      const prevCls = p._preview ? ' tc-chip-preview' : '';
      const colName = curveColorName(p, i);
      const title = `${roleLbl ? roleLbl + ' — ' : ''}#${i + 1} ${colName} — ${legendChipTitle(p)} · ${tr('tcEditHint')}`;
      const removeLbl = tr('tcRemoveCurve');
      return `<div class="tc-chip${roleCls}${editCls}${prevCls}" style="--tc-chip:${p.color}">
        <button type="button" class="tc-chip-btn" data-tc-edit="${i}" title="${escapeAttr(title)}" aria-pressed="${i === editIndex ? 'true' : 'false'}">
          <span class="tc-dot" style="background:${p.color}" aria-hidden="true">${i + 1}</span>
          <span class="tc-chip-lbl">${escapeAttr(legendChipShort(p, i))}</span>
        </button>
        <button type="button" class="tc-chip-remove" data-tc-remove="${i}" title="${escapeAttr(removeLbl)}" aria-label="${escapeAttr(removeLbl)}">×</button>
      </div>`;
    }).join('');
    box.querySelectorAll('.tc-chip-btn[data-tc-edit]').forEach((chip) => {
      chip.addEventListener('click', () => {
        startEdit(parseInt(chip.dataset.tcEdit, 10));
      });
    });
    box.querySelectorAll('.tc-chip-remove[data-tc-remove]').forEach((btn) => {
      // Empêche le bouton d'édition voisin de prendre le focus / le geste
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.dataset.tcRemove, 10);
        if (!Number.isFinite(idx) || idx < 0 || idx >= state.length) return;
        state.splice(idx, 1);
        if (previewIndex === idx) previewIndex = -1;
        else if (previewIndex > idx) previewIndex--;
        // Ne pas appeler cancelEdit() après splice : il réinjectait le snapshot
        // sur la courbe suivante et faisait changer la couleur.
        if (editIndex === idx) {
          editIndex = -1;
          editSnapshot = null;
        } else if (editIndex > idx) {
          editIndex--;
        }
        // Empêche applyLivePreview de recréer un fantôme (nouvelle couleur)
        formTouched = false;
        setAddButtonMode();
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
      p.ir = clampNum(document.getElementById('tc-ir-norm')?.value, 0.4, 1, 1);
      if (cat === 'B') {
        p.isd = clampNum(document.getElementById('tc-isd')?.value, IEC_CAT_B.isdMin, IEC_CAT_B.isdMax, IEC_CAT_B.isdMult);
        p.tsd = clampNum(document.getElementById('tc-tsd')?.value, 0.001, 0.4, IEC_CAT_B.tsdSec);
        const iiOff = document.getElementById('tc-ii-off')?.checked;
        if (iiOff) {
          p.ii = null;
          p.im = clampNum(document.getElementById('tc-im')?.value, 1.5, 15, 10);
        } else {
          p.ii = clampNum(document.getElementById('tc-ii')?.value, 1.5, 15, 10);
          p.im = p.ii;
        }
        p.hasShortTime = true;
      } else {
        p.im = clampNum(document.getElementById('tc-im')?.value, 1.5, 15, 10);
        p.ii = p.im;
        p.hasShortTime = false;
      }
    }
    return p;
  }

  function parseRefModel() {
    const ref = document.getElementById('tc-ref-model')?.value || 'mcb';
    if (ref === 'mccb-a') return { dev: 'mccb', cat: 'A' };
    if (ref === 'mccb-b') return { dev: 'mccb', cat: 'B' };
    if (ref === 'gg' || ref === 'am' || ref === 't') return { dev: ref, cat: 'A' };
    return { dev: 'mcb', cat: 'A' };
  }

  function refModelFromDevice(dev, mccbCat) {
    if (dev === 'mccb') return mccbCat === 'B' ? 'mccb-b' : 'mccb-a';
    if (dev === 'gg' || dev === 'am' || dev === 't') return dev;
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
    const isMccbA = dev === 'mccb' && cat === 'A';
    const isMccbB = dev === 'mccb' && cat === 'B';
    const isFuseDev = dev === 'gg' || dev === 'am' || dev === 't';
    // Type fusible (gG/aM/T) = pastilles sous « Type de protection », pas ici.
    show('tc-role-group', !isFuseDev);
    show('tc-in-group', true);
    show('tc-curve-group', isMcb);
    show('tc-ir-group-norm', isMccbA || isMccbB);
    show('tc-im-group', isMccbA);
    updateNormSettingsHint(dev, cat);
    syncGraphThresholdsPanel();
  }

  function updateNormSettingsHint(dev, cat) {
    const hint = document.getElementById('tc-settings-hint');
    if (!hint) return;
    const parts = [];
    if (dev === 'mcb') {
      parts.push(tr('tcNormHintMcb'));
      parts.push(tr('tcNormNoAdjustHint'));
    } else if (dev === 'mccb' && cat === 'A') {
      parts.push(tr('tcNormHintMccbA'));
    } else if (dev === 'mccb' && cat === 'B') {
      parts.push(tr('tcNormHintMccbB'));
    } else if (dev === 'gg' || dev === 'am' || dev === 't') {
      parts.push(tr(dev === 't' ? 'tcNormHintFuseT' : 'tcNormHintFuse'));
    }
    hint.textContent = parts.filter(Boolean).join(' ');
  }

  function setTuneGroupVisible(id, on) {
    const el = document.getElementById(id);
    if (!el) return;
    if (on) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  }

  /** Panneau Isd/Tsd/Ii pour MCCB Cat. B générique (essais hors catalogue). */
  function applyNormCatBTuneUI() {
    const isdEl = document.getElementById('tc-isd');
    const iiEl = document.getElementById('tc-ii');
    const iiOff = document.getElementById('tc-ii-off');
    const tsdEl = document.getElementById('tc-tsd');
    const selectEl = document.getElementById('tc-tsd-select');
    const rangeEl = document.getElementById('tc-tsd-range');
    const hintEl = document.getElementById('tc-tsd-range-hint');
    setTuneGroupVisible('tc-ir-group', false);
    setTuneGroupVisible('tc-tr-group', false);
    setTuneGroupVisible('tc-isd-group', true);
    setTuneGroupVisible('tc-tsd-group', true);
    setTuneGroupVisible('tc-ii-group', true);
    if (isdEl) {
      isdEl.min = String(IEC_CAT_B.isdMin);
      isdEl.max = String(IEC_CAT_B.isdMax);
      isdEl.step = '0.1';
      if (!isdEl.value) isdEl.value = String(IEC_CAT_B.isdMult);
    }
    if (iiEl) {
      iiEl.min = '1.5';
      iiEl.max = '15';
      iiEl.step = '0.5';
      if (!iiEl.value) iiEl.value = '10';
      iiEl.disabled = !!(iiOff && iiOff.checked);
    }
    if (iiOff) iiOff.style.display = '';
    const vals = IEC_CAT_B.tsdValues;
    if (selectEl) {
      selectEl.hidden = false;
      selectEl.innerHTML = vals.map((v) => {
        const lbl = v < 0.01 ? `${Math.round(v * 1000)} ms` : `${String(v).replace('.', ',')} s`;
        return `<option value="${v}">${lbl}</option>`;
      }).join('');
      const cur = parseFloat(tsdEl?.value || String(IEC_CAT_B.tsdSec));
      const snap = vals.reduce((best, x) => (Math.abs(x - cur) < Math.abs(best - cur) ? x : best), vals[0]);
      selectEl.value = String(snap);
      if (tsdEl) tsdEl.value = String(snap);
    }
    if (tsdEl) tsdEl.hidden = true;
    if (rangeEl) rangeEl.hidden = true;
    if (hintEl) {
      hintEl.hidden = false;
      hintEl.textContent = tr('tcNormCatBTuneHint');
    }
  }

  /** Panneau sous le graphe : réglages Cat. B générique ou constructeur. */
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
      if (normRo) normRo.hidden = true;
      if (mfgTune) {
        if (isCatB) {
          mfgTune.classList.remove('tc-mfg-hidden');
          mfgTune.hidden = false;
          applyNormCatBTuneUI();
        } else {
          mfgTune.hidden = true;
        }
      }
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
    assignCurveColor(p);
    state.push(p);
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
      assignCurveColor(p);
      state.push(p);
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
      if (!isMfgMccb(target) && !isMccb(target)) return;
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

    // Graphe vide au départ — l'utilisateur ajoute les protections manuellement.
    if (Cat) {
      Cat.loadCatalog().then(() => refresh());
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
