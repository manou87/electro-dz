#!/usr/bin/env python3
"""Extrait glyphes Hager en PNG — coordonnées mesurées dans pdf/hager-normen.pdf."""
import base64
import json
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "pdf/hager-normen.pdf"
OUT_DIR = ROOT / "data/hager-glyphs"
OUT_JS = ROOT / "js/hager-glyphs-b64.js"
SIZE = 48

# page, x0, y0, x1, y1 — boîtes mesurées sur le PDF Hager (colonne symbole seule)
FIXED = {
    "ac_source": (5, 24, 64, 44, 78),
    "ac_source_tri": (5, 28, 86, 62, 106),
    "energy_meter": (7, 48, 232, 58, 252),
    "circuit_breaker": (6, 30, 340, 56, 358),
    "rcd": (10, 236, 246, 262, 262),
    "fuse": (6, 30, 424, 56, 442),
    "isolator": (6, 32, 372, 58, 392),
    "motor": (7, 26, 50, 54, 74),
    "lamp": (7, 24, 264, 40, 282),
    "socket": (6, 36, 264, 62, 282),
    "heating": (6, 180, 292, 212, 310),
    "resistor_load": (6, 180, 172, 212, 190),
    "transformer": (6, 180, 316, 212, 336),
    "surge_protector": (6, 180, 120, 212, 138),
    "contactor": (6, 30, 136, 56, 154),
    "battery": (6, 180, 350, 212, 370),
    "appliance": (10, 236, 318, 262, 336),
    "pv_array": (6, 180, 316, 212, 336),
}


def render_clip(page, clip):
    w, h = max(clip.width, 1), max(clip.height, 1)
    scale = min(SIZE / w, SIZE / h) * 0.88
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip, alpha=False)
    return pix.tobytes("png")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(PDF))
    result = {}
    for sym_id, (pg, x0, y0, x1, y1) in FIXED.items():
        clip = fitz.Rect(x0, y0, x1, y1)
        png = render_clip(doc[pg - 1], clip)
        (OUT_DIR / f"{sym_id}.png").write_bytes(png)
        result[sym_id] = base64.standard_b64encode(png).decode("ascii")
        print("OK", sym_id, clip)
    OUT_JS.write_text(
        "/** Glyphes Hager — rendu direct PDF hager-normen.pdf */\n"
        "(function(g){g.ElectroDzHagerGlyphsB64="
        + json.dumps(result)
        + ";})(typeof window!=='undefined'?window:globalThis);",
        encoding="utf-8",
    )
    print("Wrote", OUT_JS)


if __name__ == "__main__":
    main()
