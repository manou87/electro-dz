#!/usr/bin/env node
/** Sépare les livres en langue arabe → collection arabe + dossier pdf/arabe/{id}/ */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PDF_ROOT = path.join(ROOT, "pdf");
const catalogPath = path.join(ROOT, "data/livres.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const ARABIC_ONLY_IDS = new Set([
  "plc-hassan-elshhat",
  "apprentissage-automatisme",
  "diagnostic-moteurs-ac",
  "generateurs-electriques",
  "fichier-electrique-ar",
  "livre-arabe-book2",
  "variateur-moteurs-ar",
]);

function isArabicBook(book) {
  if (ARABIC_ONLY_IDS.has(book.id)) return true;
  const langs = book.lang || [];
  return langs.length === 1 && langs[0] === "ar";
}

catalog.collections.arabe = {
  labelFr: "PDF Arabe",
  labelAr: "كتب عربية",
  icon: "📖",
  order: 4,
};
catalog.collections.anglais = catalog.collections.anglais || {
  labelFr: "PDF Anglais",
  labelAr: "كتب إنجليزية",
  icon: "🇬🇧",
  order: 5,
};
catalog.collections.knx.order = 6;

let moved = 0;
for (const book of catalog.books) {
  if (!isArabicBook(book)) continue;

  book.collection = "arabe";
  const url = (book.pdfUrl || "").trim();
  if (!url) continue;

  const src = path.join(ROOT, url);
  const destDir = path.join(PDF_ROOT, "arabe", book.id);
  const destFile = path.join(destDir, book.id + ".pdf");
  const newUrl = `pdf/arabe/${book.id}/${book.id}.pdf`;

  if (url === newUrl && fs.existsSync(destFile)) {
    moved++;
    continue;
  }

  fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(src)) {
    if (path.resolve(src) !== path.resolve(destFile)) {
      fs.copyFileSync(src, destFile);
      if (!url.includes("/arabe/")) {
        try {
          fs.unlinkSync(src);
        } catch (_) {}
      }
    }
  } else if (!fs.existsSync(destFile)) {
    console.warn("⚠ PDF manquant:", book.id, src);
    continue;
  }

  book.pdfUrl = newUrl;
  moved++;
  console.log("✓", book.id, "→", newUrl);
}

catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`\n${moved} livre(s) arabe(s) dans pdf/arabe/`);
