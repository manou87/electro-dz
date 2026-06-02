#!/usr/bin/env node
/**
 * Smoke test navigateur — courbes de protection (nécessite serveur http://127.0.0.1:8765).
 * node scripts/smoke-trip-curves.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:8765';
const URL = `${BASE}/calcul-electrique.html#tripcurve`;

const errors = [];
const logs = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') logs.push(`console: ${msg.text()}`);
  });

  const res = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!res || res.status() !== 200) {
    throw new Error(`HTTP ${res?.status() ?? 'no response'} pour ${URL}`);
  }

  await page.waitForFunction(() => document.querySelectorAll('.type-card').length >= 10, { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('[data-calc-id="trip_curve"]')?.click();
  });
  await page.waitForSelector('#tripcurve.active', { timeout: 8000 });
  await page.waitForSelector('#tc-mode', { state: 'visible', timeout: 8000 });

  await page.waitForFunction(
    () => {
      const c = window.ElectroDzTripCurveCatalog?.getCatalog?.();
      return !!(c?.devices?.length && c.tripUnits?.micrologic_2_3);
    },
    { timeout: 45000 }
  ).catch(async () => {
    const dbg = await page.evaluate(() => ({
      hasCat: !!window.ElectroDzTripCurveCatalog,
      hint: document.getElementById('tc-settings-hint')?.textContent?.slice(0, 120),
      legend: document.getElementById('tc-legend')?.children?.length,
    }));
    throw new Error(`Catalogue non chargé — ${JSON.stringify(dbg)} | logs: ${logs.slice(0, 3).join('; ')}`);
  });

  await page.evaluate(() => window.ElectroDzTripCurve?.loadPilotNsx160?.());
  await page.waitForFunction(
    () => (document.getElementById('tc-legend')?.children?.length || 0) >= 2,
    { timeout: 15000 }
  );

  const pilot = await page.evaluate(() => {
    const dev = document.getElementById('tc-mfg-device')?.value;
    const tu = document.getElementById('tc-mfg-trip')?.value;
    const tr = document.getElementById('tc-tr')?.value;
    const mode = document.getElementById('tc-mode')?.value;
    const legendItems = document.getElementById('tc-legend')?.children?.length ?? 0;
    const verdict = (document.getElementById('tc-verdict')?.textContent || '').trim().length;
    const canvas = document.getElementById('tc-canvas');
    let drawn = false;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, Math.min(50, canvas.width), Math.min(50, canvas.height)).data;
      drawn = [...d].some((v, i) => i % 4 !== 3 && v !== 0);
    }
    return { dev, tu, tr, mode, legendItems, verdict, drawn };
  });

  if (pilot.mode !== 'mfg') errors.push(`mode attendu mfg, reçu ${pilot.mode}`);
  if (!pilot.tu?.includes('micrologic')) errors.push(`trip unit inattendu: ${pilot.tu}`);
  if (pilot.legendItems < 2) errors.push(`Légende: ${pilot.legendItems} courbe(s), attendu ≥ 2`);
  if (!pilot.drawn) errors.push('Canvas vide après pilote');

  const proHidden = await page.evaluate(() => {
    const pro = document.getElementById('tc-pro');
    const prov = document.getElementById('tc-mfg-provenance');
    return {
      proHidden: pro?.hidden === true,
      provInDetails: !!prov?.closest('details'),
      disclaimerHidden: document.getElementById('tc-mfg-disclaimer')?.hidden === true,
    };
  });
  if (!proHidden.proHidden) errors.push('Mode pro devrait être replié par défaut');
  if (!proHidden.provInDetails) errors.push('Provenance devrait être dans <details>');
  if (!proHidden.disclaimerHidden) errors.push('Disclaimer constructeur devrait être masqué');

  await browser.close();

  if (logs.length) console.log('Avertissements console:', logs.slice(0, 5).join('\n'));
  if (errors.length) {
    console.error('ÉCHECS:\n' + errors.map((e) => '  - ' + e).join('\n'));
    console.log('État pilote:', pilot);
    process.exit(1);
  }
  console.log('Smoke OK — catalogue Schneider, pilote NSX160, légende:', pilot.legendItems, 'courbes');
  console.log('  device:', pilot.dev, '| trip:', pilot.tu, '| tr:', pilot.tr, 's | verdict:', pilot.verdict > 0);
  console.log('  UI: mode pro replié, traçabilité dans details, disclaimer masqué');
}

main().catch((e) => {
  console.error('Smoke échoué:', e.message);
  process.exit(1);
});
