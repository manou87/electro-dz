/**
 * Documentation électrotechnique — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Documentation — DZSWISS ELEC",
      "meta.desc":
        "Documentation technique pour électriciens : monophasé, triphasé, magnétisme, énergie.",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.lib": "Bibliothèque",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.badge": "4 modules · PDF, Excel & GeoGebra",
      "hero.title": "Documentation électrotechnique",
      "hero.sub":
        "Ressources classées par thème pour réviser, calculer et visualiser sur le terrain ou en formation.",
      "jump.label": "Aller au module",
      "jump.mono": "Monophasé",
      "jump.tri": "Triphasé",
      "jump.mag": "Magnétisme",
      "jump.nrj": "Énergie",
      "mono.title": "Monophasé",
      "mono.meta": "6 fiches · 5 simulations GeoGebra",
      "tri.title": "Triphasé",
      "tri.meta": "2 fiches · 2 simulations",
      "mag.title": "Magnétisme",
      "mag.meta": "5 ressources",
      "nrj.title": "Énergie",
      "nrj.meta": "2 ressources officielles",
      "tag.pdf": "PDF",
      "tag.xls": "Excel",
      "tag.img": "Image",
      "tag.web": "Web",
      "tools.label": "Applications GeoGebra (en ligne)",
      "attr.before": "Ressources hébergées sur",
      "attr.lib": "la bibliothèque du site",
      "attr.and": " · Crédits ",
      "attr.credit": "Electrons.ch",
      "footer.tagline": "L'outil numérique des électriciens algériens. 100% gratuit.",
      "footer.nav": "Navigation",
      "footer.support": "Support",
      "footer.privacy": "Confidentialité",
      "footer.copy": "© 2026 DZSWISS ELEC. Tous droits réservés.",
      "res.mono.1": "Phaseurs en alternatif (80 formules)",
      "res.mono.2": "Phaseurs — version 2 par page",
      "res.mono.3": "Phaseurs complexes",
      "res.mono.4": "Filtres passifs passe haut / bas",
      "res.mono.5": "Circuit RLC série",
      "res.mono.6": "Correction cos φ",
      "geo.mono.1": "Sinus / Cosinus",
      "geo.mono.2": "Sinus U/I",
      "geo.mono.3": "RL série",
      "geo.mono.4": "RC série",
      "geo.mono.5": "RLC série",
      "res.tri.1": "Correction cos φ triphasé",
      "res.tri.2": "Dénominations usuelles",
      "geo.tri.1": "Phaseurs triphasés",
      "geo.tri.2": "Étoile déséquilibrée",
      "res.mag.1": "Force de Laplace / Loi de Faraday",
      "res.mag.2": "Effet pelliculaire",
      "res.mag.3": "Moteurs synchrone / asynchrone",
      "res.mag.4": "Courbes B/H",
      "res.mag.5": "Grandeurs magnétiques / électriques",
      "res.nrj.1": "Diagramme énergie Suisse (corrigé)",
      "res.nrj.2": "Statistiques OFEN officielles",
    },
    ar: {
      "meta.title": "التوثيق التقني — DZSWISS ELEC",
      "meta.desc":
        "توثيق تقني للكهربائيين: أحادي الطور، ثلاثي الطور، مغناطيسية، طاقة وموارد.",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.lib": "مكتبة PDF",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.badge": "4 وحدات · PDF و Excel و GeoGebra",
      "hero.title": "التوثيق الكهربائي والتقني",
      "hero.sub":
        "موارد مصنّفة حسب الموضوع للمراجعة والحساب والتصور في الموقع أو أثناء التكوين.",
      "jump.label": "الانتقال إلى الوحدة",
      "jump.mono": "أحادي الطور",
      "jump.tri": "ثلاثي الطور",
      "jump.mag": "المغناطيسية",
      "jump.nrj": "الطاقة",
      "mono.title": "أحادي الطور",
      "mono.meta": "6 بطاقات · 5 محاكاة GeoGebra",
      "tri.title": "ثلاثي الطور",
      "tri.meta": "بطاقتان · محاكاتان",
      "mag.title": "المغناطيسية",
      "mag.meta": "5 موارد",
      "nrj.title": "الطاقة",
      "nrj.meta": "موردان رسميان",
      "tag.pdf": "PDF",
      "tag.xls": "Excel",
      "tag.img": "صورة",
      "tag.web": "ويب",
      "tools.label": "تطبيقات GeoGebra (عبر الإنترنت)",
      "attr.before": "موارد مستضافة على",
      "attr.lib": "مكتبة الموقع",
      "attr.and": " · مصدر ",
      "attr.credit": "Electrons.ch",
      "footer.tagline": "الأداة الرقمية للكهربائيين الجزائريين. مجاني 100%.",
      "footer.nav": "التنقل",
      "footer.support": "الدعم",
      "footer.privacy": "الخصوصية",
      "footer.copy": "© 2026 DZSWISS ELEC. جميع الحقوق محفوظة.",
      "res.mono.1": "الأطوار في التيار المتناوب (80 صيغة)",
      "res.mono.2": "الأطوار — نسخة صفحتين",
      "res.mono.3": "أطوار مركبة",
      "res.mono.4": "مرشحات سلبية عالية/منخفضة التردد",
      "res.mono.5": "دائرة RLC متسلسلة",
      "res.mono.6": "تصحيح معامل القدرة cos φ",
      "geo.mono.1": "جيب / جيب تمام",
      "geo.mono.2": "جيب U/I",
      "geo.mono.3": "RL متسلسل",
      "geo.mono.4": "RC متسلسل",
      "geo.mono.5": "RLC متسلسل",
      "res.tri.1": "تصحيح cos φ ثلاثي الطور",
      "res.tri.2": "التسميات الشائعة",
      "geo.tri.1": "أطوار ثلاثية الطور",
      "geo.tri.2": "نجمة غير متوازنة",
      "res.mag.1": "قوة لابلاس / قانون فاراداي",
      "res.mag.2": "التأثير السطحي",
      "res.mag.3": "محركات متزامنة / غير متزامنة",
      "res.mag.4": "منحنيات B/H",
      "res.mag.5": "الكميات المغناطيسية / الكهربائية",
      "res.nrj.1": "مخطط الطاقة سويسرا (مصحح)",
      "res.nrj.2": "إحصائيات OFEN الرسمية",
    },
  };

  var lang = "ar";

  function t(key) {
    return (T[lang] && T[lang][key]) || (T.fr[key] || key);
  }

  window.ElectroDzDocsI18n = {
    t: function (lng, key) {
      return (T[lng] && T[lng][key]) || (T.fr[key] || key);
    },
  };

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

    var jumpNav = document.querySelector(".docs-jump");
    if (jumpNav) jumpNav.setAttribute("aria-label", t("jump.label"));

    if (window.ElectroDzDocsWire && window.ElectroDzDocsWire.refresh) {
      window.ElectroDzDocsWire.refresh();
    }

    document.querySelectorAll("a.doc-resource--pdf[data-pdf-src] .doc-resource-arrow").forEach(function (arrow) {
      arrow.textContent = lang === "ar" ? "←" : "→";
    });

    try {
      localStorage.setItem(STORAGE, lang);
    } catch (e) {}
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
