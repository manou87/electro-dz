/* Electro DZ — main.js */

// ── Nav active link ──────────────────────────────────────────
document.querySelectorAll('.nav-main a').forEach(link => {
  if (link.href === location.href) {
    link.setAttribute('aria-current', 'page');
  }
});

// ── Calc tabs ────────────────────────────────────────────────
const tabBtns = document.querySelectorAll('.calc-tabs button');
const calcBlocks = document.querySelectorAll('.calc-block');

if (tabBtns.length) {
  // Show only first block by default
  calcBlocks.forEach((b, i) => { b.style.display = i === 0 ? '' : 'none'; });
  tabBtns[0].classList.add('active');

  tabBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calcBlocks.forEach((b, i) => { b.style.display = i === idx ? '' : 'none'; });
    });
  });
}

// ── Generic calculate button ──────────────────────────────────
document.querySelectorAll('button[data-calc]').forEach(btn => {
  btn.addEventListener('click', () => {
    const block = btn.closest('.calc-block');
    const inputs = {};
    block.querySelectorAll('input[data-var]').forEach(inp => {
      inputs[inp.dataset.var] = parseFloat(inp.value);
    });
    const resultEl = block.querySelector('.result');
    if (!resultEl) return;
    const type = btn.dataset.calc;
    let res = '';
    try {
      if (type === 'ohm') {
        const {U, I, R} = inputs;
        if (!isNaN(U) && !isNaN(I)) res = 'R = ' + (U/I).toFixed(3) + ' Ω';
        else if (!isNaN(U) && !isNaN(R)) res = 'I = ' + (U/R).toFixed(3) + ' A';
        else if (!isNaN(I) && !isNaN(R)) res = 'U = ' + (I*R).toFixed(3) + ' V';
      } else if (type === 'puissance') {
        const {U, I, P} = inputs;
        if (!isNaN(U) && !isNaN(I)) res = 'P = ' + (U*I).toFixed(2) + ' W';
        else if (!isNaN(P) && !isNaN(U)) res = 'I = ' + (P/U).toFixed(3) + ' A';
        else if (!isNaN(P) && !isNaN(I)) res = 'U = ' + (P/I).toFixed(3) + ' V';
      } else if (type === 'resistance') {
        const {rho, L, S} = inputs;
        if (!isNaN(rho) && !isNaN(L) && !isNaN(S)) res = 'R = ' + (rho*L/S).toFixed(4) + ' Ω';
      } else if (type === 'chute') {
        const {rho, L, S, I} = inputs;
        if (!isNaN(rho) && !isNaN(L) && !isNaN(S) && !isNaN(I))
          res = 'ΔU = ' + (2*rho*L*I/S).toFixed(3) + ' V';
      } else if (type === 'section') {
        const {rho, L, I, dU} = inputs;
        if (!isNaN(rho) && !isNaN(L) && !isNaN(I) && !isNaN(dU))
          res = 'S = ' + (2*rho*L*I/dU).toFixed(2) + ' mm²';
      } else if (type === 'selectivite') {
        const {Ia, Ib} = inputs;
        if (!isNaN(Ia) && !isNaN(Ib))
          res = Ia < Ib ? '✔ Sélectivité assurée (Ia < Ib)' : '✘ Pas de sélectivité (Ia ≥ Ib)';
      } else if (type === 'icc') {
        const {U, Z} = inputs;
        if (!isNaN(U) && !isNaN(Z)) res = 'Icc = ' + (U/Z).toFixed(2) + ' A';
      } else if (type === 'coupure') {
        const {I, k, S} = inputs;
        if (!isNaN(I) && !isNaN(k) && !isNaN(S))
          res = 't ≤ ' + ((k*S/I)**2).toFixed(4) + ' s';
      } else if (type === 'bilan') {
        let total = 0;
        block.querySelectorAll('input[data-power]').forEach(inp => {
          const v = parseFloat(inp.value); if (!isNaN(v)) total += v;
        });
        res = 'Puissance totale = ' + total.toFixed(1) + ' W = ' + (total/1000).toFixed(2) + ' kW';
      }
      resultEl.textContent = res || 'Renseignez les valeurs nécessaires.';
    } catch(e) { resultEl.textContent = 'Erreur de calcul.'; }
  });
});

// ── Contact form (mailto fallback) ───────────────────────────
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const msg = encodeURIComponent(`Nom: ${data.get('name')||''}
Message: ${data.get('message')||''}`);
    window.location.href = `mailto:contact@electro-dz.com?subject=Contact%20site&body=${msg}`;
  });
}

// ── Smooth scroll for anchor links ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

// ── Year in copyright ─────────────────────────────────────────
const yr = document.querySelector('.copyright');
if (yr) yr.innerHTML = yr.innerHTML.replace(/\d{4}/, new Date().getFullYear());
