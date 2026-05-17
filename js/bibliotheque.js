/**
 * Bibliothèque PDF — catalogue dynamique (data/livres.json)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";

  const els = {
    grid: document.querySelector("[data-books-grid]"),
    search: document.querySelector("[data-books-search]"),
    collections: document.querySelector("[data-books-collections]"),
    filters: document.querySelector("[data-books-filters]"),
    count: document.querySelector("[data-books-count]"),
    empty: document.querySelector("[data-books-empty]"),
    featured: document.querySelector("[data-books-featured]"),
    featuredGrid: document.querySelector("[data-featured-grid]"),
    langFr: document.querySelector("[data-lang-fr]"),
    langAr: document.querySelector("[data-lang-ar]"),
    updated: document.querySelector("[data-catalog-updated]"),
  };

  if (!els.grid) return;

  let catalog = null;
  let lang = localStorage.getItem(STORAGE_LANG) || "ar";
  let collection = "all";
  let category = "all";
  let query = "";
  let favoritesOnly = new URLSearchParams(location.search).get("favorites") === "1";
  let favoriteIds = new Set();
  let pdfStatsMap = {};
  let sessionLoggedIn = false;

  const COVER_COLORS = {
    normes: "#1e40af",
    installation: "#0d9488",
    monophase: "#ca8a04",
    triphase: "#059669",
    magnetisme: "#7c3aed",
    energie: "#dc2626",
    securite: "#b45309",
    formation: "#7c3aed",
    knx: "#4f46e5",
    autres: "#475569",
  };

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

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function pdfViewerHref(book) {
    const q = new URLSearchParams();
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

  /** Aperçu réel (1re page PDF) en priorité, puis couverture SVG */
  function bookCoverSrc(book) {
    if (book.coverPreview) return book.coverPreview;
    if (lang === "ar" && book.coverImageAr) return book.coverImageAr;
    if (book.coverImageFr) return book.coverImageFr;
    if (book.coverImageAr) return book.coverImageAr;
    return book.coverImage || "";
  }

  function setLang(next) {
    lang = next === "ar" ? "ar" : "fr";
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
    document.querySelectorAll("[data-i18n-fr]").forEach(function (node) {
      const fr = node.getAttribute("data-i18n-fr");
      const ar = node.getAttribute("data-i18n-ar");
      if (fr && ar) node.textContent = t(fr, ar);
    });
    if (els.search) {
      els.search.placeholder = t(
        els.search.getAttribute("data-placeholder-fr") || "",
        els.search.getAttribute("data-placeholder-ar") || ""
      );
    }
    if (els.empty) {
      els.empty.textContent = t("Aucun ouvrage trouvé.", "لا يوجد كتاب.");
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

  function getBooks(filterFeatured) {
    if (!catalog) return [];
    return catalog.books.filter(function (book) {
      if (filterFeatured && !book.featured) return false;
      if (favoritesOnly && !favoriteIds.has(book.id)) return false;
      if (collection !== "all" && book.collection !== collection) return false;
      if (category !== "all" && book.category !== category) return false;
      return matchesSearch(book);
    });
  }

  function formatStat(n) {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return "0";
    try {
      return new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-CH").format(v);
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
    return (cat && cat.icon) || "📄";
  }

  function renderBookCard(book) {
    const title = t(book.titleFr, book.titleAr);
    const desc = t(book.descriptionFr, book.descriptionAr);
    const hasPdf = Boolean(book.pdfUrl && book.pdfUrl.trim() && book.pdfUrl !== "#");
    const catKey = book.category || "autres";
    const coverBg = COVER_COLORS[catKey] || COVER_COLORS.autres;

    const card = document.createElement("article");
    card.className = "book-card";

    const inner = document.createElement("div");
    inner.className = "book-card-inner";

    const coverDiv = document.createElement("div");
    coverDiv.className = "book-cover" + (book.coverPreview ? " book-cover--preview" : "");
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
      img.onerror = function () {
        if (book.coverPreview && svgFallback && img.src.indexOf(".svg") === -1) {
          img.src = resolveAssetUrl(svgFallback);
          return;
        }
        img.remove();
        coverDiv.classList.remove("book-cover--preview");
        coverDiv.style.background = "linear-gradient(135deg," + coverBg + ",#0f172a)";
        const coverIcon = document.createElement("span");
        coverIcon.className = "book-cover-icon";
        coverIcon.setAttribute("aria-hidden", "true");
        coverIcon.textContent = categoryIcon(catKey);
        coverDiv.appendChild(coverIcon);
      };
      coverDiv.appendChild(img);
      if (hasPdf) {
        coverDiv.style.cursor = "pointer";
        coverDiv.setAttribute("role", "button");
        coverDiv.setAttribute("tabindex", "0");
        coverDiv.setAttribute("aria-label", t("Lire le PDF", "قراءة PDF") + " — " + title);
        function openReader() {
          window.location.href = pdfViewerHref(book);
        }
        coverDiv.addEventListener("click", openReader);
        coverDiv.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openReader();
          }
        });
      }
    } else {
      coverDiv.style.background = "linear-gradient(135deg," + coverBg + ",#0f172a)";
      const coverIcon = document.createElement("span");
      coverIcon.className = "book-cover-icon";
      coverIcon.setAttribute("aria-hidden", "true");
      coverIcon.textContent = categoryIcon(catKey);
      coverDiv.appendChild(coverIcon);
    }
    inner.appendChild(coverDiv);

    const body = document.createElement("div");
    body.className = "book-body";

    if (book.collection && catalog.collections && catalog.collections[book.collection]) {
      const colSpan = document.createElement("span");
      colSpan.className = "book-collection-tag";
      colSpan.textContent = collectionLabel(book.collection);
      body.appendChild(colSpan);
    }

    const catSpan = document.createElement("span");
    catSpan.className = "book-category";
    catSpan.textContent = categoryLabel(catKey);
    body.appendChild(catSpan);

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
      t("Ajouter aux favoris", "إضافة إلى المفضلة")
    );
    favBtn.textContent = favoriteIds.has(book.id) ? "★" : "☆";
    favBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleFavoriteUi(book, favBtn);
    });
    actions.appendChild(favBtn);

    if (hasPdf) {
      const read = document.createElement("a");
      read.className = "btn btn-primary btn-sm";
      read.href = pdfViewerHref(book);
      read.textContent = t("Lire le PDF", "قراءة PDF");
      actions.appendChild(read);

      const dl = document.createElement("a");
      dl.className = "btn btn-download btn-sm";
      dl.href = resolveAssetUrl(book.pdfUrl);
      dl.setAttribute("download", "");
      dl.textContent = t("Télécharger PDF", "تنزيل PDF");
      dl.addEventListener("click", function () {
        if (book.id && window.ElectroDzPdfStats) {
          window.ElectroDzPdfStats.trackDownload(book.id);
        }
      });
      actions.appendChild(dl);
    } else {
      const soon = document.createElement("span");
      soon.className = "book-soon";
      soon.textContent = t("PDF bientôt disponible", "PDF قريبًا");
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
    books.forEach(function (book) {
      targetEl.appendChild(renderBookCard(book));
    });
  }

  function collectionLabel(key) {
    const col = catalog.collections && catalog.collections[key];
    if (!col) return key;
    return t(col.labelFr, col.labelAr);
  }

  function renderCollections() {
    if (!els.collections || !catalog || !catalog.collections) return;
    els.collections.innerHTML = "";
    function makeCol(key, label) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "book-collection" + (collection === key ? " book-collection--active" : "");
      btn.textContent = label;
      btn.addEventListener("click", function () {
        collection = key;
        category = "all";
        render();
      });
      els.collections.appendChild(btn);
    }
    makeCol("all", t("Toutes les collections", "كل المجموعات"));
    const keys = Object.keys(catalog.collections).sort(function (a, b) {
      return (catalog.collections[a].order || 0) - (catalog.collections[b].order || 0);
    });
    keys.forEach(function (key) {
      const icon = catalog.collections[key].icon || "";
      makeCol(key, icon + " " + collectionLabel(key));
    });
  }

  function renderFilters() {
    if (!els.filters || !catalog) return;
    els.filters.innerHTML = "";

    function makeFilter(key, label) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-filter" + (category === key ? " book-filter--active" : "");
      btn.textContent = label;
      btn.addEventListener("click", function () {
        category = key;
        render();
      });
      els.filters.appendChild(btn);
    }

    makeFilter("all", t("Toutes", "الكل"));
    if (sessionLoggedIn) {
      const favLabel = t("★ Mes favoris", "★ مفضلتي");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "book-filter" + (favoritesOnly ? " book-filter--active" : "");
      btn.textContent = favLabel;
      btn.addEventListener("click", function () {
        favoritesOnly = !favoritesOnly;
        const u = new URL(location.href);
        if (favoritesOnly) u.searchParams.set("favorites", "1");
        else u.searchParams.delete("favorites");
        history.replaceState({}, "", u.pathname + u.search);
        render();
      });
      els.filters.appendChild(btn);
    }
    Object.keys(catalog.categories).forEach(function (key) {
      makeFilter(key, categoryIcon(key) + " " + categoryLabel(key));
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
                "سجّل الدخول (بريد أو Google) لحفظ المفضلة."
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
        if (favoritesOnly) render();
      })
      .catch(function () {
        alert(t("Impossible d'enregistrer le favori.", "تعذر حفظ المفضلة."));
      });
  }

  async function loadSideData() {
    if (window.ElectroDzPdfStats?.fetchAllBookStats) {
      try {
        pdfStatsMap = await window.ElectroDzPdfStats.fetchAllBookStats();
      } catch (_) {
        pdfStatsMap = {};
      }
    }
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
    renderCollections();
    renderFilters();

    const all = getBooks(false);
    const featured = getBooks(true);
    const showFeatured =
      featured.length > 0 &&
      collection === "all" &&
      category === "all" &&
      !query.trim() &&
      !favoritesOnly;

    if (els.featured) els.featured.hidden = !showFeatured;
    if (showFeatured && els.featuredGrid) renderGrid(els.featuredGrid, featured);

    els.grid.classList.add("book-grid");
    renderGrid(els.grid, all);

    if (els.count) els.count.textContent = t(all.length + " ouvrage(s)", all.length + " كتاب");
    if (els.empty) els.empty.hidden = all.length > 0;
  }

  function loadCatalog() {
    fetch("data/livres.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        catalog = data;
        if (els.updated && data.updated) {
          els.updated.textContent = t(
            "Catalogue mis à jour le " + data.updated,
            "آخر تحديث: " + data.updated
          );
        }
        return loadSideData();
      })
      .then(function () {
        render();
      })
      .catch(function () {
        els.grid.innerHTML =
          '<p class="book-error">' +
          t("Impossible de charger le catalogue.", "تعذر تحميل المكتبة.") +
          "</p>";
      });
  }

  if (els.search) {
    els.search.addEventListener("input", function (e) {
      query = e.target.value || "";
      render();
    });
  }

  if (els.langFr) els.langFr.addEventListener("click", function () { setLang("fr"); });
  if (els.langAr) els.langAr.addEventListener("click", function () { setLang("ar"); });

  setLang(lang);
  loadCatalog();
})();
