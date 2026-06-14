/**
 * Page Support — FR / AR
 */
(function () {
  var STORAGE = "electrodz-site-lang";

  var T = {
    fr: {
      "meta.title": "Support — SwissDZ",
      "meta.desc":
        "Aide application et site : WhatsApp, Facebook Electro DZ, e-mail, FAQ.",
      "nav.home": "Accueil",
      "nav.train": "Formations",
      "nav.docs": "Documentation",
      "nav.calc": "Calculs",
      "nav.job": "Emploi",
      "nav.contact": "Contact",
      "nav.support": "Support",
      "hero.title": "Support & aide",
      "hero.sub":
        "Application mobile, site electro-dz.com, calculs et bibliothèque PDF — nous répondons en général sous 48 h ouvrées.",
      "quick.title": "Contact rapide",
      "quick.wa.desc": "Message direct — idéal pour une question courte ou une capture d’écran.",
      "quick.fb.desc":
        "Page officielle de la communauté : annonces formations, emploi et actualités.",
      "quick.mail.desc": "Pour un suivi détaillé (bug, compte, partenariat).",
      "site.title": "Aide sur le site web",
      "site.calc": "Calcul électrique en ligne (sections, chute de tension, etc.)",
      "site.lib": "Bibliothèque PDF et favoris (compte membre optionnel)",
      "site.doc": "Documentation technique (PDF, Excel, GeoGebra)",
      "site.devis": "Devis et projets (connexion requise)",
      "app.title": "Application mobile SwissDZ",
      "app.install":
        "Android : Google Play · iPhone : App Store — recherchez « SwissDZ » ou « Electro DZ ».",
      "app.crash":
        "Si l’app se ferme : fermez-la complètement, redémarrez le téléphone, mettez à jour Android/iOS puis réinstallez depuis le store.",
      "app.pdf":
        "Devis PDF : utilisez le partage système. Indiquez le modèle du téléphone et la version de l’app si un problème persiste.",
      "privacy.title": "Données et confidentialité",
      "privacy.p": "Consultez la",
      "privacy.link": "politique de confidentialité",
      "privacy.after": "pour savoir quelles données sont traitées.",
      "delay.title": "Délais de réponse",
      "delay.p":
        "WhatsApp et Facebook : souvent le jour même. E-mail : sous 48 h ouvrées. Pour l’urgence chantier, privilégiez WhatsApp avec une description claire du problème.",
      "footer.copy": "© 2026 SwissDZ — electro-dz.com",
    },
    ar: {
      "meta.title": "الدعم — SwissDZ",
      "meta.desc":
        "مساعدة التطبيق والموقع: واتساب، فيسبوك Electro DZ، بريد، أسئلة شائعة.",
      "nav.home": "الرئيسية",
      "nav.train": "التكوين",
      "nav.docs": "التوثيق",
      "nav.calc": "الحسابات",
      "nav.job": "العمل",
      "nav.contact": "اتصال",
      "nav.support": "الدعم",
      "hero.title": "الدعم والمساعدة",
      "hero.sub":
        "تطبيق الهاتف، موقع electro-dz.com، الحسابات ومكتبة PDF — نرد عادة خلال 48 ساعة عمل.",
      "quick.title": "اتصال سريع",
      "quick.wa.desc": "رسالة مباشرة — مناسبة لسؤال قصير أو لقطة شاشة.",
      "quick.fb.desc":
        "الصفحة الرسمية للمجتمع: إعلانات التكوين والعمل والأخبار.",
      "quick.mail.desc": "لمتابعة مفصّلة (عطل، حساب، شراكة).",
      "site.title": "مساعدة على الموقع",
      "site.calc": "حساب كهربائي على الإنترنت (مقاطع، هبوط جهد، إلخ)",
      "site.lib": "مكتبة PDF والمفضلة (حساب عضو اختياري)",
      "site.doc": "توثيق تقني (PDF، Excel، GeoGebra)",
      "site.devis": "عروض أسعار ومشاريع (يتطلب تسجيل الدخول)",
      "app.title": "تطبيق SwissDZ",
      "app.install":
        "أندرويد: Google Play · آيفون: App Store — ابحث عن « SwissDZ » أو « Electro DZ ».",
      "app.crash":
        "إذا أغلق التطبيق: أغلقه تماماً، أعد تشغيل الهاتف، حدّث النظام ثم أعد التثبيت من المتجر.",
      "app.pdf":
        "PDF للعروض: استخدم المشاركة في النظام. اذكر طراز الهاتف وإصدار التطبيق إذا استمرت المشكلة.",
      "privacy.title": "البيانات والخصوصية",
      "privacy.p": "راجع",
      "privacy.link": "سياسة الخصوصية",
      "privacy.after": "لمعرفة البيانات المعالجة.",
      "delay.title": "مدة الرد",
      "delay.p":
        "واتساب وفيسبوك: غالباً في نفس اليوم. البريد: خلال 48 ساعة عمل. للإلحاح في الورشة، استخدم واتساب مع وصف واضح للمشكلة.",
      "footer.copy": "© 2026 SwissDZ — electro-dz.com",
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
