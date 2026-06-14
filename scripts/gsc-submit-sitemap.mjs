#!/usr/bin/env node
/**
 * Soumet sitemap.xml via Google Search Console API (OAuth).
 *
 * Prérequis (une seule fois) dans Google Cloud Console :
 *   Projet electro-dz-auth → Identifiants → client OAuth web
 *   Ajouter l'URI de redirection : http://localhost:8765/oauth2callback
 *
 * Usage :
 *   node scripts/gsc-submit-sitemap.mjs
 *   node scripts/gsc-submit-sitemap.mjs --code=4/0Axx...
 */
import http from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN_PATH = join(ROOT, ".gsc-token.json");
const CREDS_PATH =
  process.env.GSC_CREDENTIALS ||
  join(
    process.env.HOME || "",
    "Downloads/client_secret_782312436106-s17mmnkn82ma2d9rikvj6vljqvblo7dh.apps.googleusercontent.com.json"
  );
const REDIRECT =
  process.env.GSC_REDIRECT_URI || "http://localhost:8765/oauth2callback";
const SITE = encodeURIComponent("https://electro-dz.com/");
const SCOPE = "https://www.googleapis.com/auth/webmasters";
const SETUP_URL =
  "https://console.cloud.google.com/apis/credentials?project=electro-dz-auth";

function loadCreds() {
  const raw = JSON.parse(readFileSync(CREDS_PATH, "utf8"));
  return raw.web || raw.installed;
}

function printSetupHelp() {
  console.log(`
── Configuration OAuth requise (une seule fois) ──

Erreur redirect_uri_mismatch = l'URI de redirection n'est pas enregistrée.

1. Ouvrez : ${SETUP_URL}
2. Cliquez sur le client OAuth (type « Application Web »)
3. Section « URI de redirection autorisés » → Ajouter :
     ${REDIRECT}
4. Enregistrer, attendre ~1 min, puis relancer ce script.

Alternative manuelle (sans API) :
  Search Console → Sitemaps → https://electro-dz.com/sitemap.xml
`);
}

function codeFromArgs() {
  const arg = process.argv.find((a) => a.startsWith("--code="));
  return arg ? arg.slice("--code=".length) : null;
}

async function tokenFromCode(creds, code) {
  const res = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function refreshToken(creds, refresh) {
  const res = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refresh,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function buildAuthUrl(creds) {
  return (
    `${creds.auth_uri}?` +
    new URLSearchParams({
      client_id: creds.client_id,
      redirect_uri: REDIRECT,
      response_type: "code",
      scope: SCOPE,
      access_type: "offline",
      prompt: "consent",
    })
  );
}

function askCode() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      "\nCollez le code d'autorisation (paramètre ?code= dans l'URL) : ",
      (answer) => {
        rl.close();
        resolve(answer.trim());
      }
    );
  });
}

function authorize(creds) {
  return new Promise((resolve, reject) => {
    const authUrl = buildAuthUrl(creds);
    let settled = false;

    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/oauth2callback")) {
        res.writeHead(404);
        res.end();
        return;
      }
      const code = new URL(req.url, REDIRECT).searchParams.get("code");
      const err = new URL(req.url, REDIRECT).searchParams.get("error");
      res.end(
        err
          ? `<p>Erreur OAuth : ${err}</p><p>Voir la console du terminal.</p>`
          : "<p>Autorisation OK. Vous pouvez fermer cet onglet.</p>"
      );
      server.close();
      if (err) {
        settled = true;
        printSetupHelp();
        reject(new Error(`OAuth refusé : ${err}`));
        return;
      }
      try {
        const tokens = await tokenFromCode(creds, code);
        const merged = {
          ...tokens,
          expiry: Date.now() + tokens.expires_in * 1000,
        };
        writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
        settled = true;
        resolve(merged.access_token);
      } catch (e) {
        settled = true;
        reject(e);
      }
    });

    server.listen(8765, "127.0.0.1", () => {
      console.log("Étape 1 — Autoriser l'accès Search Console :");
      console.log(authUrl);
      console.log(`\nRedirect URI attendue : ${REDIRECT}`);
      printSetupHelp();
      try {
        execSync(`open "${authUrl}"`);
      } catch (_) {}
    });

    server.on("error", (e) => {
      if (!settled) reject(e);
    });

    setTimeout(async () => {
      if (settled) return;
      console.log("\nPas de réponse OAuth après 90 s.");
      const manual = await askCode();
      if (!manual) {
        settled = true;
        server.close();
        reject(new Error("Aucun code fourni."));
        return;
      }
      try {
        const tokens = await tokenFromCode(creds, manual);
        const merged = {
          ...tokens,
          expiry: Date.now() + tokens.expires_in * 1000,
        };
        writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
        settled = true;
        server.close();
        resolve(merged.access_token);
      } catch (e) {
        settled = true;
        server.close();
        if (String(e.message || e).includes("redirect_uri_mismatch")) {
          printSetupHelp();
        }
        reject(e);
      }
    }, 90_000);
  });
}

async function getAccessToken(creds) {
  const cliCode = codeFromArgs();
  if (cliCode) {
    const tokens = await tokenFromCode(creds, cliCode);
    const merged = {
      ...tokens,
      expiry: Date.now() + tokens.expires_in * 1000,
    };
    writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
    return merged.access_token;
  }

  if (existsSync(TOKEN_PATH)) {
    const saved = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    if (saved.expiry && Date.now() < saved.expiry - 60_000) {
      return saved.access_token;
    }
    if (saved.refresh_token) {
      const fresh = await refreshToken(creds, saved.refresh_token);
      const merged = {
        ...saved,
        ...fresh,
        expiry: Date.now() + fresh.expires_in * 1000,
      };
      writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
      return merged.access_token;
    }
    if (saved.access_token && !saved.refresh_token) {
      return saved.access_token;
    }
  }
  return authorize(creds);
}

async function submitSitemap(token) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${SITE}/sitemaps/sitemap.xml`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  console.log(`[GSC sitemap] ${res.status} ${text || "OK"}`);
  return res.ok;
}

async function inspectUrl(token, page) {
  const res = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: page,
        siteUrl: "https://electro-dz.com/",
      }),
    }
  );
  const data = await res.json();
  const verdict =
    data?.inspectionResult?.indexStatusResult?.verdict || res.status;
  console.log(`[GSC inspect] ${page} → ${verdict}`);
}

async function main() {
  const creds = loadCreds();
  const token = await getAccessToken(creds);
  await submitSitemap(token);
  for (const page of [
    "https://electro-dz.com/",
    "https://electro-dz.com/bibliotheque.html",
    "https://electro-dz.com/calcul-electrique.html",
  ]) {
    await inspectUrl(token, page);
  }
  console.log("Search Console API terminé.");
}

main().catch((e) => {
  const msg = e.message || String(e);
  console.error(msg);
  if (msg.includes("redirect_uri_mismatch")) {
    printSetupHelp();
  }
  process.exit(1);
});
