#!/usr/bin/env python3
"""SwissDz placeholders — no Siemens logo, no shop photos, no EduVolt sprites."""
from pathlib import Path

OUT = Path(__file__).resolve().parent

SLATE = "#334155"
SLATE_DK = "#1e293b"
SLATE_LT = "#64748b"
TEAL = "#0f766e"
TEXT = "#e2e8f0"
MUTED = "#94a3b8"
SCREW = "#cbd5e1"
SCREW_HOLE = "#475569"
SCREEN = "#0b1220"
SCREEN_LINE = "#1e3a4c"
ACCENT = "#14b8a6"


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def row(ids, ny, direction, pad=0.10):
    n = len(ids)
    if n <= 0:
        return []
    if n == 1:
        xs = [0.5]
    else:
        xs = [pad + i * (1 - 2 * pad) / (n - 1) for i in range(n)]
    return [{"id": i, "nx": round(x, 4), "ny": ny, "direction": direction} for i, x in zip(ids, xs)]


def screw_svg(cx, cy, label, r=4.2):
    ly = cy - r - 3.2 if cy < 40 else cy + r + 8
    return (
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{SCREW}" stroke="{SLATE_DK}" stroke-width="0.8"/>'
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.38}" fill="{SCREW_HOLE}"/>'
        f'<text x="{cx:.1f}" y="{ly:.1f}" text-anchor="middle" font-size="6.2" font-weight="700" '
        f'font-family="system-ui,sans-serif" fill="{MUTED}">{esc(label)}</text>'
    )


def din_body(w, h, title, subtitle, kind):
    """Generic DIN brick — SwissDz, not a fake Siemens photo."""
    clip = 10
    return f'''
  <rect width="{w}" height="{h}" rx="5" fill="{SLATE}"/>
  <rect x="3" y="3" width="{w - 6}" height="{h - 6}" rx="3.5" fill="{SLATE_DK}" stroke="#475569" stroke-width="0.8"/>
  <rect x="8" y="{h / 2 - 22}" width="{w - 16}" height="44" rx="3" fill="{SLATE}" stroke="#475569" stroke-width="0.6"/>
  <text x="{w / 2}" y="{h / 2 - 6}" text-anchor="middle" font-size="8.5" font-weight="800"
        font-family="system-ui,sans-serif" fill="{TEXT}">{esc(title)}</text>
  <text x="{w / 2}" y="{h / 2 + 7}" text-anchor="middle" font-size="6.4" font-weight="650"
        font-family="system-ui,sans-serif" fill="{ACCENT}">{esc(subtitle)}</text>
  <text x="{w / 2}" y="{h / 2 + 18}" text-anchor="middle" font-size="5.4" font-weight="600"
        font-family="system-ui,sans-serif" fill="{SLATE_LT}">SwissDz · {esc(kind)}</text>
  <rect x="{(w - clip) / 2}" y="{h - 7}" width="{clip}" height="5" rx="1" fill="#94a3b8" opacity=".45"/>
'''


def panel_body(w, h, title, subtitle):
    sw, sh = w * 0.84, h * 0.58
    sx, sy = (w - sw) / 2, h * 0.14
    return f'''
  <rect width="{w}" height="{h}" rx="7" fill="#1e293b"/>
  <rect x="4" y="4" width="{w - 8}" height="{h - 8}" rx="5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
  <rect x="{sx:.1f}" y="{sy:.1f}" width="{sw:.1f}" height="{sh:.1f}" rx="3" fill="{SCREEN}" stroke="{SCREEN_LINE}" stroke-width="1.2"/>
  <rect x="{sx + 6:.1f}" y="{sy + 8:.1f}" width="{sw - 12:.1f}" height="7" rx="1.5" fill="#134e4a" opacity=".7"/>
  <text x="{w / 2}" y="{sy + sh / 2:.1f}" text-anchor="middle" font-size="9" font-weight="800"
        font-family="system-ui,sans-serif" fill="{MUTED}">{esc(title)}</text>
  <text x="{w / 2}" y="{sy + sh / 2 + 13:.1f}" text-anchor="middle" font-size="6.2" font-weight="650"
        font-family="system-ui,sans-serif" fill="{ACCENT}">{esc(subtitle)}</text>
  <text x="{w / 2}" y="{h - 18}" text-anchor="middle" font-size="6" font-weight="700"
        font-family="system-ui,sans-serif" fill="{SLATE_LT}">SwissDz · placeholder</text>
'''


