/** Porté depuis utils/cableThermalIEC60364.ts (app SwissDZ) */
/**
 * Dimensionnement thermique des canalisations — base IEC 60364-5-52 (Fig. G20 Guide Schneider /
 * tableau B.52.4 CEI), facteurs de groupement k4 (Fig. G16 / B.52.17 CEI).
 * Alignement NF C 15-100 : extrait Tableau 10 (courant nominal disjoncteur) pour Cu, PVC, 3 conducteurs chargés.
 *
 * Réf. : fr.electrical-installation.org — « Courants admissibles… Fig. G20 » ; groupement Fig. G16.
 */
/** Sections commerciales usuelles (mm²), ordre croissant */
const IEC_SECTIONS_MM2 = [
    1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000,
];
/** Calibres « colonnes » Tableau 10 NF / disjoncteurs (A) */
/** Calibres disjoncteurs / Ib — Tableau 10 NF + calibres TGBT (jusqu'à 2500 A) */
const NFC_BREAKER_COLUMNS = [
    10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
    800, 1000, 1250, 1600, 2000, 2500,
];
/** Courants admissibles Iz (A) — Cu, PVC, 3G, Fig. G20 (30 °C air / 20 °C sol pour D) */
const IZ_CU_PVC_G20 = {
    A1: {
        1.5: 13.5, 2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56, 25: 73, 35: 89, 50: 108, 70: 136, 95: 164,
        120: 188, 150: 216, 185: 245, 240: 286, 300: 328,
    },
    A2: {
        1.5: 13, 2.5: 17.5, 4: 23, 6: 29, 10: 39, 16: 52, 25: 68, 35: 83, 50: 99, 70: 125, 95: 150,
        120: 172, 150: 196, 185: 223, 240: 261, 300: 298,
    },
    B1: {
        1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207,
        120: 239, 150: 262, 185: 296, 240: 346, 300: 394,
    },
    B2: {
        1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99, 50: 118, 70: 149, 95: 179,
        120: 206, 150: 225, 185: 255, 240: 297, 300: 339,
    },
    C: {
        1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 96, 35: 119, 50: 144, 70: 184, 95: 223,
        120: 259, 150: 299, 185: 341, 240: 403, 300: 464,
    },
    D1: {
        1.5: 18, 2.5: 24, 4: 30, 6: 38, 10: 50, 16: 64, 25: 82, 35: 98, 50: 116, 70: 143, 95: 169,
        120: 192, 150: 217, 185: 243, 240: 280, 300: 316,
    },
    D2: {
        1.5: 19, 2.5: 24, 4: 33, 6: 41, 10: 54, 16: 70, 25: 92, 35: 110, 50: 130, 70: 162, 95: 193,
        120: 220, 150: 246, 185: 278, 240: 320, 300: 359,
    },
};
/** E / F / G : pas dans G20 sous ces lettres — approximation professionnelle courante */
function izCuResolved(section, methodId) {
    const izC = IZ_CU_PVC_G20.C[section];
    const izB2 = IZ_CU_PVC_G20.B2[section];
    const izA1 = IZ_CU_PVC_G20.A1[section];
    if (methodId === 'E') {
        return Math.round((izC + izB2) / 2 + (izC - izB2) * 0.35);
    }
    if (methodId === 'F') {
        return Math.round(izC * 1.12);
    }
    if (methodId === 'G') {
        return Math.round(izA1 * 0.92);
    }
    const col = IZ_CU_PVC_G20[methodId];
    if (col && col[section] != null)
        return col[section];
    return izC;
}
/** Courants admissibles Iz (A) — Al, PVC, 3G, Fig. G20 */
const IZ_AL_PVC_G20 = {
    A1: {
        2.5: 14, 4: 18.5, 6: 24, 10: 32, 16: 43, 25: 57, 35: 70, 50: 84, 70: 107, 95: 129, 120: 149,
        150: 170, 185: 194, 240: 227, 300: 261,
    },
    A2: {
        2.5: 13.5, 4: 17.5, 6: 23, 10: 31, 16: 41, 25: 53, 35: 65, 50: 78, 70: 98, 95: 118, 120: 135,
        150: 155, 185: 176, 240: 207, 300: 237,
    },
    B1: {
        2.5: 16.5, 4: 22, 6: 28, 10: 39, 16: 53, 25: 70, 35: 86, 50: 104, 70: 133, 95: 161, 120: 186,
        150: 204, 185: 230, 240: 269, 300: 306,
    },
    B2: {
        2.5: 15.5, 4: 21, 6: 27, 10: 36, 16: 48, 25: 62, 35: 77, 50: 92, 70: 116, 95: 139, 120: 160,
        150: 176, 185: 199, 240: 232, 300: 265,
    },
    C: {
        2.5: 18.5, 4: 25, 6: 32, 10: 44, 16: 59, 25: 73, 35: 90, 50: 110, 70: 140, 95: 170, 120: 197,
        150: 227, 185: 259, 240: 305, 300: 351,
    },
    D1: {
        2.5: 18.5, 4: 24, 6: 30, 10: 39, 16: 50, 25: 64, 35: 77, 50: 91, 70: 112, 95: 132, 120: 150,
        150: 169, 185: 190, 240: 218, 300: 247,
    },
    D2: {
        2.5: 18.5, 4: 24, 6: 30, 10: 39, 16: 53, 25: 69, 35: 83, 50: 99, 70: 122, 95: 148, 120: 169,
        150: 189, 185: 214, 240: 250, 300: 282,
    },
};
function izAlResolved(section, methodId) {
    const izC = IZ_AL_PVC_G20.C[section];
    if (methodId === 'E' || methodId === 'F') {
        return Math.round((izC ?? 0) * 1.08);
    }
    if (methodId === 'G') {
        const izA1 = IZ_AL_PVC_G20.A1[section];
        return Math.round((izA1 ?? izC) * 0.92);
    }
    const col = IZ_AL_PVC_G20[methodId];
    if (col && col[section] != null)
        return col[section];
    return izC ?? 0;
}
/**
 * k4 — groupement, circuits à l'air (Fig. G16 CEI).
 * Méthode C : simple couche sur paroi (ligne 2 du guide).
 * E / F : tablettes perforées / chemins (ligne 4).
 * Autres (A, B, D, G) : groupement général « jointifs » (ligne 1).
 */
