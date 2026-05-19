#!/usr/bin/env node
/** Ajoute les distributeurs Legrand manquants (source legrand.dz) dans data/commerce.json */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data", "commerce.json");

const INV = [
  {
    id: "legrand-gamme",
    category: "appareillage",
    labelFr: "Gamme Legrand — prix sur demande en magasin",
    labelAr: "مجموعة Legrand — السعر عند الطلب",
    brand: "Legrand",
    unit: "—",
    price: null,
    currency: "DZD",
    stock: "contact",
    updated: "2026-05-19",
  },
];

function base(extra) {
  return {
    published: true,
    demo: false,
    brands: ["Legrand"],
    activityFr: "Distributeur officiel Legrand",
    activityAr: "موزع رسمي Legrand",
    source: "Legrand DZ",
    tags: ["tableaux", "appareillage"],
    inventory: INV,
    ...extra,
  };
}

const NEW_CITIES = {
  "tizi-ouzou": { labelFr: "Tizi Ouzou", labelAr: "تيزي وزو", order: 7 },
  bouira: { labelFr: "Bouira", labelAr: "البويرة", order: 8 },
  bejaia: { labelFr: "Béjaïa", labelAr: "بجاية", order: 9 },
  msila: { labelFr: "M'Sila", labelAr: "المسيلة", order: 10 },
  "el-oued": { labelFr: "El Oued", labelAr: "الوادي", order: 11 },
  batna: { labelFr: "Batna", labelAr: "باتنة", order: 12 },
  jijel: { labelFr: "Jijel", labelAr: "جيجل", order: 13 },
};

