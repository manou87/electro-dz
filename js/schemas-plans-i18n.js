/**
 * Schémas et plans — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Schémas et plans — SwissDZ",
      "meta.desc":
        "Éditeur professionnel de schémas unifilaires et plans (diagrams.net) — export, impression, infos chantier.",
      "brand": "SwissDZ",
      "page.title": "Schémas et plans",
      "loading": "Chargement de l'éditeur…",
      "status.ready": "Prêt",
      "status.saved": "Enregistré",
      "status.dirty": "Modifications…",
      "btn.new": "Nouveau",
      "btn.open": "Ouvrir",
      "btn.save": "Enregistrer",
      "btn.print": "Imprimer",
      "btn.png": "PNG",
      "btn.svg": "SVG",
      "btn.pdf": "PDF",
      "btn.meta": "Infos chantier",
      "meta.title": "Informations du dossier",
      "meta.project": "Nom du projet / chantier",
      "meta.client": "Client",
      "meta.site": "Adresse / site",
      "meta.author": "Réalisé par",
      "meta.date": "Date",
      "meta.notes": "Notes / remarques",
      "confirm.new": "Créer un nouveau schéma ? Les modifications non enregistrées seront perdues.",
      "footer":
        "Éditeur intégré : diagrams.net (draw.io) — logiciel open source. Symboles électriques via bibliothèques intégrées.",
      "print.title": "Schéma — SwissDZ",
    },
    ar: {
      "meta.title": "مخططات ورسوم — SwissDZ",
      "meta.desc":
        "محرر احترافي للمخططات أحادية الخط والمخططات (diagrams.net) — تصدير وطباعة ومعلومات الورشة.",
      "brand": "SwissDZ",
      "page.title": "مخططات ورسوم",
      "loading": "جاري تحميل المحرر…",
      "status.ready": "جاهز",
      "status.saved": "تم الحفظ",
      "status.dirty": "تعديلات…",
      "btn.new": "جديد",
      "btn.open": "فتح",
      "btn.save": "حفظ",
      "btn.print": "طباعة",
      "btn.png": "PNG",
      "btn.svg": "SVG",
      "btn.pdf": "PDF",
      "btn.meta": "معلومات الورشة",
      "meta.title": "معلومات الملف",
      "meta.project": "اسم المشروع / الورشة",
      "meta.client": "الزبون",
      "meta.site": "العنوان / الموقع",
      "meta.author": "أعدّه",
      "meta.date": "التاريخ",
      "meta.notes": "ملاحظات",
      "confirm.new": "إنشاء مخطط جديد؟ ستُفقد التعديلات غير المحفوظة.",
      "footer":
        "محرر مدمج: diagrams.net (draw.io) — برمجية مفتوحة المصدر. رموز كهربائية عبر المكتبات المدمجة.",
      "print.title": "مخطط — SwissDZ",
    },
  };

  var lang = "fr";

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function applyLang(next) {
    lang = next === "ar" ? "ar" : "fr";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("meta.title");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.desc"));

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      if (el.tagName === "INPUT" && el.type !== "button") {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
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

  var saved = "fr";
  try {
    saved = localStorage.getItem(STORAGE) || "fr";
  } catch (e) {}
  if (saved !== "fr" && saved !== "ar") saved = "fr";
  applyLang(saved);

  window.SchemasPlansI18n = { t: t, getLang: function () { return lang; } };
})();
