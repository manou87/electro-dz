/**
 * Pages vues supplémentaires pour l'app Flutter (navigation sans rechargement HTML).
 * Réutilise la session Webful (localStorage webful_sid) créée par webful-track.js.
 */
(function () {
  'use strict';

  var API_KEY =
    '0e59f5bd5df9ea29e514723bcfd5b2b83e938ea18ccec4248cd2d2fb2430152f';
  var BASE_URL = 'https://webful.fr';
  var SESSION_KEY = 'webful_sid';
  var SESSION_LAST_KEY = 'webful_sid_last';

  var derniereUrl = '';

  function lireSession() {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (e) {
      return null;
    }
  }

  function touchSession() {
    try {
      localStorage.setItem(SESSION_LAST_KEY, String(Date.now()));
    } catch (e) {}
  }

  function envoyerPageVue() {
    var href = window.location.href;
    if (!href || href === derniereUrl) return;
    var sid = lireSession();
    if (!sid) return;
    derniereUrl = href;

    var payload = {
      api_key: API_KEY,
      url_page: href,
      page_title: document.title || null,
      referrer: null,
      session_id: sid,
      temps_passe: 0,
      user_agent: navigator.userAgent,
    };

    touchSession();

    if (typeof fetch !== 'undefined') {
      fetch(BASE_URL + '/api/track.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        referrerPolicy: 'origin',
        credentials: 'include',
      }).catch(function () {});
    }
  }

  function planifier() {
    window.setTimeout(envoyerPageVue, 120);
  }

  window.addEventListener('hashchange', planifier);
  window.addEventListener('popstate', planifier);

  // Flutter peut mettre à jour l'URL sans toujours émettre hashchange.
  var intervalle = window.setInterval(function () {
    if (window.location.href !== derniereUrl && lireSession()) {
      envoyerPageVue();
    }
  }, 2000);

  window.addEventListener('beforeunload', function () {
    window.clearInterval(intervalle);
  });
})();
