/**
 * Simulation professionnelle (circuitjs) — FR / AR / EN
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Simulation professionnelle — SwissDZ",
      "meta.desc":
        "Simulateur professionnel intégré : circuits électriques interactifs, schémas, essais AC/DC — comme dans l'app Electro DZ.",
      "brand": "SwissDZ",
      "page.title": "Simulation professionnelle",
      "loading": "Chargement du simulateur…",
      "footer":
        "Simulateur de circuits intégré — comme dans l'application Electro DZ.",
      "error.title": "Impossible de charger le simulateur",
      "error.msg":
        "Causes possibles : connexion internet faible ou ressource temporairement indisponible. Réessayez ou ouvrez dans le navigateur.",
      "error.retry": "Réessayer",
      "error.browser": "Ouvrir dans le navigateur",
    },
    ar: {
      "meta.title": "محاكاة احترافية — SwissDZ",
      "meta.desc":
        "محاكي احترافي مدمج: دوائر كهربائية تفاعلية ومخططات وتجارب AC/DC — كما في تطبيق Electro DZ.",
      "brand": "SwissDZ",
      "page.title": "محاكاة احترافية",
      "loading": "جاري تحميل المحاكي…",
      "footer":
        "محاكي دوائر مدمج — كما في تطبيق Electro DZ.",
      "error.title": "تعذر تحميل المحاكي",
      "error.msg":
        "الأسباب المحتملة: اتصال إنترنت ضعيف أو مورد غير متاح مؤقتاً. أعد المحاولة أو افتح في المتصفح.",
      "error.retry": "إعادة المحاولة",
      "error.browser": "فتح في المتصفح",
    },
    en: {
      "meta.title": "Professional simulation — SwissDZ",
      "meta.desc":
        "Built-in professional simulator: interactive electrical circuits, diagrams, AC/DC tests — as in the Electro DZ app.",
      "brand": "SwissDZ",
      "page.title": "Professional simulation",
      "loading": "Loading the simulator…",
      "footer":
        "Built-in circuit simulator — as in the Electro DZ app.",
      "error.title": "Could not load the simulator",
      "error.msg":
        "Possible causes: weak internet connection or a temporary outage. Retry or open in the browser.",
      "error.retry": "Retry",
      "error.browser": "Open in browser",
    },
  };

  var lang = "fr";

  function normalize(next) {
    return next === "ar" || next === "en" || next === "fr" ? next : "fr";
  }

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function applyLang(next) {
    lang = normalize(next);
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

    document.querySelectorAll("[data-i18n-href-fr]").forEach(function (el) {
      var href =
        lang === "ar"
          ? el.getAttribute("data-i18n-href-ar")
          : lang === "en"
            ? el.getAttribute("data-i18n-href-en") || el.getAttribute("data-i18n-href-fr")
            : el.getAttribute("data-i18n-href-fr");
      if (href) el.setAttribute("href", href);
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
  applyLang(saved);

  window.SchemasPlansI18n = { t: t, getLang: function () { return lang; } };
})();
