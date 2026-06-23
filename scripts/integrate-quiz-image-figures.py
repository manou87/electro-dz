#!/usr/bin/env python3
"""
Extrait les figures quiz (schéma seul) et injecte les questions image dans les modules.
Usage : python3 scripts/integrate-quiz-image-figures.py
"""
import io
import json
import os
import shutil

import fitz
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf")
FIG_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/figures")
MOD_DIR = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/modules")
STATS_PATH = os.path.join(ROOT, "data/quiz/nf-c15-100-2015/quiz-stats.json")
SCALE = 2.0

# (fichier prod, page, clip, masques optionnels)
FIGURES = {
    "m01-fig-312A-tns.png": (72, (88, 306, 518, 438), []),
    "m01-fig-312B-tncs.png": (72, (88, 548, 518, 692), []),
    "m01-fig-312C-tnc.png": (73, (88, 128, 518, 225), []),
    "m01-fig-312D-tt.png": (73, (88, 328, 518, 512), []),
    "m01-fig-312E-it.png": (74, (88, 182, 518, 375), []),
    "m01-fig-312F-tns-cc.png": (76, (88, 188, 518, 448), []),
    "m01-fig-312G-tnc-cc.png": (77, (88, 188, 518, 448), []),
    "m02-fig-411A-boucle-tn.png": (99, (55, 145, 540, 268), []),
    "m02-fig-411B-boucle-tt.png": (101, (55, 98, 540, 268), []),
    "m02-fig-411C-boucle-it-isole.png": (102, (55, 618, 540, 758), []),
    "m02-fig-411D-boucle-it-neutre.png": (103, (55, 125, 540, 348), []),
    "m02-fig-411E-double-defaut-it.png": (105, (55, 215, 540, 388), []),
    "m04-fig-534A-parafoudre-tn.png": (283, (55, 78, 540, 385), []),
    "m04-fig-534B-parafoudre-tt.png": (283, (55, 408, 540, 738), []),
    "m04-fig-534C-parafoudre-it.png": (284, (55, 78, 540, 438), []),
    "m05-fig-701C-douches.png": (390, (55, 175, 540, 278), [(52, 248, 220, 285)]),
    "m05-fig-701D-douches.png": (390, (55, 300, 540, 498), [(52, 462, 240, 500)]),
    "m05-fig-701E-douches.png": (390, (55, 530, 540, 758), [(52, 718, 200, 760)]),
    "m05-fig-702A-piscine.png": (402, (55, 198, 540, 598), [(52, 595, 200, 655)]),
    "m05-fig-702B-bassin.png": (403, (55, 248, 540, 720), []),
    "m05-fig-702C-volumes.png": (404, (55, 125, 540, 700), []),
    "m05-fig-702D-volumes.png": (405, (55, 195, 540, 700), []),
    "m05-fig-702E-fontaine.png": (406, (55, 265, 540, 700), []),
    "m06-fig-562A-branchement.png": (357, (55, 198, 540, 355), []),
    "m06-fig-562B-branchement.png": (357, (55, 508, 540, 655), []),
    "m06-fig-771A-gtl-parois.png": (480, (55, 95, 540, 575), []),
    "m06-fig-771B-gtl-goulottes.png": (481, (55, 95, 540, 348), []),
}

IMG_BASE = "data/quiz/nf-c15-100-2015/figures/"

