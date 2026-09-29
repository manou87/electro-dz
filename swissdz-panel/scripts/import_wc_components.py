#!/usr/bin/env python3
"""
Import ElectroDZ .wc component packs into SwissDZ Panel.

Each .wc is a ZIP containing component.json + preview/on/off images.
Extracts PNG previews into assets/electrodz/ and regenerates
assets/electrodz/lib-entries.js (object entries for LIB in index.html).

Maps ElectroDZ simulation metadata so SwissDZ Panel gets the same
ON/OFF pedagogy as the Flutter ElectroDZ app (localhost:8080):
  - protection / switch → pair + image/imageOff + toggle closed
  - pushbutton → push (+ nc if only NC contacts)
  - coil → contact pairs only (NO); bobine A1/A2 handled by panel

Usage:
  python3 scripts/import_wc_components.py \\
    --src /path/to/electro_dz_rebuild/assets/components \\
    --panel-root . --patch-html
"""

from __future__ import annotations

import argparse
import io
import json
import re
import zipfile
from pathlib import Path

from PIL import Image

# Panel DIN modules are typically ~83×172 px for ~36×85 mm → ~2 px/mm.
MM_TO_PX = 2.0
LONG_SIDE_MIN = 120
LONG_SIDE_MAX = 170
LONG_SIDE_FALLBACK = 150
ID_PREFIX = "edz_"

MARKER_BEGIN = "/* === ELECTRODZ_LIB_BEGIN (generated — do not edit by hand) === */"
MARKER_END = "/* === ELECTRODZ_LIB_END === */"
CAT_MARKER_BEGIN = "/* === ELECTRODZ_CAT_BEGIN === */"
CAT_MARKER_END = "/* === ELECTRODZ_CAT_END === */"

# WC category (EN) → SwissDZ panel category (preserve existing taxonomy).
CAT_MAP = {
    "Structure": "Structure",
    "Power": "Alimentation",
    "Protection": "Protection",
    "Mcb": "Protection",
    "Miniature Circuit Breaker": "Protection",
    "1P+N Miniature Circuit Breaker": "Protection",
    "DC Miniature Circuit Breaker": "Protection",
    "High-Current Modular Breaker": "Protection",
    "4-Pole Circuit Breaker": "Protection",
    "Mccb": "Protection",
    "MCCB": "Protection",
    "Moulded Case Circuit Breaker": "Protection",
    "4-Pole Moulded Case Circuit Breaker": "Protection",
    "Switch Disconnector": "Protection",
    "Transfer Switch": "Protection",
    "Voltage and Phase Relay": "Protection",
    "Phase Sequence and Failure Relay": "Protection",
    "Single-phase Voltage Monitoring Relay": "Protection",
    "Phase Sequence Relay": "Protection",
    "Phase Protection Relay": "Protection",
    "Voltage Monitoring Relay": "Protection",
    "Single-Phase Voltage Relay": "Protection",
    "Three-Phase Voltage Relay": "Protection",
    "Digital Phase Failure Relay": "Protection",
    "Rccb Rcbo": "Différentiel",
    "Control": "Commande",
    "Auxiliary Contact": "Commande",
    "Timers": "Commande",
    "Timer": "Commande",
    "Electronic On-delay Timer": "Commande",
    "DPDT On-Delay Timer": "Commande",
    "Timer Relay": "Commande",
    "On/Off-Delay Timer": "Commande",
    "On-Delay Timer": "Commande",
    "Interface Relay": "Commande",
    "Relay": "Commande",
    "3-Changeover Plug-In Relay": "Commande",
    "4-Changeover Plug-In Relay": "Commande",
    "Control Relays": "Commande",
    "Buzzer": "Boutonnerie",
    "Pilot Lamp": "Boutonnerie",
    "Signaling": "Boutonnerie",
    "Selector": "Boutonnerie",
    "Smart Selector": "Boutonnerie",
    "Cam Selector Switch": "Boutonnerie",
    "Emergency Stop": "Boutonnerie",
    "Push Button": "Boutonnerie",
    "Safety": "Boutonnerie",
    "AC Contactor": "Moteur / Indus",
    "Contactor": "Moteur / Indus",
    "Contactors": "Moteur / Indus",
    "4-Pole Contactor": "Moteur / Indus",
    "Motor Protection Breaker": "Moteur / Indus",
    "Motor Protection Circuit Breaker": "Moteur / Indus",
    "Overload Relay": "Moteur / Indus",
    "Motors": "Moteur / Indus",
    "PLC": "Moteur / Indus",
    "Actuators": "Moteur / Indus",
    "Generic items": "Moteur / Indus",
    "Drives": "Variateurs",
    "Screen Meter": "Mesure",
    "Meters & Instruments": "Mesure",
    "Analog Frequency Meter": "Mesure",
    "Analog Voltmeter": "Mesure",
    "Three-Phase Digital Multimeter": "Mesure",
    "Temperature Sensors": "Capteurs",
    "Pressure Transmitters": "Capteurs",
    "Photoelectric Switch": "Capteurs",
    "Distribution": "Borniers / Alim",
    "Barrier Terminal Block": "Borniers / Alim",
    "Power Distribution Block": "Borniers / Alim",
    "Passive Components": "Borniers / Alim",
}

