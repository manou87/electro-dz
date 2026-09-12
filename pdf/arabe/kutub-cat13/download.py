#!/usr/bin/env python3
"""Download max books from kutub.info category 13 into local folder."""
import json
import re
import shutil
import subprocess
import sys
import time
import traceback
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.stdout.reconfigure(line_buffering=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
ROOT = Path(__file__).resolve().parent
ZIPS, FILES, META = ROOT / "zips", ROOT / "files", ROOT / "meta"
for p in (ZIPS, FILES, META):
    p.mkdir(parents=True, exist_ok=True)

ids = json.loads((META / "ids.json").read_text())
done_path, fail_path = META / "downloaded.json", META / "failed.json"
done = json.loads(done_path.read_text()) if done_path.exists() else {}
failed = json.loads(fail_path.read_text()) if fail_path.exists() else {}
DOC_EXT = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".pps",
    ".ppsx",
    ".xls",
    ".xlsx",
    ".odt",
    ".rtf",
    ".djvu",
    ".epub",
}


def slug(s, n=50):
    s = re.sub(r"[^\w\u0600-\u06FF\-]+", "-", s or "", flags=re.U)
    return (re.sub(r"-+", "-", s).strip("-") or "book")[:n]


def save():
    done_path.write_text(json.dumps(done, ensure_ascii=False, indent=2))
    fail_path.write_text(json.dumps(failed, ensure_ascii=False, indent=2))


def fetch_dl(book_id):
    r = subprocess.run(
        [
            "curl",
            "-sL",
            "-A",
            UA,
            "--max-time",
            "45",
            f"https://www.kutub.info/library/book/{book_id}",
        ],
        capture_output=True,
    )
    html = r.stdout.decode("utf-8", "ignore")
    m = re.search(r"https://www\.kutub\.info/downloadBook\?book_id=[^\"'&\s]+", html)
    return m.group(0).replace("&amp;", "&") if m else None


def sniff_ext(path: Path) -> str:
    data = path.read_bytes()[:16]
    if data.startswith(b"%PDF"):
        return ".pdf"
    if data.startswith(b"PK\x03\x04"):
        # zip or office openxml
        return ".zip"
    if data.startswith(b"Rar!"):
        return ".rar"
    if data.startswith(b"\xd0\xcf\x11\xe0"):
        return ".doc"  # OLE compound (doc/ppt/xls)
    if data.startswith(b"{\\rtf"):
        return ".rtf"
    if b"<html" in data.lower() or data.startswith(b"<!DOC"):
        return ".html"
    return ".bin"


def extract_archive(zip_path: Path, book_id: str, title: str):
    out_dir = FILES / f"{book_id}-{slug(title)}"
    out_dir.mkdir(parents=True, exist_ok=True)
    extracted = []
    kind = sniff_ext(zip_path)

    if kind == ".html":
        return []

    if kind != ".zip":
        dest = out_dir / f"{book_id}{kind if kind != '.bin' else '.bin'}"
        shutil.copy2(zip_path, dest)
        if kind in DOC_EXT or kind in {".pdf", ".doc", ".ppt"}:
            return [str(dest.relative_to(ROOT))]
        # unknown binary kept
        return [str(dest.relative_to(ROOT))]

    with zipfile.ZipFile(zip_path, "r") as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            name = info.filename
            try:
                name2 = name.encode("cp437").decode("utf-8")
            except Exception:
                try:
                    name2 = name.encode("cp437").decode("latin-1")
                except Exception:
                    name2 = name
            ext = Path(name2).suffix.lower()
            if ext not in DOC_EXT:
                continue
            base = re.sub(r"[^\w\u0600-\u06FF.\-]+", "_", Path(name2).name)[:100] or f"file{ext}"
            dest = out_dir / base
            i = 1
            while dest.exists():
                dest = out_dir / f"{Path(base).stem}_{i}{ext}"
                i += 1
            with z.open(info) as src, open(dest, "wb") as dst:
                shutil.copyfileobj(src, dst)
            extracted.append(str(dest.relative_to(ROOT)))
    return extracted


def process_one(book_id, title):
    if done.get(book_id, {}).get("ok"):
        return "skip"
    zip_path = ZIPS / f"{book_id}.zip"
    try:
        if not zip_path.exists() or zip_path.stat().st_size < 500:
            dl = fetch_dl(book_id)
            if not dl:
                failed[book_id] = {"title": title, "err": "no-link"}
                return "fail"
            subprocess.run(
                [
                    "curl",
                    "-sL",
                    "-A",
                    UA,
                    "--max-time",
                    "180",
                    "--retry",
                    "2",
                    "-o",
                    str(zip_path),
                    dl,
                ],
                check=False,
            )
        if not zip_path.exists() or zip_path.stat().st_size < 200:
            failed[book_id] = {"title": title, "err": "empty"}
            return "fail"
        files = extract_archive(zip_path, book_id, title)
        if not files:
            failed[book_id] = {
                "title": title,
                "err": "no-doc",
                "kind": sniff_ext(zip_path),
                "zip_size": zip_path.stat().st_size,
            }
            return "fail"
        done[book_id] = {
            "ok": True,
            "title": title,
            "zip_size": zip_path.stat().st_size,
            "files": files,
        }
        failed.pop(book_id, None)
        return "ok"
    except Exception:
        failed[book_id] = {"title": title, "err": traceback.format_exc()[-400:]}
        return "fail"


def main():
    todo = [(i, t) for i, t in ids.items() if not done.get(i, {}).get("ok")]
    print(
        f'TOTAL={len(ids)} DONE={sum(1 for v in done.values() if v.get("ok"))} TODO={len(todo)}',
        flush=True,
    )
    batch_size = 25
    workers = 2
    ok = fail = 0
    for start in range(0, len(todo), batch_size):
        batch = todo[start : start + batch_size]
        print(f"--- batch {start // batch_size + 1} size {len(batch)} ---", flush=True)
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = {ex.submit(process_one, i, t): i for i, t in batch}
            for fut in as_completed(futs):
                try:
                    st = fut.result()
                except Exception as e:
                    st = "fail"
                    print("worker crash", e, flush=True)
                if st == "ok":
                    ok += 1
                elif st == "fail":
                    fail += 1
        save()
        print(
            f"checkpoint ok+={ok} fail+={fail} total_ok={sum(1 for v in done.values() if v.get('ok'))}",
            flush=True,
        )
        time.sleep(0.5)
    save()
    print("FINISHED", flush=True)


if __name__ == "__main__":
    main()
