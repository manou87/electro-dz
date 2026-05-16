#!/usr/bin/env node
/**
 * Génère des vignettes PNG (1re page) pour chaque PDF du catalogue.
 * macOS : Quick Look (qlmanage). Linux : pdftoppm si installé.
 * Usage: node scripts/generer-apercus-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const catalogPath = path.join(root, "data/livres.json");
const outDir = path.join(root, "assets/covers/previews");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

fs.mkdirSync(outDir, { recursive: true });

function hasQlmanage() {
  try {
    execSync("which qlmanage", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function hasPdftoppm() {
  try {
    execSync("which pdftoppm", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const useQl = hasQlmanage();
const usePpm = hasPdftoppm();

if (!useQl && !usePpm) {
  console.error("Installez qlmanage (macOS) ou poppler (pdftoppm) pour générer les aperçus.");
  process.exit(1);
}

async function materializePdf(url, dest) {
  if (/^pdf\//i.test(url) || url.startsWith("assets/")) {
    const local = path.join(root, url);
    if (!fs.existsSync(local)) throw new Error("Fichier introuvable — " + local);
    fs.copyFileSync(local, dest);
    return;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status + " — " + url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function thumbFromQl(pdfPath, id) {
  const tmpOut = path.join(tmpdir(), "electrodz-previews");
  fs.mkdirSync(tmpOut, { recursive: true });
  execSync(`qlmanage -t -s 900 -o "${tmpOut}" "${pdfPath}"`, { stdio: "pipe" });
  const base = path.basename(pdfPath);
  const generated = path.join(tmpOut, base + ".png");
  if (!fs.existsSync(generated)) throw new Error("qlmanage n'a pas produit " + generated);
  const dest = path.join(outDir, id + ".png");
  fs.copyFileSync(generated, dest);
  fs.unlinkSync(generated);
  return dest;
}

function thumbFromPpm(pdfPath, id) {
  const prefix = path.join(outDir, id);
  execSync(`pdftoppm -png -f 1 -l 1 -scale-to 900 "${pdfPath}" "${prefix}"`, { stdio: "pipe" });
  const generated = prefix + "-1.png";
  const dest = path.join(outDir, id + ".png");
  if (fs.existsSync(generated)) fs.renameSync(generated, dest);
  else throw new Error("pdftoppm n'a pas produit " + generated);
  return dest;
}

let ok = 0;
for (const book of catalog.books) {
  const url = (book.pdfUrl || "").trim();
  if (!url || url === "#") continue;

  const tmpPdf = path.join(tmpdir(), `electrodz-${book.id}.pdf`);
  try {
    console.log("→", book.id, "…");
    await materializePdf(url, tmpPdf);
    if (useQl) thumbFromQl(tmpPdf, book.id);
    else thumbFromPpm(tmpPdf, book.id);
    book.coverPreview = "assets/covers/previews/" + book.id + ".png";
    ok++;
    console.log("  ✓", book.coverPreview);
  } catch (e) {
    console.warn("  ✗", book.id, e.message || e);
  } finally {
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`\n${ok} aperçu(s) généré(s). Catalogue mis à jour.`);
