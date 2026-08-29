#!/usr/bin/env node
/**
 * Applique REGLAGES-SUPABASE-SITE.txt via l'API Management Supabase.
 *
 * Prérequis :
 *   1. Token : https://supabase.com/dashboard/account/tokens
 *      Scopes : database_write + auth_write (ou token classique « All »)
 *   2. Fichier website/.supabase-access-token (une ligne) OU
 *      export SUPABASE_ACCESS_TOKEN=sbp_...
 *   3. (Optionnel Google) GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 *      (Optionnel Facebook) FACEBOOK_CLIENT_ID + FACEBOOK_CLIENT_SECRET
 *
 * Usage : node scripts/apply-supabase-site-setup.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE = path.join(__dirname, '..');
const SUPABASE_DIR = path.join(WEBSITE, 'supabase');
const PROJECT_REF = 'wxiqqcnzcxswdqzubxyt';

const REDIRECT_URLS = [
  'https://electro-dz.com/auth-callback.html',
  'https://www.electro-dz.com/auth-callback.html',
  'https://electro-dz.com/**',
  'https://www.electro-dz.com/**',
  'https://electro-dz.com/oauth/consent',
  'https://electro-dz.com/oauth/consent/',
  'http://localhost:5500/auth-callback.html',
  'http://127.0.0.1:5500/auth-callback.html',
  'http://localhost:8765/auth-callback.html',
];

function loadAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const file = path.join(WEBSITE, '.supabase-access-token');
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').trim();
  }
  return null;
}

async function mgmt(apiPath, options = {}) {
  const token = loadAccessToken();
  if (!token) {
    throw new Error(
      'Token manquant.\n' +
        '  Créez https://supabase.com/dashboard/account/tokens\n' +
        '  Puis : echo "sbp_..." > website/.supabase-access-token'
    );
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}${apiPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`API ${res.status} ${apiPath}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function runSqlFile(filename) {
  const filePath = path.join(SUPABASE_DIR, filename);
  const query = fs.readFileSync(filePath, 'utf8');
  console.log(`→ SQL ${filename}`);
  await mgmt('/database/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  console.log(`  OK`);
}

async function patchAuthConfig() {
  const body = {
    site_url: 'https://electro-dz.com',
    uri_allow_list: REDIRECT_URLS.join('\n'),
    external_email_enabled: true,
  };

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (googleId && googleSecret) {
    body.external_google_enabled = true;
    body.external_google_client_id = googleId;
    body.external_google_secret = googleSecret;
    console.log('→ Google OAuth : activation demandée');
  } else {
    console.log('→ Google OAuth : ignoré (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET non définis)');
    console.log('  Activez Google dans le dashboard ou relancez avec ces variables.');
  }

  const fbId = process.env.FACEBOOK_CLIENT_ID?.trim();
  const fbSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();
  if (fbId && fbSecret) {
    body.external_facebook_enabled = true;
    body.external_facebook_client_id = fbId;
    body.external_facebook_secret = fbSecret;
    console.log('→ Facebook OAuth : activation demandée');
  } else {
    console.log('→ Facebook OAuth : ignoré (FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET non définis)');
  }

  console.log('→ Auth URLs (site + redirects)');
  await mgmt('/config/auth', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  console.log('  OK');
}

async function syncAnonKeyToSiteConfig() {
  console.log('→ Récupération clé anon API');
  const keys = await mgmt('/api-keys?reveal=true', { method: 'GET' });
  const list = Array.isArray(keys) ? keys : keys?.data || [];
  const pub =
    list.find((k) => String(k.name || '').toLowerCase().includes('publishable')) ||
    list.find((k) => String(k.api_key || '').startsWith('sb_publishable_'));
  const anon =
    list.find((k) => k.name === 'anon' || k.type === 'anon' || k.prefix === 'anon') ||
    list.find((k) => String(k.name || '').toLowerCase().includes('anon'));
  const apiKey = pub?.api_key || anon?.api_key;
  if (!apiKey) {
    console.warn('  Clé publishable/anon non trouvée — gardez site-config.js actuel.');
    return;
  }

  const configPath = path.join(WEBSITE, 'js', 'site-config.js');
  let src = fs.readFileSync(configPath, 'utf8');
  const re = /const SUPABASE_ANON_KEY = '[^']*';/;
  if (!re.test(src)) {
    throw new Error('site-config.js : SUPABASE_ANON_KEY introuvable');
  }
  src = src.replace(re, `const SUPABASE_ANON_KEY = '${apiKey}';`);
  fs.writeFileSync(configPath, src);
  console.log('  site-config.js mis à jour (clé anon valide)');
}

async function verifyPublicApi() {
  const cfg = fs.readFileSync(path.join(WEBSITE, 'js', 'site-config.js'), 'utf8');
  const m = cfg.match(/const SUPABASE_ANON_KEY = '([^']+)'/);
  const anon = m?.[1];
  if (!anon) return;

  const headers = { apikey: anon, 'Content-Type': 'application/json' };
  if (!anon.startsWith('sb_publishable_')) {
    headers.Authorization = `Bearer ${anon}`;
  }

  const resPdf = await fetch(
    `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/get_pdf_stats_totals`,
    { method: 'POST', headers, body: '{}' }
  );
  const pdfText = await resPdf.text();
  if (resPdf.ok) {
    console.log('→ Test stats PDF : OK', pdfText.slice(0, 80));
  } else {
    console.warn('→ Test stats PDF :', resPdf.status, pdfText.slice(0, 120));
  }

  const resVis = await fetch(
    `https://${PROJECT_REF}.supabase.co/rest/v1/site_visitor_stats?id=eq.1&select=total_visits,today_visits`,
    { headers: { apikey: anon, ...(headers.Authorization ? { Authorization: headers.Authorization } : {}) } }
  );
  const visText = await resVis.text();
  if (resVis.ok) {
    console.log('→ Test compteur visiteurs : OK', visText.slice(0, 120));
  } else {
    console.warn('→ Test compteur visiteurs :', resVis.status, visText.slice(0, 200));
  }
}

async function runAllSql() {
  const allPath = path.join(SUPABASE_DIR, 'TOUT-EXECUTER-UNE-FOIS.sql');
  if (fs.existsSync(allPath)) {
    console.log('→ SQL TOUT-EXECUTER-UNE-FOIS.sql');
    const query = fs.readFileSync(allPath, 'utf8');
    await mgmt('/database/query', { method: 'POST', body: JSON.stringify({ query }) });
    console.log('  OK');
    return;
  }
  await runSqlFile('visitor-stats.sql');
  await runSqlFile('visitor-stats-by-country.sql');
  await runSqlFile('pdf-stats-and-favorites.sql');
  await runSqlFile('site-setup.sql');
}

async function main() {
  console.log('SwissDZ — réglages Supabase SITE WEB\n');

  await runAllSql();
  await patchAuthConfig();
  await syncAnonKeyToSiteConfig();
  await verifyPublicApi();

  console.log('\nTerminé. Déployez le dossier website/ puis testez :');
  console.log('  https://electro-dz.com/login.html');
  console.log('  https://electro-dz.com/ (barre visiteurs en bas)');
}

main().catch((err) => {
  console.error('\nÉchec :', err.message || err);
  process.exit(1);
});
