#!/usr/bin/env node
/** Complète les traductions arabes dans data/electro-centrale.json */
const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "data", "electro-centrale.json");
const d = JSON.parse(fs.readFileSync(p, "utf8"));

d.brand.nameAr = "عثمان للكهرباء";
d.defaultLang = "ar";

const subAr = {
  "Barres et conducteurs de terre": "قضبان وموصلات التأريض",
  "Bornes et connecteurs de terre": "Bornes et connecteurs de terre",
  "Boîtes d'encastrement et platines": "علب تغليف ولوحات",
  "Tubes PVC / ICTA": "أنابيب PVC / ICTA",
  "Goulottes et chemins de câbles": "قنوات ومسارات الكابلات",
  "Accessoires de canalisation": "ملحقات التمديد",
  "Câbles à basse tension rigide": "كوابل جهد منخفض صلبة",
  "Câbles à basse tension souple": "كوابل جهد منخفض مرنة",
  "Câbles de données / communication (cuivre)": "كوابل بيانات / اتصالات (نحاس)",
  "Câbles de données / communication (FO)": "كوابل بيانات / اتصالات (ألياف)",
  "Boîtes de dérivation": "علب توزيع",
  "Bornes et connecteurs (Wago, etc.)": "وصلات وموصلات (Wago وغ.)",
  "Isolations et gaines thermo": "عزل وأغلفة حرارية",
  "Prises et interrupteurs": "مقابس ومفاتيح",
  "Appareillage modulaire": "أجهزة تركيب modulaire",
  "Prises industrielles": "مقابس صناعية",
  "Coffrets et armoires": "صناديق وخزائن",
  "Disjoncteurs et différentiels": "قواطع وتفاضلية",
  "Accessoires de tableau": "ملحقات اللوحة",
  "Luminaires intérieur": "إنارة داخلية",
  "Luminaires extérieur": "إنارة خارجية",
  "LED et sources lumineuses": "LED ومصادر إضاءة",
  "Contacteurs et relais": "قواطع تحكم ومرحلات",
  "Sectionneurs": "قواطع عزل",
  "Automates et variateurs": "PLC ومحولات سرعة",
  "Baies et RJ45": "خزائن و RJ45",
  "Wi-Fi 7 et switches": "Wi-Fi 7 وم switches",
  "Fibre optique": "ألياف بصرية",
  "Photovoltaïque": "طاقة شمسية",
  "Bornes de recharge e-mobilité": "محطات شحن السيارات",
  "Onduleurs et stockage": "محولات وتخزين",
};

subAr["Bornes et connecteurs de terre"] = "وصلات ومشابك التأريض";

d.assortment.forEach(function (cat) {
  (cat.subcategories || []).forEach(function (sub) {
    if (!sub.nameAr) sub.nameAr = subAr[sub.nameFr] || sub.nameFr;
  });
});

const badgeAr = { Action: "عرض", Nouveau: "جديد" };
const heroAr = {
  "Une équipe d'éclairage sur laquelle on peut compter":
    "فريق إضاءة يمكن الاعتماد عليه",
  "Bornes TRADEFORCE": "موصلات TRADEFORCE",
  "Vario – 4 pôles jusqu'à 140 A": "Vario — 4 أقطاب حتى 140 A",
  "Nouveautés & promotions de printemps": "جديد وعروض الربيع",
};
const heroDescAr = {
  "10 % sur de nombreux luminaires et lampes LED et jusqu'à 15 % sur votre prochain projet.":
    "خصم 10٪ على إنارة LED وحتى 15٪ على مشروعك القادم.",
  "Des connexions sûres, rapides et sans outil – testées selon les normes EN et UL.":
    "توصيلات آمنة وسريعة بدون أدوات — EN و UL.",
  "Interrupteurs 4 pôles IP65 pour un raccordement sûr et simple.":
    "قواطع 4 أقطاب IP65 — توصيل آمن وبسيط.",
  "Solutions d'éclairage innovantes : haute efficacité et design sophistiqué.":
    "حلول إضاءة مبتكرة — كفاءة وتصميم.",
};

