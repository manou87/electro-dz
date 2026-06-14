#!/usr/bin/env node
/**
 * Assigne à chaque produit une photo COHÉRENTE avec son article
 * (sous-catégorie + mots-clés du nom), pas une rotation aléatoire.
 */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data", "electro-centrale.json");
const P = "assets/electro-centrale/sonepar/";

/** 3 visuels pertinents par sous-catégorie (index 0,1,2 dans la sous-cat) */
const SUB_IMAGES = {
  "barres-terre": ["tradeforce-isoliermittel.jpg", "cat-materiaux-terre.jpg", "prod-cable.jpg"],
  "bornes-terre": ["tradeforce-kabel.jpg", "hero-tradeforce.jpg", "tradeforce-isoliermittel.jpg"],
  encastrements: ["cat-boites.jpg", "prod-18052.jpg", "cat-materiaux-terre.jpg"],

  "tubes-pvc": ["prod-tubes.jpg", "tradeforce-isolierband.jpg", "cat-tubes-canaux.jpg"],
  goulottes: ["prod-18606.jpg", "cat-tubes-canaux.jpg", "prod-18052.jpg"],
  "accessoires-canalisation": ["prod-18052.jpg", "cat-tubes-canaux.jpg", "tradeforce-isolierband.jpg"],

  "cables-bt-rigide": ["prod-cable.jpg", "tradeforce-kabel.jpg", "cat-filscables.jpg"],
  "cables-bt-souple": ["prod-cable.jpg", "cat-filscables.jpg", "tradeforce-kabel.jpg"],
  "cables-donnees-cuivre": ["prod-network.jpg", "promo-excel.jpg", "prod-18217.jpg"],
  "cables-donnees-fo": ["prod-network.jpg", "prod-18533.jpg", "prod-18217.jpg"],

  "boites-derivation": ["cat-boites.jpg", "hero-tradeforce.jpg", "prod-18490.jpg"],
  "bornes-wago": ["prod-wago.jpg", "novelty-wago.jpg", "prod-18490.jpg"],
  isolations: ["tradeforce-isolierband.jpg", "tradeforce-isoliermittel.jpg", "prod-cable.jpg"],

  "prises-interrupteurs": ["cat-appareillage.jpg", "cat-appareillage-extra.jpg", "prod-18487.jpg"],
  modulaire: ["cat-appareillage.jpg", "prod-18447.jpg", "promo-finder.jpg"],
  "prises-industrielles": ["cat-appareillage-extra.jpg", "cat-appareillage.jpg", "prod-18487.jpg"],

  coffrets: ["cat-tableaux.jpg", "prod-disj.jpg", "prod-18500.jpg"],
  disjoncteurs: ["prod-disj.jpg", "prod-eaton-dd.jpg", "promo-eaton.jpg"],
  "accessoires-tableau": ["cat-tableaux.jpg", "prod-18524.jpg", "prod-disj.jpg"],

  "luminaires-interieur": ["prod-led.jpg", "led-smartbalance.jpg", "hero-signify.jpg"],
  "luminaires-exterieur": ["promo-norlys.jpg", "prod-led.jpg", "promo-eclairage-2026.jpg"],
  "led-sources": ["led-coreline.jpg", "cat-eclairage.jpg", "prod-led.jpg"],

  contacteurs: ["prod-vario.jpg", "novelty-vario.jpg", "hero-vario.jpg"],
  sectionneurs: ["prod-vario.jpg", "prod-18481.jpg", "novelty-vario.jpg"],
  automates: ["cat-industrie.jpg", "prod-18443.jpg", "prod-18481.jpg"],

  "baie-rj45": ["prod-network.jpg", "promo-excel.jpg", "prod-18217.jpg"],
  "wifi-omada": ["prod-wifi.jpg", "prod-18217.jpg", "prod-18547.jpg"],
  fibre: ["prod-network.jpg", "prod-18533.jpg", "prod-18217.jpg"],

  photovoltaique: ["cat-energies.jpg", "prod-18558.jpg", "prod-cable.jpg"],
  "bornes-recharge": ["prod-emob.jpg", "novelty-podis.jpg", "prod-18526.jpg"],
  onduleurs: ["cat-energies.jpg", "prod-18526.jpg", "prod-18558.jpg"],
};

