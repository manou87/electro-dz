#!/usr/bin/env node
/**
 * Génère les couvertures SVG FR + AR pour data/livres.json
 * Usage: node scripts/generer-couvertures.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "data/livres.json"), "utf8"));
const outDir = path.join(root, "assets/covers");

const GRADIENTS = {
  normes: ["#1e40af", "#0f172a"],
  installation: ["#0d9488", "#0f172a"],
  monophase: ["#ca8a04", "#713f12"],
  triphase: ["#059669", "#064e3b"],
  magnetisme: ["#7c3aed", "#3b0764"],
  energie: ["#dc2626", "#450a0a"],
  securite: ["#b45309", "#451a03"],
  autres: ["#475569", "#0f172a"],
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(text, maxLen = 38) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (next.length > maxLen && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function makeSvg(book, langKey) {
  const cat = book.category || "autres";
  const [c1, c2] = GRADIENTS[cat] || GRADIENTS.autres;
  const icon = catalog.categories[cat]?.icon || "📄";
  const isAr = langKey === "ar";
  const title = isAr ? book.titleAr : book.titleFr;
  const lines = wrapTitle(title, isAr ? 34 : 42);
  const textX = isAr ? 376 : 24;
  const anchor = isAr ? "end" : "start";
  const lineEls = lines
    .map((ln, i) => `<tspan x="${textX}" dy="${i === 0 ? 0 : 22}" text-anchor="${anchor}">${esc(ln)}</tspan>`)
    .join("");
  const soon = !book.pdfUrl?.trim();
  const badgeLabel = soon ? (isAr ? "قريبًا" : "BIENTÔT") : "PDF";
  const font = isAr
    ? "'Segoe UI',Tahoma,'Arabic Typesetting',sans-serif"
    : "'Segoe UI',system-ui,sans-serif";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" role="img" dir="${isAr ? "rtl" : "ltr"}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#g)"/>
  <rect width="400" height="240" fill="rgba(0,0,0,0.25)"/>
  <text x="${textX}" y="36" font-size="28" text-anchor="${anchor}">${icon}</text>
  <text x="${textX}" y="88" fill="#f8fafc" font-family="${font}" font-size="${isAr ? 16 : 17}" font-weight="700" text-anchor="${anchor}">
    ${lineEls}
  </text>
  <text x="${textX}" y="200" fill="#facc15" font-family="${font}" font-size="11" font-weight="700" letter-spacing="1" text-anchor="${anchor}">DZSWISS ELEC</text>
  <rect x="300" y="16" width="${soon && isAr ? 72 : 84}" height="26" rx="6" fill="${soon ? "rgba(251,191,36,0.25)" : "rgba(239,68,68,0.9)"}"/>
  <text x="342" y="33" text-anchor="middle" fill="#fff" font-family="${font}" font-size="12" font-weight="800">${esc(badgeLabel)}</text>
</svg>`;
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const book of catalog.books) {
  const frFile = book.id + "-fr.svg";
  const arFile = book.id + "-ar.svg";
  fs.writeFileSync(path.join(outDir, frFile), makeSvg(book, "fr"), "utf8");
  fs.writeFileSync(path.join(outDir, arFile), makeSvg(book, "ar"), "utf8");
  book.coverImageFr = "assets/covers/" + frFile;
  book.coverImageAr = "assets/covers/" + arFile;
  delete book.coverImage;
}

catalog.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(root, "data/livres.json"), JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log("Couvertures FR+AR générées:", catalog.books.length * 2);
