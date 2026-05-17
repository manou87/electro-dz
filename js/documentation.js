/**
 * Documentation — ouverture PDF dans lecteur-pdf.html + vignettes aperçu.
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

  function previewSrcForPdf(link) {
    const id = (link.getAttribute("data-book-id") || "").trim();
    if (id) return "assets/covers/previews/" + id + ".png";
    const pdf = (link.getAttribute("data-pdf-src") || "").trim();
    if (/^pdf\/.+\.pdf$/i.test(pdf)) {
      const base = pdf.replace(/^pdf\//i, "").replace(/\.pdf$/i, "");
      return "assets/covers/previews/" + base + ".png";
    }
    return "";
  }

  function createThumbElement(link) {
    const thumb = document.createElement("span");
    thumb.className = "doc-resource-thumb";

    if (link.classList.contains("doc-resource--pdf")) {
      const src = previewSrcForPdf(link);
      if (!src) return null;
      const img = document.createElement("img");
      img.className = "doc-resource-thumb-img";
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = function () {
        thumb.classList.add("doc-resource-thumb--fallback");
        img.remove();
        const fb = document.createElement("span");
        fb.className = "doc-resource-thumb-fallback";
        fb.setAttribute("aria-hidden", "true");
        fb.textContent = "PDF";
        thumb.appendChild(fb);
      };
      thumb.appendChild(img);
      return thumb;
    }

    if (link.classList.contains("doc-resource--img")) {
      const src = (link.getAttribute("href") || "").trim();
      if (!src || !/^assets\//i.test(src)) return null;
      const img = document.createElement("img");
      img.className = "doc-resource-thumb-img";
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      thumb.appendChild(img);
      return thumb;
    }

    if (link.classList.contains("doc-resource--file")) {
      thumb.classList.add("doc-resource-thumb--xls");
      const fb = document.createElement("span");
      fb.className = "doc-resource-thumb-fallback";
      fb.setAttribute("aria-hidden", "true");
      fb.textContent = "XLS";
      thumb.appendChild(fb);
      return thumb;
    }

    if (link.classList.contains("doc-resource--web")) {
      thumb.classList.add("doc-resource-thumb--web");
      const fb = document.createElement("span");
      fb.className = "doc-resource-thumb-fallback";
      fb.setAttribute("aria-hidden", "true");
      fb.textContent = "↗";
      thumb.appendChild(fb);
      return thumb;
    }

    return null;
  }

  function applyResourcePreviews() {
    document.querySelectorAll("a.doc-resource").forEach(function (link) {
      if (link.classList.contains("doc-resource--has-preview")) return;

      const thumb = createThumbElement(link);
      if (!thumb) return;

      const tag = link.querySelector(".doc-resource-tag");
      const title = link.querySelector(".doc-resource-title");
      const arrow = link.querySelector(".doc-resource-arrow");

      const body = document.createElement("span");
      body.className = "doc-resource-body";
      if (tag) body.appendChild(tag);
      if (title) body.appendChild(title);

      link.classList.add("doc-resource--has-preview");
      link.insertBefore(thumb, link.firstChild);
      link.insertBefore(body, arrow || null);
    });
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

  function init() {
    applyResourcePreviews();
    wirePdfLinks();
    wireLocalFiles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ElectroDzDocsWire = {
    refresh: function () {
      wirePdfLinks();
    },
  };
})();
