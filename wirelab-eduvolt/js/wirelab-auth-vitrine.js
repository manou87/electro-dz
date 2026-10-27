/**
 * Carrousel schémas derrière la connexion (avant l’entrée WireLab).
 * Rotation 10 s — noms réels d’installations.
 */
(function () {
  var INTERVAL = 10000;
  var SLIDES = [
    {
      src: "assets/vitrine/schema-pv-reseau.jpg",
      tag: "Schéma · Photovoltaïque",
      name: "Installation photovoltaïque raccordée réseau",
      ex: "Panneaux → coffret DC → onduleur → protections AC → compteur. Câble L / N / PE, lance Play."
    },
    {
      src: "assets/vitrine/schema-pv-reseau-nuit.jpg",
      tag: "Schéma · Photovoltaïque",
      name: "PV raccordé réseau — atelier sombre",
      ex: "Même chaîne PV en mode sombre : idéal pour une démo client ou une formation."
    },
    {
      src: "assets/vitrine/schema-automatisme-logo.jpg",
      tag: "Schéma · Automatisme",
      name: "Automatisme LOGO! — commande & détection",
      ex: "Compteur, disjoncteur, PLC LOGO!, boutons Man/Auto, voyants et capteur de proximité."
    },
    {
      src: "assets/vitrine/schema-automatisme-logo-nuit.jpg",
      tag: "Schéma · Automatisme",
      name: "Automatisme LOGO! — vue sombre",
      ex: "Le même automatisme en fond sombre, prêt pour une présentation commerciale."
    },
    {
      src: "assets/vitrine/schema-demarreur-moteur.jpg",
      tag: "Schéma · Force motrice",
      name: "Démarreur moteur DOL — ABB AF09",
      ex: "MS116 → contacteur AF09 + thermique TF42 → moteur. Le schéma force classique."
    },
    {
      src: "assets/vitrine/schema-labo-terre.jpg",
      tag: "Schéma · Mise à la terre",
      name: "Labo mise à la terre — méthode 62 %",
      ex: "Piquets H et S, barrette ouverte, Fluke 1664 FC — mesure de terre étape par étape."
    },
    {
      src: "assets/vitrine/schema-mise-a-la-terre.jpg",
      tag: "Schéma · Mise à la terre",
      name: "Installation de la mise à la terre",
      ex: "Câblette, cosse, piquet, barrette ouverte : l’installation terre expliquée pour former."
    }
  ];

  var modal = null;
  var host = null;
  var bar = null;
  var tagEl = null;
  var nameEl = null;
  var exEl = null;
  var imgs = [];
  var idx = 0;
  var timer = null;
  var built = false;

  function ensure() {
    if (built) return !!host;
    modal = document.getElementById("wlAuthModal");
    if (!modal) return false;
    host = modal.querySelector(".wl-auth-vitrine");
    if (!host) return false;
    bar = host.querySelector(".wl-auth-vitrine-bar");
    tagEl = host.querySelector("[data-vitrine-tag]");
    nameEl = host.querySelector("[data-vitrine-name]");
    exEl = host.querySelector("[data-vitrine-ex]");
    var stage = host.querySelector(".wl-auth-vitrine-stage");
    if (!stage) return false;
    stage.innerHTML = "";
    imgs = SLIDES.map(function (s, i) {
      var img = document.createElement("img");
      img.src = s.src;
      img.alt = s.name;
      img.decoding = "async";
      img.loading = i === 0 ? "eager" : "eager";
      if (i === 0) img.classList.add("is-active");
      stage.appendChild(img);
      return img;
    });
    built = true;
    show(0, false);
    return true;
  }

  function restartBar() {
    if (!bar) return;
    bar.classList.remove("is-running");
    void bar.offsetWidth;
    bar.classList.add("is-running");
  }

  function show(n, animate) {
    idx = (n + SLIDES.length) % SLIDES.length;
    var s = SLIDES[idx];
    imgs.forEach(function (img, i) {
      img.classList.toggle("is-active", i === idx);
    });
    if (tagEl) tagEl.textContent = s.tag;
    if (nameEl) nameEl.textContent = s.name;
    if (exEl) exEl.textContent = s.ex;
    if (animate !== false) restartBar();
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (bar) bar.classList.remove("is-running");
  }

  function start() {
    if (!ensure()) return;
    stop();
    show(idx, true);
    timer = setInterval(function () {
      show(idx + 1, true);
    }, INTERVAL);
  }

  function sync() {
    if (!modal) modal = document.getElementById("wlAuthModal");
    if (!modal) return;
    if (modal.classList.contains("open")) start();
    else stop();
  }

  function boot() {
    ensure();
    sync();
    if (!modal) return;
    var obs = new MutationObserver(sync);
    obs.observe(modal, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
