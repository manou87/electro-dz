/* Local Electro DZ unlock — Simu PLC Pro only.
 * Force la désactivation des gates FULL / PRO pour rendre utilisables les composants du catalogue.
 * N’ajoute pas de composants ; n’appelle pas le billing live.
 */
(function (global) {
  'use strict';
  var KEY = 'logicsoft_full_v1';

  function forceStorage() {
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
  }

  function applyDom() {
    try {
      global.isFull = true;
      if (document.body) {
        document.body.classList.add('full-mode');
        document.body.classList.remove('show-premium');
      }
      var lock = document.getElementById('lockOverlay');
      if (lock) {
        lock.style.display = 'none';
        lock.setAttribute('aria-hidden', 'true');
      }
      var modal = document.getElementById('modalSoporte');
      if (modal) modal.style.display = 'none';
      var btn = document.getElementById('btnSoporte');
      if (btn) {
        btn.style.display = 'none';
        btn.classList.add('premium-active');
        btn.textContent = 'PRO';
      }
    } catch (_) {}
  }

  function unlock() {
    forceStorage();
    applyDom();
    try {
      if (typeof global.syncFullModeClass === 'function') global.syncFullModeClass();
    } catch (_) {}
    try {
      if (typeof global.activarBloquesFull === 'function') global.activarBloquesFull();
    } catch (_) {}
    try {
      if (typeof global.aplicarFullSinAlerta === 'function') global.aplicarFullSinAlerta();
    } catch (_) {}
  }

  function alwaysTrue() { return true; }

  forceStorage();
  global.isFull = true;
  global.isFullDevice = alwaysTrue;
  global.isProMode = alwaysTrue;

  // Conserver les overrides si des scripts ultérieurs redéfinissent les helpers.
  function rebind() {
    forceStorage();
    global.isFull = true;
    global.isFullDevice = alwaysTrue;
    global.isProMode = alwaysTrue;
    applyDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      unlock();
      rebind();
    });
  } else {
    unlock();
    rebind();
  }
  global.addEventListener('load', function () {
    unlock();
    rebind();
  });
  // Réaffirmer peu après le démarrage (les scripts billing peuvent inverser les flags).
  setTimeout(function () { unlock(); rebind(); }, 0);
  setTimeout(function () { unlock(); rebind(); }, 800);
  setTimeout(function () { unlock(); rebind(); }, 2500);

  global.SimuPLCUnlockProLocal = { unlock: unlock, rebind: rebind, key: KEY };
})(window);
