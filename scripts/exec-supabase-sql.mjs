#!/usr/bin/env node
/**
 * Exécute le SQL Supabase via :
 * 1) API Management (fichier .supabase-access-token ou SUPABASE_ACCESS_TOKEN)
 * 2) Postgres direct (.supabase-db-password ou SUPABASE_DB_PASSWORD)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE = path.join(__dirname, '..');
const PROJECT_REF = 'wxiqqcnzcxswdqzubxyt';
const SQL_FILE = path.join(WEBSITE, 'supabase', 'TOUT-EXECUTER-UNE-FOIS.sql');

function loadToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const f = path.join(WEBSITE, '.supabase-access-token');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  return null;
}

function loadDbPassword() {
  if (process.env.SUPABASE_DB_PASSWORD?.trim()) {
    return process.env.SUPABASE_DB_PASSWORD.trim();
  }
  const f = path.join(WEBSITE, '.supabase-db-password');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  return null;
}

async function runViaManagementApi(token, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function runViaPostgres(password, query) {
  const require = createRequire(import.meta.url);
  const vendorPg = path.join(__dirname, 'vendor', 'postgres', 'src', 'index.js');
  let postgres;
  if (fs.existsSync(vendorPg)) {
    postgres = require(vendorPg);
  } else {
    const tmpPg = '/tmp/package/src/index.js';
    if (!fs.existsSync(tmpPg)) {
      throw new Error('Module postgres absent. Lancez: bash scripts/install-pg-vendor.sh');
    }
    postgres = require(tmpPg);
  }

  const hosts = [
    `postgresql://postgres:${encodeURIComponent(password)}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-eu-central-2.pooler.supabase.com:6543/postgres`,
  ];

  let lastErr;
  for (const url of hosts) {
    const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 15 });
    try {
      await sql.unsafe(query);
      await sql.end({ timeout: 5 });
      console.log('  OK via Postgres', url.replace(/:[^:@]+@/, ':***@'));
      return;
    } catch (e) {
      lastErr = e;
      try {
        await sql.end({ timeout: 2 });
      } catch (_) { /* ignore */ }
    }
  }
  throw lastErr || new Error('Connexion Postgres impossible');
}

async function verifyApi() {
  const cfg = fs.readFileSync(path.join(WEBSITE, 'js', 'site-config.js'), 'utf8');
  const m = cfg.match(/const SUPABASE_ANON_KEY = '([^']+)'/);
  const key = m?.[1];
  if (!key) return;
  const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/get_pdf_stats_totals`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const text = await res.text();
  if (res.ok) {
    console.log('→ Stats PDF API : OK', text.slice(0, 80));
  } else {
    console.warn('→ Stats PDF API :', res.status, text.slice(0, 120));
  }
}

async function main() {
  const query = fs.readFileSync(SQL_FILE, 'utf8');
  console.log('SwissDZ — exécution SQL Supabase\n');

  const token = loadToken();
  if (token) {
    console.log('→ API Management Supabase…');
    await runViaManagementApi(token, query);
    console.log('  SQL exécuté via API Management.');
    await verifyApi();
    return;
  }

  const dbPass = loadDbPassword();
  if (dbPass) {
    console.log('→ Connexion Postgres directe…');
    await runViaPostgres(dbPass, query);
    console.log('  SQL exécuté via Postgres.');
    await verifyApi();
    return;
  }

  console.error(
    'Aucun accès Supabase trouvé.\n' +
      '  Option A : echo "sbp_..." > website/.supabase-access-token\n' +
      '  Option B : mot de passe base → website/.supabase-db-password\n' +
      '  Option C (Mac) : bash scripts/run-supabase-sql-mac.sh'
  );
  process.exit(1);
}

main().catch((e) => {
  console.error('Échec :', e.message || e);
  process.exit(1);
});
