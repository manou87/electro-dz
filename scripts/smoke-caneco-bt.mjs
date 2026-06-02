#!/usr/bin/env node
/**
 * Smoke test — Étude BT (type Caneco) + mode pro courbes.
 * Prérequis : serveur http://127.0.0.1:8765
 * Nécessite ENABLE_CANECO_BT = true + HTML/scripts décommentés dans calcul-electrique.html.
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:8765';
const URL = `${BASE}/calcul-electrique.html`;

const errors = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  const res = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!res || res.status() !== 200) throw new Error(`HTTP ${res?.status()}`);

  await page.waitForFunction(() => window.ElectroDzCanecoBT && window.ElectroDzCanecoBTCalc, { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('.type-card').length >= 10, { timeout: 10000 });

  // --- Onglet Étude BT ---
  await page.evaluate(() => {
    document.querySelector('[data-calc-id="caneco_bt"]')?.click();
  });
  await page.waitForSelector('#caneco.active', { timeout: 5000 });
  const presetCount = await page.locator('#caneco-presets [data-preset]').count();
  if (presetCount < 3) errors.push(`Presets Caneco: ${presetCount} (attendu ≥ 3)`);

  await page.click('#caneco-presets [data-preset="prise_2_5"]');
  await page.click('#btn-calculate');
  await page.waitForTimeout(400);

  const canecoResult = await page.evaluate(() => {
    const box = document.getElementById('calc-global-result');
    const t = box?.textContent || '';
    return {
      hasIa: /Ia|U₀|Zs|Rac/i.test(t),
      hasResult: t.length > 50,
      iaMatch: t.match(/(\d+)\s*A/)?.[1],
    };
  });
  if (!canecoResult.hasResult) errors.push('Résultat étude Caneco vide');
  if (!canecoResult.hasIa) errors.push('Résultat sans Rac/Zs/Ia');

  // --- Mode pro courbes ---
  await page.evaluate(() => {
    document.querySelector('[data-calc-id="trip_curve"]')?.click();
  });
  await page.waitForSelector('#tripcurve.active', { timeout: 5000 });
  await page.click('#tc-pro-toggle');
  await page.waitForSelector('#tc-pro:not([hidden])', { timeout: 3000 });

  const proFields = await page.evaluate(() => ({
    ze: !!document.getElementById('tc-ze'),
    length: !!document.getElementById('tc-length'),
    presets: document.querySelectorAll('#tc-pro-presets [data-preset]').length,
  }));
  if (!proFields.ze || !proFields.length) errors.push('Champs Ze/L manquants en mode pro');
  if (proFields.presets < 3) errors.push(`Presets mode pro: ${proFields.presets}`);

  await page.click('#tc-pro-presets [data-preset="depart_6"]');
  await page.waitForTimeout(300);
  await page.selectOption('#tc-cable-s', '6');
  await page.evaluate(() => window.ElectroDzTripCurve?.loadPilotNsx160?.());
  await page.waitForFunction(
    () => (document.getElementById('tc-legend')?.children?.length || 0) >= 2,
    { timeout: 20000 }
  );

  const proResult = await page.evaluate(() => {
    const pro = document.getElementById('tc-pro-result')?.textContent || '';
    return {
      loop: /Rac|Zs|Ia|90/i.test(pro),
      legend: document.getElementById('tc-legend')?.children?.length || 0,
    };
  });
  if (!proResult.loop) errors.push('Mode pro sans ligne boucle Rac/Zs/Ia');
  if (proResult.legend < 2) errors.push(`Courbes pilote: ${proResult.legend}`);

  await browser.close();

  if (errors.length) {
    console.error('ÉCHECS:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('Smoke Caneco BT OK');
  console.log('  · Onglet étude: presets, calcul 2,5 mm², résultat Ia/Zs');
  console.log('  · Courbes: mode pro Ze/L, presets, pilote 2 courbes, boucle affichée');
}

main().catch((e) => {
  console.error('Smoke échoué:', e.message);
  process.exit(1);
});
