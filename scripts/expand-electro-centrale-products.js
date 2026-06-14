#!/usr/bin/env node
/** Complète le catalogue démo — min. 3 produits par sous-catégorie */
const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "..", "data", "electro-centrale.json");
const d = JSON.parse(fs.readFileSync(p, "utf8"));

// Anciens échantillons Sonepar (SOP-*) remplacés par le catalogue Othman
d.products = (d.products || []).filter(function (prod) {
  return !String(prod.sku || "").startsWith("SOP-");
});

const catImages = {
  "materiaux-terre": "assets/electro-centrale/sonepar/cat-materiaux-terre.jpg",
  "tubes-canaux": "assets/electro-centrale/sonepar/cat-tubes-canaux.jpg",
  filscables: "assets/electro-centrale/sonepar/cat-filscables.jpg",
  "boites-derivation": "assets/electro-centrale/sonepar/cat-boites.jpg",
  appareillage: "assets/electro-centrale/sonepar/cat-appareillage.jpg",
  tableaux: "assets/electro-centrale/sonepar/cat-tableaux.jpg",
  eclairage: "assets/electro-centrale/sonepar/cat-eclairage.jpg",
  "industrie-automation": "assets/electro-centrale/sonepar/cat-industrie.jpg",
  "reseaux-donnees": "assets/electro-centrale/sonepar/cat-reseaux.jpg",
  "energies-renouvelables": "assets/electro-centrale/sonepar/cat-energies.jpg",
};

