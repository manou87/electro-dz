#!/usr/bin/env python3
"""
Corrige les Vrai/Faux dont la citation est conforme au PDF mais marquée Faux (piège erroné).
Cause : restauration du texte PDF complet sans remettre correctAnswer à True.
"""
import json
import glob
import os
import re

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOD_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/modules")
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")

TRAP_MARK = "formulation non conforme au texte normatif"
FR_INTRO = "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?"
AR_INTRO = "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"


def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def page_text(reader, pg):
    if not pg or pg < 1 or pg > len(reader.pages):
        return ""
    return norm((reader.pages[pg - 1].extract_text() or "").replace("\n", " "))


def in_pdf(reader, statement, page):
    st = norm(statement)
    if not st or TRAP_MARK in st:
        return False
    for pg in (page - 1, page, page + 1):
        hay = page_text(reader, pg)
        if st in hay:
            return True
        # PDF extract sometimes merges words
        st2 = re.sub(r"(\d)\s+(\d)", r"\1\2", st)
        hay2 = re.sub(r"(\d)\s+(\d)", r"\1\2", hay)
        if st2 in hay2:
            return True
    return False


def fix_question(q, reader):
    if q.get("type") != "truefalse" or q.get("correctAnswer") is not False:
        return False
    st = q.get("statementFr") or ""
    if not st or TRAP_MARK in st:
        return False
    if not in_pdf(reader, st, q.get("pdfPage")):
        return False

    q["correctAnswer"] = True
    ref = q.get("normRef", "NF C 15-100")
    page = q.get("pdfPage", "?")
    q["explanationFr"] = (
        f"Oui : l'affirmation reprend le texte de la norme NF C 15-100. "
        f"Référence : {ref} — page {page} du PDF."
    )
    q["explanationAr"] = (
        f"نعم: العبارة مطابقة لنص المعيار NF C 15-100. المرجع: {ref} — ص. {page}."
    )
    q["questionFr"] = f"{FR_INTRO} « {st} »"
    q["questionAr"] = AR_INTRO
    return True


def main():
    reader = PdfReader(PDF)
    total = 0
    fixed_ids = []
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        n = 0
        for q in data.get("questions", []):
            if fix_question(q, reader):
                n += 1
                fixed_ids.append(q["id"])
        if n:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print(f"{os.path.basename(path)}: {n}")
            total += n
    print(f"Total corrigé: {total}")
    if "m04_L1_q04" in fixed_ids:
        print("✓ m04_L1_q04 (§ 432.4) corrigée → Vrai")


if __name__ == "__main__":
    main()
