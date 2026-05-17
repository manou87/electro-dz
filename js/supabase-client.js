/**
 * Client Supabase — SITE WEB uniquement (login, Google, dashboard, compteur).
 * Réglages dashboard : voir supabase/REGLAGES-SUPABASE-SITE.txt
 */
(function (g) {
  'use strict';

  const cfg = g.ElectroDzSite || {};
  const SUPABASE_URL = cfg.supabase?.url || 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  const SUPABASE_ANON_KEY = cfg.supabase?.anonKey || '';

  function oauthCallbackUrl() {
    if (typeof g.location !== 'undefined' && g.location.origin) {
      return g.location.origin + '/auth-callback.html';
    }
    if (cfg.url?.oauthCallback) return cfg.url.oauthCallback();
    return 'https://electro-dz.com/auth-callback.html';
  }

  const POST_AUTH_REDIRECT_KEY = 'electro_post_auth_redirect';

  function redirectAfterAuth() {
    try {
      const saved = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
      if (saved) {
        sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
        return saved;
      }
    } catch (_) {}
    if (typeof g.location !== 'undefined' && g.location.origin) {
      return g.location.origin + '/dashboard.html';
    }
    if (cfg.url?.dashboard) return cfg.url.dashboard();
    return 'https://electro-dz.com/dashboard.html';
  }

  function savePostAuthRedirect(url) {
    if (!url) return;
    try {
      sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, url);
    } catch (_) {}
  }

  let client;

  function getClient() {
    if (!g.supabase) throw new Error('SDK Supabase non chargé');
    if (!SUPABASE_ANON_KEY) throw new Error('Configuration site manquante (site-config.js)');
    if (!client) {
      client = g.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
          storage: typeof g.localStorage !== 'undefined' ? g.localStorage : undefined,
        },
      });
    }
    return client;
  }

  function formatAuthError(error) {
    const msg = error?.msg || error?.message || String(error);
    if (/invalid api key/i.test(msg)) {
      return (
        'Clé API Supabase invalide (site-config.js). ' +
        'Copiez la clé « Publishable » (sb_publishable_…) ou legacy « anon » (eyJ…) : Settings → API Keys.'
      );
    }
    if (/provider is not enabled/i.test(msg)) {
      return (
        'Google n’est pas activé dans Supabase. Ouvrez le dashboard → Authentication → ' +
        'Providers → Google → activer + renseigner Client ID et Secret (Google Cloud).'
      );
    }
    return msg;
  }

  async function signInWithGoogle() {
    const sb = getClient();
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: oauthCallbackUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      const e = new Error(formatAuthError(error));
      e.cause = error;
      throw e;
    }
    if (data?.url) window.location.assign(data.url);
    else throw new Error('Réponse Google vide — vérifiez la config Supabase.');
  }

  g.ElectroDzAuth = {
    scope: 'website',
    url: SUPABASE_URL,
    oauthCallbackUrl,
    redirectAfterAuth,
    savePostAuthRedirect,
    getClient,
    signInWithGoogle,
  };
})(typeof window !== 'undefined' ? window : globalThis);
