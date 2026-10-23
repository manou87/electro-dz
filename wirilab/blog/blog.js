/**
 * Bascule cartes / liste sur la page index du blog.
 * Préférence mémorisée dans localStorage (clé wirilab_blog_view).
 */
(function () {
  var list = document.getElementById('blog-list');
  if (!list) return;

  var buttons = document.querySelectorAll('.blog-view-btn');
  var storageKey = 'wirilab_blog_view';

  function applyView(mode) {
    var cards = mode === 'list' ? 'list' : 'cards';
    list.classList.remove('blog-list--cards', 'blog-list--list');
    list.classList.add('blog-list--' + cards);
    buttons.forEach(function (btn) {
      var active = btn.getAttribute('data-view') === cards;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try {
      localStorage.setItem(storageKey, cards);
    } catch (e) {
      /* quota ou mode privé */
    }
  }

  var saved = 'cards';
  try {
    saved = localStorage.getItem(storageKey) || 'cards';
  } catch (e) {
    saved = 'cards';
  }
  if (saved !== 'list') saved = 'cards';
  applyView(saved);

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyView(btn.getAttribute('data-view'));
    });
  });
})();