NEW_QUESTIONS = [
    # M01 — courant continu (312F/G)
    {
        "module": "M01_champ_application.json",
        "id": "m01_L2_q16",
        "image": "m01-fig-312F-tns-cc.png",
        "questionFr": "Quel schéma de liaison à la terre en courant continu est représenté sur cette figure ?",
        "questionAr": "أي مخطط تأريض في التيار المستمر يمثّله هذا الشكل؟",
        "optionsFr": ["Schéma TN-S", "Schéma TN-C", "Schéma TT"],
        "optionsAr": ["TN-S", "TN-C", "TT"],
        "correctAnswer": 0,
        "explanationFr": "PE séparé du conducteur relié à la terre sur tout le schéma → TN-S en courant continu (Figure 312F, § 312.2.4).",
        "explanationAr": "PE منفصل → TN-S في تيار مستمر.",
        "normRef": "NF C 15-100 — Figure 312F (§ 312.2.4)",
        "pdfPage": 76,
        "captionFr": "Schéma de liaison à la terre — courant continu (sans légende)",
    },
    {
        "module": "M01_champ_application.json",
        "id": "m01_L2_q17",
        "image": "m01-fig-312G-tnc-cc.png",
        "questionFr": "Quel schéma de liaison à la terre en courant continu est représenté sur cette figure ?",
        "questionAr": "أي مخطط تأريض في التيار المستمر يمثّله هذا الشكل؟",
        "optionsFr": ["Schéma TN-C", "Schéma TN-S", "Schéma IT"],
        "optionsAr": ["TN-C", "TN-S", "IT"],
        "correctAnswer": 0,
        "explanationFr": "Conducteur de protection combiné au neutre (PEN) → TN-C en courant continu (Figure 312G).",
        "explanationAr": "PEN → TN-C في تيار مستمر.",
        "normRef": "NF C 15-100 — Figure 312G (§ 312.2.4)",
        "pdfPage": 77,
        "captionFr": "Schéma de liaison à la terre — courant continu (sans légende)",
    },
    # M02 — boucles 411
    {
        "module": "M02_protection_personnes.json",
        "id": "m02_L2_q16",
        "image": "m02-fig-411A-boucle-tn.png",
        "questionFr": "Quel type de boucle de défaut est représenté sur cette figure (schémas TN) ?",
        "questionAr": "أي نوع من حلقة العطل يمثّله هذا الشكل (مخططات TN)؟",
        "optionsFr": ["Boucle en schéma TN-C ou TN-S", "Boucle en schéma TT", "Boucle en schéma IT"],
        "optionsAr": ["حلقة TN-C أو TN-S", "حلقة TT", "حلقة IT"],
        "correctAnswer": 0,
        "explanationFr": "Défaut phase-masse, retour du courant par le PE/PEN vers la source → boucles TN (Figure 411A).",
        "explanationAr": "عطل phase-masse مع عودة عبر PE/PEN → TN.",
        "normRef": "NF C 15-100 — Figure 411A (§ 411)",
        "pdfPage": 99,
        "captionFr": "Boucle de défaut — schéma seul",
    },
    {
        "module": "M02_protection_personnes.json",
        "id": "m02_L2_q17",
        "image": "m02-fig-411B-boucle-tt.png",
        "questionFr": "Quel schéma de liaison à la terre correspond à cette boucle de défaut ?",
        "questionAr": "أي مخطط تأريض يطابق حلقة العطل هذه؟",
        "optionsFr": ["Schéma TT", "Schéma TN-S", "Schéma IT"],
        "optionsAr": ["TT", "TN-S", "IT"],
        "correctAnswer": 0,
        "explanationFr": "Masse sur prise de terre locale, retour de défaut par la terre → TT (Figure 411B).",
        "explanationAr": "كتلة على أرضية محلية → TT.",
        "normRef": "NF C 15-100 — Figure 411B (§ 411)",
        "pdfPage": 101,
        "captionFr": "Boucle de défaut — schéma seul",
    },
    {
        "module": "M02_protection_personnes.json",
        "id": "m02_L2_q18",
        "image": "m02-fig-411C-boucle-it-isole.png",
        "questionFr": "Quel régime correspond à ce premier défaut (installation isolée de la terre) ?",
        "questionAr": "أي نظام يطابق هذا العطل الأول (تركيب معزول عن الأرض)؟",
        "optionsFr": ["Schéma IT", "Schéma TT", "Schéma TN-S"],
        "optionsAr": ["IT", "TT", "TN-S"],
        "correctAnswer": 0,
        "explanationFr": "Point d'alimentation isolé de la terre, premier défaut limité → IT (Figure 411C).",
        "explanationAr": "نقطة تغذية معزولة → IT.",
        "normRef": "NF C 15-100 — Figure 411C (§ 411)",
        "pdfPage": 102,
        "captionFr": "Premier défaut IT — schéma seul",
    },
    {
        "module": "M02_protection_personnes.json",
        "id": "m02_L2_q19",
        "image": "m02-fig-411D-boucle-it-neutre.png",
        "questionFr": "En schéma IT, comment le neutre est-il relié à la terre sur ce schéma de premier défaut ?",
        "questionAr": "في مخطط IT، كيف يُربط المحايد بالأرض في هذا العطل الأول؟",
        "optionsFr": ["Via une impédance", "Par liaison directe (court-circuit)", "Sans aucune liaison à la terre"],
        "optionsAr": ["عبر معاوقة", "ربط مباشر", "بدون ربط بالأرض"],
        "correctAnswer": 0,
        "explanationFr": "Neutre relié à la terre par impédance → premier défaut IT (Figure 411D).",
        "explanationAr": "محايد مربوط بالأرض عبر معاوقة.",
        "normRef": "NF C 15-100 — Figure 411D (§ 411)",
        "pdfPage": 103,
        "captionFr": "Premier défaut IT — schéma seul",
    },
    {
        "module": "M02_protection_personnes.json",
        "id": "m02_L2_q20",
        "image": "m02-fig-411E-double-defaut-it.png",
        "questionFr": "Quel cas de défaut est illustré sur cette figure ?",
        "questionAr": "أي حالة عطل يوضّحها هذا الشكل؟",
        "optionsFr": ["Double défaut en schéma IT", "Premier défaut IT isolé", "Défaut en schéma TT"],
        "optionsAr": ["عطل مزدوج IT", "عطل أول IT", "عطل TT"],
        "correctAnswer": 0,
        "explanationFr": "Deux défauts simultanés sur masses en IT → double défaut (Figure 411E).",
        "explanationAr": "عطلان على كتلتين → عطل مزدوج IT.",
        "normRef": "NF C 15-100 — Figure 411E (§ 411)",
        "pdfPage": 105,
        "captionFr": "Double défaut IT — schéma seul",
    },
    # M04 — parafoudres 534
    {
        "module": "M04_circuits_protections.json",
        "id": "m04_L2_q16",
        "image": "m04-fig-534A-parafoudre-tn.png",
        "questionFr": "Quelle mise en œuvre de parafoudre est représentée sur ce schéma ?",
        "questionAr": "أي تركيب لمانع الصواعق يمثّله هذا المخطط؟",
        "optionsFr": ["Parafoudre en schéma TN", "Parafoudre en schéma TT", "Parafoudre en schéma IT"],
        "optionsAr": ["مانع صواعق TN", "مانع صواعق TT", "مانع صواعق IT"],
        "correctAnswer": 0,
        "explanationFr": "Raccordement du parafoudre caractéristique du schéma TN (Figure 534A).",
        "explanationAr": "توصيل مانع صواعق في مخطط TN.",
        "normRef": "NF C 15-100 — Figure 534A (§ 534)",
        "pdfPage": 283,
        "captionFr": "Parafoudre — schéma seul",
    },
    {
        "module": "M04_circuits_protections.json",
        "id": "m04_L2_q17",
        "image": "m04-fig-534B-parafoudre-tt.png",
        "questionFr": "Quelle mise en œuvre de parafoudre est représentée sur ce schéma ?",
        "questionAr": "أي تركيب لمانع الصواعق يمثّله هذا المخطط؟",
        "optionsFr": ["Parafoudre en schéma TT", "Parafoudre en schéma TN", "Parafoudre en schéma IT"],
        "optionsAr": ["مانع صواعق TT", "مانع صواعق TN", "مانع صواعق IT"],
        "correctAnswer": 0,
        "explanationFr": "Raccordement adapté au schéma TT (Figure 534B).",
        "explanationAr": "توصيل في مخطط TT.",
        "normRef": "NF C 15-100 — Figure 534B (§ 534)",
        "pdfPage": 283,
        "captionFr": "Parafoudre — schéma seul",
    },
    {
        "module": "M04_circuits_protections.json",
        "id": "m04_L2_q18",
        "image": "m04-fig-534C-parafoudre-it.png",
        "questionFr": "Quelle mise en œuvre de parafoudre est représentée sur ce schéma ?",
        "questionAr": "أي تركيب لمانع الصواعق يمثّله هذا المخطط؟",
        "optionsFr": ["Parafoudre en schéma IT", "Parafoudre en schéma TN", "Parafoudre en schéma TT"],
        "optionsAr": ["مانع صواعق IT", "مانع صواعق TN", "مانع صواعق TT"],
        "correctAnswer": 0,
        "explanationFr": "Raccordement en schéma IT (Figure 534C).",
        "explanationAr": "توصيل في مخطط IT.",
        "normRef": "NF C 15-100 — Figure 534C (§ 534)",
        "pdfPage": 284,
        "captionFr": "Parafoudre — schéma seul",
    },
    # M05 — volumes 701/702
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q16",
        "image": "m05-fig-701C-douches.png",
        "questionFr": "Selon la NF C 15-100 (§ 701), quel aménagement de salle de douches est représenté sur ce plan ?",
        "questionAr": "حسب § 701، أي ترتيب لغرف الاستحمام يمثّله هذا المخطط؟",
        "optionsFr": [
            "Cabines de douche et déshabilloir individuel",
            "Cabines sans déshabilloir individuel",
            "Salle de douches sans cabine",
        ],
        "optionsAr": ["مقصورات + غرفة تبديل", "مقصورات بدون تبديل", "بدون مقصورة"],
        "correctAnswer": 0,
        "explanationFr": "Zones distinctes cabines + déshabilloir → Figure 701C p. 390.",
        "explanationAr": "مقصورات مع غرفة تبديل → 701C.",
        "normRef": "NF C 15-100 — Figure 701C (§ 701)",
        "pdfPage": 390,
        "captionFr": "Plan salles de douches — sans légende textuelle",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q17",
        "image": "m05-fig-701D-douches.png",
        "questionFr": "Selon la NF C 15-100 (§ 701), quel aménagement de salle de douches est représenté sur ce plan ?",
        "questionAr": "حسب § 701، أي ترتيب لغرف الاستحمام يمثّله هذا المخطط؟",
        "optionsFr": [
            "Cabines sans déshabilloir individuel",
            "Cabines avec déshabilloir individuel",
            "Salle sans cabine de douche",
        ],
        "optionsAr": ["مقصورات بدون تبديل", "مقصورات + تبديل", "بدون مقصورة"],
        "correctAnswer": 0,
        "explanationFr": "Cabines seules, sans déshabilloir individuel → Figure 701D.",
        "explanationAr": "مقصورات بدون غرفة تبديل فردية.",
        "normRef": "NF C 15-100 — Figure 701D (§ 701)",
        "pdfPage": 390,
        "captionFr": "Plan salles de douches — sans légende textuelle",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q18",
        "image": "m05-fig-701E-douches.png",
        "questionFr": "Selon la NF C 15-100 (§ 701), quel aménagement de salle de douches est représenté sur ce plan ?",
        "questionAr": "حسب § 701، أي ترتيب لغرف الاستحمام يمثّله هذا المخطط؟",
        "optionsFr": [
            "Salle de douches sans cabine",
            "Cabines avec déshabilloir",
            "Cabines sans déshabilloir",
        ],
        "optionsAr": ["بدون مقصورة", "مقصورات + تبديل", "مقصورات فقط"],
        "correctAnswer": 0,
        "explanationFr": "Douches en volume commun sans cabine → Figure 701E.",
        "explanationAr": "استحمام بدون مقصورة.",
        "normRef": "NF C 15-100 — Figure 701E (§ 701)",
        "pdfPage": 390,
        "captionFr": "Plan salles de douches — sans légende textuelle",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q19",
        "image": "m05-fig-702A-piscine.png",
        "questionFr": "Sur ce schéma de bassin (piscine ou pédiluve), quelle zone correspond au volume 0 ?",
        "questionAr": "على مخطط الحوض، أي منطقة تمثّل الحجم 0؟",
        "optionsFr": [
            "L'intérieur du bassin (eau)",
            "La bande de 2 m autour du bassin",
            "La zone au-delà du volume 1",
        ],
        "optionsAr": ["داخل الحوض", "شريحة 2 م حول الحوض", "خارج الحجم 1"],
        "correctAnswer": 0,
        "explanationFr": "Volume 0 = intérieur du bassin contenant l'eau (Figure 702A).",
        "explanationAr": "الحجم 0 = داخل الحوض.",
        "normRef": "NF C 15-100 — Figure 702A (§ 702)",
        "pdfPage": 402,
        "captionFr": "Volumes piscine / pédiluve — schéma seul",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q20",
        "image": "m05-fig-702B-bassin.png",
        "questionFr": "Pour un bassin au-dessus du sol, quelle distance horizontale sépare le volume 0 du volume 1 ?",
        "questionAr": "لحوض فوق الأرض، ما المسافة الأفقية بين الحجم 0 والحجم 1؟",
        "optionsFr": ["2,0 m", "1,5 m", "0,60 m"],
        "optionsAr": ["2,0 م", "1,5 م", "0,60 م"],
        "correctAnswer": 0,
        "explanationFr": "Volume 1 à 2,0 m horizontalement du volume 0 pour bassin au-dessus du sol (Figure 702B).",
        "explanationAr": "الحجم 1 على بعد 2,0 م أفقياً.",
        "normRef": "NF C 15-100 — Figure 702B (§ 702)",
        "pdfPage": 403,
        "captionFr": "Bassin au-dessus du sol — schéma seul",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q21",
        "image": "m05-fig-702C-volumes.png",
        "questionFr": "Sur ce plan avec cloison, le volume 2 s'étend jusqu'à :",
        "questionAr": "على هذا المخطط مع حاجز، يمتد الحجم 2 حتى:",
        "optionsFr": [
            "La cloison (limite du volume 2)",
            "Au-delà de la cloison dans la pièce voisine",
            "Uniquement à l'intérieur du volume 0",
        ],
        "optionsAr": ["الحاجز", "ما بعد الحاجز", "داخل الحجم 0 فقط"],
        "correctAnswer": 0,
        "explanationFr": "Le volume 2 est limité par les parois et cloisons fixes (Figure 702C).",
        "explanationAr": "الحجم 2 محدود بالحواجز.",
        "normRef": "NF C 15-100 — Figure 702C (§ 702)",
        "pdfPage": 404,
        "captionFr": "Volumes avec cloison — plan seul",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q22",
        "image": "m05-fig-702D-volumes.png",
        "questionFr": "Sur cette variante de plan avec cloison, le point d'eau se situe en :",
        "questionAr": "في هذا المخطط مع حاجز، نقطة الماء في:",
        "optionsFr": ["Volume 1", "Volume 2", "Volume 0"],
        "optionsAr": ["الحجم 1", "الحجم 2", "الحجم 0"],
        "correctAnswer": 0,
        "explanationFr": "Le point d'eau est dans le volume 1 selon la figure 702D.",
        "explanationAr": "نقطة الماء في الحجم 1.",
        "normRef": "NF C 15-100 — Figure 702D (§ 702)",
        "pdfPage": 405,
        "captionFr": "Volumes avec cloison — variante",
    },
    {
        "module": "M05_locaux_humides.json",
        "id": "m05_L2_q23",
        "image": "m05-fig-702E-fontaine.png",
        "questionFr": "Sur ce schéma de fontaine, quelle zone correspond au volume 0 ?",
        "questionAr": "على مخطط النافورة، أي منطقة تمثّل الحجم 0؟",
        "optionsFr": [
            "Le bassin recevant l'eau",
            "La zone de projection au sol",
            "La zone extérieure au volume 2",
        ],
        "optionsAr": ["الحوض", "منطقة الرش على الأرض", "خارج الحجم 2"],
        "correctAnswer": 0,
        "explanationFr": "Volume 0 de la fontaine = bassin (Figure 702E).",
        "explanationAr": "الحجم 0 = الحوض.",
        "normRef": "NF C 15-100 — Figure 702E (§ 702)",
        "pdfPage": 406,
        "captionFr": "Fontaine — volumes (schéma seul)",
    },
    # M06 — branchement & GTL
    {
        "module": "M06_tableau_gtl.json",
        "id": "m06_L2_q16",
        "image": "m06-fig-562A-branchement.png",
        "questionFr": "Quel type de branchement est représenté sur ce schéma ?",
        "questionAr": "أي نوع توصيل يمثّله هذا المخطط؟",
        "optionsFr": [
            "Branchement à puissance limitée",
            "Branchement à puissance surveillée",
            "Branchement normal sans limitation",
        ],
        "optionsAr": ["قدرة محدودة", "قدرة مراقبة", "توصيل عادي"],
        "correctAnswer": 0,
        "explanationFr": "Dispositif complémentaire de coupure d'urgence en aval de l'AGCP → puissance limitée (Figure 562A).",
        "explanationAr": "جهاز إيقاف طوارئ إضافي → قدرة محدودة.",
        "normRef": "NF C 15-100 — Figure 562A (§ 562)",
        "pdfPage": 357,
        "captionFr": "Schéma AGCP — sans texte explicatif",
    },
    {
        "module": "M06_tableau_gtl.json",
        "id": "m06_L2_q17",
        "image": "m06-fig-562B-branchement.png",
        "questionFr": "Quel type de branchement est représenté sur ce schéma ?",
        "questionAr": "أي نوع توصيل يمثّله هذا المخطط؟",
        "optionsFr": [
            "Branchement à puissance surveillée",
            "Branchement à puissance limitée",
            "Branchement provisoire de chantier",
        ],
        "optionsAr": ["قدرة مراقبة", "قدرة محدودة", "توصيل مؤقت"],
        "correctAnswer": 0,
        "explanationFr": "AGCP utilisable comme coupure d'urgence, circuit sécurité en amont → puissance surveillée (Figure 562B).",
        "explanationAr": "AGCP كإيقاف طوارئ → قدرة مراقبة.",
        "normRef": "NF C 15-100 — Figure 562B (§ 562)",
        "pdfPage": 357,
        "captionFr": "Schéma branchement — sans texte explicatif",
    },
    {
        "module": "M06_tableau_gtl.json",
        "id": "m06_L2_q18",
        "image": "m06-fig-771A-gtl-parois.png",
        "questionFr": "Comment est matérialisée la GTL sur cet exemple ?",
        "questionAr": "كيف نُفّذت GTL في هذا المثال؟",
        "optionsFr": [
            "Par parois (local dédié)",
            "Par goulottes et coffrets saillants",
            "Sans GTL (câbles apparents)",
        ],
        "optionsAr": ["بجدران (غرفة مخصصة)", "بقنوات بارزة", "بدون GTL"],
        "correctAnswer": 0,
        "explanationFr": "GTL délimitée par parois formant un volume dédié (Figure 771A).",
        "explanationAr": "GTL بجدران في غرفة مخصصة.",
        "normRef": "NF C 15-100 — Figure 771A (§ 771)",
        "pdfPage": 480,
        "captionFr": "GTL — exemple sans titre de figure",
    },
    {
        "module": "M06_tableau_gtl.json",
        "id": "m06_L2_q19",
        "image": "m06-fig-771B-gtl-goulottes.png",
        "questionFr": "Comment est réalisée cette GTL saillie ?",
        "questionAr": "كيف نُفّذت GTL البارزة؟",
        "optionsFr": [
            "Par goulottes et coffrets saillants",
            "Par parois d'un local dédié",
            "Enterrée sous dalle uniquement",
        ],
        "optionsAr": ["بقنوات وصناديق", "بجدران غرفة", "مدفونة فقط"],
        "correctAnswer": 0,
        "explanationFr": "GTL saillie par goulottes et coffrets (Figure 771B).",
        "explanationAr": "GTL بارزة بقنوات وصناديق.",
        "normRef": "NF C 15-100 — Figure 771B (§ 771)",
        "pdfPage": 481,
        "captionFr": "GTL saillie — sans titre de figure",
    },
]


