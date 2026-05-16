#!/usr/bin/env node
/**
 * Ajoute une entrée dans data/livres.json
 * Usage: node scripts/ajouter-livre.mjs
 *    ou: node scripts/ajouter-livre.mjs --id mon-livre --titleFr "Titre" --pdfUrl "https://..."
 */
import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, "../data/livres.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1]) {
      out[args[i].slice(2)] = args[++i];
    }
  }
  return out;
}

function ask(rl, q, def = "") {
  return new Promise((resolve) => {
    const label = def ? `${q} [${def}]: ` : `${q}: `;
    rl.question(label, (a) => resolve((a || def).trim()));
  });
}

async function main() {
  const cli = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const categories = Object.keys(catalog.categories || {});

  let book;
  if (cli.id && cli.titleFr) {
    book = {
      id: cli.id,
      category: cli.category || "autres",
      titleFr: cli.titleFr,
      titleAr: cli.titleAr || cli.titleFr,
      descriptionFr: cli.descriptionFr || "",
      descriptionAr: cli.descriptionAr || cli.descriptionFr || "",
      lang: (cli.lang || "fr").split(",").map((s) => s.trim()),
      pages: cli.pages ? Number(cli.pages) : undefined,
      year: cli.year ? Number(cli.year) : new Date().getFullYear(),
      pdfUrl: cli.pdfUrl || "",
      featured: cli.featured === "true",
    };
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n📚 Ajouter un livre — DZSWISS ELEC\n");
    console.log("Catégories:", categories.join(", "));
    const id = await ask(rl, "ID (slug unique, ex: guide-tableau)");
    if (catalog.books.some((b) => b.id === id)) {
      console.error("Erreur: cet ID existe déjà.");
      rl.close();
      process.exit(1);
    }
    const category = await ask(rl, "Catégorie", "autres");
    const titleFr = await ask(rl, "Titre FR");
    const titleAr = await ask(rl, "Titre AR", titleFr);
    const descriptionFr = await ask(rl, "Description FR");
    const descriptionAr = await ask(rl, "Description AR", descriptionFr);
    const pdfUrl = await ask(rl, "URL PDF (Cloudflare R2 / Firebase)");
    const pages = await ask(rl, "Nombre de pages", "");
    const featured = await ask(rl, "À la une ? (o/n)", "n");
    rl.close();
    book = {
      id,
      category: categories.includes(category) ? category : "autres",
      titleFr,
      titleAr,
      descriptionFr,
      descriptionAr,
      lang: ["fr", "ar"],
      pages: pages ? Number(pages) : undefined,
      year: new Date().getFullYear(),
      pdfUrl,
      featured: featured.toLowerCase() === "o" || featured.toLowerCase() === "y",
    };
  }

  catalog.books.push(book);
  catalog.updated = new Date().toISOString().slice(0, 10);
  writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\n✅ Ajouté:", book.titleFr);
  console.log("   Fichier:", CATALOG_PATH);
  console.log("   Déployez: cd website && git add data/livres.json && git commit -m 'catalog: " + book.id + "' && git push\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
