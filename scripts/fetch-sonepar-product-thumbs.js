#!/usr/bin/env node
/** Extrait des miniatures produits depuis des pages catégorie Sonepar (fr). */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT = path.join(__dirname, "..", "assets", "electro-centrale", "sonepar");
const LIST = path.join(__dirname, "sonepar-product-urls.json");

const PAGES = [
  "https://www.sonepar.ch/fr/2791-materiaux-de-terre",
  "https://www.sonepar.ch/fr/2910-fils-et-cables",
  "https://www.sonepar.ch/fr/2915-tubes-et-canaux",
  "https://www.sonepar.ch/fr/2920-boites-de-derivation",
  "https://www.sonepar.ch/fr/2972-appareillage",
  "https://www.sonepar.ch/fr/2975-tableaux-et-coffrets",
  "https://www.sonepar.ch/fr/2980-eclairage",
  "https://www.sonepar.ch/fr/2985-industrie-et-automation",
  "https://www.sonepar.ch/fr/2990-reseaux-de-donnees",
  "https://www.sonepar.ch/fr/2995-energies-renouvelables",
];

function fetch(url, redirects) {
  redirects = redirects || 0;
  return new Promise(function (resolve, reject) {
    const u = new URL(url);
    https
      .get(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "fr-CH,fr;q=0.9" },
        },
        function (res) {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
            const next = res.headers.location.startsWith("http")
              ? res.headers.location
              : "https://" + u.hostname + res.headers.location;
            return fetch(next, redirects + 1).then(resolve, reject);
          }
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => resolve({ status: res.statusCode, data }));
        }
      )
      .on("error", reject);
  });
}

function download(url, dest) {
  return new Promise(function (resolve, reject) {
    const file = fs.createWriteStream(dest);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          return reject(new Error("HTTP " + res.statusCode));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", reject);
  });
}

(async function () {
  const found = new Set();
  const reList = [
    /uploads\/media\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi,
    /https:\/\/www\.sonepar\.ch\/uploads\/media\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi,
  ];

  for (const page of PAGES) {
    try {
      const r = await fetch(page);
      reList.forEach(function (re) {
        let m;
        while ((m = re.exec(r.data))) {
          let u = m[0];
          if (u.startsWith("http")) u = u.replace(/^https:\/\/www\.sonepar\.ch\//, "");
          found.add(u.split("?")[0]);
        }
      });
      console.log(page, r.status, "total", found.size);
    } catch (e) {
      console.warn(page, e.message);
    }
  }

  const urls = [...found].sort();
  fs.writeFileSync(LIST, JSON.stringify(urls, null, 2));

  fs.mkdirSync(OUT, { recursive: true });
  let n = 0;
  for (const rel of urls) {
    const base = path.basename(rel).replace(/%20/g, "-").replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = "thumb-" + base;
    const dest = path.join(OUT, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 3000) continue;
    try {
      await download("https://www.sonepar.ch/" + rel + "?v=1-0", dest);
      n++;
      if (n % 10 === 0) console.log("saved", n);
    } catch (e) {
      /* skip */
    }
  }
  console.log("Nouvelles miniatures:", n, "— total fichiers:", fs.readdirSync(OUT).length);
})();
