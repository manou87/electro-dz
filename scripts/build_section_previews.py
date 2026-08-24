#!/usr/bin/env python3
"""Generate 16:9 section preview thumbnails for Electro DZ home cards."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "section-previews"
TMP_SOURCES = ROOT / "tmp" / "qa_section_thumbnails" / "sources"

BG = (10, 15, 26)
BG2 = (15, 23, 42)
PANEL = (20, 28, 44)
ACCENT = (250, 204, 21)
TEXT = (241, 245, 249)
MUTED = (148, 163, 184)
W, H = 960, 540


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG2)
    return img, ImageDraw.Draw(img)


def header(draw: ImageDraw.ImageDraw, title: str, accent: tuple[int, int, int]) -> None:
    draw.rounded_rectangle((24, 20, W - 24, 64), radius=10, fill=PANEL, outline=accent, width=2)
    draw.text((42, 32), title, fill=TEXT, font=load_font(20, bold=True))


def build_calc() -> Image.Image:
    img, draw = canvas()
    header(draw, "Calculs électriques", ACCENT)
    keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "=", "+"]
    x0, y0, cw, ch, gap = 48, 92, 198, 88, 12
    for i, k in enumerate(keys):
        col, row = i % 4, i // 4
        x, y = x0 + col * (cw + gap), y0 + row * (ch + gap)
        fill = ACCENT if k == "=" else PANEL
        tc = BG if k == "=" else TEXT
        draw.rounded_rectangle((x, y, x + cw, y + ch), radius=12, fill=fill, outline=(255, 255, 255, 40))
        tw = draw.textlength(k, font=load_font(28, bold=True))
        draw.text((x + (cw - tw) / 2, y + 24), k, fill=tc, font=load_font(28, bold=True))
    draw.rounded_rectangle((520, 92, W - 36, 170), radius=12, fill=(12, 18, 30), outline=ACCENT, width=2)
    draw.text((540, 118), "I = P / (U × cos φ)", fill=ACCENT, font=load_font(22, bold=True))
    for i, line in enumerate(["U = 400 V", "P = 12 kW", "cos φ = 0.85", "→ I = 20.4 A"]):
        draw.text((540, 188 + i * 34), line, fill=MUTED if i < 3 else (74, 222, 128), font=load_font(18))
    return img


def build_balance() -> Image.Image:
    img, draw = canvas()
    header(draw, "Bilan de puissance", (52, 211, 153))
    bars = [("Éclairage", 0.35, (250, 204, 21)), ("Prises", 0.55, (96, 165, 250)), ("CVC", 0.72, (74, 222, 128)), ("Moteurs", 0.88, (251, 146, 60))]
    for i, (label, pct, color) in enumerate(bars):
        y = 110 + i * 92
        draw.text((48, y), label, fill=TEXT, font=load_font(18, bold=True))
        draw.rounded_rectangle((48, y + 28, W - 48, y + 56), radius=8, fill=(12, 18, 30))
        bw = int((W - 96) * pct)
        draw.rounded_rectangle((48, y + 28, 48 + bw, y + 56), radius=8, fill=color)
        draw.text((W - 120, y + 2), f"{int(pct * 100)} %", fill=color, font=load_font(16, bold=True))
    draw.rounded_rectangle((48, H - 72, W - 48, H - 28), radius=10, fill=(52, 211, 153, 30), outline=(52, 211, 153))
    draw.text((64, H - 58), "Pd installée : 48 kVA  ·  cos φ moyen : 0.87", fill=(110, 231, 183), font=load_font(17, bold=True))
    return img


def build_curve() -> Image.Image:
    img, draw = canvas()
    header(draw, "Courbes de protection t(I)", (45, 212, 191))
    ox, oy = 90, H - 70
    draw.line([(ox, 80), (ox, oy), (W - 40, oy)], fill=MUTED, width=2)
    draw.text((ox - 30, 70), "I", fill=MUTED, font=load_font(16))
    draw.text((W - 60, oy + 8), "t (s)", fill=MUTED, font=load_font(16))
    pts = []
    for x in range(ox + 10, W - 60):
        t = (x - ox) / (W - ox - 70)
        y = oy - int(280 * math.exp(-3.2 * t) + 20)
        pts.append((x, y))
    draw.line(pts, fill=(45, 212, 191), width=4)
    draw.line([(ox + 80, oy), (ox + 80, oy - 200)], fill=(239, 68, 68), width=2)
    draw.text((ox + 88, oy - 220), "Ik", fill=(239, 68, 68), font=load_font(16, bold=True))
    draw.rounded_rectangle((W - 280, 100, W - 48, 200), radius=10, fill=PANEL, outline=(45, 212, 191))
    draw.text((W - 262, 118), "Courbe C · 16 A", fill=TEXT, font=load_font(17, bold=True))
    draw.text((W - 262, 148), "Zone fusion", fill=(239, 68, 68), font=load_font(15))
    draw.text((W - 262, 172), "Zone magnétique", fill=(45, 212, 191), font=load_font(15))
    return img


def build_cable() -> Image.Image:
    img, draw = canvas()
    header(draw, "Section de câbles", (167, 139, 250))
    cx, cy = 280, 290
    for r, color in [(110, (60, 60, 60)), (88, (167, 139, 250)), (66, (250, 204, 21)), (44, (96, 165, 250))]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color, outline=(255, 255, 255, 30), width=2)
    draw.rounded_rectangle((520, 110, W - 36, H - 40), radius=14, fill=PANEL, outline=(167, 139, 250), width=2)
    rows = [("Courant Ib", "32 A"), ("Longueur L", "28 m"), ("Chute ΔU", "≤ 3 %"), ("Section", "6 mm² Cu")]
    for i, (k, v) in enumerate(rows):
        y = 140 + i * 78
        draw.text((544, y), k, fill=MUTED, font=load_font(16))
        draw.text((544, y + 26), v, fill=ACCENT if k == "Section" else TEXT, font=load_font(24, bold=True))
    return img


def build_oibt_inline() -> Image.Image:
    """Composite from OIBT trainer assets (same as mockup script)."""
    img = Image.new("RGB", (W, H), BG2)
    draw = ImageDraw.Draw(img)
    for x in range(0, W, 48):
        draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 8), width=1)
    for y in range(0, H, 48):
        draw.line([(0, y), (W, y)], fill=(255, 255, 255, 8), width=1)

    fluke = Image.open(ROOT / "oibt-trainer/assets/assets/devices/fluke_1664_fc_front.jpg").convert("RGBA")
    fluke = fluke.resize((430, int(430 * fluke.height / fluke.width)), Image.Resampling.LANCZOS)
    img.paste(fluke, (36, 58), fluke)

    panel = Image.open(ROOT / "oibt-trainer/assets/assets/devices/panel/disjoncteur_c16.png").convert("RGBA")
    panel = panel.resize((120, int(120 * panel.height / panel.width)), Image.Resampling.LANCZOS)
    img.paste(panel, (520, 72), panel)

    panel2 = Image.open(ROOT / "oibt-trainer/assets/assets/devices/panel/idr_40a_2p.png").convert("RGBA")
    panel2 = panel2.resize((120, int(120 * panel2.height / panel2.width)), Image.Resampling.LANCZOS)
    img.paste(panel2, (660, 72), panel2)

    earth = Image.open(ROOT / "oibt-trainer/assets/assets/devices/panel/earth/methode_62pct.png").convert("RGBA")
    earth = earth.resize((760, int(760 * earth.height / earth.width)), Image.Resampling.LANCZOS)
    img.paste(earth, (170, 250), earth)

    draw.rounded_rectangle((36, 18, 250, 52), radius=10, fill=(56, 189, 248, 40), outline=(56, 189, 248), width=2)
    draw.text((52, 24), "Fluke 1664FC", fill=(186, 230, 253), font=load_font(22, bold=True))
    return img


def build_schemas() -> Image.Image:
    img = Image.new("RGB", (W, H), (18, 24, 38))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((24, 24, W - 24, H - 24), radius=14, fill=(12, 18, 30), outline=(74, 222, 128, 120), width=2)
    draw.rectangle((24, 24, W - 24, 68), fill=(22, 30, 46))
    for i, c in enumerate([(239, 68, 68), (250, 204, 21), (34, 197, 94)]):
        draw.ellipse((42 + i * 22, 38, 54 + i * 22, 50), fill=c)
    draw.text((110, 36), "Unifilaire · symboles IEC", fill=MUTED, font=load_font(18, bold=True))
    nodes = [
        (120, 180), (280, 180), (440, 180), (600, 180), (760, 180),
        (760, 320), (600, 320), (440, 320), (280, 320), (120, 320), (120, 180),
    ]
    colors = [ACCENT, (96, 165, 250), (74, 222, 128), (251, 146, 60), ACCENT]
    for i in range(len(nodes) - 1):
        draw.line([nodes[i], nodes[i + 1]], fill=colors[i % len(colors)], width=4)
    comp_font = load_font(16, bold=True)
    for x0, y0, x1, y1, label, color in [
        (250, 150, 350, 210, "Q1", ACCENT),
        (430, 150, 530, 210, "F1", (96, 165, 250)),
        (610, 150, 710, 210, "M1", (74, 222, 128)),
        (610, 290, 710, 350, "PE", ACCENT),
    ]:
        draw.rounded_rectangle((x0, y0, x1, y1), radius=10, fill=(20, 28, 44), outline=color, width=2)
        tw = draw.textlength(label, font=comp_font)
        draw.text((x0 + (x1 - x0 - tw) / 2, y0 + 18), label, fill=color, font=comp_font)
    draw.rounded_rectangle((W - 190, H - 72, W - 48, H - 36), radius=999, fill=ACCENT)
    draw.text((W - 176, H - 64), "Export PDF", fill=BG, font=load_font(16, bold=True))
    return img


def build_cosphi() -> Image.Image:
    img, draw = canvas()
    header(draw, "SwissDZ Cos φ — compensation BT", (227, 6, 19))
    cx, cy, r = 260, 290, 120
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=200, end=340, fill=(227, 6, 19), width=16)
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=340, end=360, fill=MUTED, width=16)
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=0, end=200, fill=MUTED, width=16)
    draw.text((cx - 42, cy - 16), "cos φ", fill=TEXT, font=load_font(22, bold=True))
    draw.text((cx - 28, cy + 14), "0.92", fill=ACCENT, font=load_font(28, bold=True))
    draw.rounded_rectangle((520, 110, W - 36, H - 40), radius=14, fill=PANEL, outline=(227, 6, 19), width=2)
    for i, (k, v) in enumerate([("P active", "45 kW"), ("Q réactive", "18 kvar"), ("C batterie", "120 µF"), ("Objectif", "≥ 0.95")]):
        y = 140 + i * 78
        draw.text((544, y), k, fill=MUTED, font=load_font(16))
        draw.text((544, y + 26), v, fill=TEXT, font=load_font(22, bold=True))
    return img


def build_pdf() -> Image.Image:
    img, draw = canvas()
    header(draw, "Bibliothèque PDF", (248, 113, 113))
    covers_dir = ROOT / "assets" / "covers"
    names = ["coel-chap01-fr.svg", "greme-chap01-fr.svg", "coel-chap05-fr.svg"]
    x = 48
    for name in names:
        path = covers_dir / name
        if path.exists():
            try:
                cover = Image.open(path).convert("RGBA")
                cover = cover.resize((140, int(140 * cover.height / cover.width)), Image.Resampling.LANCZOS)
                img.paste(cover, (x, 100), cover)
            except OSError:
                draw.rounded_rectangle((x, 100, x + 120, 220), radius=8, fill=(239, 68, 68, 80), outline=(248, 113, 113))
        else:
            draw.rounded_rectangle((x, 100, x + 120, 220), radius=8, fill=(239, 68, 68, 80), outline=(248, 113, 113))
        x += 150
    draw.rounded_rectangle((500, 110, W - 36, H - 40), radius=14, fill=PANEL, outline=(248, 113, 113), width=2)
    draw.text((524, 140), "NIBT · NFC 15-100", fill=TEXT, font=load_font(20, bold=True))
    draw.text((524, 180), "Normes suisses & françaises", fill=MUTED, font=load_font(16))
    draw.text((524, 220), "Lecture en ligne · gratuit", fill=(252, 165, 165), font=load_font(17, bold=True))
    draw.rounded_rectangle((524, 280, 720, 320), radius=8, fill=(239, 68, 68, 40), outline=(248, 113, 113))
    draw.text((544, 292), "PDF", fill=(252, 165, 165), font=load_font(18, bold=True))
    return img


def build_quote() -> Image.Image:
    img, draw = canvas()
    header(draw, "Devis chantier", (251, 146, 60))
    draw.rounded_rectangle((48, 100, W - 48, H - 40), radius=14, fill=PANEL, outline=(251, 146, 60), width=2)
    draw.text((72, 130), "Devis N° 2026-0847", fill=TEXT, font=load_font(20, bold=True))
    lines = [("Tableau TGBT triphasé", "4 850 €"), ("Câblage locaux", "2 120 €"), ("Mise en service", "680 €")]
    y = 180
    for label, amount in lines:
        draw.text((72, y), label, fill=MUTED, font=load_font(17))
        tw = draw.textlength(amount, font=load_font(17, bold=True))
        draw.text((W - 72 - tw, y), amount, fill=TEXT, font=load_font(17, bold=True))
        draw.line([(72, y + 28), (W - 72, y + 28)], fill=(255, 255, 255, 25))
        y += 52
    draw.rounded_rectangle((W - 260, H - 100, W - 72, H - 56), radius=10, fill=ACCENT)
    draw.text((W - 242, H - 88), "Total TTC : 7 650 €", fill=BG, font=load_font(17, bold=True))
    return img


def build_training() -> Image.Image:
    img, draw = canvas()
    header(draw, "Formations NFC 15-100", (167, 139, 250))
    draw.rounded_rectangle((48, 100, 420, H - 40), radius=14, fill=PANEL, outline=(167, 139, 250), width=2)
    draw.text((72, 130), "Question 128 / 472", fill=MUTED, font=load_font(16))
    draw.text((72, 162), "Quelle section minimale", fill=TEXT, font=load_font(18, bold=True))
    draw.text((72, 188), "pour un circuit prises 16 A ?", fill=TEXT, font=load_font(18, bold=True))
    for i, opt in enumerate(["A. 1,5 mm²", "B. 2,5 mm²", "C. 4 mm²", "D. 6 mm²"]):
        y = 240 + i * 48
        fill = (74, 222, 128, 40) if i == 1 else (255, 255, 255, 12)
        outline = (74, 222, 128) if i == 1 else (255, 255, 255, 30)
        draw.rounded_rectangle((72, y, 396, y + 36), radius=8, fill=fill, outline=outline)
        draw.text((88, y + 8), opt, fill=TEXT, font=load_font(16))
    draw.rounded_rectangle((460, 140, W - 48, 280), radius=14, fill=(167, 139, 250, 30), outline=(167, 139, 250))
    draw.text((490, 170), "472 questions", fill=ACCENT, font=load_font(28, bold=True))
    draw.text((490, 220), "Quiz interactif · NFC 15-100", fill=TEXT, font=load_font(17))
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    swissdz_src = ROOT / "tmp/qa_wiring_indicator/validated/mockup_SIMULATEUR_FINAL.png"
    if not swissdz_src.exists():
        raise SystemExit(f"Missing SwissDZ source: {swissdz_src}")

    builders: list[tuple[str, Image.Image | None]] = [
        ("calc", build_calc()),
        ("balance", build_balance()),
        ("curve", build_curve()),
        ("cable", build_cable()),
        ("swissdz", Image.open(swissdz_src).convert("RGB")),
        ("oibt", build_oibt_inline()),
        ("cosphi", build_cosphi()),
        ("pdf", build_pdf()),
        ("quote", build_quote()),
        ("schemas", build_schemas()),
        ("training", build_training()),
    ]

    for name, image in builders:
        assert image is not None
        out = image.resize((W, H), Image.Resampling.LANCZOS) if image.size != (W, H) else image
        path = OUT / f"{name}.jpg"
        out.save(path, "JPEG", quality=85, optimize=True)
        print(f"Saved {path}")


if __name__ == "__main__":
    main()
