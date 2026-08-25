/**
 * Bouton Accueil / Home / الرئيسية — injection centralisée sur toutes les sections.
 * FR → index-fr.html · AR/EN → index.html
 */
(function () {
  "use strict";

  if (window.__EDZ_HOME_NAV__) return;
  window.__EDZ_HOME_NAV__ = true;

  var STORAGE = "electrodz-site-lang";
  var STYLE_ID = "edz-home-nav-css";

  function isHomePage() {
    var base = (location.pathname || "").split("/").pop() || "";
    return (
      base === "" ||
      base === "index.html" ||
      base === "index-fr.html" ||
      base === "index-en.html"
    );
  }

  function sitePrefix() {
    var path = location.pathname || "";
    var parts = path.split("/").filter(Boolean);
    if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) parts.pop();
    if (!parts.length) return "";
    return parts.map(function () { return ".."; }).join("/") + "/";
  }

  function getLang() {
    try {
      var s = localStorage.getItem(STORAGE);
      if (s === "fr" || s === "ar" || s === "en") return s;
    } catch (e) { /* ignore */ }
    var htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.indexOf("fr") === 0) return "fr";
    if (htmlLang.indexOf("en") === 0) return "en";
    return "ar";
  }

  function homeHref(lang) {
    var prefix = sitePrefix();
    if (lang === "fr") return prefix + "index-fr.html";
    return prefix + "index.html";
  }

  function homeLabel(lang) {
    if (lang === "fr") return "Accueil";
    if (lang === "en") return "Home";
    return "الرئيسية";
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      ".edz-home-link{" +
      "display:inline-flex;align-items:center;justify-content:center;" +
      "margin-inline-start:10px;padding:5px 11px;border-radius:8px;" +
      "border:1px solid rgba(250,204,21,.38);background:rgba(250,204,21,.12);" +
      "color:#facc15!important;font-size:.82rem;font-weight:700;" +
      "text-decoration:none!important;white-space:nowrap;line-height:1.2;" +
      "transition:background .15s,border-color .15s,color .15s" +
      "}" +
      ".edz-home-link:hover,.edz-home-link:focus-visible{" +
      "background:rgba(250,204,21,.22);border-color:rgba(250,204,21,.6);" +
      "color:#fde047!important;outline:none" +
      "}" +
      ".edz-home-bar{" +
      "display:flex;align-items:center;gap:10px;padding:8px 12px;" +
      "background:rgba(8,12,22,.96);border-bottom:1px solid rgba(250,204,21,.25);" +
      "position:sticky;top:0;z-index:1000" +
      "}" +
      ".edz-home-bar .edz-home-link{margin-inline-start:0}" +
      "html[dir=rtl] .edz-home-link{margin-inline-start:0;margin-inline-end:10px}" +
      "@media(max-width:480px){.edz-home-link{font-size:.75rem;padding:4px 9px}}" +
      "li[data-edz-home-dup]{display:none!important}";
    (document.head || document.documentElement).appendChild(style);
  }

  function isBrandLink(a) {
    if (!a || !a.classList) return false;
    return (
      a.classList.contains("logo") ||
      a.classList.contains("brand") ||
      a.classList.contains("sim-brand") ||
      a.classList.contains("schemas-brand") ||
      a.classList.contains("ec-brand") ||
      a.classList.contains("footer-logo")
    );
  }

  function isHomeHref(href) {
    if (!href) return false;
    var h = href.split("?")[0].split("#")[0];
    return /(?:^|\/)index(?:-fr|-en)?\.html$/i.test(h) || h === "./" || h === "/";
  }

  function findExistingHomeTextLinks() {
    var out = [];
    document.querySelectorAll("a[href]").forEach(function (a) {
      if (isBrandLink(a)) return;
      if (a.getAttribute("data-edz-home") === "1") {
        out.push(a);
        return;
      }
      var i18n = a.getAttribute("data-i18n") || "";
      if (i18n === "nav.home" || i18n === "navHome") {
        out.push(a);
        return;
      }
      if (a.getAttribute("data-i18n-fr") === "Accueil") {
        out.push(a);
        return;
      }
      var t = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (t === "Accueil" || t === "Home" || t === "الرئيسية") out.push(a);
    });
    return out;
  }

  function updateBrandHrefs(lang) {
    var href = homeHref(lang);
    document
      .querySelectorAll(
        "a.logo[href], a.brand[href], a.sim-brand[href], a.schemas-brand[href], a.ec-brand[href]"
      )
      .forEach(function (a) {
        if (!isHomeHref(a.getAttribute("href"))) return;
        a.setAttribute("href", href);
        if (a.hasAttribute("data-i18n-href-fr")) {
          a.setAttribute("data-i18n-href-fr", sitePrefix() + "index-fr.html");
          a.setAttribute("data-i18n-href-ar", sitePrefix() + "index.html");
        }
      });
  }

  function applyLink(a, lang) {
    a.setAttribute("data-edz-home", "1");
    a.setAttribute("href", homeHref(lang));
    var i18n = a.getAttribute("data-i18n") || "";
    /* Laisser i18n page-level remplir le libellé si présent */
    if (!i18n && !a.getAttribute("data-i18n-fr")) {
      a.textContent = homeLabel(lang);
    }
  }

  function findInsertAnchor() {
    return (
      document.querySelector("nav.nav > a.logo") ||
      document.querySelector(".site-header a.logo") ||
      document.querySelector("header .logo") ||
      document.querySelector(".sim-brand") ||
      document.querySelector(".schemas-brand") ||
      document.querySelector(".unif-auto-top .brand") ||
      document.querySelector(".reader-header a[data-back-link]") ||
      document.querySelector(".ec-header .ec-brand") ||
      document.querySelector("nav > a.logo") ||
      document.querySelector("nav a.logo")
    );
  }

  function findNavList() {
    return (
      document.querySelector(".nav-links") ||
      document.querySelector(".main-nav ul") ||
      document.querySelector(".ec-nav-main") ||
      null
    );
  }

  function createHomeLink(lang) {
    var a = document.createElement("a");
    a.className = "edz-home-link";
    a.setAttribute("data-edz-home", "1");
    a.setAttribute("href", homeHref(lang));
    a.textContent = homeLabel(lang);
    a.setAttribute("aria-label", homeLabel(lang));
    return a;
  }

  function injectIntoNavList(list, lang) {
    if (list.querySelector("[data-edz-home]")) return;
    var a = createHomeLink(lang);
    var li = document.createElement("li");
    li.appendChild(a);
    if (list.firstChild) list.insertBefore(li, list.firstChild);
    else list.appendChild(li);
  }

  function injectBeside(anchor, lang) {
    if (!anchor || !anchor.parentNode) return;
    if (anchor.parentNode.querySelector("[data-edz-home]")) return;
    var a = createHomeLink(lang);
    if (anchor.nextSibling) anchor.parentNode.insertBefore(a, anchor.nextSibling);
    else anchor.parentNode.appendChild(a);
  }

  function injectTopBar(lang) {
    if (document.querySelector(".edz-home-bar")) return;
    var bar = document.createElement("div");
    bar.className = "edz-home-bar";
    bar.setAttribute("role", "navigation");
    bar.setAttribute("aria-label", homeLabel(lang));
    bar.appendChild(createHomeLink(lang));
    var body = document.body;
    if (!body) return;
    body.insertBefore(bar, body.firstChild);
    /* Réserver de la place si iframe plein écran */
    var iframe = body.querySelector("iframe");
    if (iframe && body.children.length <= 3) {
      body.style.display = "flex";
      body.style.flexDirection = "column";
      body.style.height = "100%";
      iframe.style.flex = "1";
      iframe.style.height = "auto";
      iframe.style.minHeight = "0";
    }
  }

  function ensure() {
    if (isHomePage()) return;
    injectCss();
    var lang = getLang();
    updateBrandHrefs(lang);

    var existing = findExistingHomeTextLinks();
    existing.forEach(function (a) {
      applyLink(a, lang);
    });

    var logo = findInsertAnchor();
    var hasBesideLogo = false;
    if (logo && logo.parentNode) {
      var kids = logo.parentNode.children;
      for (var i = 0; i < kids.length; i++) {
        if (kids[i] !== logo && kids[i].getAttribute && kids[i].getAttribute("data-edz-home") === "1") {
          hasBesideLogo = true;
          break;
        }
      }
    }

    var onlyHiddenNavLinks =
      existing.length > 0 &&
      existing.every(function (a) {
        return !!a.closest(".nav-links");
      });

    var hasVisibleNavHome = existing.some(function (a) {
      return !!a.closest(".main-nav, .nav-main, .ec-nav-main") && !a.closest(".nav-links");
    });

    if (hasBesideLogo || (hasVisibleNavHome && !onlyHiddenNavLinks)) {
      existing.forEach(function (a) {
        if (
          !a.classList.contains("edz-home-link") &&
          !a.classList.contains("nav-btn") &&
          !a.classList.contains("btn") &&
          !a.classList.contains("btn-primary")
        ) {
          a.classList.add("edz-home-link");
        }
      });
      return;
    }

    if (onlyHiddenNavLinks) {
      existing.forEach(function (a) {
        var li = a.closest("li");
        if (li) li.setAttribute("data-edz-home-dup", "1");
      });
    }

    if (logo) {
      injectBeside(logo, lang);
      return;
    }

    var list = findNavList();
    if (list && !list.querySelector("[data-edz-home]")) {
      injectIntoNavList(list, lang);
      return;
    }

    var flatNav = document.querySelector(
      ".main-nav, .nav-main, .sim-topbar, .schemas-topbar-inner, .unif-auto-top, .reader-header"
    );
    if (flatNav && !flatNav.querySelector("[data-edz-home]")) {
      flatNav.insertBefore(createHomeLink(lang), flatNav.firstChild);
      return;
    }

    injectTopBar(lang);
  }

  function boot() {
    ensure();
    setTimeout(ensure, 200);
    setTimeout(ensure, 800);
    setTimeout(ensure, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-lang],[data-lang-fr],[data-lang-ar],[data-lang-en]") : null;
      if (!t) return;
      setTimeout(ensure, 30);
      setTimeout(ensure, 200);
    },
    true
  );

  document.addEventListener("electrodz-lang-changed", function () {
    setTimeout(ensure, 0);
  });

  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE) ensure();
  });

  window.ElectroDzHomeNav = {
    refresh: ensure,
    homeHref: homeHref,
    homeLabel: homeLabel,
    getLang: getLang,
  };
})();