(d.heroSlides || []).forEach(function (s) {
  s.badgeAr = badgeAr[s.badgeFr] || s.badgeFr;
  s.titleAr = heroAr[s.titleFr] || s.titleFr;
  s.descAr = heroDescAr[s.descFr] || s.descFr;
});

if (d.configurators && d.configurators[0]) {
  d.configurators[0].descAr = "حدّد تركيبك الشمسي (نموذج).";
}

const noveltiesAr = {
  "TeSys Vario – Interrupteurs 4 pôles jusqu'à 140 A":
    "TeSys Vario — قواطع 4 أقطاب حتى 140 A",
  "Technologie Push-X – Phoenix Contact": "تقنية Push-X — Phoenix Contact",
  "E-mobilité enfichable avec podis®": "شحن السيارات podis®",
  "Potentiomètre de puissance multi-maître DALI-2": "منظم قدرة DALI-2",
  "ABB FlexLine® & distributeurs": "ABB FlexLine® وموزعات",
  "Borne de connexion 221 – 10 entrées": "وصلة Wago 221 — 10 مداخل",
};
const noveltyDescAr = {
  "Interrupteurs 4 pôles IP65 pour un raccordement sûr et simple.":
    "قواطع 4 أقطاب IP65 — توصيل آمن.",
  "Raccordement direct de conducteurs souples et rigides.":
    "توصيل مباشر للأسلاك المرنة والصلبة.",
  "Réalisez vos projets de recharge plus efficacement.":
    "مشاريع شحن أكثر فعالية.",
  "Gradation professionnelle pour l'éclairage.": "تحكم احترافي بالإضاءة.",
  "Installer plus vite, gagner de la place.": "تركيب أسرع — توفير مساحة.",
  "Levier ouvrir – insérer – fermer, sans outil.": "فتح — إدخال — إغلاق بدون أدوات.",
};

(d.novelties || []).forEach(function (n) {
  n.badgeAr = badgeAr[n.badgeFr] || n.badgeFr;
  n.titleAr = noveltiesAr[n.titleFr] || n.titleFr;
  n.descAr = noveltyDescAr[n.descFr] || n.descFr;
});

const promoTitleAr = {
  "Éclairage Signify": "إضاءة Signify",
  "Bornes TRADEFORCE": "موصلات TRADEFORCE",
  "Câbles données Excel Networking": "كوابل بيانات Excel Networking",
  "Gamme principale éclairage 2026": "تشكيلة الإضاءة الرئيسية 2026",
  "Luminaires extérieurs Norlys": "إنارة خارجية Norlys",
  "Minuteries cage d'escalier Finder": "مؤقتات سلم Finder",
  "Disjoncteurs différentiels combinés Eaton": "قواطع تفاضلية Eaton",
  "Protection surtensions Weidmüller": "حماية صواعق Weidmüller",
};
const promoDescAr = {
  "10 % LED et jusqu'à 15 % sur votre prochain projet.":
    "خصم 10٪ على LED وحتى 15٪ على مشروعك القادم.",
  "Connexions sûres, rapides, sans outil – EN et UL.":
    "توصيلات آمنة وسريعة بدون أدوات — EN و UL.",
  "Prix promotionnels en mai sur câbles et accessoires.":
    "أسعار ترويجية في مايو على الكوابل والملحقات.",
  "Prix nets attractifs jusqu'au 31.08.2026.":
    "أسعار صافية جذابة حتى 31.08.2026.",
  "Bornes & appliques murales haut de gamme, fabriquées en Europe.":
    "أعمدة ووحدات جدارية premium — صنع أوروبي.",
  "Éclairer aussi longtemps que nécessaire.":
    "إضاءة طالما يلزم.",
  "Protection optimale en un seul appareil.":
    "حماية مثلى في جهاز واحد.",
  "Installation sûre, gain de temps.":
    "تركيب آمن وتوفير وقت.",
};

(d.promotions || []).forEach(function (pr) {
  pr.badgeAr = badgeAr[pr.badgeFr] || pr.badgeFr;
  pr.titleAr = promoTitleAr[pr.titleFr] || pr.titleFr;
  pr.descAr = promoDescAr[pr.descFr] || pr.descFr;
});

