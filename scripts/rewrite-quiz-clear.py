#!/usr/bin/env python3
"""
Réécrit les questions du quiz : énoncés clairs, explications complètes.
Remplace les formulations type « Tableau 54B — » ou citations PDF brutes.
"""
import json
import glob
import os
import re
import random
import hashlib

MOD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data/quiz/nf-c15-100-2015/modules",
)

AUTO_MC = re.compile(r"^Concernant cette règle")
AUTO_TF = re.compile(r"^Selon la norme NF C 15-100\s*:")
FILL = re.compile(r"^Palier \d+ — pour approfondir")
TABLEAU_Q = re.compile(r"^Tableau\s+(\S+)", re.I)
SECTION_SHORT = re.compile(r"^§\s*([\d.]+)\s*(.*)$")

# Réécritures ciblées (ancien id logique → clair)
EXACT_FIXES = {
    "m03_L1_q02": {
        "questionFr": "Selon la norme NF C 15-100, quelle section minimale en cuivre est exigée pour un conducteur de terre isolé enterré ?",
        "questionAr": "حسب معيار NF C 15-100، ما أصغر مقطع نحاس لموصل أرض معزول مدفون؟",
        "explanationFr": "Le Tableau 54B (§ 542.3.1) impose 16 mm² minimum pour un conducteur de terre isolé en cuivre enterré.",
        "explanationAr": "جدول 54B (§ 542.3.1): 16 mm² كحد أدنى لموصل أرض معزول من النحاس.",
    },
    "m03_L1_q03": {
        "questionFr": "Selon la norme NF C 15-100, quelle section minimale en cuivre est exigée pour un conducteur de terre nu enterré ?",
        "questionAr": "حسب معيار NF C 15-100، ما أصغر مقطع نحاس لموصل أرض عاري مدفون؟",
        "explanationFr": "Le Tableau 54B impose 25 mm² minimum pour un conducteur de terre nu en cuivre enterré (cas distinct du conducteur isolé).",
        "explanationAr": "جدول 54B: 25 mm² كحد أدنى لموصل أرض عاري من النحاس (مختلف عن المعزول).",
    },
}


