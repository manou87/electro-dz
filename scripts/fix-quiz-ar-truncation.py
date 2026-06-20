#!/usr/bin/env python3
"""Corrige les questionAr tronquées (80 car.) des Vrai/Faux — citation complète dans statementFr."""
import json
import glob
import os
import re

MOD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data/quiz/nf-c15-100-2015/modules",
)

AR_INTRO = "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"
FR_INTRO = "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?"


def extract_quote(text):
    if not text:
        return ""
    m = re.search(r"«\s*(.+?)\s*»", text, re.DOTALL)
    return m.group(1).strip() if m else ""


def needs_fix(q):
    qar = q.get("questionAr") or ""
    if "هل العبارة" in qar and "«" in qar:
        return True
    if q.get("type") == "truefalse" and extract_quote(q.get("questionFr", "")):
        return True
    return False


def fix_question(q):
    quote = extract_quote(q.get("questionFr", "")) or extract_quote(q.get("questionAr", ""))
    if not quote:
        return False
    q["statementFr"] = quote
    q["questionAr"] = AR_INTRO
    q["questionFr"] = f"{FR_INTRO} « {quote} »"
    return True


def main():
    total = 0
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        n = 0
        for q in data.get("questions", []):
            if needs_fix(q) and fix_question(q):
                n += 1
        if n:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print(f"{os.path.basename(path)}: {n} questions corrigées")
            total += n
    print(f"Total: {total}")


if __name__ == "__main__":
    main()
