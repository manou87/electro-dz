/**
 * Aperçu section au survol (desktop) ou appui long (mobile).
 * Photos via data-preview sur .quick-item dans #outils.
 */
(function () {
  'use strict';

  var grid = document.querySelector('#outils .quick-grid');
  if (!grid) return;

  var peek = document.getElementById('section-peek');
  if (!peek) {
    peek = document.createElement('div');
    peek.id = 'section-peek';
    peek.className = 'section-peek';
    peek.setAttribute('aria-hidden', 'true');
    peek.innerHTML =
      '<div class="section-peek__frame">' +
      '<img id="section-peek-img" src="" alt=""/>' +
      '<span class="section-peek__label" id="section-peek-label"></span>' +
      '</div>';
    document.body.appendChild(peek);
  }

  var peekImg = document.getElementById('section-peek-img');
  var peekLabel = document.getElementById('section-peek-label');
  var items = grid.querySelectorAll('.quick-item[data-preview]');
  if (!items.length) return;

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var activeItem = null;
  var longPressTimer = null;
  var longPressTriggered = false;
  var suppressClick = false;

  function labelFor(item) {
    var el = item.querySelector('.ico-label');
    return el ? el.textContent.trim() : '';
  }

  function positionPeek(anchor) {
    var rect = anchor.getBoundingClientRect();
    var pw = peek.offsetWidth || 300;
    var ph = peek.offsetHeight || 200;
    var margin = 10;
    var left = rect.right + margin;
    var top = rect.top + (rect.height - ph) / 2;

    if (left + pw > window.innerWidth - margin) {
      left = rect.left - pw - margin;
    }
    if (left < margin) {
      left = Math.max(margin, rect.left + (rect.width - pw) / 2);
      top = rect.bottom + margin;
    }
    if (top + ph > window.innerHeight - margin) {
      top = window.innerHeight - ph - margin;
    }
    if (top < margin) top = margin;

    peek.style.left = left + 'px';
    peek.style.top = top + 'px';
  }

  function showPeek(item) {
    var src = item.getAttribute('data-preview');
    if (!src) return;
    activeItem = item;
    item.classList.add('is-peek-active');
    peekImg.src = src;
    peekImg.alt = labelFor(item);
    peekLabel.textContent = labelFor(item);
    peek.classList.add('is-visible');
    peek.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      positionPeek(item);
    });
  }

  function hidePeek() {
    if (activeItem) activeItem.classList.remove('is-peek-active');
    activeItem = null;
    peek.classList.remove('is-visible');
    peek.setAttribute('aria-hidden', 'true');
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  items.forEach(function (item) {
    if (canHover) {
      item.addEventListener('mouseenter', function () {
        showPeek(item);
      });
      item.addEventListener('mouseleave', hidePeek);
      item.addEventListener('focus', function () {
        showPeek(item);
      });
      item.addEventListener('blur', hidePeek);
    } else {
      item.addEventListener(
        'touchstart',
        function () {
          longPressTriggered = false;
          suppressClick = false;
          clearLongPress();
          longPressTimer = setTimeout(function () {
            longPressTriggered = true;
            suppressClick = true;
            showPeek(item);
          }, 480);
        },
        { passive: true }
      );

      item.addEventListener(
        'touchmove',
        function () {
          clearLongPress();
          if (longPressTriggered) hidePeek();
        },
        { passive: true }
      );

      item.addEventListener('touchend', function () {
        clearLongPress();
        if (longPressTriggered) {
          setTimeout(hidePeek, 120);
        }
      });

      item.addEventListener('touchcancel', function () {
        clearLongPress();
        hidePeek();
      });

      item.addEventListener('click', function (e) {
        if (suppressClick) {
          e.preventDefault();
          suppressClick = false;
        }
      });
    }
  });

  window.addEventListener('scroll', hidePeek, { passive: true });
  window.addEventListener(
    'resize',
    function () {
      if (activeItem) positionPeek(activeItem);
    },
    { passive: true }
  );
})();
