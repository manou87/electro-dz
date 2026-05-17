/**
 * Page Formations — PDF (livres.json) + modules vidéo (formations.json)
 */
(function () {
  var STORAGE = "electrodz-site-lang";
  var grid = document.querySelector("[data-formation-books]");
  var videoGrid = document.querySelector("[data-formation-videos]");
  var videoBlock = document.querySelector("[data-formation-videos-block]");
  var emptyBooks = document.querySelector("[data-formation-books-empty]");
  var countEl = document.querySelector("[data-formation-count]");

  if (!grid) return;

  var lang = "ar";
  try {
    lang = localStorage.getItem(STORAGE) || "ar";
  } catch (e) {}

  function t(fr, ar) {
    return lang === "ar" ? ar : fr;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pdfHref(book) {
    var q = new URLSearchParams();
    q.set("src", book.pdfUrl);
    q.set("id", book.id || "");
    q.set("titleFr", book.titleFr || "");
    q.set("titleAr", book.titleAr || book.titleFr || "");
    return "lecteur-pdf.html?" + q.toString();
  }

  function coverSrc(book) {
    if (book.coverPreview) return book.coverPreview;
    return lang === "ar" ? book.coverImageAr || book.coverImageFr : book.coverImageFr || book.coverImageAr;
  }

  function renderBookCard(book) {
    var title = lang === "ar" ? book.titleAr || book.titleFr : book.titleFr;
    var desc = lang === "ar" ? book.descriptionAr || book.descriptionFr : book.descriptionFr;
    var cover = coverSrc(book);
    var card = document.createElement("article");
    card.className = "book-card";
    var href = pdfHref(book);
    card.innerHTML =
      '<a class="book-card-inner" href="' +
      escapeHtml(href) +
      '"><div class="book-cover">' +
      (cover
        ? '<img src="' + escapeHtml(cover) + '" alt="" loading="lazy" decoding="async"/>'
        : '<span class="book-cover-fallback">🎓</span>') +
      "</div>" +
      '<div class="book-body">' +
      '<span class="book-category">' +
      escapeHtml(t("Formation PDF", "تكوين PDF")) +
      "</span>" +
      "<h3>" +
      escapeHtml(title || "") +
      "</h3>" +
      (desc ? "<p>" + escapeHtml(desc) + "</p>" : "") +
      '<span class="book-link">' +
      escapeHtml(t("Ouvrir le PDF →", "فتح PDF ←")) +
      "</span>" +
      "</div></a>";
    return card;
  }

  function renderBooks(books) {
    grid.innerHTML = "";
    if (!books.length) {
      if (emptyBooks) emptyBooks.hidden = false;
      if (countEl) countEl.textContent = "";
      return;
    }
    if (emptyBooks) emptyBooks.hidden = true;
    if (countEl) {
      countEl.textContent = t(
        books.length + " support" + (books.length > 1 ? "s" : "") + " PDF",
        books.length + " دعم PDF"
      );
    }
    books.forEach(function (book) {
      grid.appendChild(renderBookCard(book));
    });
  }

  function renderVideoModules(modules) {
    if (!videoGrid || !videoBlock) return;
    videoGrid.innerHTML = "";
    var list = (modules || []).filter(function (m) {
      return m && (m.videoUrl || m.youtubeUrl);
    });
    if (!list.length) {
      videoBlock.hidden = false;
      return;
    }
    videoBlock.hidden = false;
    list.forEach(function (mod) {
      var title = lang === "ar" ? mod.titleAr || mod.titleFr : mod.titleFr;
      var el = document.createElement("article");
      el.className = "formation-video-card";
      var href = mod.youtubeUrl || mod.videoUrl;
      el.innerHTML =
        "<h3>" +
        escapeHtml(title || "") +
        "</h3>" +
        '<a class="btn btn-primary" href="' +
        escapeHtml(href) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(t("Voir la vidéo", "مشاهدة الفيديو")) +
        "</a>";
      videoGrid.appendChild(el);
    });
  }

  function load() {
    fetch("data/livres.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("livres");
        return r.json();
      })
      .then(function (catalog) {
        return fetch("data/formations.json", { cache: "no-store" })
          .then(function (r) {
            return r.ok ? r.json() : { modules: [] };
          })
          .catch(function () {
            return { modules: [] };
          })
          .then(function (formations) {
            return { catalog: catalog, formations: formations };
          });
      })
      .then(function (results) {
        var catalog = results.catalog;
        var formations = results.formations;
        var books = (catalog.books || []).filter(function (b) {
          return b.category === "formation" && b.pdfUrl && b.pdfUrl !== "#";
        });
        books.sort(function (a, b) {
          return (b.year || 0) - (a.year || 0);
        });
        renderBooks(books);
        renderVideoModules(formations.modules);
      })
      .catch(function () {
        if (emptyBooks) {
          emptyBooks.hidden = false;
          emptyBooks.textContent = t(
            "Impossible de charger le catalogue.",
            "تعذّر تحميل القائمة."
          );
        }
      });
  }

  document.addEventListener("electrodz-lang-changed", function (ev) {
    if (ev.detail && (ev.detail.lang === "fr" || ev.detail.lang === "ar")) {
      lang = ev.detail.lang;
      load();
    }
  });

  load();
})();