def stable_seed(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def extract_quote(qfr):
    m = re.search(r"«\s*(.+?)\s*»", qfr, re.DOTALL)
    return m.group(1).strip() if m else ""


def clean_text(s, max_len=140):
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\b(lo|rsqu|éle|ctri)\b", "", s, flags=re.I)
    s = s.strip(" .;")
    if len(s) > max_len:
        s = s[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return s


def false_option(stmt):
    s = stmt
    for a, b in [
        (r"\bne\s+doit\s+pas\b", "doit"),
        (r"\bne\s+doivent\s+pas\b", "doivent"),
        (r"\bn'est\s+pas\b", "est"),
        (r"\binterdit\b", "autorisé sans limite"),
        (r"\bminimum\b", "maximum"),
        (r"\bau plus égal\b", "au moins égal"),
        (r"\bdoit\b", "ne doit pas"),
    ]:
        if re.search(a, s, re.I):
            return re.sub(a, b, s, count=1, flags=re.I)[:140]
    return "Cette obligation ne figure pas dans la norme NF C 15-100."


def shuffle_mc(q):
    fr = list(q["optionsFr"])
    ar = list(q.get("optionsAr") or fr)
    c = q["correctAnswer"]
    order = list(range(len(fr)))
    random.Random(stable_seed(q["id"] + "sh")).shuffle(order)
    q["optionsFr"] = [fr[i] for i in order]
    q["optionsAr"] = [ar[i] for i in order]
    q["correctAnswer"] = order.index(c)


def rewrite_tableau(q):
    fr = q["questionFr"]
    m = re.match(
        r"^Tableau\s+(\S+)\s*—\s*(.+?)(?:\s*min\.?)?\s*:?\s*$", fr, re.I
    )
    if m:
        table, subject = m.group(1), m.group(2).strip()
        q["questionFr"] = (
            f"Selon la norme NF C 15-100 (référence {table}), "
            f"quelle valeur la norme impose-t-elle concernant : {subject} ?"
        )
    elif "Tableau" in fr or "tableau" in fr.lower():
        subj = fr.replace("Tableau", "").replace("tableau", "").strip(" —:()")
        q["questionFr"] = (
            "Selon la norme NF C 15-100, quelle valeur est imposée pour : "
            + clean_text(subj, 100)
            + " ?"
        )
    ef = q.get("explanationFr", "")
    if re.match(r"^(Tableau|§).{0,30}:\s*", ef) or len(ef) < 50:
        ans = ""
        if q["type"] == "multiple":
            opts = q["optionsFr"]
            if 0 <= q["correctAnswer"] < len(opts):
                ans = opts[q["correctAnswer"]]
        q["explanationFr"] = (
            f"La norme indique : {ans}. "
            f"Vérification sur {q.get('normRef', 'le PDF')} (page {q.get('pdfPage', '?')})."
        )
    return q


def rewrite_short_section(q):
    m = SECTION_SHORT.match(q["questionFr"])
    if not m:
        return q
    sec, rest = m.group(1), m.group(2).strip(" :—")
    topic = clean_text(rest, 80) or f"le paragraphe § {sec}"
    q["questionFr"] = (
        f"Selon la norme NF C 15-100 (§ {sec}), quelle affirmation correspond au texte de la norme "
        f"concernant {topic} ?"
    )
    if q["type"] == "multiple" and len(q.get("optionsFr", [])) >= 2:
        correct = q["optionsFr"][q["correctAnswer"]]
        q["explanationFr"] = (
            f"§ {sec} : la réponse correcte est « {correct} ». "
            f"Voir {q.get('normRef', 'PDF')} p. {q.get('pdfPage', '?')}."
        )
    return q


def rewrite_auto_mc(q):
    quote = clean_text(extract_quote(q["questionFr"]), 160)
    if not quote:
        quote = clean_text(q["questionFr"], 160)
    correct = quote if len(quote) > 20 else "La règle citée figure dans la norme NF C 15-100."
    q["type"] = "multiple"
    q["questionFr"] = (
        "Selon la norme NF C 15-100, quelle proposition reprend fidèlement l'exigence de la norme ?"
    )
    q["questionAr"] = "حسب معيار NF C 15-100، أي عبارة تعكس متطلب المعيار بدقة؟"
    q["optionsFr"] = [
        correct,
        false_option(correct),
        "Aucune exigence de ce type dans la norme.",
        "Règle réservée aux installations haute tension uniquement.",
    ]
    q["optionsAr"] = [
        "عبارة مطابقة للمعيار",
        "عبارة مخالفة للمعيار",
        "غير موجودة في المعيار",
        "للجهد العالي فقط",
    ]
    q["correctAnswer"] = 0
    ref = q.get("normRef", "NF C 15-100")
    page = q.get("pdfPage", "?")
    q["explanationFr"] = (
        f"La bonne réponse reprend le texte normatif. Référence : {ref}, page {page} du PDF."
    )
    q["explanationAr"] = f"الإجابة الصحيحة من نص المعيار — {ref}، ص. {page}."
    shuffle_mc(q)
    return q


def rewrite_auto_tf(q):
    quote = extract_quote(q["questionFr"])
    if quote:
        short = clean_text(quote, 120)
        q["questionFr"] = (
            "Selon la norme NF C 15-100, cette affirmation est-elle correcte ? "
            f"« {short} »"
        )
        q["questionAr"] = f"حسب معيار NF C 15-100، هل العبارة صحيحة؟ «{short[:80]}»"
    ok = q.get("correctAnswer") is True
    q["explanationFr"] = (
        ("Oui : l'affirmation est conforme au texte de la norme. ")
        if ok
        else ("Non : l'affirmation n'est pas conforme au texte de la norme (piège). ")
    ) + f"{q.get('normRef', '')} — page {q.get('pdfPage', '?')} du PDF."
    q["explanationAr"] = q["explanationFr"]
    return q


def rewrite_fill(q, mod_title):
    page = q.get("pdfPage", "")
    q["type"] = "multiple"
    q["questionFr"] = (
        f"Pour vérifier les règles du thème « {mod_title} » dans ce palier, "
        "quel document officiel la norme NF C 15-100 impose-t-elle de consulter ?"
    )
    q["questionAr"] = f"للتحقق من قواعد «{mod_title}»، أي وثيقة يجب الرجوع إليها؟"
    q["optionsFr"] = [
        "Le document NF C 15-100 (2015) — PDF de la bibliothèque SwissDZ",
        "Un catalogue fabricant uniquement",
        "Un forum de discussion en ligne",
        "Aucun texte normatif",
    ]
    q["optionsAr"] = [
        "معيار NF C 15-100 (2015) — PDF المكتبة",
        "كتالوج شركة فقط",
        "منتدى إنترنت",
        "لا وثيقة معيارية",
    ]
    q["correctAnswer"] = 0
    q["explanationFr"] = (
        f"Toutes les réponses du quiz sont relues sur le PDF NF C 15-100"
        + (f" (voir p. {page})." if page else ".")
    )
    q["normRef"] = q.get("normRef") or "NF C 15-100 — document bibliothèque"
    shuffle_mc(q)
    return q


def rewrite_question(q, mod_title):
    if q["id"] in EXACT_FIXES:
        q.update(EXACT_FIXES[q["id"]])
        return q

    fr = q.get("questionFr", "")

    if FILL.match(fr):
        return rewrite_fill(q, mod_title)
    if AUTO_MC.match(fr):
        return rewrite_auto_mc(q)
    if AUTO_TF.match(fr) and len(fr) > 90:
        return rewrite_auto_tf(q)
    if TABLEAU_Q.match(fr) or ("(Tableau" in fr and "min." in fr):
        return rewrite_tableau(q)
    if SECTION_SHORT.match(fr) and len(fr) < 120:
        return rewrite_short_section(q)

    # Explications trop courtes / tableau seul
    ef = q.get("explanationFr", "")
    if ef and (re.match(r"^(Tableau|§).{0,25}:\s*\d", ef) or len(ef) < 45):
        if q["type"] == "multiple":
            rewrite_tableau(q)
        elif q["type"] == "truefalse":
            rewrite_auto_tf(q)

    return q


def main():
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        data = json.load(open(path, encoding="utf-8"))
        title = data.get("titleFr", "module")
        for q in data["questions"]:
            rewrite_question(q, title)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("OK", os.path.basename(path))


if __name__ == "__main__":
    main()
