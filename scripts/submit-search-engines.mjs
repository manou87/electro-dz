#!/usr/bin/env node
/**
 * Soumet le sitemap aux moteurs (IndexNow + ping Bing).
 * Usage: node scripts/submit-search-engines.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://electro-dz.com";
const SITEMAP = `${SITE}/sitemap.xml`;
const KEY = readFileSync(join(ROOT, "indexnow-key.txt"), "utf8").trim();
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function pingBing() {
  const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log(`[Bing ping] ${res.status} ${text.slice(0, 120)}`);
  return res.ok;
}

async function submitIndexNow(urls) {
  const body = {
    host: "electro-dz.com",
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];
  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    console.log(`[IndexNow ${endpoint}] ${res.status}`);
  }
}

async function main() {
  const local = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  const urls = parseSitemap(local);
  console.log(`URLs: ${urls.length}`);
  await pingBing();
  await submitIndexNow(urls.slice(0, 100));
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
