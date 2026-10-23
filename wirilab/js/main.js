// =============================================================================
// WiriLab landing v2 — zéro dépendance.
// 1. Hero : vidéo MP4 en boucle.
// 2. Étape 01 : vidéo câblage.
// 3. Apparition douce des blocs au scroll (IntersectionObserver).
// 4. Offres : Premium USD (mensuel / annuel −20 %) + 3 packs Établissement
//    annuels (Découverte, Standard, Campus sur devis).
// =============================================================================

/* ------------------------ Apparition au scroll --------------------------- */
(function revealOnScroll() {
  const targets = document.querySelectorAll(
    '.panel, .card, .feature-card, .price-card, .showcase-card, .hero-pillar, .collage img, .progress-strip, .final-cta-inner, .simulation-block',
  );
  targets.forEach((el) => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  targets.forEach((el) => obs.observe(el));
})();

/* ----- Offres : Premium USD + packs Établissement (mensuel et annuel) ---- */
(function priceSliders() {
  const globalToggle = document.getElementById('billing-global');
  let yearly = false;

  // Détail packs : js/etab-packs.js + #etab-pack-config dans index.html.

  const syncPremium = () => {
    document.querySelectorAll('[data-premium]').forEach((el) => {
      const monthly = Number(el.dataset.monthly || 7);
      const total = yearly ? Math.round(monthly * 12 * 0.8) : monthly;
      const totalEl = el.querySelector('[data-premium-total]');
      const periodEl = el.querySelector('[data-period-label]');
      if (totalEl) totalEl.textContent = String(total);
      if (periodEl) periodEl.textContent = yearly ? 'an' : 'mois';
    });
    const cta = document.getElementById('cta-premium');
    if (cta) {
      cta.href = yearly
        ? 'app/?checkout=premium&yearly=1'
        : 'app/?checkout=premium';
    }
  };

  const syncPacks = () => {
    if (typeof window.wirilabSyncEtabPacks === 'function') {
      window.wirilabSyncEtabPacks();
    }
  };

  const syncAll = () => {
    syncPremium();
    syncPacks();
  };

  if (globalToggle) {
    const hint = document.getElementById('billing-discount-hint');
    globalToggle.querySelectorAll('button[data-period]').forEach((btn) => {
      btn.addEventListener('click', () => {
        yearly = btn.getAttribute('data-period') === 'year';
        globalToggle.querySelectorAll('button').forEach((b) => {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        if (hint) hint.classList.toggle('is-active', yearly);
        syncAll();
      });
    });
  }

  const packBox = document.querySelector('[data-pack-slider]');
  if (packBox) {
    const range = packBox.querySelector('input[type="range"]');
    if (range) {
      range.addEventListener('input', syncPacks);
    }
  }

  syncAll();
})();

/* ----- Langue : FR / EN / ES, mémorisée pour l'application -------------- */
(function landingLanguage() {
  const KEY = 'wirilab.locale';
  const labels = {
    fr: {
      navHow: 'Comment ça marche',
      navLearn: 'Apprentissage',
      navTrain: 'Formation',
      navOffers: 'Offres',
      navStart: 'Commencer gratuitement',
    },
    en: {
      navHow: 'How it works',
      navLearn: 'Learning',
      navTrain: 'Training',
      navOffers: 'Plans',
      navStart: 'Start for free',
    },
    es: {
      navHow: 'Cómo funciona',
      navLearn: 'Aprendizaje',
      navTrain: 'Formación',
      navOffers: 'Ofertas',
      navStart: 'Empieza gratis',
    },
  };
  const btn = document.getElementById('nav-lang-btn');
  const codeEl = document.getElementById('nav-lang-code');
  const menu = document.getElementById('nav-lang-menu');
  if (!btn || !codeEl || !menu) return;

  function supported(raw) {
    const base = String(raw || '').toLowerCase().split(/[_-]/)[0];
    return labels[base] ? base : null;
  }

  function current() {
    return supported(localStorage.getItem(KEY))
      || supported(navigator.language)
      || 'fr';
  }

  function apply(code, persist) {
    const lang = supported(code) || 'fr';
    if (persist) {
      localStorage.setItem(KEY, lang);
      document.cookie = 'wirilab_locale=' + lang + '; path=/; max-age=31536000; SameSite=Lax';
    }
    document.documentElement.lang = lang;
    codeEl.textContent = lang.toUpperCase();
    const pack = labels[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (pack[key]) el.textContent = pack[key];
    });
    if (persist || supported(localStorage.getItem(KEY))) {
      document.querySelectorAll('a[href^="app/"]').forEach((a) => {
        const url = new URL(a.getAttribute('href'), window.location.href);
        url.searchParams.set('lang', lang);
        a.setAttribute('href', url.pathname + url.search);
      });
    }
    menu.querySelectorAll('[data-lang]').forEach((item) => {
      item.setAttribute('aria-selected', item.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = menu.hasAttribute('hidden');
    if (open) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('[data-lang]').forEach((item) => {
    item.addEventListener('click', () => {
      apply(item.getAttribute('data-lang'), true);
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', () => {
    menu.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', 'false');
  });

  const stored = supported(localStorage.getItem(KEY));
  apply(stored || current(), false);
})();

/* ----- Menu mobile : logo à gauche, les liens de la barre dans le panneau. */
(function landingMenu() {
  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!header || !toggle || !nav) return;

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(!header.classList.contains('is-open'));
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
