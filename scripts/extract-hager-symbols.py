#!/usr/bin/env python3
"""
Extrait les symboles vectoriels du PDF Hager Normen vers data/hager-symbols-official.json
et js/hager-symbols-official-data.js (base officielle Electro DZ).
"""
import json
import re
from collections import Counter
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "pdf/hager-normen.pdf"
OUT_JSON = ROOT / "data/hager-symbols-official.json"
OUT_JS = ROOT / "js/hager-symbols-official-data.js"

SYMBOL_PAGES = {
    5: "courants_tensions_commande",
    6: "conducteurs_appareils",
    7: "machines_mesure_knx",
    10: "planification_bpk",
}

LABEL_X_MIN = {5: 68, 6: 68, 7: 68, 10: 55}
SYMBOL_X_MAX = {5: 68, 6: 68, 7: 68, 10: 175}
CLUSTER_GAP = {5: 5, 6: 5, 7: 6, 10: 10}
MATCH_MAX_DY = {5: 18, 6: 18, 7: 20, 10: 22}

SKIP_PREFIX = (
    "Sous réserve",
    "Symboles pour",
    "Symboles de plan",
    "Disposition de l",
)

# Symboles à zone fixe (libellé dans marge ou note Hager)
FIXED_EXTRA = [
    {
        "id": "machine_m",
        "labelFr": "Moteur M (IEC 60617)",
        "page": 7,
        "category": "machines_mesure_knx",
        "clip": [24, 50, 66, 78],
    },
    {
        "id": "machine_star",
        "labelFr": "Machine * (M/G/C…)",
        "page": 7,
        "category": "machines_mesure_knx",
        "clip": [24, 42, 66, 58],
    },
    {
        "id": "ddr_fi",
        "labelFr": "Disjoncteur différentiel à courant de défaut (FI)",
        "page": 10,
        "category": "planification_bpk",
        "clip": [168, 318, 210, 348],
    },
]


def text_to_body(page, clip, pad=2):
    """Inclut les glyphes texte (~, =, M, 3N…) présents dans la zone symbole."""
    scale = 48.0 / max(clip.width, clip.height, 1)
    ox, oy = pad, pad
    parts = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for line in b["lines"]:
            for span in line["spans"]:
                bbox = span["bbox"]
                if bbox[0] < clip.x0 - 1 or bbox[2] > clip.x1 + 1:
                    continue
                if bbox[1] < clip.y0 - 1 or bbox[3] > clip.y1 + 1:
                    continue
                txt = span["text"].strip()
                if not txt or len(txt) > 24:
                    continue
                x = (bbox[0] - clip.x0 + ox) * scale
                y = (bbox[3] - clip.y0 + oy) * scale - 1
                fs = max(5, min(14, (span.get("size") or 7) * scale * 0.85))
                parts.append(
                    f'<text x="{x:.1f}" y="{y:.1f}" font-size="{fs:.1f}" '
                    f'font-family="Arial,sans-serif" fill="#0f172a">{txt}</text>'
                )
    return "".join(parts)


def drawing_to_body(drawings, clip, page=None, pad=2):
    scale = 48.0 / max(clip.width, clip.height, 1)
    ox, oy = pad, pad
    vb = int(max(clip.width, clip.height) * scale + pad * 2)
    parts = []
    stroke = "#0f172a"

    for d in drawings:
        r = d["rect"]
        if r.x1 < clip.x0 - 1 or r.x0 > clip.x1 + 1:
            continue
        if r.y1 < clip.y0 - 1 or r.y0 > clip.y1 + 1:
            continue

        sw = max(0.8, min(2.5, (d.get("width") or 0.35) * scale * 2.5))
        fill = d.get("fill")
        fill_s = "none"
        if fill:
            fill_s = "#0f172a" if sum(fill) < 1.5 else "#fff"

        d_attr = ""
        for item in d["items"]:
            op = item[0]
            if op == "l":
                p1, p2 = item[1], item[2]

                def tx(p):
                    return (p.x - clip.x0 + ox) * scale, (p.y - clip.y0 + oy) * scale

                x1, y1 = tx(p1)
                x2, y2 = tx(p2)
                d_attr += f"M{x1:.1f},{y1:.1f}L{x2:.1f},{y2:.1f}"
            elif op == "re":
                r2 = item[1]
                x = (r2.x0 - clip.x0 + ox) * scale
                y = (r2.y0 - clip.y0 + oy) * scale
                w = r2.width * scale
                h = r2.height * scale
                parts.append(
                    f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
                    f'fill="{fill_s}" stroke="{stroke}" stroke-width="{sw}"/>'
                )
                d_attr = ""
            elif op == "c":
                pts = [item[i] for i in range(1, 5)]

                def tx(p):
                    return (p.x - clip.x0 + ox) * scale, (p.y - clip.y0 + oy) * scale

                c = [tx(p) for p in pts]
                d_attr += (
                    f"M{c[0][0]:.1f},{c[0][1]:.1f}C{c[1][0]:.1f},{c[1][1]:.1f} "
                    f"{c[2][0]:.1f},{c[2][1]:.1f} {c[3][0]:.1f},{c[3][1]:.1f}"
                )

        if d_attr:
            parts.append(
                f'<path d="{d_attr}" fill="{fill_s}" stroke="{stroke}" stroke-width="{sw}" '
                f'stroke-linecap="round" stroke-linejoin="round"/>'
            )

    if page is not None:
        parts.append(text_to_body(page, clip, pad))

    return "".join(parts), vb


