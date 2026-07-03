#!/usr/bin/env python3
"""
Remplace les questions « remplissage » (Pour vérifier les règles…)
par des V/F ou QCM extraits du PDF NF C 15-100 pour M04 et M05.
"""
import hashlib
import json
import os
import re

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOD_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/modules")
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")

FILL_PAT = re.compile(r"^Pour vérifier les règles du thème")
FR_INTRO = "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?"
AR_INTRO = "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"
AR_MC = "حسب معيار NF C 15-100، أي عبارة تعكس متطلب المعيار بدقة؟"
CLEAN = re.compile(r"\s+")
SECTION_PAT = re.compile(r"\b(\d{3}(?:\.\d+)*)\b")
POS_PAT = re.compile(r"\b(doit|doivent|est\s+obligatoire|sont\s+admis|minimum|au\s+plus|interdit|ne\s+doit)\b", re.I)

MODULE_PAGES = {
    "M04": list(range(135, 155))
    + list(range(218, 230))
    + list(range(254, 272))
    + list(range(280, 292)),
    "M05": list(range(377, 396)),
}

MODULE_FILES = {
    "M04": "M04_circuits_protections.json",
    "M05": "M05_locaux_humides.json",
}


def norm_text(s, min_len=35):
    s = CLEAN.sub(" ", s).strip()
    if len(s) < min_len or len(s) > 240:
        return None
    low = s.lower()
    if "figure" in low or low.startswith("note ") or "tous droits" in low:
        return None
    if "nf c 15-100" in low[:30]:
        return None
    if not POS_PAT.search(s):
        return None
    return s


def extract_facts(pages, min_len=35):
    reader = PdfReader(PDF)
    facts = []
    seen = set()
    for pg in pages:
        if pg < 1 or pg > len(reader.pages):
            continue
        raw = (reader.pages[pg - 1].extract_text() or "").replace("\n", " ")
        parts = re.split(r"(?<=[.;])\s+", raw)
        for part in parts:
            part = norm_text(part, min_len)
            if not part:
                continue
            key = part[:90]
            if key in seen:
                continue
            seen.add(key)
            sec = SECTION_PAT.search(part)
            ref = sec.group(1) if sec else "NF C 15-100"
            facts.append((part, ref, pg))
    return facts


def false_option(stmt):
    for a, b in [
        (r"\bne\s+doit\s+pas\b", "doit"),
        (r"\bne\s+doivent\s+pas\b", "doivent"),
        (r"\bn'est\s+pas\b", "est"),
        (r"\binterdit\b", "autorisé sans limite"),
        (r"\bminimum\b", "maximum"),
        (r"\bau\s+plus\b", "au moins"),
        (r"\bdoit\b", "ne doit pas"),
    ]:
        if re.search(a, stmt, re.I):
            return re.sub(a, b, stmt, count=1, flags=re.I)[:180]
    return "Cette obligation ne figure pas dans la norme NF C 15-100."


def make_tf(stmt, ref, page, level, correct=True):
    return {
        "type": "truefalse",
        "difficulty": "facile" if level == 1 else "moyen" if level <= 3 else "difficile",
        "questionFr": f"{FR_INTRO} « {stmt} »",
        "questionAr": AR_INTRO,
        "statementFr": stmt,
        "correctAnswer": correct,
        "explanationFr": (
            (
                "Oui : l'affirmation reprend le texte de la norme NF C 15-100. "
                if correct
                else "Non : l'affirmation n'est pas conforme au texte de la norme (piège). "
            )
            + f"Référence : NF C 15-100 — § {ref} (p. {page}) — page {page} du PDF."
        ),
        "explanationAr": (
            (
                f"نعم: العبارة مطابقة لنص المعيار NF C 15-100. "
                if correct
                else f"لا: العبارة غير مطابقة لنص المعيار (فخ). "
            )
            + f"المرجع: NF C 15-100 — § {ref} (p. {page}) — ص. {page}."
        ),
        "normRef": f"NF C 15-100 — § {ref} (p. {page})",
        "pdfPage": page,
    }


