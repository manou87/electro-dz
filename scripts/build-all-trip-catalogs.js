#!/usr/bin/env node
/**
 * Catalogues courbes t(I) — Schneider, ABB, Hager (sources publiques constructeur).
 * node scripts/build-all-trip-catalogs.js
 */
const { tripUnit, tripUnitTm, tripUnitAbb, mcbCurve, dev, writeCatalog, MOD_IN, MOD_IN_125, inByFrame, clampInRatingsToFrame } = require('./trip-curve-catalog-lib');
const { SCHNEIDER_MA_MAG } = require('./public-trip-curve-data');

const REV = '2026-06-pro-curves';
const SRC_SE = 'Documentation constructeur publique — DOCA0141/0217 (Micrologic), IEC 60898-1 (Acti9). Voir methodology.json';
const SRC_ABB = 'Documentation constructeur publique — 1SDC210099D0205 (Tmax XT), Ekip, IEC 60898-1 (S200). Voir methodology.json';
const SRC_HG = 'Documentation constructeur publique — IEC 60898-1, fiches Hager. Voir methodology.json';

// ——— Trip units communs ———
const MCB_IDS = ['curve_b', 'curve_c', 'curve_d', 'curve_k', 'curve_z', 'curve_ma'];

// ═══════════════════════════════════════════════════════════════
// SCHNEIDER
// ═══════════════════════════════════════════════════════════════
const SE_TRIP = {
  micrologic_2_0: tripUnit('micrologic_2_0', 'Micrologic 2.0', false),
  micrologic_2_1: tripUnit('micrologic_2_1', 'Micrologic 2.1', false),
  micrologic_2_2: tripUnit('micrologic_2_2', 'Micrologic 2.2', false),
  micrologic_2_3: tripUnit('micrologic_2_3', 'Micrologic 2.3', true, { tsdProfile: 'mic_23_fixed' }),
  micrologic_2_4: tripUnit('micrologic_2_4', 'Micrologic 2.4', true, { tsdProfile: 'mic_34' }),
  micrologic_3_2: tripUnit('micrologic_3_2', 'Micrologic 3.2', true, { tsdProfile: 'mic_34' }),
  micrologic_3_3: tripUnit('micrologic_3_3', 'Micrologic 3.3', true, { tsdProfile: 'mic_34' }),
  micrologic_4_2: tripUnit('micrologic_4_2', 'Micrologic 4.2', true, { tsdProfile: 'mic_34' }),
  micrologic_4_3: tripUnit('micrologic_4_3', 'Micrologic 4.3', true, { tsdProfile: 'mic_34' }),
  micrologic_5_2: tripUnit('micrologic_5_2', 'Micrologic 5.2', true, { tsdProfile: 'mic_567' }),
  micrologic_5_3: tripUnit('micrologic_5_3', 'Micrologic 5.3', true, { tsdProfile: 'mic_567' }),
  micrologic_6_2: tripUnit('micrologic_6_2', 'Micrologic 6.2', true, { hiIi: true, tsdProfile: 'mic_567' }),
  micrologic_6_3: tripUnit('micrologic_6_3', 'Micrologic 6.3', true, { hiIi: true, tsdProfile: 'mic_567' }),
  micrologic_7_2: tripUnit('micrologic_7_2', 'Micrologic 7.2', true, { hiIi: true, tsdProfile: 'mic_567' }),
  micrologic_7_3: tripUnit('micrologic_7_3', 'Micrologic 7.3', true, { hiIi: true, tsdProfile: 'mic_567' }),
  micrologic_p: tripUnit('micrologic_p', 'MicroLogic P', true, { hiIi: true, tsdProfile: 'mic_567' }),
  micrologic_h: tripUnit('micrologic_h', 'MicroLogic H', true, { hiIi: true, tsdProfile: 'mic_567' }),
  micrologic_g: tripUnit('micrologic_g', 'MicroLogic G', true, { hiIi: true, tsdProfile: 'mic_567' }),
  tm_d: tripUnitTm('tm_d', 'TM-D', false),
  tm_g: tripUnitTm('tm_g', 'TM-G', true, { tsdProfile: 'schneider_tm' }),
  tm_gb: tripUnitTm('tm_gb', 'TM-Gb', true, { tsdProfile: 'schneider_tm' }),
  ma_63: tripUnit('ma_63', 'MA (moteur)', false, { curveDef: SCHNEIDER_MA_MAG, supportsTr: false }),
  curve_b: mcbCurve('curve_b', 'Courbe B', 'B'),
  curve_c: mcbCurve('curve_c', 'Courbe C', 'C'),
  curve_d: mcbCurve('curve_d', 'Courbe D', 'D'),
  curve_k: mcbCurve('curve_k', 'Courbe K', 'K'),
  curve_z: mcbCurve('curve_z', 'Courbe Z', 'Z'),
  curve_ma: mcbCurve('curve_ma', 'Courbe MA', 'D'),
};
const SE_MIC = Object.keys(SE_TRIP).filter((k) => k.startsWith('micrologic'));
const SE_CVS = ['tm_d', 'tm_g', 'tm_gb', 'ma_63'];

