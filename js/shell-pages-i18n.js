/**
 * Contact / Emploi / Privacy — FR / AR / EN (shell marketing pages)
 */
(function () {
  'use strict';

  var STORAGE = 'electrodz-site-lang';

  var T = {
    fr: {
      'nav.home': 'Accueil',
      'nav.train': 'Formations',
      'nav.docs': 'Documentation',
      'nav.calc': 'Calculs',
      'nav.calcLong': 'Calcul électrique',
      'nav.job': 'Emploi',
      'nav.contact': 'Contact',
      'nav.support': 'Support',
      'nav.app': "L'app",
      'nav.privacy': 'Confidentialité',
      'footer.tagline':
        "L'outil numérique des électriciens algériens. 100% gratuit.",
      'footer.nav': 'Navigation',
      'footer.support': 'Support',
      'footer.download': 'Télécharger',
      'footer.legal': 'Légal',
      'contact.meta':
        'Electro DZ — Contact officiel SwissDZ : partenariats, questions, support pour électriciens.',
      'contact.title': 'Electro DZ — Contact | SwissDZ',
      'contact.hero': 'Contactez-nous',
      'contact.heroSub':
        'Nous sommes disponibles pour vous aider. Rejoignez-nous sur nos réseaux sociaux ou appelez-nous directement.',
      'contact.coords': 'Nos coordonnées',
      'contact.phone': 'Téléphone / WhatsApp',
      'contact.fbPage': 'Page SwissDZ',
      'contact.dlApp': "Télécharger l'app",
      'contact.formTitle': 'Envoyer un message',
      'contact.name': 'Nom complet',
      'contact.namePh': 'Votre nom',
      'contact.email': 'Email',
      'contact.emailPh': 'votre@email.com',
      'contact.phoneLabel': 'Téléphone',
      'contact.subject': 'Sujet',
      'contact.optApp': "Question sur l'application",
      'contact.optBug': 'Signaler un problème',
      'contact.optPartner': 'Partenariat',
      'contact.optOther': 'Autre',
      'contact.message': 'Message',
      'contact.messagePh': 'Votre message…',
      'contact.send': 'Envoyer le message',
      'emploi.meta':
        'Offres d’emploi et entreprises du secteur électrique — SwissDZ.',
      'emploi.title': 'Emploi & entreprises — SwissDZ | electro-dz.com',
      'emploi.hero': 'Emploi & entreprises',
      'emploi.heroSub':
        'Bientôt de super nouvelles en Algérie — offres d’emploi, entreprises partenaires et candidatures pour électriciens, monteurs et techniciens. Restez connectés sur la page Facebook Electro DZ et sur WhatsApp pour les premières annonces.',
      'emploi.companies': 'Pour les entreprises',
      'emploi.companiesP':
        'Vous cherchez des électriciens, des monteurs, des techniciens de maintenance ou des apprentis ? Publiez votre besoin en nous indiquant le poste, la zone, le type de contrat et un moyen de contact. Nous diffusons les offres validées sur cette page et pouvons les relayer sur nos réseaux.',
      'emploi.candidates': 'Pour les candidats',
      'emploi.candidatesP':
        'Vous êtes autonome sur le terrain, à l’aise avec la lecture de plans et les règles de sécurité ? Envoyez-nous une brève présentation, votre zone géographique et le type de mission recherché. Nous pourrons vous mettre en relation avec des entreprises partenaires lorsque le profil correspond.',
      'emploi.colType': 'Type de besoin',
      'emploi.colZone': 'Zone',
      'emploi.colStatus': 'Statut',
      'emploi.row1': 'Électricien installation (bâtiment)',
      'emploi.row2': 'Technicien maintenance industrielle',
      'emploi.row3': 'Alternance / apprentissage',
      'emploi.row4': 'Entreprise partenaire (visibilité sur le site)',
      'emploi.tba': 'À préciser',
      'emploi.soon1': 'Annonces à venir',
      'emploi.soon2': 'Bientôt — annonces imminentes',
      'emploi.contact': 'Contact',
      'emploi.ctaTitle': 'Publier une offre ou se porter candidat',
      'emploi.ctaP':
        'Utilisez la page Contact en indiquant Emploi dans l’objet du message, et joignez les informations utiles (sans données sensibles non sollicitées ; pas de pièces d’identité par e-mail non sécurisé).',
      'emploi.ctaBtn': 'Nous écrire',
      'privacy.meta': 'Politique de confidentialité — SwissDZ, electro-dz.com',
      'privacy.title': 'Confidentialité — SwissDZ | electro-dz.com',
      'privacy.hero': 'Politique de confidentialité',
      'privacy.heroSub':
        'Dernière mise à jour : 2026 — SwissDZ (site electro-dz.com et application mobile).',
      'privacy.h1': '1. Responsable du traitement',
      'privacy.p1':
        'Les informations relatives à l’éditeur du site et de l’application SwissDZ sont communiquées sur la page Contact. Pour toute question sur vos données : contact@electro-dz.com.',
      'privacy.h2': '2. Données collectées via le site web',
      'privacy.p2a':
        'Le site electro-dz.com peut utiliser des cookies ou outils d’analyse d’audience (par exemple si vous activez un bandeau cookies ou un service tiers comme Google Analytics). Les finalités sont : mesurer la fréquentation, améliorer le contenu et l’expérience utilisateur. Vous pouvez configurer votre navigateur pour refuser certains cookies.',
      'privacy.p2b':
        'Si vous nous écrivez par e-mail, nous conservons les éléments nécessaires à la gestion de votre demande (expéditeur, objet, message).',
      'privacy.h3': '3. Application mobile',
      'privacy.p3a':
        'L’application SwissDZ peut accéder à certaines fonctions du téléphone (appareil photo, galerie photos, etc.) uniquement si vous l’autorisez, et dans le but décrit dans les textes du système (par exemple ajouter des photos à un projet). Les données restent en principe sur l’appareil sauf si une fonction de synchronisation cloud est proposée et activée par l’utilisateur.',
      'privacy.p3b':
        'Les mises à jour de l’app peuvent être distribuées via les stores (Google, Apple) qui appliquent leurs propres conditions.',
      'privacy.h4': '4. Durée de conservation',
      'privacy.p4':
        'Les messages de contact sont conservés le temps nécessaire au traitement de la demande, puis archivés ou supprimés selon les obligations légales applicables.',
      'privacy.h5': '5. Vos droits',
      'privacy.p5':
        'Selon le droit applicable (notamment le RGPD pour les utilisateurs concernés), vous pouvez disposer d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Adressez votre demande à contact@electro-dz.com en justifiant de votre identité si nécessaire.',
      'privacy.h6': '6. Modifications',
      'privacy.p6':
        'Cette politique peut être mise à jour. La date en tête de page indique la dernière révision significative.',
    },
    ar: {
      'nav.home': 'الرئيسية',
      'nav.train': 'التكوين',
      'nav.docs': 'التوثيق',
      'nav.calc': 'الحسابات',
      'nav.calcLong': 'الحساب الكهربائي',
      'nav.job': 'العمل',
      'nav.contact': 'اتصال',
      'nav.support': 'الدعم',
      'nav.app': 'التطبيق',
      'nav.privacy': 'الخصوصية',
      'footer.tagline': 'الأداة الرقمية للكهربائيين الجزائريين. مجاني 100%.',
      'footer.nav': 'التنقل',
      'footer.support': 'الدعم',
      'footer.download': 'تنزيل',
      'footer.legal': 'قانوني',
      'contact.meta':
        'Electro DZ — اتصال SwissDZ الرسمي: شراكات وأسئلة ودعم للكهربائيين.',
      'contact.title': 'Electro DZ — اتصال | SwissDZ',
      'contact.hero': 'اتصل بنا',
      'contact.heroSub':
        'نحن متاحون لمساعدتكم. انضموا إلينا على شبكاتنا أو اتصلوا بنا مباشرة.',
      'contact.coords': 'بيانات الاتصال',
      'contact.phone': 'هاتف / واتساب',
      'contact.fbPage': 'صفحة SwissDZ',
      'contact.dlApp': 'تنزيل التطبيق',
      'contact.formTitle': 'إرسال رسالة',
      'contact.name': 'الاسم الكامل',
      'contact.namePh': 'اسمك',
      'contact.email': 'البريد',
      'contact.emailPh': 'votre@email.com',
      'contact.phoneLabel': 'الهاتف',
      'contact.subject': 'الموضوع',
      'contact.optApp': 'سؤال حول التطبيق',
      'contact.optBug': 'الإبلاغ عن مشكلة',
      'contact.optPartner': 'شراكة',
      'contact.optOther': 'أخرى',
      'contact.message': 'الرسالة',
      'contact.messagePh': 'رسالتك…',
      'contact.send': 'إرسال الرسالة',
      'emploi.meta': 'عروض عمل وشركات قطاع الكهرباء — SwissDZ.',
      'emploi.title': 'العمل والشركات — SwissDZ | electro-dz.com',
      'emploi.hero': 'العمل والشركات',
      'emploi.heroSub':
        'قريباً أخبار رائعة في الجزائر — عروض عمل وشركات شريكة وترشحات للكهربائيين والمركّبين والفنيين. تابعوا صفحة فيسبوك Electro DZ وواتساب لأول الإعلانات.',
      'emploi.companies': 'للشركات',
      'emploi.companiesP':
        'تبحثون عن كهربائيين أو مركّبين أو فنيي صيانة أو متدربين؟ انشروا حاجتكم مع المنصب والمنطقة ونوع العقد ووسيلة اتصال. ننشر العروض المعتمدة هنا ويمكننا إعادة نشرها على شبكاتنا.',
      'emploi.candidates': 'للمرشحين',
      'emploi.candidatesP':
        'أنتم مستقلون في الميدان، مرتاحون لقراءة المخططات وقواعد السلامة؟ أرسلوا عرضاً موجزاً ومنطقتكم ونوع المهمة المطلوبة. يمكننا ربطكم بشركات شريكة عند توافق الملف.',
      'emploi.colType': 'نوع الحاجة',
      'emploi.colZone': 'المنطقة',
      'emploi.colStatus': 'الحالة',
      'emploi.row1': 'كهربائي تركيب (بناء)',
      'emploi.row2': 'فني صيانة صناعية',
      'emploi.row3': 'تدريب / تمهين',
      'emploi.row4': 'شركة شريكة (ظهور على الموقع)',
      'emploi.tba': 'يُحدد لاحقاً',
      'emploi.soon1': 'إعلانات قادمة',
      'emploi.soon2': 'قريباً — إعلانات وشيكة',
      'emploi.contact': 'اتصال',
      'emploi.ctaTitle': 'نشر عرض أو الترشح',
      'emploi.ctaP':
        'استخدموا صفحة الاتصال مع ذكر «عمل» في الموضوع، وأرفقوا المعلومات المفيدة (دون بيانات حساسة غير مطلوبة؛ لا ترسلوا وثائق هوية عبر بريد غير آمن).',
      'emploi.ctaBtn': 'راسلونا',
      'privacy.meta': 'سياسة الخصوصية — SwissDZ، electro-dz.com',
      'privacy.title': 'الخصوصية — SwissDZ | electro-dz.com',
      'privacy.hero': 'سياسة الخصوصية',
      'privacy.heroSub':
        'آخر تحديث: 2026 — SwissDZ (موقع electro-dz.com والتطبيق).',
      'privacy.h1': '1. المسؤول عن المعالجة',
      'privacy.p1':
        'معلومات ناشر الموقع وتطبيق SwissDZ متاحة في صفحة الاتصال. لأي سؤال حول بياناتكم: contact@electro-dz.com.',
      'privacy.h2': '2. البيانات المجمّعة عبر الموقع',
      'privacy.p2a':
        'قد يستخدم موقع electro-dz.com ملفات تعريف أو أدوات تحليل جمهور. الأهداف: قياس الزيارات وتحسين المحتوى والتجربة. يمكنكم ضبط المتصفح لرفض بعض ملفات التعريف.',
      'privacy.p2b':
        'إذا راسلتمونا بالبريد، نحتفظ بالعناصر اللازمة لمعالجة طلبكم (المرسل، الموضوع، الرسالة).',
      'privacy.h3': '3. التطبيق',
      'privacy.p3a':
        'قد يصل تطبيق SwissDZ إلى وظائف الهاتف (كاميرا، معرض…) فقط إذا منحتم الإذن، وللغرض الموضح في النظام. تبقى البيانات على الجهاز ما لم تُفعَّل مزامنة سحابية.',
      'privacy.p3b':
        'تحديثات التطبيق تُوزَّع عبر المتاجر (Google، Apple) وفق شروطها.',
      'privacy.h4': '4. مدة الحفظ',
      'privacy.p4':
        'تُحفظ رسائل الاتصال للمدة اللازمة للمعالجة ثم تُأرشف أو تُحذف وفق الالتزامات القانونية.',
      'privacy.h5': '5. حقوقكم',
      'privacy.p5':
        'وفق القانون المعمول به (مثل GDPR)، قد تكون لكم حقوق الوصول والتصحيح والمحو والتقييد والاعتراض وقابلية النقل. راسلوا contact@electro-dz.com مع إثبات الهوية عند الحاجة.',
      'privacy.h6': '6. التعديلات',
      'privacy.p6':
        'قد تُحدَّث هذه السياسة. التاريخ أعلى الصفحة يشير إلى آخر مراجعة مهمة.',
    },
    en: {
      'nav.home': 'Home',
      'nav.train': 'Training',
      'nav.docs': 'Documentation',
      'nav.calc': 'Calculations',
      'nav.calcLong': 'Electrical calculations',
      'nav.job': 'Jobs',
      'nav.contact': 'Contact',
      'nav.support': 'Support',
      'nav.app': 'The app',
      'nav.privacy': 'Privacy',
      'footer.tagline':
        'The digital toolkit for Algerian electricians. 100% free.',
      'footer.nav': 'Navigation',
      'footer.support': 'Support',
      'footer.download': 'Download',
      'footer.legal': 'Legal',
      'contact.meta':
        'Electro DZ — Official SwissDZ contact: partnerships, questions, support for electricians.',
      'contact.title': 'Electro DZ — Contact | SwissDZ',
      'contact.hero': 'Contact us',
      'contact.heroSub':
        'We are available to help. Reach us on social media or call us directly.',
      'contact.coords': 'Our details',
      'contact.phone': 'Phone / WhatsApp',
      'contact.fbPage': 'SwissDZ page',
      'contact.dlApp': 'Download the app',
      'contact.formTitle': 'Send a message',
      'contact.name': 'Full name',
      'contact.namePh': 'Your name',
      'contact.email': 'E-mail',
      'contact.emailPh': 'you@email.com',
      'contact.phoneLabel': 'Phone',
      'contact.subject': 'Subject',
      'contact.optApp': 'Question about the app',
      'contact.optBug': 'Report an issue',
      'contact.optPartner': 'Partnership',
      'contact.optOther': 'Other',
      'contact.message': 'Message',
      'contact.messagePh': 'Your message…',
      'contact.send': 'Send message',
      'emploi.meta':
        'Job offers and companies in the electrical sector — SwissDZ.',
      'emploi.title': 'Jobs & companies — SwissDZ | electro-dz.com',
      'emploi.hero': 'Jobs & companies',
      'emploi.heroSub':
        'Great news coming soon in Algeria — job offers, partner companies and applications for electricians, fitters and technicians. Stay tuned on the Electro DZ Facebook page and WhatsApp for the first announcements.',
      'emploi.companies': 'For companies',
      'emploi.companiesP':
        'Looking for electricians, fitters, maintenance technicians or apprentices? Publish your need with the role, area, contract type and a contact channel. We post validated offers on this page and can relay them on our networks.',
      'emploi.candidates': 'For candidates',
      'emploi.candidatesP':
        'Confident on site, comfortable reading plans and safety rules? Send a short introduction, your geographic area and the type of work you seek. We can connect you with partner companies when the profile matches.',
      'emploi.colType': 'Need type',
      'emploi.colZone': 'Area',
      'emploi.colStatus': 'Status',
      'emploi.row1': 'Installation electrician (building)',
      'emploi.row2': 'Industrial maintenance technician',
      'emploi.row3': 'Apprenticeship / dual training',
      'emploi.row4': 'Partner company (site visibility)',
      'emploi.tba': 'TBD',
      'emploi.soon1': 'Listings coming soon',
      'emploi.soon2': 'Soon — announcements imminent',
      'emploi.contact': 'Contact',
      'emploi.ctaTitle': 'Post an offer or apply',
      'emploi.ctaP':
        'Use the Contact page and put Jobs in the subject, with useful details (no unsolicited sensitive data; do not send ID documents over insecure e-mail).',
      'emploi.ctaBtn': 'Write to us',
      'privacy.meta': 'Privacy policy — SwissDZ, electro-dz.com',
      'privacy.title': 'Privacy — SwissDZ | electro-dz.com',
      'privacy.hero': 'Privacy policy',
      'privacy.heroSub':
        'Last updated: 2026 — SwissDZ (electro-dz.com website and mobile app).',
      'privacy.h1': '1. Data controller',
      'privacy.p1':
        'Publisher details for the SwissDZ website and app are on the Contact page. For any question about your data: contact@electro-dz.com.',
      'privacy.h2': '2. Data collected via the website',
      'privacy.p2a':
        'electro-dz.com may use cookies or audience analytics (for example if you enable a cookie banner or a third-party service such as Google Analytics). Purposes: measure traffic, improve content and user experience. You can configure your browser to refuse some cookies.',
      'privacy.p2b':
        'If you e-mail us, we keep what is needed to handle your request (sender, subject, message).',
      'privacy.h3': '3. Mobile app',
      'privacy.p3a':
        'The SwissDZ app may access phone features (camera, photo gallery, etc.) only if you allow it, for the purpose described in system prompts (for example adding photos to a project). Data normally stays on the device unless a cloud sync feature is offered and enabled by the user.',
      'privacy.p3b':
        'App updates may be distributed via the stores (Google, Apple), which apply their own terms.',
      'privacy.h4': '4. Retention period',
      'privacy.p4':
        'Contact messages are kept as long as needed to process the request, then archived or deleted under applicable legal obligations.',
      'privacy.h5': '5. Your rights',
      'privacy.p5':
        'Under applicable law (including GDPR where relevant), you may have rights of access, rectification, erasure, restriction, objection and portability. Contact contact@electro-dz.com and prove your identity if required.',
      'privacy.h6': '6. Changes',
      'privacy.p6':
        'This policy may be updated. The date at the top of the page shows the last significant revision.',
    },
  };

  function normalizeLang(next) {
    return next === 'fr' || next === 'ar' || next === 'en' ? next : 'ar';
  }

  var lang = 'ar';

  function t(key) {
    return (T[lang] && T[lang][key]) || T.fr[key] || key;
  }

  function applyLang(next) {
    lang = normalizeLang(next);
    var root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';

    var page = document.body && document.body.getAttribute('data-shell-page');
    if (page === 'contact') {
      document.title = t('contact.title');
      var m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', t('contact.meta'));
    } else if (page === 'emploi') {
      document.title = t('emploi.title');
      var m2 = document.querySelector('meta[name="description"]');
      if (m2) m2.setAttribute('content', t('emploi.meta'));
    } else if (page === 'privacy') {
      document.title = t('privacy.title');
      var m3 = document.querySelector('meta[name="description"]');
      if (m3) m3.setAttribute('content', t('privacy.meta'));
    }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    try {
      localStorage.setItem(STORAGE, lang);
    } catch (e) {}
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLang(btn.getAttribute('data-lang'));
    });
  });

  var saved = 'ar';
  try {
    saved = localStorage.getItem(STORAGE) || 'ar';
  } catch (e) {}
  applyLang(normalizeLang(saved));
})();
