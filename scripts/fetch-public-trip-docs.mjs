#!/usr/bin/env node
/**
 * Télécharge tous les PDF publics connus (courbes t(I) Schneider / ABB / Hager).
 * Sortie : data/trip-curves/refs/ + manifest.json
 *
 * node scripts/fetch-public-trip-docs.mjs
 * node scripts/fetch-public-trip-docs.mjs --force   # re-télécharge même si cache
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/trip-curves/refs');
const FORCE = process.argv.includes('--force');

/** @type {{ id: string, brand: string, name: string, url: string, minBytes?: number }[]} */
const DOCS = [
  // ——— Schneider : courbes & organes ———
  {
    id: 'schneider-DOCA0217EN',
    brand: 'schneider',
    name: 'schneider-DOCA0217EN-ComPacT-NS-Micrologic.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=DOCA0217EN',
    minBytes: 100000,
  },
  {
    id: 'schneider-DOCA0141EN',
    brand: 'schneider',
    name: 'schneider-DOCA0141EN-NSX-Micrologic-567.pdf',
    url: 'https://www.productinfo.schneider-electric.com/compactnsxlegacymicrologic_5_6_7/doca0141-compact-nsx-legacy-micrologic-5_6_7/English/DOCA0141EN-03.pdf',
    minBytes: 100000,
  },
  {
    id: 'schneider-DOCA0140EN',
    brand: 'schneider',
    name: 'schneider-DOCA0140EN-NSX-breakers.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=DOCA0140EN',
    minBytes: 50000,
  },
  {
    id: 'schneider-DOCA0091EN',
    brand: 'schneider',
    name: 'schneider-DOCA0091EN-NSX-Modbus.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=DOCA0091EN',
    minBytes: 50000,
  },
  {
    id: 'schneider-ZXTHPLANCHF',
    brand: 'schneider',
    name: 'schneider-ZXTHPLANCHF-complements-techniques.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=ZXTHPLANCHF&p_enDocType=Technical+Advisory&p_File_Name=Compl%C3%A9ments+techniques_ZXTHPLANCHF.pdf',
    minBytes: 1000000,
  },
  {
    id: 'schneider-LVPED221001EN',
    brand: 'schneider',
    name: 'schneider-LVPED221001EN-NSX-NSXm-catalog.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=LVPED221001EN',
    minBytes: 5000000,
  },
  {
    id: 'schneider-NSX-catalog-2021',
    brand: 'schneider',
    name: 'schneider-NSX_NSXm_Catalog_2021.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=NSX_NSXm_Catalog_2021',
    minBytes: 5000000,
  },
  {
    id: 'schneider-LVPED217032EN',
    brand: 'schneider',
    name: 'schneider-LVPED217032EN-NSX-NSXm-catalog-legacy.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=LVPED217032EN',
    minBytes: 1000000,
  },
  {
    id: 'schneider-catalog-acti9',
    brand: 'schneider',
    name: 'schneider-catalog-acti9-iC60.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=catalog-acti9',
    minBytes: 100000,
  },
  {
    id: 'schneider-CA902086E',
    brand: 'schneider',
    name: 'schneider-CA902086E-iC60-RCBO.pdf',
    url: 'https://download.schneider-electric.com/files?p_Doc_Ref=CA902086E',
    minBytes: 50000,
  },
  // ——— ABB ———
  {
    id: 'abb-tmax-xt-chars',
    brand: 'abb',
    name: 'abb-1SDC210099D0205-Tmax-XT-characteristics.pdf',
    url: 'https://search.abb.com/library/Download.aspx?Action=Launch&DocumentID=1SDC210099D0205&LanguageCode=en',
    minBytes: 1000000,
  },
  {
    id: 'abb-tmax-xt-catalog',
    brand: 'abb',
    name: 'abb-1SDC210100D0205-Tmax-XT-catalog.pdf',
    url: 'https://search.abb.com/library/Download.aspx?Action=Launch&DocumentID=1SDC210100D0205&LanguageCode=en',
    minBytes: 1000000,
  },
  {
    id: 'abb-tmax-t-chars',
    brand: 'abb',
    name: 'abb-1SDC210099D0201-Tmax-T-characteristics.pdf',
    url: 'https://search.abb.com/library/Download.aspx?Action=Launch&DocumentID=1SDC210099D0201&LanguageCode=en',
    minBytes: 30000,
  },
  {
    id: 'abb-mcb-curves',
    brand: 'abb',
    name: 'abb-mcb-trip-curves-guide.pdf',
    url: 'https://library.e.abb.com/public/b5acf03b2a1f42e3b08ed2fc27672c30/What+you+need+to+know+about+MCB+trip+curves.pdf',
    minBytes: 50000,
  },
  {
    id: 'abb-mcb-60898-compare',
    brand: 'abb',
    name: 'abb-2CDC400002D0201-MCB-tripping-compare.pdf',
    url: 'https://library.e.abb.com/public/114371fcc8e0456096db42d614bead67/2CDC400002D0201_view.pdf',
    minBytes: 50000,
  },
  {
    id: 'abb-ekip-touch',
    brand: 'abb',
    name: 'abb-1SDH002031A1002-Ekip-Touch.pdf',
    url: 'https://library.e.abb.com/public/9415d8ee686c4d179360cd8157c3321b/1SDH002031A1002.pdf',
    minBytes: 100000,
  },
  {
    id: 'abb-emax2-catalog',
    brand: 'abb',
    name: 'abb-1SDC200023D0201-Emax2-catalog.pdf',
    url: 'https://search.abb.com/library/Download.aspx?Action=Launch&DocumentID=1SDC200023D0201&LanguageCode=en',
    minBytes: 1000000,
  },
  {
    id: 'abb-emax-technical',
    brand: 'abb',
    name: 'abb-1SDC200006D0203-Emax-technical.pdf',
    url: 'https://library.e.abb.com/public/bd050166a850b382c12571010033ae19/1SDC200006D0203.pdf',
    minBytes: 500000,
  },
  {
    id: 'abb-s200-datasheet',
    brand: 'abb',
    name: 'abb-2CDC002157D0202-S200-S200M-datasheet.pdf',
    url: 'https://search.abb.com/library/Download.aspx?Action=Launch&DocumentID=2CDC002157D0202&LanguageCode=en',
    minBytes: 100000,
  },
  // ——— Hager ———
  {
    id: 'hager-mcb-tech',
    brand: 'hager',
    name: 'hager-MCB-technical-data-NBN.pdf',
    url: 'https://storage.electrika.com/manu/man-0330/pdftech/0330-hager-cat-19-090-099.pdf',
    minBytes: 50000,
  },
  {
    id: 'hager-mcb-au',
    brand: 'hager',
    name: 'hager-TECHINFO-MCBS-AU.pdf',
    url: 'https://hagerelectro.com.au/files/download/0/32587_1/0/TECHINFO_MCBS.PDF',
    minBytes: 50000,
  },
  {
    id: 'hager-catalog-fr',
    brand: 'hager',
    name: 'hager-MCB-catalog-fr.pdf',
    url: 'https://www.hager.ie/files/download/0/24900_1/0/Miniature%20Circuit%20Breakers.pdf',
    minBytes: 50000,
  },
];

