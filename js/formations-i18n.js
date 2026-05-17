/**
 * Page Formations — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Formations — DZSWISS ELEC",
      "meta.desc":
        "Bientôt en Algérie : formations en école pour électriciens (présentiel, pas de vidéos en ligne).",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.title": "Formations en école",
      "hero.sub":
        "Bientôt de super nouvelles en Algérie — cours en présentiel dans une école partenaire (inscriptions et calendrier à venir).",
      "soon.badge": "Annonce imminente",
      "block.what.title": "Ce qui arrive",
      "block.what.p":
        "Parcours en salle, atelier et terrain pour les électriciens du bâtiment, de l’industrie et de la maintenance — en français et en arabe, adaptés au contexte algérien.",
      "block.topics.title": "Thèmes prévus",
      "block.topics.li1": "Installations domestiques et tertiaires (normes, schémas, sécurité)",
      "block.topics.li2": "Tableaux, protections et câblage",
      "block.topics.li3": "Automatismes et dépannage",
      "block.topics.li4": "École partenaire en Algérie — dates et inscriptions bientôt",
      "block.notify.title": "Être informé en premier",
      "block.notify.p":
        "Suivez la page Facebook Electro DZ ou WhatsApp — nous annoncerons l’ouverture de l’école et les premières sessions en Algérie.",
      "cta.wa": "WhatsApp",
      "cta.fb": "Facebook Electro DZ",
      "cta.contact": "Page contact",
      "section.pdf": "Supports PDF (déjà disponibles)",
      "section.pdf.sub": "Cours et modules suisses — ouverture dans le lecteur du site.",
      "section.school": "École en Algérie",
      "section.school.soon":
        "Pas de formation par vidéo sur le site : le parcours se fera en école (cours, atelier et terrain). Ouverture annoncée prochainement.",
      "section.empty": "Aucun PDF formation pour le moment.",
      "link.library": "Toute la bibliothèque PDF →",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
    ar: {
      "meta.title": "التكوين — DZSWISS ELEC",
      "meta.desc":
        "قريباً في الجزائر: تكوين في مدرسة للكهربائيين (حضوري، بدون فيديو على الموقع).",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.title": "تكوين في مدرسة",
      "hero.sub":
        "قريباً أخبار رائعة في الجزائر — دروس حضورية في مدرسة شريكة (التسجيل والمواعيد قريباً).",
      "soon.badge": "إعلان قريب",
      "block.what.title": "ما الذي يُحضَّر",
      "block.what.p":
        "مسار في القاعة والورشة والميدان للكهربائيين في البناء والصناعة والصيانة — بالفرنسية والعربية، وفق السياق الجزائري.",
      "block.topics.title": "محاور متوقعة",
      "block.topics.li1": "تركيبات سكنية ومهنية (معايير، مخططات، سلامة)",
      "block.topics.li2": "لوحات، حمايات وتمديدات",
      "block.topics.li3": "أتمتة وإصلاح الأعطال",
      "block.topics.li4": "تربصات وشراكات مع مراكز التكوين",
      "block.notify.title": "كن أول المُطَّلعين",
      "block.notify.p":
        "تابع فيسبوك Electro DZ أو واتساب — سنعلن عن افتتاح المدرسة وأول الدورات في الجزائر.",
      "cta.wa": "واتساب",
      "cta.fb": "فيسبوك Electro DZ",
      "cta.contact": "صفحة الاتصال",
      "section.pdf": "دعم PDF (متاح الآن)",
      "section.pdf.sub": "دروس ووحدات سويسرية — تُفتح في قارئ الموقع.",
      "section.school": "مدرسة في الجزائر",
      "section.school.soon":
        "لن يكون التكوين عبر فيديو على الموقع : تكوين حضوري في مدرسة (قاعة، ورشة وميدان). الافتتاح يُعلَن قريباً.",
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
