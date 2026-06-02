#!/usr/bin/env node
/**
 * Copie les PDF du projet vers website/pdf/ et régénère data/livres.json
 * Collections : suisse | francais | algerien | knx
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PDF_DIR = path.join(ROOT, "pdf");
const CATALOG_PATH = path.join(ROOT, "data/livres.json");
const ASSETS = path.join(ROOT, "..", "assets", "books");
const ICLOUD_TERRE = path.join(
  process.env.HOME || "",
  "Library/Mobile Documents/com~apple~CloudDocs/Tous les dossier/La terre suisse norme.pdf"
);
const ICLOUD_CH11 = path.join(
  process.env.HOME || "",
  "Library/Mobile Documents/com~apple~CloudDocs/Installateur électricien 2024/Divers /Electrotechnique ch11_2018.pdf"
);

/** @type {Array<{id:string,collection:'suisse'|'francais'|'algerien'|'arabe'|'knx',category:string,titleFr:string,titleAr:string,descriptionFr:string,descriptionAr:string,lang:string[],year?:number,featured?:boolean,src?:string,pdfUrl?:string}>} */
const MANIFEST = [
  // —— Suisse ——
  { id: "la-terre-suisse-norme", collection: "suisse", category: "normes", src: ICLOUD_TERRE,
    titleFr: "Mise à la terre — norme suisse", titleAr: "التأريض — المعيار السويسري",
    descriptionFr: "Prescriptions suisses pour la mise à la terre des installations.", descriptionAr: "اشتراطات التأريض للتركيبات وفق المعايير السويسرية.",
    lang: ["fr", "ar"], year: 2020, featured: true },
  { id: "explication-nibt-2020", collection: "suisse", category: "normes", src: path.join(ASSETS, "explication NIBT 2020_partie_1.pdf"),
    titleFr: "Explication NIBT 2020 (partie 1)", titleAr: "شرح NIBT 2020 (الجزء 1)",
    descriptionFr: "Commentaire et explications sur la norme NIBT 2020.", descriptionAr: "تعليق وشروح لمعيار NIBT 2020.",
    lang: ["fr"], year: 2020, featured: true },
  { id: "fet1-2014", collection: "suisse", category: "formation", src: path.join(ASSETS, "FET1_06.4_2014 2.pdf"),
    titleFr: "FET 1 — Formation électricien (2014)", titleAr: "FET 1 — تكوين كهربائي (2014)",
    descriptionFr: "Module de formation professionnelle suisse FET 1.", descriptionAr: "وحدة التكوين المهني السويسري FET 1.",
    lang: ["fr"], year: 2014 },
  { id: "fet2-2013", collection: "suisse", category: "formation", src: path.join(ASSETS, "FET2_06.4_2013 2.pdf"),
    titleFr: "FET 2 — Formation électricien (2013)", titleAr: "FET 2 — تكوين كهربائي (2013)",
    descriptionFr: "Module de formation professionnelle suisse FET 2.", descriptionAr: "وحدة التكوين المهني السويسري FET 2.",
    lang: ["fr"], year: 2013 },
  { id: "fet3-2014", collection: "suisse", category: "formation", src: path.join(ASSETS, "FET3_06.03_2014.pdf"),
    titleFr: "FET 3 — Formation électricien (2014)", titleAr: "FET 3 — تكوين كهربائي (2014)",
    descriptionFr: "Module de formation professionnelle suisse FET 3.", descriptionAr: "وحدة التكوين المهني السويسري FET 3.",
    lang: ["fr"], year: 2014 },
  { id: "electrotechnique-ch11-2018", collection: "suisse", category: "formation", src: ICLOUD_CH11,
    titleFr: "Électrotechnique ch. 11 (2018)", titleAr: "الكهروتقنية الفصل 11 (2018)",
    descriptionFr: "Cours d'électrotechnique — chapitre 11, programme suisse.", descriptionAr: "درس الكهروتقنية — الفصل 11، المنهج السويسري.",
    lang: ["fr"], year: 2018 },
  { id: "oibt-icc", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /OIBT-ICC.pdf"),
    titleFr: "OIBT — courants de court-circuit (ICC)", titleAr: "OIBT — تيارات القصر (ICC)",
    descriptionFr: "Procédure OIBT pour le calcul des courants de court-circuit.", descriptionAr: "إجراء OIBT لحساب تيارات القصر.",
    lang: ["fr"], year: 2022 },
  { id: "oibt-mesures-jt22", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /1_-_Procdure_des_mesures_OIBT_-_JT22.pdf"),
    titleFr: "OIBT — procédure des mesures (JT22)", titleAr: "OIBT — إجراء القياسات (JT22)",
    descriptionFr: "Mesures et contrôles selon la procédure OIBT JT22.", descriptionAr: "القياسات والفحوص وفق إجراء OIBT JT22.",
    lang: ["fr"], year: 2022 },
  { id: "nibt-nouveautes-2025", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /Nouveautes 2025_JT Cinelec.pdf"),
    titleFr: "NIBT — nouveautés 2025 (JT Cinelec)", titleAr: "NIBT — مستجدات 2025",
    descriptionFr: "Synthèse des nouveautés NIBT 2025.", descriptionAr: "ملخص مستجدات NIBT 2025.",
    lang: ["fr"], year: 2025, featured: true },
  { id: "nibt-nouveautes-2022", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /4_-_Nouveauts_2022.pdf"),
    titleFr: "NIBT — nouveautés 2022", titleAr: "NIBT — مستجدات 2022",
    descriptionFr: "Évolutions réglementaires NIBT 2022.", descriptionAr: "تطورات NIBT 2022.",
    lang: ["fr"], year: 2022 },
  { id: "premiere-verification-oibt", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /Premiere_verification.pdf"),
    titleFr: "Première vérification OIBT", titleAr: "الفحص الأول OIBT",
    descriptionFr: "Première vérification des installations électriques.", descriptionAr: "الفحص الأول للتركيبات الكهربائية.",
    lang: ["fr"] },
  { id: "protocole-ep-2018", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /Verzeichnis_Protokoll_f_2018_EP__002_.pdf"),
    titleFr: "Protocole EP 2018", titleAr: "بروتوكول EP 2018",
    descriptionFr: "Verzeichnis et protocole de contrôle EP 2018.", descriptionAr: "فهرس وبروتوكول فحص EP 2018.",
    lang: ["fr"], year: 2018 },
  { id: "hager-normen", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /Ouvrir Hager_Normen_f_web 2.pdf"),
    titleFr: "Hager — normes (référence)", titleAr: "Hager — المعايير",
    descriptionFr: "Document Hager sur les normes d'installation.", descriptionAr: "وثيقة Hager حول معايير التركيب.",
    lang: ["fr"] },
  { id: "ae-prof-2019", collection: "suisse", category: "formation", src: path.join(ASSETS, "AE prof 2019.pdf"),
    titleFr: "AE professionnel 2019", titleAr: "تكوين مهني AE 2019",
    descriptionFr: "Support de formation professionnelle électricité 2019.", descriptionAr: "دعم التكوين المهني في الكهرباء 2019.",
    lang: ["fr"], year: 2019 },

  // —— Français ——
  { id: "nf-c10-120", collection: "francais", category: "normes", src: path.join(ASSETS, "Norme Fr/NF C10-120.pdf"),
    titleFr: "NF C 10-120", titleAr: "المعيار NF C 10-120",
    descriptionFr: "Sécurité des personnes — installations électriques à basse tension.", descriptionAr: "سلامة الأشخاص — التركيبات الكهربائية منخفضة الجهد.",
    lang: ["fr"], year: 2024, featured: true },
  { id: "nf-c13-100", collection: "francais", category: "normes", src: path.join(ASSETS, "Norme Fr/NF C13-100.pdf"),
    titleFr: "NF C 13-100", titleAr: "المعيار NF C 13-100",
    descriptionFr: "Installations électriques à basse tension — prescriptions.", descriptionAr: "التركيبات الكهربائية منخفضة الجهد.",
    lang: ["fr"], year: 2024, featured: true },
  { id: "nf-c15-100", collection: "francais", category: "normes", src: path.join(ASSETS, "Norme Fr/NF C15-100.pdf"),
    titleFr: "NF C 15-100", titleAr: "المعيار NF C 15-100",
    descriptionFr: "Installations électriques — locaux d'habitation.", descriptionAr: "التركيبات الكهربائية — مساكن.",
    lang: ["fr"], year: 2025, featured: true },
  { id: "nf-c20-010", collection: "francais", category: "normes", src: path.join(ASSETS, "Norme Fr/NF C20-010.pdf"),
    titleFr: "NF C 20-010", titleAr: "المعيار NF C 20-010",
    descriptionFr: "Installations électriques à basse tension — règles.", descriptionAr: "قواعد التركيبات الكهربائية منخفضة الجهد.",
    lang: ["fr"], year: 2024 },
  { id: "mise-a-la-terre-fr", collection: "francais", category: "installation", src: path.join(ASSETS, "La mise à la terre.pdf"),
    titleFr: "La mise à la terre", titleAr: "التأريض",
    descriptionFr: "Principes et mise en œuvre de la mise à la terre.", descriptionAr: "مبادئ وتنفيذ التأريض.",
    lang: ["fr"], featured: false },

  // —— Livres arabe ——
  { id: "apprentissage-automatisme", collection: "arabe", category: "installation", src: path.join(ASSETS, "livre arabe/تعلم  كيف تقرأ دوائر التحكم الآلي.pdf"),
    titleFr: "Apprendre à lire les schémas d'automatisme", titleAr: "تعلم كيف تقرأ دوائر التحكم الآلي",
    descriptionFr: "Lecture et compréhension des circuits de commande automatisée.", descriptionAr: "قراءة وفهم دوائر التحكم الآلي.",
    lang: ["ar"], featured: true },
  { id: "fichier-electrique-ar", collection: "arabe", category: "installation", src: path.join(ASSETS, "livre arabe/الملف الكهربي.pdf"),
    titleFr: "Le dossier électrique (AR)", titleAr: "الملف الكهربي",
    descriptionFr: "Constitution et contenu du dossier électrique.", descriptionAr: "تكوين ومحتوى الملف الكهربي.",
    lang: ["ar"] },
  { id: "plc-hassan-elshhat", collection: "arabe", category: "installation", src: path.join(ASSETS, "livre arabe/التحكم_المنطقي_المبرمج_م_حسن_الشحات_.pdf"),
    titleFr: "API — Hassan El Chahat", titleAr: "التحكم المنطقي المبرمج — م. حسن الشحات",
    descriptionFr: "Automatisme et API.", descriptionAr: "الأتمتة والتحكم المنطقي المبرمج.",
    lang: ["ar"], featured: true },
  { id: "variateur-moteurs-ar", collection: "arabe", category: "energie", src: path.join(ASSETS, "livre arabe/الانفرتر وتنظيم سرعة المحركات الحثية.pdf"),
    titleFr: "Variateur et moteurs à induction", titleAr: "الإنفرتر وتنظيم سرعة المحركات الحثية",
    descriptionFr: "Variation de vitesse des moteurs asynchrones.", descriptionAr: "تنظيم سرعة المحركات الحثية.",
    lang: ["ar"] },
  { id: "generateurs-electriques", collection: "arabe", category: "energie", src: path.join(ASSETS, "livre arabe/المولدات الكهربائية .pdf"),
    titleFr: "Génératrices électriques", titleAr: "المولدات الكهربائية",
    descriptionFr: "Fonctionnement des génératrices.", descriptionAr: "تشغيل المولدات الكهربائية.",
    lang: ["ar"] },
  { id: "diagnostic-moteurs-ac", collection: "arabe", category: "autres", src: path.join(ASSETS, "livre arabe/تشخيص الاعطال الكهربائية لمحركات التيار المتردد.pdf"),
    titleFr: "Diagnostic moteurs AC", titleAr: "تشخيص الأعطال الكهربائية لمحركات التيار المتردد",
    descriptionFr: "Diagnostic des pannes sur moteurs à courant alternatif.", descriptionAr: "تشخيص أعطال محركات التيار المتردد.",
    lang: ["ar"], featured: true },
];

