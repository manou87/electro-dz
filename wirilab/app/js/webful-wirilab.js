/**
 * Charge le tracker Webful sur l'application web Flutter (même site / clé que la landing).
 */
(function () {
  'use strict';

  var SITE_ID = 'WBF-51072';
  var API_KEY =
    '0e59f5bd5df9ea29e514723bcfd5b2b83e938ea18ccec4248cd2d2fb2430152f';
  var BASE_URL = 'https://webful.fr';

  window.webful =
    window.webful ||
    function () {
      (window.webful.q = window.webful.q || []).push(arguments);
    };

  var s = document.createElement('script');
  s.async = true;
  s.src = BASE_URL + '/tracking/webful-track.js';
  s.setAttribute('data-site-id', SITE_ID);
  s.setAttribute('data-api-key', API_KEY);
  s.setAttribute('data-base-url', BASE_URL);
  document.head.appendChild(s);
})();
