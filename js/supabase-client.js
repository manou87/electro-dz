/**
 * Client Supabase — SITE WEB uniquement (login, Google, Facebook, téléphone, dashboard).
 * Réglages dashboard : voir supabase/REGLAGES-SUPABASE-SITE.txt
 * TikTok n’est pas un provider natif Supabase (voir le même fichier).
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

  function formatAuthError(error, provider) {
    const msg = error?.msg || error?.message || String(error);
    if (/invalid api key/i.test(msg)) {
      return (
        'Clé API Supabase invalide (site-config.js). ' +
        'Copiez la clé « Publishable » (sb_publishable_…) ou legacy « anon » (eyJ…) : Settings → API Keys.'
      );
    }
    if (/provider is not enabled|unsupported provider/i.test(msg)) {
      if (provider === 'facebook') {
        return (
          'Facebook n’est pas activé dans Supabase. Dashboard → Authentication → ' +
          'Providers → Facebook → activer, coller App ID et App Secret (Meta for Developers), ' +
          'puis URI de redirection : https://wxiqqcnzcxswdqzubxyt.supabase.co/auth/v1/callback'
        );
      }
      if (provider === 'phone') {
        return (
          'La connexion par SMS n’est pas activée. Dashboard → Authentication → Providers → Phone → ' +
          'activer + brancher un fournisseur SMS (Twilio, etc.) ou un numéro de test.'
        );
      }
      return (
        'Google n’est pas activé dans Supabase. Ouvrez le dashboard → Authentication → ' +
        'Providers → Google → activer + renseigner Client ID et Secret (Google Cloud).'
      );
    }
    if (/unsupported phone|phone provider|sms provider|phone.*not.*enabled/i.test(msg)) {
      return (
        'La connexion par SMS n’est pas activée. Dashboard → Authentication → Providers → Phone → ' +
        'activer + brancher un fournisseur SMS (Twilio, etc.) ou un numéro de test.'
      );
    }
    if (/captcha/i.test(msg)) {
      return (
        'Supabase exige un captcha pour les SMS. Dashboard → Authentication → Bot and Abuse Protection, ' +
        'ou ajoutez un numéro de test (Phone → Test phone numbers) le temps de valider.'
      );
    }
    if (/error sending confirmation sms|sms/i.test(msg) && /send|deliver/i.test(msg)) {
      return (
        'SMS non envoyé. Vérifiez le fournisseur SMS dans Supabase (Twilio…) et le format E.164 (+213…).'
      );
    }
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      if (provider === 'phone') {
        return (
          'SMS impossible pour le moment. Activez Phone dans Supabase (Authentication → Providers) ' +
          'et branchez Twilio, ou ajoutez un numéro de test.'
        );
      }
      if (provider === 'facebook') {
        return (
          'Facebook n’est pas activé dans Supabase. Dashboard → Authentication → Providers → Facebook.'
        );
      }
    }
    return msg;
  }

  async function assertProviderEnabled(provider) {
    try {
      const res = await fetch(SUPABASE_URL + '/auth/v1/settings', {
        headers: { apikey: SUPABASE_ANON_KEY },
      });
      if (!res.ok) return;
      const settings = await res.json();
      if (settings?.external && settings.external[provider] === false) {
        const err = new Error(
          formatAuthError({ message: 'Unsupported provider: provider is not enabled' }, provider)
        );
        err.code = 'provider_disabled';
        throw err;
      }
    } catch (e) {
      if (e.code === 'provider_disabled') throw e;
    }
  }

  async function signInWithOAuth(provider) {
    await assertProviderEnabled(provider);
    const sb = getClient();
    const options = { redirectTo: oauthCallbackUrl() };
    if (provider === 'google') {
      options.queryParams = { access_type: 'offline', prompt: 'select_account' };
    }
    if (provider === 'facebook') {
      options.scopes = 'email,public_profile';
    }
    const { data, error } = await sb.auth.signInWithOAuth({ provider, options });
    if (error) {
      const e = new Error(formatAuthError(error, provider));
      e.cause = error;
      throw e;
    }
    if (data?.url) window.location.assign(data.url);
    else throw new Error('Réponse OAuth vide — vérifiez la config Supabase (' + provider + ').');
  }

  async function signInWithGoogle() {
    return signInWithOAuth('google');
  }

  async function signInWithFacebook() {
    return signInWithOAuth('facebook');
  }

  /**
   * Normalise un numéro vers E.164 (+213555123456).
   * Accepte 0555…, 555…, +213555…, 213555…
   */
  function formatPhoneE164(raw, defaultCc) {
    let n = String(raw || '').trim().replace(/[\s.\-()]/g, '');
    if (!n) return '';
    const cc = String(defaultCc || '+213').replace(/\s/g, '');
    if (n.startsWith('00')) n = '+' + n.slice(2);
    if (n.startsWith('+')) {
      return /^\+[1-9]\d{6,14}$/.test(n) ? n : '';
    }
    if (n.startsWith('0')) n = n.replace(/^0+/, '');
    const digitsOnly = n.replace(/\D/g, '');
    const ccDigits = cc.replace(/\D/g, '');
    if (digitsOnly.startsWith(ccDigits) && digitsOnly.length > ccDigits.length + 5) {
      const full = '+' + digitsOnly;
      return /^\+[1-9]\d{6,14}$/.test(full) ? full : '';
    }
    const full = cc + digitsOnly;
    return /^\+[1-9]\d{6,14}$/.test(full) ? full : '';
  }

  async function sendPhoneOtp(phoneE164) {
    await assertProviderEnabled('phone');
    const sb = getClient();
    const { error } = await sb.auth.signInWithOtp({
      phone: phoneE164,
      options: { channel: 'sms' },
    });
    if (error) {
      const e = new Error(formatAuthError(error, 'phone'));
      e.cause = error;
      throw e;
    }
  }

  async function verifyPhoneOtp(phoneE164, token) {
    const sb = getClient();
    const { data, error } = await sb.auth.verifyOtp({
      phone: phoneE164,
      token: String(token || '').trim(),
      type: 'sms',
    });
    if (error) {
      const e = new Error(formatAuthError(error, 'phone'));
      e.cause = error;
      throw e;
    }
    if (!data?.session) {
      throw new Error('Code SMS invalide ou expiré.');
    }
    return data.session;
  }

  g.ElectroDzAuth = {
    scope: 'website',
    url: SUPABASE_URL,
    oauthCallbackUrl,
    redirectAfterAuth,
    savePostAuthRedirect,
    getClient,
    signInWithGoogle,
    signInWithFacebook,
    formatPhoneE164,
    sendPhoneOtp,
    verifyPhoneOtp,
    formatAuthError,
  };
})(typeof window !== 'undefined' ? window : globalThis);
