/**
 * Configuration SITE WEB uniquement (electro-dz.com).
 * L'application mobile utilisera sa propre config plus tard.
 */
(function (g) {
  'use strict';

  const SCOPE = 'website';
  const SITE_ORIGIN = 'https://electro-dz.com';

  const SUPABASE_URL = 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  /** Clé publique : sb_publishable_… (nouveau) OU eyJ… (legacy anon) — voir supabase/COPIER-CLE-ANON.txt */
  const SUPABASE_ANON_KEY = 'sb_publishable_kEfm0tZfrZ8xXCx_PyWfhg_R93sPJkR';

  /** URLs à copier dans Supabase → Authentication → URL Configuration */
  const SUPABASE_REDIRECT_URLS = [
    'https://electro-dz.com/auth-callback.html',
    'https://www.electro-dz.com/auth-callback.html',
    'https://electro-dz.com/**',
    'https://www.electro-dz.com/**',
    'https://electro-dz.com/oauth/consent',
    'https://electro-dz.com/oauth/consent/',
    'http://localhost:5500/auth-callback.html',
    'http://127.0.0.1:5500/auth-callback.html',
    'http://localhost:8765/auth-callback.html',
  ];

  const SUPABASE_SITE_URL = 'https://electro-dz.com';

  /** Google Cloud / Meta → URI de redirection OAuth (identique Facebook) */
  const GOOGLE_OAUTH_REDIRECT_URI =
    'https://wxiqqcnzcxswdqzubxyt.supabase.co/auth/v1/callback';

  function resolveSiteBase() {
    if (typeof location === 'undefined') return SITE_ORIGIN;
    const host = location.hostname.toLowerCase();
    if (host === 'electro-dz.com' || host === 'www.electro-dz.com') {
      return 'https://electro-dz.com';
    }
    const dir = location.pathname.replace(/\/[^/]*$/, '');
    return location.origin + (dir || '');
  }

  function pageUrl(filename) {
    return resolveSiteBase() + '/' + String(filename).replace(/^\//, '');
  }

  /**
   * PDF protégés (bibliothèque). Mots de passe par défaut :
   * — FET 1–3 : DZSWISS-FET
   * — AE professionnel : DZSWISS-AE
   * Pour changer : SHA-256 du nouveau mot de passe (hex) dans passwordSha256.
   *
   * Accès libre temporaire : jusqu’à libraryFreeUntil (inclus, fin de journée locale).
   */
  const LIBRARY_FREE_UNTIL = '2026-09-16';

  const LIBRARY_PROTECTED = {
    freeUntil: LIBRARY_FREE_UNTIL,
    groups: [
      {
        key: 'fet',
        bookIds: ['fet1-2014', 'fet2-2013', 'fet3-2014'],
        passwordSha256:
          'd5c86339a450038ca96787f78db4edbcef8f6774f0d4518998926bf55c11e9f5',
        labelFr: 'FET 1, 2 et 3',
        labelAr: 'FET 1 و 2 و 3',
        labelEn: 'FET 1, 2 and 3',
      },
      {
        key: 'ae-prof',
        bookIds: ['ae-prof-2019'],
        passwordSha256:
          '071a51aa208c43df5218ec197b713668cbc859d73dd94fa78107c6ed496a7a09',
        labelFr: 'AE professionnel',
        labelAr: 'التكوين المهني AE',
        labelEn: 'AE professional',
      },
    ],
  };

  g.ElectroDzSite = {
    scope: SCOPE,
    siteOrigin: SITE_ORIGIN,
    resolveSiteBase,
    pageUrl,
    libraryProtected: LIBRARY_PROTECTED,
    libraryFreeUntil: LIBRARY_FREE_UNTIL,
    supabase: {
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
      redirectUrls: SUPABASE_REDIRECT_URLS,
      siteUrl: SUPABASE_SITE_URL,
      googleOAuthRedirectUri: GOOGLE_OAUTH_REDIRECT_URI,
    },
    pages: {
      login: 'login.html',
      register: 'register.html',
      dashboard: 'dashboard.html',
      oauthCallback: 'auth-callback.html',
      oauthConsent: 'oauth/consent/',
    },
    url: {
      login: () => pageUrl('login.html'),
      register: () => pageUrl('register.html'),
      dashboard: () => pageUrl('dashboard.html'),
      oauthCallback: () => pageUrl('auth-callback.html'),
      oauthConsent: () => pageUrl('oauth/consent/'),
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
