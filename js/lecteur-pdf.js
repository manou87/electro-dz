/**
 * Lecteur PDF — PDF.js local, navigation page par page (‹ › swipe)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";

  const params = new URLSearchParams(window.location.search);
  const fromPage = params.get("from") || "bibliotheque.html";
  const pdfSrc = params.get("src") || "";
  const bookId = params.get("id") || "";
  const titleFr = params.get("titleFr") || params.get("title") || "PDF";
  const titleAr = params.get("titleAr") || titleFr;

  const I18N = {
    back: {
      fr: fromPage.indexOf("documentation") !== -1 ? "← Doc" : "← Biblio",
      ar: fromPage.indexOf("documentation") !== -1 ? "← وثائق" : "← مكتبة",
    },
    download: { fr: "Télécharger PDF", ar: "تنزيل PDF" },
    openExternal: { fr: "Ouvrir le PDF", ar: "فتح PDF" },
    loading: { fr: "Chargement…", ar: "جاري التحميل…" },
    loadingPage: { fr: "Page", ar: "صفحة" },
    error: {
      fr: "Ce PDF ne peut pas s’afficher ici. Appuyez sur « Ouvrir le PDF » pour le lire sur votre téléphone.",
      ar: "تعذر عرض الملف هنا. اضغط « فتح PDF » لقراءته على هاتفك.",
    },
    swipeHint: {
      fr: "‹ › ou glissez gauche/droite pour changer de page",
      ar: "‹ › أو اسحب يميناً/يساراً لتغيير الصفحة",
    },
    goto: { fr: "Page", ar: "صفحة" },
  };

  const els = {
    title: document.getElementById("doc-title"),
    stage: document.getElementById("pdf-stage"),
    stageWrap: document.getElementById("stage-wrap"),
    body: document.getElementById("reader-body"),
    loading: document.getElementById("loading"),
    loadingText: document.getElementById("loading-text"),
    error: document.getElementById("error"),
    download: document.getElementById("btn-download"),
    openFallback: document.getElementById("btn-open-fallback"),
    pageInfo: document.getElementById("page-info"),
    pageInput: document.getElementById("page-input"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    btnFavorite: document.getElementById("btn-favorite"),
    langBtns: document.querySelectorAll("[data-lang]"),
  };

  let lang = localStorage.getItem(STORAGE_LANG) || "ar";
  let pdfDoc = null;
  let totalPages = 0;
  let currentPage = 1;
  const pageCache = new Map();
  let pdfUrl = "";
  let touchStartX = 0;

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
    updatePagerUi();
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

  function setBackLinks() {
    document.querySelectorAll("[data-back-link]").forEach(function (a) {
      a.href = fromPage;
    });
  }

  function showLoading(msg) {
    if (els.loading) els.loading.hidden = false;
    if (els.loadingText && msg) els.loadingText.textContent = msg;
    if (els.body) els.body.hidden = true;
    if (els.error) els.error.hidden = true;
  }

  function showError() {
    if (els.loading) els.loading.hidden = true;
    if (els.body) els.body.hidden = true;
    if (els.error) els.error.hidden = false;
  }

  function showReader() {
    if (els.loading) els.loading.hidden = true;
    if (els.error) els.error.hidden = true;
    if (els.body) els.body.hidden = false;
  }

  function setupPdfJs() {
    if (typeof pdfjsLib === "undefined") return false;
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("js/pdf.worker.min.js", window.location.href).href;
    return true;
  }

  function loadPdfDocument(src) {
    if (!setupPdfJs()) return Promise.reject(new Error("pdf.js missing"));

    function fromUrl() {
      return pdfjsLib.getDocument({ url: src, withCredentials: false }).promise;
    }

    if (isSameOrigin(src)) {
      return fetch(src)
        .then(function (res) {
          if (!res.ok) throw new Error("fetch " + res.status);
          return res.arrayBuffer();
        })
        .then(function (buf) {
          return pdfjsLib.getDocument({ data: buf }).promise;
        })
        .catch(function () {
          return fromUrl();
        });
    }
    return fromUrl();
  }

  function pageScale(page) {
    const base = page.getViewport({ scale: 1 });
    const maxW = Math.min(920, (els.stageWrap && els.stageWrap.clientWidth) || window.innerWidth) - 20;
    return Math.max(280, maxW) / base.width;
  }

  function renderPageToCanvas(page) {
    const scale = pageScale(page);
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      return canvas;
    });
  }

  function updatePagerUi() {
    if (els.pageInfo) {
      els.pageInfo.textContent = currentPage + " / " + totalPages;
    }
    if (els.pageInput) {
      els.pageInput.max = String(totalPages);
      els.pageInput.value = String(currentPage);
    }
    if (els.btnPrev) els.btnPrev.disabled = currentPage <= 1;
    if (els.btnNext) els.btnNext.disabled = currentPage >= totalPages;
  }

  function goToPage(num) {
    const n = Math.max(1, Math.min(totalPages, num));
    if (n === currentPage && pageCache.has(n)) return Promise.resolve();
    currentPage = n;
    updatePagerUi();
    if (els.stageWrap) els.stageWrap.scrollTop = 0;

    if (pageCache.has(n)) {
      if (els.stage) {
        els.stage.innerHTML = "";
        els.stage.appendChild(pageCache.get(n));
      }
      return Promise.resolve();
    }

    showLoading(t("loadingPage") + " " + n + " / " + totalPages + "…");

    return pdfDoc.getPage(n).then(function (page) {
      return renderPageToCanvas(page).then(function (canvas) {
        pageCache.set(n, canvas);
        if (els.stage) {
          els.stage.innerHTML = "";
          els.stage.appendChild(canvas);
        }
        showReader();
      });
    });
  }

  function bindPager() {
    if (els.btnPrev) {
      els.btnPrev.addEventListener("click", function () {
        goToPage(currentPage - 1).catch(onRenderError);
      });
    }
    if (els.btnNext) {
      els.btnNext.addEventListener("click", function () {
        goToPage(currentPage + 1).catch(onRenderError);
      });
    }
    if (els.pageInput) {
      els.pageInput.addEventListener("change", function () {
        const v = parseInt(els.pageInput.value, 10);
        if (!isNaN(v)) goToPage(v).catch(onRenderError);
      });
    }

    if (els.stageWrap) {
      els.stageWrap.addEventListener(
        "touchstart",
        function (e) {
          touchStartX = e.changedTouches[0].clientX;
        },
        { passive: true }
      );
      els.stageWrap.addEventListener(
        "touchend",
        function (e) {
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) < 50) return;
          if (dx < 0) goToPage(currentPage + 1).catch(onRenderError);
          else goToPage(currentPage - 1).catch(onRenderError);
        },
        { passive: true }
      );
    }

    window.addEventListener("resize", function () {
      if (!pdfDoc) return;
      pageCache.clear();
      goToPage(currentPage).catch(onRenderError);
    });
  }

  function onRenderError() {
    showError();
    applyI18n();
  }

  function openNativePdf() {
    window.location.href = pdfUrl;
  }

  function initPdf(src) {
    pdfUrl = src;
    document.title = (lang === "ar" ? titleAr : titleFr) + " — DZSWISS ELEC";
    if (els.download) els.download.href = src;
    if (els.openFallback) els.openFallback.href = src;

    showLoading(t("loading"));

    loadPdfDocument(src)
      .then(function (pdf) {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        currentPage = 1;
        pageCache.clear();
        bindPager();
        return goToPage(1);
      })
      .then(function () {
        showReader();
        applyI18n();
        if (totalPages <= 1 && els.btnNext) els.btnNext.disabled = true;
        if (bookId && window.ElectroDzPdfStats) {
          window.ElectroDzPdfStats.trackView(bookId).then(function () {
            try {
              sessionStorage.setItem("electrodz-stats-changed", String(Date.now()));
            } catch (_) { /* ignore */ }
          });
        }
      })
      .catch(function () {
        if (els.openFallback) els.openFallback.href = src;
        showError();
        applyI18n();
      });
  }

  function setupFavorite() {
    if (!els.btnFavorite) return;
    if (!bookId) {
      els.btnFavorite.hidden = true;
      return;
    }
    const book = {
      id: bookId,
      titleFr: titleFr,
      titleAr: titleAr,
      pdfUrl: pdfSrc,
    };
    function refreshStar(on) {
      els.btnFavorite.textContent = on ? "★" : "☆";
      els.btnFavorite.classList.toggle("btn-fav--on", !!on);
    }
    if (window.ElectroDzFavorites) {
      window.ElectroDzFavorites.isFavorite(bookId)
        .then(refreshStar)
        .catch(function () {});
    }
    els.btnFavorite.addEventListener("click", function () {
      if (!window.ElectroDzFavorites) return;
      window.ElectroDzFavorites.toggleFavorite(book).then(function (res) {
        if (res.needLogin) {
          if (
            confirm(
              lang === "ar"
                ? "سجّل الدخول لحفظ المفضلة."
                : "Connectez-vous (e-mail ou Google) pour enregistrer ce PDF."
            )
          ) {
            location.href = window.ElectroDzFavorites.loginUrl();
          }
          return;
        }
        if (res.ok) refreshStar(res.favorited);
      });
    });
  }

  function init() {
    setBackLinks();
    applyI18n();
    setupFavorite();

    if (els.download && bookId) {
      els.download.addEventListener("click", function () {
        if (window.ElectroDzPdfStats) {
          window.ElectroDzPdfStats.trackDownload(bookId);
        }
      });
    }

    if (!pdfSrc) {
      showError();
      return;
    }

    const src = normalizePdfUrl(decodeURIComponent(pdfSrc));
    const lock = window.ElectroDzLibraryLock;
    if (
      bookId &&
      lock &&
      lock.isProtected(bookId) &&
      !lock.isUnlocked(bookId)
    ) {
      if (els.download) els.download.hidden = true;
      if (els.openFallback) els.openFallback.hidden = true;
      showLoading(lang === "ar" ? "وصول محمي…" : "Accès protégé…");
      lock.promptUnlock(bookId).then(function (ok) {
        if (!ok) {
          showError();
          if (els.error) {
            els.error.textContent =
              lang === "ar"
                ? "هذا المستند محمي بكلمة مرور. ارجع إلى المكتبة وأدخل كلمة المرور."
                : "Ce document est protégé par mot de passe. Retournez à la bibliothèque pour le déverrouiller.";
          }
          return;
        }
        if (els.download) els.download.hidden = false;
        if (els.openFallback) els.openFallback.hidden = false;
        initPdf(src);
      });
      return;
    }

    initPdf(src);
  }

  els.langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLang(btn.getAttribute("data-lang"));
    });
  });

  if (els.openFallback) {
    els.openFallback.addEventListener("click", function (e) {
      if (!pdfUrl) return;
      e.preventDefault();
      openNativePdf();
    });
  }

  init();
})();