const NEW_STORES = [
  base({
    id: "etp-h-trading",
    nameFr: "EURL ETP / SARL H.TRADING",
    nameAr: "EURL ETP / SARL H.TRADING",
    city: "alger",
    wilayaFr: "Alger",
    wilayaAr: "الجزائر",
    communeFr: "Dar El Beida",
    communeAr: "دار البيضاء",
    addressFr: "Cité SNTP Groupe A Lot 28, El Hamiz, Alger 16000",
    addressAr: "Cité SNTP Groupe A Lot 28, El Hamiz, Alger 16000",
    phone: "0550470850",
    email: "mennasel_electric@yahoo.fr",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=El+Hamiz+Alger",
  }),
  base({
    id: "soma-flamme",
    nameFr: "SARL SOMA FLAMME",
    nameAr: "SARL SOMA FLAMME",
    city: "alger",
    wilayaFr: "Alger",
    wilayaAr: "الجزائر",
    communeFr: "Dar El Beida",
    communeAr: "دار البيضاء",
    addressFr: "Cité SNTP Est 32/33, El Hamiz, Dar El Beida 16000 Alger",
    addressAr: "Cité SNTP Est 32/33, El Hamiz, Dar El Beida 16000 Alger",
    phone: "0550277780",
    email: "samir.hamadou1@gmail.com",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=El+Hamiz+Dar+El+Beida",
  }),
  base({
    id: "cinquelec",
    nameFr: "EURL CINQUELEC",
    nameAr: "EURL CINQUELEC",
    city: "alger",
    wilayaFr: "Alger",
    wilayaAr: "الجزائر",
    communeFr: "Birkhadem",
    communeAr: "بئر خادم",
    addressFr: "12 Lot Ennahda, Birkhadem 16000 Alger",
    addressAr: "12 Lot Ennahda, Birkhadem 16000 Alger",
    phone: "0550936120 / 023548320",
    email: "a.lataoui@cinquel.com",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Birkhadem+Alger",
  }),
  base({
    id: "golf-arabes",
    nameFr: "EURL GOLF ARABES",
    nameAr: "EURL GOLF ARABES",
    city: "el-oued",
    wilayaFr: "El Oued",
    wilayaAr: "الوادي",
    communeFr: "El Oued",
    communeAr: "الوادي",
    addressFr: "Haï Chatt, Bloc 23, local N°03, El Oued 39000",
    addressAr: "Haï Chatt, Bloc 23, local N°03, El Oued 39000",
    phone: "0557716551 / 0550509109",
    email: "atallah.y@hotmail.fr",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=El+Oued+Algeria",
  }),
  base({
    id: "medis",
    nameFr: "SNC MEDIS",
    nameAr: "SNC MEDIS",
    city: "tizi-ouzou",
    wilayaFr: "Tizi Ouzou",
    wilayaAr: "تيزي وزو",
    communeFr: "Tizi Ouzou",
    communeAr: "تيزي وزو",
    addressFr: "Boulevard Krim Belkacem, Tizi Ouzou 15000",
    addressAr: "Boulevard Krim Belkacem, Tizi Ouzou 15000",
    phone: "0782240842 / 0770978443",
    email: "medis_snc@yahoo.com",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Tizi+Ouzou+Algeria",
  }),
  base({
    id: "soralec",
    nameFr: "SARL SORALEC",
    nameAr: "SARL SORALEC",
    city: "bouira",
    wilayaFr: "Bouira",
    wilayaAr: "البويرة",
    communeFr: "Bouira",
    communeAr: "البويرة",
    addressFr: "Cité 34 logts LSP Bt N°1, Bouira 10000",
    addressAr: "Cité 34 logts LSP Bt N°1, Bouira 10000",
    phone: "0770338633",
    email: "soralec.sys@gmail.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Bouira+Algeria",
  }),
  base({
    id: "amokrane",
    nameFr: "CE AMOKRANE",
    nameAr: "CE AMOKRANE",
    city: "bejaia",
    wilayaFr: "Béjaïa",
    wilayaAr: "بجاية",
    communeFr: "Béjaïa",
    communeAr: "بجاية",
    addressFr: "Zone Urbaine Aissou, Quatre chemins, Béjaïa 06000",
    addressAr: "Zone Urbaine Aissou, Quatre chemins, Béjaïa 06000",
    phone: "0561634246 / 0661630736",
    email: "am.electric06@gmail.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Bejaia+Algeria",
  }),
  base({
    id: "cejm-algerie",
    nameFr: "SARL CEJM ALGERIE",
    nameAr: "SARL CEJM ALGERIE",
    city: "bejaia",
    wilayaFr: "Béjaïa",
    wilayaAr: "بجاية",
    communeFr: "Béjaïa",
    communeAr: "بجاية",
    addressFr: "Lieu-dit Ferme Azamoum, Béjaïa 06000",
    addressAr: "Lieu-dit Ferme Azamoum, Béjaïa 06000",
    phone: "0770978454",
    email: "nassim.lamiri@cejm.eu",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Bejaia+Algeria",
  }),
  base({
    id: "connect-elec",
    nameFr: "EURL CONNECT ELEC",
    nameAr: "EURL CONNECT ELEC",
    city: "constantine",
    wilayaFr: "Constantine",
    wilayaAr: "قسنطينة",
    communeFr: "Constantine",
    communeAr: "قسنطينة",
    addressFr:
      "N° 03 et 05 UV 02, projet 265 logts Bt 02, Nouvelle Ville, Constantine 25000",
    addressAr:
      "N° 03 et 05 UV 02, projet 265 logts Bt 02, Nouvelle Ville, Constantine 25000",
    phone: "0661228333 / 031753133",
    email: "connectelec.algerie@outlook.fr",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Nouvelle+Ville+Constantine",
  }),
  base({
    id: "bouaziz-fahim",
    nameFr: "ETS BOUAZIZ FAHIM",
    nameAr: "ETS BOUAZIZ FAHIM",
    city: "msila",
    wilayaFr: "M'Sila",
    wilayaAr: "المسيلة",
    communeFr: "M'Sila",
    communeAr: "المسيلة",
    addressFr: "Cité 112 Lot Promotion Zaki, M'Sila 28000",
    addressAr: "Cité 112 Lot Promotion Zaki, M'Sila 28000",
    phone: "0558547700",
    email: "fahimmsila@yahoo.fr",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Msila+Algeria",
  }),
  base({
    id: "abdelhadi-sofiane",
    nameFr: "ETS ABDELHADI SOFIANE",
    nameAr: "ETS ABDELHADI SOFIANE",
    city: "jijel",
    wilayaFr: "Jijel",
    wilayaAr: "جيجل",
    communeFr: "Jijel",
    communeAr: "جيجل",
    addressFr: "19 Rue Chabii Mekki, Jijel 18000",
    addressAr: "19 Rue Chabii Mekki, Jijel 18000",
    phone: "0661962574",
    email: "soufianelec@gmail.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Jijel+Algeria",
  }),
  base({
    id: "mekki-elec",
    nameFr: "MEKKI ELEC",
    nameAr: "MEKKI ELEC",
    city: "batna",
    wilayaFr: "Batna",
    wilayaAr: "باتنة",
    communeFr: "Batna",
    communeAr: "باتنة",
    addressFr: "Boulevard KL / Route de Biskra, Batna 05000",
    addressAr: "Boulevard KL / Route de Biskra, Batna 05000",
    phone: "0661352090 / 0659293715",
    email: "mekki.elec@gmail.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Batna+Algeria",
  }),
];

const catalog = JSON.parse(fs.readFileSync(DATA, "utf8"));
Object.assign(catalog.cities, NEW_CITIES);

const ids = new Set(catalog.stores.map((s) => s.id));
let added = 0;
for (const store of NEW_STORES) {
  if (!ids.has(store.id)) {
    catalog.stores.push(store);
    ids.add(store.id);
    added++;
  }
}

const fed = catalog.stores.find((s) => s.id === "fedelec");
if (fed) {
  fed.nameFr = "FEDELEC (CHAIB DRAA TOUIRA)";
  fed.nameAr = "FEDELEC (CHAIB DRAA TOUIRA)";
}

const glob = catalog.stores.find((s) => s.id === "globaldz");
if (glob) {
  glob.nameFr = "GLOBAL MATERIAL SOUTH";
  glob.nameAr = "GLOBAL MATERIAL SOUTH";
}

catalog.version = 3;
catalog.updated = "2026-05-19";
catalog.disclaimerFr =
  "Annuaire des distributeurs officiels Legrand (source legrand.dz). Prix et stocks non communiqués en ligne — contactez chaque magasin. Brouillon : ne pas publier sans validation.";
catalog.disclaimerAr =
  "دليل موزعي Legrand الرسميين (مصدر legrand.dz). الأسعار والمخزون غير منشورة — اتصل بكل متجر. مسودة: لا تنشر دون موافقة.";

fs.writeFileSync(DATA, JSON.stringify(catalog, null, 2) + "\n");
console.log("Ajoutés:", added, "| Total magasins:", catalog.stores.length);
