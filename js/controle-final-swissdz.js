(function () {
  'use strict';

  var STORAGE_KEY = 'electrodz-controle-final';
  var COMPANY_KEY = 'user_company_info';
  var LANG_KEY = 'electrodz-site-lang';
  var BILINGUAL_KEY = 'electrodz-pep-bilingual';
  var ROW_COUNT = 14;
  var layout = null;
  var saveTimer = null;

  var T = {
    fr: {
      title: 'Contrôle final SwissDZ',
      subtitle:
        'Contrôle final obligatoire des installations électriques — protocole de mesures, rapport professionnel et export PDF. Outil SwissDZ pour électriciens en Algérie.',
      btnPrint: 'Imprimer',
      btnPdf: 'PDF officiel',
      btnClear: 'Effacer',
      saved: 'Enregistré',
      cleared: 'Formulaire effacé',
      confirmClear: 'Effacer tout le formulaire ?',
      logoTitle: 'Logo entreprise (impression)',
      logoHint: "Même stockage que la section Devis — logo rond sur l'impression.",
      logoChoose: 'Choisir un logo',
      logoRemove: 'Supprimer',
      logoShow: "Afficher le logo à l'impression",
      headerTitle: 'En-tête',
      measuresTitle: 'Mesures (14 lignes)',
      tableScrollHint: '← Faire défiler horizontalement pour voir toutes les colonnes →',
      footerTitle: 'Pied de page',
      verificationInitiale: 'Vérification initiale',
      controleApresReparation: 'Contrôle après réparation',
      objetPeriode: 'Objet / Période',
      instruments: 'Instruments de mesure utilisés',
      titulaire: 'Titulaire (entreprise)',
      porteur: "Porteur de l'autorisation",
      noAutorisation: "N° d'autorisation",
      numeroPage: 'Numéro de page',
      descriptionInstallation: "Adresse et description succincte des travaux / de l'installation",
      executeurNom: 'Exécuteur — Nom',
      executeurDateSignature: 'Exécuteur — Date / Signature',
      organeEntreprise: 'Organe de contrôle — Entreprise / Tampon',
      organeDateSignature: 'Organe — Date / Signature',
      colNum: 'N°',
      colObj: 'Objet',
      colType: 'Type',
      colInMagn: 'IN magn.',
      colInTherm: 'IN therm.',
      colVisuel: 'Visuel',
      colRpe: 'RPE/RLOW',
      colRiso: 'Riso',
      colIdiff: 'Idiff',
      colIccLpe: 'Icc L-PE',
      colIccLn: 'Icc L-N',
      colDdrIn: 'IN DDR',
      colIdn: 'IΔN',
      colTestT: 't [ms]',
      colChamp: 'Champ',
      colU: 'U [V]',
      colParaphePort: 'Port./Date',
      colParapheInsp: 'Insp./Date',
      footer:
        'Contrôle final SwissDZ — outil pédagogique OIBT / NIV. Toute installation réelle doit être vérifiée par un inspecteur habilité.',
      printTitle: 'Contrôle final SwissDZ — Protocole EP 2018',
      printFooterApp: 'Généré avec SwissDZ',
      pdfErr: 'Impossible de générer le PDF officiel.',
      popupBlocked: 'Popup bloquée — autorisez les fenêtres pour imprimer.',
      bilingualToggle: 'Bilingue FR / AR (formulaire)',
      earthTitle: 'Mise à la terre',
      resistanceTerre: 'Résistance de mise à la terre (Ω)',
      methodeMesure: 'Méthode de mesure',
      methode3fils: '3 fils (méthode de Wenner)',
      methode2fils: '2 fils',
      methodePince: 'Pince ampèremétrique',
      methodeAutre: 'Autre méthode',
      methodePlaceholder: '— Choisir —',
    },
    en: {
      title: 'SwissDZ Final Inspection',
      subtitle:
        'Mandatory final inspection of electrical installations — measurement protocol, professional report and PDF export. SwissDZ tool for electricians in Algeria.',
      btnPrint: 'Print',
      btnPdf: 'Official PDF',
      btnClear: 'Clear',
      saved: 'Saved',
      cleared: 'Form cleared',
      confirmClear: 'Clear the entire form?',
      logoTitle: 'Company logo (print)',
      logoHint: 'Same storage as Quotes — round logo on printout.',
      logoChoose: 'Choose logo',
      logoRemove: 'Remove',
      logoShow: 'Show logo on printout',
      headerTitle: 'Header',
      measuresTitle: 'Measurements (14 rows)',
      tableScrollHint: '← Scroll horizontally to see all columns →',
      footerTitle: 'Footer',
      verificationInitiale: 'Initial verification',
      controleApresReparation: 'Post-repair inspection',
      objetPeriode: 'Subject / Period',
      instruments: 'Measuring instruments used',
      titulaire: 'Company holder',
      porteur: 'Authorization holder',
      noAutorisation: 'Authorization no.',
      numeroPage: 'Page number',
      descriptionInstallation: 'Address and brief description of works / installation',
      executeurNom: 'Installer — Name',
      executeurDateSignature: 'Installer — Date / Signature',
      organeEntreprise: 'Control body — Company / Stamp',
      organeDateSignature: 'Control body — Date / Signature',
      colNum: 'No.',
      colObj: 'Object',
      colType: 'Type',
      colInMagn: 'IN mag.',
      colInTherm: 'IN therm.',
      colVisuel: 'Visual',
      colRpe: 'RPE/RLOW',
      colRiso: 'Riso',
      colIdiff: 'Idiff',
      colIccLpe: 'Icc L-PE',
      colIccLn: 'Icc L-N',
      colDdrIn: 'RCD IN',
      colIdn: 'IΔN',
      colTestT: 't [ms]',
      colChamp: 'Rot.',
      colU: 'U [V]',
      colParaphePort: 'Auth./Date',
      colParapheInsp: 'Insp./Date',
      footer:
        'SwissDZ Final Inspection — OIBT / NIV training tool. Any live installation must be verified by a qualified inspector.',
      printTitle: 'SwissDZ Final Inspection — EP 2018 Protocol',
      printFooterApp: 'Generated with SwissDZ',
      pdfErr: 'Could not generate the official PDF.',
      popupBlocked: 'Popup blocked — allow popups to print.',
      bilingualToggle: 'Bilingual FR / AR (form)',
      earthTitle: 'Earthing',
      resistanceTerre: 'Earth grounding resistance (Ω)',
      methodeMesure: 'Measurement method',
      methode3fils: '3-wire (Wenner method)',
      methode2fils: '2-wire',
      methodePince: 'Clamp meter',
      methodeAutre: 'Other method',
      methodePlaceholder: '— Select —',
    },
    ar: {
      title: 'الفحص النهائي SwissDZ',
      subtitle:
        'الفحص النهائي الإلزامي للمنشآت الكهربائية — بروتوكول القياسات، تقرير مهني وتصدير PDF. أداة SwissDZ للكهربائيين في الجزائر.',
      btnPrint: 'طباعة',
      btnPdf: 'PDF رسمي',
      btnClear: 'مسح',
      saved: 'تم الحفظ',
      cleared: 'تم مسح النموذج',
      confirmClear: 'مسح النموذج بالكامل؟',
      logoTitle: 'شعار الشركة (الطباعة)',
      logoHint: 'نفس التخزين كقسم عروض الأسعار — شعار دائري على الطباعة.',
      logoChoose: 'اختيار شعار',
      logoRemove: 'حذف',
      logoShow: 'إظهار الشعار عند الطباعة',
      headerTitle: 'الترويسة',
      measuresTitle: 'القياسات (14 سطراً)',
      tableScrollHint: '← مرّر أفقياً لعرض جميع الأعمدة →',
      footerTitle: 'التذييل',
      verificationInitiale: 'فحص أولي',
      controleApresReparation: 'فحص بعد الإصلاح',
      objetPeriode: 'الموضوع / الفترة',
      instruments: 'أجهزة القياس المستخدمة',
      titulaire: 'صاحب الشركة',
      porteur: 'حامل الترخيص',
      noAutorisation: 'رقم الترخيص',
      numeroPage: 'رقم الصفحة',
      descriptionInstallation: 'العنوان ووصف مختصر للأعمال / التركيب',
      executeurNom: 'المنفّذ — الاسم',
      executeurDateSignature: 'المنفّذ — التاريخ / التوقيع',
      organeEntreprise: 'جهة المراقبة — الشركة / الختم',
      organeDateSignature: 'جهة المراقبة — التاريخ / التوقيع',
      colNum: 'رقم',
      colObj: 'الموضوع',
      colType: 'النوع',
      colInMagn: 'IN مغن.',
      colInTherm: 'IN حراري',
      colVisuel: 'بصري',
      colRpe: 'RPE/RLOW',
      colRiso: 'Riso',
      colIdiff: 'Idiff',
      colIccLpe: 'Icc L-PE',
      colIccLn: 'Icc L-N',
      colDdrIn: 'IN DDR',
      colIdn: 'IΔN',
      colTestT: 't [ms]',
      colChamp: 'دوران',
      colU: 'U [V]',
      colParaphePort: 'مرخّص/تاريخ',
      colParapheInsp: 'مفتش/تاريخ',
      footer:
        'الفحص النهائي SwissDZ — أداة تعليمية OIBT / NIV. أي تركيب حقيقي يجب أن يتحقق منه مفتش مؤهل.',
      printTitle: 'الفحص النهائي SwissDZ — بروتوكول EP 2018',
      printFooterApp: 'أُنشئ بواسطة SwissDZ',
      pdfErr: 'تعذّر إنشاء PDF الرسمي.',
      popupBlocked: 'تم حظر النافذة — اسمح بالنوافذ المنبثقة للطباعة.',
      bilingualToggle: 'ثنائي اللغة FR / AR (النموذج)',
      earthTitle: 'التأريض',
      resistanceTerre: 'مقاومة التأريض (Ω)',
      methodeMesure: 'طريقة القياس',
      methode3fils: '3 أسلاك (طريقة وينر)',
      methode2fils: 'سلكان',
      methodePince: 'مقياس ملزمة (كماشة)',
      methodeAutre: 'طريقة أخرى',
      methodePlaceholder: '— اختر —',
    },
  };

  var METHODE_OPTIONS = [
    { value: '', key: 'methodePlaceholder' },
    { value: '3fils', key: 'methode3fils' },
    { value: '2fils', key: 'methode2fils' },
    { value: 'pince', key: 'methodePince' },
    { value: 'autre', key: 'methodeAutre' },
  ];

  function lang() {
    try {
      var l = localStorage.getItem(LANG_KEY) || 'fr';
      return l === 'fr' || l === 'en' || l === 'ar' ? l : 'fr';
    } catch (_) {
      return 'fr';
    }
  }

  function tr(k) {
    return (T[lang()] && T[lang()][k]) || T.fr[k] || k;
  }

  function trFr(k) {
    return T.fr[k] || k;
  }

  function trAr(k) {
    return T.ar[k] || T.fr[k] || k;
  }

  function isBilingual() {
    if (lang() === 'ar') return true;
    try {
      var stored = localStorage.getItem(BILINGUAL_KEY);
      if (stored === null) return true;
      return stored === '1';
    } catch (_) {
      return true;
    }
  }

  function setBilingual(on) {
    try {
      localStorage.setItem(BILINGUAL_KEY, on ? '1' : '0');
    } catch (_) {}
  }

  function labelHtml(key) {
    if (isBilingual()) {
      return (
        '<span class="pep-label-fr">' +
        esc(trFr(key)) +
        '</span><span class="pep-label-ar" dir="rtl" lang="ar">' +
        esc(trAr(key)) +
        '</span>'
      );
    }
    return esc(tr(key));
  }

  function printLabelHtml(key) {
    if (isBilingual()) {
      return (
        '<strong><span class="pep-label-fr">' +
        esc(trFr(key)) +
        '</span><br><span class="pep-label-ar" dir="rtl" lang="ar" style="font-size:0.85em;font-weight:600">' +
        esc(trAr(key)) +
        '</span></strong>'
      );
    }
    return '<strong>' + esc(tr(key)) + '</strong>';
  }

  function methodeLabel(value) {
    if (!value) return '';
    for (var i = 0; i < METHODE_OPTIONS.length; i++) {
      if (METHODE_OPTIONS[i].value === value) return tr(METHODE_OPTIONS[i].key);
    }
    return value;
  }

  function methodeLabelBilingual(value) {
    if (!value) return '';
    for (var i = 0; i < METHODE_OPTIONS.length; i++) {
      if (METHODE_OPTIONS[i].value === value) {
        var opt = METHODE_OPTIONS[i];
        if (isBilingual()) {
          return esc(trFr(opt.key)) + ' / ' + esc(trAr(opt.key));
        }
        return tr(opt.key);
      }
    }
    return value;
  }

  function methodeLabelFr(value) {
    if (!value) return '';
    for (var i = 0; i < METHODE_OPTIONS.length; i++) {
      if (METHODE_OPTIONS[i].value === value) return trFr(METHODE_OPTIONS[i].key);
    }
    return value;
  }

  function printTh(key) {
    if (isBilingual()) {
      return (
        '<span class="pep-label-fr">' +
        esc(trFr(key)) +
        '</span><span class="pep-label-ar" dir="rtl" lang="ar">' +
        esc(trAr(key)) +
        '</span>'
      );
    }
    return esc(tr(key));
  }

  function buildMethodeSelect(selected) {
    var sel = document.getElementById('methodeMesure');
    if (!sel) return;
    var cur = selected != null ? selected : sel.value;
    sel.innerHTML = METHODE_OPTIONS.map(function (opt) {
      return (
        '<option value="' +
        esc(opt.value) +
        '"' +
        (cur === opt.value ? ' selected' : '') +
        '>' +
        esc(tr(opt.key)) +
        '</option>'
      );
    }).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function textCellHtml(rowIndex, field) {
    var cls = 'pep-cell-input' + (field === 'objet' ? ' pep-cell-obj' : '');
    return (
      '<td><textarea class="' +
      cls +
      '" rows="1" name="rows.' +
      rowIndex +
      '.' +
      field +
      '"></textarea></td>'
    );
  }

  function buildRows() {
    var tbody = document.getElementById('pep-rows');
    if (!tbody) return;
    var html = '';
    for (var r = 0; r < ROW_COUNT; r++) {
      html +=
        '<tr data-row="' +
        r +
        '">' +
        textCellHtml(r, 'numero') +
        textCellHtml(r, 'objet') +
        textCellHtml(r, 'typeCaract') +
        textCellHtml(r, 'inMagn') +
        textCellHtml(r, 'inTherm') +
        '<td style="text-align:center"><input type="checkbox" name="rows.' +
        r +
        '.visuel" /></td>' +
        textCellHtml(r, 'rpe') +
        textCellHtml(r, 'riso') +
        textCellHtml(r, 'idiff') +
        textCellHtml(r, 'iccLpe') +
        textCellHtml(r, 'iccLn') +
        textCellHtml(r, 'ddrIn') +
        textCellHtml(r, 'idn') +
        textCellHtml(r, 'testT') +
        '<td style="text-align:center"><input type="checkbox" name="rows.' +
        r +
        '.champOk" /></td>' +
        textCellHtml(r, 'tensionU') +
        textCellHtml(r, 'paraphePort') +
        textCellHtml(r, 'parapheInsp') +
        '</tr>';
    }
    tbody.innerHTML = html;
    setupCellInputs(tbody);
  }

  function autoGrowCell(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 18) + 'px';
  }

  function fitCellFont(el) {
    if (!el) return;
    var maxRem = 0.72;
    var minRem = 0.5;
    var len = (el.value || '').length;
    var width = el.clientWidth || 44;
    var density = len / Math.max(width, 1);
    var size = maxRem;
    if (density > 0.35) size = 0.65;
    if (density > 0.55) size = 0.58;
    if (density > 0.75) size = 0.52;
    if (density > 1) size = minRem;
    el.style.fontSize = size + 'rem';
    autoGrowCell(el);
  }

  function setupCellInputs(root) {
    var scope = root || document;
    scope.querySelectorAll('.pep-cell-input').forEach(function (el) {
      if (el.dataset.pepCellBound) return;
      el.dataset.pepCellBound = '1';
      var onChange = function () {
        fitCellFont(el);
      };
      el.addEventListener('input', onChange);
      fitCellFont(el);
    });
  }

  function printCellClass(value) {
    var len = String(value || '').length;
    if (len > 48) return 'cell-long';
    if (len > 24) return 'cell-med';
    return '';
  }

  function printCell(value) {
    var cls = printCellClass(value);
    return '<td class="' + cls + '">' + esc(value).replace(/\n/g, '<br>') + '</td>';
  }

  function emptyRow() {
    return {
      numero: '',
      objet: '',
      typeCaract: '',
      inMagn: '',
      inTherm: '',
      visuel: false,
      rpe: '',
      riso: '',
      idiff: '',
      iccLpe: '',
      iccLn: '',
      ddrIn: '',
      idn: '',
      testT: '',
      champOk: false,
      tensionU: '',
      paraphePort: '',
      parapheInsp: '',
    };
  }

  function defaultState() {
    var rows = [];
    for (var i = 0; i < ROW_COUNT; i++) rows.push(emptyRow());
    return {
      verificationInitiale: false,
      controleApresReparation: false,
      objetPeriode: '',
      instruments: '',
      titulaire: '',
      porteur: '',
      noAutorisation: '',
      numeroPage: '1',
      descriptionInstallation: '',
      resistanceTerre: '',
      methodeMesure: '',
      rows: rows,
      executeurNom: '',
      executeurDateSignature: '',
      organeEntreprise: '',
      organeDateSignature: '',
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var d = JSON.parse(raw);
      if (!d.rows || d.rows.length !== ROW_COUNT) {
        var base = defaultState();
        if (d.rows) {
          for (var i = 0; i < Math.min(d.rows.length, ROW_COUNT); i++) {
            base.rows[i] = Object.assign(emptyRow(), d.rows[i]);
          }
        }
        return Object.assign(base, d, { rows: base.rows });
      }
      return Object.assign(defaultState(), d);
    } catch (_) {
      return defaultState();
    }
  }

  function saveState(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function loadCompany() {
    try {
      var raw = localStorage.getItem(COMPANY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveCompany(data) {
    try {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function resizeLogoToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('read'));
      };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () {
          reject(new Error('img'));
        };
        img.onload = function () {
          var size = 224;
          var canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext('2d');
          var min = Math.min(img.width, img.height);
          var sx = (img.width - min) / 2;
          var sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function updateLogoPreview(dataUrl) {
    var preview = document.getElementById('pep-logo-preview');
    var removeBtn = document.getElementById('pep-logo-remove');
    if (!preview) return;
    if (dataUrl) {
      preview.src = dataUrl;
      preview.classList.add('visible');
      if (removeBtn) removeBtn.classList.remove('hidden');
    } else {
      preview.removeAttribute('src');
      preview.classList.remove('visible');
      if (removeBtn) removeBtn.classList.add('hidden');
    }
  }

  function hasLogo(co) {
    var show = document.getElementById('pep-show-logo');
    return !!(co.logoDataUrl && show && show.checked);
  }

  function readForm() {
    var form = document.getElementById('pep-form');
    var data = defaultState();
    if (!form) return data;

    var boolFields = ['verificationInitiale', 'controleApresReparation'];
    boolFields.forEach(function (name) {
      var el = form.elements[name];
      data[name] = !!(el && el.checked);
    });

    [
      'objetPeriode',
      'instruments',
      'titulaire',
      'porteur',
      'noAutorisation',
      'numeroPage',
      'descriptionInstallation',
      'resistanceTerre',
      'methodeMesure',
      'executeurNom',
      'executeurDateSignature',
      'organeEntreprise',
      'organeDateSignature',
    ].forEach(function (name) {
      var el = form.elements[name];
      data[name] = el ? String(el.value || '').trim() : '';
    });

    var tbody = document.getElementById('pep-rows');
    if (tbody) {
      for (var i = 0; i < ROW_COUNT; i++) {
        var row = emptyRow();
        var fields = [
          'numero',
          'objet',
          'typeCaract',
          'inMagn',
          'inTherm',
          'rpe',
          'riso',
          'idiff',
          'iccLpe',
          'iccLn',
          'ddrIn',
          'idn',
          'testT',
          'tensionU',
          'paraphePort',
          'parapheInsp',
        ];
        fields.forEach(function (f) {
          var el = tbody.querySelector('[name="rows.' + i + '.' + f + '"]');
          row[f] = el ? String(el.value || '').trim() : '';
        });
        var vis = tbody.querySelector('[name="rows.' + i + '.visuel"]');
        var champ = tbody.querySelector('[name="rows.' + i + '.champOk"]');
        row.visuel = !!(vis && vis.checked);
        row.champOk = !!(champ && champ.checked);
        data.rows[i] = row;
      }
    }
    return data;
  }

  function fillForm(data) {
    var form = document.getElementById('pep-form');
    if (!form) return;

    var boolFields = ['verificationInitiale', 'controleApresReparation'];
    boolFields.forEach(function (name) {
      var el = form.elements[name];
      if (el) el.checked = !!data[name];
    });

    [
      'objetPeriode',
      'instruments',
      'titulaire',
      'porteur',
      'noAutorisation',
      'numeroPage',
      'descriptionInstallation',
      'resistanceTerre',
      'methodeMesure',
      'executeurNom',
      'executeurDateSignature',
      'organeEntreprise',
      'organeDateSignature',
    ].forEach(function (name) {
      var el = form.elements[name];
      if (el) el.value = data[name] || '';
    });
    buildMethodeSelect(data.methodeMesure || '');

    var tbody = document.getElementById('pep-rows');
    if (!tbody) return;
    for (var i = 0; i < ROW_COUNT; i++) {
      var row = data.rows[i] || emptyRow();
      var fields = [
        'numero',
        'objet',
        'typeCaract',
        'inMagn',
        'inTherm',
        'rpe',
        'riso',
        'idiff',
        'iccLpe',
        'iccLn',
        'ddrIn',
        'idn',
        'testT',
        'tensionU',
        'paraphePort',
        'parapheInsp',
      ];
      fields.forEach(function (f) {
        var el = tbody.querySelector('[name="rows.' + i + '.' + f + '"]');
        if (el) el.value = row[f] || '';
      });
      var vis = tbody.querySelector('[name="rows.' + i + '.visuel"]');
      var champ = tbody.querySelector('[name="rows.' + i + '.champOk"]');
      if (vis) vis.checked = !!row.visuel;
      if (champ) champ.checked = !!row.champOk;
    }
    setupCellInputs(tbody);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveState(readForm());
      var st = document.getElementById('save-status');
      if (st) {
        st.textContent = tr('saved');
        setTimeout(function () {
          if (st.textContent === tr('saved')) st.textContent = '';
        }, 1500);
      }
    }, 400);
  }

  function syncCompanyFromUi() {
    var co = loadCompany();
    var show = document.getElementById('pep-show-logo');
    co.showLogoOnDevis = !!(show && show.checked && co.logoDataUrl);
    saveCompany(co);
  }

  function applyI18n() {
    document.documentElement.lang = lang();
    document.documentElement.dir = lang() === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('pep-bilingual', isBilingual());
    document.title = tr('title') + ' | Electro DZ';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = tr('subtitle');
    var paper = document.querySelector('.pep-paper');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!k) return;
      var inPaper = paper && paper.contains(el);
      var useBilingual = inPaper && isBilingual();
      if (useBilingual && (el.tagName === 'LABEL' || el.tagName === 'TH' || el.tagName === 'H2')) {
        el.innerHTML = labelHtml(k);
        return;
      }
      if (useBilingual && el.tagName === 'SPAN' && el.closest('.pep-checks')) {
        el.innerHTML = labelHtml(k);
        return;
      }
      if (tr(k)) el.textContent = tr(k);
    });
    document.querySelectorAll('[data-i18n-href-fr]').forEach(function (el) {
      el.href = lang() === 'ar' ? el.getAttribute('data-i18n-href-ar') : el.getAttribute('data-i18n-href-fr');
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang());
    });
    var bilingualCb = document.getElementById('pep-bilingual');
    if (bilingualCb) {
      bilingualCb.checked = isBilingual();
      bilingualCb.disabled = lang() === 'ar';
    }
    var curMethode = '';
    var methSel = document.getElementById('methodeMesure');
    if (methSel) curMethode = methSel.value;
    buildMethodeSelect(curMethode);
  }

  function chk(v) {
    return v ? '☑' : '☐';
  }

  function printHtml(data, co) {
    var iconUrl = new URL('assets/app-icon.png', window.location.href).href;
    var cornerLogo = hasLogo(co)
      ? '<img src="' + co.logoDataUrl + '" class="print-logo-corner" alt=""/>'
      : '<img src="' + iconUrl + '" class="print-logo-corner" alt=""/>';
    var cornerLabel = hasLogo(co)
      ? esc(co.companyName || 'SwissDZ')
      : esc(tr('printFooterApp'));

    var measureRows = data.rows
      .map(function (r, idx) {
        return (
          '<tr>' +
          printCell(r.numero || String(idx + 1)) +
          printCell(r.objet) +
          printCell(r.typeCaract) +
          printCell(r.inMagn) +
          printCell(r.inTherm) +
          '<td style="text-align:center">' +
          chk(r.visuel) +
          '</td>' +
          printCell(r.rpe) +
          printCell(r.riso) +
          printCell(r.idiff) +
          printCell(r.iccLpe) +
          printCell(r.iccLn) +
          printCell(r.ddrIn) +
          printCell(r.idn) +
          printCell(r.testT) +
          '<td style="text-align:center">' +
          chk(r.champOk) +
          '</td>' +
          printCell(r.tensionU) +
          printCell(r.paraphePort) +
          printCell(r.parapheInsp) +
          '</tr>'
        );
      })
      .join('');

    var sigLogo =
      hasLogo(co) && co.logoDataUrl
        ? '<img src="' + co.logoDataUrl + '" class="print-signature-logo" alt=""/>'
        : '';

    return (
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' +
      esc(tr('printTitle')) +
      '</title><style>' +
      '@page{size:A4 landscape;margin:10mm}' +
      '@media print{body{margin:0;padding:12px}}' +
      'body{font-family:Segoe UI,Arial,sans-serif;padding:12px;color:#000;background:#fff;font-size:9px;line-height:1.35}' +
      '.print-header-corner{position:absolute;top:8px;right:8px;text-align:right}' +
      '.print-logo-corner{width:72px;height:72px;border-radius:50%;object-fit:cover}' +
      'h1{font-size:13px;margin:0 0 8px;max-width:70%}' +
      '.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:56px 0 8px}' +
      '.meta p{margin:2px 0}' +
      '.checks{margin:6px 0}' +
      'table{width:100%;border-collapse:collapse;margin:8px 0;font-size:7.5px}' +
      'th,td{border:1px solid #333;padding:2px 3px;vertical-align:top;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;line-height:1.2}' +
      'td.cell-med{font-size:6.5px}' +
      'td.cell-long{font-size:5.5px}' +
      'th{background:#e5e7eb;font-weight:700;text-align:center}' +
      '.footer-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px;font-size:8px}' +
      '.print-signatures{display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px;gap:16px}' +
      '.print-signature-col{flex:1;display:flex;flex-direction:column;align-items:center}' +
      '.print-signature-row{display:flex;align-items:center;gap:12px;width:100%;max-width:320px}' +
      '.print-signature-logo{width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0}' +
      '.print-signature-line{flex:1;border-top:1px solid #000;height:0}' +
      '.print-signature-label{font-size:9px;font-weight:600;margin-top:6px;text-align:center}' +
      '.print-footer{margin-top:10px;text-align:center;font-size:8px}' +
      '.earth-box{border:1.5px solid #000;padding:6px 8px;margin:8px 0;background:#f5f5f5}' +
      '.earth-box p{margin:3px 0}' +
      '.pep-label-ar{font-size:0.85em;color:#333;font-weight:600}' +
      'th .pep-label-ar{font-size:0.75em;display:block}' +
      '</style></head><body>' +
      '<div class="print-header-corner">' +
      cornerLogo +
      '<div style="font-size:9px;font-weight:600;max-width:100px;margin-top:4px">' +
      cornerLabel +
      '</div></div>' +
      '<h1>' +
      esc(tr('printTitle')) +
      '</h1>' +
      '<div class="checks">' +
      chk(data.verificationInitiale) +
      ' ' +
      (isBilingual()
        ? '<span class="pep-label-fr">' +
          esc(trFr('verificationInitiale')) +
          '</span> <span class="pep-label-ar" dir="rtl" lang="ar">(' +
          esc(trAr('verificationInitiale')) +
          ')</span>'
        : esc(tr('verificationInitiale'))) +
      ' &nbsp; ' +
      chk(data.controleApresReparation) +
      ' ' +
      (isBilingual()
        ? '<span class="pep-label-fr">' +
          esc(trFr('controleApresReparation')) +
          '</span> <span class="pep-label-ar" dir="rtl" lang="ar">(' +
          esc(trAr('controleApresReparation')) +
          ')</span>'
        : esc(tr('controleApresReparation'))) +
      '</div>' +
      '<div class="meta">' +
      '<div><p>' +
      printLabelHtml('objetPeriode') +
      ': ' +
      esc(data.objetPeriode) +
      '</p>' +
      '<p>' +
      printLabelHtml('instruments') +
      ': ' +
      esc(data.instruments) +
      '</p>' +
      '<p>' +
      printLabelHtml('descriptionInstallation') +
      ': ' +
      esc(data.descriptionInstallation) +
      '</p></div>' +
      '<div><p>' +
      printLabelHtml('titulaire') +
      ': ' +
      esc(data.titulaire) +
      '</p>' +
      '<p>' +
      printLabelHtml('porteur') +
      ': ' +
      esc(data.porteur) +
      '</p>' +
      '<p>' +
      printLabelHtml('noAutorisation') +
      ': ' +
      esc(data.noAutorisation) +
      ' &nbsp; ' +
      printLabelHtml('numeroPage') +
      ': ' +
      esc(data.numeroPage) +
      '</p></div></div>' +
      (data.resistanceTerre || data.methodeMesure
        ? '<div class="earth-box"><p>' +
          printLabelHtml('earthTitle') +
          '</p><p>' +
          printLabelHtml('resistanceTerre') +
          ': ' +
          esc(data.resistanceTerre) +
          (data.resistanceTerre ? ' Ω' : '') +
          ' &nbsp;|&nbsp; ' +
          printLabelHtml('methodeMesure') +
          ': ' +
          methodeLabelBilingual(data.methodeMesure) +
          '</p></div>'
        : '') +
      '<table><thead><tr>' +
      '<th>' +
      printTh('colNum') +
      '</th><th>' +
      printTh('colObj') +
      '</th><th>' +
      printTh('colType') +
      '</th><th>' +
      printTh('colInMagn') +
      '</th><th>' +
      printTh('colInTherm') +
      '</th><th>' +
      printTh('colVisuel') +
      '</th><th>' +
      printTh('colRpe') +
      '</th><th>' +
      printTh('colRiso') +
      '</th><th>' +
      printTh('colIdiff') +
      '</th><th>' +
      printTh('colIccLpe') +
      '</th><th>' +
      printTh('colIccLn') +
      '</th><th>' +
      printTh('colDdrIn') +
      '</th><th>' +
      printTh('colIdn') +
      '</th><th>' +
      printTh('colTestT') +
      '</th><th>' +
      printTh('colChamp') +
      '</th><th>' +
      printTh('colU') +
      '</th><th>' +
      printTh('colParaphePort') +
      '</th><th>' +
      printTh('colParapheInsp') +
      '</th>' +
      '</tr></thead><tbody>' +
      measureRows +
      '</tbody></table>' +
      '<div class="footer-grid">' +
      '<div>' +
      printLabelHtml('executeurNom') +
      '<br>' +
      esc(data.executeurNom) +
      '<br><br>' +
      printLabelHtml('executeurDateSignature') +
      '<br>' +
      esc(data.executeurDateSignature) +
      '</div>' +
      '<div>' +
      printLabelHtml('organeEntreprise') +
      '<br>' +
      esc(data.organeEntreprise) +
      '<br><br>' +
      printLabelHtml('organeDateSignature') +
      '<br>' +
      esc(data.organeDateSignature) +
      '</div></div>' +
      '<div class="print-signatures">' +
      '<div class="print-signature-col"><div class="print-signature-row">' +
      sigLogo +
      '<div class="print-signature-line"></div></div><div class="print-signature-label">' +
      (isBilingual()
        ? esc(trFr('executeurNom')) + ' / ' + esc(trAr('executeurNom'))
        : esc(tr('executeurNom'))) +
      '</div></div>' +
      '<div class="print-signature-col"><div class="print-signature-row"><div class="print-signature-line"></div></div><div class="print-signature-label">' +
      (isBilingual()
        ? esc(trFr('organeDateSignature')) + ' / ' + esc(trAr('organeDateSignature'))
        : esc(tr('organeDateSignature'))) +
      '</div></div></div>' +
      '<div class="print-footer">' +
      (isBilingual()
        ? esc(trFr('footer')) + ' — ' + esc(trAr('footer'))
        : esc(tr('footer'))) +
      '</div>' +
      '</body></html>'
    );
  }

  function printForm() {
    syncCompanyFromUi();
    var data = readForm();
    saveState(data);
    var co = loadCompany();
    var html = printHtml(data, co);
    var w = window.open('', '_blank');
    if (!w) {
      alert(tr('popupBlocked'));
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () {
      w.print();
    }, 400);
  }

  function pdfY(pageH, yTop) {
    return pageH - yTop;
  }

  function drawCheck(page, font, rect, pageH, checked) {
    if (!checked) return;
    var cx = (rect[0] + rect[2]) / 2;
    var cy = pdfY(pageH, (rect[1] + rect[3]) / 2);
    page.drawText('X', { font: font, x: cx - 2.5, y: cy - 3, size: 9 });
  }

  function wrapTextLines(font, text, size, maxW) {
    var t = String(text || '').trim();
    if (!t) return [];
    var lines = [];
    var paragraphs = t.split(/\n/);
    paragraphs.forEach(function (para, pi) {
      if (pi > 0 && !para) {
        lines.push('');
        return;
      }
      if (!para) return;
      var words = para.split(/\s+/);
      var line = '';
      words.forEach(function (word) {
        var test = line ? line + ' ' + word : word;
        if (font.widthOfTextAtSize(test, size) <= maxW) {
          line = test;
          return;
        }
        if (line) {
          lines.push(line);
          line = '';
        }
        var chunk = '';
        for (var ci = 0; ci < word.length; ci++) {
          var next = chunk + word[ci];
          if (font.widthOfTextAtSize(next, size) <= maxW) {
            chunk = next;
          } else {
            if (chunk) lines.push(chunk);
            chunk = word[ci];
          }
        }
        line = chunk;
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  function drawTextFit(page, font, text, x, yTop, maxW, size, pageH, maxH) {
    if (!text) return;
    var minSize = 4.5;
    var curSize = size;
    var lines = [];
    maxH = maxH || size * 1.35;
    while (curSize >= minSize) {
      lines = wrapTextLines(font, text, curSize, maxW);
      var lineH = curSize * 1.12;
      if (lines.length * lineH <= maxH) break;
      curSize -= 0.5;
    }
    if (!lines.length) return;
    var lineH = curSize * 1.12;
    var totalH = lines.length * lineH;
    var startY = yTop - (totalH - lineH) / 2;
    for (var i = 0; i < lines.length; i++) {
      page.drawText(lines[i], {
        font: font,
        x: x,
        y: pdfY(pageH, startY + i * lineH) - 2,
        size: curSize,
      });
    }
  }

  function colCenter(cols, key) {
    var c = cols[key];
    return (c[0] + c[1]) / 2;
  }

  function colX(cols, key) {
    return cols[key][0] + 2;
  }

  async function generateOfficialPdf() {
    if (!window.PDFLib) {
      alert(tr('pdfErr'));
      return;
    }
    syncCompanyFromUi();
    var data = readForm();
    saveState(data);
    var co = loadCompany();

    if (!layout) {
      var lr = await fetch('data/protocole-ep-layout.json');
      layout = await lr.json();
    }

    var tplRes = await fetch(layout.templateUrl);
    var tplBytes = await tplRes.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    var page = pdfDoc.getPages()[0];
    var pageH = layout.page.height;
    var font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    var cols = layout.rows.columns;
    var rowMaxH = 14;

    function text(field, value) {
      var f = layout.header[field] || layout.footer[field];
      if (!f || f.type !== 'text' || !value) return;
      if (f.multiline) {
        var lines = String(value).split(/\n/);
        for (var li = 0; li < Math.min(lines.length, f.lines || 3); li++) {
          drawTextFit(page, font, lines[li], f.x, f.y + li * (f.lineHeight || 11), f.maxW, f.size, pageH, f.lineHeight || 11);
        }
      } else {
        drawTextFit(page, font, value, f.x, f.y, f.maxW, f.size, pageH, f.size * 1.35);
      }
    }

    drawCheck(page, font, layout.header.verificationInitiale.rect, pageH, data.verificationInitiale);
    drawCheck(page, font, layout.header.controleApresReparation.rect, pageH, data.controleApresReparation);
    text('titulaire', data.titulaire);
    text('porteur', data.porteur);
    text('noAutorisation', data.noAutorisation);
    text('numeroPage', data.numeroPage);
    text('objetPeriode', data.objetPeriode);
    text('instruments', data.instruments);
    text('descriptionInstallation', data.descriptionInstallation);
    if (data.resistanceTerre) {
      text('resistanceTerre', data.resistanceTerre + ' Ohm');
    }
    if (data.methodeMesure) {
      text('methodeMesure', methodeLabelFr(data.methodeMesure));
    }
    if (layout.earthLabels && (data.resistanceTerre || data.methodeMesure)) {
      var elR = layout.earthLabels.resistanceTerre;
      var elM = layout.earthLabels.methodeMesure;
      if (elR) {
        drawTextFit(page, font, trFr('resistanceTerre') + ':', elR.x, elR.y, 120, elR.size, pageH, elR.size * 1.4);
      }
      if (elM) {
        drawTextFit(page, font, trFr('methodeMesure') + ':', elM.x, elM.y, 140, elM.size, pageH, elM.size * 1.4);
      }
    }

    data.rows.forEach(function (row, i) {
      var y = layout.rows.yCenters[i];
      if (!y) return;
      drawTextFit(page, font, row.numero, colX(cols, 'numero'), y, cols.numero[1] - cols.numero[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.objet, colX(cols, 'objet'), y, cols.objet[1] - cols.objet[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.typeCaract, colX(cols, 'typeCaract'), y, cols.typeCaract[1] - cols.typeCaract[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.inMagn, colX(cols, 'inMagn'), y, cols.inMagn[1] - cols.inMagn[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.inTherm, colX(cols, 'inTherm'), y, cols.inTherm[1] - cols.inTherm[0], 7, pageH, rowMaxH);
      if (row.visuel) drawCheck(page, font, cols.visuel.concat([y + 6, y - 6]), pageH, true);
      drawTextFit(page, font, row.rpe, colX(cols, 'rpe'), y, cols.rpe[1] - cols.rpe[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.riso, colX(cols, 'riso'), y, cols.riso[1] - cols.riso[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.idiff, colX(cols, 'idiff'), y, cols.idiff[1] - cols.idiff[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.iccLpe, colX(cols, 'iccLpe'), y, cols.iccLpe[1] - cols.iccLpe[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.iccLn, colX(cols, 'iccLn'), y, cols.iccLn[1] - cols.iccLn[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.ddrIn, colX(cols, 'ddrIn'), y, cols.ddrIn[1] - cols.ddrIn[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.idn, colX(cols, 'idn'), y, cols.idn[1] - cols.idn[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.testT, colX(cols, 'testT'), y, cols.testT[1] - cols.testT[0], 7, pageH, rowMaxH);
      if (row.champOk) drawCheck(page, font, [cols.champOk[0], y - 5, cols.champOk[1], y + 5], pageH, true);
      drawTextFit(page, font, row.tensionU, colX(cols, 'tensionU'), y, cols.tensionU[1] - cols.tensionU[0], 7, pageH, rowMaxH);
      drawTextFit(page, font, row.paraphePort, colX(cols, 'paraphePort'), y, cols.paraphePort[1] - cols.paraphePort[0], 6, pageH, rowMaxH);
      drawTextFit(page, font, row.parapheInsp, colX(cols, 'parapheInsp'), y, cols.parapheInsp[1] - cols.parapheInsp[0], 6, pageH, rowMaxH);
    });

    text('executeurNom', data.executeurNom);
    text('executeurDateSignature', data.executeurDateSignature);
    text('organeEntreprise', data.organeEntreprise);
    text('organeDateSignature', data.organeDateSignature);

    if (hasLogo(co) && co.logoDataUrl) {
      try {
        var imgBytes = await fetch(co.logoDataUrl).then(function (r) {
          return r.arrayBuffer();
        });
        var img = co.logoDataUrl.indexOf('image/png') >= 0
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);
        var lg = layout.logo;
        page.drawImage(img, {
          x: lg.x,
          y: pdfY(pageH, lg.y + lg.size),
          width: lg.size,
          height: lg.size,
        });
      } catch (_) {}
    }

    var out = await pdfDoc.save();
    var blob = new Blob([out], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var w = window.open(url, '_blank');
    if (w) {
      w.focus();
      setTimeout(function () {
        w.print();
      }, 600);
    } else {
      var a = document.createElement('a');
      a.href = url;
      a.download = 'controle-final-swissdz.pdf';
      a.click();
    }
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 60000);
  }

  function init() {
    buildRows();
    var state = loadState();
    applyI18n();
    fillForm(state);

    var co = loadCompany();
    updateLogoPreview(co.logoDataUrl || '');
    var showLogo = document.getElementById('pep-show-logo');
    if (showLogo) showLogo.checked = !!co.showLogoOnDevis;

    var form = document.getElementById('pep-form');
    if (form) {
      form.addEventListener('input', scheduleSave);
      form.addEventListener('change', scheduleSave);
    }

    document.getElementById('btn-print').addEventListener('click', printForm);
    document.getElementById('btn-pdf').addEventListener('click', function () {
      generateOfficialPdf().catch(function () {
        alert(tr('pdfErr'));
      });
    });
    document.getElementById('btn-clear').addEventListener('click', function () {
      if (!confirm(tr('confirmClear'))) return;
      var fresh = defaultState();
      fillForm(fresh);
      saveState(fresh);
      var st = document.getElementById('save-status');
      if (st) st.textContent = tr('cleared');
    });

    var logoPick = document.getElementById('pep-logo-pick');
    var logoFile = document.getElementById('pep-logo-file');
    var logoRemove = document.getElementById('pep-logo-remove');
    if (logoPick && logoFile) {
      logoPick.addEventListener('click', function () {
        logoFile.click();
      });
      logoFile.addEventListener('change', function () {
        var file = logoFile.files && logoFile.files[0];
        logoFile.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        resizeLogoToDataUrl(file)
          .then(function (dataUrl) {
            var c = loadCompany();
            c.logoDataUrl = dataUrl;
            c.showLogoOnDevis = true;
            saveCompany(c);
            updateLogoPreview(dataUrl);
            if (showLogo) showLogo.checked = true;
          })
          .catch(function () {});
      });
    }
    if (logoRemove) {
      logoRemove.addEventListener('click', function () {
        var c = loadCompany();
        delete c.logoDataUrl;
        c.showLogoOnDevis = false;
        saveCompany(c);
        updateLogoPreview('');
        if (showLogo) showLogo.checked = false;
      });
    }
    if (showLogo) {
      showLogo.addEventListener('change', syncCompanyFromUi);
    }

    var bilingualCb = document.getElementById('pep-bilingual');
    if (bilingualCb) {
      bilingualCb.addEventListener('change', function () {
        setBilingual(bilingualCb.checked);
        applyI18n();
      });
    }

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-lang');
        try {
          localStorage.setItem(LANG_KEY, next);
        } catch (_) {}
        applyI18n();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