# Per-id overrides (WC "Power" was too broad for terminals / motor gear).
CAT_ID_OVERRIDES = {
    "edz_borne": "Borniers / Alim",
    "edz_borne_2": "Borniers / Alim",
    "edz_borne_3": "Borniers / Alim",
    "edz_borne_l": "Borniers / Alim",
    "edz_borne_l1": "Borniers / Alim",
    "edz_borne_l2": "Borniers / Alim",
    "edz_borne_l3": "Borniers / Alim",
    "edz_borne_n": "Borniers / Alim",
    "edz_borne_pe": "Borniers / Alim",
    "edz_bornes_l_n": "Borniers / Alim",
    "edz_bornes_l1_l2_l3_n": "Borniers / Alim",
    "edz_bornes_l1_l2_l3": "Borniers / Alim",
    "edz_contactor_0911": "Moteur / Indus",
    "edz_guardamotor_24_32_a": "Moteur / Indus",
    "edz_relé_térmico_23_32_a": "Moteur / Indus",
}

# Behaviors that conduct when device is ON / closed / energized (NO path).
NO_BEHAVIORS = {
    "contact_no",
    "contact_no_safety",
    "contact_no_safety_dc",
    "plc_relay_output",
}
NC_BEHAVIORS = {
    "contact_nc",
    "contact_nc_safety",
}
# Power poles that follow closed (breaker ON, thermal healthy).
POWER_FOLLOW_CLOSED = {
    "overload_relay",
}
POWER_FOLLOW_PREFIXES = ("protection_",)

# Always-on bridges (A2A↔A2B, etc.)
BRIDGE_BEHAVIORS = {"junction"}

# Inactive default states → startOpen (closed=false), aligned with ElectroDZ
INACTIVE_DEFAULTS = {
    "off",
    "stop",
    "deenergized",
    "fault",
    "phase_fault",
    "trip",
    "tripped",
}


def map_category(cat_src: str, badge: str | None, key: str | None = None) -> str:
    if key and key in CAT_ID_OVERRIDES:
        return CAT_ID_OVERRIDES[key]
    if cat_src in CAT_MAP:
        return CAT_MAP[cat_src]
    # Fuzzy fallbacks from badge / category keywords
    blob = f"{cat_src} {badge or ''}".lower()
    if any(k in blob for k in ("mcb", "mccb", "breaker", "disconnector", "protection", "phase")):
        return "Protection"
    if any(k in blob for k in ("rccb", "rcbo", "diff")):
        return "Différentiel"
    if any(k in blob for k in ("contactor", "motor", "plc", "overload", "thermal")):
        return "Moteur / Indus"
    if any(k in blob for k in ("lamp", "buzzer", "button", "selector", "push", "emergency", "signal")):
        return "Boutonnerie"
    if any(k in blob for k in ("timer", "relay", "aux", "control")):
        return "Commande"
    if any(k in blob for k in ("meter", "volt", "amp", "freq")):
        return "Mesure"
    if any(k in blob for k in ("sensor", "temp", "pressure", "photo")):
        return "Capteurs"
    if any(k in blob for k in ("terminal", "distribution", "busbar", "passive")):
        return "Borniers / Alim"
    if "drive" in blob or "vfd" in blob:
        return "Variateurs"
    if "structure" in blob or "rail" in blob or "din" in blob:
        return "Structure"
    if "power" in blob or "supply" in blob or "source" in blob:
        return "Alimentation"
    return "Commande"


