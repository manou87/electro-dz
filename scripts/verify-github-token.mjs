#!/usr/bin/env node
/**
 * Vérifie qu'un token GitHub peut pousser sur manou87/electro-dz (git receive-pack).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE = path.join(__dirname, '..');
const REPO = 'manou87/electro-dz';

function loadToken() {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim();
  const f = path.join(WEBSITE, '.github-token.local');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  return null;
}

async function main() {
  const token = loadToken();
  if (!token) {
    console.error('Token absent (.github-token.local ou GITHUB_TOKEN).');
    process.exit(1);
  }

  const auth = Buffer.from(`manou87:${token}`).toString('base64');
  const url = `https://github.com/${REPO}.git/info/refs?service=git-receive-pack`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });

  if (res.status === 200) {
    console.log('OK — token avec droit push (receive-pack).');
    return;
  }

  console.error(`Échec receive-pack : HTTP ${res.status}`);
  console.error(
    'Le token est en lecture seule. Sur GitHub → electro-dz-mac → Contents : Read and write, puis régénérez et recopiez le token.'
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
