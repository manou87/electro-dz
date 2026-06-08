/**
 * Points de courbes t(I) issus de sources publiques (pas Caneco / EDIELEC).
 * Utilisé par trip-curve-catalog-lib.js et build-all-trip-catalogs.js
 *
 * Références :
 * - Schneider DOCA0217EN / DOCA0141EN — Micrologic long-time (tr @ 6·Ir)
 * - ABB 1SDC210099D0205 — Tmax XT thermique (ex. 3·I1, In=250 A)
 * - IEC 60898-1 — essais 1,13·In / 1,45·In / 2,55·In (MCB B/C/D)
 * - IEC 60947-2 — courbes K / Z
 */
const INST_TS_MCCB = 0.02;
const INST_TS_MCB = 0.01;
/** Valeurs tr Micrologic / Ekip (temps @ 6·Ir) — DOCA0141 */
const TR_VALUES_SEC = [0.5, 1, 2, 4, 8, 16, 24];
const TR_REF_SEC = 1;

/** MCB — seuils magnétiques (multiples In) par courbe CEI */
const MCB_MAG = {
  B: [3, 5],
  C: [5, 10],
  D: [10, 20],
  K: [8, 14],
  Z: [2, 3],
};

/** Scale temps long-time : proportionnel à tr (référence tr @ 6·Ir = TR_REF_SEC). */
function scaleAnchorsByTr(anchors, trSec, refTr = TR_REF_SEC) {
  if (!anchors?.length || !trSec || trSec === refTr) return anchors;
  const k = trSec / refTr;
  return anchors.map(([m, t]) => [m, t >= 1e5 ? t : Math.max(t * k, 0.001)]);
}

/**
 * ComPacT NSX — Micrologic 5/6/7 (DOCA0141EN-03, tr affiché = temps @ 6·Ir).
 * Colonne tr=1 s : 1,5·Ir → 25 s ; 6·Ir → 1 s ; 7,2·Ir → 0,7 s.
 */
const SCHNEIDER_NSX_MIC_TR1 = {
  sourceId: 'schneider-DOCA0141EN',
  source: 'Schneider DOCA0141EN-03 (NSX Micrologic, tr=1 s @ 6·Ir)',
  anchors: [
    [1.05, 1e6],
    [1.5, 25],
    [3, 4],
    [4, 2],
    [6, 1],
    [7.2, 0.7],
    [10, 0.7],
  ],
  instTS: INST_TS_MCCB,
};

/** ComPacT NS (legacy) — DOCA0217EN, même colonne tr=1 s */
const SCHNEIDER_MIC_LONG_TR1 = {
  sourceId: 'schneider-DOCA0217EN',
  source: 'Schneider DOCA0217EN (ComPacT NS Micrologic, tr=1 s)',
  anchors: [
    [1.05, 1e6],
    [1.5, 25],
    [3, 4],
    [4, 2],
    [6, 1],
    [7.2, 0.69],
    [10, 0.69],
  ],
  instTS: INST_TS_MCCB,
};

/** NSX défaut usine tr=16 s @ 6·Ir (DOCA0141) */
const SCHNEIDER_NSX_MIC_TR16 = {
  sourceId: 'schneider-DOCA0141EN',
  source: 'Schneider DOCA0141EN-03 (NSX, tr défaut 16 s @ 6·Ir)',
  anchors: [
    [1.05, 1e6],
    [1.5, 400],
    [3, 64],
    [4, 32],
    [6, 16],
    [7.2, 11],
    [10, 11],
  ],
  instTS: INST_TS_MCCB,
};

/** Micrologic — tr = 2 s */
const SCHNEIDER_MIC_LONG_TR2 = {
  sourceId: 'schneider-DOCA0217EN',
  source: 'Schneider DOCA0217EN (tr=2 s)',
  anchors: [
    [1.05, 1e6],
    [1.5, 50],
    [3, 8],
    [4, 4],
    [6, 2],
    [7.2, 1.38],
    [10, 1.38],
  ],
  instTS: INST_TS_MCCB,
};

/** ABB Tmax TMD — bande thermique (ex. XT3N 250 A, 3·I1 : 31,5–107,9 s froid) */
const ABB_TMA_THERMAL = {
  sourceId: 'abb-tmax-xt',
  source: 'ABB 1SDC210099D0205 — TMD thermique (40 °C, 3·I1)',
  anchors: [
    [1.05, 1e6],
    [1.13, 3600],
    [1.5, 900],
    [2, 200],
    [3, 50],
    [4, 15],
    [6, 3],
  ],
  instTS: INST_TS_MCCB,
};

/** ABB Ekip — zone long inverse (calage NSX tr=1 s, doc Ekip Touch) */
const ABB_EKIP_LONG = {
  sourceId: 'abb-ekip',
  source: 'ABB 1SDH002031A1002 Ekip Touch — long-time (indicatif, proche NSX)',
  anchors: SCHNEIDER_NSX_MIC_TR1.anchors,
  instTS: INST_TS_MCCB,
};