def safe_filename(stem: str) -> str:
    s = stem
    for _ in range(3):
        try:
            from urllib.parse import unquote

            n = unquote(s)
            if n == s:
                break
            s = n
        except Exception:
            break
    s = s.strip().lower()
    s = s.replace("%20", " ").replace("%2520", " ")
    s = re.sub(r"[^\w]+", "_", s, flags=re.UNICODE)
    s = s.replace("-", "_")
    s = re.sub(r"_+", "_", s).strip("_")
    if s and s[0].isdigit():
        s = "c_" + s
    return s[:80] or "component"


def localize(val, fallback: str = "") -> str:
    if isinstance(val, dict):
        for k in ("fr", "en", "ar"):
            if val.get(k):
                return str(val[k])
        if val:
            return str(next(iter(val.values())))
        return fallback
    if val is None:
        return fallback
    return str(val)


def behavior_is_no(beh: str) -> bool:
    b = (beh or "").strip()
    return b in NO_BEHAVIORS


def behavior_is_nc(beh: str) -> bool:
    b = (beh or "").strip()
    return b in NC_BEHAVIORS


def behavior_power_closed(beh: str) -> bool:
    b = (beh or "").strip()
    if b in POWER_FOLLOW_CLOSED:
        return True
    return any(b.startswith(p) for p in POWER_FOLLOW_PREFIXES)


def to_png_bytes(raw: bytes, max_long: int = 400) -> bytes:
    img = Image.open(io.BytesIO(raw))
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")
    w, h = img.size
    long_side = max(w, h)
    if long_side > max_long:
        s = max_long / long_side
        img = img.resize((max(1, int(round(w * s))), max(1, int(round(h * s)))), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="PNG", optimize=False)
    return out.getvalue()


def scale_wh(physical: dict, graphics: dict) -> tuple[int, int]:
    phys = physical or {}
    w_mm = phys.get("widthMm")
    h_mm = phys.get("heightMm")
    if isinstance(w_mm, (int, float)) and isinstance(h_mm, (int, float)) and w_mm > 0 and h_mm > 0:
        w = max(24, int(round(float(w_mm) * MM_TO_PX)))
        h = max(24, int(round(float(h_mm) * MM_TO_PX)))
        long_side = max(w, h)
        if long_side > 280:
            s = 280 / long_side
            w = max(24, int(round(w * s)))
            h = max(24, int(round(h * s)))
        return w, h

    size = (graphics or {}).get("size") or {}
    gw = size.get("width")
    gh = size.get("height")
    if isinstance(gw, (int, float)) and isinstance(gh, (int, float)) and gw > 0 and gh > 0:
        gw, gh = float(gw), float(gh)
        long_side = max(gw, gh)
        target = LONG_SIDE_FALLBACK
        if gh >= gw:
            target = LONG_SIDE_MAX
        s = target / long_side
        w = max(24, int(round(gw * s)))
        h = max(24, int(round(gh * s)))
        long2 = max(w, h)
        if long2 < LONG_SIDE_MIN:
            s2 = LONG_SIDE_MIN / long2
            w = max(24, int(round(w * s2)))
            h = max(24, int(round(h * s2)))
        elif long2 > 400:
            s2 = 400 / long2
            w = max(24, int(round(w * s2)))
            h = max(24, int(round(h * s2)))
        return w, h

    return 80, 160


def convert_terminals(raw_terms: list) -> list:
    out = []
    for t in raw_terms or []:
        if not isinstance(t, dict):
            continue
        tid = str(t.get("id") or t.get("label") or "").strip()
        if not tid:
            continue
        try:
            nx = float(t.get("nx", 0.5))
            ny = float(t.get("ny", 0.5))
        except (TypeError, ValueError):
            nx, ny = 0.5, 0.5
        direction = str(t.get("direction") or "bottom").lower()
        if direction not in ("top", "bottom", "left", "right"):
            direction = "bottom"
        out.append({"id": tid, "nx": round(nx, 4), "ny": round(ny, 4), "direction": direction})
    return out


