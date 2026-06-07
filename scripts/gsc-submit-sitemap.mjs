#!/usr/bin/env node
/**
 * Soumet sitemap.xml via Google Search Console API (OAuth).
 * 1ère exécution : ouvre le navigateur pour autoriser l'accès.
 * Token sauvegardé dans .gsc-token.json (gitignored).
 */
import http from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN_PATH = join(ROOT, ".gsc-token.json");
const CREDS_PATH =
  process.env.GSC_CREDENTIALS ||
  join(process.env.HOME || "", "Downloads/client_secret_782312436106-s17mmnkn82ma2d9rikvj6vljqvblo7dh.apps.googleusercontent.com.json");
const REDIRECT = "http://127.0.0.1:8765/oauth2callback";
const SITE = encodeURIComponent("https://electro-dz.com/");
const SCOPE = "https://www.googleapis.com/auth/webmasters";

function loadCreds() {
  const raw = JSON.parse(readFileSync(CREDS_PATH, "utf8"));
  return raw.web || raw.installed;
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

function authorize(creds) {
  return new Promise((resolve, reject) => {
    const authUrl =
      `${creds.auth_uri}?` +
      new URLSearchParams({
        client_id: creds.client_id,
        redirect_uri: REDIRECT,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
      });
    const server = http.createServer(async (req, res) => {
      if (!req.url.startsWith("/oauth2callback")) return;
      const code = new URL(req.url, REDIRECT).searchParams.get("code");
      res.end("Autorisation OK. Vous pouvez fermer cet onglet.");
      server.close();
      try {
        const tokens = await tokenFromCode(creds, code);
        writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        resolve(tokens.access_token);
      } catch (e) {
        reject(e);
      }
    });
    server.listen(8765, "127.0.0.1", () => {
      console.log("Ouvrez ce lien pour autoriser Google Search Console :");
      console.log(authUrl);
      try {
        execSync(`open "${authUrl}"`);
      } catch (_) {}
    });
    server.on("error", reject);
  });
}

async function getAccessToken(creds) {
  if (existsSync(TOKEN_PATH)) {
    const saved = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    if (saved.expiry && Date.now() < saved.expiry - 60000) {
      return saved.access_token;
    }
    if (saved.refresh_token) {
      const fresh = await refreshToken(creds, saved.refresh_token);
      const merged = { ...saved, ...fresh, expiry: Date.now() + fresh.expires_in * 1000 };
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
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl: page,
      siteUrl: "https://electro-dz.com/",
    }),
  });
  const data = await res.json();
  const verdict = data?.inspectionResult?.indexStatusResult?.verdict || res.status;
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
  console.error(e.message || e);
  process.exit(1);
});
