/**
 * Bibliothèque PDF — catalogue dynamique (data/livres.json)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";
  const STORAGE_SORT = "electrodz-library-sort";

  const SORT_OPTIONS = [
    { value: "default", labelFr: "Ordre du catalogue", labelAr: "الترتيب الافتراضي", labelEn: "Catalogue order" },
    { value: "date-desc", labelFr: "Plus récent d'abord", labelAr: "الأحدث أولاً", labelEn: "Newest first" },
    { value: "date-asc", labelFr: "Plus ancien d'abord", labelAr: "الأقدم أولاً", labelEn: "Oldest first" },
    { value: "title-asc", labelFr: "A → Z", labelAr: "أ → ي", labelEn: "A → Z" },
    { value: "title-desc", labelFr: "Z → A", labelAr: "ي → أ", labelEn: "Z → A" },
  ];

  const els = {
    grid: document.querySelector("[data-books-grid]"),
    search: document.querySelector("[data-books-search]"),
    sort: document.querySelector("[data-books-sort]"),
    collections: document.querySelector("[data-books-collections]"),
    filters: document.querySelector("[data-books-filters]"),
    count: document.querySelector("[data-books-count]"),
    empty: document.querySelector("[data-books-empty]"),
    featured: document.querySelector("[data-books-featured]"),
    featuredGrid: document.querySelector("[data-featured-grid]"),
    knxGift: document.querySelector("[data-knx-gift]"),
    langFr: document.querySelector("[data-lang-fr]"),
    langAr: document.querySelector("[data-lang-ar]"),
    langEn: document.querySelector("[data-lang-en]"),
    updated: document.querySelector("[data-catalog-updated]"),
  };

  if (!els.grid) return;

  let catalog = null;
  let lang = localStorage.getItem(STORAGE_LANG) || "ar";
  if (lang !== "fr" && lang !== "ar" && lang !== "en") lang = "ar";
  let collection = "all";
  let category = "all";
  const COLLECTIONS_ENABLED = false;
  /** Sur « Toutes », n'afficher que les mises en avant (+ message pour choisir un thème). */
  const ALL_VIEW_FEATURED_ONLY = true;
  let query = "";
  let sortBy = localStorage.getItem(STORAGE_SORT) || "default";
  let favoritesOnly = new URLSearchParams(location.search).get("favorites") === "1";
  let favoriteIds = new Set();
  let pdfStatsMap = {};
  let sessionLoggedIn = false;
  let arabeArchiveLoaded = false;
  let arabeArchiveLoading = null;

  const COVER_COLORS = {
    normes: "#1e40af",
    installation: "#0d9488",
    electro_calc: "#7c3aed",
    moteurs: "#dc2626",
    mesures: "#ca8a04",
    commande: "#059669",
    domotique: "#4f46e5",
    securite: "#b45309",
    bac: "#c2410c",
    arabe: "#0369a1",
    autres: "#334155",
  };

  function t(fr, ar, en) {
    if (lang === "ar") return ar;
    if (lang === "en") return en != null && en !== "" ? en : fr;
    return fr;
  }

  function normalizeLang(next) {
    return next === "fr" || next === "ar" || next === "en" ? next : "ar";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function pdfViewerHref(book, opts) {
    opts = opts || {};
    const src = (opts.src || book.pdfUrl || "").trim();
    const q = new URLSearchParams();
    q.set("src", src);
    q.set("id", (opts.idSuffix ? (book.id || "") + opts.idSuffix : book.id) || "");
    q.set("titleFr", opts.titleFr || book.titleFr || "");
    q.set("titleAr", opts.titleAr || book.titleAr || book.titleFr || "");
    return "lecteur-pdf.html?" + q.toString();
  }

  function bookCorrectionUrl(book) {
    return (book.correctionPdfUrl || "").trim();
  }

  function hasCorrection(book) {
    const u = bookCorrectionUrl(book);
    return Boolean(u && u !== "#");
  }

  function bookFileUrl(book) {
    return (book.pdfUrl || book.fileUrl || "").trim();
  }

  function bookFileFormat(book) {
    if (book.fileFormat) return String(book.fileFormat).toLowerCase();
    const u = bookFileUrl(book);
    if (/\.zip$/i.test(u)) return "zip";
    if (/\.docx$/i.test(u)) return "docx";
    if (/\.doc$/i.test(u)) return "doc";
    if (/\.pptx$/i.test(u)) return "pptx";
    return "pdf";
  }

  function downloadLabel(format) {
    if (format === "pdf") return t("Télécharger PDF", "تنزيل PDF", "Download PDF");
    if (format === "docx") return t("Télécharger Word", "تنزيل Word", "Download Word");
    if (format === "doc") return t("Télécharger DOC", "تنزيل DOC", "Download DOC");
    if (format === "zip") return t("Télécharger ZIP", "تنزيل ZIP", "Download ZIP");
    if (format === "pptx") return t("Télécharger PowerPoint", "تنزيل PowerPoint", "Download PowerPoint");
    return t("Télécharger", "تنزيل", "Download");
  }

  function hasBookFile(book) {
    const u = bookFileUrl(book);
    return Boolean(u && u !== "#");
  }

  function isPdfBook(book) {
    return hasBookFile(book) && bookFileFormat(book) === "pdf";
  }

  function triggerFileDownload(book) {
    withBookAccess(book, function () {
      const a = document.createElement("a");
      a.href = resolveAssetUrl(bookFileUrl(book));
      a.setAttribute("download", "");
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (book.id && window.ElectroDzPdfStats) {
        window.ElectroDzPdfStats.trackDownload(book.id);
      }
    });
  }

  function isBookLocked(book) {
    const lock = window.ElectroDzLibraryLock;
    return !!(lock && book.id && lock.isProtected(book.id) && !lock.isUnlocked(book.id));
  }

  /** Livres protégés : jamais affichés dans le catalogue public. */
  function isBookHiddenFromCatalog(book) {
    const lock = window.ElectroDzLibraryLock;
    return !!(lock && book.id && lock.isProtected(book.id));
  }

  function withBookAccess(book, fn) {
    const lock = window.ElectroDzLibraryLock;
    if (!lock || !book.id || !lock.isProtected(book.id) || lock.isUnlocked(book.id)) {
      fn();
      return;
    }
    lock.guardAccess(book.id, fn);
  }

  function resolveAssetUrl(relativePath) {
    if (!relativePath || /^https?:\/\//i.test(relativePath)) return relativePath || "";
    try {
      return new URL(relativePath, window.location.href).href;
    } catch (_e) {
      return relativePath;
    }
  }

  function svgCoverSrc(book) {
    if (lang === "ar" && book.coverImageAr) return book.coverImageAr;
    if (book.coverImageFr) return book.coverImageFr;
    if (book.coverImageAr) return book.coverImageAr;
    return book.coverImage || "";
  }

  /** Vignette uniquement si coverPreview est déclaré dans le JSON (pas de guess → pas de 404). */
  function bookCoverSrc(book) {
    if (book.coverPreview) return book.coverPreview;
    return svgCoverSrc(book);
  }

  function usesPdfPreview(book) {
    return !!book.coverPreview;
  }

  function isArabeBook(book) {
    return book.collection === "arabe" || book.category === "arabe";
  }

  function matchesCategory(book, catKey) {
    if (catKey === "all") return true;
    if (catKey === "arabe") return isArabeBook(book);
    return book.category === catKey;
  }

  function needsArabeArchive() {
    if (category === "arabe") return true;
    if (collection === "arabe") return true;
    if (favoritesOnly) return true;
    if (query && query.trim().length >= 2) return true;
    return false;
  }

  function mergeArchiveBooks(books) {
    if (!catalog || !Array.isArray(catalog.books) || !Array.isArray(books) || !books.length) return;
    const seen = new Set(catalog.books.map(function (b) { return b.id; }));
    const baseIndex = catalog.books.length;
    books.forEach(function (book, i) {
      if (!book || !book.id || seen.has(book.id)) return;
      book.collection = book.collection || "arabe";
      book.category = book.category || "arabe";
      book._catalogIndex = baseIndex + i;
      catalog.books.push(book);
      seen.add(book.id);
    });
  }

  function ensureArabeArchiveLoaded() {
    if (arabeArchiveLoaded) return Promise.resolve();
    if (arabeArchiveLoading) return arabeArchiveLoading;
    const meta = catalog && catalog.lazyArchives && catalog.lazyArchives.arabe;
    const url = (meta && meta.url) || "data/livres-arabe-archive.json";
    arabeArchiveLoading = fetch(url, { cache: "default" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        mergeArchiveBooks((data && data.books) || []);
        arabeArchiveLoaded = true;
        arabeArchiveLoading = null;
      })
      .catch(function (err) {
        arabeArchiveLoading = null;
        console.warn("[bibliotheque] archive arabe:", err);
        // Ne pas bloquer l'UI : curated arabe reste visible.
        arabeArchiveLoaded = true;
      });
    return arabeArchiveLoading;
  }

  function setLang(next) {
    lang = normalizeLang(next);
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (els.langFr) {
      els.langFr.classList.toggle("active", lang === "fr");
      els.langFr.setAttribute("aria-pressed", lang === "fr" ? "true" : "false");
    }
    if (els.langAr) {
      els.langAr.classList.toggle("active", lang === "ar");
      els.langAr.setAttribute("aria-pressed", lang === "ar" ? "true" : "false");
    }
    if (els.langEn) {
      els.langEn.classList.toggle("active", lang === "en");
      els.langEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
    }
    document.querySelectorAll("[data-i18n-fr]").forEach(function (node) {
      const fr = node.getAttribute("data-i18n-fr");
      const ar = node.getAttribute("data-i18n-ar");
      const en = node.getAttribute("data-i18n-en") || fr;
      if (fr && ar) node.textContent = t(fr, ar, en);
    });
    if (els.search) {
      els.search.placeholder = t(
        els.search.getAttribute("data-placeholder-fr") || "",
        els.search.getAttribute("data-placeholder-ar") || "",
        els.search.getAttribute("data-placeholder-en") || els.search.getAttribute("data-placeholder-fr") || ""
      );
    }
    if (els.empty) {
      els.empty.textContent = t("Aucun ouvrage trouvé.", "لا يوجد كتاب.", "No titles found.");
    }
    render();
  }

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function matchesSearch(book) {
    if (!query.trim()) return true;
    const q = normalize(query);
    const hay = normalize(
      [book.titleFr, book.titleAr, book.descriptionFr, book.descriptionAr, book.id].join(" ")
    );
    return hay.indexOf(q) !== -1;
  }

  function bookTitleKey(book) {
    const title =
      lang === "ar"
        ? book.titleAr || book.titleFr || book.id || ""
        : book.titleFr || book.titleAr || book.id || "";
    return normalize(title);
  }

  function bookSortTimestamp(book) {
    if (book.addedDate) {
      const d = Date.parse(String(book.addedDate));
      if (Number.isFinite(d)) return d;
    }
    if (Number.isFinite(book._catalogIndex) && book._catalogIndex >= 0) {
      const base = catalog && catalog.updated ? Date.parse(catalog.updated + "T12:00:00Z") : Date.parse("2024-01-01T12:00:00Z");
      if (Number.isFinite(base)) {
        return base + book._catalogIndex * 60000;
      }
      return book._catalogIndex;
    }
    const y = Number(book.year);
    if (Number.isFinite(y) && y > 0) {
      const d = Date.parse(y + "-07-01T12:00:00Z");
      if (Number.isFinite(d)) return d;
    }
    return 0;
  }

  function compareTitles(a, b) {
    const ta = bookTitleKey(a);
    const tb = bookTitleKey(b);
    const cmp = ta.localeCompare(tb, lang === "ar" ? "ar" : lang === "en" ? "en" : "fr", { sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return String(a.id || "").localeCompare(String(b.id || ""));
  }

  function sortBooks(books) {
    if (sortBy === "default") return books.slice();
    const list = books.slice();
    list.sort(function (a, b) {
      if (sortBy === "title-asc") return compareTitles(a, b);
      if (sortBy === "title-desc") return compareTitles(b, a);

      const ta = bookSortTimestamp(a);
      const tb = bookSortTimestamp(b);
      if (sortBy === "date-desc") {
        if (tb !== ta) return tb - ta;
      } else if (sortBy === "date-asc") {
        if (ta !== tb) return ta - tb;
      }
      return compareTitles(a, b);
    });
    return list;
  }

  function getBooks(filterFeatured) {
    if (!catalog) return [];
    return catalog.books.filter(function (book) {
      if (isBookHiddenFromCatalog(book)) return false;
      if (filterFeatured && !book.featured) return false;
      if (favoritesOnly && !favoriteIds.has(book.id)) return false;
      if (collection !== "all" && book.collection !== collection) return false;
      if (!matchesCategory(book, category)) return false;
      return matchesSearch(book);
    });
  }

  function countBooksForCollection(colKey) {
    if (!catalog) return 0;
    return catalog.books.filter(function (book) {
      if (isBookHiddenFromCatalog(book)) return false;
      if (colKey !== "all" && book.collection !== colKey) return false;
      if (!matchesCategory(book, category)) return false;
      if (favoritesOnly && !favoriteIds.has(book.id)) return false;
      return matchesSearch(book);
    }).length;
  }

  function shouldGroupByCollection(books) {
    if (!COLLECTIONS_ENABLED) return false;
    return (
      collection === "all" &&
      category === "all" &&
      !favoritesOnly &&
      !query.trim() &&
      sortBy === "default" &&
      books.length > 0
    );
  }

  function sortedCollectionKeys() {
    if (!catalog || !catalog.collections) return [];
    return Object.keys(catalog.collections).sort(function (a, b) {
      return (catalog.collections[a].order || 0) - (catalog.collections[b].order || 0);
    });
  }

  function formatStat(n) {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return "0";
    try {
      return new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : lang === "en" ? "en-GB" : "fr-CH").format(v);
    } catch (_e) {
      return String(v);
    }
  }

  function categoryLabel(key) {
    const cat = catalog.categories[key];
    if (!cat) return key;
    return t(cat.labelFr, cat.labelAr);
  }

  function categoryIcon(key) {
    const cat = catalog.categories[key];
    return (cat && cat.icon) || "";
  }

  function makeThemeIcon(iconSrc) {
    const wrap = document.createElement("span");
    wrap.className = "theme-ico-wrap";
    wrap.setAttribute("aria-hidden", "true");
    if (iconSrc && /\.(png|webp|jpe?g|svg)(\?|$)/i.test(iconSrc)) {
      const img = document.createElement("img");
      img.className = "theme-ico-img";
      img.src = resolveAssetUrl(iconSrc);
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      wrap.appendChild(img);
      return wrap;
    }
    // fallback SVG symbol id
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "theme-ico");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + (iconSrc || "ico-pdf"));
    svg.appendChild(use);
    wrap.appendChild(svg);
    return wrap;
  }

  function renderBookCard(book) {
    const title = t(book.titleFr, book.titleAr);
    const desc = t(book.descriptionFr, book.descriptionAr);
    const hasFile = hasBookFile(book);
    const isPdf = isPdfBook(book);
    const locked = isPdf && isBookLocked(book);
    const catKey = book.category || "autres";
    const coverBg = COVER_COLORS[catKey] || COVER_COLORS.autres;

    const card = document.createElement("article");
    card.className = "book-card" + (locked ? " book-card--locked" : "");

    const inner = document.createElement("div");
    inner.className = "book-card-inner";

    const coverDiv = document.createElement("div");
    const wantsPreview = usesPdfPreview(book);
    coverDiv.className = "book-cover" + (wantsPreview ? " book-cover--preview" : "");
    const coverSrc = bookCoverSrc(book).trim();
    const svgFallback =
      (lang === "ar" && book.coverImageAr) ||
      book.coverImageFr ||
      book.coverImageAr ||
      book.coverImage ||
      "";
    if (coverSrc) {
      coverDiv.style.background = "#0f172a";
      const img = document.createElement("img");
      img.className = "book-cover-img";
      img.src = resolveAssetUrl(coverSrc);
      img.alt = title;
      img.loading = "lazy";
      img.decoding = "async";
      let triedSvg = false;
      img.onerror = function () {
        if (!triedSvg && svgFallback && img.src.indexOf(".svg") === -1) {
          triedSvg = true;
          img.src = resolveAssetUrl(svgFallback);
          coverDiv.classList.remove("book-cover--preview");
          return;
        }
        img.remove();
        coverDiv.classList.remove("book-cover--preview");
        coverDiv.style.background = "linear-gradient(135deg," + coverBg + ",#0f172a)";
        coverDiv.appendChild(makeThemeIcon(categoryIcon(catKey)));
      };
      coverDiv.appendChild(img);
      if (hasFile) {
        coverDiv.style.cursor = "pointer";
        coverDiv.setAttribute("role", "button");
        coverDiv.setAttribute("tabindex", "0");
        coverDiv.setAttribute(
          "aria-label",
          (isPdf ? t("Lire le PDF", "قراءة PDF", "Read PDF") : t("Télécharger", "تنزيل", "Download")) +
            " — " +
            title
        );
        function openBook() {
          if (isPdf) {
            withBookAccess(book, function () {
              window.location.href = pdfViewerHref(book);
            });
          } else {
            triggerFileDownload(book);
          }
        }
        coverDiv.addEventListener("click", openBook);
        coverDiv.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBook();
          }
        });
      }
    } else {
      coverDiv.style.background = "linear-gradient(135deg," + coverBg + ",#0f172a)";
      coverDiv.appendChild(makeThemeIcon(categoryIcon(catKey)));
    }
    inner.appendChild(coverDiv);

    const body = document.createElement("div");
    body.className = "book-body";

    if (COLLECTIONS_ENABLED && book.collection && catalog.collections && catalog.collections[book.collection]) {
      const colSpan = document.createElement("span");
      colSpan.className = "book-collection-tag";
      colSpan.textContent = collectionLabel(book.collection);
      body.appendChild(colSpan);
    }

    const catSpan = document.createElement("span");
    catSpan.className = "book-category";
    catSpan.textContent = categoryLabel(catKey);
    body.appendChild(catSpan);

    if (locked) {
      const lockBadge = document.createElement("span");
      lockBadge.className = "book-lock-badge";
      lockBadge.textContent = t("🔒 Accès protégé", "🔒 وصول محمي", "🔒 Protected access");
      body.appendChild(lockBadge);
    }

    const h3 = document.createElement("h3");
    h3.className = "book-title";
    h3.textContent = title;
    body.appendChild(h3);

    const pDesc = document.createElement("p");
    pDesc.className = "book-desc";
    pDesc.textContent = desc;
    body.appendChild(pDesc);

    const meta = [];
    if (book.pages) meta.push(t(book.pages + " p.", book.pages + " ص."));
    if (book.year) meta.push(String(book.year));
    if (book.addedDate && (sortBy === "date-desc" || sortBy === "date-asc")) {
      try {
        const d = new Date(book.addedDate + "T12:00:00");
        meta.push(
          t(
            "Ajouté le " + d.toLocaleDateString("fr-CH"),
            "أُضيف في " + d.toLocaleDateString("ar-DZ")
          )
        );
      } catch (_e) {
        meta.push(book.addedDate);
      }
    }
    if (meta.length) {
      const pMeta = document.createElement("p");
      pMeta.className = "book-extra";
      pMeta.textContent = meta.join(" · ");
      body.appendChild(pMeta);
    }

    const stats = pdfStatsMap[book.id] || { views: 0, downloads: 0 };
    const pStats = document.createElement("p");
    pStats.className = "book-stats";
    pStats.textContent =
      "👁 " + formatStat(stats.views) + " · ↓ " + formatStat(stats.downloads);
    body.appendChild(pStats);

    const actions = document.createElement("div");
    actions.className = "book-actions";

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className =
      "btn-fav" + (favoriteIds.has(book.id) ? " btn-fav--on" : "");
    favBtn.setAttribute(
      "aria-label",
      t("Ajouter aux favoris", "إضافة إلى المفضلة", "Add to favourites")
    );
    favBtn.textContent = favoriteIds.has(book.id) ? "★" : "☆";
    favBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleFavoriteUi(book, favBtn);
    });
    actions.appendChild(favBtn);

    if (isPdf) {
      const read = document.createElement("a");
      read.className = "btn btn-primary btn-sm";
      read.href = pdfViewerHref(book);
      read.textContent = locked
        ? t("Mot de passe", "كلمة المرور", "Password")
        : hasCorrection(book)
          ? t("Sujet", "الموضوع", "Exam")
          : t("Lire le PDF", "قراءة PDF", "Read PDF");
      read.addEventListener("click", function (e) {
        if (!isBookLocked(book)) return;
        e.preventDefault();
        withBookAccess(book, function () {
          window.location.href = pdfViewerHref(book);
        });
      });
      actions.appendChild(read);

      if (hasCorrection(book) && !locked) {
        const corr = document.createElement("a");
        corr.className = "btn btn-correction btn-sm";
        corr.href = pdfViewerHref(book, {
          src: bookCorrectionUrl(book),
          idSuffix: "-correction",
          titleFr: (book.titleFr || "") + " — Corrigé",
          titleAr: (book.titleAr || book.titleFr || "") + " — التصحيح",
        });
        corr.textContent = t("Corrigé", "التصحيح", "Answer key");
        actions.appendChild(corr);
      }

      const dl = document.createElement("a");
      dl.className = "btn btn-download btn-sm";
      dl.href = locked ? "#" : resolveAssetUrl(bookFileUrl(book));
      if (!locked) dl.setAttribute("download", "");
      dl.textContent = hasCorrection(book)
        ? t("DL sujet", "تنزيل الموضوع", "DL exam")
        : t("Télécharger PDF", "تنزيل PDF", "Download PDF");
      dl.addEventListener("click", function (e) {
        if (isBookLocked(book)) {
          e.preventDefault();
          triggerFileDownload(book);
          return;
        }
        if (book.id && window.ElectroDzPdfStats) {
          window.ElectroDzPdfStats.trackDownload(book.id);
        }
      });
      actions.appendChild(dl);

      if (hasCorrection(book) && !locked) {
        const dlCorr = document.createElement("a");
        dlCorr.className = "btn btn-download btn-sm";
        dlCorr.href = resolveAssetUrl(bookCorrectionUrl(book));
        dlCorr.setAttribute("download", "");
        dlCorr.textContent = t("DL corrigé", "تنزيل التصحيح", "DL key");
        dlCorr.addEventListener("click", function () {
          if (book.id && window.ElectroDzPdfStats) {
            window.ElectroDzPdfStats.trackDownload(book.id + "-correction");
          }
        });
        actions.appendChild(dlCorr);
      }

      if (book.quizUrl) {
        const quiz = document.createElement("a");
        quiz.className = "btn btn-sm";
        quiz.style.borderColor = "rgba(56,189,248,0.5)";
        quiz.style.color = "#7dd3fc";
        quiz.href = book.quizUrl;
        quiz.textContent = t("Quiz", "اختبار", "Quiz");
        actions.appendChild(quiz);
      }
    } else if (hasFile) {
      const dl = document.createElement("a");
      dl.className = "btn btn-primary btn-sm";
      dl.href = resolveAssetUrl(bookFileUrl(book));
      dl.setAttribute("download", "");
      dl.textContent = downloadLabel(bookFileFormat(book));
      dl.addEventListener("click", function (e) {
        e.preventDefault();
        triggerFileDownload(book);
      });
      actions.appendChild(dl);
    } else {
      const soon = document.createElement("span");
      soon.className = "book-soon";
      soon.textContent = t("PDF bientôt disponible", "PDF قريبًا", "PDF coming soon");
      actions.appendChild(soon);
    }
    body.appendChild(actions);
    inner.appendChild(body);
    card.appendChild(inner);

    return card;
  }

  function renderGrid(targetEl, books) {
    if (!targetEl) return;
    targetEl.innerHTML = "";
    targetEl.className = "book-grid";
    books.forEach(function (book) {
      targetEl.appendChild(renderBookCard(book));
    });
  }

  function knxCollectionMeta() {
    return (catalog.collections && catalog.collections.knx) || null;
  }

  function knxGiftFromText() {
    const col = knxCollectionMeta();
    if (!col) return "";
    return t(col.giftFromFr, col.giftFromAr || col.giftFromFr);
  }

  function createKnxSignEl() {
    const from = knxGiftFromText();
    if (!from) return null;
    const sign = document.createElement("p");
    sign.className = "library-knx-sign";
    sign.textContent = from;
    return sign;
  }

  function createKnxTitleBlock(mainText, variant) {
    const wrap = document.createElement("span");
    wrap.className = "library-knx-title-block library-knx-title-block--" + variant;
    const main = document.createElement("span");
    main.className = "library-knx-title-block__main";
    main.textContent = mainText;
    wrap.appendChild(main);
    const sign = createKnxSignEl();
    if (sign) wrap.appendChild(sign);
    return wrap;
  }

  function knxMainLabelText() {
    return collectionLabel("knx");
  }

  function renderKnxGift() {
    if (!els.knxGift || !catalog) return;
    const showCategoryOnly =
      category === "domotique" && collection !== "knx" && knxGiftFromText();
    if (!showCategoryOnly) {
      els.knxGift.hidden = true;
      els.knxGift.innerHTML = "";
      return;
    }
    els.knxGift.hidden = false;
    els.knxGift.innerHTML = "";
    els.knxGift.appendChild(createKnxTitleBlock(knxMainLabelText(), "banner"));
  }

  function renderGroupedByCollection(targetEl, books) {
    if (!targetEl) return;
    targetEl.innerHTML = "";
    targetEl.className = "library-books-root";

    const byCol = {};
    books.forEach(function (book) {
      const key = book.collection || "autres";
      if (!byCol[key]) byCol[key] = [];
      byCol[key].push(book);
    });

    sortedCollectionKeys().forEach(function (key) {
      const list = byCol[key];
      if (!list || !list.length) return;

      const section = document.createElement("section");
      section.className = "library-group";
      section.id = "collection-" + key;

      const heading = document.createElement("h2");
      heading.className = "library-collection-heading";
      const labelWrap = document.createElement("div");
      labelWrap.className = "library-collection-heading__label-wrap";
      if (key === "knx" && knxGiftFromText()) {
        labelWrap.appendChild(
          createKnxTitleBlock(collectionLabel(key), "heading")
        );
      } else {
        const label = document.createElement("span");
        label.className = "library-collection-heading__label";
        label.textContent = collectionLabel(key);
        labelWrap.appendChild(label);
      }
      const count = document.createElement("span");
      count.className = "library-collection-heading__count";
      count.textContent = list.length + " " + t("ouvrage(s)", "كتاب", "title(s)");
      heading.appendChild(labelWrap);
      heading.appendChild(count);

      const grid = document.createElement("div");
      grid.className = "book-grid book-grid--section";
      list.forEach(function (book) {
        grid.appendChild(renderBookCard(book));
      });

      section.appendChild(heading);
      section.appendChild(grid);
      targetEl.appendChild(section);
    });

    const orphan = byCol.autres;
    if (orphan && orphan.length && !catalog.collections.autres) {
      const section = document.createElement("section");
      section.className = "library-group";
      const heading = document.createElement("h2");
      heading.className = "library-collection-heading";
      heading.textContent = t("Autres", "أخرى", "Other") + " · " + orphan.length;
      const grid = document.createElement("div");
      grid.className = "book-grid book-grid--section";
      orphan.forEach(function (book) {
        grid.appendChild(renderBookCard(book));
      });
      section.appendChild(heading);
      section.appendChild(grid);
      targetEl.appendChild(section);
    }
  }

  function collectionLabel(key) {
    const col = catalog.collections && catalog.collections[key];
    if (!col) return key;
    return t(col.labelFr, col.labelAr);
  }

  function renderSortControl() {
    if (!els.sort) return;
    const prev = els.sort.value || sortBy;
    els.sort.innerHTML = "";
    SORT_OPTIONS.forEach(function (opt) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = t(opt.labelFr, opt.labelAr, opt.labelEn);
      els.sort.appendChild(o);
    });
    els.sort.value = SORT_OPTIONS.some(function (o) {
      return o.value === prev;
    })
      ? prev
      : sortBy;
  }

  function renderCollections() {
    if (!COLLECTIONS_ENABLED) {
      collection = "all";
      if (els.collections) els.collections.innerHTML = "";
      return;
    }
    if (!els.collections || !catalog || !catalog.collections) return;
    els.collections.innerHTML = "";
    function makeCol(key, labelText) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "book-collection" + (collection === key ? " book-collection--active" : "");
      const label = document.createElement("span");
      label.className = "book-collection__label";
      if (key === "knx" && knxGiftFromText()) {
        label.appendChild(createKnxTitleBlock(labelText, "chip"));
      } else {
        label.textContent = labelText;
      }
      const count = document.createElement("span");
      count.className = "book-collection__count";
      const n = countBooksForCollection(key);
      count.textContent = n + " " + t("PDF", "PDF", "PDF");
      btn.appendChild(label);
      btn.appendChild(count);
      btn.addEventListener("click", function () {
        collection = key;
        category = "all";
        maybeLoadArchiveThenRender();
        if (key !== "all") {
          const anchor = document.getElementById("collection-" + key);
          if (anchor) {
            anchor.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
      els.collections.appendChild(btn);
    }
    makeCol("all", t("Toutes", "الكل", "All"));
    sortedCollectionKeys().forEach(function (key) {
      makeCol(key, collectionLabel(key));
    });
  }

  function renderFilters() {
    if (!els.filters || !catalog) return;
    els.filters.innerHTML = "";

    function makeFilter(key, label, iconId) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-filter" + (category === key ? " book-filter--active" : "");
      const text = document.createElement("span");
      text.className = "book-filter__label";
      text.textContent = label;
      btn.appendChild(text);
      if (iconId) btn.appendChild(makeThemeIcon(iconId));
      btn.addEventListener("click", function () {
        category = key;
        maybeLoadArchiveThenRender();
      });
      els.filters.appendChild(btn);
    }

    makeFilter("all", t("Toutes", "الكل", "All"), "assets/library-themes/all.png");
    if (sessionLoggedIn) {
      const favLabel = t("Mes favoris", "مفضلتي", "My favourites");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "book-filter" + (favoritesOnly ? " book-filter--active" : "");
      btn.appendChild(makeThemeIcon("assets/section-previews/training-neon.png"));
      const text = document.createElement("span");
      text.className = "book-filter__label";
      text.textContent = favLabel;
      btn.appendChild(text);
      btn.addEventListener("click", function () {
        favoritesOnly = !favoritesOnly;
        const u = new URL(location.href);
        if (favoritesOnly) u.searchParams.set("favorites", "1");
        else u.searchParams.delete("favorites");
        history.replaceState({}, "", u.pathname + u.search);
        maybeLoadArchiveThenRender();
      });
      els.filters.appendChild(btn);
    }
    Object.keys(catalog.categories)
      .sort(function (a, b) {
        return (catalog.categories[a].order || 99) - (catalog.categories[b].order || 99);
      })
      .forEach(function (key) {
        makeFilter(key, categoryLabel(key), categoryIcon(key));
      });
  }

  function toggleFavoriteUi(book, btn) {
    if (!window.ElectroDzFavorites) return;
    window.ElectroDzFavorites.toggleFavorite(book)
      .then(function (res) {
        if (res.needLogin) {
          if (
            confirm(
              t(
                "Connectez-vous (e-mail ou Google) pour enregistrer vos favoris.",
                "سجّل الدخول (بريد أو Google) لحفظ المفضلة.",
                "Sign in (e-mail or Google) to save your favourites."
              )
            )
          ) {
            location.href = window.ElectroDzFavorites.loginUrl();
          }
          return;
        }
        if (!res.ok) return;
        if (res.favorited) favoriteIds.add(book.id);
        else favoriteIds.delete(book.id);
        btn.textContent = res.favorited ? "★" : "☆";
        btn.classList.toggle("btn-fav--on", res.favorited);
        if (favoritesOnly) maybeLoadArchiveThenRender();
      })
      .catch(function () {
        alert(t("Impossible d'enregistrer le favori.", "تعذر حفظ المفضلة.", "Could not save favourite."));
      });
  }

  async function refreshPdfStats() {
    if (window.ElectroDzPdfStats?.invalidateAll) {
      window.ElectroDzPdfStats.invalidateAll();
    }
    if (window.ElectroDzPdfStats?.fetchAllBookStats) {
      try {
        pdfStatsMap = await window.ElectroDzPdfStats.fetchAllBookStats();
      } catch (_) {
        pdfStatsMap = {};
      }
    }
  }

  async function loadSideData() {
    await refreshPdfStats();
    if (window.ElectroDzFavorites?.listFavorites) {
      try {
        const fav = await window.ElectroDzFavorites.listFavorites();
        sessionLoggedIn = fav.loggedIn;
        favoriteIds = fav.ids;
        if (window.ElectroDzAuthUi?.refresh) {
          await window.ElectroDzAuthUi.refresh();
        } else {
          const navFav = document.querySelector("[data-nav-favorites]");
          const navDash = document.querySelector("[data-nav-dashboard]");
          const navLogin = document.querySelector("[data-nav-login]");
          if (fav.loggedIn) {
            if (navLogin) navLogin.hidden = true;
            if (navDash) navDash.hidden = false;
            if (navFav) navFav.hidden = false;
          }
        }
      } catch (_) {
        sessionLoggedIn = false;
      }
    }
  }

  function render() {
    if (!catalog) return;
    renderSortControl();
    renderCollections();
    renderFilters();
    renderKnxGift();

    const filtered = getBooks(false);
    const featured = sortBooks(getBooks(true));
    const showFeatured =
      featured.length > 0 &&
      collection === "all" &&
      category === "all" &&
      !query.trim() &&
      !favoritesOnly &&
      sortBy === "default";

    const limitAllToFeatured =
      ALL_VIEW_FEATURED_ONLY &&
      category === "all" &&
      collection === "all" &&
      !query.trim() &&
      !favoritesOnly;

    const all = sortBooks(limitAllToFeatured ? featured : filtered);

    if (els.featured) els.featured.hidden = !showFeatured || limitAllToFeatured;
    if (showFeatured && !limitAllToFeatured && els.featuredGrid) {
      renderGrid(els.featuredGrid, featured);
    }

    const sectionTitle = document.querySelector("[data-books-section-title]");
    if (shouldGroupByCollection(filtered) && !limitAllToFeatured) {
      if (sectionTitle) {
        sectionTitle.classList.remove("library-knx-section-head");
        sectionTitle.textContent = t("Par collection", "حسب المجموعة", "By collection");
      }
      renderGroupedByCollection(els.grid, filtered);
    } else {
      if (sectionTitle) {
        if (collection === "knx" && knxGiftFromText()) {
          sectionTitle.innerHTML = "";
          sectionTitle.classList.add("library-knx-section-head");
          sectionTitle.appendChild(createKnxTitleBlock(knxMainLabelText(), "section"));
        } else {
          sectionTitle.classList.remove("library-knx-section-head");
          if (limitAllToFeatured) {
            sectionTitle.textContent = t(
              "À la une — choisissez un thème pour voir tous les PDF",
              "المميزة — اختر موضوعًا لعرض كل ملفات PDF",
              "Featured — pick a theme to browse all PDFs"
            );
          } else if (category === "arabe") {
            sectionTitle.textContent = t(
              "PDF Arabe (sélection + archive)",
              "كتب عربية (مختارة + أرشيف)",
              "Arabic PDFs (curated + archive)"
            );
          } else if (category !== "all") {
            sectionTitle.textContent = categoryLabel(category);
          } else {
            sectionTitle.textContent =
              sortBy === "date-desc"
                ? t("Triés par date (récent)", "مرتبة حسب التاريخ (الأحدث)", "Sorted by date (newest)")
                : sortBy === "date-asc"
                  ? t("Triés par date (ancien)", "مرتبة حسب التاريخ (الأقدم)", "Sorted by date (oldest)")
                  : sortBy === "title-asc"
                    ? t("Triés A → Z", "مرتبة أ → ي", "Sorted A → Z")
                    : sortBy === "title-desc"
                      ? t("Triés Z → A", "مرتبة ي → أ", "Sorted Z → A")
                      : t("Tous les ouvrages", "كل الكتب", "All titles");
          }
        }
      }
      renderGrid(els.grid, all);
    }

    if (els.count) {
      const archiveMeta = catalog.lazyArchives && catalog.lazyArchives.arabe;
      const archiveHint =
        category === "arabe" && archiveMeta && !arabeArchiveLoaded
          ? "…"
          : "";
      els.count.textContent =
        t(all.length + " ouvrage(s)", all.length + " كتاب", all.length + " title(s)") +
        archiveHint;
    }
    if (els.empty) els.empty.hidden = all.length > 0;
    if (els.sort) els.sort.value = sortBy;
  }

  function maybeLoadArchiveThenRender() {
    if (!needsArabeArchive()) {
      render();
      return;
    }
    if (arabeArchiveLoaded) {
      render();
      return;
    }
    if (els.count) {
      els.count.textContent = t("Chargement…", "جاري التحميل…", "Loading…");
    }
    if (els.grid && category === "arabe") {
      els.grid.innerHTML =
        '<p class="book-loading">' +
        t(
          "Chargement de l’archive PDF Arabe…",
          "جاري تحميل أرشيف الكتب العربية…",
          "Loading Arabic PDF archive…"
        ) +
        "</p>";
    }
    ensureArabeArchiveLoaded().then(function () {
      render();
    });
  }

  function loadCatalog() {
    fetch("data/livres.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        catalog = data;
        arabeArchiveLoaded = false;
        arabeArchiveLoading = null;
        if (Array.isArray(catalog.books)) {
          catalog.books.forEach(function (book, index) {
            book._catalogIndex = index;
          });
        }
        if (els.updated && data.updated) {
          els.updated.textContent = t(
            "Catalogue mis à jour le " + data.updated,
            "آخر تحديث: " + data.updated,
            "Catalogue updated " + data.updated
          );
        }
        return loadSideData();
      })
      .then(function () {
        maybeLoadArchiveThenRender();
      })
      .catch(function () {
        els.grid.innerHTML =
          '<p class="book-error">' +
          t("Impossible de charger le catalogue.", "تعذر تحميل المكتبة.", "Could not load the catalogue.") +
          "</p>";
      });
  }

  if (els.search) {
    els.search.addEventListener("input", function (e) {
      query = e.target.value || "";
      maybeLoadArchiveThenRender();
    });
  }

  if (els.sort) {
    els.sort.addEventListener("change", function () {
      sortBy = els.sort.value || "default";
      if (!SORT_OPTIONS.some(function (o) {
        return o.value === sortBy;
      })) {
        sortBy = "default";
      }
      localStorage.setItem(STORAGE_SORT, sortBy);
      maybeLoadArchiveThenRender();
    });
  }

  if (els.langFr) els.langFr.addEventListener("click", function () { setLang("fr"); });
  if (els.langAr) els.langAr.addEventListener("click", function () { setLang("ar"); });
  if (els.langEn) els.langEn.addEventListener("click", function () { setLang("en"); });

  function maybeRefreshStatsFromSession() {
    if (!catalog) return;
    try {
      if (!sessionStorage.getItem("electrodz-stats-changed")) return;
      sessionStorage.removeItem("electrodz-stats-changed");
    } catch (_) {
      return;
    }
    refreshPdfStats().then(function () {
      render();
    });
  }

  window.addEventListener("pageshow", function (ev) {
    if (!catalog) return;
    if (ev.persisted || document.visibilityState === "visible") {
      refreshPdfStats().then(function () {
        render();
      });
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!catalog || document.visibilityState !== "visible") return;
    maybeRefreshStatsFromSession();
    refreshPdfStats().then(function () {
      render();
    });
  });

  window.addEventListener("storage", function (e) {
    if (e.key === "electrodz-pdf-stats-v1") {
      refreshPdfStats().then(function () {
        render();
      });
    }
  });

  setLang(lang);
  loadCatalog();
})();
