#!/usr/bin/env node
/** Extrait PRESET_ITEMS (app/devis.tsx) + DEVIS_ARTISAN_PRESET_ITEMS → website/js/devis-catalog.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const devisTs = fs.readFileSync(path.join(root, 'app/devis.tsx'), 'utf8');
const start = devisTs.indexOf('const PRESET_ITEMS = [');
const end = devisTs.indexOf('\n];', start);
const block = devisTs.slice(start, end + 4);
const itemRe = /\{\s*description:\s*'((?:\\'|[^'])*)'\s*,\s*category:\s*'((?:\\'|[^'])*)'\s*\}/g;
const electric = [];
let m;
while ((m = itemRe.exec(block))) {
  electric.push({
    description: m[1].replace(/\\'/g, "'"),
    category: m[2].replace(/\\'/g, "'"),
  });
}

const artisanTs = fs.readFileSync(path.join(root, 'constants/devisArtisanPresets.ts'), 'utf8');
const artisan = [];
while ((m = itemRe.exec(artisanTs))) {
  artisan.push({
    description: m[1].replace(/\\'/g, "'"),
    category: m[2].replace(/\\'/g, "'"),
  });
}

const catalog = [...electric, ...artisan];
const cats = [...new Set(catalog.map((i) => i.category))].sort();

const catI18nTs = fs.readFileSync(path.join(root, 'constants/devisCategoryI18n.ts'), 'utf8');
const catAr = {};
const catRe = /(?:'((?:\\'|[^'])*)'|(\w+)):\s*\{[\s\S]*?ar:\s*'((?:\\'|[^'])*)'/g;
while ((m = catRe.exec(catI18nTs))) {
  const key = (m[1] || m[2]).replace(/\\'/g, "'");
  catAr[key] = m[3].replace(/\\'/g, "'");
}

const out = `/* Généré par scripts/build-devis-catalog.mjs */\n(function (g) {\n  g.DEVIS_CATALOG = ${JSON.stringify(catalog)};\n  g.DEVIS_CATEGORIES = ${JSON.stringify(cats)};\n  g.DEVIS_CAT_AR = ${JSON.stringify(catAr)};\n})(typeof window !== 'undefined' ? window : globalThis);\n`;

const dest = path.join(root, 'website/js/devis-catalog.js');
fs.writeFileSync(dest, out);
console.log('OK', catalog.length, 'articles,', cats.length, 'catégories →', dest);
