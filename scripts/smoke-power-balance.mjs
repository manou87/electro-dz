#!/usr/bin/env node
/**
 * Smoke test — bilan de puissance pro (serveur http://127.0.0.1:8765).
 * node scripts/smoke-power-balance.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:8765';
const URL = `${BASE}/calcul-electrique.html`;

const errors = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  const res = await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  if (!res || res.status() !== 200) throw new Error(`HTTP ${res?.status() ?? 'no response'}`);

  await page.waitForSelector('#btn-calculate', { state: 'visible', timeout: 20000 });
  await page.waitForFunction(
    () => typeof window.ElectroDzCalc?.calculatePowerBalance === 'function',
    { timeout: 20000 }
  );

  await page.evaluate(() => {
    document.querySelector('[data-calc-id="power_balance"]')?.click();
  });
  await page.waitForSelector('#balance.active', { timeout: 8000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-balance-row]').length >= 1, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelector('.bal-ref')?.value === 'C1', { timeout: 8000 });
  await page.waitForFunction(
    () => document.querySelector('.bal-desig option[value="sockets_kitchen"]'),
    { timeout: 10000 }
  );

  await page.fill('#bal-pro-ref', 'TEST-LOCAL');
  const row = page.locator('[data-balance-row]').first();
  await row.locator('.bal-schema').fill('Q1');
  await row.locator('.bal-location').fill('RDC');
  await row.locator('.bal-board').fill('TD-RDC');
  await row.locator('.bal-desig').selectOption('sockets_kitchen');
  await row.locator('.bal-p').fill('3500');

  await page.click('#btn-calculate');
  await page.waitForSelector('#calc-global-result .bal-result-table', { timeout: 8000 });
  await page.waitForSelector('#bal-export-dock:not([hidden])', { timeout: 5000 });

  const summary = await page.evaluate(() => {
    const r = window.ElectroDzCalc.calculatePowerBalance({
      rows: [{ label: 'X', p: '3500', ku: '0.5', ks: '1' }],
      voltage: '230',
      cosPhi: '0.9',
      lang: 'fr',
    });
    return {
      kw: r.data?.result,
      ib: r.data?.additionalData?.ibA,
      exportVisible: !document.getElementById('bal-export-dock')?.hidden,
      rowCount: document.querySelectorAll('[data-balance-row]').length,
    };
  });

  if (parseFloat(summary.kw) <= 0) throw new Error(`Pd invalide: ${summary.kw}`);
  if (!summary.exportVisible) throw new Error('Barre export non visible');
  if (summary.rowCount < 2) throw new Error('Lignes bilan insuffisantes');

  await browser.close();

  if (errors.length) {
    console.error('Erreurs page:', errors.join('\n'));
    process.exit(1);
  }
  console.log('✅ Smoke bilan puissance OK');
  console.log(`   Pd ≈ ${summary.kw} kW · Ib ≈ ${summary.ib} A · ${summary.rowCount} lignes UI`);
  console.log(`   URL: ${URL}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
