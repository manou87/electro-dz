/**
 * Page Formations — FR / AR (quiz NF C 15-100)
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Méthode d'apprentissage suisse — DZSWISS ELEC",
      "meta.desc":
        "Apprenez la norme NF C 15-100 avec le grand questionnaire interactif — 450 questions, gratuit en ligne.",
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
        "450 questions pour maîtriser la norme NF C 15-100, pas à pas",
      "section.quiz.lead":
        "QCM, Vrai/Faux, explications immédiates et renvoi au texte officiel après chaque réponse — sans inscription.",
      "section.quiz.perk1": "6 modules · 5 paliers · 75 questions par module",
      "section.quiz.perk2": "Progressez à votre rythme — score à la fin de chaque module",
      "section.quiz.perk3": "Révision ciblée : norme NF C 15-100 (2015) intégrée au site",
      "cta.quiz": "Commencer le questionnaire →",
      "cta.note": "Gratuit · mobile et ordinateur",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
    ar: {
      "meta.title": "منهج تعلّم سويسري — DZSWISS ELEC",
      "meta.desc":
        "تعلّم معيار NF C 15-100 عبر استبيان تفاعلي ضخم — 450 سؤالاً، مجاني على الموقع.",
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
        "450 سؤالاً لإتقان معيار NF C 15-100 خطوة بخطوة",
      "section.quiz.lead":
        "اختيار من متعدد، صح/خطأ، تفسير فوري وإحالة إلى النص الرسمي بعد كل إجابة — دون تسجيل.",
      "section.quiz.perk1": "6 وحدات · 5 مستويات · 75 سؤالاً لكل وحدة",
      "section.quiz.perk2": "تقدّم على وتيرتك — النتيجة في نهاية كل وحدة",
      "section.quiz.perk3": "مراجعة موجهة: معيار NF C 15-100 (2015) على الموقع",
      "cta.quiz": "ابدأ الاستبيان الآن ←",
      "cta.note": "مجاني · هاتف وحاسوب",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
  };

  var lang = "ar";

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function applyLang(next) {
    lang = next === "fr" ? "fr" : "ar";
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
  if (saved !== "fr" && saved !== "ar") saved = "ar";
  applyLang(saved);
})();