function groupingFactorK4Iec60364(methodId, circuits) {
    const n = Math.min(Math.max(Math.round(circuits), 1), 20);
    const idx = Math.min(n - 1, 11);
    const rowC = [1.0, 0.85, 0.79, 0.75, 0.73, 0.72, 0.72, 0.71, 0.7, 0.7, 0.7, 0.7];
    const rowEF = [1.0, 0.88, 0.82, 0.77, 0.75, 0.73, 0.73, 0.72, 0.72, 0.72, 0.72, 0.72];
    const rowGen = [1.0, 0.8, 0.7, 0.65, 0.6, 0.57, 0.54, 0.52, 0.5, 0.45, 0.41, 0.38];
    if (methodId === 'C')
        return rowC[idx] ?? 0.7;
    if (methodId === 'E' || methodId === 'F')
        return rowEF[idx] ?? 0.72;
    return rowGen[idx] ?? 0.38;
}
/** k4 — méthode D, câbles enterrés jointifs (Fig. G18, simplifié : jointifs nulle distance) */
function groupingFactorK4Buried(circuits) {
    const n = Math.min(Math.max(Math.round(circuits), 1), 20);
    const map = {
        1: 1.0, 2: 0.75, 3: 0.65, 4: 0.6, 5: 0.55, 6: 0.5, 7: 0.45, 8: 0.43, 9: 0.41, 12: 0.36, 16: 0.32, 20: 0.29,
    };
    return map[n] ?? 0.29;
}
function getIz(section, methodId, conductor) {
    if (conductor === 'Al')
        return izAlResolved(section, methodId);
    return izCuResolved(section, methodId);
}
/** Facteur k1 température ambiante / sol — réutilise la même logique que calculator.tsx */
function tempFactorAmbient(insulationType, tempC, buried) {
    const factors = insulationType === 'PVC'
        ? [
            { temp: 10, factor: 1.22 }, { temp: 15, factor: 1.15 }, { temp: 20, factor: 1.1 },
            { temp: 25, factor: 1.08 }, { temp: 30, factor: 1.0 }, { temp: 35, factor: 0.91 },
            { temp: 40, factor: 0.82 }, { temp: 45, factor: 0.71 }, { temp: 50, factor: 0.58 },
            { temp: 55, factor: 0.41 }, { temp: 60, factor: 0.0 },
        ]
        : [
            { temp: 10, factor: 1.15 }, { temp: 15, factor: 1.12 }, { temp: 20, factor: 1.08 },
            { temp: 25, factor: 1.05 }, { temp: 30, factor: 1.0 }, { temp: 35, factor: 0.94 },
            { temp: 40, factor: 0.87 }, { temp: 45, factor: 0.79 }, { temp: 50, factor: 0.71 },
            { temp: 55, factor: 0.61 }, { temp: 60, factor: 0.5 }, { temp: 65, factor: 0.38 },
            { temp: 70, factor: 0.24 }, { temp: 75, factor: 0.0 },
        ];
    if (buried) {
        const soil = [
            { temp: 10, factor: 1.1 }, { temp: 15, factor: 1.05 }, { temp: 20, factor: 1.0 },
            { temp: 25, factor: 0.95 }, { temp: 30, factor: 0.89 }, { temp: 35, factor: 0.84 },
            { temp: 40, factor: 0.77 }, { temp: 45, factor: 0.71 }, { temp: 50, factor: 0.63 },
        ];
        const sorted = [...soil].sort((a, b) => a.temp - b.temp);
        return interpolateFactor(tempC, sorted);
    }
    const sorted = [...factors].sort((a, b) => a.temp - b.temp);
    return interpolateFactor(tempC, sorted);
}
function interpolateFactor(tempC, sorted) {
    if (tempC <= sorted[0].temp)
        return sorted[0].factor;
    if (tempC >= sorted[sorted.length - 1].temp)
        return sorted[sorted.length - 1].factor;
    for (let i = 0; i < sorted.length - 1; i++) {
        const t1 = sorted[i].temp;
        const t2 = sorted[i + 1].temp;
        if (tempC >= t1 && tempC <= t2) {
            const f1 = sorted[i].factor;
            const f2 = sorted[i + 1].factor;
            return f1 + (f2 - f1) * (tempC - t1) / (t2 - t1);
        }
    }
    return 1.0;
}
/** PR/XLPE : Iz plus élevé — facteur indicatif sur Iz PVC 70 °C */
function insulationIzMultiplier(insulationType) {
    if (insulationType === 'PVC')
        return 1.0;
    return 1.12;
}
/**
 * Extrait Tableau 10 NF C 15-100 (courant nominal disjoncteur = colonne), Cu PVC, 3 conducteurs, 70 °C âme.
 * Complété pour 100 A d’après tableau officiel (méthodes de réf. A1…F, D).
 */
