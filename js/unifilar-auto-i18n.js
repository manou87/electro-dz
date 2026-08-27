(function () {
  var T = {
    fr: {
      'meta.title': 'Schéma unifilaire Electro DZ',
      'page.title': 'Schéma unifilaire Electro DZ',
      'page.lead':
        'Toutes les charges du bilan sur un schéma imprimable (fond blanc, textes noirs, libellés hors des fils).',
      'symbols.note':
        'Impression N/B A4 paysage + tableau détaillé des charges pour le dossier client.',
      'btn.regen': 'Regénérer',
      'btn.print': '🖨 Imprimer',
      'btn.calc': 'Retour bilan',
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
    },
    ar: {
      'meta.title': 'مخطط أحادي Electro DZ',
      'page.title': 'مخطط أحادي Electro DZ',
      'page.lead':
        'كل أحمال الموازنة على مخطط قابل للطباعة (خلفية بيضاء، نص أسود، تسميات بعيدة عن الأسلاك).',
      'symbols.note':
        'طباعة أبيض/أسود A4 أفقي + جدول تفصيلي للأحمال لملف الزبون.',
      'preview.loading': 'جاري تحميل المعاينة…',
      'btn.regen': 'إعادة التوليد',
      'btn.print': '🖨 طباعة',
      'btn.calc': 'العودة للموازنة',
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
    },
    en: {
      'meta.title': 'Single-line diagram Electro DZ',
      'page.title': 'Single-line diagram Electro DZ',
      'page.lead':
        'All power-balance loads on a printable diagram (white background, black text, labels clear of the wires).',
      'symbols.note':
        'B/W A4 landscape print + detailed load table for the client file.',
      'btn.regen': 'Regenerate',
      'btn.print': '🖨 Print',
      'btn.calc': 'Back to balance',
      'board': 'Board',
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
        'In ratings are indicative. Verify breakers, RCDs and cables on site before the client file.',
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
