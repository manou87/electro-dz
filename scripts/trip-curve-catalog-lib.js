/**
 * Bibliothèque partagée — génération catalogues courbes t(I) constructeur.
 */
const fs = require('fs');
const path = require('path');
const {
  SCHNEIDER_NSX_MIC_TR1,
  SCHNEIDER_MIC_LONG_TR1,
  SCHNEIDER_TM_THERMAL,
  SCHNEIDER_MA_MAG,
  ABB_TMA_THERMAL,
  ABB_EKIP_LONG,
  IEC_60898_THERMAL,
  MCB_MAG,
  ST_SETTINGS,
  NO_ST_SETTINGS,
  buildMccbSettings,
  tripUnitFromPublic,
} = require('./public-trip-curve-data');

const LONG_ANCHORS = SCHNEIDER_NSX_MIC_TR1.anchors;
const INST_TS = SCHNEIDER_NSX_MIC_TR1.instTS;

const MOD_IN = [1, 2, 3, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
const MOD_IN_125 = [...MOD_IN, 80, 100, 125];

function tripUnit(id, label, hasShortTime, extra = {}) {
  const { curveDef, hiIi, ...rest } = extra;
  const curve = curveDef || SCHNEIDER_NSX_MIC_TR1;
  return tripUnitFromPublic(id, label, hasShortTime, curve, { hiIi, ...rest });
}

function tripUnitAbb(id, label, hasShortTime, extra = {}) {
  const isEkip = /^ekip/i.test(id);
  return tripUnit(id, label, hasShortTime, {
    ...extra,
    curveDef: isEkip ? ABB_EKIP_LONG : ABB_TMA_THERMAL,
  });
}

function mcbCurve(id, label, curve, sourceId) {
  const mag = MCB_MAG[curve] || MCB_MAG.C;
  const src = 'IEC 60898-1 + seuils magnétiques courbe ' + curve;
  return {
    id,
    label,
    mcb: true,
    curve,
    hasShortTime: false,
    settings: null,
    longAnchors: IEC_60898_THERMAL.anchors,
    magMult: mag,
    instTS: 0.01,
    curveSource: src,
    curveSourceId: sourceId || 'iec-60898',
  };
}

function tripUnitNs(id, label, hasShortTime, extra = {}) {
  return tripUnit(id, label, hasShortTime, {
    ...extra,
    curveDef: SCHNEIDER_MIC_LONG_TR1,
  });
}

function tripUnitTm(id, label, hasShortTime, extra = {}) {
  return tripUnitFromPublic(id, label, hasShortTime, SCHNEIDER_TM_THERMAL, {
    settings: buildMccbSettings({ ...extra, tsdProfile: extra.tsdProfile || 'schneider_tm' }, hasShortTime),
    supportsTr: false,
    fixedIr: true,
    ...extra,
  });
}

function dev(row, defaultTripIds) {
  return {
    id: row.id,
    label: row.label,
    group: row.group,
    family: row.family || row.group,
    frameA: row.frameA,
    inRatings: row.inRatings,
    icuKA: row.icuKA || [],
    kind: row.kind || 'breaker',
    deviceType: row.deviceType || (row.kind === 'switch' ? 'switch' : 'mccb'),
    tripUnitIds: row.tripUnitIds ?? (row.kind === 'switch' ? [] : defaultTripIds),
  };
}

/** Calibres In admissibles pour un boîtier (tous ≤ frameA). */
function inByFrame(frame, small) {
  const f = Number(frame);
  if (!Number.isFinite(f) || f <= 0) return [...MOD_IN];
  if (f <= 40) return [6, 10, 13, 16, 20, 25, 32, 40].filter((n) => n <= f);
  if (f <= 63) return MOD_IN.filter((n) => n <= f);
  if (f <= 100) return [16, 20, 25, 32, 40, 50, 63, 80, 100].filter((n) => n <= f);
  if (f <= 125) return MOD_IN_125.filter((n) => n <= f);
  if (f <= 160) return [63, 80, 100, 125, 160];
  if (f <= 250) return [100, 125, 160, 200, 250];
  if (f <= 400) return [250, 315, 400];
  if (f <= 630) return [400, 500, 630];
  if (f <= 1000) return [630, 800, 1000];
  if (f <= 1600) return [800, 1000, 1250, 1600];
  if (f <= 2000) return [1000, 1250, 1600, 2000];
  if (f <= 4000) return [2000, 2500, 3200, 4000];
  if (f <= 6300) return [3200, 4000, 5000, 6300];
  return small || [400, 500, 630, 800, 1000].filter((n) => n <= f);
}

function clampInRatingsToFrame(inRatings, frameA) {
  const f = Number(frameA);
  if (!Array.isArray(inRatings) || !Number.isFinite(f)) return inRatings || [];
  return inRatings.filter((n) => n > 0 && n <= f);
}

function writeCatalog(brandId, catalog) {
  const dir = path.join(__dirname, '../data/trip-curves');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  catalog.brandId = brandId;
  catalog.breakerCount = catalog.devices.filter((d) => d.kind === 'breaker').length;
  const out = path.join(dir, `${brandId}.json`);
  fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
  return { out, catalog };
}

module.exports = {
  tripUnit,
  tripUnitNs,
  tripUnitTm,
  tripUnitAbb,
  mcbCurve,
  dev,
  inByFrame,
  clampInRatingsToFrame,
  writeCatalog,
  MOD_IN,
  MOD_IN_125,
  LONG_ANCHORS,
  SCHNEIDER_NSX_MIC_TR1,
  ABB_TMA_THERMAL,
};
