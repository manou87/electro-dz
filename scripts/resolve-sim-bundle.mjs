#!/usr/bin/env node
/** Dernier bundle JS du simulateur (index-*.js). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../simulation-swissdz/assets');
const files = fs
  .readdirSync(assetsDir)
  .filter((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f))
  .map((f) => ({ f, m: fs.statSync(path.join(assetsDir, f)).mtimeMs }))
  .sort((a, b) => b.m - a.m);

if (!files.length) throw new Error('Aucun bundle index-*.js dans simulation-swissdz/assets');
export const BUNDLE = path.join(assetsDir, files[0].f);
export const BUNDLE_NAME = files[0].f;
