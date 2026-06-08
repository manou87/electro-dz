#!/usr/bin/env node
/**
 * Vérifie la correction « une seule horizontale instantanée » sur le site local.
 * Prérequis : serveur http://127.0.0.1:8765 (python -m http.server 8765)
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:8765';
const URL = `${BASE}/calcul-electrique.html#tripcurve`;

/** Enregistre les segments horizontaux tracés sur le canvas t(I). */
const HOOK = `
(() => {
  if (window.__tcStrokeHook) return;
  window.__tcStrokeHook = true;
  window.__tcHorizSegs = [];
  const proto = CanvasRenderingContext2D.prototype;
  const origMoveTo = proto.moveTo;
  const origLineTo = proto.lineTo;
  const origStroke = proto.stroke;
  let path = [];
  proto.moveTo = function (x, y) {
    path = [{ x, y }];
    return origMoveTo.apply(this, arguments);
  };
  proto.lineTo = function (x, y) {
    path.push({ x, y });
    return origLineTo.apply(this, arguments);
  };
  proto.stroke = function () {
    const dash = this.getLineDash?.() || [];
    const dashed = dash.length > 0 && dash.some((d) => d > 0);
    const lw = this.lineWidth || 1;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      if (Math.abs(a.y - b.y) < 0.5 && Math.abs(b.x - a.x) >= 40) {
        window.__tcHorizSegs.push({
          y: (a.y + b.y) / 2,
          x0: Math.min(a.x, b.x),
          x1: Math.max(a.x, b.x),
          len: Math.abs(b.x - a.x),
          lw,
          dashed,
        });
      }
    }
    path = [];
    return origStroke.apply(this, arguments);
  };
})();
`;

function assert(cond, msg, errors) {
  if (!cond) errors.push(msg);
}

function uniqueInstantYLevels(segs, canvasH, opts = {}) {
  const { minLen = 80, minLw = 2.2, solidOnly = true, yMinFrac = 0.55 } = opts;
  const yMin = canvasH * yMinFrac;
  const ys = segs
    .filter(
      (s) =>
        s.len >= minLen &&
        s.lw >= minLw &&
        s.y >= yMin &&
        (!solidOnly || !s.dashed)
    )
    .map((s) => Math.round(s.y));
  return [...new Set(ys)];
}

async function waitTripCurveReady(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('.type-card').length >= 10, { timeout: 10000 });
  await page.evaluate(() => document.querySelector('[data-calc-id="trip_curve"]')?.click());
  await page.waitForSelector('#tripcurve.active', { timeout: 8000 });
  await page.waitForFunction(
    () => {
      const c = window.ElectroDzTripCurveCatalog?.getCatalog?.();
      return !!(c?.devices?.length && c.tripUnits?.micrologic_2_3);
    },
    { timeout: 45000 }
  );
}

async function resetSegs(page) {
  await page.evaluate(() => {
    window.__tcHorizSegs = [];
  });
}

async function main() {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(HOOK);

  const res = await page.goto(`${BASE}/calcul-electrique.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  assert(res?.status() === 200, `HTTP ${res?.status()} pour ${BASE}`, errors);

  await waitTripCurveReady(page);

  // --- Test 1 : constructeur MCCB (NSX160 pilote) ---
  await resetSegs(page);
  await page.evaluate(() => window.ElectroDzTripCurve?.loadPilotNsx160?.());
  await page.waitForFunction(
    () => (document.getElementById('tc-legend')?.children?.length || 0) >= 2,
    { timeout: 20000 }
  );
  await page.waitForTimeout(800);

  const mfg = await page.evaluate(() => {
    const canvas = document.getElementById('tc-canvas');
    const segs = window.__tcHorizSegs || [];
    const h = canvas?.height || 1;
    const legend = document.getElementById('tc-legend')?.children?.length ?? 0;
    const yMin = h * 0.55;
    const instantSolidY = [
      ...new Set(
        segs
          .filter((s) => s.len >= 80 && s.lw >= 2.2 && s.y >= yMin && !s.dashed)
          .map((s) => Math.round(s.y))
      ),
    ];
    return { h, legend, instantSolidY: instantSolidY.length, instantSolidYs: instantSolidY, totalSegs: segs.length };
  });

  assert(mfg.legend >= 2, `MCCB pilote : légende ${mfg.legend} courbe(s), attendu ≥ 2`, errors);
  assert(
    mfg.instantSolidY <= mfg.legend,
    `MCCB pilote : ${mfg.instantSolidY} palier(s) Y instantané(s) distinct(s) pour ${mfg.legend} courbes (attendu ≤ ${mfg.legend}) — Y=${mfg.instantSolidYs.join(',')}`,
    errors
  );
  assert(
    mfg.instantSolidY >= 1,
    `MCCB pilote : aucune horizontale instantanée détectée (canvas ${mfg.h}px)`,
    errors
  );

  // --- Test 2 : norme MCB type C ---
  await resetSegs(page);
  await page.evaluate(() => {
    window.__tcHorizSegs = [];
    const modeEl = document.getElementById('tc-mode');
    if (modeEl) modeEl.value = 'norm';
    window.ElectroDzTripCurveCatalog?.syncModeUI?.();
    window.ElectroDzTripCurve?.clearAll?.();
    const inEl = document.getElementById('tc-in');
    const curveEl = document.getElementById('tc-curve');
    const roleEl = document.getElementById('tc-role');
    if (inEl) inEl.value = '16';
    if (curveEl) curveEl.value = 'C';
    if (roleEl) roleEl.value = 'amont';
    window.ElectroDzTripCurve?.applyCurrent?.();
  });
  await page.waitForTimeout(600);

  const norm = await page.evaluate(() => {
    const canvas = document.getElementById('tc-canvas');
    const segs = window.__tcHorizSegs || [];
    const h = canvas?.height || 1;
    const yMin = h * 0.55;
    const instantSolidY = [
      ...new Set(
        segs
          .filter((s) => s.len >= 80 && s.lw >= 2.2 && s.y >= yMin && !s.dashed)
          .map((s) => Math.round(s.y))
      ),
    ].length;
    return { instantSolidY, legend: document.getElementById('tc-legend')?.children?.length ?? 0 };
  });

  assert(norm.legend >= 1, `MCB norme : légende vide`, errors);
  assert(
    norm.instantSolidY === 1,
    `MCB norme 16A C : ${norm.instantSolidY} palier(s) Y instantané(s) (attendu 1)`,
    errors
  );

  // --- Test 3 : script cache-bust présent ---
  const cacheBust = await page.evaluate(() =>
    [...document.querySelectorAll('script[src*="courbes-protection"]')].some((s) =>
      /courbes-protection\.js\?v=\d+/.test(s.getAttribute('src') || '')
    )
  );
  assert(cacheBust, 'Script courbes-protection.js sans paramètre ?v= (cache-bust)', errors);

  await browser.close();

  console.log('Résultats vérification site (avant injection) :');
  console.log(`  MCCB NSX160 : ${mfg.instantSolidY} palier(s) Y instantané(s) / ${mfg.legend} courbes`);
  console.log(`  MCB norme 16A C : ${norm.instantSolidY} palier(s) Y instantané(s)`);
  console.log(`  Cache-bust courbes-protection.js : ${cacheBust ? 'oui' : 'non'}`);

  if (errors.length) {
    console.error('\nÉCHECS :');
    errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  console.log('\nOK — correction site validée localement.');
}

main().catch((e) => {
  console.error('Vérification échouée:', e.message);
  process.exit(1);
});