def convert_switchable_pairs(sim: dict) -> tuple[list | None, list | None, list | None, bool, bool]:
    """Return (pairs_on, pairs_off, bridges, nc_only, passthrough).

    pairs_on  → conduct when device closed / energized / pressed (NO + power poles)
    pairs_off → conduct when device open / de-energized / released (NC)
    bridges   → always conduct (junction)
    passthrough=True → all pairs are bridges (bornier), not an ON/OFF device.

    Thermal/overload: NC trip contacts follow closed (healthy); NO trip follow !closed.
    Contactor/coil/push: standard NO/NC vs actuated.
    """
    pairs_on: list = []
    pairs_off: list = []
    bridges: list = []
    saw_beh = False
    has_overload = False
    raw_pairs = (sim or {}).get("terminalPairs") or []
    for p in raw_pairs:
        if isinstance(p, dict) and str(p.get("simBehavior") or "") == "overload_relay":
            has_overload = True
            break

    for p in raw_pairs:
        if not isinstance(p, dict):
            continue
        beh = str(p.get("simBehavior") or "")
        terms = p.get("terminals") or []
        if len(terms) < 2:
            continue
        saw_beh = True
        a, b = str(terms[0]), str(terms[1])
        if beh in BRIDGE_BEHAVIORS or beh.startswith("source_"):
            bridges.append([a, b])
            continue
        if beh == "coil":
            continue  # bobine A1/A2 gérée par hasCoil()
        if behavior_power_closed(beh):
            pairs_on.append([a, b])
        elif behavior_is_nc(beh):
            if has_overload:
                # NC thermique : conduit à l’état sain (closed)
                pairs_on.append([a, b])
            else:
                pairs_off.append([a, b])
        elif behavior_is_no(beh):
            if has_overload:
                # NO thermique : conduit au déclenchement (!closed)
                pairs_off.append([a, b])
            else:
                pairs_on.append([a, b])
        # autres comportements (meter, load_lamp, motor…) : pas de paire contact

    if pairs_on or pairs_off:
        nc_only = bool(pairs_off) and not pairs_on
        return (
            pairs_on or None,
            pairs_off or None,
            bridges or None,
            nc_only,
            False,
        )
    if bridges and not saw_beh:
        return None, None, bridges, False, True
    if bridges and not pairs_on and not pairs_off:
        # Uniquement des junctions / sources → bornier
        return bridges, None, None, False, True
    if saw_beh:
        return None, None, bridges or None, False, False
    # Fallback legacy : paires brutes sans behavior
    pairs = []
    for p in raw_pairs:
        if isinstance(p, dict):
            terms = p.get("terminals") or []
            if len(terms) >= 2:
                pairs.append([str(terms[0]), str(terms[1])])
        elif isinstance(p, (list, tuple)) and len(p) >= 2:
            pairs.append([str(p[0]), str(p[1])])
    return (pairs or None), None, None, False, False


def resolve_state_image(z: zipfile.ZipFile, sim: dict, graphics: dict, keys: list[str]) -> tuple[str | None, bytes | None]:
    """Pick image bytes for a logical state (on/off/energized/…)."""
    states = (sim or {}).get("states") or {}
    for k in keys:
        st = states.get(k)
        if isinstance(st, dict) and st.get("image") and st["image"] in z.namelist():
            try:
                return st["image"], z.read(st["image"])
            except Exception:
                pass
        if isinstance(st, str) and st in z.namelist():
            try:
                return st, z.read(st)
            except Exception:
                pass
    for gkey in keys:
        name = (graphics or {}).get(gkey)
        if name and name in z.namelist():
            try:
                return name, z.read(name)
            except Exception:
                pass
    # Filename heuristics
    for name in z.namelist():
        low = name.lower()
        if not low.endswith((".png", ".webp", ".jpg", ".jpeg")):
            continue
        base = Path(low).stem
        if base in keys or any(base == k or base.startswith(k + ".") for k in keys):
            try:
                return name, z.read(name)
            except Exception:
                continue
    return None, None


def pick_on_off_images(z: zipfile.ZipFile, sim: dict, graphics: dict) -> tuple[bytes | None, bytes | None, str, str]:
    """Return (on_png_raw, off_png_raw, on_src_name, off_src_name)."""
    on_name, on_raw = resolve_state_image(
        z, sim, graphics, ["on", "energized", "run", "normal", "closed"]
    )
    off_name, off_raw = resolve_state_image(
        z, sim, graphics, ["off", "deenergized", "stop", "open", "tripped", "trip", "fault"]
    )
    # Fallback ON: preview / original / first image
    if not on_raw:
        for key in ("preview", "original", "on"):
            name = (graphics or {}).get(key)
            if name and name in z.namelist():
                try:
                    on_name, on_raw = name, z.read(name)
                    break
                except Exception:
                    pass
    if not on_raw:
        for name in z.namelist():
            if name.lower().endswith((".png", ".webp", ".jpg", ".jpeg")):
                try:
                    on_name, on_raw = name, z.read(name)
                    break
                except Exception:
                    continue
    return on_raw, off_raw, on_name or "", off_name or ""