def page_masks_to_pixels(clip, masks, scale):
    return [
        (
            (m[0] - clip.x0) * scale,
            (m[1] - clip.y0) * scale,
            (m[2] - clip.x0) * scale,
            (m[3] - clip.y0) * scale,
        )
        for m in masks
    ]


def extract_figure(page, page_num, rect, masks, out_path):
    clip = fitz.Rect(*rect)
    mat = fitz.Matrix(SCALE, SCALE)
    pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    if masks:
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        draw = ImageDraw.Draw(img)
        for x0, y0, x1, y1 in page_masks_to_pixels(clip, masks, SCALE):
            draw.rectangle([x0, y0, x1, y1], fill=(255, 255, 255))
        img.save(out_path)
    else:
        pix.save(out_path)


def build_question(qdef):
    return {
        "id": qdef["id"],
        "level": 2,
        "difficulty": "moyen",
        "type": "image",
        "questionFr": qdef["questionFr"],
        "questionAr": qdef["questionAr"],
        "imageUrl": IMG_BASE + qdef["image"],
        "imageCaptionFr": qdef["captionFr"],
        "imageCaptionAr": qdef.get("captionAr", qdef["captionFr"]),
        "optionsFr": qdef["optionsFr"],
        "optionsAr": qdef["optionsAr"],
        "correctAnswer": qdef["correctAnswer"],
        "explanationFr": qdef["explanationFr"],
        "explanationAr": qdef["explanationAr"],
        "normRef": qdef["normRef"],
        "pdfPage": qdef["pdfPage"],
    }