const subProducts = {
  "barres-terre": [
    ["Barre de terre cuivre 25×4 mm — 2 m", "قضيب تأريض نحاس 25×4 مم — 2 م", "Legrand", 1850, "m"],
    ["Barre de terre isolée 10×3 mm", "قضيب تأريض معزول 10×3 مم", "Schneider Electric", 920, "m"],
    ["Conducteur de protection 16 mm² vert/jaune", "سلك حماية 16 مم² أخضر/أصفر", "Nexans", 780, "m"],
  ],
  "bornes-terre": [
    ["Borne de terre type B 16 mm²", "مشبك تأريض نوع B 16 مم²", "Legrand", 450, "pce"],
    ["Connecteur de terre pour barrette", "وصل تأريض للقضيب", "ABB", 620, "pce"],
    ["Pince de terre universelle", "مشبك تأريض universal", "Hager", 380, "pce"],
  ],
  encastrements: [
    ["Boîte d'encastrement 1 poste — profondeur 40 mm", "علبة تغليف 1 مخرج — عمق 40 مم", "Legrand", 120, "pce"],
    ["Platine universelle 2 postes", "لوحة 2 مخرج", "Schneider Electric", 95, "pce"],
    ["Boîte étanche IP55 4 postes", "علبة مقاومة IP55 — 4 مخرج", "Legrand", 340, "pce"],
  ],
  "tubes-pvc": [
    ["Tube ICTA Ø20 mm (3 m)", "أنبوب ICTA Ø20 مم (3 م)", "Legrand", 480, "pce"],
    ["Tube ICTA Ø25 mm (3 m)", "أنبوب ICTA Ø25 مم (3 م)", "Legrand", 620, "pce"],
    ["Coude ICTA Ø20 mm — 90°", "زاوية ICTA Ø20 مم — 90°", "Legrand", 85, "pce"],
  ],
  goulottes: [
    ["Goulotte PVC 60×40 mm — 2 m", "قناة PVC 60×40 مم — 2 م", "Legrand", 890, "pce"],
    ["Coude goulotte 60×40 mm", "زاوية قناة 60×40 مم", "Legrand", 210, "pce"],
    ["Chemin de câbles perforé 100 mm", "مسار كابلات مثقوب 100 مم", "Schneider Electric", 1450, "m"],
  ],
  "accessoires-canalisation": [
    ["Collier de fixation Ø20 mm (lot 100)", "حلقة تثبيت Ø20 مم (100)", "Legrand", 650, "pce"],
    ["Bouchon de finition goulotte", "غطاء نهاية القناة", "Legrand", 45, "pce"],
    ["Support mural goulotte", "حامل جدار للقناة", "ABB", 180, "pce"],
  ],
  "cables-bt-rigide": [
    ["Câble H07V-K 2,5 mm² vert/jaune", "كابل H07V-K 2.5 مم² أخضر/أصفر", "Nexans", 185, "m"],
    ["Câble NYM-J 3G2,5 mm²", "كابل NYM-J 3G2.5 مم²", "ABB", 420, "m"],
    ["Câble U1000 R2V 3G6 mm²", "كابل U1000 R2V 3G6 مم²", "Nexans", 980, "m"],
  ],
  "cables-bt-souple": [
    ["H05VV-F 3G1,5 mm²", "H05VV-F 3G1.5 مم²", "Legrand", 210, "m"],
    ["H07RN-F 3G2,5 mm²", "H07RN-F 3G2.5 مم²", "Nexans", 450, "m"],
    ["Câble souple 5G1,5 mm²", "كابل مرن 5G1.5 مم²", "Legrand", 320, "m"],
  ],
  "cables-donnees-cuivre": [
    ["Câble données Cat.6A S/FTP", "كابل بيانات Cat.6A S/FTP", "Excel Networking", 380, "m"],
    ["Câble Cat.6 U/UTP — 305 m", "كابل Cat.6 U/UTP — 305 م", "Excel Networking", 28500, "pce"],
    ["Câble coaxial RG6 blindé", "كابل coaxial RG6 معزول", "Legrand", 290, "m"],
  ],
  "cables-donnees-fo": [
    ["Câble fibre OM3 — 12 fibres", "كابل ألياف OM3 — 12 ليف", "Corning", 1250, "m"],
    ["Jarretière LC/LC duplex OM3", "وصلة LC/LC duplex OM3", "Corning", 890, "pce"],
    ["Boîte de raccordement FO 24 fibres", "علبة توصيل ألياف 24 ليف", "Legrand", 4200, "pce"],
  ],
  "boites-derivation": [
    ["Boîte de dérivation 100×100 mm IP55", "علبة توزيع 100×100 مم IP55", "Legrand", 520, "pce"],
    ["Boîte étanche 150×110 mm", "علبة مقاومة 150×110 مم", "Schneider Electric", 780, "pce"],
    ["Boîte encastrée 4 entrées", "علبة توزيع 4 مداخل", "Legrand", 340, "pce"],
  ],
  "bornes-wago": [
    ["Borne Wago 221 — 5 entrées", "وصلة Wago 221 — 5 مداخل", "Wago", 245, "pce"],
    ["Borne Wago 221 — 3 entrées", "وصلة Wago 221 — 3 مداخل", "Wago", 195, "pce"],
    ["Borne Wago 222 — 5 entrées", "وصلة Wago 222 — 5 مداخل", "Wago", 265, "pce"],
  ],
  isolations: [
    ["Gaine thermo 3/1 — 2 mm (noir)", "غلاف حراري 3/1 — 2 مم (أسود)", "Legrand", 45, "m"],
    ["Gaine thermo 6/2 — 1 m", "غلاف حراري 6/2 — 1 م", "Legrand", 85, "m"],
    ["Ruban isolant PVC 19 mm", "شريط عزل PVC 19 مم", "3M", 120, "pce"],
  ],
  "prises-interrupteurs": [
    ["Prise 16 A 2P+T — blanc", "مقبس 16 A 2P+T — أبيض", "Legrand", 420, "pce"],
    ["Interrupteur va-et-vient", "مفتاح ثنائي", "Legrand", 380, "pce"],
    ["Prise double 2P+T", "مقبس مزدوج 2P+T", "Schneider Electric", 650, "pce"],
  ],
  modulaire: [
    ["Contacteur modulaire 20 A — 2 NO", "قاطع تحكم 20 A — 2 NO", "Schneider Electric", 1850, "pce"],
    ["Minuterie modulaire 16 A", "مؤقت 16 A", "Legrand", 2200, "pce"],
    ["Parafoudre modulaire Type 2", "مانع صواعق Type 2", "Legrand", 8900, "pce"],
  ],
  "prises-industrielles": [
    ["Prise industrielle 32 A 3P+T IP67", "مقبس صناعي 32 A 3P+T IP67", "Legrand", 4200, "pce"],
    ["Prise CEE 16 A — 3P+N+T", "مقبس CEE 16 A — 3P+N+T", "ABB", 2800, "pce"],
    ["Fiche mobile 32 A IP67", "فيش متحرك 32 A IP67", "Legrand", 3600, "pce"],
  ],
  coffrets: [
    ["Coffret étanche 12 modules IP65", "صندوق 12 وحدة IP65", "Legrand", 8900, "pce"],
    ["Armoire 2 rangées — 36 modules", "خزانة صفين — 36 وحدة", "Schneider Electric", 24500, "pce"],
    ["Coffret saillie 8 modules", "صندوق 8 وحدة", "Legrand", 4200, "pce"],
  ],
  disjoncteurs: [
    ["Disjoncteur 16 A courbe C", "قاطع 16 A منحنى C", "Schneider Electric", 1250, "pce"],
    ["Disjoncteur différentiel 40 A 30 mA", "قاطع تفاضلي 40 A 30 mA", "Eaton", 8900, "pce"],
    ["Disjoncteur 32 A courbe C", "قاطع 32 A منحنى C", "Schneider Electric", 1680, "pce"],
  ],
  "accessoires-tableau": [
    ["Peigne phase 12 modules", "شريط طور 12 وحدة", "Legrand", 850, "pce"],
    ["Goulotte GTL pour coffret", "قناة GTL للصندوق", "Legrand", 1200, "pce"],
    ["Porte transparente coffret 12 M", "باب شفاف صندوق 12 M", "Legrand", 2100, "pce"],
  ],
  "luminaires-interieur": [
    ["Panneau LED 60×60 36 W", "لوحة LED 60×60 36 W", "Signify", 6800, "pce"],
    ["Downlight LED 12 W 4000 K", "سبوت LED 12 W 4000 K", "Signify", 1850, "pce"],
    ["Réglette LED 120 cm 36 W", "تراك LED 120 سم 36 W", "Legrand", 3200, "pce"],
  ],
  "luminaires-exterieur": [
    ["Projecteur LED 50 W IP65", "كشاف LED 50 W IP65", "Norlys", 8900, "pce"],
    ["Applique murale LED extérieure", "وحدة جدار LED خارجية", "Norlys", 5200, "pce"],
    ["Borne lumineuse sol 1 m", "عمود إنارة 1 م", "Norlys", 12500, "pce"],
  ],
  "led-sources": [
    ["Ampoule LED E27 10 W 4000 K", "مصباح LED E27 10 W 4000 K", "Signify", 420, "pce"],
    ["Tube LED T8 120 cm 18 W", "أنبوب LED T8 120 سم 18 W", "Signify", 890, "pce"],
    ["Spot GU10 LED 5 W", "سبوت GU10 LED 5 W", "Legrand", 380, "pce"],
  ],
  contacteurs: [
    ["Contacteur 25 A — 3 NO", "قاطع تحكم 25 A — 3 NO", "Schneider Electric", 4200, "pce"],
    ["Relais auxiliaire 1 NO + 1 NF", "مرحل مساعد 1 NO + 1 NF", "Schneider Electric", 980, "pce"],
    ["Contacteur 40 A — bobine 230 V", "قاطع تحكم 40 A — 230 V", "Eaton", 5800, "pce"],
  ],
  sectionneurs: [
    ["TeSys Vario 4P 63 A IP65", "TeSys Vario 4P 63 A IP65", "Schneider Electric", 24500, "pce"],
    ["Sectionneur 3P 125 A", "قاطع عزل 3P 125 A", "Schneider Electric", 18900, "pce"],
    ["Interrupteur-sectionneur 4P 32 A", "قاطع عزل 4P 32 A", "ABB", 9800, "pce"],
  ],
  automates: [
    ["Automate compact 14 E/S", "PLC مدمج 14 I/O", "Schneider Electric", 42000, "pce"],
    ["Variateur 3 kW — mono", "محول سرعة 3 kW", "Schneider Electric", 28500, "pce"],
    ["Module E/S numérique 8 entrées", "وحدة I/O رقمية 8 مداخل", "Siemens", 8900, "pce"],
  ],
  "baie-rj45": [
    ["Baie 19\" 12 U — profondeur 600 mm", "خزانة 19\" 12 U", "Legrand", 42000, "pce"],
    ["Panneau de brassage 24 ports Cat.6", "لوحة توصيل 24 منفذ Cat.6", "Excel Networking", 8900, "pce"],
    ["Organiseur de câbles 1 U", "منظم كابلات 1 U", "Legrand", 1200, "pce"],
  ],
  "wifi-omada": [
    ["Point d'accès Wi-Fi 7 Omada", "نقطة وصول Wi-Fi 7 Omada", "TP-Link Omada", 19500, "pce"],
    ["Contrôleur Omada OC200", "متحكم Omada OC200", "TP-Link Omada", 32000, "pce"],
    ["Switch PoE 8 ports Gigabit", "سويتش PoE 8 منافذ", "TP-Link Omada", 14500, "pce"],
  ],
  fibre: [
    ["Panneau fibre 24 ports LC", "لوحة ألياف 24 منفذ LC", "Legrand", 12500, "pce"],
    ["Boîtier FO 12 fibres murale", "علبة ألياف 12 ليف", "Corning", 6800, "pce"],
    ["Module SFP 1 G multimode", "وحدة SFP 1 G multimode", "TP-Link Omada", 4200, "pce"],
  ],
  photovoltaique: [
    ["Panneau solaire 450 Wc mono", "لوح شمسي 450 Wc", "Longi", 42000, "pce"],
    ["Structure toiture — 1 panneau", "هيكل سقف — لوح واحد", "Schletter", 8500, "pce"],
    ["Câble solaire 6 mm² — 100 m", "كابل شمسي 6 مم² — 100 م", "Nexans", 12500, "pce"],
  ],
  "bornes-recharge": [
    ["Borne murale 7,4 kW", "محطة شحن جدارية 7.4 kW", "ABB", 89000, "pce"],
    ["Borne 22 kW triphasée", "محطة 22 kW ثلاثية", "ABB", 185000, "pce"],
    ["Câble Type 2 — 5 m", "كابل Type 2 — 5 م", "ABB", 12500, "pce"],
  ],
  onduleurs: [
    ["Onduleur hybride 5 kW", "محول هجين 5 kW", "Huawei", 285000, "pce"],
    ["Micro-onduleur 800 W", "مايكرو محول 800 W", "Enphase", 89000, "pce"],
    ["Batterie stockage 5 kWh", "بطارية تخزين 5 kWh", "Huawei", 420000, "pce"],
  ],
};

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function existingKey(prod) {
  return prod.cat + "/" + prod.sub + "/" + slug(prod.nameFr);
}

