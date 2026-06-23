#!/usr/bin/env python3
"""
Restaure les citations NF C 15-100 complètes (sans « … ») à partir du PDF.
Met à jour questionFr / statementFr des Vrai-Faux tronqués.
"""
import json
import glob
import os
import re

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOD_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/modules")
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")

FR_INTRO = "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?"
AR_INTRO = "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"

CLEAN = re.compile(r"\s+")
ELLIPSIS = re.compile(r"…|\.\.\.$")


def extract_quote(text):
    if not text:
        return ""
    m = re.search(r"«\s*(.+?)\s*»", text, re.DOTALL)
    return m.group(1).strip() if m else ""


def norm(s):
    return CLEAN.sub(" ", s or "").strip()


def page_text(reader, page):
    if not page or page < 1 or page > len(reader.pages):
        return ""
    return norm((reader.pages[page - 1].extract_text() or "").replace("\n", " "))


def find_full_quote(reader, snippet, page):
    snippet = ELLIPSIS.sub("", snippet).strip()
    if len(snippet) < 12:
        return None

    prefixes = []
    for n in (min(80, len(snippet)), 60, 45, 30, 20):
        prefixes.append(snippet[:n])

    pages = []
    if page:
        pages.extend([page - 1, page, page + 1])
    else:
        pages = list(range(1, min(len(reader.pages), 500) + 1))

    haystack = ""
    for pg in pages:
        haystack += " " + page_text(reader, pg)

    haystack = norm(haystack)
    if not haystack:
        return None

    start = -1
    used = ""
    for p in prefixes:
        start = haystack.find(p)
        if start >= 0:
            used = p
            break

    if start < 0:
        # PDF extract sometimes drops accents/spaces — fuzzy: first 25 alnum chars
        alnum = re.sub(r"[^\w]", "", snippet.lower())[:25]
        if len(alnum) >= 12:
            compact = re.sub(r"[^\w]", "", haystack.lower())
            pos = compact.find(alnum)
            if pos >= 0:
                # map back approximately
                start = max(0, pos - 5)

    if start < 0:
        return None

    excerpt = haystack[start : start + 600]
    # Stop at sentence boundary after meaningful length
    end = len(excerpt)
    for m in re.finditer(r"[.;]\s", excerpt):
        if m.end() >= max(50, len(used)):
            end = m.end()
            break
    full = excerpt[:end].strip(" .;")
    if len(full) < len(snippet):
        return None
    return full


def needs_fix(q):
    for field in ("questionFr", "statementFr"):
        v = q.get(field) or ""
        if ELLIPSIS.search(v):
            return True
    return False


def fix_question(q, reader):
    quote = extract_quote(q.get("questionFr", "")) or (q.get("statementFr") or "")
    if ELLIPSIS.search(quote):
        quote = ELLIPSIS.sub("", quote).strip()

    page = q.get("pdfPage")
    full = find_full_quote(reader, quote, page)
    if not full:
        return False

    if q.get("type") == "truefalse":
        q["statementFr"] = full
        q["questionFr"] = f"{FR_INTRO} « {full} »"
        q["questionAr"] = AR_INTRO
        return True

    # QCM : si la citation était tronquée dans l'énoncé
    qfr = q.get("questionFr", "")
    if "«" in qfr and ELLIPSIS.search(qfr):
        old = extract_quote(qfr) or quote
        if old and full.startswith(ELLIPSIS.sub("", old)[:20]):
            q["questionFr"] = qfr.replace(old, full).replace("…", "").replace("...", "")
            return True
    return False


def main():
    reader = PdfReader(PDF)
    total = 0
    missed = []

    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        n = 0
        for q in data.get("questions", []):
            if not needs_fix(q):
                continue
            if fix_question(q, reader):
                n += 1
            else:
                missed.append(q.get("id"))
        if n:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print(f"{os.path.basename(path)}: {n} corrigées")
            total += n

    print(f"Total corrigées: {total}")
    if missed:
        print(f"Non retrouvées dans le PDF ({len(missed)}): {', '.join(missed[:15])}{'…' if len(missed)>15 else ''}")


if __name__ == "__main__":
    main()
