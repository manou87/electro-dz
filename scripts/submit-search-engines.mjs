#!/usr/bin/env node
/**
 * Soumet sitemap + URLs prioritaires aux moteurs (IndexNow).
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://electro-dz.com";
const SITEMAP = `${SITE}/sitemap.xml`;
const KEY = readFileSync(join(ROOT, "indexnow-key.txt"), "utf8").trim();
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

const PRIORITY = [
  `${SITE}/`,
  `${SITE}/index-fr.html`,
  `${SITE}/bibliotheque.html`,
  `${SITE}/calcul-electrique.html`,
  `${SITE}/documentation.html`,
  `${SITE}/schemas-plans.html`,
];

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function submitIndexNow(urls, label) {
  const unique = [...new Set(urls)];
  const body = {
    host: "electro-dz.com",
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: unique,
  };
  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];
  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    console.log(`[IndexNow ${label} → ${endpoint}] ${res.status}`);
  }
}

async function pingBingSitemap() {
  const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
  const res = await fetch(url);
  console.log(`[Bing sitemap ping] ${res.status}`);
}

async function main() {
  const xml = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  const urls = parseSitemap(xml);
  console.log(`Sitemap: ${urls.length} URLs`);
  await pingBingSitemap();
  await submitIndexNow(PRIORITY, "priority");
  await submitIndexNow(urls, "all");
  console.log("Indexation externe soumise.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
