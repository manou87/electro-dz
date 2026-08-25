/**
 * Auth pages (login / register / dashboard) — FR / AR / EN
 */
(function (g) {
  'use strict';

  var STORAGE = 'electrodz-site-lang';

  var T = {
    fr: {
      'meta.login': 'Connexion — SwissDZ',
      'meta.register': 'Inscription — SwissDZ',
      'meta.dashboard': 'Dashboard — SwissDZ',
      'nav.create': 'Créer un compte →',
      'nav.login': 'Connexion →',
      'nav.home': 'Accueil',
      'teaser': 'Bientôt, les surprises…',
      'login.title': 'Connexion',
      'login.sub': 'Espace membre — favoris PDF, dashboard',
      'login.googleHint': 'Connexion rapide avec Google',
      'login.google': 'Continuer avec Google',
      'login.orEmail': 'ou avec e-mail',
      'login.email': 'Adresse e-mail',
      'login.emailPh': 'vous@exemple.com',
      'login.password': 'Mot de passe',
      'login.forgot': 'Mot de passe oublié ?',
      'login.submit': 'Se connecter',
      'login.submitting': 'Connexion…',
      'login.foot': "Pas encore de compte ?",
      'login.footLink': "S'inscrire gratuitement",
      'login.errCreds': 'Email ou mot de passe incorrect.',
      'login.errGoogle':
        'Connexion Google indisponible. Vérifiez que Google est activé dans Supabase.',
      'login.errGoogleTitle': 'Connexion Google',
      'login.privacy': 'Confidentialité',
      'register.title': 'Créer un compte',
      'register.sub': 'Vidéos, cours et documents exclusifs',
      'register.featVideos': 'Vidéos',
      'register.featPdf': 'PDF',
      'register.featCalc': 'Calculs',
      'register.googleHint': 'Inscription rapide avec Google',
      'register.google': 'Continuer avec Google',
      'register.orEmail': 'ou avec e-mail',
      'register.name': 'Prénom & Nom',
      'register.namePh': 'Ahmed Benali',
      'register.email': 'Adresse e-mail',
      'register.emailPh': 'vous@exemple.com',
      'register.password': 'Mot de passe',
      'register.passwordPh': 'Min. 8 caractères',
      'register.confirm': 'Confirmer',
      'register.confirmPh': 'Répétez le mot de passe',
      'register.submit': 'Créer mon compte gratuitement',
      'register.submitting': 'Création…',
      'register.created': 'Compte créé !',
      'register.createdMsg':
        'Compte créé ! Vérifiez votre e-mail pour confirmer.',
      'register.foot': 'Déjà un compte ?',
      'register.footLink': 'Se connecter',
      'register.errMatch': 'Les mots de passe ne correspondent pas.',
      'register.errLen': 'Minimum 8 caractères requis.',
      'register.errGoogle': 'Connexion Google indisponible.',
      'dash.logout': 'Déconnexion',
      'dash.badge': 'Espace membre',
      'dash.welcome': 'Bienvenue',
      'dash.subBefore': 'Téléchargez vos vidéos et documents exclusifs —',
      'dash.favLink': 'Mes favoris PDF ★',
      'dash.libLink': 'Bibliothèque',
      'dash.statVideos': 'Vidéos',
      'dash.statDocs': 'Documents',
      'dash.statTotal': 'Total',
      'dash.loading': 'Chargement des fichiers…',
      'dash.loadingShort': 'Chargement…',
      'dash.section': 'Contenus disponibles',
      'dash.searchPh': 'Rechercher un fichier…',
      'dash.download': 'Télécharger',
      'dash.empty': 'Aucun fichier disponible pour le moment.',
      'dash.emptyShort': 'Aucun fichier disponible.',
      'dash.errLoad': 'Erreur de chargement : ',
      'dash.err': 'Erreur : ',
      'dash.privacy': 'Confidentialité',
      'member': 'Membre',
    },
    ar: {
      'meta.login': 'تسجيل الدخول — SwissDZ',
      'meta.register': 'إنشاء حساب — SwissDZ',
      'meta.dashboard': 'لوحة التحكم — SwissDZ',
      'nav.create': 'إنشاء حساب ←',
      'nav.login': 'دخول ←',
      'nav.home': 'الرئيسية',
      'teaser': 'قريباً، مفاجآت…',
      'login.title': 'تسجيل الدخول',
      'login.sub': 'فضاء الأعضاء — مفضلة PDF ولوحة التحكم',
      'login.googleHint': 'دخول سريع عبر Google',
      'login.google': 'المتابعة مع Google',
      'login.orEmail': 'أو بالبريد الإلكتروني',
      'login.email': 'البريد الإلكتروني',
      'login.emailPh': 'vous@exemple.com',
      'login.password': 'كلمة المرور',
      'login.forgot': 'نسيت كلمة المرور؟',
      'login.submit': 'تسجيل الدخول',
      'login.submitting': 'جاري الدخول…',
      'login.foot': 'ليس لديك حساب؟',
      'login.footLink': 'سجّل مجاناً',
      'login.errCreds': 'البريد أو كلمة المرور غير صحيحة.',
      'login.errGoogle':
        'تسجيل Google غير متاح. تحقق من تفعيل Google في Supabase.',
      'login.errGoogleTitle': 'تسجيل Google',
      'login.privacy': 'الخصوصية',
      'register.title': 'إنشاء حساب',
      'register.sub': 'فيديوهات ودروس ومستندات حصرية',
      'register.featVideos': 'فيديوهات',
      'register.featPdf': 'PDF',
      'register.featCalc': 'حسابات',
      'register.googleHint': 'تسجيل سريع عبر Google',
      'register.google': 'المتابعة مع Google',
      'register.orEmail': 'أو بالبريد الإلكتروني',
      'register.name': 'الاسم الكامل',
      'register.namePh': 'Ahmed Benali',
      'register.email': 'البريد الإلكتروني',
      'register.emailPh': 'vous@exemple.com',
      'register.password': 'كلمة المرور',
      'register.passwordPh': '8 أحرف على الأقل',
      'register.confirm': 'تأكيد',
      'register.confirmPh': 'أعد كلمة المرور',
      'register.submit': 'إنشاء حسابي مجاناً',
      'register.submitting': 'جاري الإنشاء…',
      'register.created': 'تم إنشاء الحساب!',
      'register.createdMsg':
        'تم إنشاء الحساب! تحقق من بريدك لتأكيد التسجيل.',
      'register.foot': 'لديك حساب؟',
      'register.footLink': 'تسجيل الدخول',
      'register.errMatch': 'كلمتا المرور غير متطابقتين.',
      'register.errLen': '8 أحرف على الأقل مطلوبة.',
      'register.errGoogle': 'تسجيل Google غير متاح.',
      'dash.logout': 'تسجيل الخروج',
      'dash.badge': 'فضاء الأعضاء',
      'dash.welcome': 'مرحباً',
      'dash.subBefore': 'حمّل فيديوهاتك ومستنداتك الحصرية —',
      'dash.favLink': 'مفضلتي PDF ★',
      'dash.libLink': 'المكتبة',
      'dash.statVideos': 'فيديوهات',
      'dash.statDocs': 'مستندات',
      'dash.statTotal': 'المجموع',
      'dash.loading': 'جاري تحميل الملفات…',
      'dash.loadingShort': 'جاري التحميل…',
      'dash.section': 'المحتويات المتاحة',
      'dash.searchPh': 'بحث عن ملف…',
      'dash.download': 'تنزيل',
      'dash.empty': 'لا توجد ملفات متاحة حالياً.',
      'dash.emptyShort': 'لا توجد ملفات.',
      'dash.errLoad': 'خطأ في التحميل: ',
      'dash.err': 'خطأ: ',
      'dash.privacy': 'الخصوصية',
      'member': 'عضو',
    },
    en: {
      'meta.login': 'Sign in — SwissDZ',
      'meta.register': 'Sign up — SwissDZ',
      'meta.dashboard': 'Dashboard — SwissDZ',
      'nav.create': 'Create an account →',
      'nav.login': 'Sign in →',
      'nav.home': 'Home',
      'teaser': 'Surprises coming soon…',
      'login.title': 'Sign in',
      'login.sub': 'Member area — PDF favourites, dashboard',
      'login.googleHint': 'Quick sign-in with Google',
      'login.google': 'Continue with Google',
      'login.orEmail': 'or with e-mail',
      'login.email': 'E-mail address',
      'login.emailPh': 'you@example.com',
      'login.password': 'Password',
      'login.forgot': 'Forgot password?',
      'login.submit': 'Sign in',
      'login.submitting': 'Signing in…',
      'login.foot': 'No account yet?',
      'login.footLink': 'Sign up for free',
      'login.errCreds': 'Incorrect e-mail or password.',
      'login.errGoogle':
        'Google sign-in unavailable. Check that Google is enabled in Supabase.',
      'login.errGoogleTitle': 'Google sign-in',
      'login.privacy': 'Privacy',
      'register.title': 'Create an account',
      'register.sub': 'Exclusive videos, courses and documents',
      'register.featVideos': 'Videos',
      'register.featPdf': 'PDF',
      'register.featCalc': 'Calculations',
      'register.googleHint': 'Quick sign-up with Google',
      'register.google': 'Continue with Google',
      'register.orEmail': 'or with e-mail',
      'register.name': 'First & last name',
      'register.namePh': 'Ahmed Benali',
      'register.email': 'E-mail address',
      'register.emailPh': 'you@example.com',
      'register.password': 'Password',
      'register.passwordPh': 'Min. 8 characters',
      'register.confirm': 'Confirm',
      'register.confirmPh': 'Repeat password',
      'register.submit': 'Create my free account',
      'register.submitting': 'Creating…',
      'register.created': 'Account created!',
      'register.createdMsg':
        'Account created! Check your e-mail to confirm.',
      'register.foot': 'Already have an account?',
      'register.footLink': 'Sign in',
      'register.errMatch': 'Passwords do not match.',
      'register.errLen': 'Minimum 8 characters required.',
      'register.errGoogle': 'Google sign-in unavailable.',
      'dash.logout': 'Sign out',
      'dash.badge': 'Member area',
      'dash.welcome': 'Welcome',
      'dash.subBefore': 'Download your exclusive videos and documents —',
      'dash.favLink': 'My PDF favourites ★',
      'dash.libLink': 'Library',
      'dash.statVideos': 'Videos',
      'dash.statDocs': 'Documents',
      'dash.statTotal': 'Total',
      'dash.loading': 'Loading files…',
      'dash.loadingShort': 'Loading…',
      'dash.section': 'Available content',
      'dash.searchPh': 'Search a file…',
      'dash.download': 'Download',
      'dash.empty': 'No files available at the moment.',
      'dash.emptyShort': 'No files available.',
      'dash.errLoad': 'Load error: ',
      'dash.err': 'Error: ',
      'dash.privacy': 'Privacy',
      'member': 'Member',
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

    var page = document.body && document.body.getAttribute('data-auth-page');
    if (page === 'login') document.title = t('meta.login');
    else if (page === 'register') document.title = t('meta.register');
    else if (page === 'dashboard') document.title = t('meta.dashboard');

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

  function initSwitcher() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }

  g.ElectroDzAuthI18n = {
    t: function (key) {
      return t(key);
    },
    getLang: function () {
      return lang;
    },
    applyLang: applyLang,
    normalizeLang: normalizeLang,
  };
})(typeof window !== 'undefined' ? window : globalThis);