/** Thermique modulaire IEC 60898-1 @ 30 °C (enveloppe type essai) */
const IEC_60898_THERMAL = {
  sourceId: 'iec-60898',
  source: 'IEC 60898-1 — non-déclenchement 1,13·In / déclenchement 1,45·In ≤ 1 h',
  anchors: [
    [1.13, 1e6],
    [1.45, 3600],
    [2.0, 300],
    [2.55, 60],
    [4, 12],
  ],
};

/** Hager MCB — thermique IEC 60898 @ 30 °C */
const HAGER_MCB_THERMAL = IEC_60898_THERMAL;

/** Schneider TM-D / TM-G — thermique fixe (pas Ir réglable type Micrologic) */
const SCHNEIDER_TM_THERMAL = {
  sourceId: 'schneider-DOCA0140EN',
  source: 'Schneider TM-D/TM-G — protection thermique (DOCA0140)',
  anchors: [
    [1.05, 1e6],
    [1.3, 800],
    [1.5, 120],
    [2, 25],
    [3, 8],
    [5, 2],
    [8, 0.8],
    [10, 0.5],
  ],
  instTS: INST_TS_MCCB,
};

/** MA moteur — magnétique dominante */
const SCHNEIDER_MA_MAG = {
  sourceId: 'schneider-DOCA0140EN',
  source: 'Schneider MA — magnétique (moteur)',
  anchors: [[1.05, 1e6], [12, 0.02], [14, 0.02]],
  instTS: 0.02,
};

/** Pas de temps catalogue (s) — valeurs constructeur documentées. */
function secSteps(min, max, step) {
  const out = [];
  for (let v = min; v <= max + step * 0.5; v += step) {
    out.push(Math.round(v * 1000) / 1000);
  }
  return out;
}

/** Tsd par famille d’organe (sources publiques constructeur). */
const TSD_PROFILES = {
  /** Micrologic 2.3 LSoI — retard court fixe 0,2 s (So), DOCA0141. */
  mic_23_fixed: {
    values: [0.2],
    default: 0.2,
    unit: 's',
    fixed: true,
    source: 'Schneider DOCA0141 — Micrologic 2.3 (So = 0,2 s fixe)',
  },
  /** Micrologic 2.4 / 3.x / 4.x — court retard réglable. */
  mic_34: {
    values: [0.1, 0.2, 0.3, 0.4],
    default: 0.2,
    unit: 's',
    source: 'Schneider — Micrologic 2.4 / 3 / 4 (court retard I²t)',
  },
  /** Micrologic 5 / 6 / 7 — tsd 0 à 0,4 s (I²t OFF). */
  mic_567: {
    values: [0, 0.1, 0.2, 0.3, 0.4],
    default: 0.2,
    unit: 's',
    source: 'Schneider DOCA0141 — Micrologic 5/6/7',
  },
  /** TM-G / TM-Gb Schneider. */
  schneider_tm: {
    values: [0.1, 0.2, 0.3, 0.4],
    default: 0.2,
    unit: 's',
    source: 'Schneider — TM-G court retard',
  },
  /** ABB Ekip / Tmax XT — t2 : 0,05 à 0,8 s (pas 0,05 s), doc. 9AKK108467. */
  abb_tmax: {
    values: secSteps(0.05, 0.8, 0.05),
    default: 0.2,
    unit: 's',
    source: 'ABB Ekip Touch — retard court t2 (0,05–0,8 s)',
  },
  /** ABB PR121/122/123 (Tmax T). */
  abb_pr: {
    values: [0.1, 0.2, 0.3, 0.4, 0.5],
    default: 0.2,
    unit: 's',
    source: 'ABB PR — retard court',
  },
  /** Hager HX TM+. */
  hager_tm: {
    values: [0.1, 0.2, 0.3, 0.4],
    default: 0.2,
    unit: 's',
    source: 'Hager HX — temporisation court retard',
  },
};

const ST_SETTINGS = {
  ir: { min: 0.4, max: 1, step: 0.01, default: 1, unit: 'xIn' },
  isd: { min: 1.5, max: 10, step: 0.1, default: 2, unit: 'xIr' },
  tsd: { ...TSD_PROFILES.mic_34 },
  ii: { min: 2, max: 10, step: 0.5, default: 10, unit: 'xIn', off: true },
  tr: { values: TR_VALUES_SEC, default: 1, unit: 's', refSec: TR_REF_SEC },
};

const ST_SETTINGS_HI_II = {
  ...ST_SETTINGS,
  ii: { min: 2, max: 15, step: 0.5, default: 10, unit: 'xIn', off: true },
};

const NO_ST_SETTINGS = {
  ir: { min: 0.4, max: 1, step: 0.01, default: 1, unit: 'xIn' },
  isd: null,
  tsd: null,
  ii: { min: 2, max: 10, step: 0.5, default: 10, unit: 'xIn', off: false },
};