def insert_after_level(questions, level, new_items):
    """Insère les nouvelles questions à la fin du palier `level`."""
    last_idx = -1
    for i, q in enumerate(questions):
        if q.get("level") == level:
            last_idx = i
    if last_idx < 0:
        questions.extend(new_items)
        return
    for j, item in enumerate(new_items):
        questions.insert(last_idx + 1 + j, item)


def main():
    os.makedirs(FIG_DIR, exist_ok=True)
    doc = fitz.open(PDF)

    needed_images = set()
    for q in NEW_QUESTIONS:
        needed_images.add(q["image"])
    for fname in needed_images:
        if fname not in FIGURES:
            raise SystemExit(f"Figure manquante dans FIGURES: {fname}")
        page_num, rect, masks = FIGURES[fname]
        page = doc[page_num - 1]
        out_path = os.path.join(FIG_DIR, fname)
        extract_figure(page, page_num, rect, masks, out_path)
        print(f"✓ image {fname}")

    doc.close()

    by_module = {}
    for qdef in NEW_QUESTIONS:
        by_module.setdefault(qdef["module"], []).append(qdef)

    added = 0
    skipped = 0
    for mod_file, qdefs in by_module.items():
        path = os.path.join(MOD_DIR, mod_file)
        data = json.load(open(path, encoding="utf-8"))
        existing_ids = {q["id"] for q in data["questions"]}
        to_add = []
        for qdef in qdefs:
            if qdef["id"] in existing_ids:
                skipped += 1
                continue
            to_add.append(build_question(qdef))
        if to_add:
            insert_after_level(data["questions"], 2, to_add)
            added += len(to_add)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print(f"✓ {mod_file}: +{len(to_add)} questions image")
        else:
            print(f"· {mod_file}: déjà à jour")

    # Stats globales
    stats = {
        "generatedAt": "2026-06-11",
        "modules": {},
        "totals": {
            "questions": 0,
            "image": 0,
            "multiple": 0,
            "truefalse": 0,
            "addedThisRun": added,
        },
    }
    for path in sorted(os.listdir(MOD_DIR)):
        if not path.endswith(".json") or path.startswith("DEMO"):
            continue
        data = json.load(open(os.path.join(MOD_DIR, path), encoding="utf-8"))
        qs = data["questions"]
        types = {}
        levels = {}
        for q in qs:
            t = q.get("type", "?")
            types[t] = types.get(t, 0) + 1
            lv = q.get("level", 1)
            levels[str(lv)] = levels.get(str(lv), 0) + 1
            stats["totals"]["questions"] += 1
            if t in stats["totals"]:
                stats["totals"][t] += 1
        mod_id = data.get("moduleId", path[:3])
        stats["modules"][mod_id] = {
            "file": path,
            "questions": len(qs),
            "byType": types,
            "byLevel": levels,
            "imageAdded": types.get("image", 0) - (5 if mod_id == "M01" else 0),
        }

    stats["totals"]["imageQuestionsNew"] = 22
    stats["totals"]["questionsBefore"] = 450
    stats["totals"]["questionsAfter"] = stats["totals"]["questions"]

    with open(STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\n=== BILAN ===")
    print(f"Questions ajoutées ce run : {added} (ignorées car déjà là : {skipped})")
    print(f"Total questions quiz     : {stats['totals']['questions']}")
    print(f"Dont questions image     : {stats['totals']['image']}")
    print(f"  · multiple             : {stats['totals']['multiple']}")
    print(f"  · vrai/faux            : {stats['totals']['truefalse']}")
    print(f"Stats → {STATS_PATH}")


if __name__ == "__main__":
    main()