const seDevices = [
  ...['100', '160', '250'].map((f) => dev({
    group: 'ComPacT NSX', family: 'nsx', id: `nsx${f}`, label: `NSX${f}`, frameA: +f,
    inRatings: inByFrame(+f),
  }, SE_MIC)),
  ...['400', '630'].map((f) => dev({
    group: 'ComPacT NSX', family: 'nsx', id: `nsx${f}`, label: `NSX${f}`, frameA: +f,
    inRatings: inByFrame(+f),
  }, SE_MIC)),
  dev({ group: 'ComPacT NSX', family: 'nsx', id: 'nsx400k', label: 'NSX400K', frameA: 400, inRatings: [250, 400] }, SE_MIC),
  dev({ group: 'ComPacT NSXm', family: 'nsxm', id: 'nsxm63', label: 'NSXm63', frameA: 63, inRatings: inByFrame(63) }, SE_MIC),
  dev({ group: 'ComPacT NSXm', family: 'nsxm', id: 'nsxm160', label: 'NSXm160', frameA: 160, inRatings: inByFrame(160) }, SE_MIC),
  dev({ group: 'ComPacT NSXm', family: 'nsxm', id: 'nsxm250', label: 'NSXm250', frameA: 250, inRatings: inByFrame(250) }, SE_MIC),
  ...['100', '160', '250', '400', '630'].map((f) => dev({
    group: 'ComPacT NS', family: 'ns', id: `ns${f}`, label: `NS${f}`, frameA: +f,
    inRatings: inByFrame(+f),
  }, SE_MIC)),
  ...['100', '160', '250', '400', '630'].map((f) => dev({
    group: 'ComPacT CVS', family: 'cvs', id: `cvs${f}`, label: `CVS${f}`, frameA: +f, tripUnitIds: SE_CVS,
    inRatings: inByFrame(+f),
  }, SE_CVS)),
  ...['ezc100', 'ezc250', 'ezc400', 'ezc630'].map((id, i) => dev({
    group: 'EasyPact EZC', family: 'ezc', id, label: id.toUpperCase(),
    frameA: [100, 250, 400, 630][i], inRatings: inByFrame([100, 250, 400, 630][i]),
  }, SE_CVS)),
  ...['nw10', 'nw12', 'nw16', 'nw20', 'nw25', 'nw32', 'nw40', 'nw50', 'nw63'].map((id, i) => {
    const specs = [
      [1000, [400, 500, 630, 800, 1000]], [1250, [630, 800, 1000, 1250]], [1600, [800, 1000, 1250, 1600]],
      [2000, [1000, 1250, 1600, 2000]], [2500, [1250, 1600, 2000, 2500]], [3200, [1600, 2000, 2500, 3200]],
      [4000, [2000, 2500, 3200, 4000]], [5000, [2500, 3200, 4000, 5000]], [6300, [3200, 4000, 5000, 6300]],
    ];
    return dev({ group: 'Masterpact NW', family: 'masterpact', deviceType: 'acb', id, label: `Masterpact ${id.toUpperCase()}`, frameA: specs[i][0], inRatings: specs[i][1] }, SE_MIC);
  }),
  dev({ group: 'Acti9 iC60', family: 'acti9', deviceType: 'mcb', id: 'ic60', label: 'iC60', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'Acti9 iC60', family: 'acti9', deviceType: 'mcb', id: 'ic60h', label: 'iC60H', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'Acti9 iC60', family: 'acti9', deviceType: 'mcb', id: 'ic60l', label: 'iC60L', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'Acti9 NG125', family: 'acti9', deviceType: 'mcb', id: 'ng125', label: 'NG125', frameA: 125, inRatings: MOD_IN_125, tripUnitIds: MCB_IDS }, []),
];

writeCatalog('schneider', {
  brand: 'Schneider Electric',
  source: SRC_SE,
  revision: REV,
  tripUnits: SE_TRIP,
  families: [
    { id: 'all', label: 'Toute la gamme' },
    { id: 'nsx', label: 'ComPacT NSX / NSXm' },
    { id: 'ns', label: 'ComPacT NS' },
    { id: 'cvs', label: 'ComPacT CVS / EZC' },
    { id: 'masterpact', label: 'Masterpact (boîtier ouvert)' },
    { id: 'acti9', label: 'Acti9 modulaire' },
  ],
  devices: seDevices,
});

