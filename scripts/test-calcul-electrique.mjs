/**
 * Tests moteur calculateur site — même entrées que scénarios manuels app.
 */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadCalc() {
  const w = { window: {} };
  const ctx = { window: w.window, console };
  vm.createContext(ctx);
  for (const f of [
    'js/cableThermalIEC60364.js',
    'js/calcul-electrique-engine.js',
    'js/calcul-electrique-extra.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  }
  return Object.assign({}, w.window.ElectroDzCalcCore, w.window.ElectroDzCalcExtra);
}

const C = loadCalc();
const lang = 'fr';
let passed = 0;
let failed = 0;

function test(name, fn, expect) {
  try {
    const r = fn();
    if (r.error) {
      failed++;
      console.log(`❌ ${name}: erreur — ${r.message}`);
      return;
    }
    if (!r.ok) {
      failed++;
      console.log(`❌ ${name}: pas ok`);
      return;
    }
    const ok = expect(r);
    if (ok) {
      passed++;
      console.log(`✅ ${name}: ${r.data.result}${r.data.unit ? ' ' + r.data.unit : ''}`);
    } else {
      failed++;
      console.log(`❌ ${name}: résultat inattendu`, r.data);
    }
  } catch (e) {
    failed++;
    console.log(`❌ ${name}: exception — ${e.message}`);
  }
}

test('Ohm U=R×I', () => C.calculateOhm({ u: '', i: '10', r: '23' }), (r) => parseFloat(r.data.result) === 230);
test('Puissance 230V×10A', () => C.calculatePower({ current: '10', voltage: '230', cosPhi: '1', lang }), (r) => r.data.result === '2300.00');
test('Intensité P=2300W', () => C.calculateIntensity({ power: '2300', voltage: '230', cosPhi: '1', lang }), (r) => r.data.result === '10.00');
test('Tension U=R×I', () => C.calculateVoltage({ current: '10', resistance: '23', lang }), (r) => r.data.result === '230.00');
test('Résistance U/I', () => C.calculateResistance({ voltage: '230', current: '10', lang }), (r) => r.data.result === '23.00');
test('Énergie P×t', () => C.calculateEnergy({ power: '1000', time: '2', lang }), (r) => r.data.result === '2000.00');
test('Chute ΔU 32A 25m 6mm²', () => C.calculateVoltageDrop({ current: '32', length: '25', section: '6', voltage: '230', conductorType: 'Cu', lang }), (r) => {
  const v = parseFloat(r.data.result);
  return v > 4.9 && v < 5.0;
});
test('Section 32A 25m B1', () => C.calculateCableSection({
  current: '32', length: '25', voltage: '230', cosPhi: '0.85', temperature: '30',
  circuitCount: '1', conductorType: 'Cu', insulationType: 'PVC', selectedMethod: 'B1', lang,
}), (r) => String(r.data.result).includes('6'));
test('Cu R(T)', () => C.calculateCopperResistance({ length: '10', section: '2.5', temperature: '30', lang }), (r) => parseFloat(r.data.result) > 0);
test('Sélectivité 63/16 C/C', () => C.calculateSelectivity({
  upstreamBreaker: '63', downstreamBreaker: '16', upstreamCurve: 'C', downstreamCurve: 'C',
  upstreamDDRType: 'AC', downstreamDDRType: 'AC', isSelectiveDDR: false, lang,
}), (r) => r.data.result && r.data.result.length > 0);
test('Icc 250kVA', () => C.calculateICC({
  transfoKva: '250', transfoUcc: '4', upstreamPcc: '500', length: '20', section: '16',
  voltage: '400', conductorType: 'Cu', lang,
}), (r) => parseFloat(r.data.result) > 0);
test('Bilan puissance', () => C.calculatePowerBalance({
  rows: [{ label: 'L1', p: '3000', ku: '1', ks: '0.8' }],
  voltage: '230', cosPhi: '0.9', lang,
}), (r) => parseFloat(r.data.result) > 0);
test('Temps coupure TN 230 prises', () => C.calculateBreakingTime({
  subMode: 'normative', earthing: 'TN', u0: '230', circuitKind: 'socket_32', lang,
}), (r) => r.data.result === '0.4');
test('Disjoncteur t~', () => C.calculateBreakingTime({
  subMode: 'device', deviceIn: '16', deviceCurve: 'C', deviceIk: '300', lang,
}), (r) => r.data.result && r.data.result !== '—');

console.log(`\n--- ${passed} OK, ${failed} échec(s) ---`);
process.exit(failed > 0 ? 1 : 0);
