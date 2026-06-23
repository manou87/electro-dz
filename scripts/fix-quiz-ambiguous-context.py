#!/usr/bin/env python3
"""
Ajoute du contexte aux questions V/F dont l'énoncé commence par un pronom
(Ces, Ce, Cette, Il…) sans dire de quoi il s'agit.
"""
import json
import glob
import os
import re

MOD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data/quiz/nf-c15-100-2015/modules",
)

FR_INTRO = "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?"
AR_INTRO = "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"

# contextFr + statementFr réécrit (sujet explicite)
MANUAL = {
    "m01_L1_q04": {
        "contextFr": "§ 133.2.1 Tension",
        "contextAr": "§ 133.2.1 الجهد",
        "subjectFr": "Matériels électriques de l'installation",
        "subjectAr": "المعدات الكهربائية للمنشأة",
        "statementFr": (
            "Ces matériels doivent être appropriés à la catégorie "
            "de surtension prévue"
        ),
        "statementDisplayFr": (
            "Les matériels électriques de l'installation doivent être "
            "appropriés à la catégorie de surtension prévue"
        ),
    },
    "m03_L1_q07": {
        "contextFr": "§ 542.3.2 — liaison d'un conducteur de terre à une prise de terre (cette connexion)",
        "contextAr": "§ 542.3.2 — ربط موصل الأرض بقطب التأريض",
    },
    "m03_L1_q13": {
        "contextFr": "§ 543.4.3 — séparation neutre / PE après un point PEN (cette prescription)",
        "contextAr": "§ 543.4.3 — فصل المحايد / PE بعد نقطة PEN",
    },
    "m06_L4_q07": {
        "contextFr": "§ 771.558.4.2 — installation des tableaux de répartition divisionnaires dans les salles d'eau",
        "contextAr": "§ 771.558.4.2 — تركيب لوحات التوزيع الفرعية في غرف المياه",
    },
    "m06_L5_q04": {
        "contextFr": "§ 542.3.2 — liaison d'un conducteur de terre à une prise de terre (cette connexion)",
        "contextAr": "§ 542.3.2 — ربط موصل الأرض بقطب التأريض",
    },
    "m02_L1_q04": {
        "contextFr": "§ 411.6.3 — contrôleur permanent d'isolement (schéma IT, défaut d'isolement)",
        "contextAr": "§ 411.6.3 — مراقب العزل الدائم (نظام IT، عطل العزل)",
        "statementFr": (
            "Le contrôleur permanent d'isolement doit actionner un signal sonore "
            "ou un signal visuel"
        ),
    },
    "m02_L1_q11": {
        "contextFr": "§ 413.3 — alimentation d'un seul matériel depuis une source séparée (TBTS / séparation)",
        "contextAr": "§ 413.3 — تغذية معدة واحدة من مصدر منفصل",
        "statementFr": (
            "Cette mesure de protection n'est pas destinée à alimenter des "
            "appareils présentant un faible niveau d'isolement"
        ),
    },
    "m02_L1_q14": {
        "contextFr": "§ 411.5.2 — schéma TT, dispositif différentiel-résiduel (DDR)",
        "contextAr": "§ 411.5.2 — نظام TT، قاطع تفاضلي (DDR)",
        "statementFr": (
            "Les caractéristiques de fonctionnement du dispositif différentiel-résiduel "
            "(DDR) doivent être choisies conformément au tableau 41A"
        ),
    },
    "m02_L2_q11": {
        "contextFr": "§ 412.2 — protection par obstacle (barrière isolante)",
        "contextAr": "§ 412.2 — الحماية بحاجز عازل",
        "statementFr": (
            "La barrière isolante ne doit pas pouvoir être enlevée qu'à l'aide d'un outil"
        ),
    },
    "m02_L3_q13": {
        "contextFr": "§ 413.2 — schéma IT, liaison équipotentielle des masses (condition RA × If)",
        "contextAr": "§ 413.2 — نظام IT، الربط متساوي الجهد للكتل",
    },
    "m02_L4_q13": {
        "contextFr": "§ 414.4 — liaison équipotentielle principale (schéma IT)",
        "contextAr": "§ 414.4 — الربط متساوي الجهد الرئيسي (نظام IT)",
        "statementFr": (
            "Au système équipotentiel principal doivent être reliés les conducteurs "
            "de protection de tous les matériels, y compris ceux des prises de courant"
        ),
    },
    "m06_L1_q05": {
        "contextFr": "§ 771.514 — identification / repérage des circuits dans le logement",
        "contextAr": "§ 771.514 — تعريف/ترقيم الدوائر في المسكن",
        "statementFr": (
            "Le repérage de chaque circuit doit préciser les locaux desservis et "
            "la fonction (par exemple au moyen de pictogrammes)"
        ),
    },
    "m06_L1_q13": {
        "contextFr": "§ 771.531 — protection différentielle des circuits du logement (DDR 30 mA)",
        "contextAr": "§ 771.531 — الحماية التفاضلية لدوائر المسكن (DDR 30 mA)",
        "statementFr": (
            "Les dispositifs de protection différentielle doivent être placés à "
            "l'origine de tous les circuits à l'exception de ceux alimentés par "
            "des transformateurs de séparation"
        ),
    },
    "m06_L2_q05": {
        "contextFr": "§ 771.558.2.3 — GTL (gaine technique du logement)",
        "contextAr": "§ 771.558.2.3 — GTL (القناة التقنية للمسكن)",
    },
    "m06_L3_q07": {
        "contextFr": "§ 771.557 — emplacement des tableaux et coffrets dans le logement",
        "contextAr": "§ 771.557 — موقع اللوحات في المسكن",
        "statementFr": (
            "Les tableaux et coffrets ne doivent pas être placés dans des placards "
            "ou penderies où les objets entreposés peuvent rendre leur accès difficile"
        ),
    },
    "m06_L3_q11": {
        "contextFr": "§ 771.557 — locaux ou emplacements des tableaux électriques",
        "contextAr": "§ 771.557 — غرف أو أماكن اللوحات الكهربائية",
        "statementFr": (
            "Les locaux ou emplacements des tableaux ne doivent être ni humides, "
            "ni poussiéreux"
        ),
    },
    "m04_L1_q07": {
        "contextFr": "§ 434.2.1 — dispositifs de protection contre les courts-circuits",
        "contextAr": "§ 434.2.1 — أجهزة الحماية من القصر",
        "statementFr": (
            "Les dispositifs de protection doivent pouvoir interrompre tout courant "
            "de court-circuit inférieur ou égal au courant de court-circuit présumé"
        ),
    },
    "m03_L2_q11": {
        "contextFr": "§ 542.2.3 — électrodes de terre (prises de terre)",
        "contextAr": "§ 542.2.3 — أقطاب الأرض",
    },
}


