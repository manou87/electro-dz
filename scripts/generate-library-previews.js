#!/usr/bin/env node
/**
 * Génère assets/covers/previews/{id}.png (1re page / aperçu Quick Look)
 * et ajoute coverPreview dans data/livres.json.
 * macOS : qlmanage -t
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const LIVRES_PATH = path.join(ROOT, "data/livres.json");
const PREVIEW_DIR = path.join(ROOT, "assets/covers/previews");
const TMP = path.join(ROOT, ".tmp-preview-gen");

function fileFormat(book) {
  if (book.fileFormat) return String(book.fileFormat).toLowerCase();
  const u = (book.pdfUrl || "").toLowerCase();
  if (u.endsWith(".zip")) return "zip";
  if (u.endsWith(".docx")) return "docx";
  if (u.endsWith(".pptx")) return "pptx";
  if (u.endsWith(".doc")) return "doc";
  if (u.endsWith(".pdf")) return "pdf";
  return "";
}

function dedupeBookIds(books) {
  const seen = new Map();
  let fixed = 0;
  books.forEach(function (book) {
    let id = book.id;
    if (!id) return;
    if (!seen.has(id)) {
      seen.set(id, book);
      return;
    }
    const ext = fileFormat(book) || "file";
    let next = id + "-" + ext;
    let n = 2;
    while (seen.has(next)) {
      next = id + "-" + ext + "-" + n;
      n++;
    }
    book.id = next;
    seen.set(next, book);
    fixed++;
  });
  return fixed;
}

function qlThumb(sourceFile, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  execSync(
    "qlmanage -t -s 512 -o " + JSON.stringify(outDir) + " " + JSON.stringify(sourceFile),
    { stdio: "pipe" }
  );
  const base = path.basename(sourceFile) + ".png";
  const generated = path.join(outDir, base);
  if (!fs.existsSync(generated)) {
    throw new Error("Miniature non créée : " + generated);
  }
  return generated;
}

function main() {
  if (process.platform !== "darwin") {
    console.error("Ce script nécessite macOS (qlmanage).");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(LIVRES_PATH, "utf8"));
  const fixedIds = dedupeBookIds(data.books);
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  data.books.forEach(function (book) {
    if (!book.id || !book.pdfUrl) return;
    const previewRel = "assets/covers/previews/" + book.id + ".png";
    const previewAbs = path.join(ROOT, previewRel);
    const sourceAbs = path.join(ROOT, book.pdfUrl);

    if (!fs.existsSync(sourceAbs)) {
      console.warn("Fichier absent:", book.pdfUrl);
      failed++;
      return;
    }

    const fmt = fileFormat(book);
    if (fmt === "zip") {
      skipped++;
      return;
    }

    if (fs.existsSync(previewAbs) && book.coverPreview === previewRel) {
      skipped++;
      return;
    }

    try {
      const tmpOut = path.join(TMP, book.id);
      fs.mkdirSync(tmpOut, { recursive: true });
      const generated = qlThumb(sourceAbs, tmpOut);
      fs.copyFileSync(generated, previewAbs);
      book.coverPreview = previewRel;
      created++;
      console.log("OK", book.id);
    } catch (err) {
      failed++;
      console.warn("Échec", book.id, err.message || err);
    }
  });

  fs.writeFileSync(LIVRES_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.rmSync(TMP, { recursive: true, force: true });

  console.log("\nIDs dupliqués corrigés:", fixedIds);
  console.log("Miniatures créées:", created);
  console.log("Ignorés (déjà là / zip):", skipped);
  console.log("Échecs:", failed);
}

main();