const servicesAr = {
  "Services numériques": "خدمات رقمية",
  "Emploi & carrière": "وظائف ومسار مهني",
  "Nos fournisseurs": "موردونا",
  "Nos publications": "منشوراتنا",
};
const servicesDescAr = {
  "Services qui simplifient le quotidien : listes, devis, documentation en ligne.":
    "قوائم، عروض أسعار ووثائق أونلاين.",
  "Évolution personnelle et solutions durables dans le secteur électrique.":
    "تطور مهني في قطاع الكهرباء.",
  "Marques premium, conçues pour durer et créer de la valeur.":
    "ماركات premium — جودة وقيمة.",
  "Catalogues, brochures et rapports — collection structurée.":
    "فهارس وكتيبات وتقارير — مجموعة منظمة.",
};

(d.services || []).forEach(function (s) {
  s.titleAr = servicesAr[s.titleFr] || s.titleFr;
  s.descAr = servicesDescAr[s.descFr] || s.descFr;
});

const pubTitleAr = {
  "Distributeurs et plus … — édition 2026": "الموزعون والمزيد… — إصدار 2026",
  "Gamme principale éclairage 2026": "تشكيلة الإضاءة الرئيسية 2026",
  "Normes & ouvrages techniques": "معايير ومراجع تقنية",
};
const pubDescAr = {
  "Brochure compacte, sûre, informative.":
    "كتيب موجز، موثوق ومفيد.",
  "Nouveaux produits jusqu'au 31.08.2026.":
    "منتجات جديدة حتى 31.08.2026.",
  "Bibliothèque PDF SwissDZ.":
    "مكتبة PDF SwissDZ.",
};

(d.publications || []).forEach(function (pub) {
  pub.titleAr = pubTitleAr[pub.titleFr] || pub.titleFr;
  pub.descAr = pubDescAr[pub.descFr] || pub.descFr;
});

if (d.algeriaLink) {
  d.algeriaLink.labelAr = "الشراء في الجزائر";
  d.algeriaLink.descAr = "اطلب من موزعينا المحليين — توصيل للورشة.";
}

(d.events || []).forEach(function (ev) {
  ev.titleAr = "يوم الكهرباء لوزان 2026";
  ev.descAr = "أحدث اتجاهات الطاقات المتجددة (مرجع Sonepar CH).";
  ev.dateAr = ev.dateFr || "2026";
});

const productAr = {
  "Câble H07V-K 2,5 mm² vert/jaune": "كابل H07V-K 2.5 مم² أخضر/أصفر",
  "Câble NYM-J 3G2,5 mm²": "كابل NYM-J 3G2.5 مم²",
  "H05VV-F 3G1,5 mm²": "H05VV-F 3G1.5 مم²",
  "Câble données Cat.6A S/FTP": "كابل بيانات Cat.6A S/FTP",
  "Borne de connexion Wago 221 – 5 entrées": "وصلة Wago 221 — 5 مداخل",
  "Disjoncteur modulaire 16 A courbe C": "قاطع 16 A منحنى C",
  "Disjoncteur différentiel 40 A 30 mA type A": "قاطع تفاضلي 40 A 30 mA نوع A",
  "Panneau LED 60×60 36 W 4000 K": "لوحة LED 60×60 36 W 4000 K",
  "TeSys Vario – interrupteur 4P 63 A": "TeSys Vario — 4P 63 A",
  "Tube ICTA Ø20 mm (3 m)": "أنبوب ICTA Ø20 مم (3 م)",
  "Borne de recharge murale 7,4 kW": "محطة شحن جدارية 7.4 kW",
  "Point d'accès Wi-Fi 7 Omada": "نقطة وصول Wi-Fi 7 Omada",
};
const descAr = {
  "Conducteur rigide cuivre, pour mise à la terre et distribution.":
    "نحاس صلب — تأريض وتوزيع.",
  "Câble domestique et tertiaire, installation fixe.":
    "كابل منزلي — تركيب ثابت.",
  "Câble souple pour appareils et prolongations.":
    "كابل مرن — أجهزة وتمديدات.",
  "Réseau cuivre haut débit, blindé.": "شبكة نحاس عالية السرعة — معزول.",
  "Raccordement sans outil, levier ouvrir/fermer.":
    "توصيل بدون أدوات.",
  "iC60 ou équivalent, 1P+N.": "iC60 أو ما يعادله.",
  "Protection différentielle combinée.": "حماية تفاضلية.",
  "Dalle encastrée tertiaire, haute efficacité.":
    "لوحة LED مدمجة في السقف — كفاءة عالية.",
  "Interrupteur-sectionneur 4 pôles IP65.":
    "قاطع عزل 4 أقطاب IP65.",
  "Cheminement encastré ou apparent.": "تمديد مخفي أو ظاهر.",
  "E-mobilité résidentiel et tertiaire.": "شحن منزلي ومهني.",
  "Wi-Fi 7 professionnel avec gestion Omada.":
    "Wi-Fi 7 احترافي Omada.",
};
const specLabelAr = {
  Section: "المقطع",
  Couleur: "اللون",
  Conducteurs: "الموصلات",
  Type: "النوع",
  Catégorie: "الفئة",
  Entrées: "المداخل",
  Calibre: "السعة",
  Courbe: "المنحنى",
  Sensibilité: "الحساسية",
  Puissance: "القدرة",
  Pôles: "الأقطاب",
  Courant: "التيار",
  Diamètre: "القطر",
  Norme: "المعيار",
};

