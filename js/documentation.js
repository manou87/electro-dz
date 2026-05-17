/**
 * Documentation — ouverture PDF dans lecteur-pdf.html (fichiers locaux).
 */
(function () {
  "use strict";

  function buildReaderHref(localSrc, resKey, titleFr, titleAr, bookId) {
    const q = new URLSearchParams();
    q.set("src", localSrc);
    q.set("from", "documentation.html");
    if (resKey) q.set("titleFr", titleFr || "");
    if (resKey) q.set("titleAr", titleAr || titleFr || "");
    if (bookId) q.set("id", bookId);
    return "lecteur-pdf.html?" + q.toString();
  }

  function wirePdfLinks() {
    const T = window.ElectroDzDocsI18n;
    document.querySelectorAll("a.doc-resource--pdf[data-pdf-src]").forEach(function (link) {
      const src = (link.getAttribute("data-pdf-src") || "").trim();
      if (!src) return;
      const key = link.getAttribute("data-res-key") || "";
      const bookId = link.getAttribute("data-book-id") || "";
      const titleFr = T && key ? T.t("fr", key) : "";
      const titleAr = T && key ? T.t("ar", key) : titleFr;
      link.href = buildReaderHref(src, key, titleFr, titleAr, bookId);
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = link.href;
      });
    });
  }

  function wireLocalFiles() {
    document.querySelectorAll("a.doc-resource--file[href]").forEach(function (link) {
      link.removeAttribute("target");
      if (!link.hasAttribute("download")) link.setAttribute("download", "");
    });
    document.querySelectorAll("a.doc-resource--img[href^='assets/']").forEach(function (link) {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      wirePdfLinks();
      wireLocalFiles();
    });
  } else {
    wirePdfLinks();
    wireLocalFiles();
  }

  window.ElectroDzDocsWire = { refresh: wirePdfLinks };
})();
