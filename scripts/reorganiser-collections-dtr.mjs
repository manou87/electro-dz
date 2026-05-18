#!/usr/bin/env node
/**
 * Algérie = DTR uniquement (habilitation, câbles MT/BT, M19).
 * Crée collection + dossier anglais pour livres EN.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PDF_ROOT = path.join(ROOT, "pdf");
const catalogPath = path.join(ROOT, "data/livres.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const ALGERIE_DTR_IDS = new Set([
  "habilitation-electrique-nonelec",
  "habilitation-electrique",
  "manuel-cables-mt-bt",
  "m19-moteurs-generatrices",
]);

const COLLECTION_FOLDER = {
  suisse: null,
  francais: "francais",
  algerien: "algerie",
  arabe: "arabe",
  anglais: "anglais",
  knx: "knx",
};

function movePdf(book, targetCollection) {
  const folder = COLLECTION_FOLDER[targetCollection];
  const url = (book.pdfUrl || "").trim();
  if (!url || !folder) return;

  const newUrl = `pdf/${folder}/${book.id}/${book.id}.pdf`;
  if (url === newUrl) return;

  const src = path.join(ROOT, url);
  const destDir = path.join(PDF_ROOT, folder, book.id);
  const destFile = path.join(destDir, book.id + ".pdf");
  fs.mkdirSync(destDir, { recursive: true });

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, destFile);
    if (path.resolve(src) !== path.resolve(destFile)) {
      try {
        fs.unlinkSync(src);
        const oldDir = path.dirname(src);
        if (fs.readdirSync(oldDir).length === 0) fs.rmdirSync(oldDir);
      } catch (_) {}
    }
  } else if (!fs.existsSync(destFile)) {
    console.warn("⚠ PDF manquant:", book.id, src);
    return;
  }
  book.pdfUrl = newUrl;
  console.log("  →", book.id, newUrl);
}

catalog.collections.algerien = {
  labelFr: "PDF Algérie — DTR",
  labelAr: "وثائق جزائرية — DTR",
  icon: "🇩🇿",
  order: 3,
};
catalog.collections.anglais = {
  labelFr: "PDF Anglais",
  labelAr: "كتب إنجليزية",
  icon: "🇬🇧",
  order: 5,
};
catalog.collections.arabe.order = 4;
catalog.collections.knx.order = 6;

fs.mkdirSync(path.join(PDF_ROOT, "anglais"), { recursive: true });
fs.writeFileSync(
  path.join(PDF_ROOT, "anglais", "README.txt"),
  "Dossier des PDF en langue anglaise — un sous-dossier par livre : anglais/{id}/{id}.pdf\n",
  "utf8"
);

const moves = {
  "nf-c15-106-malt": "francais",
  "electrotechnique-algerie": "francais",
};

for (const book of catalog.books) {
  if (ALGERIE_DTR_IDS.has(book.id)) {
    book.collection = "algerien";
    if (book.id === "m19-moteurs-generatrices") {
      book.titleFr = "Installation et dépannage — moteurs et génératrices (DTR)";
      book.descriptionFr =
        "Document technique de référence — moteurs et génératrices à courant alternatif.";
    }
    if (book.id === "manuel-cables-mt-bt") {
      book.titleFr = "Manuel technique — câbles électriques MT & BT (DTR)";
      book.descriptionFr =
        "Document technique de référence — câbles moyenne et basse tension.";
    }
    if (book.id === "habilitation-electrique-nonelec") {
      book.category = "securite";
      book.titleFr = "Habilitation électrique — mémo NONELEC (DTR)";
      book.titleAr = "التأهيل الكهربائي — مذكرة NONELEC (DTR)";
    }
    if (book.id === "habilitation-electrique") {
      book.category = "securite";
      book.titleFr = "Habilitation électrique (DTR)";
      book.titleAr = "التأهيل الكهربائي (DTR)";
    }
    movePdf(book, "algerien");
    continue;
  }

  if (moves[book.id]) {
    book.collection = moves[book.id];
    movePdf(book, moves[book.id]);
    continue;
  }

  if (book.collection === "algerien" && !ALGERIE_DTR_IDS.has(book.id)) {
    book.collection = "francais";
    movePdf(book, "francais");
    console.log("Retiré de Algérie:", book.id);
  }

  const langs = book.lang || [];
  if (
    langs.includes("en") &&
    !langs.includes("fr") &&
    book.collection !== "anglais"
  ) {
    book.collection = "anglais";
    movePdf(book, "anglais");
  }
}

catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

const dtr = catalog.books.filter((b) => b.collection === "algerien");
console.log(`\n✅ PDF Algérie (DTR) : ${dtr.length} ouvrage(s)`);
dtr.forEach((b) => console.log("   •", b.titleFr));
console.log("✅ Dossier pdf/anglais/ prêt pour les livres en anglais.");
