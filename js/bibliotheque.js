/**
 * Bibliothèque PDF — catalogue dynamique (data/livres.json)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";

  const els = {
    grid: document.querySelector("[data-books-grid]"),
    search: document.querySelector("[data-books-search]"),
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
  let lang = localStorage.getItem(STORAGE_LANG) || "fr";
  let category = "all";
  let query = "";

  const COVER_COLORS = {
    normes: "#1e40af",
    installation: "#0d9488",
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

  function setLang(next) {
    lang = next === "ar" ? "ar" : "fr";
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (els.langFr) els.langFr.setAttribute("aria-pressed", lang === "fr" ? "true" : "false");
    if (els.langAr) els.langAr.setAttribute("aria-pressed", lang === "ar" ? "true" : "false");
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
      if (category !== "all" && book.category !== category) return false;
      return matchesSearch(book);
    });
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
    coverDiv.className = "book-cover";
    coverDiv.style.background = "linear-gradient(135deg," + coverBg + ",#0f172a)";
    const coverIcon = document.createElement("span");
    coverIcon.className = "book-cover-icon";
    coverIcon.setAttribute("aria-hidden", "true");
    coverIcon.textContent = categoryIcon(catKey);
    coverDiv.appendChild(coverIcon);
    inner.appendChild(coverDiv);

    const body = document.createElement("div");
    body.className = "book-body";

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

    const actions = document.createElement("div");
    actions.className = "book-actions";
    if (hasPdf) {
      const dl = document.createElement("a");
      dl.className = "btn btn-primary btn-sm";
      dl.href = book.pdfUrl;
      dl.target = "_blank";
      dl.rel = "noopener noreferrer";
      dl.textContent = t("Télécharger PDF", "تحميل PDF");
      actions.appendChild(dl);

      const open = document.createElement("a");
      open.className = "btn btn-outline btn-sm";
      open.href = book.pdfUrl;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = t("Ouvrir", "فتح");
      actions.appendChild(open);
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
    Object.keys(catalog.categories).forEach(function (key) {
      makeFilter(key, categoryIcon(key) + " " + categoryLabel(key));
    });
  }

  function render() {
    if (!catalog) return;
    renderFilters();

    const all = getBooks(false);
    const featured = getBooks(true);
    const showFeatured = featured.length > 0 && category === "all" && !query.trim();

    if (els.featured) els.featured.hidden = !showFeatured;
    if (showFeatured && els.featuredGrid) renderGrid(els.featuredGrid, featured);

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
