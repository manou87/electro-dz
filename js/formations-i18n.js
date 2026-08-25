/**
 * Page Formations — FR / AR (quiz NF C 15-100)
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Méthode d'apprentissage suisse — SwissDZ",
      "meta.desc":
        "Apprenez la norme NF C 15-100 avec le grand questionnaire interactif — 472 questions, gratuit en ligne.",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.lib": "Bibliothèque PDF",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.badge": "100 % gratuit · En ligne",
      "hero.title": "Une méthode d'apprentissage suisse en Algérie",
      "hero.sub":
        "Le grand questionnaire interactif sur la norme NF C 15-100 (2015) — pour réviser avant l'examen, le contrôle ou sur le chantier.",
      "section.quiz.hook":
        "472 questions pour maîtriser la norme NF C 15-100, pas à pas",
      "section.quiz.lead":
        "QCM, Vrai/Faux, explications immédiates et renvoi au texte officiel — sans inscription · classement optionnel avec pseudo.",
      "section.quiz.perk1": "6 modules · 472 questions · 27 visuelles (schémas)",
      "section.quiz.perk2": "Progressez à votre rythme — score à la fin de chaque module",
      "section.quiz.perk3": "Classement Top 50 : entrez avec un pseudo après chaque module",
      "cta.quiz": "Commencer le questionnaire →",
      "cta.leaderboard": "Voir le classement →",
      "cta.note": "Gratuit · mobile et ordinateur",
      "footer.copy": "© 2026 SwissDZ — electro-dz.com",
    },
    ar: {
      "meta.title": "منهج تعلّم سويسري — SwissDZ",
      "meta.desc":
        "تعلّم معيار NF C 15-100 عبر استبيان تفاعلي ضخم — 472 سؤالاً، مجاني على الموقع.",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.lib": "مكتبة PDF",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.badge": "مجاني · على الموقع",
      "hero.title": "منهج تعلّم سويسري في الجزائر",
      "hero.sub":
        "استبيان تفاعلي ضخم حول معيار NF C 15-100 (2015) — للمراجعة قبل الامتحان أو التفتيش أو على الورشة.",
      "section.quiz.hook":
        "472 سؤالاً لإتقان معيار NF C 15-100 خطوة بخطوة",
      "section.quiz.lead":
        "اختيار من متعدد، صح/خطأ، تفسير فوري — دون تسجيل · تصنيف اختياري باسم مستعار.",
      "section.quiz.perk1": "6 وحدات · 472 سؤالاً · 27 بصور مخططات",
      "section.quiz.perk2": "تقدّم على وتيرتك — النتيجة في نهاية كل وحدة",
      "section.quiz.perk3": "تصنيف Top 50: أدخل باسم مستعار بعد كل وحدة",
      "cta.quiz": "ابدأ الاستبيان الآن ←",
      "cta.leaderboard": "عرض التصنيف ←",
      "cta.note": "مجاني · هاتف وحاسوب",
      "footer.copy": "© 2026 SwissDZ — electro-dz.com",
    },
    en: {
      "meta.title": "Swiss learning method — SwissDZ",
      "meta.desc":
        "Learn NF C 15-100 with the large interactive questionnaire — 472 questions, free online.",
      "nav.home": "Home",
      "nav.train": "Training",
      "nav.docs": "Documentation",
      "nav.lib": "PDF library",
      "nav.calc": "Calculations",
      "nav.job": "Jobs",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.badge": "100% free · Online",
      "hero.title": "A Swiss learning method in Algeria",
      "hero.sub":
        "The large interactive questionnaire on NF C 15-100 (2015) — revise before the exam, inspection or on the job site.",
      "section.quiz.hook":
        "472 questions to master NF C 15-100, step by step",
      "section.quiz.lead":
        "MCQ, true/false, instant explanations and links to the official text — no sign-up · optional leaderboard with a nickname.",
      "section.quiz.perk1": "6 modules · 472 questions · 27 visuals (diagrams)",
      "section.quiz.perk2": "Progress at your own pace — score at the end of each module",
      "section.quiz.perk3": "Top 50 leaderboard: enter with a nickname after each module",
      "cta.quiz": "Start the questionnaire →",
      "cta.leaderboard": "View leaderboard →",
      "cta.note": "Free · mobile and desktop",
      "footer.copy": "© 2026 SwissDZ — electro-dz.com",
    },
  };

  var lang = "ar";

  function normalizeLang(next) {
    return next === "fr" || next === "ar" || next === "en" ? next : "ar";
  }

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function applyLang(next) {
    lang = normalizeLang(next);
    var root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("meta.title");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.desc"));

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });

    try {
      localStorage.setItem(STORAGE, lang);
    } catch (e) {}

    document.dispatchEvent(
      new CustomEvent("electrodz-lang-changed", { detail: { lang: lang } })
    );
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-lang"));
    });
  });

  var saved = "ar";
  try {
    saved = localStorage.getItem(STORAGE) || "ar";
  } catch (e) {}
  applyLang(normalizeLang(saved));
})();
