/**
 * Configuration SITE WEB uniquement (electro-dz.com).
 * L'application mobile utilisera sa propre config plus tard.
 */
(function (g) {
  'use strict';

  const SCOPE = 'website';
  const SITE_ORIGIN = 'https://electro-dz.com';

  const SUPABASE_URL = 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aXFxY256Y3hzd2RxenVieHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTQ5NzcsImV4cCI6MjA2MDAzMDk3N30.YFkBDCmHIcTmjRJrYWuMbbfQgQkRIFa6PoLtl7Ml1UE';

  /** URLs à copier dans Supabase → Authentication → URL Configuration */
  const SUPABASE_REDIRECT_URLS = [
    'https://electro-dz.com/auth-callback.html',
    'https://www.electro-dz.com/auth-callback.html',
    'http://localhost:5500/auth-callback.html',
    'http://127.0.0.1:5500/auth-callback.html',
  ];

  const SUPABASE_SITE_URL = 'https://electro-dz.com';

  /** Google Cloud → URI de redirection OAuth */
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

  g.ElectroDzSite = {
    scope: SCOPE,
    siteOrigin: SITE_ORIGIN,
    resolveSiteBase,
    pageUrl,
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