def apply_fix(q, fix):
    q["contextFr"] = fix["contextFr"]
    q["contextAr"] = fix.get("contextAr", fix["contextFr"])
    if fix.get("subjectFr"):
        q["subjectFr"] = fix["subjectFr"]
        q["subjectAr"] = fix.get("subjectAr", fix["subjectFr"])
    if fix.get("preambleFr"):
        q["preambleFr"] = re.sub(r"\s+", " ", fix["preambleFr"]).strip()
        q["preambleAr"] = fix.get("preambleAr", q["preambleFr"])
    if fix.get("statementDisplayFr"):
        q["statementDisplayFr"] = re.sub(r"\s+", " ", fix["statementDisplayFr"]).strip()
    if fix.get("statementFr"):
        q["statementFr"] = re.sub(r"\s+", " ", fix["statementFr"]).strip()
    st = q.get("statementDisplayFr") or q.get("statementFr") or ""
    q["questionFr"] = (
        f"Concernant : {fix.get('subjectFr') or fix['contextFr']}. {FR_INTRO} « {st} »"
    )
    q["questionFr"] = re.sub(r"\s+", " ", q["questionFr"]).strip()
    q["questionAr"] = AR_INTRO


def main():
    total = 0
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        n = 0
        for q in data.get("questions", []):
            qid = q.get("id")
            if qid in MANUAL:
                apply_fix(q, MANUAL[qid])
                n += 1
        if n:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print(f"{os.path.basename(path)}: {n}")
            total += n
    print(f"Total: {total}")


if __name__ == "__main__":
    main()