// ═══════════════════════════════════════════════════════════════
// ABB
// ═══════════════════════════════════════════════════════════════
const ABB_TRIP = {
  tma: tripUnitAbb('tma', 'TMA (thermo-magnétique)', false),
  tma_m: tripUnitAbb('tma_m', 'TMA + motor protection', false),
  tmft: tripUnitAbb('tmft', 'TMA-TFM (réglable)', true, { tsdProfile: 'abb_tmax' }),
  ekip_g: tripUnitAbb('ekip_g', 'Ekip G Touch LSI', true, { tsdProfile: 'abb_tmax' }),
  ekip_h: tripUnitAbb('ekip_h', 'Ekip Hi-Touch LSI', true, { tsdProfile: 'abb_tmax' }),
  ekip_l: tripUnitAbb('ekip_l', 'Ekip LCD LSI', true, { tsdProfile: 'abb_tmax' }),
  ekip_lsig: tripUnitAbb('ekip_lsig', 'Ekip Touch LSIG', true, { tsdProfile: 'abb_tmax' }),
  ekip_m: tripUnitAbb('ekip_m', 'Ekip M Touch LSI', true, { tsdProfile: 'abb_tmax' }),
  pr121: tripUnitAbb('pr121', 'PR121 (Tmax T)', true, { tsdProfile: 'abb_pr' }),
  pr122: tripUnitAbb('pr122', 'PR122 (Tmax T)', true, { tsdProfile: 'abb_pr' }),
  pr123: tripUnitAbb('pr123', 'PR123 (Tmax T)', true, { tsdProfile: 'abb_pr' }),
  tma_emax: tripUnitAbb('tma_emax', 'PR123/PB (Emax)', true, { tsdProfile: 'abb_pr' }),
  curve_b: mcbCurve('curve_b', 'Courbe B', 'B'),
  curve_c: mcbCurve('curve_c', 'Courbe C', 'C'),
  curve_d: mcbCurve('curve_d', 'Courbe D', 'D'),
  curve_k: mcbCurve('curve_k', 'Courbe K', 'K'),
  curve_z: mcbCurve('curve_z', 'Courbe Z', 'Z'),
};
const ABB_EKIP = ['tma', 'tmft', 'ekip_g', 'ekip_h', 'ekip_l', 'ekip_lsig', 'ekip_m', 'pr121', 'pr122', 'pr123'];
const ABB_TMA = ['tma', 'tma_m', 'tmft'];

const abbDevices = [
  ...[
    { id: 'xt1', label: 'Tmax XT1', f: 160, in: [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160] },
    { id: 'xt2', label: 'Tmax XT2', f: 250, in: [63, 80, 100, 125, 160, 200, 250] },
    { id: 'xt3', label: 'Tmax XT3', f: 400, in: [250, 315, 400] },
    { id: 'xt4', label: 'Tmax XT4', f: 250, in: [160, 200, 250] },
    { id: 'xt5', label: 'Tmax XT5', f: 630, in: [400, 500, 630] },
    { id: 'xt6', label: 'Tmax XT6', f: 1000, in: [630, 800, 1000] },
    { id: 'xt7', label: 'Tmax XT7', f: 1600, in: [800, 1000, 1250, 1600] },
  ].map((r) => dev({ group: 'Tmax XT', family: 'tmax_xt', id: r.id, label: r.label, frameA: r.f, inRatings: clampInRatingsToFrame(r.in, r.f) }, ABB_EKIP)),
  ...[
    { id: 't1', label: 'Tmax T1', f: 160, in: [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160] },
    { id: 't2', label: 'Tmax T2', f: 250, in: [63, 80, 100, 125, 160, 200, 250] },
    { id: 't3', label: 'Tmax T3', f: 400, in: [250, 315, 400] },
    { id: 't4', label: 'Tmax T4', f: 250, in: [160, 200, 250] },
    { id: 't5', label: 'Tmax T5', f: 630, in: [400, 500, 630] },
  ].map((r) => dev({ group: 'Tmax T (précédente)', family: 'tmax_t', id: r.id, label: r.label, frameA: r.f, inRatings: clampInRatingsToFrame(r.in, r.f) }, ['tma', 'pr121', 'pr122', 'pr123'])),
  ...[
    { id: 'e1', label: 'Emax E1', f: 1000, in: [630, 800, 1000] },
    { id: 'e2', label: 'Emax E2', f: 2000, in: [1000, 1250, 1600, 2000] },
    { id: 'e4', label: 'Emax E4', f: 4000, in: [2000, 2500, 3200, 4000] },
    { id: 'e6', label: 'Emax E6', f: 6300, in: [3200, 4000, 5000, 6300] },
  ].map((r) => dev({ group: 'Emax', family: 'emax', deviceType: 'acb', id: r.id, label: r.label, frameA: r.f, inRatings: clampInRatingsToFrame(r.in, r.f) }, ['tma_emax', 'ekip_lsig', 'ekip_h'])),
  dev({ group: 'S200 modulaire', family: 's200', deviceType: 'mcb', id: 's200', label: 'S200', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'S200 modulaire', family: 's200', deviceType: 'mcb', id: 's200m', label: 'S200M', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'S200 modulaire', family: 's200', deviceType: 'mcb', id: 'sn201', label: 'SN201 (1P+N)', frameA: 40, inRatings: [6, 10, 13, 16, 20, 25, 32, 40], tripUnitIds: MCB_IDS }, []),
  dev({ group: 'Tmax XT', family: 'tmax_xt', id: 'xt2s', label: 'Tmax XT2S (limiteur)', frameA: 250, inRatings: [63, 80, 100, 125, 160, 200, 250] }, ABB_EKIP),
];

