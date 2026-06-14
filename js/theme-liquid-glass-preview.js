/**
 * Active le thème Liquid Glass en preview locale uniquement (?glass=1).
 * N'affecte pas le site en ligne sans ce paramètre.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  if (!params.has('glass')) return;

  var SLIDES = [
    'assets/hero/glass-slide-1.svg',
    'assets/hero/glass-slide-2.svg',
    'assets/hero/glass-slide-3.svg',
    'assets/hero/glass-slide-4.svg',
  ];

  function enableStylesheet() {
    var link = document.getElementById('lg-theme-css');
    if (link) link.disabled = false;
    document.documentElement.classList.add('theme-liquid-glass');
  }

  function injectBackground() {
    var bg = document.createElement('div');
    bg.className = 'lg-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML =
      '<div class="lg-blob lg-blob--1"></div>' +
      '<div class="lg-blob lg-blob--2"></div>' +
      '<div class="lg-blob lg-blob--3"></div>';
    document.body.insertBefore(bg, document.body.firstChild);
  }

  function buildHeroCarousel(hero) {
    if (!hero || hero.dataset.lgDone) return;
    hero.dataset.lgDone = '1';

    var wrap = document.createElement('div');
    wrap.className = 'lg-hero-wrap';

    var carousel = document.createElement('div');
    carousel.className = 'lg-hero-carousel';
    carousel.setAttribute('aria-hidden', 'true');

    SLIDES.forEach(function (src, i) {
      var slide = document.createElement('div');
      slide.className = 'lg-hero-slide' + (i === 0 ? ' is-active' : '');
      slide.style.backgroundImage = "url('" + src + "')";
      carousel.appendChild(slide);
    });

    var dots = document.createElement('div');
    dots.className = 'lg-hero-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Hero slides');

    SLIDES.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'lg-hero-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
        resetTimer();
      });
      dots.appendChild(dot);
    });

    carousel.appendChild(dots);

    var glass = document.createElement('div');
    glass.className = 'lg-hero-glass';
    while (hero.firstChild) glass.appendChild(hero.firstChild);

    wrap.appendChild(carousel);
    wrap.appendChild(glass);
    hero.replaceWith(wrap);

    var slideEls = carousel.querySelectorAll('.lg-hero-slide');
    var dotEls = carousel.querySelectorAll('.lg-hero-dot');
    var idx = 0;
    var timer;

    function goTo(n) {
      idx = n;
      slideEls.forEach(function (el, i) {
        el.classList.toggle('is-active', i === idx);
      });
      dotEls.forEach(function (el, i) {
        el.classList.toggle('is-active', i === idx);
      });
    }

    function tick() {
      goTo((idx + 1) % SLIDES.length);
    }

    function resetTimer() {
      clearInterval(timer);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(tick, 5500);
    }

    resetTimer();
  }

  function injectBadge() {
    var badge = document.createElement('div');
    badge.className = 'lg-preview-badge';
    badge.textContent = 'Preview · Liquid Glass';
    document.body.appendChild(badge);
  }

  function init() {
    enableStylesheet();
    injectBackground();
    buildHeroCarousel(document.querySelector('.hero'));
    injectBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