def js_escape(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", " ")
        .replace("\r", "")
    )


def entry_to_js(key: str, entry: dict) -> str:
    parts = [
        f'name:"{js_escape(entry["name"])}"',
        f'prefix:"{js_escape(entry["prefix"])}"',
        f'cat:"{js_escape(entry["cat"])}"',
        f'w:{entry["w"]}',
        f'h:{entry["h"]}',
        f'image:"{js_escape(entry["image"])}"',
    ]
    if entry.get("imageOff"):
        parts.append(f'imageOff:"{js_escape(entry["imageOff"])}"')
    if entry.get("badge"):
        parts.append(f'badge:"{js_escape(entry["badge"])}"')
    if entry.get("din"):
        parts.append("din:true")
    if entry.get("push"):
        parts.append("push:true")
    if entry.get("nc"):
        parts.append("nc:true")
    if entry.get("selector"):
        parts.append("selector:true")
    if entry.get("lamp"):
        parts.append("lamp:true")
    if entry.get("buzzer"):
        parts.append("buzzer:true")
    if entry.get("startOpen"):
        parts.append("startOpen:true")
    if entry.get("passthrough"):
        parts.append("passthrough:true")
    terms = entry.get("terminals") or []
    term_js = ",".join(
        f'{{id:"{js_escape(t["id"])}",nx:{t["nx"]},ny:{t["ny"]},direction:"{t["direction"]}"}}'
        for t in terms
    )
    parts.append(f"terminals:[{term_js}]")

    def pairs_js(plist: list) -> str:
        return ",".join(f'["{js_escape(a)}","{js_escape(b)}"]' for a, b in plist)

    if entry.get("pairs"):
        parts.append(f"pairs:[{pairs_js(entry['pairs'])}]")
        a, b = entry["pairs"][0]
        parts.append(f'pair:["{js_escape(a)}","{js_escape(b)}"]')
    if entry.get("pairsNc"):
        parts.append(f"pairsNc:[{pairs_js(entry['pairsNc'])}]")
    if entry.get("bridges"):
        parts.append(f"bridges:[{pairs_js(entry['bridges'])}]")
    return f"      {key}: {{{','.join(parts)}}},"


