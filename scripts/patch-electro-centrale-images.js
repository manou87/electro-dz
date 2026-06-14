#!/usr/bin/env node
/** Ajoute imageUrl (photos Sonepar locales) dans electro-centrale.json */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data", "electro-centrale.json");
const P = "assets/electro-centrale/sonepar/";

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
data.version = 2;
data.updated = "2026-05-20";
data.mediaNoteFr =
  "Visuels téléchargés depuis sonepar.ch pour maquette brouillon uniquement — droits Sonepar / fabricants.";
data.mediaNoteAr = "صور من sonepar.ch للنموذج فقط.";

const heroImg = {
  signify: P + "hero-signify.jpg",
  tradeforce: P + "hero-tradeforce.jpg",
  vario: P + "hero-vario.jpg",
  printemps: P + "hero-printemps.jpg",
};

data.heroSlides.forEach(function (s) {
  s.imageUrl = heroImg[s.id] || P + "hero-signify.jpg";
});

const catImg = {
  "materiaux-terre": P + "cat-materiaux-terre.jpg",
  "tubes-canaux": P + "cat-tubes-canaux.jpg",
  filscables: P + "cat-filscables.jpg",
  "boites-derivation": P + "cat-boites.jpg",
  appareillage: P + "cat-appareillage.jpg",
  tableaux: P + "cat-tableaux.jpg",
  eclairage: P + "cat-eclairage.jpg",
  "industrie-automation": P + "cat-industrie.jpg",
  "reseaux-donnees": P + "cat-reseaux.jpg",
  "energies-renouvelables": P + "cat-energies.jpg",
};

data.assortment.forEach(function (c) {
  c.imageUrl = catImg[c.id] || P + "cat-filscables.jpg";
  delete c.icon;
});

const noveltyImg = {
  "tesys-vario": P + "novelty-vario.jpg",
  "push-x": P + "novelty-pushx.jpg",
  "podis-emob": P + "novelty-podis.jpg",
  "dali-dimmer": P + "novelty-dali.jpg",
  "abb-flexline": P + "novelty-abb.jpg",
  "wago-221": P + "novelty-wago.jpg",
};

data.novelties.forEach(function (n) {
  n.imageUrl = noveltyImg[n.id] || P + "novelty-vario.jpg";
});

const promoImg = {
  "signify-promo": P + "promo-signify.png",
  "tradeforce-promo": P + "promo-tradeforce.jpg",
  "excel-networking": P + "promo-excel.jpg",
  "gamme-eclairage-2026": P + "promo-eclairage-2026.jpg",
  norlys: P + "promo-norlys.jpg",
  "finder-minuteries": P + "promo-finder.jpg",
  "eaton-dd": P + "promo-eaton.jpg",
  "weidmueller-spd": P + "promo-weidmueller.jpg",
};

data.promotions.forEach(function (p) {
  p.imageUrl = promoImg[p.id] || P + "promo-signify.png";
});

const serviceImg = {
  digital: P + "service-digital.jpg",
  emploi: P + "service-emploi.png",
  fournisseurs: P + "service-fournisseurs.png",
  publications: P + "service-publications.png",
};

data.services.forEach(function (s) {
  s.imageUrl = serviceImg[s.id];
  delete s.icon;
});

const prodImg = {
  "p-cable-h07v-25": P + "prod-cable.jpg",
  "p-cable-nyj-3g25": P + "prod-cable.jpg",
  "p-cable-souple-3g15": P + "prod-cable.jpg",
  "p-cat6a": P + "prod-network.jpg",
  "p-wago-221": P + "prod-wago.jpg",
  "p-disj-16a-c": P + "prod-disj.jpg",
  "p-dd-40a": P + "prod-eaton-dd.jpg",
  "p-led-panel-60": P + "prod-led.jpg",
  "p-tesys-vario": P + "prod-vario.jpg",
  "p-icta-20": P + "prod-tubes.jpg",
  "p-borne-recharge": P + "prod-emob.jpg",
  "p-omada-ap": P + "prod-wifi.jpg",
};

data.products.forEach(function (p) {
  p.imageUrl = prodImg[p.id] || P + "prod-cable.jpg";
});

fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n");
console.log("imageUrl ajoutés:", data.products.length, "produits");
