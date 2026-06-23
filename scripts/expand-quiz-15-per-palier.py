#!/usr/bin/env python3
"""
Étend chaque module à 15 questions par palier (5 paliers = 75 questions).
Conserve les questions existantes ; complète avec V/F extraites du PDF.
"""
import json
import os
import re
import hashlib

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOD_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/modules")
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")

QUESTIONS_PER_LEVEL = 15
LEVELS = 5

# Pages PDF par module (contenu normatif principal)
MODULE_PAGES = {
    "M01": list(range(28, 42)) + list(range(49, 52)) + list(range(71, 75)),
    "M02": list(range(96, 115)) + [217, 270, 273],
    "M03": list(range(56, 58)) + list(range(305, 313)),
    "M04": list(range(141, 148)) + list(range(254, 256)),
    "M05": list(range(379, 384)) + [391, 393],
    "M06": list(range(473, 488)) + [307, 297],
}

MODULE_META = {
    "M01_champ_application.json": ("M01", "Champ d'application & définitions", "مجال التطبيق والتعاريف"),
    "M02_protection_personnes.json": ("M02", "Protection des personnes", "حماية الأشخاص"),
    "M03_mise_a_la_terre.json": ("M03", "Mise à la terre & liaison équipotentielle", "التأريض والربط متساوي الجهد"),
    "M04_circuits_protections.json": ("M04", "Circuits, sections & protections", "الدوائر والمقاطع والحماية"),
    "M05_locaux_humides.json": ("M05", "Locaux humides & volumes (salles d'eau)", "الأماكن الرطبة والحجوم"),
    "M06_tableau_gtl.json": ("M06", "Tableau, GTL & organisation", "اللوحة و GTL والتنظيم"),
}

NEG_PAT = re.compile(
    r"(ne\s+(?:doit|doivent|s'applique|sont)\s+pas|n'est\s+pas|interdit|exclu|sans\s+)",
    re.I,
)
POS_PAT = re.compile(r"\b(doit|doivent|est\s+obligatoire|sont\s+admis|minimum|au\s+plus)\b", re.I)
SECTION_PAT = re.compile(r"\b(\d{3}(?:\.\d+)*)\b")
CLEAN = re.compile(r"\s+")


def norm_text(s):
    s = CLEAN.sub(" ", s).strip()
    if len(s) < 35 or len(s) > 220:
        return None
    if s.count("Figure") or s.startswith("NOTE"):
        return None
    if not (POS_PAT.search(s) or NEG_PAT.search(s)):
        return None
    return s


def extract_facts(pages):
    reader = PdfReader(PDF)
    facts = []
    seen = set()
    for pg in pages:
        if pg < 1 or pg > len(reader.pages):
            continue
        raw = reader.pages[pg - 1].extract_text() or ""
        raw = raw.replace("\n", " ")
        parts = re.split(r"(?<=[.;])\s+", raw)
        for part in parts:
            part = norm_text(part)
            if not part:
                continue
            key = part[:80]
            if key in seen:
                continue
            seen.add(key)
            sec = SECTION_PAT.search(part)
            ref = sec.group(1) if sec else "NF C 15-100"
            neg = bool(NEG_PAT.search(part))
            facts.append((part, ref, pg, neg))
    return facts


def make_tf(module_id, level, idx, stmt, ref, page, neg):
    qid = f"{module_id.lower()}_q{level:02d}_{idx:02d}"
    # Question V/F : énoncé tel que dans le PDF (affirmation)
    qfr = "Selon la norme NF C 15-100 : « " + stmt + " »"
    qar = AR_TF_INTRO
    # Citation exacte du PDF : l'affirmation reproduite est conforme (Vrai).
    correct = True
    efr = f"Texte PDF p. {page} — § {ref}."
    ear = f"نص PDF ص. {page} — § {ref}."
    return {
        "id": qid,
        "level": level,
        "difficulty": "facile" if level == 1 else "moyen" if level <= 3 else "difficile",
        "type": "truefalse",
        "questionFr": qfr,
        "questionAr": qar,
        "correctAnswer": correct,
        "explanationFr": efr,
        "explanationAr": ear,
        "normRef": f"NF C 15-100 — § {ref} (p. {page})",
        "pdfPage": page,
    }


