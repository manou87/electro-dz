#!/usr/bin/env node
/**
 * Extrait le pack OneDrive KNX, renomme les fichiers en slugs,
 * met à jour data/livres.json et génère les couvertures SVG.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PACK_DIR = path.join(ROOT, "pdf/knx/knx-onedrive-pack-2026");
const LIVRES_PATH = path.join(ROOT, "data/livres.json");
const COVERS_DIR = path.join(ROOT, "assets/covers");

const PACKS = [
  {
    zip: "Advanced course_EN0923h.zip",
    outDir: "knx-advanced-course-en0923h",
    lang: ["en"],
    langLabel: "EN",
  },
  {
    zip: "Advanced course_FR0923h.zip",
    outDir: "knx-advanced-course-fr0923h",
    lang: ["fr"],
    langLabel: "FR",
  },
];

function slugify(name) {
  return name
    .replace(/\.(docx|pptx)$/i, "")
    .replace(/\.\./g, ".")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function bookId(outDir, slug) {
  return `${outDir}-${slug}`.replace(/-+/g, "-");
}

function humanTitle(baseName, langLabel) {
  const cleaned = baseName
    .replace(/_(EN|FR)[0-9a-z]+$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const code = baseName.match(/_(EN|FR)([0-9a-z]+)$/i);
  const suffix = code ? ` (${code[1].toUpperCase()}${code[2]})` : "";
  return `KNX Advanced — ${cleaned}${suffix} [${langLabel}]`;
}

function coverSvg(title, format, emoji) {
  const short = title.length > 42 ? title.slice(0, 39) + "…" : title;
  const badge = format.toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="400" height="240" fill="url(#g)"/><text x="24" y="36" font-size="28" text-anchor="start">${emoji}</text><text x="24" y="96" fill="#f8fafc" font-family="Segoe UI,Tahoma,sans-serif" font-size="13" font-weight="700" text-anchor="start">${escapeXml(short)}</text><rect x="16" y="16" width="84" height="26" rx="6" fill="rgba(239,68,68,0.9)"/><text x="58" y="33" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">${badge}</text></svg>`;
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractZip(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`unzip -o -q ${JSON.stringify(zipPath)} -d ${JSON.stringify(destDir)}`, {
    stdio: "inherit",
  });
}

const newBooks = [];

for (const pack of PACKS) {
  const zipPath = path.join(PACK_DIR, pack.zip);
  if (!fs.existsSync(zipPath)) {
    console.error("ZIP introuvable:", zipPath);
    process.exit(1);
  }

  const tmpDir = path.join(PACK_DIR, ".tmp-" + pack.outDir);
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  extractZip(zipPath, tmpDir);

  const outRoot = path.join(ROOT, "pdf/knx", pack.outDir);
  fs.mkdirSync(outRoot, { recursive: true });

  const files = fs.readdirSync(tmpDir).filter((f) => /\.(docx|pptx)$/i.test(f));
  for (const file of files) {
    const ext = path.extname(file).slice(1).toLowerCase();
    const base = path.basename(file, path.extname(file));
    const slug = slugify(file);
    const id = bookId(pack.outDir, slug);
    const destName = `${slug}.${ext}`;
    const relPath = `pdf/knx/${pack.outDir}/${destName}`;

    fs.copyFileSync(path.join(tmpDir, file), path.join(outRoot, destName));

    const titleFr = humanTitle(base, pack.langLabel);
    const titleAr = titleFr.replace("KNX Advanced", "KNX المتقدم");
    const formatLabel = ext === "pptx" ? "PowerPoint" : "Word";

    for (const lang of ["fr", "ar"]) {
      const coverPath = path.join(COVERS_DIR, `${id}-${lang}.svg`);
      fs.writeFileSync(
        coverPath,
        coverSvg(titleFr, ext, ext === "pptx" ? "📊" : "📘"),
        "utf8"
      );
    }

    newBooks.push({
      id,
      collection: "knx",
      category: "knx",
      titleFr,
      titleAr,
      descriptionFr: `Cours KNX Advanced — ${formatLabel} (cadeau ITQAN SMART & Rabah).`,
      descriptionAr: `دورة KNX المتقدمة — ${formatLabel === "Word" ? "Word" : "PowerPoint"} (هدية ITQAN SMART و Rabah).`,
      lang: pack.lang,
      pages: 0,
      year: 2026,
      fileFormat: ext,
      pdfUrl: relPath,
      featured: true,
      coverImageFr: `assets/covers/${id}-fr.svg`,
      coverImageAr: `assets/covers/${id}-ar.svg`,
    });
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const data = JSON.parse(fs.readFileSync(LIVRES_PATH, "utf8"));
const before = data.books.length;
data.books = data.books.filter((b) => b.id !== "knx-onedrive-pack-2026");
const removed = before - data.books.length;

const insertAt = data.books.findIndex((b) => b.id === "uk-electrical-code");
if (insertAt === -1) data.books.push(...newBooks);
else data.books.splice(insertAt, 0, ...newBooks);

fs.writeFileSync(LIVRES_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Entrée ZIP supprimée: ${removed}`);
console.log(`Nouveaux livres KNX: ${newBooks.length}`);
console.log(`  DOCX: ${newBooks.filter((b) => b.fileFormat === "docx").length}`);
console.log(`  PPTX: ${newBooks.filter((b) => b.fileFormat === "pptx").length}`);
