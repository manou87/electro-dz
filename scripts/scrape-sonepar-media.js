#!/usr/bin/env node
const https = require("https");
const fs = require("fs");
const path = require("path");

const PAGES = [
  "https://www.sonepar.ch/fr",
  "https://www.sonepar.ch/fr/shop",
  "https://www.sonepar.ch/fr/c/1-5-materiaux-de-terre",
  "https://www.sonepar.ch/fr/c/1-10-fils-et-cables",
  "https://www.sonepar.ch/fr/c/1-15-tubes-et-canaux",
  "https://www.sonepar.ch/fr/c/1-20-boites-de-derivation",
  "https://www.sonepar.ch/fr/c/1-72-appareillage",
  "https://www.sonepar.ch/fr/c/1-25-tableaux-et-coffrets",
  "https://www.sonepar.ch/fr/c/1-30-eclairage",
  "https://www.sonepar.ch/fr/c/1-35-industrie-et-automation",
  "https://www.sonepar.ch/fr/c/1-40-reseaux-de-donnees",
  "https://www.sonepar.ch/fr/c/1-45-energies-renouvelables",
];

function fetch(url) {
  return new Promise(function (resolve, reject) {
    https
      .get(url, { headers: { "User-Agent": "SwissDZ-draft/1.0" } }, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location).then(resolve, reject);
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      })
      .on("error", reject);
  });
}

(async function () {
  const found = new Set();
  for (const url of PAGES) {
    try {
      const r = await fetch(url);
      const re = /uploads\/media\/[^"'\s>]+\.(?:jpg|png|webp)[^"'\s>]*/gi;
      let m;
      while ((m = re.exec(r.data))) {
        let u = m[0].split("?")[0];
        if (u.includes("webshop_klein") || u.includes("mxss") || u.includes("TRADEFORCE")) {
          found.add(u);
        }
      }
      console.log(url, "->", r.status, "total", found.size);
    } catch (e) {
      console.warn(url, e.message);
    }
  }
  const list = [...found].sort();
  const out = path.join(__dirname, "sonepar-media-urls.json");
  fs.writeFileSync(out, JSON.stringify(list, null, 2));
  console.log("Unique URLs:", list.length, "->", out);
})();
