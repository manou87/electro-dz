// ElectroDZ - main.js

// ---- HAMBURGER MENU ----
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('main-nav');
if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mainNav.classList.toggle('open');
  });
  mainNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mainNav.classList.remove('open');
    });
  });
}

// ---- ACTIVE NAV LINK ----
document.querySelectorAll('.main-nav a').forEach(link => {
  if (link.href === window.location.href) link.classList.add('active');
});

// ---- CALC TABS ----
const tabBtns = document.querySelectorAll('.tab-btn');
const calcPanels = document.querySelectorAll('.calc-panel');
if (tabBtns.length) {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      calcPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ---- CALCULATRICE OHM ----
window.calcOhm = function() {
  const tension = parseFloat(document.getElementById('ohm-tension')?.value);
  const resistance = parseFloat(document.getElementById('ohm-resistance')?.value);
  const result = document.getElementById('ohm-result');
  if (!result) return;
  if (isNaN(tension) || isNaN(resistance) || resistance === 0) {
    result.textContent = 'Veuillez entrer des valeurs valides.';
    return;
  }
  const courant = tension / resistance;
  result.textContent = `Courant (I) = ${courant.toFixed(4)} A | Puissance (P) = ${(tension * courant).toFixed(2)} W`;
};

// ---- CHUTE DE TENSION ----
window.calcChute = function() {
  const courant = parseFloat(document.getElementById('chute-courant')?.value);
  const longueur = parseFloat(document.getElementById('chute-longueur')?.value);
  const section = parseFloat(document.getElementById('chute-section')?.value);
  const result = document.getElementById('chute-result');
  if (!result) return;
  if (isNaN(courant) || isNaN(longueur) || isNaN(section) || section === 0) {
    result.textContent = 'Veuillez entrer des valeurs valides.';
    return;
  }
  const rho = 0.0225; // cuivre
  const chute = (2 * rho * longueur * courant) / section;
  result.textContent = `Chute de tension = ${chute.toFixed(3)} V (${((chute/230)*100).toFixed(2)}%)`;
};

// ---- SECTION CABLE ----
window.calcSection = function() {
  const courant = parseFloat(document.getElementById('sec-courant')?.value);
  const longueur = parseFloat(document.getElementById('sec-longueur')?.value);
  const chuteMax = parseFloat(document.getElementById('sec-chute')?.value) || 3;
  const result = document.getElementById('sec-result');
  if (!result) return;
  if (isNaN(courant) || isNaN(longueur)) {
    result.textContent = 'Veuillez entrer des valeurs valides.';
    return;
  }
  const rho = 0.0225;
  const chuteMaxV = (chuteMax / 100) * 230;
  const section = (2 * rho * longueur * courant) / chuteMaxV;
  const sections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
  const normalise = sections.find(s => s >= section) || sections[sections.length - 1];
  result.textContent = `Section calculee = ${section.toFixed(3)} mm² | Section normalisee = ${normalise} mm²`;
};

// ---- ICC COURT-CIRCUIT ----
window.calcIcc = function() {
  const tension = parseFloat(document.getElementById('icc-tension')?.value) || 230;
  const impedance = parseFloat(document.getElementById('icc-impedance')?.value);
  const result = document.getElementById('icc-result');
  if (!result) return;
  if (isNaN(impedance) || impedance === 0) {
    result.textContent = 'Veuillez entrer une impedance valide.';
    return;
  }
  const icc = tension / impedance;
  result.textContent = `Icc = ${icc.toFixed(2)} A | Pouvoir de coupure minimum recommande : ${Math.ceil(icc/1000)*1000} A`;
};

// ---- FAQ ACCORDION ----
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const answer = q.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-q').forEach(qq => qq.classList.remove('open'));
    if (!isOpen) {
      answer.classList.add('open');
      q.classList.add('open');
    }
  });
});
