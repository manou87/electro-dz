/**
 * Interface calculateur — étude BT type Caneco (boucle Zs, Ia, temps de coupure).
 */
(function (g) {
  'use strict';

  const BT = () => g.ElectroDzCanecoBT;
  const Extra = () => g.ElectroDzCalcExtra;

  function getT(lang) {
    const k = lang === 'ar' ? 'ar' : 'fr';
    const ui = g.ElectroDzCalcI18n ? g.ElectroDzCalcI18n[k] : {};
    return ui;
  }

  function fmtOhm(x) {
    if (x == null || !Number.isFinite(x)) return '—';
    if (x < 0.001) return (x * 1000).toFixed(2) + ' mΩ';
    return x.toFixed(4) + ' Ω';
  }

  function fmtA(x) {
    if (x == null || !Number.isFinite(x)) return '—';
    if (x >= 1000) return (x / 1000).toFixed(2) + ' kA';
    return Math.round(x) + ' A';
  }

  function calculateCanecoStudy(opts) {
    const t = getT(opts.lang);
    const lib = BT();
    if (!lib) return { error: true, message: t.canecoErrLoad || 'Module Caneco BT absent' };

    const ze = parseFloat(opts.zeOhm);
    const L = parseFloat(opts.lengthM);
    const S = parseFloat(opts.sectionMm2);
    if (!Number.isFinite(ze) || ze < 0 || !Number.isFinite(L) || L <= 0 || !Number.isFinite(S) || S <= 0) {
      return { error: true, message: t.canecoErrValues || 'Ze, L et S requis' };
    }

    const loop = lib.loopStudy({
      zeOhm: ze,
      lengthM: L,
      sectionMm2: S,
      sectionPeMm2: opts.sectionPeMm2,
      material: opts.material,
      insulation: opts.insulation,
      u0Volts: opts.u0,
      earthing: opts.earthing,
      rpeManualOhm: opts.rpeManual,
    });

    const lines = [];
    lines.push((t.canecoLineRho || 'ρ₉₀ = {rho} Ω·mm²/m').replace('{rho}', String(loop.rho90)));
    lines.push((t.canecoLineRac || 'Rac (90 °C) = {r}').replace('{r}', fmtOhm(loop.racOhm)));
    lines.push((t.canecoLineRpe || 'Rpe (90 °C) = {r}').replace('{r}', fmtOhm(loop.rpeOhm)));
    lines.push((t.canecoLineZs || 'Zs = Ze + Rac + Rpe = {z}').replace('{z}', fmtOhm(loop.zsOhm)));
    lines.push((t.canecoLineIa || 'Ia = U₀ / Zs = {i}').replace('{i}', fmtA(loop.iaA)));

    let tMax = null;
    let tMaxCode = '';
    const extra = Extra();
    if (extra?.computeMaxDisconnectionTimeIEC) {
      const u0n = parseFloat(opts.u0) || 230;
      const res = extra.computeMaxDisconnectionTimeIEC(
        opts.earthing || 'TN',
        u0n,
        opts.circuitKind || 'socket_32'
      );
      tMax = res.seconds;
      tMaxCode = res.code;
    }

    if (tMax != null) {
      lines.push((t.canecoLineTmax || 't maxi CEI 60364-4-41 : {t} s').replace('{t}', String(tMax)));
    }

    const inA = parseFloat(opts.deviceIn);
    const curve = opts.deviceCurve || 'C';
    let tDev = null;
    let tDevCode = '';
    if (extra?.estimateMcBreakingTimeSeconds && loop.iaA != null) {
      const est = extra.estimateMcBreakingTimeSeconds(inA, curve, loop.iaA / 1000);
      tDev = est.seconds;
      tDevCode = est.explCode;
    }

    if (inA > 0 && loop.iaA != null) {
      if (tDev != null) {
        const ok = tMax != null && tDev <= tMax;
        lines.push(
          (t.canecoLineTdev || 't disjoncteur estimé @ Ia : {t} s ({curve} {in} A)')
            .replace('{t}', String(tDev))
            .replace('{curve}', curve)
            .replace('{in}', String(inA))
        );
        lines.push(ok
          ? (t.canecoOkTrip || '✅ Coupure probable avant t maxi (modèle indicatif)')
          : (t.canecoBadTrip || '⛔ Vérifier : t disjoncteur > t maxi ou zone thermique'));
      } else {
        lines.push(t.canecoThermalZone || 'ℹ️ Courant Ia dans zone thermique du disjoncteur — temps non estimé (courbe ou MCCB).');
      }
    }

    const icc = parseFloat(opts.iccA);
    if (Number.isFinite(icc) && icc > 0 && loop.iaA != null) {
      lines.push(
        (t.canecoLineIccCmp || 'Icc saisi {icc} A vs Ia calculée {ia} A')
          .replace('{icc}', String(Math.round(icc)))
          .replace('{ia}', String(Math.round(loop.iaA)))
      );
    }

    const eMax = lib.cableEnergyMax(S, opts.material, opts.insulation);
    if (eMax != null && loop.iaA != null && extra) {
      const tClear = icc > 0 ? (icc * icc) / eMax : null;
      if (tClear != null && Number.isFinite(tClear)) {
        lines.push(
          (t.canecoLineAdiab || 'Tenue adiabatique câble (k={k}) : t_adm ≈ {t} s @ Icc')
            .replace('{k}', String(loop.k))
            .replace('{t}', tClear < 0.01 ? '<10 ms' : tClear.toFixed(3))
        );
      }
    }

    return {
      ok: true,
      data: {
        formula: t.canecoFormula || 'Boucle de défaut (Caneco-type)',
        result: loop.iaA != null ? (loop.iaA / 1000).toFixed(2) : '—',
        unit: 'kA',
        interpretation: lines.join('\n'),
        additionalData: {
          iaA: loop.iaA != null ? loop.iaA.toFixed(0) : '',
          zs_mohm: loop.zsOhm != null ? (loop.zsOhm * 1000).toFixed(2) : '',
        },
      },
    };
  }

  g.ElectroDzCanecoBTCalc = { calculateCanecoStudy };
})(typeof window !== 'undefined' ? window : globalThis);
