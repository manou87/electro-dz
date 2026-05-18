#!/usr/bin/env node
/**
 * Collection Algérie : ouvrages algériens (habilitation, M19, câbles, DTR E10-1…).
 * Le seul document intitulé « DTR » est dtr-e10-1.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const catalogPath = path.join(ROOT, "data/livres.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

catalog.collections.algerien = {
  labelFr: "PDF Algérie",
  labelAr: "كتب جزائرية",
  icon: "🇩🇿",
  order: 3,
};

catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log("✅ Libellé collection : PDF Algérie (sans DTR global)");