const PUBLIC_SOURCES = [
  {
    id: 'schneider-nsx-micrologic',
    title: 'Schneider ComPacT NSX — Micrologic 5/6/7',
    doc: 'DOCA0141EN-03',
    url: 'https://www.productinfo.schneider-electric.com/compactnsxlegacymicrologic_5_6_7/doca0141-compact-nsx-legacy-micrologic-5_6_7/English/DOCA0141EN-03.pdf',
  },
  {
    id: 'schneider-micrologic',
    title: 'Schneider ComPacT NS — Micrologic trip units',
    doc: 'DOCA0217EN',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=DOCA0217EN',
  },
  {
    id: 'schneider-tcc',
    title: 'Schneider — Time-Current Curves library',
    url: 'https://www.se.com/us/en/work/support/resources-and-tools/calculators-and-online-tools/time-current-curves/',
  },
  {
    id: 'abb-tmax-xt',
    title: 'ABB SACE Tmax XT — Technical characteristics',
    doc: '1SDC210099D0205',
    url: 'https://search.abb.com/library/Download.aspx?DocumentID=1SDC210099D0205&LanguageCode=en',
  },
  {
    id: 'abb-mcb-curves',
    title: 'ABB — MCB trip curves explained',
    doc: '2CDC400002D0201',
    url: 'https://library.e.abb.com/public/b5acf03b2a1f42e3b08ed2fc27672c30/What+you+need+to+know+about+MCB+trip+curves.pdf',
  },
  {
    id: 'hager-mcb',
    title: 'Hager NBN/NCN/NDN — MCB technical data',
    url: 'https://storage.electrika.com/manu/man-0330/pdftech/0330-hager-cat-19-090-099.pdf',
  },
  {
    id: 'iec-60898',
    title: 'IEC 60898-1 — MCB overload & instantaneous tests',
    note: 'Points 1,13 / 1,45 / 2,55 × In',
  },
  {
    id: 'caneco-edielec',
    title: 'Caneco BT — EDIELEC (propriétaire ALPI)',
    note: 'Non redistribuable ; import local via scripts/import-caneco-base.mjs',
  },
];

function buildMccbSettings(extra, hasShortTime) {
  if (!hasShortTime) return extra.settings ? { ...extra.settings } : { ...NO_ST_SETTINGS };
  const base = extra.hiIi ? ST_SETTINGS_HI_II : ST_SETTINGS;
  const s = JSON.parse(JSON.stringify(extra.settings || base));
  if (extra.tsdProfile && TSD_PROFILES[extra.tsdProfile]) {
    s.tsd = { ...TSD_PROFILES[extra.tsdProfile] };
  } else if (extra.tsd) {
    s.tsd = { ...extra.tsd };
  }
  return s;
}

function tripUnitFromPublic(id, label, hasShortTime, curveDef, extra = {}) {
  const c = curveDef || SCHNEIDER_NSX_MIC_TR1;
  const trCapable = [
    SCHNEIDER_NSX_MIC_TR1, SCHNEIDER_MIC_LONG_TR1, SCHNEIDER_NSX_MIC_TR16,
    SCHNEIDER_MIC_LONG_TR2, ABB_EKIP_LONG, ABB_TMA_THERMAL,
  ].includes(c);
  const supportsTr = extra.supportsTr !== false && trCapable;
  const useSt = extra.settings
    ? { ...extra.settings }
    : buildMccbSettings(extra, hasShortTime);
  const settings = supportsTr && hasShortTime
    ? { ...useSt, tr: ST_SETTINGS.tr }
    : supportsTr && !hasShortTime && c !== SCHNEIDER_TM_THERMAL && c !== SCHNEIDER_MA_MAG
      ? { ...useSt, tr: ST_SETTINGS.tr }
      : useSt;
  return {
    id,
    label,
    hasShortTime,
    settings,
    longAnchors: c.anchors,
    instTS: c.instTS,
    curveSource: c.source,
    curveSourceId: c.sourceId || null,
    trRefSec: TR_REF_SEC,
    supportsTr: !!supportsTr,
    ...extra,
  };
}

module.exports = {
  INST_TS_MCCB,
  INST_TS_MCB,
  TR_VALUES_SEC,
  TR_REF_SEC,
  MCB_MAG,
  scaleAnchorsByTr,
  SCHNEIDER_TM_THERMAL,
  SCHNEIDER_MA_MAG,
  ST_SETTINGS_HI_II,
  SCHNEIDER_NSX_MIC_TR1,
  SCHNEIDER_NSX_MIC_TR16,
  SCHNEIDER_MIC_LONG_TR1,
  SCHNEIDER_MIC_LONG_TR2,
  ABB_TMA_THERMAL,
  ABB_EKIP_LONG,
  HAGER_MCB_THERMAL,
  IEC_60898_THERMAL,
  ST_SETTINGS,
  NO_ST_SETTINGS,
  TSD_PROFILES,
  buildMccbSettings,
  PUBLIC_SOURCES,
  tripUnitFromPublic,
};
