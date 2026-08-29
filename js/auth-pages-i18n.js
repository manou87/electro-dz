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
      'login.googleHint': 'Connexion rapide avec Google, Facebook ou le téléphone',
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
      'login.errGoogleTitle': 'Connexion',
      'login.privacy': 'Confidentialité',
      'register.title': 'Créer un compte',
      'register.sub': 'Vidéos, cours et documents exclusifs',
      'register.featVideos': 'Vidéos',
      'register.featPdf': 'PDF',
      'register.featCalc': 'Calculs',
      'register.googleHint': 'Inscription rapide avec Google, Facebook ou le téléphone',
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
      'auth.facebook': 'Continuer avec Facebook',
      'auth.phone': 'Continuer avec le téléphone',
      'auth.phonePh': '0555 12 34 56',
      'auth.phoneSend': 'Envoyer le code SMS',
      'auth.phoneSending': 'Envoi du SMS…',
      'auth.phoneOtp': 'Code SMS',
      'auth.phoneOtpPh': '123456',
      'auth.phoneVerify': 'Valider le code',
      'auth.phoneVerifying': 'Vérification…',
      'auth.phoneHint':
        'Un code SMS sera envoyé. Indicatif Algérie (+213) par défaut.',
      'auth.smsSent': 'Code envoyé. Saisissez le SMS reçu.',
      'auth.errFacebook':
        'Facebook indisponible. Activez le provider Facebook dans Supabase (App ID + Secret Meta).',
      'auth.errPhone':
        'SMS indisponible. Activez Phone dans Supabase et branchez un fournisseur SMS (Twilio) ou un numéro de test.',
      'auth.errPhoneFormat': 'Numéro invalide. Exemple Algérie : 0555 12 34 56 ou +213555123456.',
      'auth.errOtp': 'Code SMS invalide ou expiré.',
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
      'login.googleHint': 'دخول سريع عبر Google أو فيسبوك أو الهاتف',
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
      'login.errGoogleTitle': 'تسجيل الدخول',
      'login.privacy': 'الخصوصية',
      'register.title': 'إنشاء حساب',
      'register.sub': 'فيديوهات ودروس ومستندات حصرية',
      'register.featVideos': 'فيديوهات',
      'register.featPdf': 'PDF',
      'register.featCalc': 'حسابات',
      'register.googleHint': 'تسجيل سريع عبر Google أو فيسبوك أو الهاتف',
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
      'auth.facebook': 'المتابعة مع فيسبوك',
      'auth.phone': 'المتابعة برقم الهاتف',
      'auth.phonePh': '0555 12 34 56',
      'auth.phoneSend': 'إرسال رمز SMS',
      'auth.phoneSending': 'جاري إرسال SMS…',
      'auth.phoneOtp': 'رمز SMS',
      'auth.phoneOtpPh': '123456',
      'auth.phoneVerify': 'تأكيد الرمز',
      'auth.phoneVerifying': 'جاري التحقق…',
      'auth.phoneHint':
        'سيتم إرسال رمز SMS. رمز الجزائر (+213) افتراضيًا.',
      'auth.smsSent': 'تم إرسال الرمز. أدخل رمز SMS.',
      'auth.errFacebook':
        'فيسبوك غير متاح. فعّل مزوّد Facebook في Supabase (App ID و Secret من Meta).',
      'auth.errPhone':
        'SMS غير متاح. فعّل Phone في Supabase واربط مزوّد SMS (Twilio) أو رقم تجريبي.',
      'auth.errPhoneFormat': 'رقم غير صالح. مثال الجزائر: 0555 12 34 56 أو +213555123456.',
      'auth.errOtp': 'رمز SMS غير صالح أو منتهٍ.',
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
      'login.googleHint': 'Quick sign-in with Google, Facebook or phone',
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
      'login.errGoogleTitle': 'Sign in',
      'login.privacy': 'Privacy',
      'register.title': 'Create an account',
      'register.sub': 'Exclusive videos, courses and documents',
      'register.featVideos': 'Videos',
      'register.featPdf': 'PDF',
      'register.featCalc': 'Calculations',
      'register.googleHint': 'Quick sign-up with Google, Facebook or phone',
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
      'auth.facebook': 'Continue with Facebook',
      'auth.phone': 'Continue with phone',
      'auth.phonePh': '0555 12 34 56',
      'auth.phoneSend': 'Send SMS code',
      'auth.phoneSending': 'Sending SMS…',
      'auth.phoneOtp': 'SMS code',
      'auth.phoneOtpPh': '123456',
      'auth.phoneVerify': 'Verify code',
      'auth.phoneVerifying': 'Verifying…',
      'auth.phoneHint':
        'An SMS code will be sent. Algeria country code (+213) by default.',
      'auth.smsSent': 'Code sent. Enter the SMS you received.',
      'auth.errFacebook':
        'Facebook unavailable. Enable the Facebook provider in Supabase (Meta App ID + Secret).',
      'auth.errPhone':
        'SMS unavailable. Enable Phone in Supabase and connect an SMS provider (Twilio) or a test number.',
      'auth.errPhoneFormat': 'Invalid number. Algeria example: 0555 12 34 56 or +213555123456.',
      'auth.errOtp': 'Invalid or expired SMS code.',
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
