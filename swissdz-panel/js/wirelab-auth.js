/**
 * WireLab — auth Supabase (même projet que electro-dz.com).
 * Réutilise URL + clé publishable du site ; pas de secrets serveur.
 *
 * Env / inject optionnels (sinon défauts site) :
 *   window.__WIRELAB_SUPABASE__ = { url, anonKey }
 *   window.__WIRELAB_OAUTH_REDIRECT__  (shell RN : Linking.createURL('auth-callback'))
 *   EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (injectés par le shell RN)
 *
 * Redirect OAuth (Supabase → Authentication → Redirect URLs) :
 *   wirelab://auth-callback          ← Expo natif / APK (obligatoire)
 *   exp://**/--/auth-callback        ← Expo Go
 *   http://localhost:8777/swissdz-panel/**
 *   http://127.0.0.1:8777/swissdz-panel/**
 *   http://<LAN>:8777/swissdz-panel/**  (web / WebView sans deep link)
 * Ne pas utiliser login.html ni le Site URL marketing comme redirect WireLab.
 *
 * swissdz-rev: v34-auth-stay
 */
(function (g) {
  'use strict';

  var SITE_SUPABASE_URL = 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  /** Clé publishable publique (identique website/js/site-config.js). */
  var SITE_SUPABASE_ANON =
    'sb_publishable_kEfm0tZfrZ8xXCx_PyWfhg_R93sPJkR';

  var STORAGE_KEY_HINT = 'wirelab-auth-email';
  var client = null;
  var currentUser = null;
  var unsubAuth = null;

  function t(key, fallback) {
    try {
      if (g.I18N && typeof g.I18N.t === 'function') {
        var v = g.I18N.t(key);
        if (v && v !== key) return v;
      }
    } catch (_) {}
    return fallback != null ? fallback : key;
  }

  function cfg() {
    var inj = g.__WIRELAB_SUPABASE__ || {};
    var site = (g.ElectroDzSite && g.ElectroDzSite.supabase) || {};
    return {
      url: String(inj.url || site.url || SITE_SUPABASE_URL).trim(),
      anonKey: String(inj.anonKey || site.anonKey || SITE_SUPABASE_ANON).trim(),
    };
  }

  function isExpoShell() {
    try {
      if (g.ReactNativeWebView) return true;
      var html = document.documentElement;
      if (html && html.classList && html.classList.contains('pw-expo')) return true;
      var ua = navigator.userAgent || '';
      return /ExpoGo|WireLabMobile/i.test(ua);
    } catch (_) {
      return false;
    }
  }

  function panelDirUrl() {
    var href = String(g.location && g.location.href || '');
    href = href.replace(/[#?].*$/, '');
    if (/\/[^/]+\.[a-z0-9]+$/i.test(href)) {
      return href.replace(/\/[^/]+$/, '/');
    }
    if (!/\/$/.test(href)) href += '/';
    return href;
  }

  /** Refuse marketing site / login.html comme cible OAuth WireLab. */
  function isForbiddenRedirect(url) {
    var s = String(url || '');
    if (!s) return true;
    if (/\/login\.html/i.test(s)) return true;
    // Site marketing OK seulement si callback panel sous /swissdz-panel/
    if (/electro-dz\.com/i.test(s) && !/\/swissdz-panel\//i.test(s)) return true;
    return false;
  }

  /**
   * Expo / RN WebView → deep link (wirelab:// ou exp:// via inject shell).
   * Web navigateur → auth-callback.html sous le panel (:8777), jamais login.html.
   */
  function oauthCallbackUrl() {
    if (isExpoShell()) {
      var inj = g.__WIRELAB_OAUTH_REDIRECT__;
      if (inj && String(inj).trim() && !isForbiddenRedirect(inj)) {
        return String(inj).trim();
      }
      return 'wirelab://auth-callback';
    }
    var panelCb = panelDirUrl() + 'auth-callback.html';
    if (isForbiddenRedirect(panelCb)) {
      return 'http://127.0.0.1:8777/swissdz-panel/auth-callback.html';
    }
    return panelCb;
  }

  function getClient() {
    if (!g.supabase || typeof g.supabase.createClient !== 'function') {
      throw new Error('SDK Supabase non chargé');
    }
    var c = cfg();
    if (!c.anonKey) throw new Error('Clé Supabase manquante');
    if (!client) {
      client = g.supabase.createClient(c.url, c.anonKey, {
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

  function displayName(user) {
    var meta = (user && user.user_metadata) || {};
    var fromMeta = meta.full_name || meta.name;
    if (fromMeta && String(fromMeta).trim()) return String(fromMeta).trim();
    if (user && user.email) return String(user.email).split('@')[0];
    if (user && user.phone) return String(user.phone);
    return t('authMember', 'Membre');
  }

  function setMsg(html, type) {
    var el = document.getElementById('wlAuthMsg');
    if (!el) return;
    if (!html) {
      el.hidden = true;
      el.textContent = '';
      el.className = 'wl-auth-msg';
      return;
    }
    el.hidden = false;
    el.className = 'wl-auth-msg ' + (type || '');
    el.textContent = html;
  }

  function syncUi() {
    var btn = document.getElementById('btnSignIn');
    var signed = document.getElementById('wlAuthSigned');
    var form = document.getElementById('wlAuthForm');
    var emailEl = document.getElementById('wlAuthEmailLabel');
    var nameEl = document.getElementById('wlAuthUserName');

    if (btn) {
      if (currentUser) {
        btn.setAttribute('data-i18n', 'btnSignedIn');
        btn.textContent = t('btnSignedIn', 'Compte');
        btn.title = currentUser.email || displayName(currentUser);
        btn.setAttribute('data-i18n-title', 'btnSignedInTitle');
      } else {
        btn.setAttribute('data-i18n', 'btnSignIn');
        btn.textContent = t('btnSignIn', 'Connexion');
        btn.title = t('btnSignInTitle', 'Connexion Google ou e-mail');
        btn.setAttribute('data-i18n-title', 'btnSignInTitle');
      }
    }

    if (signed) signed.hidden = !currentUser;
    if (form) form.hidden = !!currentUser;
    if (nameEl && currentUser) nameEl.textContent = displayName(currentUser);
    if (emailEl && currentUser) {
      emailEl.textContent = currentUser.email || currentUser.phone || '';
    }

    var expoNote = document.getElementById('wlAuthExpoNote');
    if (expoNote) expoNote.hidden = !isExpoShell() || !!currentUser;
  }

  function openModal() {
    var modal = document.getElementById('wlAuthModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setMsg('');
    syncUi();
    try {
      var saved = localStorage.getItem(STORAGE_KEY_HINT);
      var input = document.getElementById('wlAuthEmail');
      if (saved && input && !input.value) input.value = saved;
    } catch (_) {}
  }

  function closeModal() {
    var modal = document.getElementById('wlAuthModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function applySession(session) {
    currentUser = (session && session.user) || null;
    syncUi();
  }

  async function refreshSession() {
    var sb = getClient();
    var res = await sb.auth.getSession();
    await applySession(res.data && res.data.session);
  }

  async function signInWithPassword(email, password) {
    var sb = getClient();
    var res = await sb.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || ''),
    });
    if (res.error) throw res.error;
    try {
      localStorage.setItem(STORAGE_KEY_HINT, String(email || '').trim());
    } catch (_) {}
    await applySession(res.data && res.data.session);
    closeModal();
  }

  async function signInWithMagicLink(email) {
    var sb = getClient();
    var redirectTo = oauthCallbackUrl();
    var res = await sb.auth.signInWithOtp({
      email: String(email || '').trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (res.error) throw res.error;
    try {
      localStorage.setItem(STORAGE_KEY_HINT, String(email || '').trim());
    } catch (_) {}
  }

  function postNative(payload) {
    try {
      if (g.ReactNativeWebView && typeof g.ReactNativeWebView.postMessage === 'function') {
        g.ReactNativeWebView.postMessage(JSON.stringify(payload));
        return true;
      }
    } catch (_) {}
    return false;
  }

  async function signInWithGoogle() {
    var sb = getClient();
    var redirectTo = oauthCallbackUrl();
    var expo = isExpoShell();

    if (expo) {
      var started = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (started.error) throw started.error;
      if (!started.data || !started.data.url) {
        throw new Error('Réponse OAuth vide');
      }
      var handed = postNative({
        type: 'wirelab/authOAuth',
        url: started.data.url,
        redirectTo: redirectTo,
      });
      if (!handed) {
        throw new Error(
          t(
            'authExpoGoogleStub',
            'Google sur Expo : le shell natif doit ouvrir la session OAuth (redirect à autoriser dans Supabase). Utilisez l’e-mail en attendant.'
          )
        );
      }
      setMsg(
        t(
          'authExpoGoogleWait',
          'Ouverture Google… Si rien ne se passe, utilisez e-mail / mot de passe.'
        ),
        'info'
      );
      return;
    }

    var res = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    if (res.error) throw res.error;
    if (res.data && res.data.url) {
      g.location.assign(res.data.url);
      return;
    }
    throw new Error('Réponse OAuth vide');
  }

  async function exchangeCode(code) {
    if (!code) return;
    var sb = getClient();
    var res = await sb.auth.exchangeCodeForSession(String(code));
    if (res.error) throw res.error;
    await applySession(res.data && res.data.session);
    closeModal();
  }

  async function signOut() {
    var sb = getClient();
    await sb.auth.signOut();
    currentUser = null;
    syncUi();
  }

  function bindUi() {
    var btn = document.getElementById('btnSignIn');
    if (btn && !btn.dataset.wlAuthBound) {
      btn.dataset.wlAuthBound = '1';
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        openModal();
      });
    }

    var closeBtn = document.getElementById('wlAuthClose');
    if (closeBtn && !closeBtn.dataset.wlAuthBound) {
      closeBtn.dataset.wlAuthBound = '1';
      closeBtn.addEventListener('click', closeModal);
    }

    var backdrop = document.getElementById('wlAuthModal');
    if (backdrop && !backdrop.dataset.wlAuthBound) {
      backdrop.dataset.wlAuthBound = '1';
      backdrop.addEventListener('click', function (ev) {
        if (ev.target === backdrop) closeModal();
      });
    }

    var googleBtn = document.getElementById('wlAuthGoogle');
    if (googleBtn && !googleBtn.dataset.wlAuthBound) {
      googleBtn.dataset.wlAuthBound = '1';
      googleBtn.addEventListener('click', async function () {
        googleBtn.disabled = true;
        setMsg('');
        try {
          await signInWithGoogle();
        } catch (err) {
          setMsg(err && err.message ? err.message : String(err), 'err');
        } finally {
          googleBtn.disabled = false;
        }
      });
    }

    var form = document.getElementById('wlAuthForm');
    if (form && !form.dataset.wlAuthBound) {
      form.dataset.wlAuthBound = '1';
      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var email = document.getElementById('wlAuthEmail');
        var pwd = document.getElementById('wlAuthPassword');
        var submit = document.getElementById('wlAuthSubmit');
        if (!email || !pwd) return;
        if (submit) submit.disabled = true;
        setMsg('');
        try {
          await signInWithPassword(email.value, pwd.value);
        } catch (err) {
          setMsg(
            t('authErrCreds', 'E-mail ou mot de passe incorrect.'),
            'err'
          );
        } finally {
          if (submit) submit.disabled = false;
        }
      });
    }

    var magicBtn = document.getElementById('wlAuthMagic');
    if (magicBtn && !magicBtn.dataset.wlAuthBound) {
      magicBtn.dataset.wlAuthBound = '1';
      magicBtn.addEventListener('click', async function () {
        var email = document.getElementById('wlAuthEmail');
        if (!email || !String(email.value || '').trim()) {
          setMsg(t('authNeedEmail', 'Indiquez votre e-mail.'), 'err');
          return;
        }
        magicBtn.disabled = true;
        setMsg('');
        try {
          await signInWithMagicLink(email.value);
          setMsg(
            t(
              'authMagicSent',
              'Lien envoyé. Ouvrez l’e-mail puis revenez ici (même appareil / navigateur).'
            ),
            'ok'
          );
        } catch (err) {
          setMsg(err && err.message ? err.message : String(err), 'err');
        } finally {
          magicBtn.disabled = false;
        }
      });
    }

    var outBtn = document.getElementById('wlAuthSignOut');
    if (outBtn && !outBtn.dataset.wlAuthBound) {
      outBtn.dataset.wlAuthBound = '1';
      outBtn.addEventListener('click', async function () {
        outBtn.disabled = true;
        try {
          await signOut();
          setMsg(t('authSignedOut', 'Déconnecté.'), 'ok');
        } catch (err) {
          setMsg(err && err.message ? err.message : String(err), 'err');
        } finally {
          outBtn.disabled = false;
        }
      });
    }

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeModal();
    });
  }

  async function init() {
    bindUi();
    try {
      var sb = getClient();
      if (unsubAuth) {
        try {
          unsubAuth();
        } catch (_) {}
      }
      var sub = sb.auth.onAuthStateChange(function (_evt, session) {
        applySession(session);
      });
      unsubAuth =
        sub &&
        sub.data &&
        sub.data.subscription &&
        typeof sub.data.subscription.unsubscribe === 'function'
          ? function () {
              sub.data.subscription.unsubscribe();
            }
          : null;
      await refreshSession();
    } catch (err) {
      console.warn('[wirelab-auth]', err && err.message ? err.message : err);
      syncUi();
    }

    async function applyTokensFromHashOrSearch(rawUrl) {
      var u;
      try {
        u = new URL(String(rawUrl));
      } catch (_) {
        u = new URL(String(rawUrl), panelDirUrl());
      }
      var code = u.searchParams.get('code');
      if (code) {
        await exchangeCode(code);
        return true;
      }
      var hash = u.hash ? String(u.hash).replace(/^#/, '') : '';
      if (!hash) return false;
      var hp = new URLSearchParams(hash);
      var at = hp.get('access_token');
      var rt = hp.get('refresh_token');
      if (!at || !rt) return false;
      var sb = getClient();
      var res = await sb.auth.setSession({
        access_token: at,
        refresh_token: rt,
      });
      if (res.error) throw res.error;
      await applySession(res.data && res.data.session);
      closeModal();
      return true;
    }

    g.wirelabReceiveAuthCallback = async function (payload) {
      try {
        if (!payload) return;
        if (payload.code) {
          await exchangeCode(payload.code);
          return;
        }
        if (payload.access_token && payload.refresh_token) {
          var sb = getClient();
          var res = await sb.auth.setSession({
            access_token: String(payload.access_token),
            refresh_token: String(payload.refresh_token),
          });
          if (res.error) throw res.error;
          await applySession(res.data && res.data.session);
          closeModal();
          return;
        }
        if (payload.url) {
          var ok = await applyTokensFromHashOrSearch(payload.url);
          if (!ok) {
            throw new Error(
              'Retour OAuth sans code. Vérifiez Redirect URLs (wirelab://auth-callback).'
            );
          }
        }
      } catch (err) {
        openModal();
        setMsg(err && err.message ? err.message : String(err), 'err');
      }
    };
  }

  g.WireLabAuth = {
    open: openModal,
    close: closeModal,
    getUser: function () {
      return currentUser;
    },
    refresh: refreshSession,
    signOut: signOut,
    oauthCallbackUrl: oauthCallbackUrl,
    exchangeCode: exchangeCode,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
