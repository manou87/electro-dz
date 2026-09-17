/**
 * Plein écran simulateur (iframe) : Fullscreen API + repli CSS (iOS Safari).
 * Sortie : bouton toggle, gros bouton Fermer, Escape.
 */
(function (g) {
  'use strict';

  function fsNode() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isIosLike() {
    var ua = navigator.userAgent || '';
    if (/iP(ad|hone|od)/.test(ua)) return true;
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
    return false;
  }

  function requestNative(el) {
    try {
      if (el.requestFullscreen) return el.requestFullscreen.call(el);
      if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        return Promise.resolve();
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.reject(new Error('fullscreen-unsupported'));
  }

  function exitNative() {
    try {
      if (document.exitFullscreen) return document.exitFullscreen();
      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        return Promise.resolve();
      }
    } catch (err) {}
    return Promise.resolve();
  }

  function init(opts) {
    opts = opts || {};
    var wrap =
      document.getElementById(opts.wrapId || 'simFrameWrap') ||
      document.querySelector('.sim-frame-wrap');
    var toggle = document.getElementById(opts.toggleId || 'simFsToggle');
    var closeBtn = document.getElementById(opts.closeId || 'simFsClose');
    if (!wrap) return;

    var usingFallback = false;

    function isOn() {
      return document.documentElement.classList.contains('sim-is-fs');
    }

    function clearFallbackBox() {
      wrap.style.top = '';
      wrap.style.left = '';
      wrap.style.right = '';
      wrap.style.bottom = '';
      wrap.style.width = '';
      wrap.style.height = '';
      wrap.style.inset = '';
    }

    function fitFallback() {
      if (!usingFallback || !isOn()) {
        if (!usingFallback) clearFallbackBox();
        return;
      }
      var vv = window.visualViewport;
      if (!vv) return;
      wrap.style.inset = 'auto';
      wrap.style.top = Math.round(vv.offsetTop) + 'px';
      wrap.style.left = Math.round(vv.offsetLeft) + 'px';
      wrap.style.right = 'auto';
      wrap.style.bottom = 'auto';
      wrap.style.width = Math.round(vv.width) + 'px';
      wrap.style.height = Math.round(vv.height) + 'px';
    }

    function setOn(on, fallback) {
      usingFallback = !!(on && fallback);
      document.documentElement.classList.toggle('sim-is-fs', on);
      document.documentElement.classList.toggle('sim-is-fs-fallback', usingFallback);
      document.body.classList.toggle('sim-is-fs', on);
      document.body.classList.toggle('sim-is-fs-fallback', usingFallback);
      if (toggle) toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (!on) clearFallbackBox();
      else if (usingFallback) fitFallback();
    }

    function enter() {
      setOn(true, true);
      if (isIosLike()) return;
      var p = requestNative(wrap);
      if (p && typeof p.then === 'function') {
        p.then(function () {
          if (fsNode() === wrap) setOn(true, false);
        }).catch(function () {
          setOn(true, true);
        });
      }
    }

    function leave() {
      var native = fsNode();
      setOn(false, false);
      if (native) exitNative();
    }

    function toggleFs() {
      if (isOn()) leave();
      else enter();
    }

    if (toggle) toggle.addEventListener('click', toggleFs);
    if (closeBtn) closeBtn.addEventListener('click', leave);

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOn()) {
        e.preventDefault();
        leave();
      }
    });

    function onFsChange() {
      if (!fsNode() && isOn() && !usingFallback) leave();
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitFallback);
      window.visualViewport.addEventListener('scroll', fitFallback);
    }
    window.addEventListener('orientationchange', function () {
      setTimeout(fitFallback, 250);
      setTimeout(fitFallback, 700);
    });
    window.addEventListener('resize', fitFallback);
  }

  g.ElectroDzSimFullscreen = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})(window);
