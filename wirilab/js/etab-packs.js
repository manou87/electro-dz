// Packs Établissement — source de vérité : #etab-pack-config dans index.html
(function () {
  const formatUsd = (n) => {
    const s = String(n);
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const rest = s.length - i;
      if (i > 0 && rest % 3 === 0) out += ' ';
      out += s[i];
    }
    return out;
  };

  const readPacks = () => {
    const el = document.getElementById('etab-pack-config');
    if (!el) return null;
    try {
      const data = JSON.parse(el.textContent);
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  };

  const syncEtabPacks = () => {
    const PACKS = readPacks();
    const box = document.querySelector('[data-pack-slider]');
    if (!PACKS || !box) return;

    const range = box.querySelector('input[type="range"]');
    const index = Number(range ? range.value : 0);
    const pack = PACKS[index] || PACKS[0];
    const card = box.closest('.price-card');
    const nameEl = box.querySelector('[data-pack-name]');
    const placesEl = box.querySelector('[data-pack-places]');
    const priceEl = box.querySelector('[data-pack-price-line]');
    const cta = card ? card.querySelector('[data-pack-cta]') : null;

    box.querySelectorAll('.pack-ticks [data-tick]').forEach((el) => {
      el.classList.toggle(
        'is-active',
        Number(el.getAttribute('data-tick')) === index,
      );
    });

    if (nameEl) nameEl.textContent = pack.name;
    const placesText =
      pack.places == null
        ? 'Apprenants illimités'
        : "Jusqu'à " + pack.places + ' apprenants';
    if (placesEl) placesEl.textContent = placesText;

    const priceText =
      pack.annual == null
        ? 'Sur devis'
        : formatUsd(pack.annual) + ' $ / an';
    if (priceEl) priceEl.textContent = priceText;

    if (cta) {
      if (pack.slug == null) {
        const subject = encodeURIComponent(
          'WiriLab Établissement — ' + pack.name,
        );
        const body = encodeURIComponent(
          pack.name + '\n' + placesText + '\n' + priceText + '\n',
        );
        cta.textContent = 'Nous contacter';
        cta.classList.remove('button-primary');
        cta.classList.add('button-ghost');
        cta.href =
          'mailto:contact@wirilab.com?subject=' + subject + '&body=' + body;
      } else {
        cta.textContent = "S'abonner";
        cta.classList.add('button-primary');
        cta.classList.remove('button-ghost');
        cta.href = 'app/?checkout=etablissement&pack=' + pack.slug;
      }
    }
  };

  window.wirilabSyncEtabPacks = syncEtabPacks;

  const bind = () => {
    syncEtabPacks();
    const box = document.querySelector('[data-pack-slider]');
    const range = box ? box.querySelector('input[type="range"]') : null;
    if (range && !range.dataset.etabPacksBound) {
      range.dataset.etabPacksBound = '1';
      range.addEventListener('input', syncEtabPacks);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
