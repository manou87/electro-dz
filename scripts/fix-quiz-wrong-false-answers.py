#!/usr/bin/env python3
"""
Valide et corrige toutes les questions Vrai/Faux du quiz NF C 15-100.

Règle : si l'énoncé (statementFr) figure tel quel dans le PDF → bonne réponse = Vrai.
Les pièges volontaires portent la mention « formulation non conforme au texte normatif »
ou une négation inversée par rapport au PDF.
"""
import json
import glob
import os
import re
import sys
import unicodedata

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOD_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/modules")
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")

TRAP_MARK = "formulation non conforme au texte normatif"
FR_INTRO = "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?"
AR_INTRO = "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"
PAGE_RADIUS = 3


def normalize_text(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("«", " ").replace("»", " ")
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"(\d)\s+(\d)", r"\1\2", s)
    return s.lower()


def get_statement(q):
    st = q.get("statementFr") or ""
    if not st:
        m = re.search(r"«\s*(.+?)\s*»", q.get("questionFr", ""), re.DOTALL)
        st = m.group(1).strip() if m else ""
    return st


def haystack(reader, page):
    parts = []
    for pg in range(max(1, page - PAGE_RADIUS), min(len(reader.pages), page + PAGE_RADIUS) + 1):
        raw = (reader.pages[pg - 1].extract_text() or "").replace("\n", " ")
        parts.append(normalize_text(raw))
    return " ".join(parts)


def in_pdf(reader, statement, page):
    st = normalize_text(statement)
    if not st or TRAP_MARK in statement:
        return False
    hay = haystack(reader, page or 1)
    if st in hay:
        return True
    # fragment long (≥ 50 car.) souvent suffisant si PDF mal extrait
    if len(st) >= 50 and st[:50] in hay and st[:80] in hay:
        return True
    return False


def is_inverted_trap(reader, statement, page):
    """Piège : l'énoncé faux devient conforme au PDF en inversant une négation."""
    if TRAP_MARK in statement:
        return True
    st = statement
    variants = [st]
    rules = [
        (r"\bne\s+doit\s+pas\b", "doit"),
        (r"\bne\s+doivent\s+pas\b", "doivent"),
        (r"\bn'est\s+pas\b", "est"),
        (r"\bn'est\s+pas\b", "n'est pas"),  # noop
        (r"\best\s+exclue\b", "n'est pas exclue"),
        (r"\bn'est\s+pas\s+exclue\b", "est exclue"),
        (r"\best\s+disponible\b", "n'est pas disponible"),
        (r"\bn'est\s+pas\s+disponible\b", "est disponible"),
        (r"\bdoivent\s+être\b", "ne doivent pas être"),
        (r"\bne\s+doivent\s+pas\s+être\b", "doivent être"),
        (r"\bdoit\s+être\b", "ne doit pas être"),
        (r"\bne\s+doit\s+pas\s+être\b", "doit être"),
    ]
    for pat, repl in rules:
        if re.search(pat, st, re.I):
            variants.append(re.sub(pat, repl, st, count=1, flags=re.I))
    for v in variants:
        if v != st and in_pdf(reader, v, page):
            return True
    return False


def apply_true_fix(q):
    st = get_statement(q)
    ref = q.get("normRef", "NF C 15-100")
    page = q.get("pdfPage", "?")
    q["correctAnswer"] = True
    q["statementFr"] = st
    q["questionFr"] = f"{FR_INTRO} « {st} »"
    q["questionAr"] = AR_INTRO
    q["explanationFr"] = (
        f"Oui : l'affirmation reprend le texte de la norme NF C 15-100. "
        f"Référence : {ref} — page {page} du PDF."
    )
    q["explanationAr"] = (
        f"نعم: العبارة مطابقة لنص المعيار NF C 15-100. المرجع: {ref} — ص. {page}."
    )


def fix_all(reader, dry_run=False):
    fixed = []
    traps_ok = []
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        changed = False
        for q in data.get("questions", []):
            if q.get("type") != "truefalse":
                continue
            st = get_statement(q)
            if not st:
                continue
            page = q.get("pdfPage") or 1
            verbatim = in_pdf(reader, st, page)
            inverted = is_inverted_trap(reader, st, page)

            if q.get("correctAnswer") is False and verbatim and not inverted:
                fixed.append(q["id"])
                if not dry_run:
                    apply_true_fix(q)
                    changed = True
            elif q.get("correctAnswer") is False and inverted:
                traps_ok.append(q["id"])

        if changed and not dry_run:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")

    return fixed, traps_ok


def validate(reader):
    bugs = []
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for q in data.get("questions", []):
            if q.get("type") != "truefalse":
                continue
            st = get_statement(q)
            if not st:
                continue
            page = q.get("pdfPage") or 1
            if q.get("correctAnswer") is False and in_pdf(reader, st, page) and not is_inverted_trap(reader, st, page):
                bugs.append(q["id"])
    return bugs


def main():
    reader = PdfReader(PDF)
    dry = "--dry-run" in sys.argv
    if "--validate" in sys.argv:
        bugs = validate(reader)
        print(f"Anomalies restantes (Faux + citation PDF conforme): {len(bugs)}")
        if bugs:
            print(", ".join(bugs))
        sys.exit(1 if bugs else 0)

    fixed, traps = fix_all(reader, dry_run=dry)
    print(f"{'[simulation] ' if dry else ''}Corrigées → Vrai: {len(fixed)}")
    if fixed:
        print("  " + ", ".join(fixed))
    print(f"Pièges inversés (Faux correct): {len(traps)}")
    bugs = validate(reader) if not dry else []
    if not dry:
        print(f"Vérification finale: {len(bugs)} anomalie(s)")
        if bugs:
            print("  " + ", ".join(bugs))


if __name__ == "__main__":
    main()
