/**
 * Lecteur PDF — PDF.js (toutes les pages, défilement mobile + PC)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";
  const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

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
    openExternal: { fr: "Ouvrir le PDF", ar: "فتح PDF" },
    loading: { fr: "Chargement du document…", ar: "جاري تحميل المستند…" },
    loadingPage: { fr: "Page", ar: "صفحة" },
    of: { fr: "sur", ar: "من" },
    error: {
      fr: "Impossible d’afficher ce PDF dans le navigateur. Utilisez « Ouvrir le PDF » ou téléchargez le fichier.",
      ar: "تعذر عرض ملف PDF في المتصفح. استخدم « فتح PDF » أو حمّل الملف.",
    },
  };

  const els = {
    title: document.getElementById("doc-title"),
    pages: document.getElementById("pdf-pages"),
    frame: document.getElementById("pdf-frame"),
    scroll: document.getElementById("reader-scroll"),
    loading: document.getElementById("loading"),
    loadingText: document.getElementById("loading-text"),
    error: document.getElementById("error"),
    download: document.getElementById("btn-download"),
    openExternal: document.getElementById("btn-open-external"),
    openFallback: document.getElementById("btn-open-fallback"),
    pageIndicator: document.getElementById("page-indicator"),
    langBtns: document.querySelectorAll("[data-lang]"),
  };

  let lang = localStorage.getItem(STORAGE_LANG) || "ar";
  let pdfUrl = "";

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
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
  }

  function setLang(next) {
    lang = next === "ar" ? "ar" : "fr";
    localStorage.setItem(STORAGE_LANG, lang);
    applyI18n();
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

  function isSameOrigin(url) {
    try {
      return new URL(url, window.location.href).origin === window.location.origin;
    } catch (_e) {
      return false;
    }
  }

  function isMobileUa() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function setBackLinks() {
    document.querySelectorAll("[data-back-link]").forEach(function (a) {
      a.href = fromPage;
    });
  }

  function setExternalLinks(src) {
    [els.download, els.openExternal, els.openFallback].forEach(function (a) {
      if (a) a.href = src;
    });
    if (els.openExternal) els.openExternal.hidden = false;
  }

  function showLoading(msg) {
    if (els.loading) els.loading.hidden = false;
    if (els.loadingText && msg) els.loadingText.textContent = msg;
    if (els.pages) els.pages.hidden = true;
    if (els.frame) els.frame.hidden = true;
    if (els.error) els.error.hidden = true;
  }

  function showError() {
    if (els.loading) els.loading.hidden = true;
    if (els.pages) els.pages.hidden = true;
    if (els.frame) els.frame.hidden = true;
    if (els.error) els.error.hidden = false;
  }

  function showPages() {
    if (els.loading) els.loading.hidden = true;
    if (els.error) els.error.hidden = true;
    if (els.frame) els.frame.hidden = true;
    if (els.pages) els.pages.hidden = false;
  }

  function setupPdfJs() {
    if (typeof pdfjsLib === "undefined") return false;
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN + "/pdf.worker.min.js";
    return true;
  }

  function pageScale(page, maxWidth) {
    const base = page.getViewport({ scale: 1 });
    const w = Math.max(280, Math.min(maxWidth, 920) - 24);
    return w / base.width;
  }

  function renderPageToCanvas(page, scale) {
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      return canvas;
    });
  }

  function renderWithPdfJs(src) {
    if (!setupPdfJs()) return Promise.reject(new Error("pdf.js missing"));

    const container = els.pages;
    if (!container) return Promise.reject(new Error("no container"));
    container.innerHTML = "";

    const maxWidth = (els.scroll && els.scroll.clientWidth) || window.innerWidth;

    return pdfjsLib
      .getDocument({ url: src, withCredentials: false })
      .promise.then(function (pdf) {
        const total = pdf.numPages;
        if (els.pageIndicator) {
          els.pageIndicator.hidden = false;
          els.pageIndicator.textContent = total + " " + (lang === "ar" ? "صفحات" : "pages");
        }

        let chain = Promise.resolve();
        for (let n = 1; n <= total; n++) {
          (function (pageNum) {
            chain = chain.then(function () {
              showLoading(
                t("loadingPage") + " " + pageNum + " " + t("of") + " " + total + "…"
              );
              return pdf.getPage(pageNum).then(function (page) {
                const scale = pageScale(page, maxWidth);
                return renderPageToCanvas(page, scale).then(function (canvas) {
                  const wrap = document.createElement("div");
                  wrap.className = "pdf-page";
                  wrap.setAttribute("data-page", String(pageNum));
                  wrap.appendChild(canvas);
                  container.appendChild(wrap);
                });
              });
            });
          })(n);
        }
        return chain;
      });
  }

  function renderWithIframe(src) {
    return new Promise(function (resolve, reject) {
      if (!els.frame) {
        reject(new Error("no iframe"));
        return;
      }
      let done = false;
      const timeout = window.setTimeout(function () {
        if (!done) reject(new Error("iframe timeout"));
      }, 20000);

      els.frame.addEventListener(
        "load",
        function onLoad() {
          if (done) return;
          done = true;
          window.clearTimeout(timeout);
          els.frame.removeEventListener("load", onLoad);
          if (els.loading) els.loading.hidden = true;
          if (els.error) els.error.hidden = true;
          if (els.pages) els.pages.hidden = true;
          els.frame.hidden = false;
          resolve();
        },
        { once: true }
      );

      els.frame.src = src;
    });
  }

  function loadPdf(src) {
    pdfUrl = src;
    document.title = (lang === "ar" ? titleAr : titleFr) + " — DZSWISS ELEC";
    setExternalLinks(src);
    showLoading(t("loading"));

    renderWithPdfJs(src)
      .then(function () {
        showPages();
        applyI18n();
      })
      .catch(function () {
        if (isMobileUa() || !isSameOrigin(src)) {
          showError();
          applyI18n();
          return;
        }
        return renderWithIframe(src).catch(function () {
          showError();
          applyI18n();
        });
      });
  }

  function init() {
    setBackLinks();
    applyI18n();

    if (!pdfSrc) {
      showError();
      return;
    }

    const src = normalizePdfUrl(decodeURIComponent(pdfSrc));
    loadPdf(src);
  }

  els.langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLang(btn.getAttribute("data-lang"));
    });
  });

  init();
})();