(d.products || []).forEach(function (prod) {
  prod.nameAr = productAr[prod.nameFr] || prod.nameAr || prod.nameFr;
  prod.descAr = descAr[prod.descFr] || prod.descFr;
  (prod.specs || []).forEach(function (sp) {
    sp.labelAr = specLabelAr[sp.labelFr] || sp.labelFr;
  });
});

// othmanShop hero alt
const photoAltAr = {
  "Matériel électrique pro": "مواد كهربائية احترافية",
  Câbles: "كوابل",
  Tableaux: "لوحات",
  Appareillage: "أجهزة تركيب",
  Éclairage: "إضاءة",
  Industrie: "صناعة",
};
(d.othmanShop.heroPhotos || []).forEach(function (ph) {
  ph.altAr = photoAltAr[ph.altFr] || ph.altFr;
});

d.othmanShop.subjectAr = "عثمان للكهرباء — متجر أونلاين";
d.othmanShop.headlineAr =
  "أول مورّد لمواد الكهرباء أونلاين في الجزائر";
d.othmanShop.hookAr = "لا حاجة للذهاب إلى الحميز.";
d.othmanShop.promiseAr =
  "تسجيل · قائمة مواد · تأكيد المورد · توصيل للورشة في نفس اليوم.";

d.categories = d.categories || {};
Object.keys(d.categories).forEach(function (k) {
  const c = d.categories[k];
  if (c && !c.labelAr) c.labelAr = c.labelFr;
});

d.i18n = {
  draftBannerFr: "⚠️ BROUILLON — Othman Electrique shop en ligne",
  draftBannerAr: "⚠️ مسودة — متجر عثمان للكهرباء أونلاين",
  topbarFr: "Othman Electrique — shop en ligne · Algérie",
  topbarAr: "عثمان للكهرباء — متجر أونلاين · الجزائر",
  footerFr: "© 2026 Othman Electrique",
  footerAr: "© 2026 عثمان للكهرباء",
  catalogueTitleFr: "Catalogue — Othman Electrique",
  catalogueTitleAr: "المنتجات — عثمان للكهرباء",
  draftCatalogueFr: "⚠️ BROUILLON — Catalogue produits",
  draftCatalogueAr: "⚠️ مسودة — قائمة المنتجات",
  draftProductFr: "⚠️ BROUILLON — Fiche produit",
  draftProductAr: "⚠️ مسودة — صفحة المنتج",
  productTitleFr: "Produit — Othman Electrique",
  productTitleAr: "منتج — عثمان للكهرباء",
  homeTitleFr: "Othman Electrique — Shop en ligne · Algérie",
  homeTitleAr: "عثمان للكهرباء — متجر أونلاين · الجزائر",
  unitPceFr: "pce",
  unitPceAr: "قطعة",
  unitMFr: "m",
  unitMAr: "م",
};

fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
console.log("Traductions AR complétées.");
