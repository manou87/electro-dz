(function () {
  var T = {
    fr: {
      'meta.title': 'Unifilaire auto — DZSWISS ELEC',
      'page.title': 'Schéma unifilaire (depuis le bilan)',
      'page.lead':
        'Barre horizontale, source L1/L2/L3/N/PE (ou L/N), protections détaillées (In, courbe, Ib, DDR) et icône réelle par charge en bas de chaque départ.',
      'symbols.note':
        'Lave-linge, lampe, moteur, prises… — icônes dédiées. Sans marque constructeur. Édition dans Schémas et plans.',
      'preview.loading': 'Chargement de l’aperçu diagrams.net…',
      'btn.regen': 'Regénérer',
      'btn.editor': 'Ouvrir dans l’éditeur',
      'btn.print': 'Imprimer',
      'btn.calc': 'Retour bilan',
      'board': 'Tableau',
      'col.ref': 'Repère',
      'col.label': 'Désignation',
      'col.pd': 'Pd',
      'col.ib': 'Ib calc.',
      'col.in': 'In (A)',
      'empty.title': 'Aucun bilan chargé',
      'empty.lead': 'Calculez d’abord un bilan de puissance, puis cliquez « Générer unifilaire ».',
      'empty.link': 'Aller aux calculs',
      'errGenerate': 'Impossible de générer : vérifiez les lignes du bilan (Pi > 0).',
      'disclaimer':
        'Calibres In indicatifs. Le schéma utilise diagrams.net (open source) — vérifiez calibres, DDR et câbles sur site avant dossier.',
    },
    ar: {
      'meta.title': 'مخطط أحادي تلقائي — DZSWISS ELEC',
      'page.title': 'مخطط أحادي الخط (من موازنة القدرة)',
      'page.lead':
        'وضع تلقائي للدوائر بمراجع و In إرشادي مع رموز IEC من diagrams.net.',
      'symbols.note':
        'رموز: مكتبة Électrique (قاطع، منصهر، DDR، مصدر AC…). التحرير الكامل في المخططات والرسوم.',
      'preview.loading': 'جاري تحميل المعاينة…',
      'btn.regen': 'إعادة التوليد',
      'btn.editor': 'فتح في المحرر',
      'btn.print': 'طباعة',
      'btn.calc': 'العودة للموازنة',
      'board': 'لوحة',
      'col.ref': 'مرجع',
      'col.label': 'التسمية',
      'col.pd': 'Pd',
      'col.ib': 'Ib محسوب',
      'col.in': 'In (A)',
      'empty.title': 'لا توجد موازنة',
      'empty.lead': 'احسب موازنة القدرة ثم « توليد المخطط ».',
      'empty.link': 'الحسابات',
      'errGenerate': 'تعذّر التوليد: تحقق من سطور الموازنة (Pi > 0).',
      'disclaimer':
        'معايير In إرشادية. المخطط عبر diagrams.net — تحقق على الموقع قبل الملف.',
    },
  };

  var lang = 'fr';
  try {
    lang = localStorage.getItem('electrodz-site-lang') === 'ar' ? 'ar' : 'fr';
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
  }

  apply();
  window.UnifilarAutoI18n = { t: t, lang: lang };
})();
