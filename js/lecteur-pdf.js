/**
 * Lecteur PDF — style lecteur pro (zoom, historique, stylo, déplacement)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";
  const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];

  const params = new URLSearchParams(window.location.search);
  const fromPage = params.get("from") || "bibliotheque.html";
  const pdfSrc = params.get("src") || "";
  const bookId = params.get("id") || "";
  const initialPageParam = parseInt(params.get("page"), 10);
  const initialPage =
    Number.isFinite(initialPageParam) && initialPageParam >= 1 ? initialPageParam : 0;
  const titleFr = params.get("titleFr") || params.get("title") || "PDF";
  const titleAr = params.get("titleAr") || titleFr;

  const I18N = {
    back: {
      fr: fromPage.indexOf("documentation") !== -1 ? "← Doc" : "← Biblio",
      ar: fromPage.indexOf("documentation") !== -1 ? "← وثائق" : "← مكتبة",
      en: fromPage.indexOf("documentation") !== -1 ? "← Docs" : "← Library",
    },
    download: { fr: "Télécharger", ar: "تنزيل", en: "Download" },
    fav: { fr: "Favoris", ar: "مفضلة", en: "Favourites" },
    histBack: { fr: "Page précédente (historique)", ar: "صفحة سابقة (سجل)", en: "Previous page (history)" },
    histFwd: { fr: "Page suivante (historique)", ar: "صفحة تالية (سجل)", en: "Next page (history)" },
    zoomOut: { fr: "Zoom arrière", ar: "تصغير", en: "Zoom out" },
    zoomIn: { fr: "Zoom avant", ar: "تكبير", en: "Zoom in" },
    pagePrev: { fr: "Page précédente", ar: "الصفحة السابقة", en: "Previous page" },
    pageNext: { fr: "Page suivante", ar: "الصفحة التالية", en: "Next page" },
    pagePrevShort: { fr: "Préc.", ar: "سابق", en: "Prev." },
    pageNextShort: { fr: "Suiv.", ar: "تالي", en: "Next" },
    swipeHint: {
      fr: "Glissez le doigt ↑ ↓ sur la page pour changer de page",
      ar: "مرّر إصبعك ↑ ↓ على الصفحة لتغيير الصفحة",
      en: "Swipe ↑ ↓ on the page to change pages",
    },
    thumbsTitle: { fr: "Pages", ar: "صفحات", en: "Pages" },
    toggleThumbs: { fr: "Afficher les miniatures", ar: "عرض المصغرات", en: "Show thumbnails" },
    openExternal: { fr: "Ouvrir le PDF", ar: "فتح PDF", en: "Open PDF" },
    loading: { fr: "Chargement…", ar: "جاري التحميل…", en: "Loading…" },
    loadingPage: { fr: "Page", ar: "صفحة", en: "Page" },
    error: {
      fr: "Ce PDF ne peut pas s’afficher ici. Appuyez sur « Ouvrir le PDF ».",
      ar: "تعذر العرض هنا. اضغط « فتح PDF ».",
      en: "This PDF cannot be displayed here. Tap “Open PDF”.",
    },
    goto: { fr: "Page", ar: "صفحة", en: "Page" },
    toolHand: { fr: "Main", ar: "يد", en: "Hand" },
    toolPen: { fr: "Stylo", ar: "قلم", en: "Pen" },
    toolHighlight: { fr: "Surligneur", ar: "تمييز", en: "Highlighter" },
    toolEraser: { fr: "Gomme", ar: "ممحاة", en: "Eraser" },
    fitWidth: { fr: "Largeur", ar: "عرض", en: "Width" },
    fitPage: { fr: "Page", ar: "صفحة", en: "Page" },
    resetZoom: { fr: "Réinitialiser le zoom (100 %)", ar: "إعادة التكبير (100٪)", en: "Reset zoom (100%)" },
    fullscreen: { fr: "Plein écran", ar: "ملء الشاشة", en: "Fullscreen" },
    exitFullscreen: { fr: "Quitter le plein écran", ar: "إنهاء ملء الشاشة", en: "Exit fullscreen" },
    rotate: { fr: "Rotation", ar: "دوران", en: "Rotate" },
    clearInk: { fr: "Effacer annotations", ar: "مسح التعليقات", en: "Clear annotations" },
  };

  const els = {
    title: document.getElementById("doc-title"),
    stage: document.getElementById("pdf-stage"),
    stageWrap: document.getElementById("stage-wrap"),
    body: document.getElementById("reader-body"),
    toolbar: document.getElementById("reader-toolbar"),
    loading: document.getElementById("loading"),
    loadingText: document.getElementById("loading-text"),
    error: document.getElementById("error"),
    download: document.getElementById("btn-download"),
    openFallback: document.getElementById("btn-open-fallback"),
    pageInfo: document.getElementById("page-info"),
    pageInput: document.getElementById("page-input"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    btnPagePrev: document.getElementById("btn-page-prev"),
    btnPageNext: document.getElementById("btn-page-next"),
    btnBarThumbs: document.getElementById("btn-bar-thumbs"),
    barPageInfo: document.getElementById("bar-page-info"),
    swipeHint: document.getElementById("swipe-hint"),
    pageBar: document.getElementById("reader-page-bar"),
    pager: document.getElementById("pdf-pager"),
    toolbarPageInfo: document.getElementById("toolbar-page-info"),
    btnHistBack: document.getElementById("btn-hist-back"),
    btnHistFwd: document.getElementById("btn-hist-fwd"),
    btnZoomOut: document.getElementById("btn-zoom-out"),
    btnZoomIn: document.getElementById("btn-zoom-in"),
    btnFitWidth: document.getElementById("btn-fit-width"),
    btnFitPage: document.getElementById("btn-fit-page"),
    zoomLabel: document.getElementById("zoom-label"),
    btnToolHand: document.getElementById("btn-tool-hand"),
    btnToolPen: document.getElementById("btn-tool-pen"),
    btnToolHighlight: document.getElementById("btn-tool-highlight"),
    btnToolEraser: document.getElementById("btn-tool-eraser"),
    btnClearInk: document.getElementById("btn-clear-ink"),
    btnFullscreen: document.getElementById("btn-fullscreen"),
    btnFullscreenDesktop: document.getElementById("btn-fullscreen-desktop"),
    fsNav: document.getElementById("reader-fs-nav"),
    btnFsPrev: document.getElementById("btn-fs-prev"),
    btnFsNext: document.getElementById("btn-fs-next"),
    btnFsExit: document.getElementById("btn-fs-exit"),
    fsPageInfo: document.getElementById("fs-page-info"),
    thumbSidebar: document.getElementById("thumb-sidebar"),
    thumbList: document.getElementById("thumb-list"),
    readerLayout: document.querySelector(".reader-layout"),
    btnToggleThumbs: document.getElementById("btn-toggle-thumbs"),
    btnZonePrev: document.getElementById("btn-zone-prev"),
    btnZoneNext: document.getElementById("btn-zone-next"),
    inkColor: document.getElementById("ink-color"),
    inkSize: document.getElementById("ink-size"),
    btnFavorite: document.getElementById("btn-favorite"),
    langBtns: document.querySelectorAll("[data-lang]"),
  };

  let lang = localStorage.getItem(STORAGE_LANG) || "ar";
  if (lang !== "fr" && lang !== "ar" && lang !== "en") lang = "ar";
  let pdfDoc = null;
  let totalPages = 0;
  let currentPage = 1;
  let pageRotation = 0;
  let zoomIndex = 2;
  let fitMode = "width";
  const pageCache = new Map();
  const inkStrokes = new Map();
  let pdfUrl = "";
  let activeTool = "hand";
  let pageHistory = [1];
  let historyIndex = 0;
  let navigatingHistory = false;

  let panActive = false;
  let panStartX = 0;
  let panStartY = 0;
  let panScrollLeft = 0;
  let panScrollTop = 0;
  let pinchStartDist = 0;
  let pinchStartZoom = 0;
  let zoomRerenderTimer = null;
  let resizeRerenderTimer = null;

  let drawing = false;
  let currentStroke = null;
  let pseudoFullscreen = false;
  let fsScrollY = 0;
  let fsTouchBlocker = null;
  let fitModeBeforeFs = null;
  let zoomIndexBeforeFs = null;

  /** Safari iPhone/iPad : pas de vrai plein écran HTML (sauf balise video). */
  function isIOSWebKit() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const iOSDevice = /iPad|iPhone|iPod/.test(ua);
    const iPadOS =
      navigator.platform === "MacIntel" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
    return iOSDevice || iPadOS;
  }

  function supportsElementFullscreen() {
    if (isIOSWebKit()) return false;
    const el = document.documentElement;
    return !!(
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    );
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function requestFullscreenEl(el) {
    const fn =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;
    if (!fn) return Promise.reject(new Error("fullscreen unsupported"));
    return Promise.resolve(fn.call(el));
  }

  function exitFullscreenDoc() {
    const fn =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;
    if (fn) fn.call(document);
  }

  function isReaderFullscreen() {
    return !!getFullscreenElement() || pseudoFullscreen;
  }

  function lockPageScrollForFs() {
    fsScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = "-" + fsScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (!fsTouchBlocker) {
      fsTouchBlocker = function (e) {
        if (!pseudoFullscreen && !isReaderFullscreen()) return;
        if (e.target.closest(".reader-stage-wrap")) return;
        e.preventDefault();
      };
    }
    document.addEventListener("touchmove", fsTouchBlocker, { passive: false });
  }

  function unlockPageScrollForFs() {
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.removeEventListener("touchmove", fsTouchBlocker);
    window.scrollTo(0, fsScrollY);
  }

  function rerenderAfterLayoutChange() {
    if (!pdfDoc) return;
    pageCache.clear();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        goToPage(currentPage, true).catch(onRenderError);
      });
    });
  }

  function setReaderFullscreen(on) {
    const nativeFs = !!getFullscreenElement();
    pseudoFullscreen = on && (!nativeFs || isIOSWebKit());
    if (on) {
      fitModeBeforeFs = fitMode;
      zoomIndexBeforeFs = zoomIndex;
      fitMode = "page";
      zoomIndex = 2;
      updateZoomLabel();
    } else if (fitModeBeforeFs !== null) {
      fitMode = fitModeBeforeFs;
      zoomIndex = zoomIndexBeforeFs !== null ? zoomIndexBeforeFs : zoomIndex;
      fitModeBeforeFs = null;
      zoomIndexBeforeFs = null;
      updateZoomLabel();
    }
    document.body.classList.toggle("is-fullscreen", on);
    document.body.classList.toggle("is-fs-pseudo", pseudoFullscreen);
    document.documentElement.classList.toggle("is-reader-fs", on);
    document.documentElement.classList.toggle("is-fs-pseudo", pseudoFullscreen);
    document.documentElement.classList.toggle("is-ios", isIOSWebKit());
    if (els.fsNav) {
      els.fsNav.hidden = !on;
      els.fsNav.setAttribute("aria-hidden", on ? "false" : "true");
    }
    syncPageBarVisibility();
    syncPagerVisibility();
    if (on && pseudoFullscreen) lockPageScrollForFs();
    else if (!on) unlockPageScrollForFs();
    updateFullscreenUi();
    rerenderAfterLayoutChange();
    if (on && pseudoFullscreen) {
      window.requestAnimationFrame(function () {
        window.scrollTo(0, 0);
      });
    }
  }

  function updateFullscreenUi() {
    const on = isReaderFullscreen();
    const iconId = on ? "#reader-ico-fullscreen-exit" : "#reader-ico-fullscreen";
    const label = t(on ? "exitFullscreen" : "fullscreen");
    [els.btnFullscreen, els.btnFullscreenDesktop].forEach(function (btn) {
      if (!btn) return;
      const useEl = btn.querySelector("use");
      if (useEl) useEl.setAttribute("href", iconId);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-label", label);
    });
  }

  function isMobileReader() {
    return window.matchMedia("(max-width: 1024px)").matches;
  }

  function syncMobileReaderClass() {
    document.body.classList.toggle("is-mobile-reader", isMobileReader());
  }

  function applyMobileReaderProfile() {
    syncMobileReaderClass();
    if (!isMobileReader()) return;
    fitMode = "page";
    zoomIndex = 2;
    updateZoomLabel();
  }

  const DEFAULT_ZOOM_INDEX = 2;

  function resetView() {
    clearTimeout(zoomRerenderTimer);
    fitMode = isMobileReader() ? "page" : fitMode;
    zoomIndex = DEFAULT_ZOOM_INDEX;
    updateZoomLabel();
    if (!pdfDoc) return;
    pageCache.clear();
    if (els.stageWrap) {
      els.stageWrap.scrollLeft = 0;
      els.stageWrap.scrollTop = 0;
    }
    goToPage(currentPage, true).catch(onRenderError);
  }

  function enterReaderFullscreen() {
    if (!supportsElementFullscreen()) {
      pseudoFullscreen = true;
      setReaderFullscreen(true);
      return Promise.resolve();
    }
    return requestFullscreenEl(document.documentElement)
      .catch(function () {
        return requestFullscreenEl(document.body);
      })
      .then(function () {
        if (getFullscreenElement()) {
          pseudoFullscreen = false;
          setReaderFullscreen(true);
        } else {
          pseudoFullscreen = true;
          setReaderFullscreen(true);
        }
      })
      .catch(function () {
        pseudoFullscreen = true;
        setReaderFullscreen(true);
      });
  }

  function leaveReaderFullscreen() {
    if (getFullscreenElement()) exitFullscreenDoc();
    pseudoFullscreen = false;
    setReaderFullscreen(false);
  }

  function toggleReaderFullscreen() {
    if (isReaderFullscreen()) leaveReaderFullscreen();
    else enterReaderFullscreen();
  }

  function onFullscreenChange() {
    if (isIOSWebKit()) return;
    if (getFullscreenElement()) {
      pseudoFullscreen = false;
      document.body.classList.add("is-fullscreen");
      document.body.classList.remove("is-fs-pseudo");
      if (els.fsNav) {
        els.fsNav.hidden = false;
        els.fsNav.setAttribute("aria-hidden", "false");
      }
      if (fitModeBeforeFs === null) {
        fitModeBeforeFs = fitMode;
        zoomIndexBeforeFs = zoomIndex;
        fitMode = "page";
        zoomIndex = 2;
        updateZoomLabel();
      }
      updateFullscreenUi();
      rerenderAfterLayoutChange();
      return;
    }
    if (pseudoFullscreen) return;
    document.body.classList.remove("is-fullscreen", "is-fs-pseudo");
    document.documentElement.classList.remove("is-reader-fs", "is-fs-pseudo");
    if (els.fsNav) els.fsNav.hidden = true;
    if (fitModeBeforeFs !== null) {
      fitMode = fitModeBeforeFs;
      zoomIndex = zoomIndexBeforeFs !== null ? zoomIndexBeforeFs : zoomIndex;
      fitModeBeforeFs = null;
      zoomIndexBeforeFs = null;
      updateZoomLabel();
    }
    updateFullscreenUi();
    rerenderAfterLayoutChange();
  }

  function t(key) {
    const entry = I18N[key];
    if (!entry) return key;
    if (lang === "ar") return entry.ar;
    if (lang === "en") return entry.en || entry.fr;
    return entry.fr;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
      const key = node.getAttribute("data-i18n-title");
      if (!key) return;
      const label = t(key);
      node.setAttribute("title", label);
      node.setAttribute("aria-label", label);
    });
    if (els.title) els.title.textContent = lang === "ar" ? titleAr : titleFr;
    els.langBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    updatePagerUi();
    updateZoomLabel();
  }

  function setLang(next) {
    lang = next === "ar" || next === "en" || next === "fr" ? next : "fr";
    localStorage.setItem(STORAGE_LANG, lang);
    applyI18n();
  }

  function cacheKey(pageNum) {
    return pageNum + "@" + zoomIndex + "@" + fitMode + "@" + pageRotation;
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
    if (els.toolbar) els.toolbar.hidden = true;
    if (els.pageBar) els.pageBar.hidden = true;
    if (els.pager) els.pager.hidden = true;
    if (els.error) els.error.hidden = true;
  }

  function showError() {
    if (els.loading) els.loading.hidden = true;
    if (els.body) els.body.hidden = true;
    if (els.toolbar) els.toolbar.hidden = true;
    if (els.pageBar) els.pageBar.hidden = true;
    if (els.pager) els.pager.hidden = true;
    if (els.error) els.error.hidden = false;
  }

  function showReader() {
    if (els.loading) els.loading.hidden = true;
    if (els.error) els.error.hidden = true;
    if (els.body) els.body.hidden = false;
    if (els.toolbar) els.toolbar.hidden = false;
    syncPagerVisibility();
    syncPageBarVisibility();
    showSwipeHintIfNeeded();
    setStageBusy(false);
  }

  function syncPageBarVisibility() {
    if (!els.pageBar) return;
    const readerVisible = els.body && !els.body.hidden;
    els.pageBar.hidden = !readerVisible || isReaderFullscreen();
  }

  function syncPagerVisibility() {
    if (!els.pager) return;
    const readerVisible = els.body && !els.body.hidden;
    els.pager.hidden = !readerVisible || isReaderFullscreen() || isMobileReader();
  }

  function setStageBusy(busy) {
    if (els.stageWrap) els.stageWrap.classList.toggle("is-busy", !!busy);
  }

  /** Rechargement page (zoom, etc.) sans masquer la barre ni les boutons ‹ › */
  function showSoftPageLoading(msg) {
    if (els.loadingText && msg) els.loadingText.textContent = msg;
    if (els.body && !els.body.hidden) {
      setStageBusy(true);
      return;
    }
    showLoading(msg);
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

  function getStageMaxSize() {
    const pad = 8;
    const wrap = els.stageWrap;
    if (wrap && wrap.clientWidth > 80 && wrap.clientHeight > 80) {
      return {
        maxW: Math.max(200, wrap.clientWidth - pad),
        maxH: Math.max(200, wrap.clientHeight - pad),
      };
    }
    const fs = isReaderFullscreen();
    const thumbOpen =
      fs &&
      els.thumbSidebar &&
      els.thumbSidebar.classList.contains("is-open") &&
      window.innerWidth > 720;
    const thumbW = thumbOpen ? 108 : 0;
    const edgeNav = 80;
    const chromeTop = 48 + 46 + (fs ? 0 : 24);
    const chromeBottom = fs ? 80 : 52;
    return {
      maxW: Math.max(200, window.innerWidth - thumbW - edgeNav - pad),
      maxH: Math.max(200, window.innerHeight - chromeTop - chromeBottom - pad),
    };
  }

  function computeScale(page) {
    const base = page.getViewport({ scale: 1, rotation: pageRotation });
    const size = getStageMaxSize();
    const usePageFit = fitMode === "page" || isReaderFullscreen();
    let fitScale;
    if (usePageFit) {
      fitScale = Math.min(size.maxW / base.width, size.maxH / base.height);
    } else {
      fitScale = size.maxW / base.width;
    }
    return fitScale * ZOOM_LEVELS[zoomIndex];
  }

  function renderPageToFrame(page) {
    const scale = computeScale(page);
    const viewport = page.getViewport({ scale: scale, rotation: pageRotation });
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = Math.floor(viewport.width);
    const cssH = Math.floor(viewport.height);

    const pdfCanvas = document.createElement("canvas");
    pdfCanvas.className = "pdf-layer";
    const pdfCtx = pdfCanvas.getContext("2d", { alpha: false });
    pdfCanvas.width = Math.floor(viewport.width * dpr);
    pdfCanvas.height = Math.floor(viewport.height * dpr);
    pdfCanvas.style.width = cssW + "px";
    pdfCanvas.style.height = cssH + "px";
    pdfCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const inkCanvas = document.createElement("canvas");
    inkCanvas.className = "ink-layer";
    inkCanvas.width = pdfCanvas.width;
    inkCanvas.height = pdfCanvas.height;
    inkCanvas.style.width = cssW + "px";
    inkCanvas.style.height = cssH + "px";

    const frame = document.createElement("div");
    frame.className = "page-frame";
    frame.style.width = cssW + "px";
    frame.style.height = cssH + "px";
    frame.appendChild(pdfCanvas);
    frame.appendChild(inkCanvas);

    return page.render({ canvasContext: pdfCtx, viewport: viewport }).promise.then(function () {
      redrawInk(inkCanvas, currentPage);
      setupInkEvents(inkCanvas, frame);
      return frame;
    });
  }

  function getStrokes(pageNum) {
    if (!inkStrokes.has(pageNum)) inkStrokes.set(pageNum, []);
    return inkStrokes.get(pageNum);
  }

  function distToSegmentSq(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      const ex = px - x1;
      const ey = py - y1;
      return ex * ex + ey * ey;
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const ex = px - cx;
    const ey = py - cy;
    return ex * ex + ey * ey;
  }

  function inkNormFromEvent(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const w = rect.width || 1;
    const h = rect.height || 1;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { nx: x / w, ny: y / h, x: x, y: y };
  }

  function inkXY(pt, cssW, cssH) {
    if (pt.nx != null && pt.ny != null) {
      return { x: pt.nx * cssW, y: pt.ny * cssH };
    }
    return { x: pt.x, y: pt.y };
  }

  function inkNorm(pt) {
    if (pt.nx != null && pt.ny != null) return { nx: pt.nx, ny: pt.ny };
    return { nx: pt.x, ny: pt.y };
  }

  function pointNearEraserPathNorm(pn, eraserPoints, radiusNorm) {
    const r2 = radiusNorm * radiusNorm;
    for (let i = 0; i < eraserPoints.length; i++) {
      const en = inkNorm(eraserPoints[i]);
      let dx = pn.nx - en.nx;
      let dy = pn.ny - en.ny;
      if (dx * dx + dy * dy <= r2) return true;
      if (i > 0) {
        const prev = inkNorm(eraserPoints[i - 1]);
        if (distToSegmentSq(pn.nx, pn.ny, prev.nx, prev.ny, en.nx, en.ny) <= r2) return true;
      }
    }
    return false;
  }

  function segmentNearEraserPath(nx1, ny1, nx2, ny2, eraserPoints, radiusNorm) {
    const span = Math.hypot(nx2 - nx1, ny2 - ny1);
    const steps = Math.max(2, Math.ceil(span / (radiusNorm * 0.35)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const pn = { nx: nx1 + t * (nx2 - nx1), ny: ny1 + t * (ny2 - ny1) };
      if (pointNearEraserPathNorm(pn, eraserPoints, radiusNorm)) return true;
    }
    return false;
  }

  function strokeHitByEraser(stroke, eraserPoints, radiusNorm) {
    if (!stroke.points || !stroke.points.length) return false;
    const pts = stroke.points.map(inkNorm);
    for (let i = 0; i < pts.length; i++) {
      if (pointNearEraserPathNorm(pts[i], eraserPoints, radiusNorm)) return true;
      if (
        i > 0 &&
        segmentNearEraserPath(pts[i - 1].nx, pts[i - 1].ny, pts[i].nx, pts[i].ny, eraserPoints, radiusNorm)
      ) {
        return true;
      }
    }
    return false;
  }

  /** Retire les traits touchés par la gomme (coordonnées normalisées = stable au zoom). */
  function applyEraserToStrokes(pageNum, eraserPoints, radiusNorm) {
    if (!eraserPoints || !eraserPoints.length) return;
    const strokes = getStrokes(pageNum);
    const next = strokes.filter(function (stroke) {
      if (stroke.eraser || !stroke.points || !stroke.points.length) return false;
      return !strokeHitByEraser(stroke, eraserPoints, radiusNorm);
    });
    inkStrokes.set(pageNum, next);
  }

  function markInkDirty() {
    pageCache.clear();
  }

  function redrawInk(canvas, pageNum) {
    const ctx = canvas.getContext("2d");
    const cssW = parseFloat(canvas.style.width) || 1;
    const cssH = parseFloat(canvas.style.height) || 1;
    const dpr = canvas.width / cssW;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    getStrokes(pageNum).forEach(function (stroke) {
      if (!stroke.points.length) return;
      const p0 = inkXY(stroke.points[0], cssW, cssH);
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.highlight ? 0.35 : 1;
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = inkXY(stroke.points[i], cssW, cssH);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  function setupInkEvents(inkCanvas, frame) {
    function startDraw(e) {
      if (activeTool === "hand") return;
      if (e.cancelable) e.preventDefault();
      drawing = true;
      const p = inkNormFromEvent(e, inkCanvas);
      if (activeTool === "eraser") {
        currentStroke = { eraser: true, width: 24, points: [p] };
      } else {
        const highlight = activeTool === "highlight";
        const width = highlight ? 14 : parseInt(els.inkSize.value, 10) || 3;
        currentStroke = {
          color: els.inkColor.value,
          width: width,
          highlight: highlight,
          points: [{ nx: p.nx, ny: p.ny }],
        };
        getStrokes(currentPage).push(currentStroke);
      }
    }

    function moveDraw(e) {
      if (!drawing || !currentStroke) return;
      if (e.cancelable) e.preventDefault();
      const p = inkNormFromEvent(e, inkCanvas);
      if (currentStroke.eraser) {
        const cssW = parseFloat(inkCanvas.style.width) || 1;
        const cssH = parseFloat(inkCanvas.style.height) || 1;
        const last = currentStroke.points[currentStroke.points.length - 1];
        const p0 = inkXY(last, cssW, cssH);
        const ctx = inkCanvas.getContext("2d");
        const dpr = inkCanvas.width / cssW;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.lineWidth = currentStroke.width;
        ctx.lineCap = "round";
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        currentStroke.points.push({ nx: p.nx, ny: p.ny });
      } else {
        currentStroke.points.push({ nx: p.nx, ny: p.ny });
        redrawInk(inkCanvas, currentPage);
      }
    }

    function endDraw() {
      if (drawing && currentStroke) {
        if (currentStroke.eraser && currentStroke.points.length) {
          const cssW = parseFloat(inkCanvas.style.width) || 1;
          const cssH = parseFloat(inkCanvas.style.height) || 1;
          const radiusNorm = currentStroke.width * 0.5 / Math.min(cssW, cssH);
          applyEraserToStrokes(currentPage, currentStroke.points, radiusNorm);
          redrawInk(inkCanvas, currentPage);
        }
        markInkDirty();
      }
      drawing = false;
      currentStroke = null;
    }

    inkCanvas.addEventListener("mousedown", startDraw);
    inkCanvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    inkCanvas.addEventListener("touchstart", startDraw, { passive: false });
    inkCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    inkCanvas.addEventListener("touchend", endDraw);
    inkCanvas.addEventListener("touchcancel", endDraw);

    updateToolUi();
  }

  function updateToolUi() {
    const drawingOn = activeTool === "pen" || activeTool === "highlight" || activeTool === "eraser";
    if (els.stageWrap) {
      els.stageWrap.classList.toggle("is-drawing", drawingOn);
    }
    document.querySelectorAll(".page-frame").forEach(function (f) {
      f.classList.toggle("canvas-drawing", drawingOn);
    });
    [
      ["hand", els.btnToolHand],
      ["pen", els.btnToolPen],
      ["highlight", els.btnToolHighlight],
      ["eraser", els.btnToolEraser],
    ].forEach(function (pair) {
      if (pair[1]) pair[1].classList.toggle("tool-active", activeTool === pair[0]);
    });
  }

  function setTool(tool) {
    activeTool = tool;
    updateToolUi();
  }

  function updateZoomLabel() {
    if (els.zoomLabel) {
      els.zoomLabel.textContent = Math.round(ZOOM_LEVELS[zoomIndex] * 100) + "%";
    }
    if (els.btnZoomOut) els.btnZoomOut.disabled = zoomIndex <= 0;
    if (els.btnZoomIn) els.btnZoomIn.disabled = zoomIndex >= ZOOM_LEVELS.length - 1;
  }

  function setZoomIndex(idx, rerender) {
    const prev = zoomIndex;
    zoomIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx));
    updateZoomLabel();
    if (!rerender || !pdfDoc) return;
    pageCache.clear();
    const zoomingOut = zoomIndex < prev;
    if (isMobileReader() && !zoomingOut) {
      clearTimeout(zoomRerenderTimer);
      zoomRerenderTimer = setTimeout(function () {
        goToPage(currentPage, true).catch(onRenderError);
      }, 280);
      return;
    }
    clearTimeout(zoomRerenderTimer);
    if (els.stageWrap && zoomingOut) {
      els.stageWrap.scrollLeft = 0;
      els.stageWrap.scrollTop = 0;
    }
    if (!isMobileReader()) {
      thumbCache.clear();
      if (els.thumbList) buildThumbSidebar();
    }
    goToPage(currentPage, true).catch(onRenderError);
  }

  function updatePagerUi() {
    const pageLabel = currentPage + " / " + totalPages;
    if (els.pageInfo) els.pageInfo.textContent = pageLabel;
    if (els.toolbarPageInfo) els.toolbarPageInfo.textContent = pageLabel;
    if (els.barPageInfo) els.barPageInfo.textContent = pageLabel;
    if (els.fsPageInfo) els.fsPageInfo.textContent = pageLabel;
    if (els.pageInput) {
      els.pageInput.max = String(totalPages);
      els.pageInput.value = String(currentPage);
    }
    const atStart = currentPage <= 1;
    const atEnd = currentPage >= totalPages;
    if (els.btnPrev) els.btnPrev.disabled = atStart;
    if (els.btnNext) els.btnNext.disabled = atEnd;
    if (els.btnPagePrev) els.btnPagePrev.disabled = atStart;
    if (els.btnPageNext) els.btnPageNext.disabled = atEnd;
    if (els.btnFsPrev) els.btnFsPrev.disabled = atStart;
    if (els.btnFsNext) els.btnFsNext.disabled = atEnd;
    if (els.btnZonePrev) els.btnZonePrev.disabled = atStart;
    if (els.btnZoneNext) els.btnZoneNext.disabled = atEnd;
    if (els.btnHistBack) els.btnHistBack.disabled = historyIndex <= 0;
    if (els.btnHistFwd) els.btnHistFwd.disabled = historyIndex >= pageHistory.length - 1;
    updateThumbActive();
  }

  function updateThumbActive() {
    if (!els.thumbList) return;
    els.thumbList.querySelectorAll(".thumb-item").forEach(function (btn) {
      const n = parseInt(btn.getAttribute("data-page"), 10);
      btn.classList.toggle("is-active", n === currentPage);
    });
    const active = els.thumbList.querySelector(".thumb-item.is-active");
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function renderThumbCanvas(pageNum, wrap) {
    if (thumbCache.has(pageNum)) {
      wrap.innerHTML = "";
      wrap.appendChild(thumbCache.get(pageNum).cloneNode(true));
      wrap.classList.remove("thumb-item__canvas--placeholder");
      return Promise.resolve();
    }
    if (!pdfDoc) return Promise.resolve();
    wrap.classList.add("thumb-item__canvas--placeholder");
    wrap.textContent = "…";
    return pdfDoc.getPage(pageNum).then(function (page) {
      const base = page.getViewport({ scale: 1, rotation: pageRotation });
      const scale = THUMB_MAX_WIDTH / base.width;
      const viewport = page.getViewport({ scale: scale, rotation: pageRotation });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
        thumbCache.set(pageNum, canvas);
        wrap.classList.remove("thumb-item__canvas--placeholder");
        wrap.innerHTML = "";
        wrap.appendChild(canvas);
      });
    }).catch(function () {
      wrap.textContent = String(pageNum);
    });
  }

  function buildThumbSidebar() {
    if (!els.thumbList || !pdfDoc) return;
    if (thumbObserver) thumbObserver.disconnect();
    els.thumbList.innerHTML = "";
    thumbCache.clear();

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thumb-item" + (i === currentPage ? " is-active" : "");
      btn.setAttribute("data-page", String(i));
      btn.setAttribute("aria-label", (lang === "ar" ? "صفحة " : "Page ") + i);
      const wrap = document.createElement("div");
      wrap.className = "thumb-item__canvas thumb-item__canvas--placeholder";
      wrap.textContent = "…";
      const num = document.createElement("span");
      num.className = "thumb-item__num";
      num.textContent = String(i);
      btn.appendChild(wrap);
      btn.appendChild(num);
      btn.addEventListener("click", function () {
        goToPage(i).catch(onRenderError);
        if (window.innerWidth <= 720 && els.thumbSidebar && els.readerLayout) {
          els.thumbSidebar.classList.remove("is-open");
          els.readerLayout.classList.remove("sidebar-open");
        }
      });
      els.thumbList.appendChild(btn);
    }

    thumbObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const btn = entry.target;
          const pageNum = parseInt(btn.getAttribute("data-page"), 10);
          const wrap = btn.querySelector(".thumb-item__canvas");
          if (wrap && !thumbCache.has(pageNum) && wrap.classList.contains("thumb-item__canvas--placeholder")) {
            renderThumbCanvas(pageNum, wrap);
          }
          thumbObserver.unobserve(btn);
        });
      },
      { root: els.thumbList, rootMargin: "120px 0px" }
    );

    els.thumbList.querySelectorAll(".thumb-item").forEach(function (btn) {
      thumbObserver.observe(btn);
    });
    const preload = Math.min(6, totalPages);
    for (let p = 1; p <= preload; p++) {
      const btn = els.thumbList.querySelector('.thumb-item[data-page="' + p + '"]');
      const wrap = btn && btn.querySelector(".thumb-item__canvas");
      if (wrap) renderThumbCanvas(p, wrap);
    }
    updateThumbActive();
  }

  function setThumbSidebarOpen(open) {
    if (!els.thumbSidebar) return;
    const on = !!open;
    els.thumbSidebar.classList.toggle("is-open", on);
    if (els.readerLayout) els.readerLayout.classList.toggle("sidebar-open", on);
    if (els.btnToggleThumbs) els.btnToggleThumbs.classList.toggle("tool-active", on);
  }

  function pushHistory(pageNum) {
    if (navigatingHistory) return;
    if (pageHistory[historyIndex] === pageNum) return;
    pageHistory = pageHistory.slice(0, historyIndex + 1);
    pageHistory.push(pageNum);
    historyIndex = pageHistory.length - 1;
    updatePagerUi();
  }

  function historyBack() {
    if (historyIndex <= 0) return;
    historyIndex--;
    navigatingHistory = true;
    goToPage(pageHistory[historyIndex], true)
      .catch(onRenderError)
      .finally(function () {
        navigatingHistory = false;
        updatePagerUi();
      });
  }

  function historyForward() {
    if (historyIndex >= pageHistory.length - 1) return;
    historyIndex++;
    navigatingHistory = true;
    goToPage(pageHistory[historyIndex], true)
      .catch(onRenderError)
      .finally(function () {
        navigatingHistory = false;
        updatePagerUi();
      });
  }

  function mountFrame(frame) {
    if (!els.stage) return;
    els.stage.innerHTML = "";
    els.stage.appendChild(frame);
    updateToolUi();
  }

  function goToPage(num, skipHistory) {
    const n = Math.max(1, Math.min(totalPages, num));
    const key = cacheKey(n);
    if (n !== currentPage) {
      currentPage = n;
      if (!skipHistory) pushHistory(n);
    }
    updatePagerUi();
    if (els.stageWrap) {
      els.stageWrap.scrollLeft = 0;
      els.stageWrap.scrollTop = 0;
    }

    if (pageCache.has(key)) {
      mountFrame(pageCache.get(key));
      showReader();
      return Promise.resolve();
    }

    const softReload = pdfDoc && els.body && !els.body.hidden;
    if (softReload) {
      showSoftPageLoading(t("loadingPage") + " " + n + " / " + totalPages + "…");
    } else {
      showLoading(t("loadingPage") + " " + n + " / " + totalPages + "…");
    }

    return pdfDoc
      .getPage(n)
      .then(function (page) {
        return renderPageToFrame(page).then(function (frame) {
          pageCache.set(key, frame);
          mountFrame(frame);
          showReader();
        });
      })
      .catch(function (err) {
        setStageBusy(false);
        throw err;
      });
  }

  function bindControls() {
    if (controlsBound) return;
    controlsBound = true;

    function bindPageDelta(btn, delta) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        goToPage(currentPage + delta).catch(onRenderError);
      });
    }
    bindPageDelta(els.btnPrev, -1);
    bindPageDelta(els.btnNext, 1);
    bindPageDelta(els.btnPagePrev, -1);
    bindPageDelta(els.btnPageNext, 1);
    bindPageDelta(els.btnZonePrev, -1);
    bindPageDelta(els.btnZoneNext, 1);
    bindPageDelta(els.btnFsPrev, -1);
    bindPageDelta(els.btnFsNext, 1);
    function bindToggleThumbs(btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        const open = els.thumbSidebar && !els.thumbSidebar.classList.contains("is-open");
        setThumbSidebarOpen(open);
      });
    }
    bindToggleThumbs(els.btnToggleThumbs);
    bindToggleThumbs(els.btnBarThumbs);
    if (els.pageInput) {
      els.pageInput.addEventListener("change", function () {
        const v = parseInt(els.pageInput.value, 10);
        if (!isNaN(v)) goToPage(v).catch(onRenderError);
      });
    }
    if (els.btnHistBack) els.btnHistBack.addEventListener("click", historyBack);
    if (els.btnHistFwd) els.btnHistFwd.addEventListener("click", historyForward);

    if (els.btnZoomOut) {
      els.btnZoomOut.addEventListener("click", function () {
        setZoomIndex(zoomIndex - 1, true);
      });
    }
    if (els.btnZoomIn) {
      els.btnZoomIn.addEventListener("click", function () {
        setZoomIndex(zoomIndex + 1, true);
      });
    }
    if (els.btnFitWidth) {
      els.btnFitWidth.addEventListener("click", function () {
        fitMode = "width";
        pageCache.clear();
        goToPage(currentPage, true).catch(onRenderError);
      });
    }
    if (els.btnFitPage) {
      els.btnFitPage.addEventListener("click", function () {
        resetView();
      });
    }
    function bindResetZoom(btn) {
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        resetView();
      });
    }
    bindResetZoom(els.btnResetZoom);
    bindResetZoom(els.btnResetZoomToolbar);
    if (els.zoomLabel) {
      els.zoomLabel.addEventListener("click", function () {
        if (isMobileReader() || zoomIndex !== DEFAULT_ZOOM_INDEX) resetView();
      });
      els.zoomLabel.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          resetView();
        }
      });
    }
    if (els.btnToolHand) els.btnToolHand.addEventListener("click", function () {
      setTool("hand");
    });
    if (els.btnToolPen) els.btnToolPen.addEventListener("click", function () {
      setTool("pen");
    });
    if (els.btnToolHighlight) {
      els.btnToolHighlight.addEventListener("click", function () {
        setTool("highlight");
      });
    }
    if (els.btnToolEraser) {
      els.btnToolEraser.addEventListener("click", function () {
        setTool("eraser");
      });
    }
    if (els.btnClearInk) {
      els.btnClearInk.addEventListener("click", function () {
        inkStrokes.clear();
        markInkDirty();
        goToPage(currentPage, true).catch(onRenderError);
      });
    }
    let fsTapAt = 0;
    function onFsTap(e) {
      e.preventDefault();
      const now = Date.now();
      if (now - fsTapAt < 350) return;
      fsTapAt = now;
      toggleReaderFullscreen();
    }
    if (els.btnFullscreen) els.btnFullscreen.addEventListener("click", onFsTap);
    if (els.btnFullscreenDesktop) els.btnFullscreenDesktop.addEventListener("click", onFsTap);
    if (els.btnFsExit) {
      els.btnFsExit.addEventListener("click", function (e) {
        e.preventDefault();
        leaveReaderFullscreen();
      });
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    bindPanAndPinch();
    bindSwipeNavigation();
    bindKeyboard();
  }

  const SWIPE_HINT_KEY = "electrodz-pdf-swipe-hint-v4";

  function swipeThreshold() {
    return isMobileReader() ? 36 : 56;
  }

  function pageDeltaFromSwipe(dx, dy) {
    const th = swipeThreshold();
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (Math.abs(dy) < th) return 0;
      return dy < 0 ? 1 : -1;
    }
    if (Math.abs(dx) < th) return 0;
    return dx < 0 ? 1 : -1;
  }

  function canSwipeNavigate(dx, dy) {
    if (isMobileReader() && zoomIndex === DEFAULT_ZOOM_INDEX && fitMode === "page") {
      return true;
    }
    if (!els.stageWrap) return true;
    const wrap = els.stageWrap;
    if (Math.abs(dy) >= Math.abs(dx)) {
      const maxScroll = wrap.scrollHeight - wrap.clientHeight;
      if (maxScroll <= 4) return true;
      const st = wrap.scrollTop;
      if (dy < 0) return st >= maxScroll - 4;
      return st <= 4;
    }
    const maxScroll = wrap.scrollWidth - wrap.clientWidth;
    if (maxScroll <= 4) return true;
    const sl = wrap.scrollLeft;
    if (dx < 0) return sl >= maxScroll - 4;
    return sl <= 4;
  }

  function dismissSwipeHint() {
    try {
      localStorage.setItem(SWIPE_HINT_KEY, "1");
    } catch (e) {}
    if (els.swipeHint) els.swipeHint.hidden = true;
  }

  function showSwipeHintIfNeeded() {
    if (!isMobileReader() || !els.swipeHint) return;
    try {
      if (localStorage.getItem(SWIPE_HINT_KEY)) {
        els.swipeHint.hidden = true;
        return;
      }
    } catch (e) {}
    els.swipeHint.hidden = false;
  }

  function bindSwipeNavigation() {
    const swipeSurface =
      document.querySelector(".reader-stage-area") || els.stageWrap;
    if (!swipeSurface) return;

    [els.btnZonePrev, els.btnZoneNext].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener("click", dismissSwipeHint);
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartT = 0;
    let swipeActive = false;

    swipeSurface.addEventListener(
      "touchstart",
      function (e) {
        if (e.target.closest(".page-v-zone__chev")) return;
        if (e.touches.length !== 1 || activeTool !== "hand" || drawing) return;
        swipeActive = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartT = Date.now();
      },
      { passive: true }
    );

    swipeSurface.addEventListener(
      "touchcancel",
      function () {
        swipeActive = false;
      },
      { passive: true }
    );

    swipeSurface.addEventListener(
      "touchend",
      function (e) {
        if (!swipeActive || activeTool !== "hand" || drawing) return;
        swipeActive = false;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const dt = Date.now() - touchStartT;
        if (dt > (isMobileReader() ? 900 : 650)) return;
        const delta = pageDeltaFromSwipe(dx, dy);
        if (!delta) return;
        if (!canSwipeNavigate(dx, dy)) return;
        dismissSwipeHint();
        goToPage(currentPage + delta).catch(onRenderError);
      },
      { passive: true }
    );
  }

  function bindPanAndPinch() {
    if (!els.stageWrap) return;
    const wrap = els.stageWrap;

    let touchPanning = false;
    let touchPanStartX = 0;
    let touchPanStartY = 0;
    let touchPanScrollLeft = 0;
    let touchPanScrollTop = 0;

    wrap.addEventListener("mousedown", function (e) {
      if (activeTool !== "hand" || drawing) return;
      if (e.target.closest(".ink-layer.canvas-drawing")) return;
      panActive = true;
      els.stageWrap.classList.add("is-grabbing");
      panStartX = e.clientX;
      panStartY = e.clientY;
      panScrollLeft = els.stageWrap.scrollLeft;
      panScrollTop = els.stageWrap.scrollTop;
    });
    window.addEventListener("mousemove", function (e) {
      if (!panActive) return;
      els.stageWrap.scrollLeft = panScrollLeft - (e.clientX - panStartX);
      els.stageWrap.scrollTop = panScrollTop - (e.clientY - panStartY);
    });
    window.addEventListener("mouseup", function () {
      panActive = false;
      if (els.stageWrap) els.stageWrap.classList.remove("is-grabbing");
    });

    els.stageWrap.addEventListener(
      "wheel",
      function (e) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setZoomIndex(zoomIndex + (e.deltaY < 0 ? 1 : -1), true);
        }
      },
      { passive: false }
    );

    els.stageWrap.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length === 2) {
          pinchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          pinchStartZoom = zoomIndex;
        }
      },
      { passive: true }
    );

    els.stageWrap.addEventListener(
      "touchmove",
      function (e) {
        if (e.touches.length === 2 && pinchStartDist > 0) {
          e.preventDefault();
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const ratio = dist / pinchStartDist;
          let target = pinchStartZoom;
          if (ratio > 1.08) target = pinchStartZoom + 1;
          else if (ratio < 0.92) target = pinchStartZoom - 1;
          if (target !== zoomIndex) {
            setZoomIndex(target, true);
            pinchStartZoom = zoomIndex;
            pinchStartDist = dist;
          }
        }
      },
      { passive: false }
    );
  }

  function bindKeyboard() {
    window.addEventListener("keydown", function (e) {
      if (!pdfDoc) return;
      if (e.target.matches("input")) return;
      if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goToPage(currentPage - 1).catch(onRenderError);
      } else if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goToPage(currentPage + 1).catch(onRenderError);
      } else if (e.key === "+" || e.key === "=") {
        setZoomIndex(zoomIndex + 1, true);
      } else if (e.key === "-") {
        setZoomIndex(zoomIndex - 1, true);
      } else if (e.key === "Escape" && isReaderFullscreen()) {
        leaveReaderFullscreen();
      }
    });
  }

  window.addEventListener("resize", function () {
    applyMobileReaderProfile();
    if (!pdfDoc) return;
    clearTimeout(resizeRerenderTimer);
    resizeRerenderTimer = setTimeout(function () {
      pageCache.clear();
      thumbCache.clear();
      buildThumbSidebar();
      goToPage(currentPage, true).catch(onRenderError);
    }, isMobileReader() ? 450 : 120);
  });

  function onRenderError() {
    showError();
    applyI18n();
  }

  function openNativePdf() {
    window.location.href = pdfUrl;
  }

  function initPdf(src) {
    pdfUrl = src;
    document.title = (lang === "ar" ? titleAr : titleFr) + " — SwissDZ";
    if (els.download) els.download.href = src;
    if (els.openFallback) els.openFallback.href = src;

    showLoading(t("loading"));

    loadPdfDocument(src)
      .then(function (pdf) {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        currentPage = 1;
        pageHistory = [1];
        historyIndex = 0;
        pageCache.clear();
        thumbCache.clear();
        applyMobileReaderProfile();
        bindControls();
        updateZoomLabel();
        buildThumbSidebar();
        if (window.innerWidth > 720) setThumbSidebarOpen(true);
        else setThumbSidebarOpen(false);
        const startPage =
          initialPage > 0 && initialPage <= totalPages ? initialPage : 1;
        return goToPage(startPage, true);
      })
      .then(function () {
        showReader();
        applyI18n();
        if (bookId && window.ElectroDzPdfStats) {
          window.ElectroDzPdfStats.trackView(bookId).then(function () {
            try {
              sessionStorage.setItem("electrodz-stats-changed", String(Date.now()));
            } catch (_) {}
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
    const book = { id: bookId, titleFr: titleFr, titleAr: titleAr, pdfUrl: pdfSrc };
    function refreshStar(on) {
      const useEl = els.btnFavorite.querySelector("use");
      if (useEl) {
        useEl.setAttribute("href", on ? "#reader-ico-star-filled" : "#reader-ico-star");
      }
      els.btnFavorite.classList.toggle("btn-fav--on", !!on);
    }
    if (window.ElectroDzFavorites) {
      window.ElectroDzFavorites.isFavorite(bookId).then(refreshStar).catch(function () {});
    }
    els.btnFavorite.addEventListener("click", function () {
      if (!window.ElectroDzFavorites) return;
      window.ElectroDzFavorites.toggleFavorite(book).then(function (res) {
        if (res.needLogin) {
          if (
            confirm(
              lang === "ar"
                ? "سجّل الدخول لحفظ المفضلة."
                : "Connectez-vous pour enregistrer ce PDF."
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
    if (isIOSWebKit()) document.documentElement.classList.add("is-ios");
    applyMobileReaderProfile();
    setBackLinks();
    applyI18n();
    setupFavorite();

    if (els.download && bookId) {
      els.download.addEventListener("click", function () {
        if (window.ElectroDzPdfStats) window.ElectroDzPdfStats.trackDownload(bookId);
      });
    }

    if (!pdfSrc) {
      showError();
      return;
    }

    const src = normalizePdfUrl(decodeURIComponent(pdfSrc));
    const lock = window.ElectroDzLibraryLock;
    if (bookId && lock && lock.isProtected(bookId) && !lock.isUnlocked(bookId)) {
      if (els.download) els.download.hidden = true;
      if (els.openFallback) els.openFallback.hidden = true;
      showLoading(lang === "ar" ? "وصول محمي…" : lang === "en" ? "Protected access…" : "Accès protégé…");
      lock.promptUnlock(bookId).then(function (ok) {
        if (!ok) {
          showError();
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
