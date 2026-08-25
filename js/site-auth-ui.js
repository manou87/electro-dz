/**
 * Affiche l'état connecté (nom + lien dashboard) sur le site public.
 */
(function (g) {
  'use strict';

  const LOGIN_URL = () => g.ElectroDzSite?.url?.login?.() || 'login.html';
  const DASHBOARD_URL = () => g.ElectroDzSite?.url?.dashboard?.() || 'dashboard.html';

  const HUB_LABELS = {
    fr: {
      link: 'Mon profil →',
      desc: 'Connecté — favoris PDF et médias',
    },
    ar: {
      link: 'ملفي →',
      desc: 'متصل — مفضلة PDF ووسائط',
    },
    en: {
      link: 'My profile →',
      desc: 'Signed in — PDF favourites and media',
    },
  };

  let currentUser = null;

  function injectStyles() {
    if (document.getElementById('edz-auth-ui-style')) return;
    const s = document.createElement('style');
    s.id = 'edz-auth-ui-style';
    s.textContent =
      '.nav-extra.edz-auth-off,[data-nav-login].edz-auth-off,[data-nav-register].edz-auth-off{display:none!important}' +
      '.nav-auth:empty{display:none}';
    document.head.appendChild(s);
  }

  function setNavVisible(el, visible) {
    if (!el) return;
    if (visible) {
      el.hidden = false;
      el.classList.remove('edz-auth-off');
      el.removeAttribute('aria-hidden');
    } else {
      el.hidden = true;
      el.classList.add('edz-auth-off');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function getLang() {
    try {
      const s = localStorage.getItem('electrodz-site-lang');
      if (s === 'fr' || s === 'ar' || s === 'en') return s;
    } catch (_) { /* ignore */ }
    const l = (document.documentElement.lang || 'ar').toLowerCase();
    if (l === 'fr' || l === 'en') return l;
    return 'ar';
  }

  function displayName(user) {
    const meta = user?.user_metadata || {};
    const fromMeta = meta.full_name || meta.name;
    if (fromMeta && String(fromMeta).trim()) return String(fromMeta).trim();
    if (user?.email) return user.email.split('@')[0];
    return getLang() === 'ar' ? 'عضو' : getLang() === 'en' ? 'Member' : 'Membre';
  }

  function applyLoggedIn(user) {
    currentUser = user;
    const name = displayName(user);
    const dash = DASHBOARD_URL();

    document.querySelectorAll('[data-nav-login]').forEach((el) => {
      setNavVisible(el, false);
    });
    document.querySelectorAll('[data-nav-register]').forEach((el) => {
      setNavVisible(el, false);
    });
    document.querySelectorAll('[data-nav-dashboard]').forEach((el) => {
      setNavVisible(el, true);
      if (el.tagName === 'A') el.href = dash;
      el.title = user?.email || '';
    });
    document.querySelectorAll('[data-nav-user-name]').forEach((el) => {
      el.textContent = name;
    });

    const lang = getLang();
    const hub = HUB_LABELS[lang] || HUB_LABELS.fr;
    document.querySelectorAll('[data-hub-member]').forEach((el) => {
      if (el.tagName === 'A') el.href = dash;
    });
    document.querySelectorAll('[data-hub-member-link]').forEach((el) => {
      el.textContent = hub.link;
    });
    document.querySelectorAll('[data-hub-member-desc]').forEach((el) => {
      el.textContent = hub.desc;
    });
  }

  function applyLoggedOut() {
    currentUser = null;
    const login = LOGIN_URL();

    document.querySelectorAll('[data-nav-login]').forEach((el) => {
      setNavVisible(el, true);
      if (el.tagName === 'A') el.href = login;
    });
    document.querySelectorAll('[data-nav-register]').forEach((el) => {
      setNavVisible(el, true);
    });
    document.querySelectorAll('[data-nav-dashboard]').forEach((el) => {
      setNavVisible(el, false);
    });

    document.querySelectorAll('[data-hub-member]').forEach((el) => {
      if (el.tagName === 'A') el.href = login;
    });
    document.querySelectorAll('[data-hub-member-link]').forEach((el) => {
      el.setAttribute('data-i18n', 'tools.member.link');
    });
    document.querySelectorAll('[data-hub-member-desc]').forEach((el) => {
      el.setAttribute('data-i18n', 'tools.member.desc');
    });

    if (g.ElectroDzAccueilI18n?.applyLang) {
      g.ElectroDzAccueilI18n.applyLang(getLang());
    }
  }

  function refreshHubLabels() {
    if (currentUser) applyLoggedIn(currentUser);
  }

  async function init() {
    injectStyles();
    if (!g.ElectroDzAuth?.getClient) return;
    let sb;
    try {
      sb = g.ElectroDzAuth.getClient();
    } catch (_) {
      return;
    }

    sb.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user) applyLoggedIn(nextSession.user);
      else applyLoggedOut();
    });

    const {
      data: { session },
    } = await sb.auth.getSession();
    if (session?.user) applyLoggedIn(session.user);
    else applyLoggedOut();

    document.querySelectorAll('.lang-btn[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setTimeout(refreshHubLabels, 0);
      });
    });
  }

  g.ElectroDzAuthUi = {
    refresh: async function () {
      if (!g.ElectroDzAuth?.getClient) return;
      const sb = g.ElectroDzAuth.getClient();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (session?.user) applyLoggedIn(session.user);
      else applyLoggedOut();
    },
    applyLoggedIn,
    applyLoggedOut,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