writeCatalog('abb', {
  brand: 'ABB',
  source: SRC_ABB,
  revision: REV,
  tripUnits: ABB_TRIP,
  families: [
    { id: 'all', label: 'Toute la gamme' },
    { id: 'tmax_xt', label: 'Tmax XT' },
    { id: 'tmax_t', label: 'Tmax T' },
    { id: 'emax', label: 'Emax (boîtier ouvert)' },
    { id: 's200', label: 'S200 modulaire' },
  ],
  devices: abbDevices,
});

// ═══════════════════════════════════════════════════════════════
// HAGER
// ═══════════════════════════════════════════════════════════════
const HG_TRIP = {
  tm: tripUnitTm('tm', 'Thermo-magnétique', false),
  tm_plus: tripUnitTm('tm_plus', 'TM+ (réglable)', true, { tsdProfile: 'hager_tm' }),
  curve_b: mcbCurve('curve_b', 'Courbe B', 'B'),
  curve_c: mcbCurve('curve_c', 'Courbe C', 'C'),
  curve_d: mcbCurve('curve_d', 'Courbe D', 'D'),
  curve_k: mcbCurve('curve_k', 'Courbe K', 'K'),
};

const hgDevices = [
  dev({ group: 'NBN — modulaire', family: 'nbn', deviceType: 'mcb', id: 'nbn', label: 'NBN', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'NBN — modulaire', family: 'nbn', deviceType: 'mcb', id: 'nbn863', label: 'NBN863 (fort Icu)', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'NBN — modulaire', family: 'nbn', deviceType: 'mcb', id: 'nbn865', label: 'NBN865 (limiteur)', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'NBN — modulaire', family: 'nbn', deviceType: 'mcb', id: 'nbn160', label: 'NBN (jusqu\'à 125 A)', frameA: 125, inRatings: MOD_IN_125, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'NXN / NX', family: 'nxn', deviceType: 'mcb', id: 'nxn', label: 'NXN', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'CDC / CDH', family: 'cdc', deviceType: 'mcb', id: 'cdc', label: 'CDC (commercial)', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'CDC / CDH', family: 'cdc', deviceType: 'mcb', id: 'cdh', label: 'CDH740', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'MTN (ancienne)', family: 'mtn', deviceType: 'mcb', id: 'mtn', label: 'MTN', frameA: 63, inRatings: MOD_IN, tripUnitIds: MCB_IDS }, []),
  dev({ group: 'HX — boîtier moulé', family: 'hx', id: 'hx160', label: 'HX160', frameA: 160, inRatings: inByFrame(160), tripUnitIds: ['tm', 'tm_plus'] }, ['tm', 'tm_plus']),
  dev({ group: 'HX — boîtier moulé', family: 'hx', id: 'hx250', label: 'HX250', frameA: 250, inRatings: inByFrame(250), tripUnitIds: ['tm', 'tm_plus'] }, ['tm', 'tm_plus']),
];

writeCatalog('hager', {
  brand: 'Hager',
  source: SRC_HG,
  revision: REV,
  tripUnits: HG_TRIP,
  families: [
    { id: 'all', label: 'Toute la gamme' },
    { id: 'nbn', label: 'NBN modulaire' },
    { id: 'nxn', label: 'NXN' },
    { id: 'cdc', label: 'CDC / CDH' },
    { id: 'hx', label: 'HX boîtier moulé' },
  ],
  devices: hgDevices,
});

// Index + rétrocompat schneider-mccb.json
const fs = require('fs');
const path = require('path');
const index = {
  revision: REV,
  publicSources: 'public-sources.json',
  brands: [
    { id: 'schneider', label: 'Schneider Electric', file: 'schneider.json', default: true },
    { id: 'abb', label: 'ABB', file: 'abb.json' },
    { id: 'hager', label: 'Hager', file: 'hager.json' },
  ],
};
const dir = path.join(__dirname, '../data/trip-curves');
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 2) + '\n');
fs.copyFileSync(path.join(dir, 'schneider.json'), path.join(dir, 'schneider-mccb.json'));
console.log('Index + schneider-mccb.json (alias) écrits.');
