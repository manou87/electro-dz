#!/usr/bin/env node
/**
 * Vérifie zones sur le graphe + fond blanc au moment de l'export PNG.
 * node scripts/smoke-export-theme.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:8765';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  await page.goto(`${BASE}/calcul-electrique.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('.type-card').length >= 10);

  await page.evaluate(() => {
    document.querySelector('[data-calc-id="trip_curve"]')?.click();
  });
  await page.waitForSelector('#tripcurve.active', { timeout: 8000 });
  await page.evaluate(() => window.ElectroDzTripCurve?.loadPilotNsx160?.());
  await page.waitForFunction(
    () => (document.getElementById('tc-legend')?.children?.length || 0) >= 2,
    { timeout: 20000 }
  );

  const screenPx = await page.evaluate(() => {
    const ctx = document.getElementById('tc-canvas').getContext('2d');
    const d = ctx.getImageData(4, 4, 1, 1).data;
    return [d[0], d[1], d[2]];
  });
  if (screenPx[0] > 80 || screenPx[1] > 80) {
    errors.push(`Écran pas sombre au coin: rgb(${screenPx.join(',')})`);
  }

  const exportPx = await page.evaluate(() => {
    const cv = document.getElementById('tc-canvas');
    let snap = null;
    const orig = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      if (this === cv) {
        const d = this.getContext('2d').getImageData(6, 6, 1, 1).data;
        snap = [d[0], d[1], d[2]];
      }
      return orig.apply(this, args);
    };
    document.getElementById('tc-export-png')?.click();
    HTMLCanvasElement.prototype.toDataURL = orig;
    const after = cv.getContext('2d').getImageData(4, 4, 1, 1).data;
    return { snap, after: [after[0], after[1], after[2]] };
  });

  if (!exportPx.snap) errors.push('Export PNG : pixel non capturé');
  else if (exportPx.snap[0] < 240 || exportPx.snap[1] < 240 || exportPx.snap[2] < 240) {
    errors.push(`Export pas fond blanc: rgb(${exportPx.snap.join(',')})`);
  }
  if (exportPx.after[0] > 80) {
    errors.push(`Après export, écran pas restauré (sombre): rgb(${exportPx.after.join(',')})`);
  }

  const zones = await page.evaluate(() => {
    const cv = document.getElementById('tc-canvas');
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    let thermal = 0;
    let mag = 0;
    let shortTime = 0;
    // Traits semi-transparents sur fond sombre → seuils assouplis
    const isThermal = (r, g, b) => r > 120 && g > 85 && b < 110 && r >= g;
    const isMag = (r, g, b) => r > 130 && g < 110 && b < 110 && r > g + 15;
    const isShort = (r, g, b) => g > 120 && b > 120 && r < 130;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const a = d[i + 3];
        if (a < 40) continue;
        if (x > 56 && x < w - 16 && y > 16 && y < h - 44) {
          if (isThermal(r, g, b)) thermal++;
          if (isMag(r, g, b)) mag++;
          if (isShort(r, g, b)) shortTime++;
        }
      }
    }
    return { thermal, mag, shortTime };
  });
  if (zones.thermal < 80) errors.push(`Lignes thermiques peu visibles (${zones.thermal} px)`);
  if (zones.mag < 40) errors.push(`Lignes magnétiques peu visibles (${zones.mag} px)`);
  if (zones.shortTime < 20) errors.push(`Lignes court retard peu visibles (${zones.shortTime} px)`);

  await browser.close();

  if (errors.length) {
    console.error('ÉCHECS:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('Smoke export + lignes zonées OK');
  console.log('  · Écran sombre:', screenPx.join(','));
  console.log('  · Export blanc:', exportPx.snap?.join(','));
  console.log('  · Écran restauré:', exportPx.after.join(','));
  console.log('  · Pixels zonés:', `thermal=${zones.thermal}, mag=${zones.mag}, short=${zones.shortTime}`);
}

main().catch((e) => {
  console.error('Smoke échoué:', e.message);
  process.exit(1);
});
