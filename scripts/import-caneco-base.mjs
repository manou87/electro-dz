#!/usr/bin/env node
/**
 * Inventaire local du répertoire BASE de Caneco BT (licence utilisateur).
 * N’extrait pas les courbes t(I) EDIELEC (format propriétaire ALPI) — liste les
 * fichiers constructeur et libellés détectés pour fusion manuelle ou via merge.
 *
 * Usage:
 *   node scripts/import-caneco-base.mjs --base "/chemin/vers/COUNTRY/BASE"
 *   node scripts/import-caneco-base.mjs --base "C:\\Caneco\\FR\\BASE" --brand schneider
 *   node scripts/import-caneco-base.mjs --base ... --out data/trip-curves/imported/schneider-caneco.json
 *   node scripts/import-caneco-base.mjs --base ... --merge data/trip-curves/schneider.json
 *
 * Variable d’environnement: CANECO_BASE
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const BREAKER_EXT = new Set(['.dug', '.dmd', '.dmi', '.dst', '.dmt']);
const BRAND_HINTS = [
  { id: 'schneider', re: /schneider|sonepar|telemecanique|square\s*d/i },
  { id: 'abb', re: /\babb\b/i },
  { id: 'hager', re: /\bhager\b/i },
];

const DEVICE_NAME_RE = /\b(NSX|NSXm|NSX[mM]?|NS\d|CVS|EZC|EZD|Masterpact|NW\d|NT\d|Tmax|XT\d|T\d|Emax|S200|NBN|NXN|CDC|HX\d|iC60|iDPN|NG125|DPX|Isomax)[^\x00-\x1f]{0,40}/gi;

function parseArgs(argv) {
  const opts = { base: process.env.CANECO_BASE || '', brand: '', out: '', merge: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base' && argv[i + 1]) opts.base = argv[++i];
    else if (a === '--brand' && argv[i + 1]) opts.brand = argv[++i].toLowerCase();
    else if (a === '--out' && argv[i + 1]) opts.out = argv[++i];
    else if (a === '--merge' && argv[i + 1]) opts.merge = argv[++i];
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

function detectFormat(buf) {
  const head = buf.slice(0, 64).toString('latin1');
  if (/EDIELEC/i.test(head)) return 'EDIELEC';
  if (/CANECO/i.test(head) || /Caneco\s*4/i.test(head)) return 'caneco4';
  const printable = buf.slice(0, 200).filter((b) => b >= 32 && b <= 126).length;
  if (printable > 120) return 'text';
  return 'binary';
}

function extractAsciiStrings(buf, minLen = 5) {
  const out = new Set();
  let cur = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b >= 32 && b <= 126) cur += String.fromCharCode(b);
    else {
      if (cur.length >= minLen) out.add(cur.trim());
      cur = '';
    }
  }
  if (cur.length >= minLen) out.add(cur.trim());
  return [...out];
}

function extractUtf16LeStrings(buf, minLen = 4) {
  const out = new Set();
  let cur = '';
  for (let i = 0; i < buf.length - 1; i += 2) {
    const code = buf[i] | (buf[i + 1] << 8);
    if (code >= 32 && code < 127) cur += String.fromCharCode(code);
    else {
      if (cur.length >= minLen) out.add(cur.trim());
      cur = '';
    }
  }
  if (cur.length >= minLen) out.add(cur.trim());
  return [...out];
}

function guessBrandFromPath(relPath) {
  for (const h of BRAND_HINTS) {
    if (h.re.test(relPath)) return h.id;
  }
  return '';
}

function slugId(label) {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'device';
}

function scanFile(absPath, relPath) {
  const buf = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const format = detectFormat(buf);
  const ascii = extractAsciiStrings(buf);
  const utf16 = extractUtf16LeStrings(buf);
  const merged = [...new Set([...ascii, ...utf16])];
  const deviceNames = new Set();
  merged.join('\n').replace(DEVICE_NAME_RE, (m) => deviceNames.add(m.trim().slice(0, 60)));
  const baseName = path.basename(absPath, ext);
  if (/[A-Za-z]{2,}/.test(baseName)) deviceNames.add(baseName);

  return {
    file: relPath,
    ext,
    format,
    size: buf.length,
    labels: [...deviceNames].slice(0, 12),
    stringSample: merged.filter((s) => s.length >= 6 && s.length <= 80).slice(0, 8),
  };
}

function walk(baseDir, onFile) {
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    const dir = rel ? path.join(baseDir, rel) : baseDir;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const childRel = rel ? path.join(rel, ent.name) : ent.name;
      if (ent.isDirectory()) stack.push(childRel);
      else if (ent.isFile() && BREAKER_EXT.has(path.extname(ent.name).toLowerCase())) {
        onFile(path.join(dir, ent.name), childRel);
      }
    }
  }
}

function buildImportPayload(baseDir, brandFilter, files) {
  const byBrand = { schneider: [], abb: [], hager: [], unknown: [] };
  for (const f of files) {
    let bid = guessBrandFromPath(f.file) || 'unknown';
    if (brandFilter && (bid === 'unknown' || bid !== brandFilter)) bid = brandFilter;
    (byBrand[bid] || byBrand.unknown).push(f);
  }

  const brands = brandFilter ? [brandFilter] : ['schneider', 'abb', 'hager'];
  const payloads = [];

  for (const brandId of brands) {
    const list = byBrand[brandId] || [];
    if (!list.length && brandFilter) continue;

    const devices = [];
    const seen = new Set();
    for (const entry of list) {
      for (const label of entry.labels.length ? entry.labels : [path.basename(entry.file, entry.ext)]) {
        const id = slugId(label);
        if (seen.has(id)) continue;
        seen.add(id);
        devices.push({
          id,
          label,
          group: 'Import Caneco',
          family: 'caneco_import',
          frameA: null,
          inRatings: [],
          kind: 'breaker',
          deviceType: 'mccb',
          tripUnitIds: [],
          _caneco: { file: entry.file, format: entry.format },
        });
      }
    }

    const brandLabels = { schneider: 'Schneider Electric', abb: 'ABB', hager: 'Hager' };
    payloads.push({
      brandId,
      brand: brandLabels[brandId] || brandId,
      source: `Import local Caneco BT BASE — ${path.basename(baseDir)} (${list.length} fichier(s) .dug/.dmd/.dmi). Courbes t(I) non extraites (EDIELEC propriétaire). Compléter tripUnits/devices ou fusionner avec le catalogue site.`,
      revision: `caneco-import-${new Date().toISOString().slice(0, 10)}`,
      importedFrom: baseDir,
      filesScanned: list.length,
      fileInventory: list.slice(0, 500),
      tripUnits: {},
      devices,
      families: [{ id: 'caneco_import', label: 'Import Caneco' }, { id: 'all', label: 'Toute la gamme' }],
    });
  }

  return payloads;
}

function mergeIntoCatalog(targetPath, payload) {
  if (!fs.existsSync(targetPath)) {
    console.error('Fichier catalogue introuvable:', targetPath);
    process.exit(1);
  }
  const base = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const ids = new Set((base.devices || []).map((d) => d.id));
  let added = 0;
  for (const d of payload.devices || []) {
    if (!d.tripUnitIds?.length) {
      const tpl = (base.devices || []).find((x) => x.tripUnitIds?.length);
      if (tpl) d.tripUnitIds = [...tpl.tripUnitIds];
    }
    if (!d.inRatings?.length) {
      const tpl = (base.devices || []).find((x) => x.inRatings?.length);
      if (tpl) d.inRatings = [...tpl.inRatings];
    }
    if (ids.has(d.id)) continue;
    base.devices.push(d);
    ids.add(d.id);
    added++;
  }
  base.source = (base.source || '') + ` + import Caneco (${added} réf. ajoutées)`;
  fs.writeFileSync(targetPath, JSON.stringify(base, null, 2) + '\n');
  console.log(`Fusion: ${added} appareil(s) ajouté(s) → ${targetPath}`);
}

function printHelp() {
  console.log(`
Import inventaire Caneco BT (BASE local — licence ALPI requise)

  --base <dir>     Répertoire BASE (ex. .../FR/BASE)
  --brand <id>     schneider | abb | hager (optionnel)
  --out <fichier>  JSON de sortie (défaut: data/trip-curves/imported/<brand>-caneco.json)
  --merge <json>   Ajoute les références absentes au catalogue site existant

Ne pas publier les JSON générés sur GitHub sans accord ALPI/constructeurs.
`);
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help || !opts.base) {
    printHelp();
    process.exit(opts.base ? 0 : 1);
  }

  const baseDir = path.resolve(opts.base);
  if (!fs.existsSync(baseDir)) {
    console.error('Répertoire BASE introuvable:', baseDir);
    process.exit(1);
  }

  const files = [];
  walk(baseDir, (abs, rel) => {
    try {
      files.push(scanFile(abs, rel.replace(/\\/g, '/')));
    } catch (e) {
      console.warn('Skip', rel, e.message);
    }
  });

  console.log(`BASE: ${baseDir}`);
  console.log(`Fichiers disjoncteurs: ${files.length}`);

  const payloads = buildImportPayload(baseDir, opts.brand || '', files);
  if (!payloads.length) {
    console.warn('Aucun fichier pour les marques ciblées. Vérifiez --base et --brand.');
  }

  for (const payload of payloads) {
    if (opts.merge) {
      mergeIntoCatalog(path.resolve(opts.merge), payload);
      continue;
    }
    const outDir = path.join(ROOT, 'data/trip-curves/imported');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = opts.out
      ? path.resolve(opts.out)
      : path.join(outDir, `${payload.brandId}-caneco.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
    console.log(`Écrit: ${outPath} (${payload.devices.length} libellés, ${payload.filesScanned} fichiers)`);
  }
}

main();