def make_mc_from_fact(module_id, level, idx, stmt, ref, page):
    qid = f"{module_id.lower()}_q{level:02d}_{idx:02d}"
    qfr = "Concernant cette règle du PDF : « " + stmt[:150] + "… » — cette affirmation :"
    qar = "بخصوص هذه القاعدة في PDF — هذا القول:"
    opts_fr = [
        "Correspond au texte normatif du PDF",
        "N'existe pas dans le PDF",
        "Concerne uniquement le HT",
        "Remplace l'habilitation officielle",
    ]
    opts_ar = [
        "يطابق نص المعيار في PDF",
        "غير موجود في PDF",
        "يتعلق بالجهد العالي فقط",
        "يغني عن التأهيل الرسمي",
    ]
    return {
        "id": qid,
        "level": level,
        "difficulty": "facile" if level == 1 else "moyen" if level <= 3 else "difficile",
        "type": "multiple",
        "questionFr": qfr,
        "questionAr": qar,
        "optionsFr": opts_fr,
        "optionsAr": opts_ar,
        "correctAnswer": 0,
        "explanationFr": f"Énoncé extrait p. {page}, § {ref}.",
        "explanationAr": f"مقتبس من ص. {page}.",
        "normRef": f"NF C 15-100 — § {ref} (p. {page})",
        "pdfPage": page,
    }


def expand_module(filename):
    mid, title_fr, title_ar = MODULE_META[filename]
    path = os.path.join(MOD_DIR, filename)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    existing = data["questions"]
    by_level = {i: [] for i in range(1, LEVELS + 1)}
    used_ids = set()
    used_stems = set()

    for q in existing:
        lv = q.get("level", 1)
        if 1 <= lv <= LEVELS:
            by_level[lv].append(q)
            used_ids.add(q["id"])
            used_stems.add(q.get("questionFr", "")[:60])

    facts = extract_facts(MODULE_PAGES[mid])
    # Mélange déterministe par module
    facts.sort(key=lambda x: hashlib.md5((mid + x[0]).encode()).hexdigest())

    fi = 0
    for level in range(1, LEVELS + 1):
        n = 0
        while len(by_level[level]) < QUESTIONS_PER_LEVEL and fi < len(facts):
            stmt, ref, page, neg = facts[fi]
            fi += 1
            stem = stmt[:60]
            if stem in used_stems:
                continue
            idx = len(by_level[level]) + 1
            q = make_tf(mid, level, idx, stmt, ref, page, neg)
            if q["id"] in used_ids:
                q["id"] = f"{mid.lower()}_x{level}_{idx}_{fi}"
            if len(by_level[level]) % 3 == 2:
                q = make_mc_from_fact(mid, level, idx, stmt, ref, page)
                q["id"] = f"{mid.lower()}_mc{level}_{idx}"
            by_level[level].append(q)
            used_ids.add(q["id"])
            used_stems.add(stem)
            n += 1

        # Si pas assez de faits PDF, compléter par MC générique ancrée
        while len(by_level[level]) < QUESTIONS_PER_LEVEL:
            idx = len(by_level[level]) + 1
            pg = MODULE_PAGES[mid][(level * idx) % len(MODULE_PAGES[mid])]
            q = {
                "id": f"{mid.lower()}_fill_{level}_{idx}",
                "level": level,
                "difficulty": "moyen",
                "type": "multiple",
                "questionFr": f"Palier {level} — pour approfondir, consultez le PDF p. {pg} du module {title_fr}. Quelle source fait foi pour ce quiz ?",
                "questionAr": f"المرحلة {level} — راجع PDF ص. {pg}.",
                "optionsFr": [
                    "Uniquement le PDF NF C 15-100 de la bibliothèque",
                    "Des guides constructeurs",
                    "Des forums internet",
                    "Aucune référence",
                ],
                "optionsAr": [
                    "PDF NF C 15-100 في المكتبة فقط",
                    "أدلة الشركات",
                    "منتديات",
                    "بدون مرجع",
                ],
                "correctAnswer": 0,
                "explanationFr": f"Relisez le PDF p. {pg} pour ce thème ({title_fr}).",
                "explanationAr": f"راجع PDF ص. {pg}.",
                "normRef": f"NF C 15-100 (p. {pg})",
                "pdfPage": pg,
            }
            by_level[level].append(q)

    merged = []
    for level in range(1, LEVELS + 1):
        chunk = by_level[level][:QUESTIONS_PER_LEVEL]
        for i, q in enumerate(chunk, 1):
            q["id"] = f"{mid.lower()}_L{level}_q{i:02d}"
            q["level"] = level
            merged.append(q)

    data["questions"] = merged
    data["version"] = "2.0"
    data["questionsPerLevel"] = QUESTIONS_PER_LEVEL
    data["sourceNoteFr"] += f" {QUESTIONS_PER_LEVEL} questions par palier ({LEVELS} paliers)."

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    counts = {lv: sum(1 for q in merged if q["level"] == lv) for lv in range(1, LEVELS + 1)}
    return len(merged), counts


def main():
    for fn in MODULE_META:
        total, counts = expand_module(fn)
        assert all(c == QUESTIONS_PER_LEVEL for c in counts.values()), (fn, counts)
        print(f"{fn}: {total} questions — {counts}")


if __name__ == "__main__":
    main()
