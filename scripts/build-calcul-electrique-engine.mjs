/**
 * Génère website/js/calcul-electrique-engine.js depuis app/calculator.tsx
 * (même logique que l’app — ne pas éditer le .js à la main).
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const calcPath = path.join(root, 'app/calculator.tsx');
const extraPath = path.join(root, 'constants/calculatorExtraTranslations.ts');
const outPath = path.join(root, 'website/js/calcul-electrique-engine.js');

const lines = fs.readFileSync(calcPath, 'utf8').split('\n');

function slice(start, end) {
  return lines.slice(start, end).join('\n');
}

function findLine(pred) {
  const i = lines.findIndex(pred);
  if (i < 0) throw new Error('line not found');
  return i;
}

const extra = fs.readFileSync(extraPath, 'utf8');
function extractObj(name) {
  const m = extra.match(new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const;`, 'm'));
  if (!m) throw new Error('no ' + name);
  const obj = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\s+(\w+):\s*"(.*)",?\s*$/);
    if (mm) obj[mm[1]] = mm[2].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
  return obj;
}

const langsFr = fs.readFileSync(path.join(root, 'constants/languages.ts'), 'utf8');
function extractLangKeys(keys) {
  const fr = {};
  const ar = {};
  for (const key of keys) {
    const reFr = new RegExp(`^\\s+${key}:\\s*'((?:\\\\'|[^'])*)'`, 'm');
    const blockAr = langsFr.match(/ar:\s*\{([\s\S]*?)\n\s*en:\s*\{/m);
    const blockFr = langsFr.match(/fr:\s*\{([\s\S]*?)\n\s*ar:\s*\{/m);
    const mFr = blockFr?.[1].match(reFr);
    const mAr = blockAr?.[1].match(reFr);
    if (mFr) fr[key] = mFr[1].replace(/\\'/g, "'");
    if (mAr) ar[key] = mAr[1].replace(/\\'/g, "'");
  }
  return { fr, ar };
}

const LANG_KEYS = [
  'invalidValues', 'copper', 'aluminum', 'powerBalanceTri', 'powerBalanceMono', 'cosPhi', 'conductorType',
  'totalSelectivity', 'partialSelectivity', 'nullSelectivity', 'ratioFormula', 'breakerSelectivity', 'ddrSelectivity',
  'iccInterpretationHigh', 'iccInterpretationNormal', 'iccAlertFillTransformer', 'iccAlertInvalidValues',
  'fillAllFields', 'breakingTimeExplFallback', 'breakingTimeDeviceExplInvalid', 'breakingTimeDeviceExplThermal',
  'breakingTimeDeviceExplMagSlow', 'breakingTimeDeviceExplMagFast', 'breakingTimeDeviceExplInstant',
  'breakingTimeCkt_socket_32', 'breakingTimeCkt_fixed_final', 'breakingTimeCkt_distribution', 'breakingTimeCkt_portable',
];
const LANG_BASE = extractLangKeys(LANG_KEYS);

const i18nFr = extractObj('calculatorExtraFr');
const i18nAr = extractObj('calculatorExtraAr');

const helpers = slice(72, 168); // cableTextTpl through estimateIkFromLineLoop
const ddrMeta = slice(303, 341);
const getCompatible = slice(525, 538);
const copperConst = slice(365, 370);
const transformerBlock = slice(494, 516);

const constBlock = [
  slice(357, 362),
  slice(394, 471),
  slice(471, 488),
  slice(489, 494),
  slice(518, 524),
].join('\n');

const fns = [
  ['calculateIntensity', findLine((l) => l.includes('const calculateIntensity = () =>')), findLine((l) => l.trim() === 'const calculatePower = () => {')],
  ['calculatePower', findLine((l) => l.includes('const calculatePower = () =>')), findLine((l) => l.trim() === 'const calculateVoltage = () => {')],
  ['calculateVoltage', findLine((l) => l.includes('const calculateVoltage = () =>')), findLine((l) => l.trim() === 'const calculateResistance = () => {')],
  ['calculateResistance', findLine((l) => l.includes('const calculateResistance = () =>')), findLine((l) => l.trim() === 'const calculateEnergy = () => {')],
  ['calculateEnergy', findLine((l) => l.includes('const calculateEnergy = () =>')), findLine((l) => l.trim() === 'const calculateVoltageDrop = () => {')],
  ['calculateVoltageDrop', findLine((l) => l.includes('const calculateVoltageDrop = () =>')), findLine((l) => l.trim() === 'const calculateCableSection = () => {')],
  ['calculateCableSection', findLine((l) => l.includes('const calculateCableSection = () =>')), findLine((l) => l.trim() === 'const calculateSelectivity = () => {')],
  ['calculateSelectivity', findLine((l) => l.includes('const calculateSelectivity = () =>')), findLine((l) => l.trim() === 'const calculateICC = () => {')],
  ['calculateICC', findLine((l) => l.includes('const calculateICC = () =>')), findLine((l) => l.trim() === 'const calculatePowerBalance = () => {')],
  ['calculatePowerBalance', findLine((l) => l.includes('const calculatePowerBalance = () =>')), findLine((l) => l.trim() === 'const calculateCopperResistance = () => {')],
  ['calculateCopperResistance', findLine((l) => l.includes('const calculateCopperResistance = () =>')), findLine((l) => l.includes('const breakingTimeExplFromCode = (code'))],
  ['breakingTimeExplFromCode', findLine((l) => l.includes('const breakingTimeExplFromCode = (code')), findLine((l) => l.includes('const breakingDeviceExplText = (explCode'))],
  ['breakingDeviceExplText', findLine((l) => l.includes('const breakingDeviceExplText = (explCode')), findLine((l) => l.trim() === 'const calculateBreakingTime = () => {')],
  ['calculateBreakingTime', findLine((l) => l.includes('const calculateBreakingTime = () =>')), findLine((l) => l.trim() === 'const performCalculation = () => {')],
];

function portFn(name, body, params) {
  let b = body.replace(/^  const \w+ = \([^)]*\) => \{/, `function ${name}(${params}) {\n  const t = getT(lang);`);
  b = b.replace(/Alert\.alert\(t\.error, ([^)]+)\);\s*return;/g, 'return { error: true, message: $1 };');
  b = b.replace(/Alert\.alert\('Erreur', ([^)]+)\);\s*return;/g, 'return { error: true, message: $1 };');
  b = b.replace(/Alert\.alert\(t\.fillAllFields, ([^)]+)\);\s*return;/g, 'return { error: true, message: $1 };');
  b = b.replace(/setShowResultsModal\(true\);/g, '');
  b = b.replace(/console\.log\([^;]*\);/g, '');
  b = b.replace(/setCircuitCount\([^)]+\);/g, '');
  b = b.replace(/setResult\(\{/, 'return { ok: true, data: {');
  b = b.replace(/\}\);\s*\n\s*\};\s*$/m, '} }; }');
  return b;
}

function applyPortTransforms(b) {
  b = b.replace(/Alert\.alert\(t\.error, ([^)]+)\);\s*return;/g, 'return { error: true, message: $1 };');
  b = b.replace(/Alert\.alert\('Erreur', ([^)]+)\);\s*return;/g, 'return { error: true, message: $1 };');
  b = b.replace(/Alert\.alert\(t\.fillAllFields, ([^)]+)\);\s*return;/g, 'return { error: true, message: $1 };');
  b = b.replace(/setShowResultsModal\(true\);/g, '');
  b = b.replace(/console\.log\([^;]*\);/g, '');
  b = b.replace(/setCircuitCount\([^)]+\);/g, '');
  b = b.replace(/setResult\(\{/, 'return { ok: true, data: {');
  b = b.replace(/\}\);\s*\n\s*\};\s*$/m, '} }; }');
  return b;
}

function portCableSection(body) {
  let b = body.replace(/^  const calculateCableSection = \(\) => \{/, `function calculateCableSection(opts) {
  const lang = opts.lang || 'ar';
  const t = getT(lang);
  const current = String(opts.current ?? '');
  const length = String(opts.length ?? '');
  const voltage = String(opts.voltage ?? '230');
  const cosPhi = String(opts.cosPhi ?? '0.85');
  const temperature = String(opts.temperature ?? '20');
  const circuitCount = String(opts.circuitCount ?? '1');
  const conductorType = opts.conductorType || 'Cu';
  const insulationType = opts.insulationType || 'PVC';
  const selectedMethod = opts.selectedMethod || 'B1';`);
  b = applyPortTransforms(b);
  b = b.replace(/\}\);\s*\n\s*\n\s*\/\/ Debug[\s\S]*$/m, '} }; }');
  b = b.replace(/rejectedSections\.push\(\{([\s\S]*?)\} \}; \}/g, 'rejectedSections.push({$1});');
  b = b.replace(/alternatives\.push\(\{([\s\S]*?)\} \}; \}/g, 'alternatives.push({$1});');
  b = b.replace(/\}\);\s*\n\s*\}\s*\n\s*altText/g, '});\n            }\n            altText');
  return b;
}

function portOptsFn(name, body, preamble) {
  let b = body.replace(/^  const \w+ = \(\) => \{/, `function ${name}(opts) {\n${preamble}\n  const t = getT(lang);`);
  return applyPortTransforms(b);
}

function portSelectivity(body) {
  let b = body.replace(/^  const calculateSelectivity = \(\) => \{/, `function calculateSelectivity(opts) {
  const lang = opts.lang || 'ar';
  const t = getT(lang);
  const upstreamBreaker = String(opts.upstreamBreaker ?? '');
  const downstreamBreaker = String(opts.downstreamBreaker ?? '');
  const upstreamCurve = opts.upstreamCurve || 'C';
  const downstreamCurve = opts.downstreamCurve || 'C';
  const upstreamDDRType = opts.upstreamDDRType || 'AC';
  const downstreamDDRType = opts.downstreamDDRType || 'AC';
  const upstreamDDR = String(opts.upstreamDDR ?? '30');
  const downstreamDDR = String(opts.downstreamDDR ?? '30');
  const isSelectiveDDR = !!opts.isSelectiveDDR;
  const ddrSelectivityMatrix = buildDdrSelectivityMatrix(t);
  const breakerCurves = [{id:'B'},{id:'C'},{id:'D'},{id:'K'},{id:'Z'}];`);
  return applyPortTransforms(b);
}

function portPowerBalance(body) {
  let b = body.replace(/^  const calculatePowerBalance = \(\) => \{/, `function calculatePowerBalance(opts) {
  const lang = opts.lang || 'ar';
  const t = getT(lang);
  const cosPhi = String(opts.cosPhi ?? '0.9');
  const voltage = String(opts.voltage ?? '230');
  const powerBalanceRows = opts.rows || [];`);
  return applyPortTransforms(b);
}

function portBreaking(body) {
  let b = body.replace(/^  const calculateBreakingTime = \(\) => \{/, `function calculateBreakingTime(opts) {
  const lang = opts.lang || 'ar';
  const t = getT(lang);
  const breakingSubMode = opts.subMode || 'normative';
  const breakingEarthing = opts.earthing || 'TN';
  const breakingU0 = opts.u0 || '230';
  const breakingCircuitKind = opts.circuitKind || 'socket_32';
  const breakingDeviceIn = String(opts.deviceIn ?? '');
  const breakingDeviceCurve = opts.deviceCurve || 'C';
  const breakingDeviceIk = String(opts.deviceIk ?? '');
  const breakingDeviceIkSource = opts.deviceIkSource || 'manual';
  const breakingDeviceSectionMm2 = String(opts.deviceSection ?? '');
  const breakingDeviceLengthM = String(opts.deviceLength ?? '');
  const breakingDeviceMaterial = opts.deviceMaterial || 'Cu';
  const breakingDeviceZeOhm = String(opts.deviceZe ?? '0.35');
  const breakingDeviceLineU0 = opts.deviceLineU0 || '230';`);
  return applyPortTransforms(b);
}

function portIcc(body) {
  let b = body.replace(/^  const calculateICC = \(\) => \{/, `function calculateICC(opts) {
  const lang = opts.lang || 'ar';
  const t = getT(lang);
  const transfoKva = String(opts.transfoKva ?? '');
  const transfoUcc = String(opts.transfoUcc ?? '4');
  const upstreamPcc = String(opts.upstreamPcc ?? '500');
  const length = String(opts.length ?? '');
  const section = String(opts.section ?? '');
  const voltage = String(opts.voltage ?? '400');
  const conductorType = opts.conductorType || 'Cu';`);
  return applyPortTransforms(b);
}

const OPTS_PREAMBLES = {
  calculateIntensity: `  const lang = opts.lang || 'ar';
  const power = String(opts.power ?? '');
  const voltage = String(opts.voltage ?? '230');
  const cosPhi = String(opts.cosPhi ?? '1');`,
  calculatePower: `  const lang = opts.lang || 'ar';
  const current = String(opts.current ?? '');
  const voltage = String(opts.voltage ?? '230');
  const cosPhi = String(opts.cosPhi ?? '1');`,
  calculateVoltage: `  const lang = opts.lang || 'ar';
  const current = String(opts.current ?? '');
  const resistance = String(opts.resistance ?? '');`,
  calculateResistance: `  const lang = opts.lang || 'ar';
  const voltage = String(opts.voltage ?? '230');
  const current = String(opts.current ?? '');`,
  calculateEnergy: `  const lang = opts.lang || 'ar';
  const power = String(opts.power ?? '');
  const time = String(opts.time ?? '');`,
  calculateVoltageDrop: `  const lang = opts.lang || 'ar';
  const current = String(opts.current ?? '');
  const length = String(opts.length ?? '');
  const section = String(opts.section ?? '');
  const voltage = String(opts.voltage ?? '230');
  const conductorType = opts.conductorType || 'Cu';`,
  calculateCopperResistance: `  const lang = opts.lang || 'ar';
  const length = String(opts.length ?? '');
  const section = String(opts.section ?? '');
  const temperature = String(opts.temperature ?? '');`,
};

let src = `
declare function getT(lang: string): any;
declare function buildDdrSelectivityMatrix(tr: any): any;
declare const installationMethods: {id:string;name?:string}[];
${helpers.replace(/function cableTextTpl/g, 'function cableTextTplLocal')}
function cableTextTpl(tpl: string, vars: Record<string, string | number>) { return cableTextTplLocal(tpl, vars as Record<string, string>); }
function getBreakingCircuitLabel(t: Record<string, string>, kind: string): string {
  const m: Record<string, string> = {
    socket_32: 'breakingTimeCkt_socket_32',
    fixed_final: 'breakingTimeCkt_fixed_final',
    distribution: 'breakingTimeCkt_distribution',
    portable: 'breakingTimeCkt_portable',
  };
  const key = m[kind];
  return key ? String(t[key]) : kind;
}
${ddrMeta.replace('function buildDdrSelectivityMatrix(tr: AnyLang)', 'function buildDdrSelectivityMatrix(tr: any)')}
${getCompatible}
${copperConst}
${transformerBlock}
${constBlock}
const installationMethods = [{id:'A1'},{id:'A2'},{id:'B1'},{id:'B2'},{id:'C'},{id:'D1'},{id:'D2'},{id:'E'},{id:'F'},{id:'G'}];
`;

for (const [name, start, end] of fns) {
  const body = slice(start, end);
  if (name === 'calculateCableSection') src += '\n' + portCableSection(body);
  else if (name === 'calculateSelectivity') src += '\n' + portSelectivity(body);
  else if (name === 'calculatePowerBalance') src += '\n' + portPowerBalance(body);
  else if (name === 'calculateBreakingTime') src += '\n' + portBreaking(body);
  else if (name === 'calculateICC') src += '\n' + portIcc(body);
  else if (name.startsWith('breaking')) {
    src += '\n' + body
      .replace(/^  const breakingTimeExplFromCode = /, 'function breakingTimeExplFromCode ')
      .replace(/^  const breakingDeviceExplText = /, 'function breakingDeviceExplText ')
      .replace(/: string/g, '');
  } else if (OPTS_PREAMBLES[name]) {
    src += '\n' + portOptsFn(name, body, OPTS_PREAMBLES[name]);
  }
}

let js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
}).outputText;

js = js
  .replace(/rejectedSections\.push\(\{([\s\S]*?)\} \}; \}/g, 'rejectedSections.push({$1});')
  .replace(/alternatives\.push\(\{([\s\S]*?)\} \}; \}/g, 'alternatives.push({$1});')
  .replace(/    \} \}; \}\n\}/g, '    } };\n}');

const header = `/** Généré par scripts/build-calcul-electrique-engine.mjs — source app/calculator.tsx */
(function (global) {
'use strict';
const CT = global.ElectroDzCableThermal;
if (!CT) throw new Error('Charger js/cableThermalIEC60364.js');
const { groupingFactorK4Iec60364, thermalOk, computeThermalSizing } = CT;
const I18N = { fr: ${JSON.stringify(i18nFr)}, ar: ${JSON.stringify(i18nAr)} };
const LANG_BASE = ${JSON.stringify(LANG_BASE)};
function getT(lang) {
  const k = lang === 'ar' ? 'ar' : 'fr';
  return { ...LANG_BASE[k], ...(I18N[k] || I18N.fr) };
}
function cableTextTpl(tpl, vars) { return tpl.replace(/\\{(\\w+)\\}/g, (_, k) => String(vars[k] ?? '')); }
`;

const footer = `
function calculateOhm({ u, i, r }) {
  const Uin = u === '' || u == null ? NaN : parseFloat(u);
  const Iin = i === '' || i == null ? NaN : parseFloat(i);
  const Rin = r === '' || r == null ? NaN : parseFloat(r);
  const hasU = !isNaN(Uin), hasI = !isNaN(Iin), hasR = !isNaN(Rin);
  if ((hasU?1:0)+(hasI?1:0)+(hasR?1:0) !== 2) return { error: true, message: '2 valeurs sur 3' };
  const isTriphase = hasU && Uin >= 400;
  if (hasU && hasI) {
    const R = isTriphase ? Uin / (Iin * Math.sqrt(3)) : Uin / Iin;
    return { ok: true, data: { result: R.toFixed(2), unit: 'Ω', formula: isTriphase ? 'R = U / (I × √3)' : 'R = U / I' } };
  }
  if (hasU && hasR) return { ok: true, data: { result: (Uin/Rin).toFixed(2), unit: 'A', formula: 'I = U / R' } };
  return { ok: true, data: { result: (Rin*Iin).toFixed(2), unit: 'V', formula: 'U = R × I' } };
}

global.ElectroDzCalc = {
  calculateOhm,
  calculateIntensity: (p) => calculateIntensity({ ...p, lang: p.lang || 'ar' }),
  calculatePower: (p) => calculatePower({ current: p.current, voltage: p.voltage, cosPhi: p.cosPhi, lang: p.lang || 'ar' }),
  calculateVoltage: (p) => calculateVoltage({ current: p.current, resistance: p.resistance, lang: p.lang || 'ar' }),
  calculateResistance: (p) => calculateResistance({ voltage: p.voltage, current: p.current, lang: p.lang || 'ar' }),
  calculateEnergy: (p) => calculateEnergy({ power: p.power, time: p.time, lang: p.lang || 'ar' }),
  calculateVoltageDrop: (p) => calculateVoltageDrop({ current: p.current, length: p.length, section: p.section, voltage: p.voltage, conductorType: p.conductorType, lang: p.lang || 'ar' }),
  calculateCableSection,
  calculateCopperResistance: (p) => calculateCopperResistance({ length: p.length, section: p.section, temperature: p.temperature, lang: p.lang || 'ar' }),
  calculateSelectivity,
  calculateICC,
  calculatePowerBalance,
  calculateBreakingTime,
};
})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.writeFileSync(outPath, header + js + footer);
console.log('Written', outPath);
