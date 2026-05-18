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
  const titleFr = params.get("titleFr") || params.get("title") || "PDF";
  const titleAr = params.get("titleAr") || titleFr;

  const I18N = {
    back: {
      fr: fromPage.indexOf("documentation") !== -1 ? "← Doc" : "← Biblio",
      ar: fromPage.indexOf("documentation") !== -1 ? "← وثائق" : "← مكتبة",
    },
    download: { fr: "Télécharger", ar: "تنزيل" },
    openExternal: { fr: "Ouvrir le PDF", ar: "فتح PDF" },
    loading: { fr: "Chargement…", ar: "جاري التحميل…" },
    loadingPage: { fr: "Page", ar: "صفحة" },
    error: {
      fr: "Ce PDF ne peut pas s’afficher ici. Appuyez sur « Ouvrir le PDF ».",
      ar: "تعذر العرض هنا. اضغط « فتح PDF ».",
    },
    swipeHint: {
      fr: "Pincement = zoom · Glisser = déplacer · Stylo = annoter",
      ar: "قرص = تكبير · سحب = تحريك · قلم = كتابة",
    },
    goto: { fr: "Page", ar: "صفحة" },
    toolHand: { fr: "Main", ar: "يد" },
    toolPen: { fr: "Stylo", ar: "قلم" },
    toolHighlight: { fr: "Surligneur", ar: "تمييز" },
    toolEraser: { fr: "Gomme", ar: "ممحاة" },
    fitWidth: { fr: "Largeur", ar: "عرض" },
    fitPage: { fr: "Page", ar: "صفحة" },
    fullscreen: { fr: "Plein écran", ar: "ملء الشاشة" },
    rotate: { fr: "Rotation", ar: "دوران" },
    clearInk: { fr: "Effacer annotations", ar: "مسح التعليقات" },
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
    btnRotate: document.getElementById("btn-rotate"),
    btnFullscreen: document.getElementById("btn-fullscreen"),
    inkColor: document.getElementById("ink-color"),
    inkSize: document.getElementById("ink-size"),
    btnFavorite: document.getElementById("btn-favorite"),
    langBtns: document.querySelectorAll("[data-lang]"),
  };

  let lang = localStorage.getItem(STORAGE_LANG) || "ar";
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

  let drawing = false;
  let currentStroke = null;

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
    updateZoomLabel();
  }

  function setLang(next) {
    lang = next === "ar" ? "ar" : "fr";
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
    if (els.error) els.error.hidden = true;
  }

  function showError() {
    if (els.loading) els.loading.hidden = true;
    if (els.body) els.body.hidden = true;
    if (els.toolbar) els.toolbar.hidden = true;
    if (els.error) els.error.hidden = false;
  }

  function showReader() {
    if (els.loading) els.loading.hidden = true;
    if (els.error) els.error.hidden = true;
    if (els.body) els.body.hidden = false;
    if (els.toolbar) els.toolbar.hidden = false;
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

  function computeScale(page) {
    const base = page.getViewport({ scale: 1, rotation: pageRotation });
    const wrap = els.stageWrap;
    const pad = 24;
    const maxW = Math.max(200, (wrap ? wrap.clientWidth : window.innerWidth) - pad);
    const maxH = Math.max(200, (wrap ? wrap.clientHeight : window.innerHeight) - 120);
    let fitScale;
    if (fitMode === "page") {
      fitScale = Math.min(maxW / base.width, maxH / base.height);
    } else {
      fitScale = maxW / base.width;
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

  function redrawInk(canvas, pageNum) {
    const ctx = canvas.getContext("2d");
    const dpr = canvas.width / parseFloat(canvas.style.width);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    getStrokes(pageNum).forEach(function (stroke) {
      if (!stroke.points.length) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.highlight ? 0.35 : 1;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  function setupInkEvents(inkCanvas, frame) {
    function posFromEvent(e) {
      const rect = inkCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDraw(e) {
      if (activeTool === "hand") return;
      if (e.cancelable) e.preventDefault();
      drawing = true;
      const p = posFromEvent(e);
      if (activeTool === "eraser") {
        currentStroke = { eraser: true, width: 20, points: [p] };
      } else {
        const highlight = activeTool === "highlight";
        const width = highlight ? 14 : parseInt(els.inkSize.value, 10) || 3;
        currentStroke = {
          color: els.inkColor.value,
          width: width,
          highlight: highlight,
          points: [p],
        };
        getStrokes(currentPage).push(currentStroke);
      }
    }

    function moveDraw(e) {
      if (!drawing || !currentStroke) return;
      if (e.cancelable) e.preventDefault();
      const p = posFromEvent(e);
      if (currentStroke.eraser) {
        const ctx = inkCanvas.getContext("2d");
        const dpr = inkCanvas.width / parseFloat(inkCanvas.style.width);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.lineWidth = currentStroke.width;
        ctx.lineCap = "round";
        ctx.moveTo(currentStroke.points[currentStroke.points.length - 1].x, currentStroke.points[currentStroke.points.length - 1].y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        currentStroke.points.push(p);
      } else {
        currentStroke.points.push(p);
        redrawInk(inkCanvas, currentPage);
      }
    }

    function endDraw() {
      drawing = false;
      currentStroke = null;
    }

    inkCanvas.addEventListener("mousedown", startDraw);
    inkCanvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    inkCanvas.addEventListener("touchstart", startDraw, { passive: false });
    inkCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    inkCanvas.addEventListener("touchend", endDraw);

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
    zoomIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx));
    updateZoomLabel();
    if (rerender && pdfDoc) {
      pageCache.clear();
      goToPage(currentPage, true).catch(onRenderError);
    }
  }

  function updatePagerUi() {
    if (els.pageInfo) els.pageInfo.textContent = currentPage + " / " + totalPages;
    if (els.pageInput) {
      els.pageInput.max = String(totalPages);
      els.pageInput.value = String(currentPage);
    }
    if (els.btnPrev) els.btnPrev.disabled = currentPage <= 1;
    if (els.btnNext) els.btnNext.disabled = currentPage >= totalPages;
    if (els.btnHistBack) els.btnHistBack.disabled = historyIndex <= 0;
    if (els.btnHistFwd) els.btnHistFwd.disabled = historyIndex >= pageHistory.length - 1;
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
      return Promise.resolve();
    }

    showLoading(t("loadingPage") + " " + n + " / " + totalPages + "…");

    return pdfDoc.getPage(n).then(function (page) {
      return renderPageToFrame(page).then(function (frame) {
        pageCache.set(key, frame);
        mountFrame(frame);
        showReader();
      });
    });
  }

  function bindControls() {
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
        fitMode = "page";
        pageCache.clear();
        goToPage(currentPage, true).catch(onRenderError);
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
        pageCache.clear();
        goToPage(currentPage, true).catch(onRenderError);
      });
    }
    if (els.btnRotate) {
      els.btnRotate.addEventListener("click", function () {
        pageRotation = (pageRotation + 90) % 360;
        pageCache.clear();
        goToPage(currentPage, true).catch(onRenderError);
      });
    }
    if (els.btnFullscreen) {
      els.btnFullscreen.addEventListener("click", function () {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function () {});
          document.body.classList.add("is-fullscreen");
        } else {
          document.exitFullscreen();
          document.body.classList.remove("is-fullscreen");
        }
      });
    }
    document.addEventListener("fullscreenchange", function () {
      if (!document.fullscreenElement) document.body.classList.remove("is-fullscreen");
    });

    bindPanAndPinch();
    bindKeyboard();
  }

  function bindPanAndPinch() {
    if (!els.stageWrap) return;

    els.stageWrap.addEventListener("mousedown", function (e) {
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
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (lang === "ar") goToPage(currentPage + 1).catch(onRenderError);
        else goToPage(currentPage - 1).catch(onRenderError);
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (lang === "ar") goToPage(currentPage - 1).catch(onRenderError);
        else goToPage(currentPage + 1).catch(onRenderError);
      } else if (e.key === "+" || e.key === "=") {
        setZoomIndex(zoomIndex + 1, true);
      } else if (e.key === "-") {
        setZoomIndex(zoomIndex - 1, true);
      }
    });
  }

  window.addEventListener("resize", function () {
    if (!pdfDoc) return;
    pageCache.clear();
    goToPage(currentPage, true).catch(onRenderError);
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
    document.title = (lang === "ar" ? titleAr : titleFr) + " — DZSWISS ELEC";
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
        bindControls();
        updateZoomLabel();
        return goToPage(1, true);
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
      els.btnFavorite.textContent = on ? "★" : "☆";
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
      showLoading(lang === "ar" ? "وصول محمي…" : "Accès protégé…");
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
