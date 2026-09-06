(function () {
  var T = {
    fr: {
      'meta.title': 'Schéma unifilaire Electro DZ',
      'page.title': 'Schéma unifilaire Electro DZ',
      'page.lead':
        'Toutes les charges du bilan sur un schéma imprimable (fond blanc, textes noirs, libellés hors des fils).',
      'symbols.note':
        'Impression N/B A4 paysage + tableau détaillé des charges pour le dossier client.',
      'btn.demo': 'Démo villa',
      'btn.regen': 'Regénérer',
      'btn.print': '🖨 Imprimer',
      'btn.calc': 'Retour bilan',
      'legend.title': 'Légende',
      'legend.lead': 'Une seule légende — contacts, DDR et charges (même trait CAD que sur le schéma).',
      'legend.contacts': 'Contacts & disjoncteur',
      'legend.ddr': 'DDR / RCBO',
      'legend.iec': 'Planche IEC',
      'legend.charges': 'Charges',
      'legend.item.dj': 'Disjoncteur',
      'legend.item.ddr': 'DDR',
      'legend.item.rcbo': 'RCBO',
      'legend.item.no': 'Contact NO',
      'legend.item.nc': 'Contact NC',
      'legend.item.coil': 'Bobine',
      'legend.item.lamp': 'Éclairage',
      'legend.item.socket': 'Prise',
      'legend.item.heat': 'Chauffage',
      'legend.item.ecs': 'Chauffe-eau',
      'legend.item.cooker': 'Cuisinière',
      'legend.item.oven': 'Four',
      'legend.item.dishwasher': 'Lave-vaisselle',
      'legend.item.washing': 'Lave-linge',
      'legend.item.dryer': 'Sèche-linge',
      'legend.item.vmc': 'VMC',
      'legend.item.pump': 'Pompe',
      'legend.item.motor': 'Moteur',
      'legend.item.lift': 'Ascenseur',
      'legend.item.ev': 'Borne VE',
      'legend.item.weld': 'Poste à souder',
      'legend.item.special': 'Spécialisé',
      'demo.ok': 'Démo villa chargée (25 circuits, 4 tableaux).',
      'demo.err': 'Impossible de charger la démo villa.',
      'btn.save': 'Enregistrer',
      'btn.load': 'Charger',
      'btn.deleteSave': 'Supprimer',
      'saved.title': '📁 Mes unifilaires enregistrés',
      'saved.titleLocal': '📁 Mes unifilaires enregistrés (sur cet appareil)',
      'saved.pick': '— Choisir un unifilaire —',
      'save.prompt': 'Nom du schéma à enregistrer :',
      'save.defaultName': 'Unifilaire',
      'save.ok': 'Unifilaire enregistré sur votre compte : {name}',
      'save.okLocal': 'Unifilaire enregistré sur cet appareil : {name}',
      'save.needLogin':
        'Connectez-vous avec Google pour synchroniser vos unifilaires sur tous vos appareils.\n\nOK = se connecter\nAnnuler = enregistrer uniquement sur cet appareil',
      'save.needProject': 'Générez d’abord un schéma (depuis le bilan) avant d’enregistrer.',
      'save.errStorage': 'Stockage plein ou indisponible — libérez de l’espace navigateur.',
      'save.errCloud':
        'Impossible d’accéder au compte (connexion ou table unifilaires). Réessayez après connexion.',
      'load.pick': 'Choisissez un unifilaire dans la liste.',
      'load.ok': 'Unifilaire chargé : {name}',
      'load.err': 'Unifilaire introuvable.',
      'delete.confirm': 'Supprimer cet unifilaire enregistré ?',
      'delete.ok': 'Unifilaire supprimé.',
      'board': 'Tableau',
      'board.all': 'Tous les tableaux (toutes les charges)',
      'col.ref': 'Repère',
      'col.label': 'Désignation',
      'col.pd': 'Pd',
      'col.ib': 'Ib calc.',
      'col.in': 'In (A)',
      'empty.title': 'Aucun bilan chargé',
      'empty.lead': 'Calculez d’abord un bilan de puissance, puis cliquez « Schéma unifilaire Electro DZ ».',
      'empty.link': 'Aller aux calculs',
      'errGenerate': 'Impossible de générer : vérifiez les lignes du bilan (Pi > 0).',
      'disclaimer':
        'Calibres In indicatifs. Vérifiez calibres, DDR et câbles sur site avant dossier client.',
      'svg.mainSwitch': 'Coupure générale',
      'svg.outgoings': 'Départs',
      'svg.rcdGroup': 'IDR 30 mA',
      'svg.loads': 'charge(s)',
      'svg.aria': 'Schéma unifilaire Electro DZ',
      'svg.titlePrefix': 'Schéma unifilaire Electro DZ — ',
      'svg.dbFallback': 'TABLEAU',
      'print.detail': 'Détail des charges (bilan de puissance)',
      'print.col.room': 'Local',
      'print.col.rcd': 'DDR',
      'print.ref': 'Réf.',
      'print.client': 'Client',
      'print.disclaimer':
        'Document indicatif généré depuis le bilan de puissance Electro DZ. Vérifier calibres, DDR et sections sur site.',
    },
    ar: {
      'meta.title': 'مخطط أحادي Electro DZ',
      'page.title': 'مخطط أحادي Electro DZ',
      'page.lead':
        'كل أحمال الموازنة على مخطط قابل للطباعة (خلفية بيضاء، نص أسود، تسميات بعيدة عن الأسلاك).',
      'symbols.note':
        'طباعة أبيض/أسود A4 أفقي + جدول تفصيلي للأحمال لملف الزبون.',
      'preview.loading': 'جاري تحميل المعاينة…',
      'btn.demo': 'عرض تجريبي فيلا',
      'btn.regen': 'إعادة التوليد',
      'btn.print': '🖨 طباعة',
      'btn.calc': 'العودة للموازنة',
      'legend.title': 'المفتاح',
      'legend.lead': 'مفتاح واحد — ملامسات وDDR والأحمال بنفس سمك الخط.',
      'legend.contacts': 'ملامسات وقاطع',
      'legend.ddr': 'DDR / RCBO',
      'legend.iec': 'لوحة IEC',
      'legend.charges': 'الأحمال',
      'legend.item.dj': 'قاطع',
      'legend.item.ddr': 'DDR',
      'legend.item.rcbo': 'RCBO',
      'legend.item.no': 'ملامس NO',
      'legend.item.nc': 'ملامس NC',
      'legend.item.coil': 'ملف',
      'legend.item.lamp': 'إضاءة',
      'legend.item.socket': 'مقبس',
      'legend.item.heat': 'تدفئة',
      'legend.item.ecs': 'سخان ماء',
      'legend.item.cooker': 'موقد',
      'legend.item.oven': 'فرن',
      'legend.item.dishwasher': 'غسالة صحون',
      'legend.item.washing': 'غسالة ملابس',
      'legend.item.dryer': 'مجفف',
      'legend.item.vmc': 'تهوية',
      'legend.item.pump': 'مضخة',
      'legend.item.motor': 'محرك',
      'legend.item.lift': 'مصعد',
      'legend.item.ev': 'شاحن سيارة',
      'legend.item.weld': 'لحام',
      'legend.item.special': 'خاص',
      'demo.ok': 'تم تحميل عرض الفيلا (25 دائرة، 4 لوحات).',
      'demo.err': 'تعذّر تحميل العرض التجريبي.',
      'btn.save': 'حفظ',
      'btn.load': 'تحميل',
      'btn.deleteSave': 'حذف',
      'saved.title': '📁 مخططاتي الأحادية المحفوظة',
      'saved.titleLocal': '📁 مخططاتي الأحادية المحفوظة (على هذا الجهاز)',
      'saved.pick': '— اختر مخططاً أحادياً —',
      'save.prompt': 'اسم المخطط للحفظ:',
      'save.defaultName': 'مخطط أحادي',
      'save.ok': 'تم حفظ المخطط على حسابك: {name}',
      'save.okLocal': 'تم حفظ المخطط على هذا الجهاز: {name}',
      'save.needLogin':
        'سجّل الدخول عبر Google لمزامنة مخططاتك الأحادية على كل أجهزتك.\n\nموافق = تسجيل الدخول\nإلغاء = الحفظ على هذا الجهاز فقط',
      'save.needProject': 'أنشئ أولاً مخططاً (من الموازنة) قبل الحفظ.',
      'save.errStorage': 'التخزين ممتلئ أو غير متاح — حرّر مساحة المتصفح.',
      'save.errCloud':
        'تعذّر الوصول إلى الحساب (اتصال أو جدول المخططات). أعد المحاولة بعد تسجيل الدخول.',
      'load.pick': 'اختر مخططاً أحادياً من القائمة.',
      'load.ok': 'تم تحميل المخطط: {name}',
      'load.err': 'المخطط غير موجود.',
      'delete.confirm': 'حذف هذا المخطط المحفوظ؟',
      'delete.ok': 'تم حذف المخطط.',
      'board': 'لوحة',
      'board.all': 'كل اللوحات (كل الأحمال)',
      'col.ref': 'مرجع',
      'col.label': 'التسمية',
      'col.pd': 'Pd',
      'col.ib': 'Ib محسوب',
      'col.in': 'In (A)',
      'empty.title': 'لا توجد موازنة',
      'empty.lead': 'احسب موازنة القدرة ثم « مخطط أحادي Electro DZ ».',
      'empty.link': 'الحسابات',
      'errGenerate': 'تعذّر التوليد: تحقق من سطور الموازنة (Pi > 0).',
      'disclaimer':
        'قيم In إرشادية. تحقق من القواطع والـ DDR والكابلات في الموقع قبل ملف الزبون.',
      'svg.mainSwitch': 'قاطع عام',
      'svg.outgoings': 'دوائر خارجة',
      'svg.rcdGroup': 'IDR 30 mA',
      'svg.loads': 'حمل(أحمال)',
      'svg.aria': 'مخطط أحادي Electro DZ',
      'svg.titlePrefix': 'مخطط أحادي Electro DZ — ',
      'svg.dbFallback': 'لوحة',
      'print.detail': 'تفصيل الأحمال (موازنة القدرة)',
      'print.col.room': 'المحل',
      'print.col.rcd': 'DDR',
      'print.ref': 'مرجع',
      'print.client': 'الزبون',
      'print.disclaimer':
        'وثيقة إرشادية مولَّدة من موازنة القدرة Electro DZ. تحقق من القواطع والـ DDR والمقاطع في الموقع.',
    },
    en: {
      'meta.title': 'Single-line diagram Electro DZ',
      'page.title': 'Single-line diagram Electro DZ',
      'page.lead':
        'All power-balance loads on a printable diagram (white background, black text, labels clear of the wires).',
      'symbols.note':
        'B/W A4 landscape print + detailed load table for the client file.',
      'preview.loading': 'Loading preview…',
      'btn.demo': 'Villa demo',
      'btn.regen': 'Regenerate',
      'btn.print': '🖨 Print',
      'btn.calc': 'Back to balance',
      'legend.title': 'Legend',
      'legend.lead': 'One legend — contacts, RCD and loads (same CAD stroke as on the diagram).',
      'legend.contacts': 'Contacts & breaker',
      'legend.ddr': 'RCD / RCBO',
      'legend.iec': 'IEC sheet',
      'legend.charges': 'Loads',
      'legend.item.dj': 'Breaker',
      'legend.item.ddr': 'RCD',
      'legend.item.rcbo': 'RCBO',
      'legend.item.no': 'NO contact',
      'legend.item.nc': 'NC contact',
      'legend.item.coil': 'Coil',
      'legend.item.lamp': 'Lighting',
      'legend.item.socket': 'Socket',
      'legend.item.heat': 'Heating',
      'legend.item.ecs': 'Water heater',
      'legend.item.cooker': 'Cooker',
      'legend.item.oven': 'Oven',
      'legend.item.dishwasher': 'Dishwasher',
      'legend.item.washing': 'Washing machine',
      'legend.item.dryer': 'Dryer',
      'legend.item.vmc': 'Ventilation',
      'legend.item.pump': 'Pump',
      'legend.item.motor': 'Motor',
      'legend.item.lift': 'Lift',
      'legend.item.ev': 'EV charger',
      'legend.item.weld': 'Welding',
      'legend.item.special': 'Specialty',
      'demo.ok': 'Villa demo loaded (25 circuits, 4 boards).',
      'demo.err': 'Could not load the villa demo.',
      'btn.save': 'Save',
      'btn.load': 'Load',
      'btn.deleteSave': 'Delete',
      'saved.title': '📁 My saved single-line diagrams',
      'saved.titleLocal': '📁 My saved single-line diagrams (on this device)',
      'saved.pick': '— Choose a diagram —',
      'save.prompt': 'Name for this diagram:',
      'save.defaultName': 'Single-line',
      'save.ok': 'Diagram saved to your account: {name}',
      'save.okLocal': 'Diagram saved on this device: {name}',
      'save.needLogin':
        'Sign in with Google to sync your single-line diagrams across devices.\n\nOK = sign in\nCancel = save on this device only',
      'save.needProject': 'Generate a diagram (from the power balance) before saving.',
      'save.errStorage': 'Storage full or unavailable — free some browser space.',
      'save.errCloud':
        'Cannot reach your account (sign-in or unifilar table). Try again after signing in.',
      'load.pick': 'Choose a diagram from the list.',
      'load.ok': 'Diagram loaded: {name}',
      'load.err': 'Diagram not found.',
      'delete.confirm': 'Delete this saved diagram?',
      'delete.ok': 'Diagram deleted.',
      'board': 'Distribution board',
      'board.all': 'All boards (all loads)',
      'col.ref': 'Ref.',
      'col.label': 'Designation',
      'col.pd': 'Pd',
      'col.ib': 'Ib calc.',
      'col.in': 'In (A)',
      'empty.title': 'No power balance loaded',
      'empty.lead': 'First run a power balance, then open “Single-line diagram Electro DZ”.',
      'empty.link': 'Go to calculations',
      'errGenerate': 'Could not generate: check balance rows (Pi > 0).',
      'disclaimer':
        'In ratings are indicative. Verify circuit-breakers, RCDs and cables on site before the client file.',
      'svg.mainSwitch': 'Main incoming device',
      'svg.outgoings': 'Outgoing circuits',
      'svg.rcdGroup': 'RCCB 30 mA',
      'svg.loads': 'load(s)',
      'svg.aria': 'Single-line diagram Electro DZ',
      'svg.titlePrefix': 'Single-line diagram Electro DZ — ',
      'svg.dbFallback': 'DB',
      'print.detail': 'Load schedule (power balance)',
      'print.col.room': 'Location',
      'print.col.rcd': 'RCD',
      'print.ref': 'Ref.',
      'print.client': 'Client',
      'print.disclaimer':
        'Indicative document generated from the Electro DZ power balance. Verify ratings, RCDs and conductor sizes on site.',
    },
  };

  var lang = 'fr';
  try {
    var saved = localStorage.getItem('electrodz-site-lang');
    if (saved === 'ar' || saved === 'en' || saved === 'fr') lang = saved;
  } catch (e) {}

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('meta.title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function setLang(next) {
    if (next !== 'fr' && next !== 'ar' && next !== 'en') return;
    lang = next;
    try {
      localStorage.setItem('electrodz-site-lang', lang);
    } catch (e) {}
    apply();
    window.UnifilarAutoI18n = { t: t, lang: lang, setLang: setLang };
    document.dispatchEvent(
      new CustomEvent('electrodz-lang-changed', { detail: { lang: lang } })
    );
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang'));
    });
  });

  apply();
  window.UnifilarAutoI18n = { t: t, lang: lang, setLang: setLang };
})();