def import_all(src_dir: Path, out_assets: Path, skip_names: set[str]) -> tuple[list[dict], list[str]]:
    out_assets.mkdir(parents=True, exist_ok=True)
    entries = []
    skipped = []
    used_keys = set()
    used_files = set()

    for wc_path in sorted(src_dir.glob("*.wc")):
        raw_name = wc_path.name
        decoded = raw_name
        try:
            from urllib.parse import unquote

            decoded = unquote(raw_name)
        except Exception:
            pass

        if wc_path.stat().st_size < 64:
            skipped.append(f"{decoded} (vide/corrompu)")
            continue
        if any(s.lower() in decoded.lower() for s in skip_names):
            skipped.append(f"{decoded} (ignoré)")
            continue

        try:
            with zipfile.ZipFile(wc_path) as z:
                if "component.json" not in z.namelist():
                    skipped.append(f"{decoded} (pas de component.json)")
                    continue
                data = json.loads(z.read("component.json"))
                graphics = data.get("graphics") or {}
                sim = data.get("simulation") or {}
                on_raw, off_raw, _on_src, _off_src = pick_on_off_images(z, sim, graphics)
                if not on_raw:
                    skipped.append(f"{decoded} (pas d'image)")
                    continue
                png_on = to_png_bytes(on_raw)
                png_off = to_png_bytes(off_raw) if off_raw else None
                # Avoid writing identical on/off
                if png_off and png_off == png_on:
                    png_off = None
        except Exception as e:
            skipped.append(f"{decoded} ({e})")
            continue

        cid = str(data.get("id") or Path(decoded).stem)
        key_base = ID_PREFIX + safe_filename(cid)
        key = key_base
        n = 2
        while key in used_keys:
            key = f"{key_base}_{n}"
            n += 1
        used_keys.add(key)

        file_base = safe_filename(cid)
        fname = f"{file_base}.png"
        n = 2
        while fname in used_files:
            fname = f"{file_base}_{n}.png"
            n += 1
        used_files.add(fname)

        (out_assets / fname).write_bytes(png_on)

        image_off_rel = None
        if png_off:
            fname_off = f"{file_base}_off.png"
            n = 2
            while fname_off in used_files:
                fname_off = f"{file_base}_off_{n}.png"
                n += 1
            used_files.add(fname_off)
            (out_assets / fname_off).write_bytes(png_off)
            image_off_rel = f"assets/electrodz/{fname_off}"

        name = localize(data.get("name"), cid)
        prefix = str(data.get("tagPrefix") or "X")[:4] or "X"
        cat_src = localize(data.get("category"), "")
        manufacturer = localize(data.get("manufacturer"), "")
        badge = (cat_src or manufacturer or "")[:24] or None
        cat = map_category(cat_src, badge, key)

        w, h = scale_wh(data.get("physical") or {}, graphics)
        terminals = convert_terminals(data.get("terminals") or [])
        pairs_on, pairs_off, bridges, nc_only, passthrough = convert_switchable_pairs(sim)
        din = bool((data.get("docking") or {}).get("mountable"))

        rule = str(sim.get("activationRule") or "").lower()
        push = rule == "pushbutton"
        selector = rule == "selector"
        # Lampes / buzzers / voyants : alim L/N → lit
        lamp = rule == "load" or cat_src in ("Pilot Lamp", "Buzzer", "Signaling")
        buzzer = cat_src == "Buzzer" or "buzzer" in (cid or "").lower() or "siren" in (cid or "").lower()
        if buzzer:
            lamp = True

        # Coil / protection / push / switch : pas un bornier même s'il y a des bridges
        if rule in (
            "coil",
            "protection",
            "switch",
            "pushbutton",
            "selector",
            "load",
            "motor",
            "phase_relay",
            "docked",
            "vfd",
            "ats",
            "plc",
        ):
            passthrough = False

        # NC-only → pairs + nc:true (modèle SwissDz legacy)
        # Mixte → pairs (NO/on) + pairsNc (NC/off)
        # NO-only → pairs
        pairs = None
        pairs_nc = None
        nc = False
        if nc_only and pairs_off:
            pairs = pairs_off
            nc = True
        elif pairs_on and pairs_off:
            pairs = pairs_on
            pairs_nc = pairs_off
            nc = False
        elif pairs_on:
            pairs = pairs_on
        elif pairs_off:
            pairs = pairs_off
            nc = True

        if passthrough:
            image_off_rel = None
            if bridges and not pairs:
                pairs = bridges
                bridges = None

        start_open = False
        # Thermique / overload : sain par défaut (closed=true), pas startOpen
        has_overload = any(
            isinstance(p, dict) and str(p.get("simBehavior") or "") == "overload_relay"
            for p in (sim.get("terminalPairs") or [])
        )
        if not passthrough and not has_overload and rule in (
            "protection",
            "switch",
            "coil",
            "docked",
            "phase_relay",
        ):
            start_open = True
        elif not passthrough and rule == "selector":
            start_open = False
        elif not passthrough and rule == "pushbutton":
            start_open = False

        # defaultState off/tripped → startOpen (sauf thermique)
        default_state = str(sim.get("defaultState") or "").lower()
        if (
            default_state in INACTIVE_DEFAULTS
            and not push
            and not passthrough
            and not has_overload
        ):
            start_open = True

        entry = {
            "key": key,
            "name": name,
            "prefix": prefix,
            "cat": cat,
            "w": w,
            "h": h,
            "image": f"assets/electrodz/{fname}",
            "imageOff": image_off_rel,
            "badge": badge,
            "din": din,
            "terminals": terminals,
            "pairs": pairs,
            "pairsNc": pairs_nc,
            "bridges": bridges,
            "push": push,
            "nc": nc,
            "selector": selector,
            "lamp": lamp,
            "buzzer": buzzer,
            "passthrough": passthrough,
            "startOpen": start_open and not push and not passthrough and not lamp,
            "source": decoded,
        }
        entries.append(entry)

    keep = set()
    for e in entries:
        keep.add(e["image"].split("/")[-1])
        if e.get("imageOff"):
            keep.add(e["imageOff"].split("/")[-1])
    for p in out_assets.glob("*.png"):
        if p.name not in keep:
            p.unlink()

    return entries, skipped