// control1–8 dans assets = doublons d'autres PDF (ne pas réimporter).
const EXTRA_AR = [
  { id: "mesures-sina-2002", collection: "suisse", category: "normes", src: path.join(ASSETS, "Controle alger /M___P_SiNa_2002_10_133-f.pdf"),
    titleFr: "Mesures SiNa 2002", titleAr: "قياسات SiNa 2002",
    descriptionFr: "Procédure de mesures SiNa.", descriptionAr: "إجراء قياسات SiNa.", lang: ["fr"], year: 2002 },
];
MANIFEST.push(...EXTRA_AR);

const ELECTRONS_BOOKS = [
  { id: "phaseurs-80", collection: "suisse", category: "monophase",
    titleFr: "Phaseurs en alternatif (80 formules)", titleAr: "الأطوار في التيار المتناوب (80 صيغة)",
    descriptionFr: "Diagrammes vectoriels et formules pour l'alternatif monophasé.", descriptionAr: "مخططات متجهة وصيغ للتيار المتناوب أحادي الطور.",
    lang: ["fr", "ar"], year: 2026, pdfUrl: "pdf/phaseurs-80.pdf", featured: true },
  { id: "phaseurs-2pp", collection: "suisse", category: "monophase",
    titleFr: "Phaseurs — version 2 par page", titleAr: "الأطوار — نسخة صفحتين",
    descriptionFr: "Même contenu, mise en page 2 fiches par page.", descriptionAr: "نفس المحتوى، تخطيط صفحتين للطباعة.",
    lang: ["fr"], year: 2026, pdfUrl: "pdf/phaseurs-2pp.pdf", featured: true },
  { id: "phaseurs-complexes", collection: "suisse", category: "monophase",
    titleFr: "Phaseurs complexes", titleAr: "أطوار مركبة",
    descriptionFr: "Représentation complexe des grandeurs alternatives.", descriptionAr: "تمثيل مركب للكميات المتناوبة.",
    lang: ["fr"], year: 2026, pdfUrl: "pdf/phaseurs-complexes.pdf" },
  { id: "filtres-passe", collection: "francais", category: "monophase",
    titleFr: "Filtres passifs passe haut / bas", titleAr: "مرشحات سلبية عالية/منخفضة التردد",
    descriptionFr: "Synthèse des filtres du premier ordre (Bode).", descriptionAr: "ملخص مرشحات الدرجة الأولى.",
    lang: ["fr"], year: 2026, pdfUrl: "pdf/filtres-passe.pdf" },
  { id: "triphase-denom", collection: "suisse", category: "triphase",
    titleFr: "Triphasé — dénominations usuelles", titleAr: "ثلاثي الطور — التسميات",
    descriptionFr: "Schémas et vocabulaire étoile, triangle.", descriptionAr: "مخططات ومفردات النجمة والمثلث.",
    lang: ["fr", "ar"], year: 2026, pdfUrl: "pdf/triphase-denom.pdf", featured: true },
  { id: "magnetisme-resume", collection: "suisse", category: "magnetisme",
    titleFr: "Résumé du magnétisme", titleAr: "ملخص المغناطيسية",
    descriptionFr: "Grandeurs magnétiques et électriques.", descriptionAr: "الكميات المغناطيسية والكهربائية.",
    lang: ["fr", "ar"], year: 2026, pdfUrl: "pdf/magnetisme-resume.pdf" },
  { id: "energie-suisse", collection: "suisse", category: "energie",
    titleFr: "Diagramme énergie Suisse", titleAr: "مخطط الطاقة سويسرا",
    descriptionFr: "Vue d'ensemble des flux énergétiques.", descriptionAr: "نظرة عامة على تدفقات الطاقة.",
    lang: ["fr"], year: 2026, pdfUrl: "pdf/energie-suisse.pdf" },
];

