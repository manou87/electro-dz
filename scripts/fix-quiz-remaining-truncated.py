#!/usr/bin/env python3
"""Corrige les dernières questions encore tronquées (suffixe piège ou PDF difficile)."""
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
TRAP_SUFFIX = "(formulation non conforme au texte normatif.)"

MANUAL = {
    "m01_L3_q10": (
        "Les matériels électriques doivent être installés de manière à "
        "assurer les conditions de refroidissement prévues."
    ),
    "m04_L1_q07": (
        "Ils doivent pouvoir interrompre tout courant de court-circuit inférieur "
        "ou égal au courant de court-circuit présumé."
    ),
    "m03_L3_q08": (
        "De plus, il ne doit pas aussi satisfaire à celles relatives à la mise à la "
        "terre et aux liaisons équipotentielles fonctionnelles (voir 545). "
        + TRAP_SUFFIX
    ),
    "m05_L2_q07": (
        "Par exemple, s'il est possible de relier certains éléments conducteurs et "
        "masses à l'intérieur de la salle d'eau, cette liaison peut être réalisée "
        "à l'extérieur dans des locaux au plus près de la salle d'eau. "
        + TRAP_SUFFIX
    ),
    "m05_L2_q08": (
        "701.320.3 Les cabines de douche individuelles doivent répondre aux "
        "prescriptions des paragraphes 701.1 à 701.5."
    ),
    "m05_L2_q10": (
        "701.520.03 Les boîtes de connexion ne sont pas admises dans les volumes "
        "0, 1 et 2. " + TRAP_SUFFIX
    ),
    "m06_L2_q07": (
        "Les croisements entre ces canalisations doivent être évités au maximum "
        "et être réalisés à 90. " + TRAP_SUFFIX
    ),
    "m06_L3_q03": None,  # special full question rewrite
    "m06_L4_q07": (
        "Elle est interdite dans les volumes 0, 1, 2 et 3 définis dans la "
        "partie 7-701. " + TRAP_SUFFIX
    ),
}


def apply_tf(q, quote):
    q["statementFr"] = quote
    q["questionFr"] = f"{FR_INTRO} « {quote} »"
    if q.get("type") == "truefalse":
        q["questionAr"] = AR_INTRO


def fix_m06_L3_q03(q):
    q["questionFr"] = (
        "Selon la norme NF C 15-100 (§ 771.558), en réhabilitation totale avec "
        "redistribution des cloisons des locaux d'habitation, la GTL doit-elle "
        "être matérialisée ?"
    )
    q["questionAr"] = (
        "حسب § 771.558: عند إعادة تأهيل كلية مع إعادة توزيع الحواجز، "
        "هل يجب تجسيد GTL؟"
    )
    q.pop("statementFr", None)


def main():
    n = 0
    for path in glob.glob(os.path.join(MOD_DIR, "*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        changed = False
        for q in data.get("questions", []):
            qid = q.get("id")
            if qid not in MANUAL:
                if any("…" in (q.get(f) or "") for f in ("questionFr", "statementFr")):
                    # suffixe piège générique
                    for field in ("questionFr", "statementFr"):
                        v = q.get(field) or ""
                        if "formulation non conforme au texte…" in v:
                            q[field] = v.replace(
                                "formulation non conforme au texte…",
                                TRAP_SUFFIX,
                            )
                            changed = True
                continue
            if qid == "m06_L3_q03":
                fix_m06_L3_q03(q)
            else:
                apply_tf(q, MANUAL[qid])
            changed = True
            n += 1
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
    print(f"Corrigées manuellement: {n}")


if __name__ == "__main__":
    main()
