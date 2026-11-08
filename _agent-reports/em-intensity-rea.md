# Électro Marker — intensity / faces REA mirror

Date: 2026-11-08  
Host: user Mac (self-hosted), egress IP `213.55.246.20`  
Source of truth: https://electromarker.com/fr → API `https://api.electromarker.com/v3.5.1`  
Target: `dzmarker-app` offline cache on `manou87/electro-dz` (Pages → https://electro-dz.com/dzmarker-app/)

## Auth + POST /devices proof (this Mac IP)

- `POST /v3.5.1/auth` with account `ot22@gmx.ch` → **HTTP 201**, cookie `emtoken` set (password not recorded here).
- `GET /v3.5.1/localization/fr` → **HTTP 200** (174 manufacturers, 26 device types).
- `POST /v3.5.1/devices` from this IP → **HTTP 200** (cloud IPs previously saw Apache **403** on this route).

Proven intensity faces (API SVG text, no overlays):

| Request | API `uid` | Face label in SVG |
|---|---|---|
| empty QF 1P C25 | `QF-1-empty---1P-25-C-6000-230` | `em_Model` → **C25** |
| empty QF 1P B32 | `QF-1-empty---1P-32-B-6000-230` | `em_Model` → **B32** |
| ABB SN201 (model id `1935`) C25 | `QF-1-abb-1935--1P+N-25-C-6000-230` | `abb_modelname` → **C 25** |

Evidence SVGs: `media/electro-marker/proof-empty-c25.svg`, `proof-empty-b32.svg`, `proof-abb-sn201-c25.svg`.

## Root cause (display bug)

Offline `device-cache.js` previously held mostly default **16A / curve C** empty faces. Selecting C25/B32 (and other ratings) on the rail missed cache → wrong/blank intensity. Invented CSS/JS overlays were already removed on `main` (`fix(electro-marker): remove invented rail face rating overlays`); this run fills **real API faces** instead of re-adding overlays.

## Mirror performed (throttled)

Script: `scripts/mirror_electromarker_catalog.py` (env `EM_LOGIN` / `EM_PASS`, throttle ~0.35–0.45s).

1. **PATCH `/devices`** for all 174 brands → `dzmarker-app/v3.5.1/manufacturers.js` now **176** entries (models + styles).
2. **Empty QF intensity matrix** (poles 1P/2P/3P/1P+N × amps 6…63 × curves B/C) with real `em_Model` ratings.
3. **Top-brand QF faces** (ABB, Hager, Legrand, Siemens/`se`, Chint, Eaton, BTicino, …) via numeric model ids for C16/C25/B32-focused set + aliases for UI name hashes.
4. Photos downloaded under `dzmarker-app/v3.5.1/device-photos/**` when API returned `png1`.

### Cache stats

| Artifact | Before | After |
|---|---:|---:|
| `device-cache.js` entries | 242 | **1259** |
| `device-cache.js` size | ~360 KiB | ~2.0 MiB |
| `manufacturers.js` brands | 135 | **176** |
| Keys containing SVG `C25` | (missing empty C25) | **156** |
| Keys containing SVG `B32` | (missing empty B32) | **106** |

Asset cache-bust query updated `?v=em25rea` → `?v=em25faces` (overlays remain removed).

## Fidelity rules kept

- No Treg.
- No invented rating overlays.
- Faces/ratings come only from Electromarker API SVG/`png1`.
- Brand faces require **numeric model id** in `POST /devices` (name alone returns placeholder ruler SVG).

## Notes / residual gaps

- Localization id `schneider` returns empty models; real Schneider pack is under id **`se`** (12 QF models). UI should use `se`.
- `ge` pack empty from API in this account/locale.
- Not every model×amp×curve×pole worldwide was POSTed — priority FR/CH intensity set + top brands. Re-run script to extend.
- Full-repo git clone on this Mac fills the disk (`node_modules`); use sparse checkout of `dzmarker-app` only.

## Live check (after Pages deploy)

Open https://electro-dz.com/dzmarker-app/ → add MCB empty/ABB → set curve+amp to **C25** and **B32** → rail face must show those ratings from cached SVG (no overlay CSS).

## Git / Pages status (blocker)

- Local branch committed: `cursor/em-full-catalog-mirror-36b0` @ `6cfa72e`
- **Push/merge blocked on this Mac**: `gh` keyring token for `manou87` is invalid; no SSH deploy key; `git push` cannot prompt.
- User action required: `gh auth login -h github.com` (or restore a valid PAT), then:

```bash
cd /Users/a/development/electro-dz
git push -u origin cursor/em-full-catalog-mirror-36b0
gh pr create --base main --fill
gh pr merge --merge
```

Until then Pages still serves the previous cache (pre-C25/B32 empty matrix).
