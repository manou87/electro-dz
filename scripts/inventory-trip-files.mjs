#!/usr/bin/env node
/**
 * Inventaire : fichiers courbes du projet + PDF refs + recherche Caneco BASE locale.
 * Sortie : data/trip-curves/file-inventory.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TRIP_DIR = path.join(ROOT, 'data/trip-curves');
const OUT = path.join(TRIP_DIR, 'file-inventory.json');

const CANECO_SEARCH_ROOTS = [
  process.env.CANECO_BASE,
  process.env.HOME && path.join(process.env.HOME, 'Caneco'),
  '/Applications/Caneco BT',
  '/Applications/CanecoBT',
  '/Applications/ALPI',
  'C:\\Caneco',
  'C:\\Program Files\\ALPI',
  'C:\\Program Files (x86)\\ALPI',
].filter(Boolean);

const BREAKER_EXT = new Set(['.dug', '.dmd', '.dmi', '.dst', '.dmt', '.dth']);

function walk(dir, maxDepth, onFile, depth = 0) {
  if (depth > maxDepth) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!ent.name.startsWith('.') && ent.name !== 'node_modules') {
        walk(full, maxDepth, onFile, depth + 1);
      }
    } else if (ent.isFile()) {
      onFile(full);
    }
  }
}

function scanProject() {
  const files = [];
  walk(TRIP_DIR, 6, (full) => {
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    const ext = path.extname(full).toLowerCase();
    let kind = 'other';
    if (rel.endsWith('.json')) kind = 'catalog';
    else if (ext === '.pdf') kind = 'reference-pdf';
    else if (BREAKER_EXT.has(ext)) kind = 'caneco-edielec';
    files.push({
      path: rel,
      kind,
      bytes: fs.statSync(full).size,
      ext: ext || '(none)',
    });
  });
  return files;
}

function findCanecoBase() {
  const found = [];
  for (const root of CANECO_SEARCH_ROOTS) {
    if (!fs.existsSync(root)) continue;
    const stat = fs.statSync(root);
    if (stat.isDirectory()) {
      const hasBreaker = [];
      walk(root, 4, (f) => {
        if (BREAKER_EXT.has(path.extname(f).toLowerCase())) hasBreaker.push(f);
      });
      if (hasBreaker.length) {
        found.push({
          basePath: root,
          sampleFiles: hasBreaker.slice(0, 20).map((f) => path.relative(root, f)),
          breakerFileCount: hasBreaker.length,
        });
      } else if (path.basename(root).toUpperCase() === 'BASE' || /caneco|alpi/i.test(root)) {
        found.push({ basePath: root, sampleFiles: [], breakerFileCount: 0, note: 'Dossier trouvé, aucun .dug/.dmd scanné' });
      }
    }
  }
  return found;
}

function summarizeCatalogs(projectFiles) {
  const catalogs = projectFiles.filter((f) => f.kind === 'catalog' && !f.path.includes('inventory') && !f.path.includes('example'));
  return catalogs.map((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ROOT, f.path), 'utf8'));
      return {
        file: f.path,
        brand: data.brand || data.brandId,
        revision: data.revision,
        devices: data.devices?.length,
        tripUnits: data.tripUnits ? Object.keys(data.tripUnits).length : 0,
      };
    } catch {
      return { file: f.path, error: 'parse' };
    }
  });
}

function main() {
  const projectFiles = scanProject();
  const caneco = findCanecoBase();
  const manifestPath = path.join(TRIP_DIR, 'refs/manifest.json');
  let refsManifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      refsManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) { /* ignore */ }
  }

  const inventory = {
    generatedAt: new Date().toISOString(),
    projectRoot: ROOT,
    summary: {
      projectFileCount: projectFiles.length,
      pdfRefCount: projectFiles.filter((f) => f.kind === 'reference-pdf').length,
      catalogCount: projectFiles.filter((f) => f.kind === 'catalog' && f.path.endsWith('.json')).length,
      canecoInstallationsFound: caneco.length,
    },
    catalogs: summarizeCatalogs(projectFiles),
    projectFiles,
    publicRefsManifest: refsManifest,
    canecoLocal: caneco.length
      ? caneco
      : {
          searched: CANECO_SEARCH_ROOTS,
          message: 'Aucune installation Caneco BASE détectée sur cette machine. Définir CANECO_BASE=/chemin/vers/BASE puis relancer.',
        },
    scripts: [
      'scripts/fetch-public-trip-docs.mjs',
      'scripts/build-all-trip-catalogs.js',
      'scripts/import-caneco-base.mjs',
      'scripts/inventory-trip-files.mjs',
      'scripts/public-trip-curve-data.js',
    ],
  };

  fs.writeFileSync(OUT, JSON.stringify(inventory, null, 2) + '\n');
  console.log('Inventaire:', OUT);
  console.log('Fichiers projet:', inventory.summary.projectFileCount);
  console.log('PDF refs:', inventory.summary.pdfRefCount);
  console.log('Caneco BASE:', caneco.length ? caneco.map((c) => c.basePath).join(', ') : 'non trouvé');
}

main();
