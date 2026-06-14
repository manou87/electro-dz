/**
 * Calculs BT type Caneco — formules publiques (IEC 60364 / NF C 15-100).
 * Ne remplace pas Caneco™ (ALPI) : pas de tables constructeur certifiées.
 *
 * Module conservé pour réactivation ultérieure (onglet désactivé par défaut).
 * Voir ENABLE_CANECO_BT dans js/calcul-electrique.js et CANECO_BT_DISABLED dans calcul-electrique.html.
 */
(function (g) {
  'use strict';

  /** Résistivité conducteur à 90 °C (Ω·mm²/m) — usage boucle de défaut / adiabatique. */
  const RHO_90 = { cu: 0.0225, al: 0.036 };

  const CABLE_K = {
    cu: { pvc: 115, pr: 143, xlpe: 143 },
    al: { pvc: 76, pr: 94, xlpe: 94 },
  };

  /** Exemples de départs (PVC Cu) — pré-remplissage rapide. */
  const PRESETS = [
    { id: 'prise_2_5', labelFr: 'Départ prises 2,5 mm² PVC', labelAr: 'مخرج 2,5 مم² PVC', S: 2.5, L: 20, mat: 'cu', ins: 'pvc', inA: 16, curve: 'C', u0: 230 },
    { id: 'eclairage_1_5', labelFr: 'Éclairage 1,5 mm² PVC', labelAr: 'إضاءة 1,5 مم² PVC', S: 1.5, L: 25, mat: 'cu', ins: 'pvc', inA: 10, curve: 'C', u0: 230 },
    { id: 'depart_6', labelFr: 'Départ 6 mm² PVC', labelAr: 'مخرج 6 مم² PVC', S: 6, L: 35, mat: 'cu', ins: 'pvc', inA: 32, curve: 'C', u0: 230 },
    { id: 'depart_16', labelFr: 'Départ 16 mm² PVC', labelAr: 'مخرج 16 مم² PVC', S: 16, L: 45, mat: 'cu', ins: 'pvc', inA: 63, curve: 'C', u0: 230 },
    { id: 'gros_25_pr', labelFr: 'Ligne 25 mm² PR/XLPE', labelAr: 'خط 25 مم² PR/XLPE', S: 25, L: 60, mat: 'cu', ins: 'pr', inA: 80, curve: 'C', u0: 230 },
  ];

  function normMat(m) {
    const v = String(m || 'cu').toLowerCase();
    return v === 'al' || v === 'aluminium' ? 'al' : 'cu';
  }

  function normIns(ins) {
    const v = String(ins || 'pvc').toLowerCase();
    if (v === 'pr' || v === 'xlpe' || v === 'epr') return 'pr';
    return 'pvc';
  }

  /** Rac ou Rpe à 90 °C : R = ρ₉₀ × L / S */
  function rConductor90(lengthM, sectionMm2, material) {
    const L = parseFloat(lengthM);
    const S = parseFloat(sectionMm2);
    if (!Number.isFinite(L) || L <= 0 || !Number.isFinite(S) || S <= 0) return null;
    const rho = RHO_90[normMat(material)] || RHO_90.cu;
    return (rho * L) / S;
  }

  function zsLoop(zeOhm, racOhm, rpeOhm, earthing) {
    const ze = parseFloat(zeOhm);
    const rac = parseFloat(racOhm);
    if (!Number.isFinite(ze) || ze < 0 || !Number.isFinite(rac) || rac < 0) return null;
    const earth = String(earthing || 'TN').toUpperCase();
    if (earth === 'TT') return ze + rac;
    const rpe = Number.isFinite(parseFloat(rpeOhm)) && parseFloat(rpeOhm) >= 0
      ? parseFloat(rpeOhm) : rac;
    return ze + rac + rpe;
  }

  function iaFromZs(u0Volts, zsOhm) {
    const u0 = parseFloat(u0Volts);
    const zs = parseFloat(zsOhm);
    if (!Number.isFinite(u0) || u0 <= 0 || !Number.isFinite(zs) || zs <= 1e-9) return null;
    return u0 / zs;
  }

  function cableK(material, insulation) {
    const m = normMat(material);
    const i = normIns(insulation);
    return (CABLE_K[m] || CABLE_K.cu)[i] || 115;
  }

  /** Énergie admissible câble (A²·s) = k² S² */
  function cableEnergyMax(sectionMm2, material, insulation) {
    const S = parseFloat(sectionMm2);
    if (!Number.isFinite(S) || S <= 0) return null;
    const k = cableK(material, insulation);
    return Math.pow(k * S, 2);
  }

  /**
   * Étude boucle complète (logique Caneco simplifiée).
   * @param {object} p — ze, lengthM, sectionMm2, sectionPeMm2?, material, u0, earthing, rpeManual?
   */
  function loopStudy(p) {
    const L = parseFloat(p.lengthM);
    const S = parseFloat(p.sectionMm2);
    const Spe = parseFloat(p.sectionPeMm2) || S;
    const ze = parseFloat(p.zeOhm);
    const u0 = parseFloat(p.u0Volts) || 230;
    const earth = p.earthing || 'TN';

    const rac = rConductor90(L, S, p.material);
    const rpe = p.rpeManualOhm != null && p.rpeManualOhm !== ''
      ? parseFloat(p.rpeManualOhm)
      : rConductor90(L, Spe, p.material);
    const zs = rac != null && Number.isFinite(ze) ? zsLoop(ze, rac, rpe, earth) : null;
    const ia = zs != null ? iaFromZs(u0, zs) : null;

    return {
      rho90: RHO_90[normMat(p.material)],
      racOhm: rac,
      rpeOhm: rpe,
      zsOhm: zs,
      iaA: ia,
      iaKA: ia != null ? ia / 1000 : null,
      u0,
      earthing: earth,
      k: cableK(p.material, p.insulation),
    };
  }

  g.ElectroDzCanecoBT = {
    RHO_90,
    CABLE_K,
    PRESETS,
    rConductor90,
    rac90Ohm: rConductor90,
    zsLoop,
    iaFromZs,
    cableK,
    cableEnergyMax,
    loopStudy,
    normMat,
    normIns,
  };
})(typeof window !== 'undefined' ? window : globalThis);
