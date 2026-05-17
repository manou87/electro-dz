/**
 * Page Formations — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Formations — DZSWISS ELEC",
      "meta.desc":
        "Bientôt de super nouvelles en Algérie : formations vidéo et parcours pour électriciens.",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.title": "Formations vidéo",
      "hero.sub":
        "Bientôt de super nouvelles en Algérie — parcours terrain, sécurité, automatisation et certifications en préparation.",
      "soon.badge": "Annonce imminente",
      "block.what.title": "Ce qui arrive",
      "block.what.p":
        "Des modules vidéo courts et des parcours complets pour les électriciens du bâtiment, de l’industrie et de la maintenance. Contenus en français et en arabe, pensés pour le terrain algérien.",
      "block.topics.title": "Thèmes prévus",
      "block.topics.li1": "Installations domestiques et tertiaires (normes, schémas, sécurité)",
      "block.topics.li2": "Tableaux, protections et câblage",
      "block.topics.li3": "Automatismes et dépannage",
      "block.topics.li4": "Stages et partenariats centres de formation",
      "block.notify.title": "Être informé en premier",
      "block.notify.p":
        "Suivez la page Facebook Electro DZ ou écrivez-nous sur WhatsApp — nous annoncerons le lancement des premières formations en Algérie.",
      "cta.wa": "WhatsApp",
      "cta.fb": "Facebook Electro DZ",
      "cta.contact": "Page contact",
      "section.pdf": "Supports PDF (déjà disponibles)",
      "section.pdf.sub": "Cours et modules suisses — ouverture dans le lecteur du site.",
      "section.video": "Vidéos Algérie",
      "section.video.soon": "Bientôt de super nouvelles en Algérie — les premières vidéos seront publiées ici.",
      "section.empty": "Aucun PDF formation pour le moment.",
      "link.library": "Toute la bibliothèque PDF →",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
    ar: {
      "meta.title": "التكوين — DZSWISS ELEC",
      "meta.desc":
        "قريباً أخبار رائعة في الجزائر: تكوينات فيديو ومسارات للكهربائيين.",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.title": "تكوين بالفيديو",
      "hero.sub":
        "قريباً أخبار رائعة في الجزائر — مسارات ميدانية، سلامة، أتمتة وشهادات قيد الإعداد.",
      "soon.badge": "إعلان قريب",
      "block.what.title": "ما الذي يُحضَّر",
      "block.what.p":
        "وحدات فيديو قصيرة ومسارات كاملة للكهربائيين في البناء والصناعة والصيانة. محتوى بالفرنسية والعربية، موجّه للميدان الجزائري.",
      "block.topics.title": "محاور متوقعة",
      "block.topics.li1": "تركيبات سكنية ومهنية (معايير، مخططات، سلامة)",
      "block.topics.li2": "لوحات، حمايات وتمديدات",
      "block.topics.li3": "أتمتة وإصلاح الأعطال",
      "block.topics.li4": "تربصات وشراكات مع مراكز التكوين",
      "block.notify.title": "كن أول المُطَّلعين",
      "block.notify.p":
        "تابع صفحة فيسبوك Electro DZ أو راسلنا على واتساب — سنعلن عن إطلاق أول التكوينات في الجزائر.",
      "cta.wa": "واتساب",
      "cta.fb": "فيسبوك Electro DZ",
      "cta.contact": "صفحة الاتصال",
      "section.pdf": "دعم PDF (متاح الآن)",
      "section.pdf.sub": "دروس ووحدات سويسرية — تُفتح في قارئ الموقع.",
      "section.video": "فيديوهات الجزائر",
      "section.video.soon": "قريباً أخبار رائعة في الجزائر — أول الفيديوهات ستُنشر هنا.",
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