def slugify(text, page, idx):
    t = re.sub(r"[^a-zA-Z0-9]+", "_", text.lower()).strip("_")[:60]
    return f"p{page}_{idx:03d}_{t}" if t else f"p{page}_{idx:03d}"


def get_section_headers(page):
    headers = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for line in b["lines"]:
            txt = "".join(s["text"] for s in line["spans"]).strip()
            if not txt:
                continue
            bbox = line["bbox"]
            if bbox[0] > 30 or bbox[0] < 22:
                continue
            if len(txt) < 4 or len(txt) > 55:
                continue
            if any(txt.startswith(s) for s in SKIP_PREFIX):
                continue
            headers.append({"text": txt, "y": bbox[1], "bbox": bbox})
    headers.sort(key=lambda h: h["y"])
    return headers


def get_labels(page, page_no):
    xmin = LABEL_X_MIN[page_no]
    labels = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for line in b["lines"]:
            txt = "".join(s["text"] for s in line["spans"]).strip()
            if not txt or len(txt) < 3:
                continue
            bbox = line["bbox"]
            if bbox[0] < xmin:
                continue
            if any(txt.startswith(s) for s in SKIP_PREFIX):
                continue
            labels.append(
                {
                    "text": txt,
                    "y0": bbox[1],
                    "y1": bbox[3],
                    "y": (bbox[1] + bbox[3]) / 2,
                    "x0": bbox[0],
                    "bbox": bbox,
                }
            )
    labels.sort(key=lambda lb: (lb["x0"], lb["y0"]))
    return labels


def symbol_clip_for_label(label, next_label, page_no, page_w):
    """Crop à gauche du libellé — une ligne = un symbole."""
    y0 = label["y0"] - 3
    if next_label and abs(next_label["x0"] - label["x0"]) < 8:
        y1 = (label["y1"] + next_label["y0"]) / 2
    else:
        y1 = label["y1"] + 8

    if page_no == 10:
        # Colonnes BPK : symbole juste à gauche du texte
        x1 = label["x0"] - 2
        x0 = max(22, x1 - 42)
    else:
        x0, x1 = 22, SYMBOL_X_MAX[page_no]

    return fitz.Rect(x0, y0, x1, y1)


def drawings_in_rect(drawings, clip):
    return [d for d in drawings if d["rect"].intersects(clip)]


def extract():
    doc = fitz.open(str(PDF))
    symbols = []
    used_ids = set()

    for page_no, category in SYMBOL_PAGES.items():
        page = doc[page_no - 1]
        labels = get_labels(page, page_no)
        drawings = page.get_drawings()

        # Grouper par colonne (page 10)
        columns = {}
        for lb in labels:
            col = int(lb["x0"] // 70) if page_no == 10 else 0
            columns.setdefault(col, []).append(lb)

        idx = 0
        for col_labels in columns.values():
            col_labels.sort(key=lambda lb: lb["y0"])
            for i, lb in enumerate(col_labels):
                next_lb = col_labels[i + 1] if i + 1 < len(col_labels) else None
                clip = symbol_clip_for_label(lb, next_lb, page_no, page.rect.width)
                subset = drawings_in_rect(drawings, clip)
                body, vb = drawing_to_body(subset, clip, page)
                if len(body) < 8:
                    continue

                idx += 1
                label = lb["text"]
                sid = slugify(label, page_no, idx)
                while sid in used_ids:
                    sid += "_b"
                used_ids.add(sid)

                symbols.append(
                    {
                        "id": sid,
                        "labelFr": label,
                        "page": page_no,
                        "category": category,
                        "viewBox": vb,
                        "body": body,
                        "ports": {"n": [vb // 2, 2], "s": [vb // 2, vb - 2]},
                        "source": "Hager Normen (NIBT 2020 / electrosuisse)",
                        "iecRef": "IEC 60617",
                    }
                )

    for extra in FIXED_EXTRA:
        page = doc[extra["page"] - 1]
        clip = fitz.Rect(*extra["clip"])
        subset = drawings_in_rect(page.get_drawings(), clip)
        body, vb = drawing_to_body(subset, clip, page)
        if len(body) < 8:
            continue
        sid = extra["id"]
        if sid in used_ids:
            continue
        used_ids.add(sid)
        symbols.append(
            {
                "id": sid,
                "labelFr": extra["labelFr"],
                "page": extra["page"],
                "category": extra["category"],
                "viewBox": vb,
                "body": body,
                "ports": {"n": [vb // 2, 2], "s": [vb // 2, vb - 2]},
                "source": "Hager Normen (NIBT 2020 / electrosuisse)",
                "iecRef": "IEC 60617",
                "fixed": True,
            }
        )

    symbols.sort(key=lambda s: (s["page"], s.get("labelFr", "")))

    payload = {
        "version": 1,
        "updated": "2026-06-07",
        "count": len(symbols),
        "sourcePdf": "pdf/hager-normen.pdf",
        "symbols": symbols,
    }

    OUT_JSON.parent.mkdir(exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    js = (
        "/** Base officielle Hager Normen — extraite de pdf/hager-normen.pdf */\n"
        "(function(g){g.ElectroDzHagerSymbolsOfficial="
        + json.dumps({"version": 1, "count": len(symbols), "symbols": symbols}, ensure_ascii=False)
        + ";})(typeof window!==\"undefined\"?window:globalThis);"
    )
    OUT_JS.write_text(js, encoding="utf-8")

    print(f"Extracted {len(symbols)} symbols")
    print("By category:", dict(Counter(s["category"] for s in symbols)))
    print("Wrote", OUT_JSON)
    print("Wrote", OUT_JS)


if __name__ == "__main__":
    extract()