const EXISTING_LOCAL = [
  { id: "pdie-2018-01", collection: "suisse", category: "normes", pdf: "pdf/pdie-2018-01.pdf",
    titleFr: "Norme du distributeur d'électricité en Suisse (PDIE-CH 2018)",
    titleAr: "معيار موزّع الكهرباء في سويسرا (PDIE-CH 2018)",
    descriptionFr: "Prescriptions suisses installations BT — document PDIE-CH, éd. 2018.",
    descriptionAr: "اشتراطات التركيبات BT — وثيقة PDIE-CH، 2018.",
    lang: ["fr"], year: 2018, featured: true },
  { id: "pdie-ch-2021", collection: "suisse", category: "normes", pdf: "pdf/pdie-ch-2021.pdf",
    titleFr: "Norme du distributeur d'électricité en Suisse (PDIE-CH 2021)",
    titleAr: "معيار موزّع الكهرباء في سويسرا (PDIE-CH 2021)",
    descriptionFr: "Prescriptions suisses installations BT — document officiel PDIE-CH, éd. 2021.",
    descriptionAr: "اشتراطات التركيبات BT — وثيقة PDIE-CH الرسمية، 2021.",
    lang: ["fr"], year: 2021, featured: true,
    sourceUrl: "https://corpweb-st-prd-chn-dcdedafvgsbuejdj.a01.azurefd.net/public/document/2024-02/pdie-ch_2021.pdf" },
  { id: "fortec-formulaire-1987", collection: "suisse", category: "installation", pdf: "pdf/fortec-formulaire-1987.pdf",
    titleFr: "Formulaire technique Fortec (1987)", titleAr: "نموذج Fortec التقني (1987)",
    descriptionFr: "Formulaire Charle Pache.", descriptionAr: "نموذج Charle Pache.",
    lang: ["fr"], year: 1987 },
  { id: "ie-pos-5-plan-pq22", collection: "suisse", category: "installation", pdf: "pdf/ie-pos-5-plan-pq22.pdf",
    titleFr: "Plan d'installation Expert — IE Pos. 5", titleAr: "مخطط تركيب Expert — IE Pos. 5",
    descriptionFr: "Travail d'expert 2022.", descriptionAr: "عمل خبير 2022.",
    lang: ["fr"], year: 2022 },
  { id: "manuel-principes-protection", collection: "suisse", category: "securite", pdf: "pdf/manuel-principes-protection.pdf",
    titleFr: "Manuel — principes de protection", titleAr: "دليل — مبادئ الحماية",
    descriptionFr: "Protection des installations.", descriptionAr: "حماية التركيبات.",
    lang: ["fr"] },
  { id: "com-katalog-22-fr", collection: "suisse", category: "installation", pdf: "pdf/com-katalog-22-fr.pdf",
    titleFr: "Catalogue COM 2022", titleAr: "كتالوج COM 2022",
    descriptionFr: "Catalogue composants électriques.", descriptionAr: "كتالوج المكونات الكهربائية.",
    lang: ["fr"], year: 2022 },
];

function slugExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function copyIfExists(src, dest) {
  if (!src || !slugExists(src)) {
    console.warn("  ⚠ manquant:", src);
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function bookEntry(item, pdfUrl) {
  return {
    id: item.id,
    collection: item.collection,
    category: item.category,
    titleFr: item.titleFr,
    titleAr: item.titleAr,
    descriptionFr: item.descriptionFr,
    descriptionAr: item.descriptionAr,
    lang: item.lang,
    pages: item.pages || 0,
    year: item.year || 0,
    pdfUrl,
    featured: !!item.featured,
    coverImageFr: `assets/covers/${item.id}-fr.svg`,
    coverImageAr: `assets/covers/${item.id}-ar.svg`,
  };
}

fs.mkdirSync(PDF_DIR, { recursive: true });

const books = [];
const seen = new Set();

for (const item of MANIFEST) {
  if (seen.has(item.id)) continue;
  seen.add(item.id);
  const dest = path.join(PDF_DIR, `${item.id}.pdf`);
  const ok = item.src ? copyIfExists(item.src, dest) : false;
  const url = ok ? `pdf/${item.id}.pdf` : item.pdfUrl || "";
  if (!url) {
    console.warn("  ⊗ ignoré (pas de PDF):", item.id);
    continue;
  }
  books.push(bookEntry(item, url));
  console.log(ok ? "  ✓" : "  ↗", item.id);
}

for (const item of ELECTRONS_BOOKS) {
  if (seen.has(item.id)) continue;
  seen.add(item.id);
  books.push({
    ...bookEntry(item, item.pdfUrl),
    coverPreview: `assets/covers/previews/${item.id}.png`,
  });
}

for (const item of EXISTING_LOCAL) {
  if (seen.has(item.id)) continue;
  const full = path.join(ROOT, item.pdf);
  if (!slugExists(full)) continue;
  seen.add(item.id);
  books.push(bookEntry(item, item.pdf));
  console.log("  ✓ (existant)", item.id);
}

books.push({
  id: "memento-ddr",
  collection: "francais",
  category: "normes",
  titleFr: "Mémento — différentiels & DDR",
  titleAr: "مذكرة — التفاضلي و DDR",
  descriptionFr: "Sensibilités 30 mA / 300 mA — à publier.",
  descriptionAr: "حساسيات 30 mA / 300 mA — قريبًا.",
  lang: ["fr", "ar"],
  pages: 18,
  year: 2026,
  pdfUrl: "",
  featured: false,
  coverImageFr: "assets/covers/memento-ddr-fr.svg",
  coverImageAr: "assets/covers/memento-ddr-ar.svg",
});

const catalog = {
  version: 3,
  updated: new Date().toISOString().slice(0, 10),
  collections: {
    suisse: { labelFr: "PDF Suisse", labelAr: "كتب سويسرية", icon: "🇨🇭", order: 1 },
    francais: { labelFr: "PDF France", labelAr: "كتب فرنسية", icon: "🇫🇷", order: 2 },
    algerien: { labelFr: "PDF Algérie", labelAr: "كتب جزائرية", icon: "🇩🇿", order: 3 },
    arabe: { labelFr: "PDF Arabe", labelAr: "كتب عربية", icon: "📖", order: 4 },
    anglais: { labelFr: "PDF Anglais", labelAr: "كتب إنجليزية", icon: "🇬🇧", order: 5 },
    knx: { labelFr: "PDF KNX", labelAr: "كتب KNX", icon: "🏠", order: 6 },
  },
  categories: {
    normes: { labelFr: "Normes & réglementation", labelAr: "المعايير واللوائح", icon: "📋" },
    installation: { labelFr: "Installation & câblage", labelAr: "التركيب والكابلات", icon: "🔌" },
    formation: { labelFr: "Formation", labelAr: "تكوين", icon: "🎓" },
    monophase: { labelFr: "Monophasé", labelAr: "أحادي الطور", icon: "〰️" },
    triphase: { labelFr: "Triphasé", labelAr: "ثلاثي الطور", icon: "🔺" },
    magnetisme: { labelFr: "Magnétisme", labelAr: "المغناطيسية", icon: "🧲" },
    energie: { labelFr: "Énergie", labelAr: "الطاقة", icon: "⚡" },
    securite: { labelFr: "Sécurité", labelAr: "السلامة", icon: "🦺" },
    autres: { labelFr: "Autres ressources", labelAr: "موارد أخرى", icon: "📚" },
  },
  books,
};

catalog.books.sort((a, b) => {
  const order = { suisse: 1, francais: 2, algerien: 3, arabe: 4, anglais: 5, knx: 6 };
  const oa = order[a.collection] ?? 9;
  const ob = order[b.collection] ?? 9;
  if (oa !== ob) return oa - ob;
  return a.titleFr.localeCompare(b.titleFr, "fr");
});

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log(`\n✅ ${books.length} ouvrages → ${CATALOG_PATH}`);
