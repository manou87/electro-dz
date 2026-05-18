#!/usr/bin/env node
/**
 * Supprime les doublons vérifiés (MD5 identique) :
 * - livre-arabe-book2 = diagnostic-moteurs-ac
 * - control-oibt-1..8 = copies des docs OIBT/NIBT déjà au catalogue
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const catalogPath = path.join(ROOT, "data/livres.json");

const REMOVE_IDS = [
  "livre-arabe-book2",
  "control-oibt-1",
  "control-oibt-2",
  "control-oibt-3",
  "control-oibt-4",
  "control-oibt-5",
  "control-oibt-6",
  "control-oibt-7",
  "control-oibt-8",
];

/** @type {Record<string, string>} doublon → original conservé */
const KEEP_INSTEAD = {
  "livre-arabe-book2": "diagnostic-moteurs-ac",
  "control-oibt-1": "oibt-mesures-jt22",
  "control-oibt-2": "nibt-nouveautes-2022",
  "control-oibt-3": "mesures-sina-2002",
  "control-oibt-4": "nibt-nouveautes-2025",
  "control-oibt-5": "oibt-icc",
  "control-oibt-6": "hager-normen",
  "control-oibt-7": "premiere-verification-oibt",
  "control-oibt-8": "protocole-ep-2018",
};

function rmSafe(p) {
  if (!p || !fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const before = catalog.books.length;

for (const id of REMOVE_IDS) {
  const book = catalog.books.find((b) => b.id === id);
  if (!book) continue;

  const url = (book.pdfUrl || "").trim();
  if (url) {
    const abs = path.join(ROOT, url);
    rmSafe(abs);
    const dir = path.dirname(abs);
    try {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    } catch (_) {}
  }

  rmSafe(path.join(ROOT, "assets/covers/previews", id + ".png"));
  rmSafe(path.join(ROOT, "assets/covers", id + "-fr.svg"));
  rmSafe(path.join(ROOT, "assets/covers", id + "-ar.svg"));

  console.log("✗", id, "→ doublon de", KEEP_INSTEAD[id]);
}

catalog.books = catalog.books.filter((b) => !REMOVE_IDS.includes(b.id));
catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

console.log(`\n${before - catalog.books.length} entrée(s) supprimée(s). Reste : ${catalog.books.length} livres.`);