const NFC15_TABLE10_EXTRACT_CU_PVC = {
    100: {
        A1: { 1: 50 },
        A2: { 1: 50 },
        B1: { 1: 35 },
        B2: { 1: 35, 2: 50, 3: 70 },
        C: { 1: 25, 2: 35, 3: 50 },
        D1: { 1: 35 },
        D2: { 1: 35 },
        E: { 1: 25 },
        F: { 1: 25, 2: 25, 3: 25 },
        G: { 1: 50 },
    },
};
function snapBreakerColumn(ib) {
    for (const c of NFC_BREAKER_COLUMNS) {
        if (c >= ib)
            return c;
    }
    return NFC_BREAKER_COLUMNS[NFC_BREAKER_COLUMNS.length - 1];
}
function nfcTable10Lookup(ib, methodId, circuits) {
    const col = snapBreakerColumn(ib);
    const row = NFC15_TABLE10_EXTRACT_CU_PVC[col];
    if (!row)
        return null;
    const m = row[methodId];
    if (!m)
        return null;
    const c = Math.min(Math.max(Math.round(circuits), 1), 20);
    if (m[c] != null)
        return m[c];
    const keys = Object.keys(m)
        .map(Number)
        .sort((a, b) => a - b);
    const nearest = keys.filter((k) => k <= c).pop();
    if (nearest != null && m[nearest] != null)
        return m[nearest];
    return m[keys[0]] ?? null;
}
function computeThermalSizing(ib, section, methodId, circuits, conductor, insulationType, airOrSoilTempC) {
    const buried = methodId === 'D1' || methodId === 'D2';
    const k1 = tempFactorAmbient(insulationType, airOrSoilTempC, buried);
    const k4 = buried ? groupingFactorK4Buried(circuits) : groupingFactorK4Iec60364(methodId, circuits);
    let iz = getIz(section, methodId, conductor);
    iz *= insulationIzMultiplier(insulationType);
    const effectiveIz = iz * k1 * k4;
    const ibPrime = ib;
    return { ibPrime, k1, k4, izTable: iz, effectiveIz };
}
/** Vérifie si la section supporte Ib (thermique) */
function thermalOk(ib, section, methodId, circuits, conductor, insulationType, airOrSoilTempC) {
    if (conductor === 'Cu' && insulationType === 'PVC') {
        const t10 = nfcTable10Lookup(ib, methodId, circuits);
        if (t10 != null && Math.abs(t10 - section) < 1e-6)
            return true;
    }
    const { effectiveIz } = computeThermalSizing(ib, section, methodId, circuits, conductor, insulationType, airOrSoilTempC);
    return effectiveIz >= ib - 1e-6;
}
/**
 * Section minimale (mm²) pour Ib — priorité extrait Tableau 10 NF si disponible (Cu PVC),
 * sinon parcours des sections normalisées avec Iz G20 × k1 × k4.
 */
function findMinSectionThermal(ib, methodId, circuits, conductor, insulationType, airOrSoilTempC, sectionsOrdered) {
    if (conductor === 'Cu' && insulationType === 'PVC') {
        const t10 = nfcTable10Lookup(ib, methodId, circuits);
        if (t10 != null) {
            return { section: t10, source: 'nfc15_table10', nfcCol: snapBreakerColumn(ib) };
        }
    }
    for (const s of sectionsOrdered) {
        if (thermalOk(ib, s, methodId, circuits, conductor, insulationType, airOrSoilTempC)) {
            return { section: s, source: 'iec_g20' };
        }
    }
    return { section: sectionsOrdered[sectionsOrdered.length - 1], source: 'iec_g20' };
}

if (typeof window !== 'undefined') {
  window.ElectroDzCableThermal = {
    IEC_SECTIONS_MM2,
    NFC_BREAKER_COLUMNS,
    groupingFactorK4Iec60364,
    nfcTable10Lookup,
    computeThermalSizing,
    thermalOk,
    findMinSectionThermal,
  };
}