/** Règles nom produit → image (priorité haute → basse) */
const NAME_RULES = [
  { re: /wago/i, img: "prod-wago.jpg" },
  { re: /tesys|vario|sectionneur/i, img: "prod-vario.jpg" },
  { re: /disjoncteur|différentiel|courbe c/i, img: "prod-disj.jpg" },
  { re: /parafoudre/i, img: "promo-weidmueller.jpg" },
  { re: /minuterie/i, img: "promo-finder.jpg" },
  { re: /contacteur|relais auxiliaire/i, img: "prod-vario.jpg" },
  { re: /automate|plc|variateur|module e\/s/i, img: "cat-industrie.jpg" },
  { re: /panneau led|downlight|réglette|luminaire|projecteur|applique|borne lumineuse/i, img: "prod-led.jpg" },
  { re: /ampoule led|tube led|spot gu10|gu10/i, img: "led-coreline.jpg" },
  { re: /omada|wi-?fi|switch poe|point d'accès/i, img: "prod-wifi.jpg" },
  { re: /cat\.?6|rj45|baie 19|brassage|coaxial/i, img: "prod-network.jpg" },
  { re: /fibre|jarretière|fo |om3|lc\/lc|sfp/i, img: "prod-network.jpg" },
  { re: /solaire|photovoltaïque|450 wc|structure toiture/i, img: "cat-energies.jpg" },
  { re: /borne.*recharge|type 2|7[,.]4 kw|22 kw/i, img: "prod-emob.jpg" },
  { re: /onduleur|micro-onduleur|batterie stockage/i, img: "prod-18526.jpg" },
  { re: /icta|tube pvc|coude icta/i, img: "prod-tubes.jpg" },
  { re: /goulotte|chemin de câbles/i, img: "prod-18606.jpg" },
  { re: /collier|bouchon de finition|support mural goulotte/i, img: "prod-18052.jpg" },
  { re: /h07|nym|u1000|câble|kabel|h05|souple 5g/i, img: "prod-cable.jpg" },
  { re: /gaine thermo|ruban isolant/i, img: "tradeforce-isolierband.jpg" },
  { re: /barre de terre|conducteur de protection|terre cuivre/i, img: "tradeforce-isoliermittel.jpg" },
  { re: /borne de terre|connecteur de terre|pince de terre/i, img: "tradeforce-kabel.jpg" },
  { re: /encastrement|platine|boîte étanche ip55/i, img: "cat-boites.jpg" },
  { re: /boîte de dérivation|boîte encastrée/i, img: "cat-boites.jpg" },
  { re: /prise|interrupteur/i, img: "cat-appareillage.jpg" },
  { re: /cee|industrielle 32|fiche mobile/i, img: "cat-appareillage-extra.jpg" },
  { re: /coffret|armoire 2 rangées|porte transparente|peigne phase|gtl/i, img: "cat-tableaux.jpg" },
];

function rel(file) {
  return P + file;
}

function imageFromName(nameFr, nameAr) {
  const hay = (nameFr + " " + nameAr).toLowerCase();
  for (let i = 0; i < NAME_RULES.length; i++) {
    if (NAME_RULES[i].re.test(hay)) return rel(NAME_RULES[i].img);
  }
  return "";
}

function imageFromSub(subId, indexInSub) {
  const pool = SUB_IMAGES[subId];
  if (!pool || !pool.length) return "";
  return rel(pool[indexInSub % pool.length]);
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const bySub = {};

  data.products.forEach(function (p) {
    const k = p.cat + "/" + p.sub;
    if (!bySub[k]) bySub[k] = [];
    bySub[k].push(p);
  });

  let matchedByName = 0;

  Object.keys(bySub).forEach(function (key) {
    const prods = bySub[key];
    const usedInSub = new Set();

    prods.forEach(function (p, i) {
      const candidates = [];
      const byName = imageFromName(p.nameFr, p.nameAr);
      if (byName) {
        candidates.push(byName);
        matchedByName++;
      }
      const pool = SUB_IMAGES[p.sub] || [];
      pool.forEach(function (file) {
        const u = rel(file);
        if (candidates.indexOf(u) === -1) candidates.push(u);
      });
      if (!candidates.length) {
        const cat = (data.assortment || []).find(function (c) {
          return c.id === p.cat;
        });
        if (cat && cat.imageUrl) candidates.push(cat.imageUrl);
      }
      if (!candidates.length) candidates.push(rel("prod-cable.jpg"));

      let url = "";
      for (let c = 0; c < candidates.length; c++) {
        if (!usedInSub.has(candidates[c])) {
          url = candidates[c];
          break;
        }
      }
      if (!url) url = candidates[i % candidates.length];

      usedInSub.add(url);
      p.imageUrl = url;
    });
  });

  data.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n", "utf8");

  const samples = data.products
    .filter(function (p) {
      return p.sub === "disjoncteurs" || p.sub === "bornes-wago" || p.sub === "cables-bt-rigide";
    })
    .map(function (p) {
      return p.nameFr.slice(0, 35) + " → " + p.imageUrl.split("/").pop();
    });

  console.log("Produits:", data.products.length);
  console.log("Correspondance par nom:", matchedByName);
  console.log("\nExemples:");
  samples.forEach(function (s) {
    console.log(" ", s);
  });
}

main();
