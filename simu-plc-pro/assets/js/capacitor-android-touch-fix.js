/* Capacitor / Android WebView touch + boot hardening for Simu PLC Pro.
 * - Dismisses stuck boot/splash overlays that can swallow pointer events
 * - Disables service worker (can break asset loads under https://localhost)
 * - Ensures canvas/workspace remain interactive
 */
(function (global) {
  'use strict';

  var ua = String((global.navigator && navigator.userAgent) || '');
  var isCap = !!(global.Capacitor || global.capacitor);
  var isAndroid = /Android/i.test(ua);
  if (!isCap && !isAndroid) return;

  global.__SIMUPLC_ANDROID_WRAPPER__ = true;

  function killServiceWorker() {
    try {
      if (!navigator.serviceWorker) return;
      navigator.serviceWorker.register = function () {
        return Promise.reject(new Error('SW disabled in Android wrapper'));
      };
      if (navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          (regs || []).forEach(function (reg) {
            try { reg.unregister(); } catch (_) {}
          });
        }).catch(function () {});
      }
      if (navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function (reg) {
          if (reg) try { reg.unregister(); } catch (_) {}
        }).catch(function () {});
      }
    } catch (_) {}
  }

  function killBoot() {
    try {
      var root = document.documentElement;
      if (root) root.classList.remove('simuplc-booting');
      var boot = document.getElementById('simuplcBootScreen');
      if (boot) {
        boot.classList.add('simuplc-boot-hide');
        boot.style.pointerEvents = 'none';
        boot.style.display = 'none';
        boot.setAttribute('aria-hidden', 'true');
        if (boot.parentNode) boot.parentNode.removeChild(boot);
      }
      ['lockOverlay', 'splashOverlay'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        el.setAttribute('aria-hidden', 'true');
      });
      if (document.body) {
        document.body.classList.add('full-mode');
        document.body.classList.remove('show-premium');
      }
    } catch (_) {}
  }

  function injectCss() {
    if (document.getElementById('simuplc-android-touch-fix-style')) return;
    var st = document.createElement('style');
    st.id = 'simuplc-android-touch-fix-style';
    st.textContent = [
      'html.simuplc-booting body > *:not(#simuplcBootScreen){visibility:visible!important}',
      '#simuplcBootScreen,#lockOverlay,#splashOverlay{display:none!important;pointer-events:none!important;visibility:hidden!important}',
      'html,body,#canvas,#workspace{touch-action:none;-ms-touch-action:none}',
      '#canvas,#workspace,.node,.component,#sidebar,#wiresSVG{pointer-events:auto!important}',
      '.node,.component,#sidebar{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
      'body.dragging-lib,body.dragging-node{overflow:hidden!important}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  killServiceWorker();
  injectCss();
  killBoot();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectCss();
      killBoot();
    }, { once: true });
  }
  global.addEventListener('load', function () {
    injectCss();
    killBoot();
  }, { once: true });

  [50, 200, 600, 1500, 3000].forEach(function (ms) {
    setTimeout(function () {
      killServiceWorker();
      injectCss();
      killBoot();
    }, ms);
  });
})(window);