def trap_statement(stmt):
    wrong = false_option(stmt)
    if wrong != "Cette obligation ne figure pas dans la norme NF C 15-100.":
        return wrong
    if re.search(r"\bdoit\b", stmt, re.I):
        return re.sub(r"\bdoit\b", "ne doit pas", stmt, count=1, flags=re.I)
    if re.search(r"\bdoivent\b", stmt, re.I):
        return re.sub(r"\bdoivent\b", "ne doivent pas", stmt, count=1, flags=re.I)
    return stmt + " (cette règle ne s'applique pas aux installations basse tension)."


def make_mc(stmt, ref, page, level):
    correct = stmt if len(stmt) <= 160 else stmt[:157] + "…"
    wrong = false_option(stmt)
    return {
        "type": "multiple",
        "difficulty": "facile" if level == 1 else "moyen" if level <= 3 else "difficile",
        "questionFr": "Selon la norme NF C 15-100, quelle proposition reprend fidèlement l'exigence de la norme ?",
        "questionAr": AR_MC,
        "optionsFr": [
            correct,
            wrong,
            "Aucune exigence de ce type dans la norme.",
            "Règle réservée aux installations haute tension uniquement.",
        ],
        "optionsAr": [
            "عبارة مطابقة للمعيار",
            "عبارة مخالفة للمعيار",
            "غير موجودة في المعيار",
            "للجهد العالي فقط",
        ],
        "correctAnswer": 0,
        "explanationFr": (
            f"La bonne réponse reprend le texte normatif. Référence : NF C 15-100 — § {ref} (p. {page}), page {page} du PDF."
        ),
        "explanationAr": f"الإجابة الصحيحة من نص المعيار — NF C 15-100 — § {ref} (p. {page})، ص. {page}.",
        "normRef": f"NF C 15-100 — § {ref} (p. {page})",
        "pdfPage": page,
    }


def used_stems(questions):
    stems = set()
    for q in questions:
        fr = q.get("questionFr", "")
        if FILL_PAT.match(fr):
            continue
        stems.add((q.get("statementFr") or fr)[:80])
    return stems


def replace_fillers(module_id):
    path = os.path.join(MOD_DIR, MODULE_FILES[module_id])
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    facts = extract_facts(MODULE_PAGES[module_id], min_len=30 if module_id == "M05" else 35)
    facts.sort(key=lambda x: hashlib.md5((module_id + x[0]).encode()).hexdigest())
    pool = []
    for stmt, ref, page in facts:
        pool.append((stmt, ref, page, True))
        trap = trap_statement(stmt)
        if trap[:80] != stmt[:80]:
            pool.append((trap, ref, page, False))
    pool.sort(key=lambda x: hashlib.md5((module_id + x[0]).encode()).hexdigest())
    stems = used_stems(data["questions"])
    fi = 0
    replaced = 0

    for q in data["questions"]:
        if not FILL_PAT.match(q.get("questionFr", "")):
            continue
        level = q.get("level", 1)
        while fi < len(pool):
            stmt, ref, page, correct = pool[fi]
            fi += 1
            if stmt[:80] in stems:
                continue
            stems.add(stmt[:80])
            new = (
                make_mc(stmt, ref, page, level)
                if replaced % 3 == 2 and correct
                else make_tf(stmt, ref, page, level, correct)
            )
            for k, v in new.items():
                q[k] = v
            for drop in ("contextFr", "contextAr", "preambleFr", "preambleAr", "subjectFr", "subjectAr"):
                q.pop(drop, None)
            replaced += 1
            break
        else:
            print(f"WARN: pas assez de faits PDF pour {q['id']}")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    remaining = sum(1 for q in data["questions"] if FILL_PAT.match(q.get("questionFr", "")))
    print(f"{module_id}: {replaced} remplacées, {remaining} fillers restants, {len(pool)} entrées pool")
    return replaced, remaining


def main():
    total = 0
    for mid in MODULE_FILES:
        n, rem = replace_fillers(mid)
        total += n
        if rem:
            raise SystemExit(f"Échec: {rem} fillers restants dans {mid}")
    print(f"Total: {total} questions corrigées")


if __name__ == "__main__":
    main()
