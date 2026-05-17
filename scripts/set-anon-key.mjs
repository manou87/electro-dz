#!/usr/bin/env node
/**
 * Met à jour SUPABASE_ANON_KEY dans js/site-config.js
 * Usage : node scripts/set-anon-key.mjs eyJhbGciOiJIUzI1NiIs...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const key = process.argv[2]?.trim();
if (!key || key.length < 20) {
  console.error('Usage : node scripts/set-anon-key.mjs VOTRE_CLE_ANON');
  console.error('  Dashboard : https://supabase.com/dashboard/project/wxiqqcnzcxswdqzubxyt/settings/api');
  console.error('  Copiez « anon » / « publishable » (clé publique longue commençant par eyJ…)');
  process.exit(1);
}

const configPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'site-config.js');
let src = fs.readFileSync(configPath, 'utf8');
const re = /const SUPABASE_ANON_KEY\s*=\s*'[^']*';/;
if (!re.test(src)) {
  console.error('SUPABASE_ANON_KEY introuvable dans site-config.js');
  process.exit(1);
}
src = src.replace(re, `const SUPABASE_ANON_KEY = '${key.replace(/'/g, '')}';`);
fs.writeFileSync(configPath, src);
console.log('OK — site-config.js mis à jour. Déployez : git add js/site-config.js && git commit && git push');
