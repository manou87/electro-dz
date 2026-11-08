#!/usr/bin/env python3
"""Throttled Electromarker → dzmarker-app offline catalog mirror.

Source of truth: https://electromarker.com/fr (API v3.5.1).
No invented overlays — only API svg/png1/png2 + manufacturer styles.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "dzmarker-app"
V351 = APP / "v3.5.1"
CACHE_JS = V351 / "device-cache.js"
MFR_JS = V351 / "manufacturers.js"
PHOTO_DIR = V351 / "device-photos"
API = "https://api.electromarker.com/v3.5.1"
ORIGIN = "https://electromarker.com"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
)
THROTTLE_S = float(os.environ.get("EM_THROTTLE", "0.45"))
LOGIN = os.environ.get("EM_LOGIN", "").strip()
PASS = os.environ.get("EM_PASS", "").strip()

# Priority amps/curves for rail intensity correctness (FR/CH common).
PRIORITY_AMPS = ["6", "10", "13", "16", "20", "25", "32", "40", "50", "63"]
PRIORITY_CURVES = ["B", "C"]
PRIORITY_POLES = ["1P", "2P", "3P", "1P+N"]
TOP_MFRS = [
    "empty",
    "abb",
    "hager",
    "legrand",
    "siemens",
    "schneider",
    "chint",
    "eaton",
    "bticino",
    "ge",
]


class Client:
    def __init__(self) -> None:
        self.cj = urllib.request.HTTPCookieProcessor()
        self.opener = urllib.request.build_opener(self.cj)
        self.n = 0

    def request(self, method: str, url: str, data=None, headers=None):
        h = {
            "User-Agent": UA,
            "Accept": "application/json, text/plain, */*",
            "Origin": ORIGIN,
            "Referer": f"{ORIGIN}/fr",
        }
        if headers:
            h.update(headers)
        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")
            h["Content-Type"] = "application/json;charset=UTF-8"
        req = urllib.request.Request(url, data=body, headers=h, method=method)
        self.n += 1
        time.sleep(THROTTLE_S)
        with self.opener.open(req, timeout=60) as resp:
            raw = resp.read()
            code = resp.getcode()
        if not raw:
            return code, None
        try:
            return code, json.loads(raw.decode("utf-8"))
        except Exception:
            return code, raw

    def warm(self) -> None:
        req = urllib.request.Request(
            f"{ORIGIN}/fr",
            headers={"User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9"},
        )
        with self.opener.open(req, timeout=30) as resp:
            resp.read()

    def auth(self, login: str, password: str) -> dict:
        code, data = self.request(
            "POST", f"{API}/auth", {"login": login, "pass": password}
        )
        if code not in (200, 201) or not isinstance(data, dict) or "profile" not in data:
            raise RuntimeError(f"auth failed HTTP {code}")
        return data


def load_js_json(path: Path, prefix: str) -> dict:
    txt = path.read_text(encoding="utf-8")
    if not txt.startswith(prefix):
        raise RuntimeError(f"unexpected prefix in {path}")
    body = txt[len(prefix) :].strip()
    if body.endswith(";"):
        body = body[:-1]
    return json.loads(body)


def dump_js_json(path: Path, prefix: str, obj: dict) -> None:
    path.write_text(prefix + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")


def rewrite_photo(url: str | None, client: Client) -> str | None:
    if not url:
        return None
    if url.startswith("/dzmarker-app/"):
        return url
    # https://static.electromarker.com/devices/{mfr}/{type}/{hash}.png
    m = re.match(
        r"https?://static\.electromarker\.com/devices/([^/]+)/([^/]+)/([^/?#]+)$",
        url,
    )
    if not m:
        return url
    mfr, typ, fname = m.group(1), m.group(2), m.group(3)
    dest_dir = PHOTO_DIR / mfr / typ
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / fname
    local = f"/dzmarker-app/v3.5.1/device-photos/{mfr}/{typ}/{fname}"
    if not dest.exists():
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": f"{ORIGIN}/fr"})
        time.sleep(THROTTLE_S)
        try:
            with client.opener.open(req, timeout=60) as resp:
                dest.write_bytes(resp.read())
        except Exception as e:
            print(f"  photo fail {url}: {e}", flush=True)
            return url
    return local


def device_hash(payload: dict, model_token: str) -> str:
    """Match upstream hash(e): type-din-manufacturer-model-seria-params…"""
    t = payload
    parts = [t["type"], str(t.get("module", "")), t.get("manufacturer") or "", model_token, t.get("seria") or ""]
    params = t.get("params") or {}
    # param order from type templates is unknown here; use stable common QF order
    for key in [
        "poles",
        "amperage",
        "crossSection",
        "curve",
        "residualCurrent",
        "RCDtype",
        "icn",
        "voltage",
        "contactsType",
        "SPDclass",
        "Imax_MaxDischargeCurrent",
        "Iimp_MaxImpulseCurrent",
        "voltage_Uc_maxOperating",
    ]:
        if key == "crossSection" and t["type"] != "X":
            continue
        if key in params:
            parts.append(params.get(key) or "")
    return "-".join(parts)


def store_face(cache: dict, client: Client, payload: dict, resp: dict) -> list[str]:
    keys = []
    uid = resp.get("uid") or ""
    svg = resp.get("svg") or ""
    has_rating = any(
        token in svg
        for token in ("em_Model", "modelname", "abb_modelname", "hager_", "legrand_")
    )
    # Skip useless placeholder width rulers (no ratings / no brand face)
    if (
        "visibility:var(--otherWidth,hidden)" in svg
        and not has_rating
        and not resp.get("png1")
    ):
        return keys
    entry = {
        "svg": svg,
        "png1": rewrite_photo(resp.get("png1"), client),
        "png2": rewrite_photo(resp.get("png2"), client),
    }
    if uid:
        cache[uid] = entry
        keys.append(uid)
    return keys


def post_device(client: Client, payload: dict) -> dict | None:
    code, data = client.request("POST", f"{API}/devices", payload)
    if code != 200 or not isinstance(data, dict):
        print(f"  POST fail {code} {payload.get('manufacturer')} {payload.get('model')}", flush=True)
        return None
    return data


def patch_mfrs(client: Client, ids: list[str]) -> dict:
    out = {}
    # batch of 4
    for i in range(0, len(ids), 4):
        batch = ids[i : i + 4]
        code, data = client.request("PATCH", f"{API}/devices", {"manufacturers": batch})
        print(f"PATCH {batch} -> HTTP {code}", flush=True)
        if code == 200 and isinstance(data, dict):
            for k, v in data.items():
                if k == "notifications":
                    continue
                out[k] = {"models": v.get("models") or {}, "style": v.get("style") or ""}
        else:
            print(f"  patch error body type={type(data)}", flush=True)
    return out


def mirror_empty_qf(client: Client, cache: dict, types: dict) -> int:
    qf = next((t for t in types if t.get("id") == "QF"), None)
    if not qf:
        return 0
    pvals = {p["key"]: p for p in (qf.get("paramValues") or [])}
    amps = [a for a in PRIORITY_AMPS if a in (pvals.get("amperage", {}).get("values") or PRIORITY_AMPS)]
    curves = [c for c in PRIORITY_CURVES if c in (pvals.get("curve", {}).get("values") or PRIORITY_CURVES)]
    poles = [p for p in PRIORITY_POLES if p in (pvals.get("poles", {}).get("values") or PRIORITY_POLES)]
    icn = (pvals.get("icn") or {}).get("defaultValue") or "6000"
    volt = (pvals.get("voltage") or {}).get("defaultValue") or "230"
    n = 0
    for pole in poles:
        module = 1 if pole in ("1P",) else (2 if pole in ("2P", "1P+N") else 3)
        for amp in amps:
            for curve in curves:
                payload = {
                    "type": "QF",
                    "module": module,
                    "manufacturer": "empty",
                    "seria": "",
                    "model": "",
                    "params": {
                        "poles": pole,
                        "amperage": amp,
                        "curve": curve,
                        "icn": icn,
                        "voltage": volt,
                    },
                }
                uid_guess = device_hash(payload, "")
                # common empty key form uses module from request
                if uid_guess in cache and "em_Model" in (cache[uid_guess].get("svg") or ""):
                    continue
                resp = post_device(client, payload)
                if not resp:
                    continue
                keys = store_face(cache, client, payload, resp)
                n += len(keys)
                face = ""
                m = re.search(r"em_Model[\s\S]*?</text>", resp.get("svg") or "")
                if m:
                    face = re.sub(r"<[^>]+>", " ", m.group(0))
                    face = re.sub(r"\s+", " ", face).strip()
                print(f"  empty face {resp.get('uid')} :: {face}", flush=True)
    return n


def mirror_brand_qf(client: Client, cache: dict, mfr_pack: dict, mfr_id: str, limit_models: int = 8) -> int:
    block = mfr_pack.get(mfr_id) or {}
    models = (block.get("models") or {}).get("QF") or []
    n = 0
    for model in models[:limit_models]:
        mid = str(model.get("id"))
        name = model.get("name") or mid
        pvs = {p["key"]: p for p in (model.get("paramValues") or [])}
        amps = [a for a in PRIORITY_AMPS if a in (pvs.get("amperage", {}).get("values") or [])]
        curves = [c for c in PRIORITY_CURVES if c in (pvs.get("curve", {}).get("values") or [])]
        poles_avail = pvs.get("poles", {}).get("values") or ["1P"]
        poles = [p for p in PRIORITY_POLES if p in poles_avail] or list(poles_avail[:1])
        dins = model.get("dins") or [1]
        # Focus intensity proof set + defaults
        want = []
        for amp in amps:
            for curve in curves:
                if (curve, amp) in [("C", "16"), ("C", "25"), ("B", "32"), ("B", "16"), ("C", "10"), ("C", "20")]:
                    want.append((amp, curve))
        if not want and amps and curves:
            want = [(amps[min(2, len(amps) - 1)], curves[0])]
        for pole in poles[:2]:
            # pick din width compatible with pole count when possible
            pole_mods = 1
            if "4" in pole:
                pole_mods = 4
            elif "3" in pole:
                pole_mods = 3
            elif "2" in pole or "+N" in pole or "P+N" in pole:
                pole_mods = 2
            module = pole_mods if pole_mods in dins else dins[0]
            for amp, curve in want:
                payload = {
                    "type": "QF",
                    "module": module,
                    "manufacturer": mfr_id,
                    "seria": "",
                    "model": mid,  # numeric id required for real faces
                    "params": {"poles": pole, "amperage": amp, "curve": curve},
                }
                # include optional defaults if model declares them
                for k in ("icn", "voltage"):
                    if k in pvs:
                        payload["params"][k] = pvs[k].get("defaultValue") or (pvs[k].get("values") or [""])[0]
                resp = post_device(client, payload)
                if not resp:
                    continue
                keys = store_face(cache, client, payload, resp)
                uid = resp.get("uid") or ""
                if uid and uid in cache:
                    # alias under model name for UI hash
                    if mid and f"-{mid}-" in uid:
                        alias = uid.replace(f"-{mid}-", f"-{name}-", 1)
                        cache[alias] = cache[uid]
                        keys.append(alias)
                    # legacy sparse key style seen in prior cache
                    legacy = f"QF-{module}-{mfr_id}-{name}---{amp}-{curve}--"
                    cache[legacy] = cache[uid]
                    keys.append(legacy)
                    n += 1
                    print(f"  {mfr_id} {name} {pole} {curve}{amp} -> {uid}", flush=True)
                else:
                    print(f"  skip placeholder {mfr_id} {name} {pole} {curve}{amp} uid={uid}", flush=True)
    return n


def main() -> int:
    if not LOGIN or not PASS:
        print("Set EM_LOGIN and EM_PASS", file=sys.stderr)
        return 2

    client = Client()
    print("Warm + auth…", flush=True)
    client.warm()
    profile = client.auth(LOGIN, PASS)
    print(f"Auth OK role={profile.get('profile', {}).get('role')}", flush=True)

    print("GET localization/fr…", flush=True)
    code, loc = client.request("GET", f"{API}/localization/fr")
    if code != 200 or not isinstance(loc, dict):
        raise RuntimeError(f"localization failed {code}")
    (V351 / "localization").mkdir(parents=True, exist_ok=True)
    (V351 / "localization" / "fr.json").write_text(
        json.dumps(loc, ensure_ascii=False), encoding="utf-8"
    )

    mfr_list = ((loc.get("devices") or {}).get("manufacturers") or [])
    types = ((loc.get("devices") or {}).get("types") or {}).get("list") or []
    mfr_ids = [m["id"] for m in mfr_list if m.get("id") and m["id"] != "empty"]
    print(f"manufacturers={len(mfr_ids)} types={len(types)}", flush=True)

    # Load existing packs
    cache = load_js_json(CACHE_JS, "window.__DZ_DEVICE_CACHE__=") if CACHE_JS.exists() else {}
    mfr_pack = load_js_json(MFR_JS, "window.__DZ_MANUFACTURERS__=") if MFR_JS.exists() else {}
    print(f"existing cache={len(cache)} mfr_pack={len(mfr_pack)}", flush=True)

    # Refresh manufacturer models (all, throttled). Prefer TOP first.
    if os.environ.get("EM_SKIP_PATCH") == "1":
        print(f"SKIP PATCH — using existing manufacturers.js ({len(mfr_pack)})", flush=True)
    else:
        ordered = [m for m in TOP_MFRS if m in mfr_ids] + [m for m in mfr_ids if m not in TOP_MFRS]
        missing_or_all = ordered  # full refresh for fidelity
        print(f"PATCH models for {len(missing_or_all)} brands…", flush=True)
        refreshed = patch_mfrs(client, missing_or_all)
        mfr_pack.update(refreshed)
        dump_js_json(MFR_JS, "window.__DZ_MANUFACTURERS__=", mfr_pack)
        print(f"manufacturers.js now {len(mfr_pack)}", flush=True)

    print("Mirror empty QF intensity matrix…", flush=True)
    n_empty = mirror_empty_qf(client, cache, types)
    print(f"empty faces stored ops={n_empty}", flush=True)
    dump_js_json(CACHE_JS, "window.__DZ_DEVICE_CACHE__=", cache)
    print(f"checkpoint device-cache.js entries={len(cache)}", flush=True)

    # Mirror generic "other/appareil" empty faces (default + button often adds these)
    print("Mirror other/empty placeholder faces…", flush=True)
    for amp in ("16", "18", "25"):
        for module in ("", "1"):
            payload = {
                "type": "other",
                "module": module if module else 1,
                "manufacturer": "empty",
                "seria": "",
                "model": "",
                "params": {"amperage": amp} if False else {},
            }
            # EM other devices often hash as other--empty---{width}
            resp = post_device(client, {
                "type": "other",
                "module": 1,
                "manufacturer": "empty",
                "seria": "",
                "model": "",
                "params": {},
            })
            if resp:
                keys = store_face(cache, client, payload, resp)
                uid = resp.get("uid") or ""
                # also alias common UI hashes seen locally
                for alias in (uid, f"other--empty---{amp}", "other--empty---16", "other-1-empty----", "other--empty----"):
                    if alias and resp.get("svg"):
                        cache[alias] = {
                            "svg": resp.get("svg") or "",
                            "png1": rewrite_photo(resp.get("png1"), client),
                            "png2": rewrite_photo(resp.get("png2"), client),
                        }
                print(f"  other face uid={uid} aliases ok", flush=True)
            break
        break
    dump_js_json(CACHE_JS, "window.__DZ_DEVICE_CACHE__=", cache)

    print("Mirror ALL-brand QF faces (throttled; top brands denser)…", flush=True)
    n_brand = 0
    ordered = [m for m in TOP_MFRS if m != "empty"] + [m for m in sorted(mfr_pack.keys()) if m not in TOP_MFRS and m != "empty"]
    force = os.environ.get("EM_FORCE") == "1"
    only = [x for x in (os.environ.get("EM_ONLY") or "").split(",") if x]
    if only:
        ordered = [m for m in ordered if m in only]
    for idx, mfr in enumerate(ordered):
        if mfr not in mfr_pack:
            print(f"  skip missing pack {mfr}", flush=True)
            continue
        # Skip if brand already has QF png coverage unless forced
        existing = sum(1 for k,v in cache.items() if k.startswith("QF-") and f"-{mfr}-" in k and v.get("png1"))
        lim = 6 if mfr in TOP_MFRS else 2
        if existing >= (8 if mfr in TOP_MFRS else 2) and not force:
            print(f"  [{idx+1}/{len(ordered)}] skip {mfr} (qf_png={existing})", flush=True)
            continue
        print(f"  [{idx+1}/{len(ordered)}] mirror {mfr} limit_models={lim} existing_qf_png={existing}", flush=True)
        n_brand += mirror_brand_qf(client, cache, mfr_pack, mfr, limit_models=lim)
        if (idx + 1) % 5 == 0:
            dump_js_json(CACHE_JS, "window.__DZ_DEVICE_CACHE__=", cache)
            print(f"  checkpoint cache={len(cache)}", flush=True)
    dump_js_json(CACHE_JS, "window.__DZ_DEVICE_CACHE__=", cache)
    print(f"brand face posts={n_brand}", flush=True)

    dump_js_json(CACHE_JS, "window.__DZ_DEVICE_CACHE__=", cache)
    print(f"device-cache.js entries={len(cache)} requests={client.n}", flush=True)

    # Proof summary without secrets
    proofs = [k for k in cache if re.search(r"-(25-C-|32-B-)", k) or "C25" in (cache[k].get("svg") or "") or "C 25" in (cache[k].get("svg") or "") or "B32" in (cache[k].get("svg") or "") or "B 32" in (cache[k].get("svg") or "")]
    print(f"proof-related keys={len(proofs)}", flush=True)
    for k in sorted(proofs)[:30]:
        print(" ", k, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
