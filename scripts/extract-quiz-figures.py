#!/usr/bin/env python3
"""
Extrait des figures du PDF NF C 15-100 pour le quiz visuel (captures recadrées).
Usage : python3 scripts/extract-quiz-figures.py
"""
import os
import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")
OUT = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/figures")

# page 1-indexed, clip rect (x0, y0, x1, y1) en points PDF
FIGURES = [
    ("m01-fig-312A-tns.png", 72, (40, 395, 555, 735), "Figure 312A — Schéma TN-S"),
    ("m01-fig-312B-tncs.png", 73, (40, 48, 555, 268), "Figure 312B — Schéma TN-C-S"),
    ("m01-fig-312C-tnc.png", 73, (40, 268, 555, 468), "Figure 312C — Schéma TN-C"),
    ("m01-fig-312D-tt.png", 73, (40, 500, 555, 800), "Figure 312D — Schéma TT"),
    ("m01-fig-312E-it.png", 74, (40, 125, 555, 430), "Figure 312E — Schéma IT"),
]

SCALE = 2.0


def main():
    os.makedirs(OUT, exist_ok=True)
    doc = fitz.open(PDF)
    for fname, page_num, rect, _label in FIGURES:
        page = doc[page_num - 1]
        clip = fitz.Rect(*rect)
        mat = fitz.Matrix(SCALE, SCALE)
        pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
        path = os.path.join(OUT, fname)
        pix.save(path)
        print(f"✓ {fname} ({pix.width}×{pix.height})")
    doc.close()
    print(f"\n{len(FIGURES)} figures → {OUT}")


if __name__ == "__main__":
    main()
