/**
 * Plans et schémas électriques (Falstad) — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Plans et schémas électriques — SwissDZ",
      "meta.desc":
        "Simulateur Falstad intégré : circuits électriques interactifs, schémas, essais AC/DC — comme dans l'app Electro DZ.",
      "brand": "SwissDZ",
      "page.title": "Plans et schémas électriques",
      "loading": "Chargement du simulateur…",
      "footer":
        "Simulateur intégré : Falstad Circuit (circuitjs) — comme dans l'application Electro DZ.",
      "error.title": "Impossible de charger le simulateur",
      "error.msg":
        "Causes possibles : connexion internet faible ou ressource temporairement indisponible. Réessayez ou ouvrez dans le navigateur.",
      "error.retry": "Réessayer",
      "error.browser": "Ouvrir dans le navigateur",
    },
    ar: {
      "meta.title": "المخططات والرسومات الكهربائية — SwissDZ",
      "meta.desc":
        "محاكي Falstad مدمج: دوائر كهربائية تفاعلية ومخططات وتجارب AC/DC — كما في تطبيق Electro DZ.",
      "brand": "SwissDZ",
      "page.title": "المخططات والرسومات الكهربائية",
      "loading": "جاري تحميل المحاكي…",
      "footer":
        "محاكي مدمج: Falstad Circuit (circuitjs) — كما في تطبيق Electro DZ.",
      "error.title": "تعذر تحميل المحاكي",
      "error.msg":
        "الأسباب المحتملة: اتصال إنترنت ضعيف أو مورد غير متاح مؤقتاً. أعد المحاولة أو افتح في المتصفح.",
      "error.retry": "إعادة المحاولة",
      "error.browser": "فتح في المتصفح",
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