def write_lib_js(entries: list[dict], path: Path) -> str:
    lines = [MARKER_BEGIN]
    for e in entries:
        lines.append(entry_to_js(e["key"], e))
    lines.append(MARKER_END)
    text = "\n".join(lines) + "\n"
    path.write_text(text, encoding="utf-8")
    return text


def patch_index_html(index_path: Path, lib_block: str) -> None:
    html = index_path.read_text(encoding="utf-8")

    # Keep existing CAT_ORDER (already includes Variateurs / Mesure / Capteurs).
    # Only ensure VIP free hook for edz_*.

    vip_hook = "/* electrodz-vip-free */"
    if vip_hook not in html:
        old = """    function isVipFree(typeId) {
      if (isVipUnlocked()) return true;
      return VIP_FREE_TYPES.has(typeId);
    }"""
        new = """    function isVipFree(typeId) {
      if (isVipUnlocked()) return true;
      if (VIP_FREE_TYPES.has(typeId)) return true;
      /* electrodz-vip-free */ if (String(typeId).startsWith("edz_")) return true;
      return false;
    }"""
        if old in html:
            html = html.replace(old, new)
        else:
            print("Note: pas de gate VIP — patch VIP ignoré")

    if MARKER_BEGIN in html and MARKER_END in html:
        html = re.sub(
            re.escape(MARKER_BEGIN) + r".*?" + re.escape(MARKER_END),
            lib_block.strip(),
            html,
            count=1,
            flags=re.DOTALL,
        )
    else:
        m = re.search(
            r"(knx_dali:\s*\{.*?pairs:\[\s*\[\s*\"L\"\s*,\s*\"~\"\s*\]\s*\]\s*\},)\n(\s*\};)",
            html,
            re.DOTALL,
        )
        if not m:
            raise SystemExit("Impossible de trouver la fin de LIB (knx_dali) pour insertion")
        html = html[: m.end(1)] + "\n" + lib_block + "\n" + m.group(2) + html[m.end() :]

    index_path.write_text(html, encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Import .wc components into SwissDZ Panel")
    ap.add_argument(
        "--src",
        type=Path,
        default=Path("/Users/a/Downloads/electro_dz_rebuild/assets/components"),
    )
    ap.add_argument(
        "--panel-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
    )
    ap.add_argument(
        "--skip",
        action="append",
        default=[],
        help="Substring of filename to skip (repeatable). Empty by default.",
    )
    ap.add_argument("--patch-html", action="store_true", help="Patch index.html in place")
    args = ap.parse_args()

    out_assets = args.panel_root / "assets" / "electrodz"
    entries, skipped = import_all(args.src, out_assets, set(args.skip or []))
    lib_js_path = out_assets / "lib-entries.js"
    lib_block = write_lib_js(entries, lib_js_path)

    with_off = sum(1 for e in entries if e.get("imageOff"))
    with_push = sum(1 for e in entries if e.get("push"))
    with_nc_pairs = sum(1 for e in entries if e.get("pairsNc"))
    with_lamp = sum(1 for e in entries if e.get("lamp"))
    manifest = {
        "count": len(entries),
        "withImageOff": with_off,
        "withPush": with_push,
        "withPairsNc": with_nc_pairs,
        "withLamp": with_lamp,
        "mmToPx": MM_TO_PX,
        "skipped": skipped,
        "components": [
            {
                "key": e["key"],
                "name": e["name"],
                "cat": e["cat"],
                "image": e["image"],
                "imageOff": e.get("imageOff"),
                "push": bool(e.get("push")),
                "nc": bool(e.get("nc")),
                "pairsNc": bool(e.get("pairsNc")),
                "lamp": bool(e.get("lamp")),
                "startOpen": bool(e.get("startOpen")),
                "w": e["w"],
                "h": e["h"],
                "source": e["source"],
            }
            for e in entries
        ],
    }
    (out_assets / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    if args.patch_html:
        patch_index_html(args.panel_root / "index.html", lib_block)

    print(
        f"Importés: {len(entries)} (imageOff: {with_off}, push: {with_push}, "
        f"pairsNc: {with_nc_pairs}, lamp: {with_lamp})"
    )
    print(f"Ignorés: {len(skipped)}")
    for s in skipped:
        print(f"  - {s}")
    print(f"Assets: {out_assets}")
    print(f"JS: {lib_js_path}")
    if args.patch_html:
        print(f"Patché: {args.panel_root / 'index.html'}")


if __name__ == "__main__":
    main()
