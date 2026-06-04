(function () {
  var T = {
    fr: {
      'meta.title': 'Unifilaire auto — DZSWISS ELEC',
      'page.title': 'Schéma unifilaire (depuis le bilan)',
      'page.lead':
        'Génération assistée à partir du bilan de puissance : repères, calibres indicatifs et liaisons déjà tracées. Vérifiez sur site avant dossier final.',
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
        'Calibres In proposés à titre indicatif (Ib majoré, calibres normalisés). Ne remplace pas une note de calcul signée. Édition fine dans Schémas et plans.',
    },
    ar: {
      'meta.title': 'مخطط أحادي تلقائي — DZSWISS ELEC',
      'page.title': 'مخطط أحادي الخط (من موازنة القدرة)',
      'page.lead':
        'توليد مساعد من موازنة القدرة: مراجع، معاير إرشادية ووصلات مرسومة. تحقق على الموقع قبل الملف النهائي.',
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
        'معايير In إرشادية. لا تغني عن حساب موقّع. التعديل الدقيق في المخططات والرسوم.',
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
