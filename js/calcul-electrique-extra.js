/**
 * Calculs additionnels — même logique que app/calculator.tsx (lignes helpers + fonctions).
 */
(function (g) {
  'use strict';

  const COPPER_CONSTANTS = { resistivity: 1.68e-8, temperatureCoefficient: 0.00393, referenceTemp: 20 };
  const transformerData = [
    { kva: 25, ucc: 4, losses: 750 }, { kva: 50, ucc: 4, losses: 1100 }, { kva: 100, ucc: 4, losses: 1750 },
    { kva: 160, ucc: 4, losses: 2350 }, { kva: 250, ucc: 4, losses: 3250 }, { kva: 315, ucc: 4, losses: 3900 },
    { kva: 400, ucc: 4, losses: 4650 }, { kva: 500, ucc: 4, losses: 5500 }, { kva: 630, ucc: 4, losses: 6500 },
    { kva: 800, ucc: 6, losses: 8400 }, { kva: 1000, ucc: 6, losses: 10500 }, { kva: 1250, ucc: 6, losses: 11000 },
    { kva: 1600, ucc: 6, losses: 14000 }, { kva: 2000, ucc: 6, losses: 18000 }, { kva: 2500, ucc: 6, losses: 22000 },
    { kva: 3150, ucc: 7, losses: 29500 },
  ];
  const REACTANCE_K = 0.08;
  const LINE_RHO_OHM_MM2M = { Cu: 0.01786, Al: 0.0283 };

  const DDR_SELECTIVITY_META = {
    'AC-AC': { selectivity: 'totale' }, 'AC-A': { selectivity: 'non' }, 'AC-B': { selectivity: 'non' },
    'AC-F': { selectivity: 'non' }, 'AC-EV': { selectivity: 'non' }, 'AC-B+': { selectivity: 'non' },
    'A-AC': { selectivity: 'non' }, 'A-A': { selectivity: 'totale' }, 'A-B': { selectivity: 'non' },
    'A-F': { selectivity: 'non' }, 'A-EV': { selectivity: 'non' }, 'A-B+': { selectivity: 'non' },
    'B-AC': { selectivity: 'non' }, 'B-A': { selectivity: 'non' }, 'B-B': { selectivity: 'totale' },
    'B-F': { selectivity: 'non' }, 'B-EV': { selectivity: 'non' }, 'B-B+': { selectivity: 'non' },
    'F-AC': { selectivity: 'non' }, 'F-A': { selectivity: 'non' }, 'F-B': { selectivity: 'non' },
    'F-F': { selectivity: 'totale' }, 'F-EV': { selectivity: 'non' }, 'F-B+': { selectivity: 'non' },
    'EV-AC': { selectivity: 'non' }, 'EV-A': { selectivity: 'non' }, 'EV-B': { selectivity: 'non' },
    'EV-F': { selectivity: 'non' }, 'EV-EV': { selectivity: 'totale' }, 'EV-B+': { selectivity: 'non' },
    'B+-AC': { selectivity: 'non' }, 'B+-A': { selectivity: 'non' }, 'B+-B': { selectivity: 'non' },
    'B+-F': { selectivity: 'non' }, 'B+-EV': { selectivity: 'non' }, 'B+-B+': { selectivity: 'totale' },
  };

  function getT(lang) {
    const core = g.ElectroDzCalcCore;
    const k = lang === 'ar' ? 'ar' : 'fr';
    const base = core && core._getT ? core._getT(k) : {};
    const ui = g.ElectroDzCalcI18n ? (k === 'ar' ? g.ElectroDzCalcI18n.ar : g.ElectroDzCalcI18n.fr) : {};
    const extra = {
      fr: {
        totalSelectivity: 'Sélectivité totale', partialSelectivity: 'Sélectivité partielle',
        nullSelectivity: 'Non sélectif', breakerSelectivity: 'Sélectivité disjoncteurs',
        iccInterpretationHigh: 'Icc élevé', iccInterpretationNormal: 'Icc normal',
        iccAlertInvalidValues: 'Valeurs invalides',
      },
      ar: {
        totalSelectivity: 'انتقائية كاملة', partialSelectivity: 'انتقائية جزئية',
        nullSelectivity: 'غير انتقائي', breakerSelectivity: 'انتقائية القواطع',
        iccInterpretationHigh: 'Icc مرتفع', iccInterpretationNormal: 'Icc طبيعي',
        iccAlertInvalidValues: 'قيم غير صالحة',
      },
    };
    return { ...extra[k], ...ui, ...base };
  }

  function computeMaxDisconnectionTimeIEC(earthing, u0, circuit) {
    if (earthing === 'IT') return { seconds: null, code: 'IT' };
    if (!Number.isFinite(u0) || u0 <= 0) return { seconds: null, code: 'INVALID' };
    if (u0 <= 120) {
      if (circuit === 'portable') return { seconds: 0.8, code: 'U_LE_120_PORT' };
      return { seconds: 5, code: 'U_LE_120_OTHER' };
    }
    if (u0 <= 230) {
      if (circuit === 'socket_32') return { seconds: 0.4, code: 'U_LE_230_SOCKET' };
      if (circuit === 'portable') return { seconds: 0.4, code: 'U_LE_230_PORT' };
      if (circuit === 'distribution') return { seconds: 5, code: 'U_LE_230_DIST' };
      return { seconds: 5, code: 'U_LE_230_FIXED' };
    }
    if (u0 <= 400) {
      if (circuit === 'socket_32') return { seconds: 0.4, code: 'U_LE_400_SOCKET' };
      return { seconds: 0.4, code: 'U_LE_400_OTHER' };
    }
    return { seconds: 5, code: 'FALLBACK' };
  }

  function estimateMcBreakingTimeSeconds(inA, curve, ikA) {
    if (!Number.isFinite(inA) || inA <= 0 || !Number.isFinite(ikA) || ikA <= 0) {
      return { seconds: null, explCode: 'INVALID' };
    }
    const r = ikA / inA;
    if (curve === 'B') {
      if (r < 3) return { seconds: null, explCode: 'THERMAL' };
      if (r < 5) return { seconds: 0.3, explCode: 'MAG_SLOW' };
      if (r < 50) return { seconds: 0.05, explCode: 'MAG_FAST' };
      return { seconds: 0.02, explCode: 'INSTANT' };
    }
    if (curve === 'C') {
      if (r < 5) return { seconds: null, explCode: 'THERMAL' };
      if (r < 10) return { seconds: 0.25, explCode: 'MAG_SLOW' };
      if (r < 50) return { seconds: 0.05, explCode: 'MAG_FAST' };
      return { seconds: 0.02, explCode: 'INSTANT' };
    }
    if (r < 10) return { seconds: null, explCode: 'THERMAL' };
    if (r < 20) return { seconds: 0.2, explCode: 'MAG_SLOW' };
    if (r < 50) return { seconds: 0.05, explCode: 'MAG_FAST' };
    return { seconds: 0.02, explCode: 'INSTANT' };
  }

  function estimateIkFromLineLoop(u0Volts, lengthM, sectionMm2, material, zeOhm) {
    if (!Number.isFinite(u0Volts) || u0Volts <= 0) return null;
    if (!Number.isFinite(lengthM) || lengthM <= 0) return null;
    if (!Number.isFinite(sectionMm2) || sectionMm2 <= 0) return null;
    if (!Number.isFinite(zeOhm) || zeOhm < 0) return null;
    const rho = LINE_RHO_OHM_MM2M[material];
    const rLoop = (2 * rho * lengthM) / sectionMm2;
    const zTot = zeOhm + rLoop;
    if (zTot <= 1e-9) return null;
    return { ikA: Math.min(u0Volts / zTot, 50000), rLoopOhm: rLoop, zTotOhm: zTot };
  }

  function ddrDesc(t, key) {
    const k = `selectivity_${key.replace(/\+/g, 'plus').replace(/-/g, '_')}`;
    return t[k] || '';
  }

  const BREAKING_NORM_MAP = {
    IT: 'breakingTimeExplIT',
    INVALID: 'breakingTimeExplInvalid',
    U_LE_120_PORT: 'breakingTimeExpl120Port',
    U_LE_120_OTHER: 'breakingTimeExpl120Other',
    U_LE_230_SOCKET: 'breakingTimeExpl230Socket',
    U_LE_230_PORT: 'breakingTimeExpl230Port',
    U_LE_230_DIST: 'breakingTimeExpl230Dist',
    U_LE_230_FIXED: 'breakingTimeExpl230Fixed',
    U_LE_400_SOCKET: 'breakingTimeExpl400Socket',
    U_LE_400_OTHER: 'breakingTimeExpl400Other',
    FALLBACK: 'breakingTimeExplFallback',
  };

  const BREAKING_DEVICE_MAP = {
    THERMAL: 'breakingTimeDeviceExplThermal',
    MAG_SLOW: 'breakingTimeDeviceExplMagSlow',
    MAG_FAST: 'breakingTimeDeviceExplMagFast',
    INSTANT: 'breakingTimeDeviceExplInstant',
    INVALID: 'breakingTimeDeviceExplInvalid',
  };

  function breakingNormExpl(t, code) {
    const key = BREAKING_NORM_MAP[code] || 'breakingTimeExplFallback';
    return t[key] || t.breakingTimeExplFallback || code;
  }

  function breakingDeviceExpl(t, code) {
    const key = BREAKING_DEVICE_MAP[code];
    return key ? (t[key] || code) : (t.breakingTimeExplFallback || code);
  }

  function calculateIntensity(opts) {
    const t = getT(opts.lang);
    const P = parseFloat(opts.power);
    const U = parseFloat(opts.voltage);
    const cosPhiValue = parseFloat(opts.cosPhi);
    if (!opts.power || !opts.voltage || isNaN(P) || isNaN(U) || isNaN(cosPhiValue)) {
      return { error: true, message: t.calcAlertPowerVoltage || 'power+voltage' };
    }
    const isTriphase = U >= 400;
    const I = isTriphase ? P / (U * cosPhiValue * Math.sqrt(3)) : P / (U * cosPhiValue);
    return {
      ok: true,
      data: {
        formula: isTriphase ? 'I = P / (U × cos φ × √3)' : 'I = P / (U × cos φ)',
        result: I.toFixed(2),
        unit: 'A',
      },
    };
  }

  function calculateVoltage(opts) {
    const t = getT(opts.lang);
    const I = parseFloat(opts.current);
    const R = parseFloat(opts.resistance);
    if (!opts.current || !opts.resistance || isNaN(I) || isNaN(R)) {
      return { error: true, message: t.calcAlertCurrentResistance };
    }
    return { ok: true, data: { formula: 'U = R × I', result: (R * I).toFixed(2), unit: 'V' } };
  }

  function calculateResistance(opts) {
    const t = getT(opts.lang);
    const U = parseFloat(opts.voltage);
    const I = parseFloat(opts.current);
    if (!opts.voltage || !opts.current || isNaN(U) || isNaN(I) || I === 0) {
      return { error: true, message: t.calcAlertVoltageCurrent };
    }
    const isTriphase = U >= 400;
    const R = isTriphase ? U / (I * Math.sqrt(3)) : U / I;
    return {
      ok: true,
      data: {
        formula: isTriphase ? 'R = U / (I × √3)' : 'R = U / I',
        result: R.toFixed(2),
        unit: 'Ω',
      },
    };
  }

  function calculateEnergy(opts) {
    const t = getT(opts.lang);
    const P = parseFloat(opts.power);
    const duration = parseFloat(opts.time);
    if (!opts.power || !opts.time || isNaN(P) || isNaN(duration)) {
      return { error: true, message: t.calcAlertPowerTime };
    }
    const E = P * duration;
    return { ok: true, data: { formula: 'E = P × t', result: E.toFixed(2), unit: 'Wh' } };
  }

  function calculateCopperResistance(opts) {
    const t = getT(opts.lang);
    const L = parseFloat(opts.length);
    const S = parseFloat(opts.section);
    const T = parseFloat(opts.temperature);
    if (!opts.length || !opts.section || !opts.temperature || isNaN(L) || isNaN(S) || isNaN(T) || S <= 0 || L <= 0) {
      return { error: true, message: t.calcAlertLengthSectionTemp || t.invalidValues };
    }
    const rho0 = COPPER_CONSTANTS.resistivity * 1e6;
    const R0 = (rho0 * L) / S;
    const deltaT = T - COPPER_CONSTANTS.referenceTemp;
    const R = R0 * (1 + COPPER_CONSTANTS.temperatureCoefficient * deltaT);
    return {
      ok: true,
      data: {
        formula: 'R = R₀(1 + αΔT)',
        result: R.toFixed(6),
        unit: 'Ω',
        interpretation: (t.copperInterpDetail || 'R₂₀ = {r20} Ω · ΔT = {dt} °C')
          .replace('{r20}', R0.toFixed(6))
          .replace('{dt}', deltaT.toFixed(1)),
      },
    };
  }

  function calculateSelectivity(opts) {
    const t = getT(opts.lang);
    const upstreamB = parseFloat(opts.upstreamBreaker);
    const downstreamB = parseFloat(opts.downstreamBreaker);
    if (isNaN(upstreamB) || isNaN(downstreamB)) {
      return { error: true, message: t.calcAlertFillSelectivity };
    }
    const breakerRatio = upstreamB / downstreamB;
    const instantFactors = { B: 3, C: 5, D: 10, K: 8, Z: 2 };
    const uc = opts.upstreamCurve || 'C';
    const dc = opts.downstreamCurve || 'C';
    const ui = instantFactors[uc] || 5;
    const di = instantFactors[dc] || 5;
    const breakerSelective = breakerRatio >= 2.5 && ui * upstreamB > di * downstreamB;
    const ddrKey = `${opts.upstreamDDRType || 'AC'}-${opts.downstreamDDRType || 'AC'}`;
    const meta = DDR_SELECTIVITY_META[ddrKey] || { selectivity: 'non' };
    const ddrSelective = meta.selectivity === 'totale';
    const ddrDescTxt = ddrDesc(t, ddrKey) || t.selectivityTypesMismatch;
    let count = (breakerSelective ? 1 : 0) + (opts.isSelectiveDDR ? 1 : 0) + (ddrSelective ? 1 : 0);
    const level =
      count === 3 ? t.totalSelectivity : count >= 1 ? t.partialSelectivity : t.nullSelectivity;
    return {
      ok: true,
      data: {
        result: level,
        breakerRatio: breakerRatio.toFixed(2),
        interpretation: `${t.breakerSelectivity || 'Disj.'}: ${breakerRatio.toFixed(2)} ${breakerSelective ? '✅' : '❌'}\nDDR: ${ddrDescTxt}`,
      },
    };
  }

  function calculateICC(opts) {
    const t = getT(opts.lang);
    const Sn = parseFloat(opts.transfoKva);
    const Ucc = parseFloat(opts.transfoUcc);
    const Pcc_amont = parseFloat(opts.upstreamPcc) || 500;
    const L = parseFloat(opts.length);
    const S = parseFloat(opts.section);
    const Un = parseFloat(opts.voltage);
    if (isNaN(Sn) || isNaN(Ucc) || isNaN(L) || isNaN(S)) {
      return { error: true, message: t.iccAlertInvalidValues || t.invalidValues };
    }
    const isTri = Un >= 400;
    const c_max = 1.05;
    const Un_volts = isTri ? 400 : 230;
    const Z_up = (c_max * Math.pow(Un_volts, 2)) / (Pcc_amont * 1e6);
    const X_up = 0.995 * Z_up;
    const R_up = 0.1 * X_up;
    const Z_tr = (Ucc / 100) * (Math.pow(Un_volts, 2) / (Sn * 1000));
    const tData = transformerData.find((d) => d.kva === Sn);
    let R_tr = 0;
    if (tData) {
      const In = (Sn * 1000) / (Un_volts * Math.sqrt(3));
      R_tr = tData.losses / (3 * Math.pow(In, 2));
    } else {
      R_tr = Sn >= 630 ? 0.1 * Z_tr : 0.15 * Z_tr;
    }
    const X_tr = Math.sqrt(Math.pow(Z_tr, 2) - Math.pow(R_tr, 2));
    const rho = opts.conductorType === 'Cu' ? 0.01851 : 0.02941;
    const R_c = (rho * L) / S;
    const X_c = (REACTANCE_K / 1000) * L;
    const R_tot = R_up + R_tr + R_c;
    const X_tot = X_up + X_tr + X_c;
    const Z_tot = Math.sqrt(R_tot * R_tot + X_tot * X_tot);
    const Icc = isTri ? (c_max * Un_volts) / (Math.sqrt(3) * Z_tot) : (c_max * Un_volts) / Z_tot;
    const Icc_ka = Icc / 1000;
    return {
      ok: true,
      data: {
        formula: isTri ? 'Icc = (c × Un) / (√3 × Z_tot)' : 'Icc = (c × Un) / Z_tot',
        result: Icc_ka.toFixed(2),
        unit: 'kA',
        interpretation: Icc_ka > 10 ? t.iccInterpretationHigh : t.iccInterpretationNormal,
      },
    };
  }

  function calculatePowerBalance(opts) {
    const t = getT(opts.lang);
    const cosPhiVal = parseFloat(String(opts.cosPhi).replace(',', '.')) || 0.9;
    if (cosPhiVal <= 0 || cosPhiVal > 1) return { error: true, message: t.calcAlertCosPhiRange };
    const Uline = parseFloat(opts.voltage) || 230;
    const isTri = Uline >= 400;
    const detailRows = [];
    for (const row of opts.rows || []) {
      const pi = parseFloat(String(row.p).replace(',', '.'));
      if (isNaN(pi) || pi <= 0) continue;
      let ku = parseFloat(String(row.ku).replace(',', '.'));
      let ks = parseFloat(String(row.ks).replace(',', '.'));
      if (isNaN(ku) || ku < 0) ku = 1;
      if (isNaN(ks) || ks < 0) ks = 1;
      detailRows.push({ label: row.label || '—', pi, ku, ks, pdem: pi * ku * ks });
    }
    if (!detailRows.length) return { error: true, message: t.calcAlertPowerBalanceMin };
    const pTotalW = detailRows.reduce((s, r) => s + r.pdem, 0);
    if (pTotalW <= 0) return { error: true, message: t.calcAlertPowerBalancePositive };
    const ib = isTri ? pTotalW / (Math.sqrt(3) * Uline * cosPhiVal) : pTotalW / (Uline * cosPhiVal);
    const pTotalKw = pTotalW / 1000;
    return {
      ok: true,
      data: {
        formula: 'Pd = Σ (Pi × Ku × Ks)',
        result: pTotalKw.toFixed(2),
        unit: 'kW',
        additionalData: { ibA: ib.toFixed(2), pTotalW: pTotalW.toFixed(0) },
        interpretation: detailRows.map((r) => `• ${r.label}: ${r.pdem.toFixed(0)} W`).join('\n'),
      },
    };
  }

  function calculateBreakingTime(opts) {
    const t = getT(opts.lang);
    if (opts.subMode === 'device') {
      const inA = parseFloat(opts.deviceIn);
      const ikA = parseFloat(opts.deviceIk);
      if (!Number.isFinite(inA) || inA <= 0 || !Number.isFinite(ikA) || ikA <= 0) {
        return { error: true, message: t.breakingTimeDeviceExplInvalid || t.invalidValues };
      }
      const est = estimateMcBreakingTimeSeconds(inA, opts.deviceCurve || 'C', ikA);
      if (est.seconds === null) {
        return {
          ok: true,
          data: { result: '—', unit: '', interpretation: breakingDeviceExpl(t, est.explCode) },
        };
      }
      return {
        ok: true,
        data: {
          result: String(est.seconds),
          unit: 's',
          interpretation: breakingDeviceExpl(t, est.explCode),
        },
      };
    }
    const u0Num = opts.u0 === '120' ? 120 : opts.u0 === '400' ? 400 : 230;
    const { seconds, code } = computeMaxDisconnectionTimeIEC(
      opts.earthing || 'TN',
      u0Num,
      opts.circuitKind || 'socket_32'
    );
    if (seconds === null) {
      return { ok: true, data: { result: '—', unit: '', interpretation: breakingNormExpl(t, code) } };
    }
    const rounded = Math.round(seconds * 10) / 10;
    return {
      ok: true,
      data: {
        result: rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1),
        unit: 's',
        interpretation: breakingNormExpl(t, code),
      },
    };
  }

  g.ElectroDzCalcExtra = {
    calculateIntensity,
    calculateVoltage,
    calculateResistance,
    calculateEnergy,
    calculateCopperResistance,
    calculateSelectivity,
    calculateICC,
    calculatePowerBalance,
    calculateBreakingTime,
  };
})(typeof window !== 'undefined' ? window : globalThis);
