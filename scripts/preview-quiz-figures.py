#!/usr/bin/env python3
"""
Aperçus locaux des figures pour le quiz visuel.
Recadre le DESSIN seul : pas de titre « Figure … », pas de paragraphe explicatif
qui donne la réponse (ex. « schéma TN », « puissance limitée »).
Masques blancs optionnels sur les légendes textuelles à l'intérieur du plan.

Usage : python3 scripts/preview-quiz-figures.py
"""
import io
import os

import fitz
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")
OUT = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/figures-preview")
SCALE = 2.0

# (fichier, page 1-indexée, clip x0,y0,x1,y1, masques page coords optionnels, légende, module)
PREVIEWS = [
    # M05 — plans : schéma coloré sans titres de figure ni légendes textuelles
    ("preview-701C-douches-cabines-deshabilloir.png", 390, (55, 175, 540, 278),
     [(52, 248, 220, 285)], "701C — Douches : cabines + déshabilloir", "M05"),
    ("preview-701D-douches-cabines-sans-deshabilloir.png", 390, (55, 300, 540, 498),
     [(52, 462, 240, 500)], "701D — Douches : cabines sans déshabilloir", "M05"),
    ("preview-701E-douches-sans-cabine.png", 390, (55, 530, 540, 758),
     [(52, 718, 200, 760)], "701E — Douches sans cabine", "M05"),
    ("preview-702A-piscine-pediluve.png", 402, (55, 198, 540, 598),
     [(52, 595, 200, 655)], "702A — Volumes piscine / pédiluve", "M05"),
    ("preview-702B-bassin-au-dessus-sol.png", 403, (55, 248, 540, 720),
     [], "702B — Bassin au-dessus du sol", "M05"),
    ("preview-702C-volumes-cloison-plan.png", 404, (55, 125, 540, 700),
     [], "702C — Volumes (plan) avec cloison", "M05"),
    ("preview-702D-volumes-cloison-plan-2.png", 405, (55, 195, 540, 700),
     [], "702D — Volumes (plan) avec cloison (2)", "M05"),
    ("preview-702E-fontaine.png", 406, (55, 265, 540, 700),
     [], "702E — Volumes d'une fontaine", "M05"),
    # M02 — boucles : dessin seul, hors titre de figure
    ("preview-411A-boucle-tnc-tns.png", 99, (55, 145, 540, 268),
     [], "411A — Boucle de défaut TN-C / TN-S", "M02"),
    ("preview-411B-boucle-tt.png", 101, (55, 98, 540, 268),
     [], "411B — Boucle de défaut TT", "M02"),
    ("preview-411C-boucle-it-isole.png", 102, (55, 618, 540, 758),
     [], "411C — Premier défaut IT (isolé)", "M02"),
    ("preview-411D-boucle-it-neutre-terre.png", 103, (55, 125, 540, 348),
     [], "411D — Premier défaut IT (neutre à la terre)", "M02"),
    ("preview-411E-double-defaut-it.png", 105, (55, 215, 540, 388),
     [], "411E — Double défaut IT", "M02"),
    # M04 — parafoudres : schéma entre les titres de figures
    ("preview-534A-parafoudre-tn.png", 283, (55, 78, 540, 385),
     [], "534A — Parafoudre (schéma seul)", "M04"),
    ("preview-534B-parafoudre-tt.png", 283, (55, 408, 540, 738),
     [], "534B — Parafoudre (schéma seul)", "M04"),
    ("preview-534C-parafoudre-it.png", 284, (55, 78, 540, 438),
     [], "534C — Parafoudre (schéma seul)", "M04"),
    # M06 — branchement : dessin AGCP sans paragraphe ni titre
    ("preview-562A-branchement-puissance-limitee.png", 357, (55, 198, 540, 355),
     [], "562A — Branchement (schéma seul)", "M06"),
    ("preview-562B-branchement-puissance-surveillee.png", 357, (55, 508, 540, 655),
     [], "562B — Branchement (schéma seul)", "M06"),
    ("preview-771A-gtl-parois.png", 480, (55, 95, 540, 575),
     [], "771A — GTL par parois", "M06"),
    ("preview-771B-gtl-goulottes.png", 481, (55, 95, 540, 348),
     [], "771B — GTL goulottes / coffrets", "M06"),
    # M01 — courant continu : dessin sans « Schéma TN… » ni titre figure
    ("preview-312F-tns-courant-continu.png", 76, (88, 188, 518, 448),
     [], "312F — TN-S courant continu (schéma seul)", "M01"),
    ("preview-312G-tnc-courant-continu.png", 77, (88, 188, 518, 448),
     [], "312G — TN-C courant continu (schéma seul)", "M01"),
]


def page_masks_to_pixels(clip, masks, scale):
    rects = []
    for m in masks:
        x0 = (m[0] - clip.x0) * scale
        y0 = (m[1] - clip.y0) * scale
        x1 = (m[2] - clip.x0) * scale
        y1 = (m[3] - clip.y0) * scale
        rects.append((x0, y0, x1, y1))
    return rects


def extract_clip(page, clip, masks):
    mat = fitz.Matrix(SCALE, SCALE)
    pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    if not masks:
        return pix
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    draw = ImageDraw.Draw(img)
    for x0, y0, x1, y1 in page_masks_to_pixels(clip, masks, SCALE):
        draw.rectangle([x0, y0, x1, y1], fill=(255, 255, 255))
    out = io.BytesIO()
    img.save(out, format="PNG")
    return out.getvalue()


def main():
    os.makedirs(OUT, exist_ok=True)
    doc = fitz.open(PDF)
    for row in PREVIEWS:
        fname, page_num, rect = row[0], row[1], row[2]
        masks = row[3] if len(row) > 3 else []
        label = row[4] if len(row) > 4 else ""
        mod = row[5] if len(row) > 5 else ""
        page = doc[page_num - 1]
        clip = fitz.Rect(*rect)
        result = extract_clip(page, clip, masks)
        path = os.path.join(OUT, fname)
        if isinstance(result, bytes):
            with open(path, "wb") as f:
                f.write(result)
        else:
            result.save(path)
        print(f"✓ [{mod}] {fname} — {label}")
    doc.close()
    print(f"\n{len(PREVIEWS)} aperçus (schéma seul) → {OUT}")


if __name__ == "__main__":
    main()
