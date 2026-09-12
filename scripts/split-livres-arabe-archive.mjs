#!/usr/bin/env node
/**
 * Sépare l'archive PDF Arabe (ex-kutub) de data/livres.json
 * → data/livres-arabe-archive.json (chargé à la demande par bibliotheque.js)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MAIN = path.join(ROOT, "data/livres.json");
const ARCHIVE = path.join(ROOT, "data/livres-arabe-archive.json");

const catalog = JSON.parse(fs.readFileSync(MAIN, "utf8"));
const existingArchive = fs.existsSync(ARCHIVE)
  ? JSON.parse(fs.readFileSync(ARCHIVE, "utf8"))
  : { books: [] };

function isArchiveBook(book) {
  if (!book) return false;
  if (book.archive === true) return true;
  if (book.collection === "kutub" || book.category === "kutub") return true;
  if (String(book.id || "").startsWith("kutub-")) return true;
  if (book.collection === "arabe" && book.category === "arabe" && book.source) {
    return String(book.source).includes("kutub");
  }
  return false;
}

const fromMain = (catalog.books || []).filter(isArchiveBook);
const kept = (catalog.books || []).filter((b) => !isArchiveBook(b));
const byId = new Map();
for (const b of existingArchive.books || []) byId.set(b.id, b);
for (const b of fromMain) byId.set(b.id, b);

const archiveBooks = [...byId.values()].map((b) => {
  const out = { ...b };
  out.collection = "arabe";
  out.category = "arabe";
  out.archive = true;
  delete out.coverPreview;
  delete out._catalogIndex;
  return out;
});

delete catalog.collections?.kutub;
delete catalog.categories?.kutub;
catalog.collections = catalog.collections || {};
catalog.collections.arabe = {
  labelFr: "PDF Arabe",
  labelAr: "كتب عربية",
  order: 4,
};
catalog.categories = catalog.categories || {};
const arabeIcon = fs.existsSync(path.join(ROOT, "assets/library-themes/arabe.png"))
  ? "assets/library-themes/arabe.png"
  : "assets/library-themes/kutub.png";
catalog.categories.arabe = {
  labelFr: "PDF Arabe",
  labelAr: "كتب عربية",
  icon: arabeIcon,
  order: 10,
};
catalog.books = kept;
catalog.lazyArchives = {
  arabe: {
    url: "data/livres-arabe-archive.json",
    count: archiveBooks.length,
    labelFr: "PDF Arabe (archive)",
    labelAr: "كتب عربية (أرشيف)",
  },
};
catalog.updated = new Date().toISOString().slice(0, 10);
catalog.version = Number(catalog.version || 8);

const archiveDoc = {
  version: catalog.version,
  updated: catalog.updated,
  collection: "arabe",
  category: "arabe",
  books: archiveBooks,
};

fs.writeFileSync(MAIN, JSON.stringify(catalog, null, 2) + "\n");
fs.writeFileSync(ARCHIVE, JSON.stringify(archiveDoc, null, 2) + "\n");
console.log(
  `OK — main ${kept.length} livres, archive arabe ${archiveBooks.length} → ${path.relative(ROOT, ARCHIVE)}`
);