const seen = new Set((d.products || []).map(existingKey));
let seq = 1000;
const stocks = ["in_stock", "in_stock", "low", "on_order"];

(d.assortment || []).forEach(function (cat) {
  (cat.subcategories || []).forEach(function (sub) {
    const rows = subProducts[sub.id];
    if (!rows) return;
    rows.forEach(function (row, i) {
      const key = cat.id + "/" + sub.id + "/" + slug(row[0]);
      if (seen.has(key)) return;
      seen.add(key);
      seq += 1;
      d.products.push({
        id: "p-" + cat.id + "-" + sub.id + "-" + (i + 1),
        sku: "OTH-" + seq,
        cat: cat.id,
        sub: sub.id,
        nameFr: row[0],
        nameAr: row[1],
        brand: row[2],
        price: row[3],
        currency: "DZD",
        unit: row[4],
        stock: stocks[i % stocks.length],
        descFr: "Référence professionnelle — livraison chantier Algérie (démo).",
        descAr: "مرجع احترافي — توصيل للورشة في الجزائر (تجريبي).",
        specs: [{ labelFr: "Famille", value: sub.nameFr, labelAr: "الفئة" }],
        imageUrl: "",
      });
    });
  });
});

function countInSub(catId, subId) {
  return d.products.filter(function (p) {
    return p.cat === catId && p.sub === subId;
  }).length;
}

function countInCat(catId) {
  return d.products.filter(function (p) {
    return p.cat === catId;
  }).length;
}

(d.assortment || []).forEach(function (cat) {
  cat.productCount = countInCat(cat.id);
  (cat.subcategories || []).forEach(function (sub) {
    sub.productCount = countInSub(cat.id, sub.id);
  });
});

d.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
console.log("Produits:", d.products.length);
console.log(
  "Sous-catégories couvertes:",
  new Set(d.products.map((p) => p.cat + "/" + p.sub)).size
);
