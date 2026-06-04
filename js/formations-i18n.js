/**
 * Page Formations — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Formations — DZSWISS ELEC",
      "meta.desc":
        "Formation : supports PDF suisses et quiz interactif NF C 15-100 (2015) — DZSWISS ELEC.",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.title": "Formation suisse en Algérie",
      "hero.sub":
        "Supports PDF du programme suisse et quiz NF C 15-100 pour réviser la norme avec renvois au texte officiel.",
      "hero.badge": "Quiz en ligne",
      "block.what.title": "Le modèle suisse, en Algérie",
      "block.what.p":
        "Normes, schémas, sécurité et rigueur du système suisse, pour les électriciens du bâtiment, de l'industrie et de la maintenance.",
      "block.topics.title": "Axes du parcours",
      "block.topics.li1": "Contenu suisse : installations, normes et bonnes pratiques",
      "block.topics.li2": "Savoir-faire suisse : tableaux, protections, câblage",
      "block.topics.li3": "Matériel et méthodes selon les standards suisses",
      "block.topics.li4": "Quiz NF C 15-100 : révision par modules avec explications et pages PDF",
      "cta.quiz": "Lancer le quiz",
      "section.quiz": "Quiz NF C 15-100",
      "section.quiz.sub":
        "Révision interactive de la norme (2015) — 6 modules, 5 paliers, 75 questions par module.",
      "section.quiz.desc":
        "QCM et Vrai/Faux : après chaque réponse, explication et renvoi aux paragraphes du PDF de la norme.",
      "section.quiz.stats": "450 questions au total — score en fin de chaque module.",
      "section.pdf": "Supports PDF (disponibles)",
      "section.pdf.sub": "Modules du programme suisse (FET, AE…) — lecture en ligne avec code d'accès.",
      "section.empty": "Aucun PDF formation pour le moment.",
      "link.library": "Toute la bibliothèque PDF →",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
    ar: {
      "meta.title": "التكوين — DZSWISS ELEC",
      "meta.desc":
        "تكوين: دعم PDF سويسري واختبار NF C 15-100 (2015) — DZSWISS ELEC.",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.title": "تكوين سويسري في الجزائر",
      "hero.sub":
        "دعم PDF للبرنامج السويسري واختبار NF C 15-100 لمراجعة المعيار مع إحالات إلى النص الرسمي.",
      "hero.badge": "اختبار على الموقع",
      "block.what.title": "النموذج السويسري في الجزائر",
      "block.what.p":
        "معايير ومخططات وسلامة وصرامة النظام السويسري، للكهربائيين في البناء والصناعة والصيانة.",
      "block.topics.title": "محاور المسار",
      "block.topics.li1": "محتوى سويسري: تركيبات، معايير وممارسات جيدة",
      "block.topics.li2": "خبرة سويسرية: لوحات، حمايات، تمديدات",
      "block.topics.li3": "معدات وأساليب وفق المعايير السويسرية",
      "block.topics.li4": "اختبار NF C 15-100: مراجعة حسب الوحدات مع تفسير وصفحات PDF",
      "cta.quiz": "بدء الاختبار",
      "section.quiz": "اختبار NF C 15-100",
      "section.quiz.sub":
        "مراجعة تفاعلية للمعيار (2015) — 6 وحدات، 5 مستويات، 75 سؤالاً لكل وحدة.",
      "section.quiz.desc":
        "اختيار من متعدد وصح/خطأ: بعد كل إجابة، تفسير وإحالة إلى فقرات PDF المعيار.",
      "section.quiz.stats": "450 سؤالاً — نتيجة في نهاية كل وحدة.",
      "section.pdf": "دعم PDF (متاح)",
      "section.pdf.sub": "وحدات البرنامج السويسري (FET، AE…) — قراءة على الموقع برمز وصول.",
      "section.empty": "لا يوجد PDF تكوين حالياً.",
      "link.library": "كل مكتبة PDF ←",
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
