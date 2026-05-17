/**
 * Page Formations — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Formations — DZSWISS ELEC",
      "meta.desc":
        "Formation en école en Algérie : contenu, savoir-faire et matériel suisses — présentiel.",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.title": "Formation suisse en Algérie",
      "hero.sub":
        "Projet de formation en école : le contenu suisse, le savoir-faire suisse et les pratiques matériel suisses, en présentiel (salle, atelier, terrain), en français et en arabe.",
      "soon.badge": "Formation à venir",
      "block.what.title": "Le modèle suisse, en Algérie",
      "block.what.p":
        "Normes, schémas, sécurité et rigueur du système suisse, pour les électriciens du bâtiment, de l'industrie et de la maintenance.",
      "block.topics.title": "Axes du parcours",
      "block.topics.li1": "Contenu suisse : installations, normes et bonnes pratiques",
      "block.topics.li2": "Savoir-faire suisse : tableaux, protections, câblage",
      "block.topics.li3": "Matériel et méthodes selon les standards suisses",
      "block.topics.li4": "École partenaire en Algérie — suivi sur Facebook Electro DZ et WhatsApp",
      "block.notify.title": "Rester informé",
      "block.notify.p":
        "Le calendrier et les inscriptions seront communiqués sur la page Facebook Electro DZ et sur WhatsApp — sans date fixée pour l'instant.",
      "cta.wa": "WhatsApp",
      "cta.fb": "Facebook Electro DZ",
      "cta.contact": "Page contact",
      "section.pdf": "Supports PDF (disponibles)",
      "section.pdf.sub": "Modules du programme suisse (FET, AE…) — lecture en ligne avec code d'accès.",
      "section.school": "École en Algérie",
      "section.school.soon":
        "Pas de formation par vidéo sur ce site. Le parcours prévu se fera en école : programmes suisses, gestes professionnels suisses, matériel et méthodes adaptés aux chantiers algériens. Projet en préparation.",
      "section.empty": "Aucun PDF formation pour le moment.",
      "link.library": "Toute la bibliothèque PDF →",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
    ar: {
      "meta.title": "التكوين — DZSWISS ELEC",
      "meta.desc":
        "تكوين في مدرسة بالجزائر: محتوى وخبرة ومعدات سويسرية — حضوري.",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.title": "تكوين سويسري في الجزائر",
      "hero.sub":
        "مشروع تكوين في مدرسة: المحتوى السويسري والخبرة السويسرية والمعدات والأساليب السويسرية — حضورياً (قاعة، ورشة، ميدان)، بالفرنسية والعربية.",
      "soon.badge": "تكوين لاحقاً",
      "block.what.title": "النموذج السويسري في الجزائر",
      "block.what.p":
        "معايير ومخططات وسلامة وصرامة النظام السويسري، للكهربائيين في البناء والصناعة والصيانة.",
      "block.topics.title": "محاور المسار",
      "block.topics.li1": "محتوى سويسري: تركيبات، معايير وممارسات جيدة",
      "block.topics.li2": "خبرة سويسرية: لوحات، حمايات، تمديدات",
      "block.topics.li3": "معدات وأساليب وفق المعايير السويسرية",
      "block.topics.li4": "مدرسة شريكة في الجزائر — متابعة عبر فيسبوك Electro DZ وواتساب",
      "block.notify.title": "البقاء على اطلاع",
      "block.notify.p":
        "يُعلَن عن المواعيد والتسجيل عبر فيسبوك Electro DZ وواتساب — دون تحديد تاريخ حالياً.",
      "cta.wa": "واتساب",
      "cta.fb": "فيسبوك Electro DZ",
      "cta.contact": "صفحة الاتصال",
      "section.pdf": "دعم PDF (متاح)",
      "section.pdf.sub": "وحدات البرنامج السويسري (FET، AE…) — قراءة على الموقع برمز وصول.",
      "section.school": "مدرسة في الجزائر",
      "section.school.soon":
        "لا تكوين بالفيديو على هذا الموقع. المسار المخطط حضورياً في مدرسة: برامج سويسرية، أسلوب عمل سويسري، معدات وأساليب ملائمة لورش الجزائر. المشروع قيد الإعداد.",
      "section.empty": "لا يوجد PDF تكوين حالياً.",
      "link.library": "كل مكتبة PDF ←",
      "footer.copy": "© 2026 DZSWISS ELEC — electro-dz.com",
    },
  };

  var lang = "ar";

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function applyLang(next) {
    lang = next === "fr" ? "fr" : "ar";
    var root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("meta.title");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.desc"));

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });

    try {
      localStorage.setItem(STORAGE, lang);
    } catch (e) {}

    document.dispatchEvent(
      new CustomEvent("electrodz-lang-changed", { detail: { lang: lang } })
    );
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-lang"));
    });
  });

  var saved = "ar";
  try {
    saved = localStorage.getItem(STORAGE) || "ar";
  } catch (e) {}
  if (saved !== "fr" && saved !== "ar") saved = "ar";
  applyLang(saved);
})();
