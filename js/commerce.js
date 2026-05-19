/**
 * Commerce — annuaire magasins + inventaire (brouillon, non publié)
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";

  const els = {
    stores: document.querySelector("[data-commerce-stores]"),
    cities: document.querySelector("[data-commerce-cities]"),
    search: document.querySelector("[data-commerce-search]"),
    count: document.querySelector("[data-commerce-count]"),
    empty: document.querySelector("[data-commerce-empty]"),
    disclaimer: document.querySelector("[data-commerce-disclaimer]"),
    updated: document.querySelector("[data-commerce-updated]"),
    langFr: document.querySelector("[data-lang-fr]"),
    langAr: document.querySelector("[data-lang-ar]"),
  };

  if (!els.stores) return;

  let catalog = null;
  let lang = localStorage.getItem(STORAGE_LANG) || "fr";
  let city = "all";
  let query = "";

  function t(fr, ar) {
    return lang === "ar" ? ar : fr;
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
    render();
  }

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function cityLabel(key) {
    const c = catalog.cities && catalog.cities[key];
    return c ? t(c.labelFr, c.labelAr) : key;
  }

  function categoryLabel(key) {
    const c = catalog.categories && catalog.categories[key];
    if (!c) return key;
    const icon = c.icon ? c.icon + " " : "";
    return icon + t(c.labelFr, c.labelAr);
  }

  function stockLabel(stock) {
    if (stock === "contact") return t("Contact magasin", "اتصل بالمتجر");
    if (stock === "low") return t("Stock faible", "مخزون منخفض");
    if (stock === "on_order") return t("Sur commande", "حسب الطلب");
    if (stock === "out") return t("Rupture", "نفاد");
    return t("En stock", "متوفر");
  }

  function formatPrice(item) {
    if (item.price == null || item.price === "") {
      return t("Sur demande", "حسب الطلب");
    }
    const n = Number(item.price);
    if (!Number.isFinite(n)) return "—";
    try {
      return (
        new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ").format(n) +
        " " +
        (item.currency || "DZD")
      );
    } catch (_e) {
      return n + " " + (item.currency || "DZD");
    }
  }

  function matchesSearch(store) {
    if (!query.trim()) return true;
    const q = normalize(query);
    const hay = normalize(
      [
        store.nameFr,
        store.nameAr,
        store.addressFr,
        store.addressAr,
        store.phone,
        store.email,
        store.wilayaFr,
        store.wilayaAr,
        store.communeFr,
        store.communeAr,
        store.activityFr,
        store.activityAr,
        (store.brands || []).join(" "),
        (store.inventory || [])
          .map(function (i) {
            return [i.labelFr, i.labelAr, i.brand].join(" ");
          })
          .join(" "),
      ].join(" ")
    );
    return hay.indexOf(q) !== -1;
  }

  function getStores() {
    if (!catalog || !catalog.stores) return [];
    return catalog.stores.filter(function (store) {
      if (store.published === false) return false;
      if (city !== "all" && store.city !== city) return false;
      return matchesSearch(store);
    });
  }

  function renderCities() {
    if (!els.cities || !catalog.cities) return;
    els.cities.innerHTML = "";

    function btn(key, label) {
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "commerce-city-btn" + (city === key ? " commerce-city-btn--active" : "");
      b.textContent = label;
      b.addEventListener("click", function () {
        city = key;
        render();
      });
      els.cities.appendChild(b);
    }

    btn("all", t("Toutes les villes", "كل المدن"));
    Object.keys(catalog.cities)
      .sort(function (a, b) {
        return (catalog.cities[a].order || 0) - (catalog.cities[b].order || 0);
      })
      .forEach(function (key) {
        btn(key, cityLabel(key));
      });
  }

  function renderInventoryTable(items) {
    const wrap = document.createElement("div");
    wrap.className = "commerce-inventory-table-wrap";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML =
      "<tr><th>" +
      t("Produit", "منتج") +
      "</th><th>" +
      t("Catégorie", "فئة") +
      "</th><th>" +
      t("Marque", "ماركة") +
      "</th><th>" +
      t("Unité", "وحدة") +
      "</th><th>" +
      t("Prix", "سعر") +
      "</th><th>" +
      t("Stock", "مخزون") +
      "</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    items.forEach(function (item) {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.textContent = t(item.labelFr, item.labelAr);
      const tdCat = document.createElement("td");
      tdCat.textContent = categoryLabel(item.category || "");
      const tdBrand = document.createElement("td");
      tdBrand.textContent = item.brand || "—";
      const tdUnit = document.createElement("td");
      tdUnit.textContent = item.unit || "—";
      const tdPrice = document.createElement("td");
      tdPrice.className = "commerce-price";
      tdPrice.textContent = formatPrice(item);
      const tdStock = document.createElement("td");
      const span = document.createElement("span");
      span.className = "commerce-stock commerce-stock--" + (item.stock || "in_stock");
      span.textContent = stockLabel(item.stock);
      tdStock.appendChild(span);
      tr.appendChild(tdName);
      tr.appendChild(tdCat);
      tr.appendChild(tdBrand);
      tr.appendChild(tdUnit);
      tr.appendChild(tdPrice);
      tr.appendChild(tdStock);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function firstPhone(phone) {
    const m = String(phone || "").match(/0[567]\d{8}/);
    return m ? m[0] : String(phone || "").split("/")[0].trim();
  }

  function wilayaSortKey(store) {
    const c = catalog.cities && catalog.cities[store.city];
    return c ? c.order || 99 : 99;
  }

  function renderStoreCard(store) {
    const card = document.createElement("article");
    card.className = "commerce-store" + (store.demo ? " commerce-store--demo" : "");

    const head = document.createElement("div");
    head.className = "commerce-store__head";

    const info = document.createElement("div");
    if (store.demo) {
      const badge = document.createElement("span");
      badge.className = "commerce-store__badge";
      badge.textContent = t("Exemple / démo", "مثال / تجريبي");
      info.appendChild(badge);
    } else if (store.activityFr) {
      const badge = document.createElement("span");
      badge.className = "commerce-store__badge commerce-store__badge--official";
      badge.textContent = t(store.activityFr, store.activityAr || store.activityFr);
      info.appendChild(badge);
    }
    const h2 = document.createElement("h2");
    h2.className = "commerce-store__title";
    h2.textContent = t(store.nameFr, store.nameAr);
    info.appendChild(h2);
    const meta = document.createElement("p");
    meta.className = "commerce-store__meta";
    const loc =
      (store.wilayaFr
        ? t(store.wilayaFr, store.wilayaAr || store.wilayaFr) +
          (store.communeFr
            ? " · " + t(store.communeFr, store.communeAr || store.communeFr)
            : "")
        : cityLabel(store.city)) || "";
    meta.innerHTML =
      (loc ? "🗺️ " + loc + "<br>" : "") +
      "📍 " +
      t(store.addressFr, store.addressAr) +
      (store.phone ? "<br>📞 " + store.phone : "") +
      (store.email ? "<br>✉️ " + store.email : "") +
      (store.hoursFr ? "<br>🕐 " + t(store.hoursFr, store.hoursAr || store.hoursFr) : "");
    info.appendChild(meta);
    if (store.noteFr) {
      const note = document.createElement("p");
      note.className = "commerce-store__meta";
      note.textContent = t(store.noteFr, store.noteAr || store.noteFr);
      info.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "commerce-store__actions";
    if (store.mapUrl) {
      const map = document.createElement("a");
      map.href = store.mapUrl;
      map.target = "_blank";
      map.rel = "noopener noreferrer";
      map.textContent = t("Carte", "خريطة");
      actions.appendChild(map);
    }
    if (store.whatsapp) {
      const wa = document.createElement("a");
      wa.href = "https://wa.me/" + String(store.whatsapp).replace(/\D/g, "");
      wa.target = "_blank";
      wa.rel = "noopener noreferrer";
      wa.textContent = "WhatsApp";
      actions.appendChild(wa);
    }
    if (store.email) {
      const mail = document.createElement("a");
      mail.href = "mailto:" + store.email;
      mail.textContent = t("E-mail", "بريد");
      actions.appendChild(mail);
    }
    if (store.phone) {
      const tel = document.createElement("a");
      tel.href = "tel:" + firstPhone(store.phone);
      tel.textContent = t("Appeler", "اتصال");
      actions.appendChild(tel);
    }

    head.appendChild(info);
    head.appendChild(actions);

    const items = store.inventory || [];
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "commerce-store__toggle";
    toggle.textContent =
      t("Voir l'inventaire", "عرض المخزون") +
      " (" +
      items.length +
      " " +
      t("articles", "منتج") +
      ")";

    const inv = document.createElement("div");
    inv.className = "commerce-inventory";
    if (items.length) inv.appendChild(renderInventoryTable(items));
    else {
      const p = document.createElement("p");
      p.style.padding = "1rem";
      p.style.color = "#94a3b8";
      p.textContent = t("Aucun article listé.", "لا توجد منتجات.");
      inv.appendChild(p);
    }

    toggle.addEventListener("click", function () {
      card.classList.toggle("is-open");
      toggle.textContent = card.classList.contains("is-open")
        ? t("Masquer l'inventaire", "إخفاء المخزون")
        : t("Voir l'inventaire", "عرض المخزون") +
          " (" +
          items.length +
          " " +
          t("articles", "منتج") +
          ")";
    });

    card.appendChild(head);
    card.appendChild(toggle);
    card.appendChild(inv);
    return card;
  }

  function renderWilayaGroup(wilayaLabelText, stores) {
    const section = document.createElement("section");
    section.className = "commerce-wilaya-group";
    const h = document.createElement("h2");
    h.className = "commerce-wilaya-group__title";
    h.textContent = wilayaLabelText;
    section.appendChild(h);
    const grid = document.createElement("div");
    grid.className = "commerce-wilaya-group__stores";
    stores.forEach(function (store) {
      grid.appendChild(renderStoreCard(store));
    });
    section.appendChild(grid);
    return section;
  }

  function render() {
    if (!catalog) return;
    renderCities();
    const list = getStores();
    els.stores.innerHTML = "";
    if (city === "all" && list.length > 1) {
      const groups = {};
      list.forEach(function (store) {
        const key = store.city || "autres";
        if (!groups[key]) groups[key] = [];
        groups[key].push(store);
      });
      Object.keys(groups)
        .sort(function (a, b) {
          return wilayaSortKey({ city: a }) - wilayaSortKey({ city: b });
        })
        .forEach(function (key) {
          const stores = groups[key];
          const label =
            stores[0] && stores[0].wilayaFr
              ? t(stores[0].wilayaFr, stores[0].wilayaAr || stores[0].wilayaFr) +
                " (" +
                stores.length +
                ")"
              : cityLabel(key) + " (" + stores.length + ")";
          els.stores.appendChild(renderWilayaGroup(label, stores));
        });
    } else {
      list.forEach(function (store) {
        els.stores.appendChild(renderStoreCard(store));
      });
    }
    if (els.count) {
      els.count.textContent =
        list.length + " " + t("magasin(s)", "متجر") + " · " + catalog.stores.length + " " + t("au total (fichier)", "في الملف");
    }
    if (els.empty) els.empty.hidden = list.length > 0;
  }

  function load() {
    fetch("data/commerce.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        catalog = data;
        if (els.disclaimer) {
          els.disclaimer.textContent = t(data.disclaimerFr, data.disclaimerAr);
        }
        if (els.updated && data.updated) {
          els.updated.textContent = t(
            "Données brouillon — " + data.updated,
            "مسودة بيانات — " + data.updated
          );
        }
        setLang(lang);
      })
      .catch(function () {
        els.stores.innerHTML =
          '<p class="commerce-empty">' +
          t("Impossible de charger les magasins.", "تعذر تحميل المتاجر.") +
          "</p>";
      });
  }

  if (els.search) {
    els.search.addEventListener("input", function (e) {
      query = e.target.value || "";
      render();
    });
  }
  if (els.langFr) els.langFr.addEventListener("click", function () {
    setLang("fr");
  });
  if (els.langAr) els.langAr.addEventListener("click", function () {
    setLang("ar");
  });

  load();
})();