def wrap(w, h, inner):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n'
        f"  <!-- SwissDz original placeholder: no Siemens wordmark, no third-party photo. -->\n"
        f"{inner}\n</svg>\n"
    )


def screws_for(w, h, terms):
    parts = []
    for t in terms:
        parts.append(screw_svg(t["nx"] * w, t["ny"] * h, t["id"]))
    return "\n".join(parts)


KIT = {}

# LOGO! Power 24 V
w, h = 72, 170
terms = row(["L", "N", "PE"], 0.075, "top", 0.18) + row(["L+", "L+2", "M", "M2"], 0.925, "bottom", 0.14)
KIT["logo-power"] = (w, h, wrap(w, h, din_body(w, h, "LOGO! Power", "24 V DC", "placeholder") + screws_for(w, h, terms)), terms)

# LOGO! DM8 24R
w, h = 100, 170
terms = row(["L+", "M", "I9", "I10", "I11", "I12"], 0.07, "top", 0.08) + row(
    ["Q5.1", "Q5.2", "Q6.1", "Q6.2", "Q7.1", "Q7.2", "Q8.1", "Q8.2"], 0.93, "bottom", 0.07
)
KIT["logo-dm8-24r"] = (w, h, wrap(w, h, din_body(w, h, "LOGO! DM8", "24R TOR", "placeholder") + screws_for(w, h, terms)), terms)

# LOGO! AM2
w, h = 64, 170
terms = row(["L+", "M"], 0.075, "top", 0.22) + row(["AI1", "AGND", "AI2"], 0.925, "bottom", 0.16)
KIT["logo-am2"] = (w, h, wrap(w, h, din_body(w, h, "LOGO! AM2", "analogique", "placeholder") + screws_for(w, h, terms)), terms)

# LOGO! TDE
w, h = 168, 100
terms = row(["L+", "M"], 0.92, "bottom", 0.28)
KIT["logo-tde"] = (w, h, wrap(w, h, panel_body(w, h, "LOGO! TDE", "afficheur") + screws_for(w, h, terms)), terms)

# S7-1200 1212C
w, h = 156, 188
terms = (
    row(["L+", "M", "1M"], 0.048, "top", 0.12)
    + row(["I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8"], 0.135, "top", 0.07)
    + row(["1L+", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6"], 0.865, "bottom", 0.07)
    + row(["AI1", "AI2", "AGND"], 0.955, "bottom", 0.18)
)
KIT["s7-1212c"] = (w, h, wrap(w, h, din_body(w, h, "S7-1200", "CPU 1212C", "placeholder") + screws_for(w, h, terms)), terms)

# HMI KTP400 Basic
w, h = 200, 148
terms = row(["L+", "M", "PE"], 0.93, "bottom", 0.18)
KIT["hmi-ktp400"] = (w, h, wrap(w, h, panel_body(w, h, "KTP400 Basic", "HMI 4\"") + screws_for(w, h, terms)), terms)

js_bits = []
for key, (w, h, svg, terms) in KIT.items():
    path = OUT / f"{key}.svg"
    path.write_text(svg, encoding="utf-8")
    print(f"wrote {path.name}  {w}x{h}  {len(terms)} terms")
    arr = ",".join(
        '{id:"%s",nx:%s,ny:%s,direction:"%s"}' % (t["id"], t["nx"], t["ny"], t["direction"]) for t in terms
    )
    js_bits.append(f"  {key}: w:{w} h:{h}\n    terminals:[{arr}]")

print("\n--- JS terminals ---\n")
print("\n".join(js_bits))
