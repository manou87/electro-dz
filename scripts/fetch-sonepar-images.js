#!/usr/bin/env node
/** Télécharge les visuels publics sonepar.ch pour la maquette Électro-Centrale (brouillon). */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT = path.join(__dirname, "..", "assets", "electro-centrale", "sonepar");
const BASE = "https://www.sonepar.ch/";

const FILES = {
  "hero-signify.jpg":
    "uploads/media/homepage-swiper-lg/01/18401-a26_39_webshop_banner_1536x864_v2%20neu.jpg?v=3-0",
  "hero-tradeforce.jpg":
    "uploads/media/homepage-swiper-lg/01/18531-a26_59_webshop_banner_1536x864.jpg?v=1-0",
  "hero-vario.jpg":
    "uploads/media/homepage-swiper-lg/01/18441-n26_56_webshop_banner_1536x864.jpg?v=1-0",
  "hero-printemps.jpg":
    "uploads/media/homepage-swiper-lg/00/18480-a26_30_webshop_banner_1536x864.jpg?v=1-0",
  "cat-materiaux-terre.jpg": "uploads/media/1-5-mxss/00/16770-TRADEFORCE_isoliermittel.jpg?v=1-0",
  "cat-tubes-canaux.jpg": "uploads/media/1-5-mxss/02/16772-TRADEFORCE_isolierband.jpg?v=1-0",
  "cat-filscables.jpg": "uploads/media/1-5-mxss/01/16771-TRADEFORCE_kabelverschraubungen.jpg?v=1-0",
  "cat-boites.jpg": "uploads/media/1-72-mxss/02/18552-a26_50_webshop_klein_958x690.jpg?v=1-0",
  "cat-appareillage.jpg": "uploads/media/1-72-mxss/07/18537-n26_53_webshop_klein_958x690.jpg?v=1-0",
  "cat-tableaux.jpg": "uploads/media/1-72-mxss/04/18484-a26_52_webshop_klein_958x690.jpg?v=1-0",
  "cat-eclairage.jpg": "uploads/media/1-72-mxss/03/16963-A25_85_Kernsortiment%20Licht_958x690.jpg?v=1-0",
  "cat-industrie.jpg": "uploads/media/1-72-mxss/01/18481-a26_56_webshop_klein_958x690.jpg?v=1-0",
  "cat-reseaux.jpg": "uploads/media/1-72-mxss/03/18493-n26_57_webshop_klein_958x690.jpg?v=1-0",
  "cat-energies.jpg": "uploads/media/1-72-mxss/00/18520-a26_55_webshop_klein_958x690.jpg?v=1-0",
  "cat-appareillage-extra.jpg": "uploads/media/1-5-mxss/09/18349-a26_39_startseite_allgemeinbeleuchtung_Coreline%20Batten%20G3_BN126C_neu.jpg?v=2-0",
  "novelty-vario.jpg": "uploads/media/1-72-mxss/01/18481-a26_56_webshop_klein_958x690.jpg?v=1-0",
  "novelty-pushx.jpg": "uploads/media/1-72-mxss/00/18490-n26_49_webshop_klein_958x690.jpg?v=1-0",
  "novelty-podis.jpg": "uploads/media/1-72-mxss/00/18520-a26_55_webshop_klein_958x690.jpg?v=1-0",
  "novelty-dali.jpg": "uploads/media/1-72-mxss/06/18526-a26_58_webshop_klein_958x690.jpg?v=1-0",
  "novelty-abb.jpg": "uploads/media/1-72-mxss/00/18500-n26_54_webshop_klein_958x690.jpg?v=1-0",
  "novelty-wago.jpg": "uploads/media/1-72-mxss/02/18552-a26_50_webshop_klein_958x690.jpg?v=1-0",
  "promo-signify.png":
    "uploads/media/1-72-mxss/08/18398-a26_39_Webshop%20Desktop%20Kachel%20958%20x%20690%20px%20V2_neu.png?v=3-0",
  "promo-tradeforce.jpg": "uploads/media/1-72-mxss/00/18530-a26_59_webshop_klein_958x690.jpg?v=1-0",
  "promo-excel.jpg": "uploads/media/1-72-mxss/03/18493-n26_57_webshop_klein_958x690.jpg?v=1-0",
  "promo-eclairage-2026.jpg": "uploads/media/1-72-mxss/03/16963-A25_85_Kernsortiment%20Licht_958x690.jpg?v=1-0",
  "promo-norlys.jpg": "uploads/media/1-72-mxss/03/18543-n26_60_webshop_klein_958x690.jpg?v=1-0",
  "promo-finder.jpg": "uploads/media/1-72-mxss/07/18537-n26_53_webshop_klein_958x690.jpg?v=1-0",
  "promo-eaton.jpg": "uploads/media/1-72-mxss/04/18484-a26_52_webshop_klein_958x690.jpg?v=1-0",
  "promo-weidmueller.jpg": "uploads/media/1-72-mxss/04/18524-a26_57_webshop_klein_958x690.jpg?v=1-0",
  "service-digital.jpg": "uploads/media/1-5-mxss/04/9634-digital_services_1536x864.jpg?v=1-0",
  "service-emploi.png": "uploads/media/1-5-mxss/04/14744-Teaser_Karriereseite_1536x864.png?v=1-0",
  "service-fournisseurs.png": "uploads/media/1-5-mxss/07/14747-Teaser_Unsere%20Lieferanten_305x179.png?v=1-0",
  "service-publications.png": "uploads/media/1-5-mxss/03/14753-Teaser_Publikationen_305x179px.png?v=1-0",
  "prod-cable.jpg": "uploads/media/1-5-mxss/01/16771-TRADEFORCE_kabelverschraubungen.jpg?v=1-0",
  "prod-wago.jpg": "uploads/media/1-72-mxss/02/18552-a26_50_webshop_klein_958x690.jpg?v=1-0",
  "prod-disj.jpg": "uploads/media/1-72-mxss/04/18484-a26_52_webshop_klein_958x690.jpg?v=1-0",
  "prod-led.jpg":
    "uploads/media/1-5-mxss/00/18350-a26_39_startseite_b%C3%BCrobeleuchtung_SmartBalance%20FS485F_neu.jpg?v=2-0",
  "prod-vario.jpg": "uploads/media/hero-banner-lg/02/18442-n26_56_website_hero_banner_2560x550.jpg?v=1-0",
  "prod-tubes.jpg": "uploads/media/1-5-mxss/02/16772-TRADEFORCE_isolierband.jpg?v=1-0",
  "prod-emob.jpg": "uploads/media/1-72-mxss/00/18520-a26_55_webshop_klein_958x690.jpg?v=1-0",
  "prod-wifi.jpg": "uploads/media/1-72-mxss/07/18547-a26_54_webshop_klein_958x690.jpg?v=1-0",
  "prod-eaton-dd.jpg": "uploads/media/1-72-mxss/04/18524-a26_57_webshop_klein_958x690.jpg?v=1-0",
  "prod-network.jpg": "uploads/media/1-72-mxss/03/18493-n26_57_webshop_klein_958x690.jpg?v=1-0",
};

function download(url, dest) {
  return new Promise(function (resolve, reject) {
    const file = fs.createWriteStream(dest);
    https
      .get(url, { headers: { "User-Agent": "SwissDZ-draft/1.0" } }, function (res) {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error("HTTP " + res.statusCode + " " + url));
        }
        res.pipe(file);
        file.on("finish", function () {
          file.close(resolve);
        });
      })
      .on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  let fail = 0;
  for (const [name, rel] of Object.entries(FILES)) {
    const dest = path.join(OUT, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      ok++;
      continue;
    }
    const url = BASE + rel;
    try {
      await download(url, dest);
      ok++;
      process.stdout.write(".");
    } catch (e) {
      fail++;
      console.error("\nFAIL", name, e.message);
    }
  }
  console.log("\nOK:", ok, "FAIL:", fail, "→", OUT);
}

main();