async function downloadOne(entry) {
  const dest = path.join(OUT, entry.name);
  const min = entry.minBytes || 30000;
  if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size >= min) {
    return { ...entry, path: dest, status: 'cached', bytes: fs.statSync(dest).size };
  }
  const res = await fetch(entry.url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ElectroDZ-trip-curve-fetch/2.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < min) throw new Error(`Fichier trop petit (${buf.length} o, min ${min})`);
  fs.writeFileSync(dest, buf);
  return { ...entry, path: dest, status: 'downloaded', bytes: buf.length };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const results = [];
  let ok = 0;
  let fail = 0;
  for (const d of DOCS) {
    try {
      const r = await downloadOne(d);
      results.push(r);
      ok++;
      console.log(`${r.status === 'cached' ? 'OK' : '↓'} ${d.name} (${Math.round(r.bytes / 1024)} Ko)`);
    } catch (e) {
      results.push({ ...d, status: 'failed', error: e.message });
      fail++;
      console.warn('Échec', d.name, '—', e.message);
    }
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    directory: OUT,
    summary: { total: DOCS.length, ok, failed: fail },
    files: results.map((r) => ({
      id: r.id,
      brand: r.brand,
      fileName: r.name,
      url: r.url,
      status: r.status,
      bytes: r.bytes || null,
      error: r.error || null,
    })),
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // Nettoyer doublons anciens noms
  const legacy = [
    'schneider-DOCA0217EN.pdf',
    'abb-mcb-trip-curves.pdf',
    'abb-tmax-xt-1SDC210099D0205.pdf',
    'schneider-LVPED221001EN.pdf',
  ];
  for (const f of legacy) {
    const p = path.join(OUT, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('Supprimé doublon:', f);
    }
  }

  const totalMb = results
    .filter((r) => r.bytes)
    .reduce((s, r) => s + r.bytes, 0) / (1024 * 1024);
  console.log(`\n${ok}/${DOCS.length} OK, ${fail} échec(s) — ~${totalMb.toFixed(0)} Mo dans ${OUT}`);
}

main();
