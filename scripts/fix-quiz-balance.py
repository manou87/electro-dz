#!/usr/bin/env python3
"""Rééquilibre Vrai/Faux et positions des bonnes réponses (QCM)."""
import json
import glob
import os
import random
import re
import hashlib

MOD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data/quiz/nf-c15-100-2015/modules",
)

AUTO_TF = re.compile(r"^Selon la norme NF C 15-100")
AUTO_MC = re.compile(r"^Concernant cette règle du PDF")
FILL_MC = re.compile(r"^Palier \d+ — pour approfondir")


def stable_seed(qid):
    return int(hashlib.md5(qid.encode()).hexdigest()[:8], 16)


def extract_quote(qfr):
    m = re.search(r"«\s*(.+?)\s*»", qfr, re.DOTALL)
    return m.group(1) if m else ""


def false_variant(stmt):
    s = stmt
    if re.search(r"\bne\s+doit\s+pas\b", s, re.I):
        return re.sub(r"\bne\s+doit\s+pas\b", "doit", s, count=1, flags=re.I)
    if re.search(r"\bne\s+doivent\s+pas\b", s, re.I):
        return re.sub(r"\bne\s+doivent\s+pas\b", "doivent", s, count=1, flags=re.I)
    if re.search(r"\bn'est\s+pas\b", s, re.I):
        return re.sub(r"\bn'est\s+pas\b", "est", s, count=1, flags=re.I)
    if re.search(r"\bne\s+s'applique\s+pas\b", s, re.I):
        return re.sub(r"\bne\s+s'applique\s+pas\b", "s'applique", s, count=1, flags=re.I)
    if re.search(r"\binterdit\b", s, re.I):
        return s.replace("interdit", "obligatoire", 1)
    if re.search(r"\bdoit\b", s, re.I):
        return re.sub(r"\bdoit\b", "ne doit pas", s, count=1, flags=re.I)
    if "au plus égal" in s:
        return s.replace("au plus égal", "au moins égal", 1)
    if "au moins" in s:
        return s.replace("au moins", "au plus", 1)
    if "minimum" in s:
        return s.replace("minimum", "maximum", 1)
    return s + " (formulation non conforme au texte normatif)."


def shuffle_options(q, rng):
    if q["type"] != "multiple":
        return
    fr = list(q["optionsFr"])
    ar = list(q.get("optionsAr") or fr)
    correct = q["correctAnswer"]
    indices = list(range(len(fr)))
    rng.shuffle(indices)
    q["optionsFr"] = [fr[i] for i in indices]
    q["optionsAr"] = [ar[i] for i in indices]
    q["correctAnswer"] = indices.index(correct)


def fix_question(q):
    qid = q.get("id", "")
    rng = random.Random(stable_seed(qid))

    if q["type"] == "truefalse" and AUTO_TF.match(q.get("questionFr", "")):
        quote = extract_quote(q["questionFr"])
        if quote and stable_seed(qid + "tf") % 2 == 0:
            fake = false_variant(quote)
            if fake != quote:
                q["questionFr"] = (
                    "Selon la norme NF C 15-100 : « " + fake[:200] + ("…" if len(fake) > 200 else "") + " »"
                )
                qar = q.get("questionAr", "")
                if qar.startswith("حسب معيار") or qar.startswith("حسب PDF"):
                    q["questionAr"] = "حسب معيار NF C 15-100: «" + fake[:120] + "»"
                q["correctAnswer"] = False
                q["explanationFr"] = (
                    (q.get("explanationFr") or "")
                    + " Piège : cette formulation ne correspond pas au texte exact du PDF."
                ).strip()

    if q["type"] == "multiple" and (
        AUTO_MC.match(q.get("questionFr", "")) or FILL_MC.match(q.get("questionFr", ""))
    ):
        shuffle_options(q, rng)


def main():
    for path in sorted(glob.glob(os.path.join(MOD_DIR, "*.json"))):
        data = json.load(open(path, encoding="utf-8"))
        for q in data["questions"]:
            fix_question(q)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        tf = [q for q in data["questions"] if q["type"] == "truefalse"]
        mc = [q for q in data["questions"] if q["type"] == "multiple"]
        print(
            os.path.basename(path),
            f"TF true={sum(1 for q in tf if q['correctAnswer'])} false={sum(1 for q in tf if not q['correctAnswer'])}",
            f"MC idx={dict(sorted({i: sum(1 for q in mc if q['correctAnswer']==i) for i in range(4)}.items()))}",
        )


if __name__ == "__main__":
    main()
