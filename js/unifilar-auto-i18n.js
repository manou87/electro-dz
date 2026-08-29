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
      'btn.regen': 'Regenerate',
      'btn.print': '🖨 Print',
      'btn.calc': 'Back to balance',
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
