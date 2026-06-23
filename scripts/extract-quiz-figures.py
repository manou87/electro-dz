#!/usr/bin/env python3
"""
Extrait des figures du PDF NF C 15-100 pour le quiz visuel.
Recadre le schéma seul (sans titre ni légende) et masque tous les textes
(TN-S, TNC, TNS, Figure 312…, Masses, PEN…) pour ne pas donner la réponse.
Usage : python3 scripts/extract-quiz-figures.py
"""
import os
import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")
OUT = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/figures")

# page 1-indexée, clip (x0, y0, x1, y1) — zone du dessin uniquement (sans titres)
FIGURES = [
    ("m01-fig-312A-tns.png", 72, (88, 306, 518, 438)),
    ("m01-fig-312B-tncs.png", 72, (88, 548, 518, 692)),
    ("m01-fig-312C-tnc.png", 73, (88, 128, 518, 225)),
    ("m01-fig-312D-tt.png", 73, (88, 328, 518, 512)),
    ("m01-fig-312E-it.png", 74, (88, 182, 518, 375)),
]

SCALE = 2.0


def redact_text_in_clip(page, clip):
    """Masque tous les mots dans la zone."""
    for w in page.get_text("words", clip=clip):
        r = fitz.Rect(w[0] - 5, w[1] - 3, w[2] + 5, w[3] + 3)
        page.draw_rect(r, color=(1, 1, 1), fill=(1, 1, 1))


def extract_figure(page_num, rect):
    doc = fitz.open(PDF)
    page = doc[page_num - 1]
    clip = fitz.Rect(*rect)
    redact_text_in_clip(page, clip)
    mat = fitz.Matrix(SCALE, SCALE)
    pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    doc.close()
    return pix


def main():
    os.makedirs(OUT, exist_ok=True)
    for fname, page_num, rect in FIGURES:
        pix = extract_figure(page_num, rect)
        path = os.path.join(OUT, fname)
        pix.save(path)
        print(f"✓ {fname} ({pix.width}×{pix.height})")
    print(f"\n{len(FIGURES)} figures (schéma seul, textes masqués) → {OUT}")


if __name__ == "__main__":
    main()
