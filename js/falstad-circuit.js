/**
 * Simulateur Falstad (circuitjs) — intégration web SwissDZ
 */
(function () {
  var FALSTAD_URLS = [
    "circuitjs1/circuitjs.html",
    "https://pfalstad.github.io/circuitjs1/circuitjs.html",
    "https://www.falstad.com/circuit/circuitjs.html",
  ];

  var frame = document.getElementById("falstadFrame");
  var loading = document.getElementById("falstadLoading");
  var errorPanel = document.getElementById("falstadError");
  var errorDetails = document.getElementById("falstadErrorDetails");
  var btnRetry = document.getElementById("btnFalstadRetry");
  var btnOpenBrowser = document.getElementById("btnFalstadBrowser");

  if (!frame) return;

  var urlIndex = 0;
  var loadTimer = null;
  var loaded = false;

  function t(key) {
    if (window.SchemasPlansI18n && window.SchemasPlansI18n.t) {
      return window.SchemasPlansI18n.t(key);
    }
    return key;
  }

  function showLoading() {
    loaded = false;
    if (loading) loading.hidden = false;
    if (errorPanel) errorPanel.hidden = true;
    frame.hidden = false;
  }

  function hideLoading() {
    loaded = true;
    if (loading) loading.hidden = true;
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
  }

  function showError(details) {
    hideLoading();
    frame.hidden = true;
    if (errorPanel) errorPanel.hidden = false;
    if (errorDetails) {
      errorDetails.textContent = details || "";
      errorDetails.hidden = !details;
    }
  }

  function currentUrl() {
    return FALSTAD_URLS[urlIndex];
  }

  function onlineFallbackUrl() {
    for (var i = 0; i < FALSTAD_URLS.length; i++) {
      if (FALSTAD_URLS[i].indexOf("http") === 0) return FALSTAD_URLS[i];
    }
    return "https://pfalstad.github.io/circuitjs1/circuitjs.html";
  }

  function siteLang() {
    if (window.SchemasPlansI18n && typeof window.SchemasPlansI18n.getLang === "function") {
      return window.SchemasPlansI18n.getLang();
    }
    try {
      var s = localStorage.getItem("electrodz-site-lang");
      if (s === "fr" || s === "ar" || s === "en") return s;
    } catch (e) {}
    return "fr";
  }

  /** circuitjs: `en` = built-in English; `fr` uses locale_fr.txt. No Arabic pack. */
  function falstadLang() {
    return siteLang() === "en" ? "en" : "fr";
  }

  function withLang(url) {
    var sep = url.indexOf("?") >= 0 ? "&" : "?";
    return url + sep + "lang=" + falstadLang() + "&_v=" + Date.now();
  }

  function loadFrame() {
    showLoading();
    var url = currentUrl();
    frame.removeAttribute("srcdoc");
    frame.src = withLang(url);

    if (loadTimer) clearTimeout(loadTimer);
    loadTimer = setTimeout(function () {
      if (!loaded) tryNextUrl("timeout");
    }, 20000);
  }

  function tryNextUrl(reason) {
    if (urlIndex < FALSTAD_URLS.length - 1) {
      urlIndex += 1;
      loadFrame();
      return;
    }
    showError(reason || "");
  }

  frame.addEventListener("load", function () {
    hideLoading();
  });

  frame.addEventListener("error", function () {
    tryNextUrl("load error");
  });

  if (btnRetry) {
    btnRetry.addEventListener("click", function () {
      if (urlIndex >= FALSTAD_URLS.length - 1) urlIndex = 0;
      else urlIndex += 1;
      loadFrame();
    });
  }

  if (btnOpenBrowser) {
    btnOpenBrowser.addEventListener("click", function () {
      window.open(withLang(onlineFallbackUrl()), "_blank", "noopener,noreferrer");
    });
  }

  window.addEventListener("resize", function () {
    if (!loaded) return;
    try {
      frame.contentWindow && frame.contentWindow.dispatchEvent(new Event("resize"));
    } catch (e) {}
  });

  document.addEventListener("electrodz-lang-changed", function () {
    if (errorPanel && !errorPanel.hidden) {
      document.querySelectorAll("#falstadError [data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        if (key) el.textContent = t(key);
      });
    }
    urlIndex = 0;
    loadFrame();
  });

  loadFrame();
})();
