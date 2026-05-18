#!/usr/bin/env node
/** Import normes NF (France) + codes UK/USA (Anglais) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PDF_ROOT = path.join(ROOT, "pdf");
const catalogPath = path.join(ROOT, "data/livres.json");

const WA = "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents";

/** @type {import('./import-bibliotheque-lot.mjs').IMPORTS} */
const BATCH = [
  {
    id: "uk-electrical-code",
    collection: "anglais",
    category: "normes",
    src: `${WA}/CB182AC6-A32A-450C-909C-0C24834EEAA1/UK code.pdf`,
    titleFr: "UK Electrical Code",
    titleAr: "المعيار الكهربائي البريطاني",
    descriptionFr: "British electrical installation code (UK).",
    descriptionAr: "معيار التركيبات الكهربائية البريطاني.",
    lang: ["en"],
    year: 0,
    featured: true,
  },
  {
    id: "wiring-house-usa",
    collection: "anglais",
    category: "installation",
    src: `${WA}/C71384F6-6B6C-469C-85D3-B41A4ABE02C6/wiring a house usa code.pdf`,
    titleFr: "Wiring a House (USA)",
    titleAr: "تمديدات منزلية (أمريكا)",
    descriptionFr: "Residential wiring according to US practice.",
    descriptionAr: "التمديدات السكنية وفق الممارسة الأمريكية.",
    lang: ["en"],
    featured: true,
  },
  {
    id: "nec-code-usa-2017",
    collection: "anglais",
    category: "normes",
    src: `${WA}/EDD92E63-5A34-413B-A94F-F4A628F7D00F/NEC CODE USA 2017.pdf`,
    titleFr: "NEC — National Electrical Code 2017 (USA)",
    titleAr: "NEC — المعيار الوطني الأمريكي 2017",
    descriptionFr: "National Electrical Code USA, édition 2017.",
    descriptionAr: "المعيار الكهربائي الوطني الأمريكي 2017.",
    lang: ["en"],
    year: 2017,
    featured: true,
  },
  {
    id: "nec-handbook-usa-2020",
    collection: "anglais",
    category: "normes",
    src: `${WA}/BCD988FA-0DAB-4EF9-A5C3-8948BED7716F/national electrical code 2020 handbook USA.pdf`,
    titleFr: "NEC Handbook 2020 (USA)",
    titleAr: "دليل NEC 2020 (أمريكا)",
    descriptionFr: "National Electrical Code — handbook édition 2020.",
    descriptionAr: "دليل المعيار الكهربائي الوطني 2020.",
    lang: ["en"],
    year: 2020,
    featured: true,
  },
  {
    id: "nf-c15-100-partie-h",
    collection: "francais",
    category: "normes",
    src: `${WA}/E7A73128-D6CD-4A2A-A1CD-40D7FB05FA01/nfc-15-100-partie h.pdf`,
    titleFr: "NF C 15-100 — partie H",
    titleAr: "NF C 15-100 — الجزء H",
    descriptionFr: "Installations électriques — locaux d'habitation, partie H.",
    descriptionAr: "التركيبات الكهربائية — مساكن، الجزء H.",
    lang: ["fr"],
    featured: false,
  },
  {
    id: "nf-c15-100-partie-c",
    collection: "francais",
    category: "normes",
    src: `${WA}/317AE5B9-745C-4E03-BF6E-2C63C1C4F412/nfc-15-100-partie c.pdf`,
    titleFr: "NF C 15-100 — partie C",
    titleAr: "NF C 15-100 — الجزء C",
    descriptionFr: "Installations électriques — locaux d'habitation, partie C.",
    descriptionAr: "التركيبات الكهربائية — مساكن، الجزء C.",
    lang: ["fr"],
    featured: false,
  },
  {
    id: "nf-c15-100-2016",
    collection: "francais",
    category: "normes",
    src: `${WA}/76F1E5C5-C847-41C7-97F9-B7F9A55C7BAC/nfc15-100-2016.pdf`,
    titleFr: "NF C 15-100 (2016)",
    titleAr: "NF C 15-100 (2016)",
    descriptionFr: "Norme habitation — édition 2016.",
    descriptionAr: "معيار المساكن — طبعة 2016.",
    lang: ["fr"],
    year: 2016,
    featured: true,
  },
  {
    id: "nf-c13-100-2015",
    collection: "francais",
    category: "normes",
    src: `${WA}/91A61FA7-C4D0-4D00-BE4C-740A2C3BFD2F/nfc-13-100-2015.pdf`,
    titleFr: "NF C 13-100 (2015)",
    titleAr: "NF C 13-100 (2015)",
    descriptionFr: "Installations BT — prescriptions, édition 2015.",
    descriptionAr: "تركيبات الجهد المنخفض — طبعة 2015.",
    lang: ["fr"],
    year: 2015,
    featured: false,
  },
  {
    id: "nf-c18-510-2012",
    collection: "francais",
    category: "normes",
    src: `${WA}/139FB52D-7AB4-4223-92FC-F2C717AE9CD5/nfc-18-510-2012.pdf`,
    titleFr: "NF C 18-510 (2012)",
    titleAr: "NF C 18-510 (2012)",
    descriptionFr: "Travaux sous tension sur installations électriques.",
    descriptionAr: "أشغال تحت الجهد على التركيبات الكهربائية.",
    lang: ["fr"],
    year: 2012,
    featured: false,
  },
];

const COLLECTION_DIR = {
  knx: "knx",
  francais: "francais",
  algerien: "algerie",
  arabe: "arabe",
  anglais: "anglais",
};

function copyBook(entry) {
  if (!fs.existsSync(entry.src)) throw new Error("Source introuvable — " + entry.src);
  const sub = COLLECTION_DIR[entry.collection];
  const dir = path.join(PDF_ROOT, sub, entry.id);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, entry.id + ".pdf");
  fs.copyFileSync(entry.src, dest);
  return `pdf/${sub}/${entry.id}/${entry.id}.pdf`;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
let added = 0;

for (const entry of BATCH) {
  if (catalog.books.some((b) => b.id === entry.id)) {
    console.warn("Déjà présent :", entry.id);
    continue;
  }
  const pdfUrl = copyBook(entry);
  catalog.books.push({
    id: entry.id,
    collection: entry.collection,
    category: entry.category,
    titleFr: entry.titleFr,
    titleAr: entry.titleAr,
    descriptionFr: entry.descriptionFr,
    descriptionAr: entry.descriptionAr,
    lang: entry.lang,
    pages: 0,
    year: entry.year || 0,
    pdfUrl,
    featured: !!entry.featured,
    coverImageFr: `assets/covers/${entry.id}-fr.svg`,
    coverImageAr: `assets/covers/${entry.id}-ar.svg`,
    coverPreview: `assets/covers/previews/${entry.id}.png`,
  });
  added++;
  console.log("✓", entry.id, "→", pdfUrl);
}

catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`\n${added} ouvrage(s) ajouté(s).`);
