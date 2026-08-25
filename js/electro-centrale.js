/**
 * Électro-Centrale — structure type Sonepar (brouillon)
 */
(function () {
  const STORAGE_LANG_EC = "electro-centrale-lang";
  const STORAGE_CART = "electro-centrale-cart";
  const DATA_URL = "data/electro-centrale.json";

  const page = document.body.getAttribute("data-ec-page") || "home";
  const htmlDefaultLang =
    document.documentElement.getAttribute("data-default-lang") || "fr";

  let catalog = null;
  let lang = localStorage.getItem(STORAGE_LANG_EC) || htmlDefaultLang;

  function t(fr, ar) {
    return lang === "ar" && ar ? ar : fr;
  }

  function unitLabel(unit) {
    if (unit === "m") return t("m", "م");
    if (unit === "pce") return t("pce", "قطعة");
    return unit || "—";
  }

  function applyPageMeta() {
    const i = catalog && catalog.i18n;
    if (!i) return;
    if (page === "home") {
      document.title = t(i.homeTitleFr, i.homeTitleAr);
    } else if (page === "catalogue") {
      document.title = t(i.catalogueTitleFr, i.catalogueTitleAr);
    } else if (page === "product") {
      document.title = t(i.productTitleFr, i.productTitleAr);
    }
    const draft = document.querySelector(".ec-draft-banner");
    if (draft) {
      if (page === "catalogue") {
        draft.textContent = t(i.draftCatalogueFr, i.draftCatalogueAr);
      } else if (page === "product") {
        draft.textContent = t(i.draftProductFr, i.draftProductAr);
      } else {
        draft.textContent = t(i.draftBannerFr, i.draftBannerAr);
      }
    }
    const foot = document.querySelector(".ec-footer-brand");
    if (foot) foot.textContent = t(i.footerFr, i.footerAr);
  }

  function qs(sel) {
    return document.querySelector(sel);
  }

  function formatPrice(p, currency) {
    const n = Number(p);
    if (!Number.isFinite(n)) return "—";
    try {
      return (
        new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-CH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(n) +
        " " +
        (currency || "CHF")
      );
    } catch (_e) {
      return n + " " + (currency || "CHF");
    }
  }

  function stockLabel(stock) {
    if (stock === "low") return t("Stock faible", "مخزون منخفض");
    if (stock === "on_order") return t("Sur commande", "حسب الطلب");
    return t("En stock", "متوفر");
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CART) || "[]");
    } catch (_e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_CART, JSON.stringify(items));
    updateCartBadge();
  }

  function addToCart(productId, qty) {
    const items = getCart();
    const found = items.find(function (x) {
      return x.id === productId;
    });
    if (found) found.qty += qty || 1;
    else items.push({ id: productId, qty: qty || 1 });
    saveCart(items);
  }

  function updateCartBadge() {
    const badge = qs("[data-ec-cart-count]");
    if (!badge) return;
    const n = getCart().reduce(function (s, x) {
      return s + (x.qty || 1);
    }, 0);
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }

  function setLang(next) {
    lang = next === "ar" ? "ar" : "fr";
    localStorage.setItem(STORAGE_LANG_EC, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-lang-fr]").forEach(function (b) {
      b.classList.toggle("active", lang === "fr");
    });
    document.querySelectorAll("[data-lang-ar]").forEach(function (b) {
      b.classList.toggle("active", lang === "ar");
    });
    applyPageMeta();
    renderPage();
  }

  function findCategory(id) {
    return (catalog.assortment || []).find(function (c) {
      return c.id === id;
    });
  }

  function productsForCat(catId, subId) {
    return (catalog.products || []).filter(function (p) {
      if (p.cat !== catId) return false;
      if (subId && p.sub !== subId) return false;
      return true;
    });
  }

  function productCountForCat(catId, subId) {
    return productsForCat(catId, subId || null).length;
  }

  function findProduct(id) {
    return (catalog.products || []).find(function (p) {
      return p.id === id;
    });
  }

  function ecImg(url, alt, className) {
    if (!url) return "";
    const cls = className ? ' class="' + className + '"' : "";
    return (
      '<img src="' +
      url +
      '" alt="' +
      (alt || "").replace(/"/g, "&quot;") +
      '" loading="lazy" decoding="async"' +
      cls +
      " />"
    );
  }

  function productImageUrl(p) {
    if (p.imageUrl) return p.imageUrl;
    const cat = findCategory(p.cat);
    return (cat && cat.imageUrl) || "assets/electro-centrale/sonepar/prod-cable.jpg";
  }

  function catCardHtml(cat) {
    const n = productCountForCat(cat.id);
    return (
      '<div class="ec-cat-card__img">' +
      ecImg(cat.imageUrl, t(cat.nameFr, cat.nameAr), "ec-photo") +
      "</div><h3>" +
      t(cat.nameFr, cat.nameAr) +
      "</h3><span>" +
      n +
      " " +
      t("produits", "منتج") +
      "</span>"
    );
  }

  function findSubcategory(cat, subId) {
    return (cat.subcategories || []).find(function (s) {
      return s.id === subId;
    });
  }

  function renderHeader() {
    const mount = qs("[data-ec-header]");
    if (!mount || !catalog) return;

    const b = catalog.brand;
    const h = catalog.header;
    mount.innerHTML =
      '<div class="ec-topbar">' +
      '<span data-i18n-fr="' +
      (catalog.i18n ? catalog.i18n.topbarFr : "Othman Electrique") +
      '" data-i18n-ar="' +
      (catalog.i18n ? catalog.i18n.topbarAr : "عثمان للكهرباء") +
      '">' +
      t(
        catalog.i18n ? catalog.i18n.topbarFr : "Othman Electrique — shop en ligne · Algérie",
        catalog.i18n ? catalog.i18n.topbarAr : "عثمان للكهرباء — متجر أونلاين · الجزائر"
      ) +
      "</span>" +
      '<span><a href="login.html">' +
      t("Connexion", "تسجيل الدخول") +
      "</a> · <a href=\"login.html\">" +
      t("Inscription", "التسجيل") +
      "</a></span></div>" +
      '<header class="ec-header">' +
      '<a href="electro-centrale.html" class="ec-brand">' +
      '<img src="assets/app-icon.png" alt="" width="44" height="44" />' +
      "<div><span>" +
      t(b.nameFr, b.nameAr) +
      "</span><small>" +
      t(b.taglineFr, b.taglineAr) +
      "</small></div></a>" +
      '<form class="ec-search-wrap" data-ec-search-form role="search">' +
      '<input type="search" class="ec-search" name="q" data-ec-search-input placeholder="' +
      t(h.searchPlaceholderFr, h.searchPlaceholderAr) +
      '" />' +
      '<button type="submit" class="ec-btn ec-btn--primary">' +
      t("Rechercher", "بحث") +
      "</button></form>" +
      '<div class="ec-header-actions">' +
      '<a href="commerce.html" class="ec-btn">' +
      t("🇩🇿 Algérie", "🇩🇿 الجزائر") +
      "</a>" +
      '<button type="button" class="ec-btn ec-btn--cart" data-ec-cart-toggle>🛒 ' +
      t("Liste", "قائمة") +
      ' <span class="ec-cart-badge" data-ec-cart-count hidden>0</span></button>' +
      '<button type="button" class="lang-btn' +
      (lang === "fr" ? " active" : "") +
      '" data-lang-fr>FR</button>' +
      '<button type="button" class="lang-btn' +
      (lang === "ar" ? " active" : "") +
      '" data-lang-ar>AR</button>' +
      "</div></header>" +
      '<nav class="ec-nav-main" data-ec-nav-main></nav>';

    const nav = mount.querySelector("[data-ec-nav-main]");
    (h.nav || []).forEach(function (item) {
      const a = document.createElement("a");
      var href = item.href;
      if (item.id === "home") {
        href = lang === "fr" ? "index-fr.html" : "index.html";
      }
      a.href = href;
      a.textContent = t(item.labelFr, item.labelAr);
      if (item.id === "home") {
        a.setAttribute("data-edz-home", "1");
        a.className = "edz-home-link";
      }
      nav.appendChild(a);
    });

    mount.querySelector("[data-ec-search-form]").addEventListener("submit", function (ev) {
      ev.preventDefault();
      const q = mount.querySelector("[data-ec-search-input]").value.trim();
      if (q)
        window.location.href =
          "electro-centrale-catalogue.html?q=" + encodeURIComponent(q);
    });

    const cartBtn = mount.querySelector("[data-ec-cart-toggle]");
    if (cartBtn) {
      cartBtn.addEventListener("click", function () {
        const items = getCart();
        if (!items.length) {
          alert(t("Votre liste est vide.", "قائمتك فارغة."));
          return;
        }
        const lines = items
          .map(function (it) {
            const p = findProduct(it.id);
            return p ? p.sku + " × " + it.qty : it.id;
          })
          .join("\n");
        alert(t("Liste de courses (démo):\n\n", "قائمة (تجريبي):\n\n") + lines);
      });
    }

    mount.querySelectorAll("[data-lang-fr]").forEach(function (b) {
      b.addEventListener("click", function () {
        setLang("fr");
      });
    });
    mount.querySelectorAll("[data-lang-ar]").forEach(function (b) {
      b.addEventListener("click", function () {
        setLang("ar");
      });
    });

    document.querySelectorAll("[data-i18n-fr]").forEach(function (node) {
      const fr = node.getAttribute("data-i18n-fr");
      const ar = node.getAttribute("data-i18n-ar");
      if (fr) node.textContent = t(fr, ar);
    });

    updateCartBadge();
  }

  function renderProductCard(p) {
    const a = document.createElement("a");
    a.className = "ec-product-card";
    a.href = "electro-centrale-produit.html?id=" + encodeURIComponent(p.id);
    a.innerHTML =
      '<div class="ec-product-card__img">' +
      ecImg(productImageUrl(p), t(p.nameFr, p.nameAr), "ec-photo") +
      "</div>" +
      '<div class="ec-product-card__body">' +
      '<span class="ec-product-card__brand">' +
      p.brand +
      "</span>" +
      '<p class="ec-product-card__name">' +
      t(p.nameFr, p.nameAr) +
      "</p>" +
      '<span class="ec-product-card__sku">' +
      p.sku +
      "</span>" +
      '<p class="ec-product-card__price">' +
      formatPrice(p.price, p.currency) +
      " / " +
      unitLabel(p.unit) +
      "</p>" +
      '<span class="ec-stock ec-stock--' +
      (p.stock || "in_stock") +
      '">' +
      stockLabel(p.stock) +
      "</span></div>";
    return a;
  }

  function renderOthmanHero() {
    const O = catalog.othmanShop;
    if (!O) return null;

    const wrap = document.createElement("section");
    wrap.className = "othman-hero";
    wrap.id = "accueil";

    let stepsHtml = "";
    (O.steps || []).forEach(function (st, i) {
      stepsHtml +=
        '<div class="othman-steps-strip__item">' +
        '<span class="othman-steps-strip__num">' +
        (i + 1) +
        "</span>" +
        '<span class="othman-steps-strip__label">' +
        t(st.labelFr, st.labelAr) +
        "</span></div>";
      if (i < O.steps.length - 1) {
        stepsHtml += '<span class="othman-steps-strip__arrow" aria-hidden="true">←</span>';
      }
    });

    let slidesHtml = "";
    let dotsHtml = "";
    (O.heroPhotos || []).forEach(function (ph, i) {
      slidesHtml +=
        '<div class="othman-carousel__slide' +
        (i === 0 ? " othman-carousel__slide--active" : "") +
        '">' +
        ecImg(ph.url, t(ph.altFr, ph.altAr), "ec-photo") +
        "</div>";
      dotsHtml +=
        '<button type="button" class="othman-carousel__dot' +
        (i === 0 ? " othman-carousel__dot--active" : "") +
        '" data-slide="' +
        i +
        '" aria-label="' +
        (i + 1) +
        '"></button>';
    });

    let ctasHtml = "";
    (O.ctas || []).forEach(function (c) {
      ctasHtml +=
        '<a href="' +
        c.href +
        '" class="othman-cta' +
        (c.primary ? " othman-cta--primary" : "") +
        '">' +
        t(c.labelFr, c.labelAr) +
        "</a>";
    });

    wrap.innerHTML =
      '<div class="othman-hero__intro">' +
      '<div class="othman-hero__copy">' +
      '<p class="othman-hero__subject">' +
      t(O.subjectFr, O.subjectAr) +
      "</p>" +
      "<h1 class=\"othman-hero__title\">" +
      t(O.headlineFr, O.headlineAr) +
      "</h1>" +
      '<p class="othman-hero__hook">' +
      t(O.hookFr, O.hookAr) +
      "</p>" +
      '<div class="othman-hero__ctas othman-hero__ctas--stack">' +
      ctasHtml +
      "</div></div>" +
      '<div class="othman-steps-strip">' +
      stepsHtml +
      "</div>" +
      '<div class="othman-carousel" data-othman-carousel>' +
      '<div class="othman-carousel__slides">' +
      slidesHtml +
      "</div>" +
      '<div class="othman-carousel__dots">' +
      dotsHtml +
      "</div></div>" +
      '<p class="othman-more"><a href="electro-centrale-catalogue.html">' +
      t("Voir tout le catalogue →", "كل المنتجات →") +
      "</a></p></div>";

    initOthmanCarousel(wrap);
    return wrap;
  }

  function initOthmanCarousel(root) {
    const carousel = root.querySelector("[data-othman-carousel]");
    if (!carousel) return;
    const slides = carousel.querySelectorAll(".othman-carousel__slide");
    const dots = carousel.querySelectorAll(".othman-carousel__dot");
    if (!slides.length) return;

    let current = 0;
    let timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle("othman-carousel__slide--active", i === current);
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("othman-carousel__dot--active", i === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide")) || 0);
        restart();
      });
    });

    function restart() {
      if (timer) clearInterval(timer);
      if (slides.length < 2) return;
      timer = setInterval(function () {
        show(current + 1);
      }, 4500);
    }

    restart();
  }

  function renderHome() {
    const root = qs("[data-ec-home]");
    if (!root || !catalog) return;
    root.innerHTML = "";

    const splash = renderOthmanHero();
    if (splash) {
      root.appendChild(splash);
      return;
    }

    /* fallback catalogue (sans othmanShop) */
    if (catalog.configurators && catalog.configurators.length) {
      const cfg = document.createElement("div");
      cfg.className = "ec-config-banner";
      catalog.configurators.forEach(function (c) {
        const a = document.createElement("a");
        a.className = "ec-config-card";
        a.href = c.href;
        a.innerHTML =
          "<strong>" + t(c.titleFr, c.titleAr) + "</strong><span>" + t(c.descFr, c.descAr || c.descFr) + "</span>";
        cfg.appendChild(a);
      });
      root.appendChild(cfg);
    }

    const hero = document.createElement("div");
    hero.className = "ec-hero";
    (catalog.heroSlides || []).forEach(function (s) {
      const a = document.createElement("a");
      a.className = "ec-hero-card";
      a.href = s.href;
      a.className = "ec-hero-card ec-hero-card--photo";
      a.innerHTML =
        (s.imageUrl
          ? '<div class="ec-hero-card__photo">' +
            ecImg(s.imageUrl, t(s.titleFr, s.titleAr || s.titleFr), "ec-photo") +
            "</div>"
          : "") +
        '<div class="ec-hero-card__body">' +
        '<span class="ec-badge ec-badge--' +
        (s.badgeFr === "Nouveau" ? "nouveau" : "action") +
        '">' +
        t(s.badgeFr, s.badgeAr || s.badgeFr) +
        "</span><h2>" +
        t(s.titleFr, s.titleAr || s.titleFr) +
        "</h2><p>" +
        t(s.descFr, s.descAr || s.descFr) +
        "</p></div>";
      hero.appendChild(a);
    });
    root.appendChild(hero);

    const div = document.createElement("div");
    div.className = "lid-catalog-divider";
    div.id = "catalogue-lid";
    div.textContent = t("Catalogue professionnel", "تشكيلة احترافية");
    root.appendChild(div);

    root.appendChild(sectionTitle(t("Assortiment", "التشكيلة")));
    const ag = document.createElement("div");
    ag.className = "ec-assortment-grid";
    (catalog.assortment || []).forEach(function (cat) {
      const a = document.createElement("a");
      a.className = "ec-cat-card";
      a.href = "electro-centrale-catalogue.html?cat=" + encodeURIComponent(cat.id);
      a.innerHTML = catCardHtml(cat);
      ag.appendChild(a);
    });
    root.appendChild(ag);

    root.appendChild(sectionTitle(t("Nouveauté", "جديد"), "nouveautes"));
    const nv = document.createElement("div");
    nv.className = "ec-cards-row";
    (catalog.novelties || []).forEach(function (n) {
      nv.appendChild(promoCard(n, "electro-centrale-catalogue.html?cat=" + n.cat));
    });
    root.appendChild(nv);

    root.appendChild(sectionTitle(t("Action — Promotions", "عروض"), "promotions"));
    const pr = document.createElement("div");
    pr.className = "ec-cards-row";
    (catalog.promotions || []).forEach(function (n) {
      pr.appendChild(promoCard(n, "electro-centrale-catalogue.html?cat=" + n.cat));
    });
    root.appendChild(pr);

    root.appendChild(sectionTitle(t("Découvrir nos services", "خدماتنا"), "services"));
    const sg = document.createElement("div");
    sg.className = "ec-services-grid";
    (catalog.services || []).forEach(function (s) {
      const a = document.createElement("a");
      a.className = "ec-service-card";
      a.href = s.href;
      a.innerHTML =
        (s.imageUrl
          ? '<div class="ec-service-card__img">' +
            ecImg(s.imageUrl, t(s.titleFr, s.titleAr || s.titleFr), "ec-photo") +
            "</div>"
          : "") +
        "<h3>" +
        t(s.titleFr, s.titleAr || s.titleFr) +
        "</h3><p>" +
        t(s.descFr, s.descAr || s.descFr) +
        "</p>";
      sg.appendChild(a);
    });
    root.appendChild(sg);

    root.appendChild(sectionTitle(t("Nos fournisseurs", "موردونا"), "fournisseurs"));
    const sup = document.createElement("div");
    sup.className = "ec-suppliers";
    (catalog.suppliers || []).forEach(function (name) {
      const span = document.createElement("span");
      span.className = "ec-supplier-chip";
      span.textContent = name;
      sup.appendChild(span);
    });
    root.appendChild(sup);

    root.appendChild(sectionTitle(t("Nos publications", "منشوراتنا"), "publications"));
    const pub = document.createElement("div");
    pub.className = "ec-cards-row";
    (catalog.publications || []).forEach(function (p) {
      const a = document.createElement("a");
      a.className = "ec-promo-card";
      a.href = p.href;
      a.innerHTML = "<h3>" + t(p.titleFr, p.titleAr || p.titleFr) + "</h3><p>" + t(p.descFr, p.descAr || p.descFr) + "</p>";
      pub.appendChild(a);
    });
    root.appendChild(pub);

    if (catalog.algeriaLink) {
      const dz = document.createElement("div");
      dz.className = "ec-algeria-cta";
      const L = catalog.algeriaLink;
      dz.innerHTML =
        "<h3>" +
        t(L.labelFr, L.labelAr) +
        "</h3><p>" +
        t(L.descFr, L.descAr || L.descFr) +
        '</p><a href="' +
        L.href +
        '" class="ec-btn ec-btn--primary" style="margin-top:0.75rem;display:inline-flex">' +
        t("Voir les distributeurs", "عرض الموزعين") +
        "</a>";
      root.appendChild(dz);
    }
  }

  function sectionTitle(text, id) {
    const h = document.createElement("h2");
    h.className = "ec-section-title";
    h.textContent = text;
    if (id) h.id = id;
    return h;
  }

  function promoCard(n, href) {
    const a = document.createElement("a");
    a.className = "ec-promo-card";
    a.href = href;
    a.innerHTML =
      (n.imageUrl
        ? '<div class="ec-promo-card__img">' +
          ecImg(n.imageUrl, t(n.titleFr, n.titleAr || n.titleFr), "ec-photo") +
          "</div>"
        : "") +
      '<div class="ec-promo-card__body">' +
      '<span class="ec-badge ec-badge--' +
      (n.badgeFr === "Nouveau" ? "nouveau" : "action") +
      '">' +
      t(n.badgeFr, n.badgeAr || n.badgeFr) +
      "</span><h3>" +
      t(n.titleFr, n.titleAr || n.titleFr) +
      "</h3><p>" +
      t(n.descFr, n.descAr || n.descFr) +
      (n.brand ? " — " + n.brand : "") +
      "</p></div>";
    return a;
  }

  function renderCatalogue() {
    const root = qs("[data-ec-catalogue]");
    if (!root || !catalog) return;

    const params = new URLSearchParams(window.location.search);
    const catId = params.get("cat");
    const subId = params.get("sub");
    const q = (params.get("q") || "").toLowerCase();

    root.innerHTML = "";

    const crumb = document.createElement("p");
    crumb.className = "ec-breadcrumb";
    crumb.innerHTML =
      '<a href="electro-centrale.html">' +
      t("Accueil", "الرئيسية") +
      "</a> › <a href=\"electro-centrale-catalogue.html\">" +
      t("Assortiment", "التشكيلة") +
      "</a>";
    root.appendChild(crumb);

    if (q) {
      root.appendChild(
        Object.assign(document.createElement("h1"), {
          className: "ec-page-title",
          textContent: t("Résultats pour « ", "نتائج « ") + params.get("q") + " »",
        })
      );
      const products = (catalog.products || []).filter(function (p) {
        const hay = [p.nameFr, p.nameAr, p.sku, p.brand].join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      const grid = document.createElement("div");
      grid.className = "ec-products-grid";
      if (!products.length) {
        root.appendChild(emptyMsg());
      } else {
        products.forEach(function (p) {
          grid.appendChild(renderProductCard(p));
        });
        root.appendChild(grid);
      }
      return;
    }

    if (!catId) {
      root.querySelector(".ec-breadcrumb").innerHTML =
        '<a href="electro-centrale.html">' +
        t("Accueil", "الرئيسية") +
        "</a> › " +
        t("Assortiment complet", "التشكيلة الكاملة");
      const h1 = document.createElement("h1");
      h1.className = "ec-page-title";
      h1.textContent = t("Assortiment", "التشكيلة");
      root.appendChild(h1);
      const ag = document.createElement("div");
      ag.className = "ec-assortment-grid";
      (catalog.assortment || []).forEach(function (cat) {
        const a = document.createElement("a");
        a.className = "ec-cat-card";
        a.href = "electro-centrale-catalogue.html?cat=" + encodeURIComponent(cat.id);
        a.innerHTML = catCardHtml(cat);
        ag.appendChild(a);
      });
      root.appendChild(ag);

      const chips = document.createElement("div");
      chips.className = "ec-quick-chips";
      (catalog.assortment || []).slice(0, 8).forEach(function (cat) {
        const a = document.createElement("a");
        a.className = "ec-quick-chip";
        a.href =
          "electro-centrale-catalogue.html?cat=" + encodeURIComponent(cat.id);
        a.textContent = t(cat.nameFr, cat.nameAr);
        chips.appendChild(a);
      });
      root.insertBefore(chips, ag);

      return;
    }

    const cat = findCategory(catId);
    if (!cat) {
      root.appendChild(emptyMsg());
      return;
    }

    const sub = subId ? findSubcategory(cat, subId) : null;
    crumb.innerHTML +=
      " › " + t(cat.nameFr, cat.nameAr) + (sub ? " › " + t(sub.nameFr, sub.nameAr) : subId ? " › " + subId : "");
    root.appendChild(crumb);

    const h1 = document.createElement("h1");
    h1.className = "ec-page-title";
    h1.textContent = t(cat.nameFr, cat.nameAr);
    root.appendChild(h1);

    if (cat.imageUrl) {
      const banner = document.createElement("div");
      banner.className = "ec-cat-banner";
      banner.innerHTML = ecImg(cat.imageUrl, t(cat.nameFr, cat.nameAr), "ec-photo");
      root.appendChild(banner);
    }

    const meta = document.createElement("p");
    meta.className = "ec-page-meta";
    meta.textContent =
      productCountForCat(catId, subId || null) +
      " " +
      t("produits dans cette famille", "منتج في هذه الفئة");
    root.appendChild(meta);

    if (!subId && cat.subcategories && cat.subcategories.length) {
      const sg = document.createElement("div");
      sg.className = "ec-subcat-grid";
      cat.subcategories.forEach(function (sub) {
        const a = document.createElement("a");
        a.className = "ec-subcat-card";
        a.href =
          "electro-centrale-catalogue.html?cat=" +
          encodeURIComponent(catId) +
          "&sub=" +
          encodeURIComponent(sub.id);
        a.innerHTML =
          t(sub.nameFr, sub.nameAr || sub.nameFr) +
          "<span>" +
          productCountForCat(catId, sub.id) +
          " " +
          t("Produits", "منتج") +
          "</span>";
        sg.appendChild(a);
      });
      root.appendChild(sg);
    }

    const products = productsForCat(catId, subId || null);
    const grid = document.createElement("div");
    grid.className = "ec-products-grid";
    if (products.length) {
      products.forEach(function (p) {
        grid.appendChild(renderProductCard(p));
      });
    } else {
      root.appendChild(emptyMsg());
    }
    root.appendChild(grid);
  }

  function renderProduct() {
    const root = qs("[data-ec-product]");
    if (!root || !catalog) return;

    const id = new URLSearchParams(window.location.search).get("id");
    const p = findProduct(id);
    root.innerHTML = "";

    if (!p) {
      root.appendChild(emptyMsg());
      return;
    }

    const cat = findCategory(p.cat);
    root.innerHTML =
      '<p class="ec-breadcrumb"><a href="electro-centrale.html">' +
      t("Accueil", "الرئيسية") +
      '</a> › <a href="electro-centrale-catalogue.html?cat=' +
      encodeURIComponent(p.cat) +
      '">' +
      (cat ? t(cat.nameFr, cat.nameAr) : p.cat) +
      "</a> › " +
      t(p.nameFr, p.nameAr) +
      "</p>" +
      '<div class="ec-product-detail">' +
      '<div class="ec-product-detail__visual">' +
      ecImg(productImageUrl(p), t(p.nameFr, p.nameAr), "ec-photo") +
      "</div><div>" +
      '<p class="ec-product-card__brand">' +
      p.brand +
      "</p>" +
      "<h1 class=\"ec-page-title\">" +
      t(p.nameFr, p.nameAr) +
      "</h1>" +
      '<p class="ec-page-meta">' +
      t("Réf.", "مرجع") +
      " " +
      p.sku +
      " · <span class=\"ec-stock ec-stock--" +
      (p.stock || "in_stock") +
      '">' +
      stockLabel(p.stock) +
      "</span></p>" +
      '<p class="ec-product-card__price" style="font-size:1.75rem">' +
      formatPrice(p.price, p.currency) +
      " / " +
      unitLabel(p.unit) +
      "</p>" +
      "<p style=\"color:#94a3b8;margin:1rem 0\">" +
      t(p.descFr, p.descAr || p.descFr) +
      "</p>" +
      '<button type="button" class="ec-btn ec-btn--primary" data-ec-add-cart>' +
      t("Ajouter à la liste", "إضافة للقائمة") +
      "</button> " +
      '<a href="commerce.html" class="ec-btn">' +
      t("Où acheter en Algérie", "أين أشتري في الجزائر") +
      "</a>" +
      '<table class="ec-specs-table"><tbody data-ec-specs></tbody></table></div></div>';

    const tbody = root.querySelector("[data-ec-specs]");
    (p.specs || []).forEach(function (s) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<th>" + t(s.labelFr, s.labelAr || s.labelFr) + "</th><td>" + s.value + "</td>";
      tbody.appendChild(tr);
    });

    root.querySelector("[data-ec-add-cart]").addEventListener("click", function () {
      addToCart(p.id, 1);
      alert(t("Ajouté à la liste.", "أُضيف إلى القائمة."));
    });
  }

  function emptyMsg() {
    const p = document.createElement("p");
    p.className = "ec-empty";
    p.textContent = t("Aucun résultat.", "لا توجد نتائج.");
    return p;
  }

  function renderPage() {
    renderHeader();
    if (page === "home") renderHome();
    else if (page === "catalogue") renderCatalogue();
    else if (page === "product") renderProduct();
  }

  function load() {
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(function (data) {
        catalog = data;
        if (!localStorage.getItem(STORAGE_LANG_EC) && data.defaultLang) {
          lang = data.defaultLang === "ar" ? "ar" : htmlDefaultLang;
        }
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        applyPageMeta();
        renderPage();
      })
      .catch(function () {
        const root = qs("[data-ec-home]") || qs("[data-ec-catalogue]") || qs("[data-ec-product]");
        if (root)
          root.innerHTML =
            '<p class="ec-empty">' +
            t(
              "Impossible de charger data/electro-centrale.json (serveur local requis).",
              "تعذّر تحميل data/electro-centrale.json (يلزم خادم محلي)."
            ) +
            "</p>";
      });
  }

  load();
})();
