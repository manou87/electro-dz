#!/usr/bin/env node
/**
 * Importe un lot de PDF (WhatsApp / Downloads) vers pdf/{knx|francais|algerie}/{id}/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PDF_ROOT = path.join(ROOT, "pdf");

/** @type {Array<{id:string, collection:'knx'|'francais'|'algerien', category:string, src:string, titleFr:string, titleAr:string, descriptionFr:string, descriptionAr:string, lang:string[], year?:number, featured?:boolean}>} */
const IMPORTS = [
  {
    id: "memento-schemas-electriques",
    collection: "francais",
    category: "installation",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/D0749FB4-C725-4EA9-80A6-23243DA37228/Thierry-Gallauziaux_-David-Fedullo-Mémento-de-schémas-électriques-libgen.lc.pdf",
    titleFr: "Mémento des schémas électriques",
    titleAr: "مذكرة المخططات الكهربائية",
    descriptionFr: "Gallauziaux & Fedullo — lecture et réalisation de schémas.",
    descriptionAr: "غالوزيو وفيدولو — قراءة وإنجاز المخططات الكهربائية.",
    lang: ["fr"],
    year: 0,
    featured: true,
  },
  {
    id: "installation-electrique-pro",
    collection: "francais",
    category: "installation",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/6B6ED06B-1B77-4610-9152-4F234BCF0AE3/Thierry Gallauziaux, David Fedullo - L'installation electrique comme un pro!, Deuxieme edition  - libgen.lc_2.pdf",
    titleFr: "L'installation électrique comme un pro ! (2e éd.)",
    titleAr: "التركيب الكهربائي كالمحترفين (الطبعة 2)",
    descriptionFr: "Gallauziaux & Fedullo — guide pratique d'installation.",
    descriptionAr: "دليل عملي للتركيبات الكهربائية.",
    lang: ["fr"],
    year: 0,
    featured: true,
  },
  {
    id: "evolutions-norme-electrique-2014",
    collection: "francais",
    category: "normes",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/BEA86192-672B-402E-8F92-92F4250B80E1/Thierry Gallauziaux, David Fedullo - Les évolutions de la norme électrique (2014, Eyrolles) - libgen.lc.pdf",
    titleFr: "Les évolutions de la norme électrique (2014)",
    titleAr: "تطورات المعيار الكهربائي (2014)",
    descriptionFr: "Gallauziaux & Fedullo — Eyrolles.",
    descriptionAr: "غالوزيو وفيدولو — دار إيرول.",
    lang: ["fr"],
    year: 2014,
  },
  {
    id: "habilitation-electrique-nonelec",
    collection: "algerien",
    category: "securite",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/17FD689A-E604-46F2-B12C-2472E48F016D/Habilitation électrique Memo  NONELEC .pdf",
    titleFr: "Habilitation électrique — mémo NONELEC",
    titleAr: "التأهيل الكهربائي — مذكرة NONELEC",
    descriptionFr: "Mémo habilitation électrique (NONELEC).",
    descriptionAr: "مذكرة التأهيل الكهربائي.",
    lang: ["fr"],
    featured: true,
  },
  {
    id: "habilitation-electrique",
    collection: "algerien",
    category: "securite",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/440A5DF3-FD72-4BED-96FB-4B400E09A80C/habilitation électrique .pdf",
    titleFr: "Habilitation électrique",
    titleAr: "التأهيل الكهربائي",
    descriptionFr: "Support habilitation et sécurité électrique.",
    descriptionAr: "دعم التأهيل والسلامة الكهربائية.",
    lang: ["fr"],
  },
  {
    id: "nf-c15-106-malt",
    collection: "francais",
    category: "normes",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/3DF4E3B3-EA56-4831-A8B9-EB2F5EA65574/NF C15-106 MALT.pdf",
    titleFr: "NF C 15-106 — édition MALT",
    titleAr: "المعيار NF C 15-106 — نسخة MALT",
    descriptionFr: "Norme d'installation — version MALT (Maghreb).",
    descriptionAr: "معيار التركيب — نسخة MALT.",
    lang: ["fr"],
    featured: true,
  },
  {
    id: "m19-moteurs-generatrices",
    collection: "algerien",
    category: "triphase",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/81CC894E-4734-4314-A9F1-3125B18839C9/M19_Installation-et-dépannage-de-moteurs-et-de-génératrices-à-c.a (1).pdf",
    titleFr: "M19 — Moteurs et génératrices à c.a.",
    titleAr: "M19 — محركات ومولدات التيار المتردد",
    descriptionFr: "Installation et dépannage de moteurs et génératrices.",
    descriptionAr: "تركيب وإصلاح المحركات والمولدات.",
    lang: ["fr"],
  },
  {
    id: "electrotechnique-algerie",
    collection: "francais",
    category: "formation",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/4BD38D43-296D-4B2C-AA27-130851082E93/électrique.pdf",
    titleFr: "Électrotechnique (Algérie)",
    titleAr: "الكهروتقنية (الجزائر)",
    descriptionFr: "Cours / support électrotechnique.",
    descriptionAr: "درس أو دعم في الكهروتقنية.",
    lang: ["fr", "ar"],
  },
  {
    id: "manuel-cables-mt-bt",
    collection: "algerien",
    category: "installation",
    src: "/var/folders/75/zdrs2l2n06jg15879wxjcfw00000gn/T/net.whatsapp.WhatsApp/documents/EEA7D2AC-5637-4F5F-A901-731A5026B1A8/Manuel technique sur les câbles électriques MT & BT.pdf",
    titleFr: "Manuel technique — câbles MT & BT",
    titleAr: "دليل تقني — كابلات الجهد المتوسط والمنخفض",
    descriptionFr: "Câbles électriques moyenne et basse tension.",
    descriptionAr: "كابلات الجهد المتوسط والمنخفض.",
    lang: ["fr"],
    featured: true,
  },
  {
    id: "knx-arguments-rbh-2025",
    collection: "knx",
    category: "knx",
    src: "/Users/a/Downloads/CLASSEUR KNX_RBH12.2025 /ARGUMENTS KNX-RBH12.2025.PDF",
    titleFr: "KNX — Arguments (RBH 12.2025)",
    titleAr: "KNX — الحجج (RBH 12.2025)",
    descriptionFr: "Formation Innoval — arguments KNX.",
    descriptionAr: "تكوين Innoval — مقدمة KNX.",
    lang: ["fr"],
    year: 2025,
    featured: true,
  },
  {
    id: "knx-formation-chap-1-4-rbh-2025",
    collection: "knx",
    category: "knx",
    src: "/Users/a/Downloads/CLASSEUR KNX_RBH12.2025 /CHAP 1.2.3.4_KNX-FORMATION_RBH 12.2025.PDF",
    titleFr: "KNX — Formation ch. 1 à 4 (RBH 2025)",
    titleAr: "KNX — التكوين الفصول 1–4 (2025)",
    descriptionFr: "Chapitres 1 à 4 — domotique KNX.",
    descriptionAr: "الفصول 1 إلى 4 — المنزل الذكي KNX.",
    lang: ["fr"],
    year: 2025,
    featured: true,
  },
  {
    id: "knx-formation-chap-5-8-rbh-2025",
    collection: "knx",
    category: "knx",
    src: "/Users/a/Downloads/CLASSEUR KNX_RBH12.2025 /CHAP 5.6.7.8_KNX-FORMATION_RBH 12.2025.PDF",
    titleFr: "KNX — Formation ch. 5 à 8 (RBH 2025)",
    titleAr: "KNX — التكوين الفصول 5–8 (2025)",
    descriptionFr: "Chapitres 5 à 8 — domotique KNX.",
    descriptionAr: "الفصول 5 إلى 8.",
    lang: ["fr"],
    year: 2025,
    featured: true,
  },
  {
    id: "knx-formation-chap-9-10-rbh-2025",
    collection: "knx",
    category: "knx",
    src: "/Users/a/Downloads/CLASSEUR KNX_RBH12.2025 /CHAP 9.10_KNX-FORMATION_RBH 12.2025.PDF",
    titleFr: "KNX — Formation ch. 9 et 10 (RBH 2025)",
    titleAr: "KNX — التكوين الفصول 9–10 (2025)",
    descriptionFr: "Chapitres 9 et 10 — domotique KNX.",
    descriptionAr: "الفصول 9 و 10.",
    lang: ["fr"],
    year: 2025,
    featured: true,
  },
  {
    id: "knx-somaire-innoval-rbh-2025",
    collection: "knx",
    category: "knx",
    src: "/Users/a/Downloads/CLASSEUR KNX_RBH12.2025 /SOMAIRE_KNX-FORMATION INNOVAL_RBH 12.2025.PDF",
    titleFr: "KNX — Sommaire formation Innoval (2025)",
    titleAr: "KNX — فهرس تكوين Innoval (2025)",
    descriptionFr: "Sommaire du classeur KNX RBH.",
    descriptionAr: "فهرس ملف KNX RBH.",
    lang: ["fr"],
    year: 2025,
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
  if (!fs.existsSync(entry.src)) {
    throw new Error("Source introuvable : " + entry.src);
  }
  const sub = COLLECTION_DIR[entry.collection];
  const dir = path.join(PDF_ROOT, sub, entry.id);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, entry.id + ".pdf");
  fs.copyFileSync(entry.src, dest);
  return `pdf/${sub}/${entry.id}/${entry.id}.pdf`;
}

const catalogPath = path.join(ROOT, "data/livres.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

catalog.collections.suisse.labelFr = "PDF Suisse";
catalog.collections.francais.labelFr = "PDF France";
catalog.collections.francais.labelAr = "كتب فرنسية";

if (!catalog.collections.algerien) {
  catalog.collections.algerien = {
    labelFr: "PDF Algérie",
    labelAr: "كتب جزائرية",
    icon: "🇩🇿",
    order: 3,
  };
}
catalog.collections.arabe = {
  labelFr: "PDF Arabe",
  labelAr: "كتب عربية",
  icon: "📖",
  order: 4,
};
catalog.collections.anglais = {
  labelFr: "PDF Anglais",
  labelAr: "كتب إنجليزية",
  icon: "🇬🇧",
  order: 5,
};
catalog.collections.knx = {
  labelFr: "PDF KNX",
  labelAr: "كتب KNX",
  icon: "🏠",
  order: 6,
};

catalog.categories.knx = {
  labelFr: "KNX & domotique",
  labelAr: "KNX والمنزل الذكي",
  icon: "🏠",
};


let added = 0;
for (const entry of IMPORTS) {
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
console.log(`\n${added} livre(s) importé(s).`);
