/**
 * Lecteur PDF intégré — affichage sur le site (iframe)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";

  const params = new URLSearchParams(window.location.search);
  const fromPage = params.get("from") || "bibliotheque.html";
  const pdfSrc = params.get("src") || "";
  const titleFr = params.get("titleFr") || params.get("title") || "PDF";
  const titleAr = params.get("titleAr") || titleFr;

  const I18N = {
    back: {
      fr: fromPage.indexOf("documentation") !== -1 ? "← Documentation" : "← Bibliothèque",
      ar: fromPage.indexOf("documentation") !== -1 ? "← التوثيق" : "← المكتبة",
    },
    download: { fr: "Télécharger", ar: "تحميل" },
    loading: { fr: "Chargement du document…", ar: "جاري تحميل المستند…" },
    error: {
      fr: "Impossible d’afficher ce PDF ici. Vérifiez votre connexion ou réessayez.",
      ar: "تعذر عرض ملف PDF هنا. تحقق من الاتصال أو أعد المحاولة.",
    },
  };

  const els = {
    title: document.getElementById("doc-title"),
    frame: document.getElementById("pdf-frame"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    download: document.getElementById("btn-download"),
    langBtns: document.querySelectorAll("[data-lang]"),
  };

  let lang = localStorage.getItem(STORAGE_LANG) || "ar";

  function t(key) {
    const entry = I18N[key];
    if (!entry) return key;
    return lang === "ar" ? entry.ar : entry.fr;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    });
    if (els.title) els.title.textContent = lang === "ar" ? titleAr : titleFr;
    els.langBtns.forEach(function (btn) {
      const isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isActive);
    });
  }

  function setLang(next) {
    lang = next === "ar" ? "ar" : "fr";
    localStorage.setItem(STORAGE_LANG, lang);
    applyI18n();
  }

  function showError() {
    if (els.loading) els.loading.hidden = true;
    if (els.frame) els.frame.hidden = true;
    if (els.error) els.error.hidden = false;
  }

  function showPdf() {
    if (els.loading) els.loading.hidden = true;
    if (els.error) els.error.hidden = true;
    if (els.frame) els.frame.hidden = false;
  }

  function normalizePdfUrl(url) {
    if (!url) return "";
    try {
      const u = new URL(url, window.location.href);
      if (u.hostname.includes("dropbox.com") && u.searchParams.get("dl") === "0") {
        u.searchParams.set("dl", "1");
      }
      return u.href;
    } catch (_e) {
      return url;
    }
  }

  function setBackLinks() {
    document.querySelectorAll("[data-back-link]").forEach(function (a) {
      a.href = fromPage;
    });
  }

  function init() {
    setBackLinks();
    if (!pdfSrc) {
      showError();
      applyI18n();
      return;
    }

    const src = normalizePdfUrl(decodeURIComponent(pdfSrc));
    document.title = (lang === "ar" ? titleAr : titleFr) + " — Electro DZ";

    if (els.download) {
      els.download.href = src;
      els.download.setAttribute("download", "");
    }

    if (!els.frame) {
      showError();
      applyI18n();
      return;
    }

    let loaded = false;
    const timeout = window.setTimeout(function () {
      if (!loaded) showError();
    }, 20000);

    els.frame.addEventListener("load", function () {
      loaded = true;
      window.clearTimeout(timeout);
      showPdf();
    });

    els.frame.addEventListener("error", function () {
      window.clearTimeout(timeout);
      showError();
    });

    els.frame.src = src;
    applyI18n();
  }

  els.langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLang(btn.getAttribute("data-lang"));
    });
  });

  init();
})();
