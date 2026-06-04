/**
 * Page Formations — quiz NF C 15-100 + PDF (livres.json, catégorie formation)
 * PDF protégés : même codes que la bibliothèque (library-protected.js)
 */
(function () {
  var STORAGE = "electrodz-site-lang";
  var grid = document.querySelector("[data-formation-books]");
  var emptyBooks = document.querySelector("[data-formation-books-empty]");
  var countEl = document.querySelector("[data-formation-count]");

  if (!grid) return;

  var lang = "ar";
  var lastBooks = [];

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

  function isBookLocked(book) {
    var lock = window.ElectroDzLibraryLock;
    return !!(lock && book.id && lock.isProtected(book.id) && !lock.isUnlocked(book.id));
  }

  function withBookAccess(book, fn) {
    var lock = window.ElectroDzLibraryLock;
    if (!lock || !book.id || !lock.isProtected(book.id) || lock.isUnlocked(book.id)) {
      fn();
      return;
    }
    lock.guardAccess(book.id, fn);
  }

  function pdfHref(book) {
    var q = new URLSearchParams();
    q.set("src", book.pdfUrl);
    q.set("id", book.id || "");
    q.set("titleFr", book.titleFr || "");
    q.set("titleAr", book.titleAr || book.titleFr || "");
    return "lecteur-pdf.html?" + q.toString();
  }

  function resolveAssetUrl(relativePath) {
    if (!relativePath || /^https?:\/\//i.test(relativePath)) return relativePath || "";
    try {
      return new URL(relativePath, window.location.href).href;
    } catch (_e) {
      return relativePath;
    }
  }

  function bookCoverSrc(book) {
    if (book.coverPreview) return book.coverPreview;
    if (book.id) {
      var url = (book.pdfUrl || "").trim();
      if (url && url !== "#") return "assets/covers/previews/" + book.id + ".png";
    }
    return lang === "ar"
      ? book.coverImageAr || book.coverImageFr || ""
      : book.coverImageFr || book.coverImageAr || "";
  }

  function openBook(book) {
    withBookAccess(book, function () {
      window.location.href = pdfHref(book);
    });
  }

  function renderBookCard(book) {
    var title = lang === "ar" ? book.titleAr || book.titleFr : book.titleFr;
    var desc = lang === "ar" ? book.descriptionAr || book.descriptionFr : book.descriptionFr;
    var locked = isBookLocked(book);
    var cover = bookCoverSrc(book);

    var card = document.createElement("article");
    card.className = "book-card" + (locked ? " book-card--locked" : "");

    var inner = document.createElement("div");
    inner.className = "book-card-inner";
    card.appendChild(inner);

    var coverDiv = document.createElement("div");
    coverDiv.className = "book-cover book-cover--preview";
    coverDiv.style.cursor = "pointer";
    coverDiv.setAttribute("role", "button");
    coverDiv.setAttribute("tabindex", "0");
    coverDiv.setAttribute("aria-label", t("Lire le PDF", "قراءة PDF") + " — " + title);

    if (cover) {
      var img = document.createElement("img");
      img.className = "book-cover-img";
      img.src = resolveAssetUrl(cover);
      img.alt = title;
      img.loading = "lazy";
      img.decoding = "async";
      coverDiv.appendChild(img);
    } else {
      var icon = document.createElement("span");
      icon.className = "book-cover-icon";
      icon.textContent = "🎓";
      coverDiv.appendChild(icon);
    }

    function onOpen(e) {
      if (e) e.preventDefault();
      openBook(book);
    }
    coverDiv.addEventListener("click", onOpen);
    coverDiv.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    });
    inner.appendChild(coverDiv);

    var body = document.createElement("div");
    body.className = "book-body";

    var catSpan = document.createElement("span");
    catSpan.className = "book-category";
    catSpan.textContent = t("Formation PDF", "تكوين PDF");
    body.appendChild(catSpan);

    if (locked) {
      var lockBadge = document.createElement("span");
      lockBadge.className = "book-lock-badge";
      lockBadge.textContent = t("🔒 Accès protégé", "🔒 وصول محمي");
      body.appendChild(lockBadge);
    }

    var h3 = document.createElement("h3");
    h3.className = "book-title";
    h3.textContent = title || "";
    body.appendChild(h3);

    if (desc) {
      var pDesc = document.createElement("p");
      pDesc.className = "book-desc";
      pDesc.textContent = desc;
      body.appendChild(pDesc);
    }

    var actions = document.createElement("div");
    actions.className = "book-actions";

    var read = document.createElement("button");
    read.type = "button";
    read.className = "btn btn-primary btn-sm";
    read.textContent = locked
      ? t("Mot de passe", "كلمة المرور")
      : t("Lire le PDF", "قراءة PDF");
    read.addEventListener("click", onOpen);
    actions.appendChild(read);

    body.appendChild(actions);
    inner.appendChild(body);

    return card;
  }

  function renderBooks(books) {
    lastBooks = books;
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

  function load() {
    fetch("data/livres.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("livres");
        return r.json();
      })
      .then(function (catalog) {
        var books = (catalog.books || []).filter(function (b) {
          return b.category === "formation" && b.pdfUrl && b.pdfUrl !== "#";
        });
        books.sort(function (a, b) {
          return (b.year || 0) - (a.year || 0);
        });
        renderBooks(books);
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
      if (lastBooks.length) renderBooks(lastBooks);
      else load();
    }
  });

  load();
})();
