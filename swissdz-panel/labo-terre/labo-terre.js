/**
 * Labo terre V2 — Installation de la mise à la terre (4 scènes storyboard).
 * API: window.WireLabLaboTerre.open() / .close() / .reset()
 * swissdz-rev: v129-terre-espace
 */
(function () {
  "use strict";

  var ASSET = "assets/labo-terre/";

  var STEPS = [
    {
      id: "prep",
      title: "Préparation du chantier",
      hint: "Barrette déjà fixée et fermée, câble 16 mm² en borne supérieure, puits creusé. Identifie les 3 éléments."
    },
    {
      id: "plant",
      title: "Câblage et piquetage",
      hint: "Raccorde d’abord la câblette 25 mm² à la borne inférieure, descends-la au puits, puis enfonce le piquet."
    },
    {
      id: "setup62",
      title: "Préparer la mesure 62 %",
      hint: "Ouvre la barrette. Place H (noir) à D, S (bleu) à 62 % de D, cordon vert sur le piquet de terre."
    },
    {
      id: "measure",
      title: "Mesure Fluke 1664 FC",
      hint: "Vue POV : commutateur RE, appuie sur TEST. La position de S change la valeur R."
    }
  ];

  var METHODS = [
    { id: "p3_62", name: "3 pôles — 62 %", need: ["piquet_h", "piquet_s"], tip: "Place S à ~62 % de E→H" },
    { id: "triangle", name: "Triangle (2 piquets)", need: ["piquet_h", "piquet_s"], tip: "E, S, H en triangle" },
    { id: "p4", name: "4 pôles", need: ["piquet_h", "piquet_s", "cordon_es"], tip: "ES sur la terre mesurée" },
    { id: "loop_pe", name: "Boucle Phase-PE", need: ["fiche_choco"], tip: "Fiche choco sur la prise — sans piquet" }
  ];

  var ACCESSORIES = [
    { id: "pointes_lnpe", label: "Pointes L / N / PE" },
    { id: "piquet_h", label: "Piquet auxiliaire H" },
    { id: "piquet_s", label: "Piquet auxiliaire S" },
    { id: "cordon_es", label: "Cordon ES (4 pôles)" },
    { id: "croco", label: "Pinces crocodiles" },
    { id: "fiche_choco", label: "Fiche prise type J / choco" }
  ];

  var POSE = {
    IDLE: "IDLE",
    CROUCHING_WIRING: "CROUCHING_WIRING",
    HAMMER_UP: "HAMMER_UP",
    HAMMER_DOWN: "HAMMER_DOWN",
    PLANTING_ROD: "PLANTING_ROD"
  };

  /* E se glisse en X. S part à 62 % de E→H. Le render ne recopie jamais S depuis E. */
  /* Tête au ras du sol (herbe ≈ 52 %). La pointe (bas du piquet) est dans la terre.
     S et H partagent cette profondeur ; le drag horizontal ne change pas l’enfoncement. */
  var STAKE_GROUND_Y = 52;
  var EARTH_ROD = { x: 37, y: STAKE_GROUND_Y };
  var DEFAULT_H = { x: 14, y: STAKE_GROUND_Y };

  function defaultStakePos() {
    var e = { x: EARTH_ROD.x, y: EARTH_ROD.y };
    var h = { x: DEFAULT_H.x, y: DEFAULT_H.y };
    return {
      e: e,
      h: h,
      s: { x: e.x + (h.x - e.x) * 0.62, y: h.y }
    };
  }

  var STAKE_BOUNDS = { minX: 6, maxX: 78, minY: 40, maxY: 62 };
  var TERM_LOW = { x: 50.4, y: 36.5 };
  var PIT = { x: 38, y: 72 };
  var SOIL_HITS = { sable: 3, mixte: 4, roche: 6 };

  var state = {
    step: 0,
    characterPose: POSE.IDLE,
    characterPositionX: 68,
    isFlukeActive: false,
    prep: { cable16: false, barrette: false, puits: false },
    scene: {
      cabletteBarrette: false,
      cablettePit: false,
      planted: false,
      plantDepth: 0,
      barretteOpen: false,
      pe: true
    },
    inventory: { piquet: true, drill: false, conductor: true },
    accessories: {},
    method: null,
    stakes: { s: false, h: false },
    stakePos: defaultStakePos(),
    soil: "mixte",
    soilJitter: 1,
    cableEnd: null,
    score: 0,
    mistakes: 0,
    lastReadout: null,
    scoredMethods: {},
    open: false
  };

  var els = {};
  var drag = null;
  var hammerTimer = 0;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function currentStep() { return STEPS[state.step] || STEPS[STEPS.length - 1]; }

  function coach(msg, kind) {
    if (!els.coach) return;
    els.coach.innerHTML = msg + '<span class="score">Score : ' + state.score +
      " · Erreurs : " + state.mistakes + "</span>";
    els.coach.dataset.kind = kind || "info";
  }

  function addScore(n, why) {
    state.score = Math.max(0, state.score + n);
    if (why) coach(why, n >= 0 ? "ok" : "bad");
    else renderSide();
  }

  function prepReady() {
    return !!(state.prep.cable16 && state.prep.barrette && state.prep.puits);
  }

  function constructionReady() {
    return !!(state.scene.cabletteBarrette && state.scene.cablettePit && state.scene.planted);
  }

  function canMeasure() {
    return constructionReady() && !!state.scene.barretteOpen;
  }

  function hitCount() {
    return SOIL_HITS[state.soil] || 4;
  }

  function sPercent() {
    var e = state.stakePos.e;
    var s = state.stakePos.s;
    var h = state.stakePos.h;
    var dx = h.x - e.x;
    var dy = h.y - e.y;
    var len2 = dx * dx + dy * dy;
    if (len2 < 0.01) return 50;
    var t = ((s.x - e.x) * dx + (s.y - e.y) * dy) / len2;
    return clamp(t, 0, 1) * 100;
  }

  function soilMul() {
    var m = { sable: 0.94, mixte: 1, roche: 1.1 };
    return (m[state.soil] || 1) * (state.soilJitter || 1);
  }

  /** R terre : ~15.4 Ω près de 62 %, se dégrade si S s’éloigne. Sol = légère variation. */
  function resistanceFromGeometry() {
    var base = 15.4 * soilMul();
    var err = Math.abs(sPercent() - 62);
    if (err <= 4) return base * (1 + err * 0.0025);
    return base * (1 + Math.pow((err - 4) / 48, 1.32) * 0.95);
  }

  function setStep(i) {
    state.step = clamp(i, 0, STEPS.length - 1);
    state.isFlukeActive = currentStep().id === "measure";
    if (state.isFlukeActive) {
      state.techHasFluke = true;
      if (!state.method) selectMethod("p3_62", true);
    }
    if (currentStep().id === "setup62" && !state.characterPose) {
      state.characterPose = POSE.IDLE;
    }
    renderAll();
    coach(currentStep().hint, state.isFlukeActive ? "ok" : "info");
  }

  function advanceIfReady() {
    var s = currentStep().id;
    if (s === "prep" && prepReady()) {
      addScore(10, "Chantier identifié. Passe au câblage 25 mm².");
      setStep(1);
      state.characterPose = POSE.IDLE;
      state.characterPositionX = 62;
      renderAll();
      return;
    }
    if (s === "plant" && constructionReady()) {
      addScore(25, "Piquet enfoncé, câblette 25 mm² en place. Prépare la mesure 62 %.");
      setStep(2);
      state.characterPose = POSE.IDLE;
      state.characterPositionX = 58;
      renderAll();
      return;
    }
    if (s === "setup62" && canMeasure() && state.stakes.s && state.stakes.h) {
      addScore(15, "Barrette ouverte, S/H posés. Passe à la mesure Fluke.");
      setStep(3);
      renderAll();
    }
  }

  function setPose(pose) {
    state.characterPose = pose || POSE.IDLE;
    renderTech();
  }

  function renderTech() {
    if (!els.tech) return;
    var hide = !!state.isFlukeActive;
    els.tech.hidden = hide;
    els.tech.style.display = hide ? "none" : "";
    els.tech.style.left = state.characterPositionX + "%";
    var pose = state.characterPose || POSE.IDLE;
    var y = 18;
    if (pose === POSE.CROUCHING_WIRING) y = 28;
    if (pose === POSE.HAMMER_DOWN || pose === POSE.HAMMER_UP || pose === POSE.PLANTING_ROD) y = 22;
    els.tech.style.top = y + "%";
    els.tech.className = "labo-tech pose-" + pose;
    els.tech.id = "ElectricianCharacter";
  }

  function bgForStep() {
    var id = currentStep().id;
    if (id === "setup62") return ASSET + "bg-cutaway.jpg";
    return ASSET + "bg-prep.jpg";
  }

  function renderScene() {
    if (!els.stage) return;
    els.stage.classList.toggle("is-fluke", !!state.isFlukeActive);
    els.stage.classList.toggle("step-prep", currentStep().id === "prep");
    els.stage.classList.toggle("step-plant", currentStep().id === "plant");
    els.stage.classList.toggle("step-62", currentStep().id === "setup62");
    els.stage.classList.toggle("step-measure", currentStep().id === "measure");
    els.stage.style.backgroundImage = "url('" + bgForStep() + "')";
    if (els.root) els.root.classList.toggle("is-fluke", !!state.isFlukeActive);

    var barr = els.stage.querySelector(".labo-barrette");
    if (barr) {
      barr.classList.toggle("is-open", !!state.scene.barretteOpen);
      barr.classList.toggle("is-closed", !state.scene.barretteOpen);
      barr.classList.toggle("show-draw", currentStep().id === "setup62");
    }
    placeWallGear();

    var rod = els.stage.querySelector(".labo-rod-e");
    if (rod) {
      var showRod = currentStep().id !== "prep" && (state.scene.cablettePit || state.scene.planted);
      var canDragE = currentStep().id === "setup62" && !!state.scene.planted;
      rod.style.opacity = showRod ? "1" : "0";
      rod.style.left = state.stakePos.e.x + "%";
      rod.style.pointerEvents = canDragE ? "auto" : "none";
      rod.classList.toggle("is-draggable", canDragE);
      var sink = state.scene.plantDepth || 0;
      rod.style.setProperty("--sink", String(sink));
      rod.classList.toggle("is-planted", !!state.scene.planted);
    }

    var pit = els.stage.querySelector(".labo-puits");
    if (pit) pit.classList.toggle("is-hot", currentStep().id === "prep" && !state.prep.puits);

    var stakeS = els.stage.querySelector(".labo-stake-s");
    var stakeH = els.stage.querySelector(".labo-stake-h");
    var showAux = currentStep().id === "setup62" || (currentStep().id === "measure" && !state.isFlukeActive);
    var canDragAux = currentStep().id === "setup62" && !!state.scene.barretteOpen;
    /* Lecture seule : left/top viennent de state. Ne pas réassigner stakePos ici. */
    if (stakeS) {
      stakeS.style.opacity = !showAux ? "0" : (state.stakes.s ? "1" : "0.9");
      stakeS.style.left = state.stakePos.s.x + "%";
      stakeS.style.top = state.stakePos.s.y + "%";
      stakeS.classList.toggle("is-draggable", canDragAux);
      stakeS.style.pointerEvents = showAux ? "auto" : "none";
    }
    if (stakeH) {
      stakeH.style.opacity = !showAux ? "0" : (state.stakes.h ? "1" : "0.9");
      stakeH.style.left = state.stakePos.h.x + "%";
      stakeH.style.top = state.stakePos.h.y + "%";
      stakeH.classList.toggle("is-draggable", canDragAux);
      stakeH.style.pointerEvents = showAux ? "auto" : "none";
    }

    if (els.pov) {
      els.pov.hidden = !state.isFlukeActive;
      els.pov.setAttribute("aria-hidden", state.isFlukeActive ? "false" : "true");
    }
    if (els.stage) {
      els.stage.setAttribute("aria-hidden", state.isFlukeActive ? "true" : "false");
      if (state.isFlukeActive) els.stage.style.display = "none";
      else els.stage.style.display = "";
    }

    renderFlukeFace();
    renderGroundFluke();
    renderCables();
    renderFlukeLeads();
    renderLabels();
    renderPctGuide();
  }

  /** Pro / Gold (getTier normalise silver+gold+pro → "gold"). Free = schéma. */
  function laboIsPro() {
    try {
      if (typeof getTier === "function") return getTier() === "gold";
    } catch (err) {}
    return false;
  }

  /* Bornes du Fluke affiché. Terre : H = L (noir), S = N (bleu), E = PE (vert).
     Pro : mêmes ancres que FLUKE_CABLES (ax/ay haut de fluke_front.jpg). */
  var JACKS_BASIC = { H: { x: 38, y: 7.4 }, S: { x: 50, y: 7.4 }, E: { x: 62, y: 7.4 } };
  var JACKS_PRO = { H: { x: 36, y: 8 }, S: { x: 50, y: 8 }, E: { x: 64, y: 8 } };
  function flukeJacks() { return laboIsPro() ? JACKS_PRO : JACKS_BASIC; }

  function pxBox(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (!(r.width > 2) || !(r.height > 2)) return null;
    return { w: r.width, h: r.height };
  }
  function pctPt(box, x, y) {
    return { x: (x / 100) * box.w, y: (y / 100) * box.h };
  }
  function fmtN(n) { return (Math.round(n * 10) / 10).toFixed(1); }

  /** Caténaire cubique : le câble tombe vers le sol puis remonte. */
  function hangPath(a, b) {
    var dist = Math.hypot(b.x - a.x, b.y - a.y);
    var sag = clamp(dist * 0.32, 42, 220);
    var belly = Math.max(a.y, b.y) + sag;
    var c1x = a.x + (b.x - a.x) * 0.18;
    var c2x = a.x + (b.x - a.x) * 0.78;
    return "M " + fmtN(a.x) + " " + fmtN(a.y) +
      " C " + fmtN(c1x) + " " + fmtN(belly) +
      " " + fmtN(c2x) + " " + fmtN(belly) +
      " " + fmtN(b.x) + " " + fmtN(b.y);
  }

  /** Borne du Fluke posé au sol, en pixels du stage. Null si le boîtier n’est pas affiché. */
  function groundJackPx(which) {
    var face = els.ground;
    if (!face || face.hidden || !els.stage) return null;
    var st = els.stage.getBoundingClientRect();
    var fr = face.getBoundingClientRect();
    if (!(fr.width > 8) || !(fr.height > 8) || !(st.width > 2)) return null;
    var j = flukeJacks()[which];
    return {
      x: (fr.left - st.left) + (j.x / 100) * fr.width,
      y: (fr.top - st.top) + (j.y / 100) * fr.height
    };
  }

  function rodClipPx() {
    var rod = els.stage && els.stage.querySelector(".labo-rod-e");
    var st = els.stage.getBoundingClientRect();
    if (!rod || !(st.width > 2)) return { x: 0, y: 0 };
    var rr = rod.getBoundingClientRect();
    return {
      x: (rr.left - st.left) + rr.width / 2,
      y: (rr.top - st.top) + Math.min(14, rr.height * 0.08)
    };
  }

  function rodHeadPct() {
    var sink = state.scene.plantDepth || 0;
    return { x: state.stakePos.e.x, y: 47 + sink * 12 };
  }

  /** Image 1280×720, background-size cover centré → % du stage. */
  var BG_CUT = { x: 67.35, yTop: 15, yUp: 21, yLow: 40, yBot: 47 };
  var BG_PREP = { x: 44.5, yTop: 24, yUp: 30, yLow: 42, yBot: 46 };
  var wallPx = null;

  function bgToStage(ix, iy) {
    var st = els.stage.getBoundingClientRect();
    if (!(st.width > 2) || !(st.height > 2)) return { x: ix, y: iy };
    var scale = Math.max(st.width / 1280, st.height / 720);
    var dw = 1280 * scale;
    var dh = 720 * scale;
    var ox = (st.width - dw) / 2;
    var oy = (st.height - dh) / 2;
    return {
      x: ((ox + (ix / 100) * dw) / st.width) * 100,
      y: ((oy + (iy / 100) * dh) / st.height) * 100
    };
  }

  function earthMaxX() {
    var wall = bgToStage(60, 40);
    return clamp(wall.x - 3, 28, 70);
  }

  function barretteSpec() {
    var id = currentStep().id;
    return (id === "setup62" || id === "measure") ? BG_CUT : BG_PREP;
  }

  function placeWallGear() {
    if (!els.stage || !els.barrette) return;
    var spec = barretteSpec();
    var top = bgToStage(spec.x, spec.yTop);
    var up = bgToStage(spec.x, spec.yUp);
    var low = bgToStage(spec.x, spec.yLow);
    var bot = bgToStage(spec.x, spec.yBot);
    wallPx = { x: up.x, yTop: top.y, yUp: up.y, yLow: low.y, yBot: bot.y };
    els.barrette.style.left = up.x + "%";
    els.barrette.style.top = top.y + "%";
    els.barrette.style.height = Math.max(10, bot.y - top.y) + "%";
    els.barrette.style.width = "36px";
    els.barrette.style.transform = "translateX(-50%)";
    ["up", "low"].forEach(function (k) {
      var el = els.stage.querySelector(k === "up" ? ".labo-term-up" : ".labo-term-low");
      if (!el) return;
      var p = k === "up" ? up : low;
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      el.style.transform = "translate(-50%, -50%)";
    });
  }

  function barretteTermPx(which) {
    if (!wallPx || !els.stage) return null;
    var box = pxBox(els.stage);
    if (!box) return null;
    var y = which === "up" ? wallPx.yUp : wallPx.yLow;
    return pctPt(box, wallPx.x, y);
  }

  /** Du bas de la barrette vers le piquet : descend le mur, puis dans la terre. */
  function wallToRod(a, b) {
    var bury = Math.max(b.y + 6, a.y + 36);
    var mid = a.x + (b.x - a.x) * 0.55;
    return "M " + fmtN(a.x) + " " + fmtN(a.y) +
      " C " + fmtN(a.x) + " " + fmtN(a.y + 22) +
      " " + fmtN(a.x) + " " + fmtN(bury) +
      " " + fmtN(mid) + " " + fmtN(bury) +
      " C " + fmtN(b.x) + " " + fmtN(bury) +
      " " + fmtN(b.x) + " " + fmtN((bury + b.y) / 2) +
      " " + fmtN(b.x) + " " + fmtN(b.y);
  }

  function cordDefs(prefix) {
    function grad(id, a, b, c) {
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + a + '"/>' +
        '<stop offset="0.42" stop-color="' + b + '"/>' +
        '<stop offset="1" stop-color="' + c + '"/></linearGradient>';
    }
    return "<defs>" +
      grad(prefix + "h", "#9ca3af", "#1f2937", "#030712") +
      grad(prefix + "s", "#93c5fd", "#1d4ed8", "#1e3a8a") +
      grad(prefix + "e", "#86efac", "#16a34a", "#14532d") +
      grad(prefix + "cu", "#f0d2b0", "#b87333", "#7c3f12") +
      '<pattern id="' + prefix + 'braid" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(42)">' +
      '<rect width="7" height="7" fill="#b87333"/>' +
      '<path d="M-1 7 L7 -1 M-1 3.5 L3.5 -1 M3 8 L8 3" stroke="#f6e0c8" stroke-width="1.15"/>' +
      '<path d="M0 2 L3 -1 M2 8 L8 2" stroke="#6b3410" stroke-width="0.7"/>' +
      "</pattern>" +
      '<filter id="' + prefix + 'sh" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feDropShadow dx="0" dy="1.6" stdDeviation="1.15" flood-color="#0f172a" flood-opacity="0.5"/>' +
      "</filter></defs>";
  }

  function pvcLead(d, gradId, filterId) {
    return '<path class="lead" d="' + d + '" stroke="url(#' + gradId + ')" filter="url(#' + filterId + ')"/>' +
      '<path class="lead cord-hi" d="' + d + '" stroke="rgba(255,255,255,.42)"/>';
  }

  function crocoMark(x, y, color) {
    return '<g class="cord-clip" transform="translate(' + fmtN(x) + " " + fmtN(y) + ')">' +
      '<path fill="#e5e7eb" stroke="#111827" stroke-width="1" d="M-8 -3 h7 l1.5 3 l-1.5 3 h-7 z"/>' +
      '<path fill="' + color + '" d="M0 -6 l9 -2.5 l0.8 3.2 l-7 5.2 l-2.8 -5.9 z"/>' +
      '<path fill="#374151" d="M8.2 -8.2 l3.2 1.2 l-2.2 3.6 z"/></g>';
  }

  function bananaMark(x, y, color) {
    return '<g class="cord-jack" transform="translate(' + fmtN(x) + " " + fmtN(y) + ')">' +
      '<circle r="5.5" fill="#f8fafc" stroke="#111827" stroke-width="1.2"/>' +
      '<circle r="2.4" fill="' + color + '"/></g>';
  }

  function renderCables() {
    var svg = els.cords;
    if (!svg) return;
    var box = pxBox(els.stage);
    if (!box) {
      svg.setAttribute("viewBox", "0 0 10 10");
      svg.innerHTML = "";
      return;
    }
    svg.setAttribute("viewBox", "0 0 " + fmtN(box.w) + " " + fmtN(box.h));
    svg.setAttribute("preserveAspectRatio", "none");
    var html = cordDefs("lg");
    var stepId = currentStep().id;

    if (stepId !== "prep") {
      var upT = barretteTermPx("up");
      if (upT && wallPx) {
        var gyTop = pctPt(box, wallPx.x, Math.max(1, wallPx.yTop - 6));
        var gy = "M " + fmtN(gyTop.x) + " " + fmtN(gyTop.y) +
          " L " + fmtN(upT.x) + " " + fmtN(upT.y);
        html += '<path class="lead cord-gy" d="' + gy + '" stroke="#15803d"/>';
        html += '<path class="lead cord-gy-y" d="' + gy + '" stroke="#facc15" stroke-dasharray="8 8"/>';
      }
    }

    var showCu = state.scene.cabletteBarrette || (drag && drag.kind === "cable");
    if (showCu) {
      var cuA = barretteTermPx("low");
      var cuB = null;
      if (drag && drag.kind === "cable" && state.cableEnd) {
        cuB = pctPt(box, state.cableEnd.x, state.cableEnd.y);
      } else if (state.scene.cablettePit) {
        cuB = rodClipPx();
      } else if (cuA) {
        cuB = { x: cuA.x, y: cuA.y + 28 };
      }
      if (cuA && cuB) {
        var cu = (drag && drag.kind === "cable") ? hangPath(cuA, cuB) : wallToRod(cuA, cuB);
        html += '<path class="lead cord-cu" d="' + cu + '" stroke="url(#lgcu)" filter="url(#lgsh)"/>';
        html += '<path class="lead cord-cu-braid" d="' + cu + '" stroke="url(#lgbraid)"/>';
        html += '<path class="lead cord-hi" d="' + cu + '" stroke="rgba(255,236,214,.55)"/>';
      }
    }

    var measuring = stepId === "setup62" || stepId === "measure";
    if (measuring && state.scene.planted) {
      var jE = groundJackPx("E");
      if (jE) {
        var rod = rodClipPx();
        var dE = hangPath(jE, rod);
        html += pvcLead(dE, "lge", "lgsh");
        html += bananaMark(jE.x, jE.y, "#15803d");
        html += crocoMark(rod.x, rod.y, "#15803d");
      }
      if (state.stakes.s) {
        var jS = groundJackPx("S");
        if (jS) {
          var sEnd = pctPt(box, state.stakePos.s.x, state.stakePos.s.y - 0.4);
          var dS = hangPath(jS, sEnd);
          html += pvcLead(dS, "lgs", "lgsh");
          html += bananaMark(jS.x, jS.y, "#1d4ed8");
          html += crocoMark(sEnd.x, sEnd.y, "#1d4ed8");
        }
      }
      if (state.stakes.h) {
        var jH = groundJackPx("H");
        if (jH) {
          var hEnd = pctPt(box, state.stakePos.h.x, state.stakePos.h.y - 0.4);
          var dH = hangPath(jH, hEnd);
          html += pvcLead(dH, "lgh", "lgsh");
          html += bananaMark(jH.x, jH.y, "#111827");
          html += crocoMark(hEnd.x, hEnd.y, "#111827");
        }
      }
    }
    svg.innerHTML = html;
    svg.classList.toggle("is-on", true);
  }

  function basicMeterSvg() {
    function jack(cx, color, label) {
      return '<g><circle cx="' + cx + '" cy="46" r="18" fill="#f8fafc" stroke="#111827" stroke-width="2"/>' +
        '<circle cx="' + cx + '" cy="46" r="8" fill="' + color + '"/>' +
        '<text x="' + cx + '" y="84" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="800" fill="#1f2937">' +
        label + "</text></g>";
    }
    return '<svg class="labo-fluke-basic" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" aria-label="Fluke schéma">' +
      '<rect x="16" y="34" width="968" height="562" rx="90" fill="#f0b429" stroke="#c4890a" stroke-width="10"/>' +
      '<rect x="62" y="98" width="876" height="458" rx="28" fill="#2b3036"/>' +
      jack(380, "#111827", "H") +
      jack(500, "#1d4ed8", "S") +
      jack(620, "#15803d", "E") +
      '<rect x="390" y="176" width="230" height="200" rx="8" fill="#1a2214" stroke="#6b7280" stroke-width="3"/>' +
      '<circle cx="210" cy="286" r="64" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>' +
      '<text x="210" y="293" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#ea580c">TEST</text>' +
      '<circle cx="802" cy="304" r="50" fill="#111827" stroke="#9ca3af" stroke-width="8"/>' +
      '<path d="M802 304 L802 262" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>' +
      '<text x="802" y="196" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="800" fill="#e5e7eb">RE</text>' +
      '<text x="500" y="524" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="800" fill="#f8fafc" letter-spacing="1">1664</text>' +
      "</svg>";
  }

  function renderFlukeFace() {
    if (!els.visual || !els.pov) return;
    var pro = laboIsPro();
    els.pov.classList.toggle("is-pro", pro);
    els.pov.classList.toggle("is-basic", !pro);
    var sig = pro ? "pro" : "basic";
    if (els.visual.getAttribute("data-variant") === sig) return;
    els.visual.setAttribute("data-variant", sig);
    if (pro) {
      els.visual.innerHTML = '<img alt="Fluke 1664 FC" draggable="false" src="assets/fluke/fluke_front.jpg?v=v128-fluke-sol"/>';
    } else {
      els.visual.innerHTML = basicMeterSvg();
    }
  }

  /** Fluke 1664 au sol, à côté de l’électricien. Pro = photo, Free = schéma. */
  function renderGroundFluke() {
    var box = els.ground;
    if (!box) return;
    var show = currentStep().id === "setup62" && !!state.scene.planted && !state.isFlukeActive;
    box.hidden = !show;
    if (!show) return;
    var pro = laboIsPro();
    box.classList.toggle("is-pro", pro);
    box.classList.toggle("is-basic", !pro);
    var sig = pro ? "pro" : "basic";
    if (box.getAttribute("data-variant") === sig) return;
    box.setAttribute("data-variant", sig);
    if (pro) {
      box.innerHTML = '<img alt="Fluke 1664 FC" draggable="false" src="assets/fluke/fluke_cutout.png?v=v128-fluke-sol"/>';
    } else {
      box.innerHTML = basicMeterSvg();
    }
  }

  function renderFlukeLeads() {
    var svg = els.leads;
    var face = els.face;
    if (!svg || !face) return;
    if (!state.isFlukeActive) {
      svg.innerHTML = "";
      return;
    }
    var box = pxBox(face);
    if (!box) return;
    svg.setAttribute("viewBox", "0 0 " + fmtN(box.w) + " " + fmtN(box.h));
    svg.setAttribute("preserveAspectRatio", "none");
    var jacks = flukeJacks();
    var ends = { H: 8, S: 34, E: 92 };
    var grads = { H: "lph", S: "lps", E: "lpe" };
    var colors = { H: "#111827", S: "#1d4ed8", E: "#15803d" };
    var html = cordDefs("lp");
    ["H", "S", "E"].forEach(function (key) {
      var jack = jacks[key];
      var a = pctPt(box, jack.x, jack.y);
      var b = pctPt(box, ends[key], 1.2);
      var dip = Math.max(28, box.h * 0.09);
      var c1x = a.x + (b.x - a.x) * 0.12;
      var c2x = a.x + (b.x - a.x) * 0.62;
      var d = "M " + fmtN(a.x) + " " + fmtN(a.y) +
        " C " + fmtN(c1x) + " " + fmtN(a.y + dip) +
        " " + fmtN(c2x) + " " + fmtN(a.y + dip * 0.72) +
        " " + fmtN(b.x) + " " + fmtN(b.y);
      html += pvcLead(d, grads[key], "lpsh");
      html += bananaMark(a.x, a.y, colors[key]);
    });
    svg.innerHTML = html;
  }

  function renderPctGuide() {
    var g = els.stage && els.stage.querySelector(".labo-pct-guide");
    if (!g) return;
    var on = currentStep().id === "setup62" && state.stakes.s && state.stakes.h;
    g.style.opacity = on ? "1" : "0";
    if (!on) return;
    var pct = Math.round(sPercent());
    var x1 = state.stakePos.h.x;
    var x2 = state.stakePos.e.x;
    var left = Math.min(x1, x2);
    var width = Math.abs(x2 - x1);
    g.style.left = left + "%";
    g.style.width = width + "%";
    g.style.top = "36%";
    var good = Math.abs(pct - 62) <= 6;
    g.innerHTML = '<span class="' + (good ? "is-good" : "is-bad") + '">62 % de D  ·  S ≈ ' + pct + " %</span>";
  }

  function renderLabels() {
    var layer = els.stage && els.stage.querySelector(".labo-labels");
    if (!layer) return;
    var id = currentStep().id;
    var items = [];
    if (id === "prep") {
      items = [
        { k: "cable16", t: "Câble 16 mm²", x: 18, y: 16, done: state.prep.cable16 },
        { k: "barrette", t: "Barrette (fermée)", x: 8, y: 30, done: state.prep.barrette },
        { k: "puits", t: "Puits (creusé)", x: 8, y: 62, done: state.prep.puits }
      ];
    } else if (id === "plant") {
      items = [
        { k: "cu25", t: "Câblette 25 mm²" + (state.scene.cabletteBarrette ? " connectée" : ""), x: 8, y: 18, done: state.scene.cabletteBarrette },
        { k: "piquet", t: "Piquet de terre", x: 8, y: 48, done: state.scene.planted },
        { k: "elec", t: "Électricien (enfoncement)", x: 68, y: 12, done: state.scene.planted }
      ];
    } else if (id === "setup62") {
      items = [
        { k: "h", t: "Piquet H (100 % — noir)", x: 4, y: 8, done: state.stakes.h },
        { k: "s", t: "Piquet S (62 % — bleu)", x: 28, y: 8, done: state.stakes.s },
        { k: "vert", t: "Cordon vert", x: 58, y: 10, done: true },
        { k: "open", t: "Barrette ouverte !", x: 70, y: 6, done: state.scene.barretteOpen }
      ];
    }
    layer.innerHTML = items.map(function (it) {
      return '<button type="button" class="labo-callout' + (it.done ? " is-done" : "") +
        '" data-hot="' + it.k + '" style="left:' + it.x + "%;top:" + it.y + '%">' +
        (it.done ? "✓ " : "") + it.t + "</button>";
    }).join("");
    layer.querySelectorAll("[data-hot]").forEach(function (btn) {
      btn.onclick = function (ev) {
        ev.stopPropagation();
        onHot(btn.getAttribute("data-hot"));
      };
    });
  }

  function onHot(k) {
    var step = currentStep().id;
    if (step === "prep") {
      if (k === "cable16" || k === "barrette" || k === "puits") {
        state.prep[k] = true;
        addScore(5, k === "cable16"
          ? "Câble vert/jaune 16 mm² déjà sur la borne supérieure."
          : (k === "barrette" ? "Barrette de coupure fixée, fermée, hauteur d’homme."
            : "Puits / regard déjà creusé au pied du mur."));
        advanceIfReady();
        renderAll();
      }
      return;
    }
    if (step === "plant") {
      if (k === "cu25") startCableFromTerminal();
      if (k === "piquet" || k === "elec") hammerRod();
      return;
    }
    if (step === "setup62") {
      if (k === "open") toggleBarrette();
      if (k === "h") placeStake("h");
      if (k === "s") placeStake("s");
    }
  }

  function startCableFromTerminal() {
    if (currentStep().id !== "plant") return;
    state.scene.cabletteBarrette = true;
    setPose(POSE.CROUCHING_WIRING);
    state.characterPositionX = 52;
    coach("Câblette 25 mm² sur la borne inférieure — glisse-la jusqu’au puits.", "ok");
    renderAll();
  }

  function finishCableToPit() {
    if (!state.scene.cabletteBarrette) {
      state.mistakes++;
      addScore(-5, "Raccorde d’abord la câblette cuivre nu 25 mm² à la borne inférieure de la barrette.");
      return false;
    }
    state.scene.cablettePit = true;
    state.characterPose = POSE.PLANTING_ROD;
    state.characterPositionX = 40;
    addScore(15, "Câblette solidarisée à la tête du piquet (cosse). Tu peux enfoncer.");
    renderAll();
    return true;
  }

  function hammerRod() {
    if (currentStep().id !== "plant") return;
    if (!state.scene.cabletteBarrette || !state.scene.cablettePit) {
      state.mistakes++;
      addScore(-8, "Impossible d’enfoncer : raccorde d’abord la câblette 25 mm² à la borne inférieure, puis descends-la au puits (cosse sur la tête du piquet).");
      setPose(POSE.IDLE);
      return;
    }
    if (state.scene.planted) {
      coach("Piquet déjà enfoncé.", "info");
      return;
    }
    state.characterPositionX = 44;
    setPose(POSE.HAMMER_DOWN);
    var stepN = 1 / hitCount();
    state.scene.plantDepth = Math.min(1, (state.scene.plantDepth || 0) + stepN);
    renderScene();
    if (hammerTimer) clearTimeout(hammerTimer);
    hammerTimer = setTimeout(function () {
      setPose(POSE.HAMMER_UP);
      if (state.scene.plantDepth >= 0.999) {
        state.scene.planted = true;
        state.scene.plantDepth = 1;
        coach("Piquet enfoncé (" + state.soil + "). Barrette encore fermée — passe à la mesure.", "ok");
        advanceIfReady();
      } else {
        coach("Encore " + Math.ceil((1 - state.scene.plantDepth) * hitCount()) +
          " coups (" + state.soil + " : sable plus vite, roche plus lent).", "info");
      }
      renderAll();
    }, 150);
  }

  function toggleBarrette() {
    if (currentStep().id === "prep") {
      onHot("barrette");
      return;
    }
    if (currentStep().id === "plant") {
      coach("La barrette reste fermée pendant le piquetage. On l’ouvrira pour mesurer.", "info");
      return;
    }
    if (!constructionReady()) {
      coach("Termine d’abord le piquetage.", "bad");
      return;
    }
    state.scene.barretteOpen = !state.scene.barretteOpen;
    if (state.scene.barretteOpen) {
      addScore(10, "Barrette ouverte — le piquet est isolé de la maison. Place H et S.");
      advanceIfReady();
    } else {
      coach("Barrette refermée — la mesure 62 % serait faussée (PE maison encore ponté).", "bad");
    }
    renderAll();
  }

  function placeStake(which) {
    if (currentStep().id !== "setup62") return;
    if (!state.scene.barretteOpen) {
      state.mistakes++;
      addScore(-5, "Ouvre d’abord la barrette (pontet basculé) avant de poser S/H.");
      return;
    }
    if (which === "s") {
      state.stakes.s = true;
      state.accessories.piquet_s = true;
      state.characterPositionX = state.stakePos.s.x;
      setPose(POSE.PLANTING_ROD);
      coach("Piquet S (cordon bleu) — glisse-le vers 62 % de D.", "ok");
    } else {
      state.stakes.h = true;
      state.accessories.piquet_h = true;
      state.characterPositionX = state.stakePos.h.x;
      setPose(POSE.PLANTING_ROD);
      coach("Piquet H (cordon noir) à distance D.", "ok");
    }
    renderAll();
    setTimeout(function () { setPose(POSE.IDLE); }, 280);
  }

  function computeEarthReading() {
    if (!canMeasure()) {
      return { ok: false, text: "— — —", detail: "Barrette ouverte + piquet enfoncé + câblette 25 mm² requis." };
    }
    if (!state.method) {
      return { ok: false, text: "— — —", detail: "Choisis une méthode de mesure." };
    }
    var m = METHODS.find(function (x) { return x.id === state.method; });
    if (!m) return { ok: false, text: "— — —", detail: "Méthode inconnue." };

    for (var i = 0; i < m.need.length; i++) {
      if (!state.accessories[m.need[i]]) {
        return { ok: false, text: "CHECK ACC.", detail: "Accessoire manquant : " + m.need[i] };
      }
    }
    if (!state.scene.barretteOpen && state.method !== "loop_pe") {
      state.mistakes++;
      return { ok: false, text: "ERR", detail: "Barrette fermée — ouvre-la (mesure faussée sinon)." };
    }

    var r = resistanceFromGeometry();
    var detail = m.tip;
    var pct = Math.round(sPercent());

    if (state.method === "p3_62") {
      if (!state.stakes.s || !state.stakes.h) {
        return { ok: false, text: "CHECK", detail: "Place les piquets S et H (62 %)." };
      }
      detail = "3P 62 % · S ≈ " + pct + "% E→H · sol " + state.soil + " · R ≈ " + r.toFixed(1) + " Ω";
    } else if (state.method === "triangle") {
      if (!state.stakes.s || !state.stakes.h) {
        return { ok: false, text: "CHECK", detail: "Place S et H en triangle." };
      }
      r = r * 1.04;
      detail = "Triangle · S ≈ " + pct + "% · R ≈ " + r.toFixed(1) + " Ω";
    } else if (state.method === "p4") {
      if (!state.stakes.s || !state.stakes.h) {
        return { ok: false, text: "CHECK", detail: "Place S et H + cordon ES." };
      }
      r = r * 0.98;
      detail = "4P · cordons compensés · R ≈ " + r.toFixed(2) + " Ω";
    } else if (state.method === "loop_pe") {
      r = r + 0.8 + 0.35;
      detail = "Boucle Phase-PE · Rmes > Rterre · ≈ " + r.toFixed(1) + " Ω";
    }

    var oibt = scoreOibt(r, state.method);
    detail += " · " + oibt.label;
    if (!state.scoredMethods[state.method]) {
      state.scoredMethods[state.method] = true;
      var methodBonus = state.method === "p4" ? 25 : (state.method === "p3_62" ? 20 : 15);
      var geom = Math.abs(pct - 62) <= 6 ? 10 : 0;
      addScore(methodBonus + (oibt.bonus || 0) + geom, detail);
    }

    pushToFluke(r, state.method);
    return { ok: true, text: r.toFixed(1) + " Ω", detail: detail, oibt: oibt, ohms: r };
  }

  function scoreOibt(ohms, method) {
    var limit = 20;
    if (method === "loop_pe") {
      if (ohms <= 30) return { pass: true, label: "OIBT OK (boucle ≤ 30 Ω pédagog.)", bonus: 10 };
      return { pass: false, label: "OIBT KO — boucle trop élevée", bonus: -10 };
    }
    if (ohms <= limit) return { pass: true, label: "OIBT OK — R ≤ " + limit + " Ω (TT)", bonus: 15 };
    return { pass: false, label: "OIBT KO — R > " + limit + " Ω", bonus: -10 };
  }

  function laboFlukeFrames() {
    var out = [];
    document.querySelectorAll("iframe.labo-fluke-live, iframe.fluke-live").forEach(function (fr) {
      out.push(fr);
    });
    return out;
  }

  function pushToFluke(ohms, method, doTest) {
    try {
      var msg = {
        type: doTest ? "panelwire/fluke-test" : "panelwire/fluke-state",
        leads: { L: true, N: true, PE: true },
        L: true, N: true, PE: true,
        volts: { LN: 0, LPE: 0, NPE: 0 },
        ln: 0, lpe: 0, npe: 0,
        maxV: 0,
        live: false,
        sim: true,
        earthOhm: ohms,
        earthMethod: method || state.method
      };
      laboFlukeFrames().forEach(function (f) {
        try { f.contentWindow && f.contentWindow.postMessage(msg, "*"); } catch (e) {}
      });
      window.dispatchEvent(new CustomEvent("wirelab-labo-terre", { detail: msg }));
    } catch (e) {}
  }

  function toggleAccessory(id) {
    if (!canMeasure() && id !== "pointes_lnpe" && id !== "croco") {
      coach("Termine d’abord l’installation (câblette + piquet + barrette ouverte).", "bad");
      return;
    }
    state.accessories[id] = !state.accessories[id];
    if (id === "piquet_s") state.stakes.s = !!state.accessories[id];
    if (id === "piquet_h") state.stakes.h = !!state.accessories[id];
    renderAll();
  }

  function selectMethod(id, silent) {
    if (!canMeasure()) {
      state.mistakes++;
      addScore(-5, "Installation incomplète — pas encore de mesure.");
      return;
    }
    state.method = id;
    var m = METHODS.find(function (x) { return x.id === id; });
    if (m && m.need) {
      m.need.forEach(function (accId) {
        state.accessories[accId] = true;
        if (accId === "piquet_s") state.stakes.s = true;
        if (accId === "piquet_h") state.stakes.h = true;
      });
    }
    if (id === "p3_62" || id === "triangle" || id === "p4") {
      state.accessories.croco = true;
      state.accessories.pointes_lnpe = true;
    }
    if (!silent) coach(m ? ("Méthode : " + m.tip) : "Méthode sélectionnée.", "info");
    renderAll();
  }

  function updateLcd(text, detail) {
    if (els.lcdVal) els.lcdVal.textContent = text || "— — —";
    if (els.readout) {
      els.readout.innerHTML = (text || "— — —") + "<small>" + (detail || "Pas encore de mesure") + "</small>";
    }
  }

  function runMeasure() {
    if (currentStep().id !== "measure") {
      if (canMeasure() && state.stakes.s && state.stakes.h) setStep(3);
      else {
        coach("Finis les 3 premières étapes avant le TEST.", "bad");
        return;
      }
    }
    state.isFlukeActive = true;
    renderAll();
    var reading = computeEarthReading();
    state.lastReadout = reading;
    if (!reading.ok) {
      state.mistakes++;
      updateLcd(reading.text, reading.detail);
      coach(reading.detail, "bad");
      renderSide();
      return;
    }
    var ohms = reading.ohms != null ? reading.ohms : parseFloat(reading.text);
    pushToFluke(ohms, state.method, false);
    updateLcd("…", "TEST en cours");
    if (els.lcdVal) els.lcdVal.classList.add("is-run");
    setTimeout(function () {
      pushToFluke(ohms, state.method, true);
      updateLcd(reading.text, reading.detail);
      if (els.lcdVal) els.lcdVal.classList.remove("is-run");
      coach("TEST Fluke — écran RE : " + reading.text, "ok");
      renderSide();
    }, 220);
  }

  function reset() {
    state.step = 0;
    state.characterPose = POSE.IDLE;
    state.characterPositionX = 68;
    state.isFlukeActive = false;
    state.prep = { cable16: false, barrette: false, puits: false };
    state.scene = {
      cabletteBarrette: false,
      cablettePit: false,
      planted: false,
      plantDepth: 0,
      barretteOpen: false,
      pe: true
    };
    state.inventory = { piquet: true, drill: false, conductor: true };
    state.accessories = {};
    state.method = null;
    state.stakes = { s: false, h: false };
    state.stakePos = defaultStakePos();
    state.soilJitter = 0.97 + Math.random() * 0.07;
    state.cableEnd = null;
    state.score = 0;
    state.mistakes = 0;
    state.lastReadout = null;
    state.scoredMethods = {};
    updateLcd("— — —", "Pas encore de mesure");
    renderAll();
    coach("Nouveau chantier : identifie câble 16 mm², barrette fermée et puits creusé.", "info");
  }

  function renderSide() {
    if (els.steps) {
      els.steps.innerHTML = STEPS.map(function (st, i) {
        var cls = "labo-step";
        if (i === state.step) cls += " is-active";
        if (i < state.step) cls += " is-done";
        return '<button type="button" class="' + cls + '" data-step="' + i + '"><span class="n">' + (i + 1) + "</span><div>" +
          '<div class="txt">' + st.title + '</div><span class="hint">' + st.hint + "</span></div></button>";
      }).join("");
      els.steps.querySelectorAll("[data-step]").forEach(function (btn) {
        btn.onclick = function () {
          var i = parseInt(btn.getAttribute("data-step"), 10);
          if (i <= state.step) setStep(i);
        };
      });
    }
    if (els.inv) {
      els.inv.innerHTML =
        chip(state.prep.cable16, "Câble 16 mm²") +
        chip(state.scene.cabletteBarrette, "Câblette 25 mm²") +
        chip(state.scene.cablettePit, "Cosse piquet") +
        chip(state.scene.planted, "Piquet enfoncé") +
        chip(state.scene.barretteOpen, "Barrette ouverte") +
        chip(state.stakes.s && state.stakes.h, "S + H");
    }
    if (els.soilBox) {
      els.soilBox.querySelectorAll("[data-soil]").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-soil") === state.soil);
      });
    }
    if (els.methods) {
      var unlocked = canMeasure();
      els.methods.innerHTML = METHODS.map(function (m) {
        return '<button type="button" data-method="' + m.id + '"' +
          (unlocked ? "" : " disabled") +
          (state.method === m.id ? ' class="is-on"' : "") + ">" +
          m.name + "</button>";
      }).join("");
      els.methods.querySelectorAll("[data-method]").forEach(function (btn) {
        btn.onclick = function () { selectMethod(btn.getAttribute("data-method")); };
      });
    }
    if (els.acc) {
      els.acc.innerHTML = ACCESSORIES.map(function (a) {
        return '<button type="button" class="labo-acc' + (state.accessories[a.id] ? " is-on" : "") +
          '" data-acc="' + a.id + '">' + a.label + "</button>";
      }).join("");
      els.acc.querySelectorAll("[data-acc]").forEach(function (btn) {
        btn.onclick = function () { toggleAccessory(btn.getAttribute("data-acc")); };
      });
    }
    if (els.readout && state.lastReadout) {
      els.readout.innerHTML = state.lastReadout.text + "<small>" + state.lastReadout.detail + "</small>";
    } else if (els.readout && !state.lastReadout) {
      els.readout.innerHTML = "— — —<small>Pas encore de mesure</small>";
    }
  }

  function chip(on, label) {
    return '<span class="labo-inv' + (on ? " is-have" : "") + '">' + label + (on ? " ✓" : "") + "</span>";
  }

  function renderAll() {
    renderTech();
    renderScene();
    renderSide();
  }

  function resizeHandlesHtml() {
    return ["n", "s", "e", "w", "ne", "nw", "se", "sw"].map(function (edge) {
      return '<span class="labo-rh labo-rh-' + edge + '" data-labo-rh="' + edge + '" aria-hidden="true"></span>';
    }).join("");
  }

  function buildDom() {
    var root = document.getElementById("laboTerre");
    if (!root) return null;
    root.innerHTML =
      '<div class="labo-terre-bar" id="laboTerreBar">' +
      "<strong>Installation de la mise à la terre</strong>" +
      '<button type="button" id="laboTerreReset">Recommencer</button>' +
      '<button type="button" id="laboTerreGarden">Jardin</button>' +
      '<button type="button" class="primary" id="laboTerreMeasure">Mesurer</button>' +
      '<button type="button" id="laboTerreClose">Fermer</button>' +
      "</div>" +
      '<div class="labo-terre-body">' +
      '<aside class="labo-terre-side" id="laboTerreSteps"></aside>' +
      '<div class="labo-stage-wrap">' +
      '<div class="labo-stage" id="MainCanvas">' +
      '<div class="labo-wall-hit" data-zone="barrette" aria-label="Barrette"></div>' +
      '<div class="labo-term-up" data-zone="term-up" title="Borne supérieure — câble 16 mm²"></div>' +
      '<div class="labo-term-low" data-zone="term-low" title="Borne inférieure — câblette 25 mm²"></div>' +
      '<div class="labo-barrette is-closed" title="Barrette de coupure">' +
      '<span class="lb-mask"></span><span class="lb-bolt lb-up"></span>' +
      '<span class="lb-link"></span><span class="lb-bolt lb-low"></span></div>' +
      '<div class="labo-puits" data-zone="puits" title="Puits creusé"></div>' +
      '<div class="labo-rod-e" data-zone="rod" title="Piquet de terre"></div>' +
      '<div class="labo-stake-s" data-zone="measure-s" title="Piquet S">S</div>' +
      '<div class="labo-stake-h" data-zone="measure-h" title="Piquet H">H</div>' +
      '<div class="labo-fluke-ground" id="laboFlukeGround" hidden></div>' +
      '<div class="labo-pct-guide" aria-hidden="true"></div>' +
      '<svg class="labo-cords" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>' +
      '<div class="labo-labels"></div>' +
      '<div class="labo-cable-tip" hidden></div>' +
      '<div class="labo-tech pose-IDLE" id="ElectricianCharacter" title="Électricien"></div>' +
      "</div>" +
      '<div class="labo-fluke-pov is-basic" id="laboFlukePov" hidden>' +
      '<div class="labo-fluke-face" id="laboFlukeFace">' +
      '<div class="labo-fluke-visual" id="laboFlukeVisual"></div>' +
      '<svg class="labo-fluke-leads" aria-hidden="true"></svg>' +
      '<div class="labo-lcd"><span class="labo-lcd-mode">RE</span>' +
      '<span class="labo-lcd-val" id="laboLcdVal">— — —</span></div>' +
      '<button type="button" class="labo-test-hit" id="laboTerreTestPov" title="Appuyer sur TEST">TEST</button>' +
      "</div>" +
      '<p class="labo-pov-caption">Appuyer sur TEST · Mesure RE</p>' +
      "</div></div>" +
      '<aside class="labo-terre-side right">' +
      "<h3>État</h3><div class=\"labo-inventory\" id=\"laboTerreInv\"></div>" +
      '<h3>Sol</h3><div class="labo-soil" id="laboTerreSoil">' +
      '<button type="button" data-soil="sable">Sable</button>' +
      '<button type="button" data-soil="mixte">Mixte</button>' +
      '<button type="button" data-soil="roche">Roche</button></div>' +
      "<h3>Coach</h3><div class=\"labo-coach\" id=\"laboTerreCoach\"></div>" +
      "<h3>Méthodes</h3><div class=\"labo-methods\" id=\"laboTerreMethods\"></div>" +
      "<h3>Accessoires</h3><div class=\"labo-acc-list\" id=\"laboTerreAcc\"></div>" +
      '<div class="labo-readout" id="laboTerreReadout">— — —<small>Pas encore de mesure</small></div>' +
      '<div class="labo-footer-actions">' +
      '<button type="button" id="laboTerreAct">Action ici</button>' +
      '<button type="button" class="primary" id="laboTerreRun">Lancer TEST</button>' +
      "</div></aside></div>" +
      resizeHandlesHtml();

    els.root = root;
    els.bar = $("#laboTerreBar", root);
    els.steps = $("#laboTerreSteps", root);
    els.stage = $("#MainCanvas", root);
    els.tech = $("#ElectricianCharacter", root);
    els.inv = $("#laboTerreInv", root);
    els.coach = $("#laboTerreCoach", root);
    els.methods = $("#laboTerreMethods", root);
    els.acc = $("#laboTerreAcc", root);
    els.readout = $("#laboTerreReadout", root);
    els.pov = $("#laboFlukePov", root);
    els.face = $("#laboFlukeFace", root);
    els.visual = $("#laboFlukeVisual", root);
    els.leads = $("svg.labo-fluke-leads", root);
    els.lcdVal = $("#laboLcdVal", root);
    els.cords = $("svg.labo-cords", root);
    els.ground = $("#laboFlukeGround", root);
    els.barrette = $(".labo-barrette", root);
    els.cableTip = $(".labo-cable-tip", root);
    els.soilBox = $("#laboTerreSoil", root);

    $("#laboTerreClose", root).onclick = close;
    $("#laboTerreReset", root).onclick = reset;
    $("#laboTerreGarden", root).onclick = function () {
      state.isFlukeActive = false;
      if (state.step === 3) setStep(2);
      else renderAll();
    };
    $("#laboTerreMeasure", root).onclick = function () {
      if (canMeasure() && state.stakes.s && state.stakes.h) {
        if (currentStep().id === "setup62") advanceIfReady();
        else setStep(3);
      } else if (canMeasure()) {
        coach("Place encore S et H (62 %) avant le Fluke.", "bad");
      } else coach("Finis chantier + câblette + piquet + barrette ouverte.", "bad");
    };
    $("#laboTerreRun", root).onclick = runMeasure;
    var povTest = $("#laboTerreTestPov", root);
    if (povTest) povTest.onclick = runMeasure;
    $("#laboTerreAct", root).onclick = function () {
      var s = currentStep().id;
      if (s === "prep") {
        state.prep.cable16 = state.prep.barrette = state.prep.puits = true;
        advanceIfReady();
        renderAll();
        return;
      }
      if (s === "plant") {
        if (!state.scene.cabletteBarrette) startCableFromTerminal();
        else if (!state.scene.cablettePit) finishCableToPit();
        else hammerRod();
        return;
      }
      if (s === "setup62") {
        if (!state.scene.barretteOpen) toggleBarrette();
        else if (!state.stakes.h) placeStake("h");
        else if (!state.stakes.s) placeStake("s");
        else advanceIfReady();
        return;
      }
      runMeasure();
    };

    if (els.soilBox) {
      els.soilBox.querySelectorAll("[data-soil]").forEach(function (b) {
        b.onclick = function () {
          state.soil = b.getAttribute("data-soil");
          coach("Sol : " + state.soil + " — influence légère sur R et sur le nombre de coups.", "info");
          renderAll();
        };
      });
    }

    bindStagePointer();
    bindStakeDrag();
    bindPanelDrag();
    bindFrameResize();
    return root;
  }

  function pctFromEvent(ev) {
    var r = els.stage.getBoundingClientRect();
    if (!r.width || !r.height) return { x: 0, y: 0 };
    return {
      x: clamp(((ev.clientX - r.left) / r.width) * 100, 0, 100),
      y: clamp(((ev.clientY - r.top) / r.height) * 100, 0, 100)
    };
  }

  function hitZone(p) {
    if (wallPx && Math.abs(p.x - wallPx.x) < 5 && p.y > wallPx.yTop - 2 && p.y < wallPx.yBot + 4) {
      if (Math.abs(p.y - wallPx.yLow) < 4) return "term-low";
      if (Math.abs(p.y - wallPx.yUp) < 4) return "term-up";
      return "barrette";
    }
    if (p.x > 28 && p.x < 48 && p.y > 62 && p.y < 86) return "puits";
    if (currentStep().id === "setup62") {
      var hitS = stakeBodyHit(p, state.stakePos.s);
      var hitH = stakeBodyHit(p, state.stakePos.h);
      var hitE = Math.abs(p.x - state.stakePos.e.x) < 4 && p.y > 50 && p.y < 92;
      if (hitE && !hitS && !hitH) return "rod";
      if (hitS && hitH) {
        var ds = Math.hypot(p.x - state.stakePos.s.x, p.y - state.stakePos.s.y);
        var dh = Math.hypot(p.x - state.stakePos.h.x, p.y - state.stakePos.h.y);
        return ds <= dh ? "measure-s" : "measure-h";
      }
      if (hitS) return "measure-s";
      if (hitH) return "measure-h";
      if (hitE) return "rod";
    }
    if (Math.abs(p.x - state.stakePos.e.x) < 4 && p.y > 48 && p.y < 92) return "rod";
    return null;
  }

  function bindStagePointer() {
    if (!els.stage) return;
    els.stage.onpointerdown = function (ev) {
      if (state.isFlukeActive) return;
      if (ev.target && ev.target.closest && ev.target.closest(".labo-callout")) return;
      var p = pctFromEvent(ev);
      var z = hitZone(p);
      var step = currentStep().id;

      if (step === "plant" && (z === "term-low" || z === "barrette")) {
        state.scene.cabletteBarrette = true;
        state.characterPose = POSE.CROUCHING_WIRING;
        state.characterPositionX = 52;
        state.cableEnd = p;
        drag = { kind: "cable", pid: ev.pointerId };
        if (els.cableTip) els.cableTip.hidden = false;
        try { els.stage.setPointerCapture(ev.pointerId); } catch (e) {}
        renderAll();
        moveCableTip(ev);
        ev.preventDefault();
        return;
      }
      if (step === "plant" && state.scene.cabletteBarrette && !state.scene.cablettePit && z !== "rod" && z !== "puits") {
        state.characterPose = POSE.CROUCHING_WIRING;
        state.cableEnd = p;
        drag = { kind: "cable", pid: ev.pointerId };
        if (els.cableTip) els.cableTip.hidden = false;
        try { els.stage.setPointerCapture(ev.pointerId); } catch (e) {}
        renderCables();
        moveCableTip(ev);
        ev.preventDefault();
        return;
      }
    };

    els.stage.onpointermove = function (ev) {
      if (!drag || drag.kind !== "cable") return;
      var p = pctFromEvent(ev);
      state.cableEnd = p;
      state.characterPose = POSE.CROUCHING_WIRING;
      renderCables();
      moveCableTip(ev);
    };

    els.stage.onpointerup = function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest(".labo-callout")) return;
      var p = pctFromEvent(ev);
      var z = hitZone(p);
      if (drag && drag.kind === "cable") {
        drag = null;
        if (els.cableTip) els.cableTip.hidden = true;
        document.body.style.cursor = "";
        if (z === "puits" || z === "rod") finishCableToPit();
        else {
          coach("Glisse la câblette jusqu’au puits (tête du piquet).", "info");
          renderAll();
        }
        return;
      }
      if (drag && (drag.kind === "stake" || drag.kind === "panel")) return;
      onStageTap(z, p);
    };

  }

  function moveCableTip(ev) {
    if (!els.cableTip || !els.stage) return;
    var r = els.stage.getBoundingClientRect();
    els.cableTip.hidden = false;
    els.cableTip.style.left = (ev.clientX - r.left) + "px";
    els.cableTip.style.top = (ev.clientY - r.top) + "px";
  }

  function onStageTap(z, p) {
    var step = currentStep().id;
    if (step === "prep") {
      if (z === "term-up" || z === "barrette") onHot(z === "term-up" ? "cable16" : "barrette");
      else if (z === "puits") onHot("puits");
      return;
    }
    if (step === "plant") {
      if (z === "term-low" || z === "barrette") startCableFromTerminal();
      else if (z === "puits" || z === "rod") {
        if (!state.scene.cablettePit) {
          if (state.scene.cabletteBarrette) finishCableToPit();
          else hammerRod();
        } else hammerRod();
      }
      return;
    }
    if (step === "setup62") {
      if (z === "barrette" || z === "term-low" || z === "term-up") toggleBarrette();
      else if (z === "measure-h") placeStake("h");
      else if (z === "measure-s") placeStake("s");
      else if (p) {
        state.characterPositionX = p.x;
        renderTech();
      }
    }
  }

  function stakeBodyHit(p, pos) {
    return Math.abs(p.x - pos.x) < 5 && p.y > pos.y - 3 && p.y < pos.y + 36;
  }

  function bindStakeDrag() {
    if (!els.stage) return;
    [[".labo-stake-s", "s"], [".labo-stake-h", "h"], [".labo-rod-e", "e"]].forEach(function (pair) {
      var el = els.stage.querySelector(pair[0]);
      var key = pair[1];
      if (!el) return;
      el.onpointerdown = function (ev) {
        if (currentStep().id !== "setup62") return;
        ev.preventDefault();
        ev.stopPropagation();
        if (key === "e") {
          if (!state.scene.planted) return;
        } else if (!state.scene.barretteOpen) {
          placeStake(key);
          return;
        }
        if (key === "s") {
          state.stakes.s = true;
          state.accessories.piquet_s = true;
        } else if (key === "h") {
          state.stakes.h = true;
          state.accessories.piquet_h = true;
        }
        var st = els.stage.getBoundingClientRect();
        var pos = state.stakePos[key];
        drag = {
          kind: "stake",
          key: key,
          el: el,
          ox: ev.clientX,
          oy: ev.clientY,
          x0: pos.x,
          y0: pos.y,
          sw: st.width,
          sh: st.height
        };
        if (key !== "e") el.style.opacity = "1";
        state.characterPositionX = pos.x;
        setPose(POSE.CROUCHING_WIRING);
        try { el.setPointerCapture(ev.pointerId); } catch (e) {}
      };
      el.onpointermove = function (ev) {
        if (!drag || drag.kind !== "stake" || drag.key !== key) return;
        ev.preventDefault();
        var dx = ((ev.clientX - drag.ox) / drag.sw) * 100;
        var maxX = key === "e" ? earthMaxX() : STAKE_BOUNDS.maxX;
        state.stakePos[key].x = clamp(drag.x0 + dx, STAKE_BOUNDS.minX, maxX);
        if (key === "s" || key === "e") state.stakePos[key].y = STAKE_GROUND_Y;
        else {
          var dy = ((ev.clientY - drag.oy) / drag.sh) * 100;
          state.stakePos[key].y = clamp(drag.y0 + dy, STAKE_BOUNDS.minY, STAKE_BOUNDS.maxY);
        }
        el.style.left = state.stakePos[key].x + "%";
        if (key !== "e") el.style.top = state.stakePos[key].y + "%";
        state.characterPositionX = state.stakePos[key].x;
        renderTech();
        renderCables();
        renderPctGuide();
      };
      el.onpointerup = function (ev) {
        if (!drag || drag.kind !== "stake" || drag.key !== key) return;
        ev.stopPropagation();
        drag = null;
        setPose(POSE.IDLE);
        var pct = Math.round(sPercent());
        var r = resistanceFromGeometry();
        coach("S ≈ " + pct + " % de D → R estimée " + r.toFixed(1) +
          " Ω (idéal 62 % ≈ 15.4 Ω). Sol " + state.soil + ".",
          Math.abs(pct - 62) <= 6 ? "ok" : "bad");
        renderAll();
      };
    });
  }

  function bindPanelDrag() {
    if (!els.bar || !els.root) return;
    els.bar.onpointerdown = function (ev) {
      if (ev.target.tagName === "BUTTON") return;
      var r = els.root.getBoundingClientRect();
      drag = { kind: "panel", ox: ev.clientX, oy: ev.clientY, l0: r.left, t0: r.top };
      try { els.bar.setPointerCapture(ev.pointerId); } catch (e) {}
    };
    els.bar.onpointermove = function (ev) {
      if (!drag || drag.kind !== "panel") return;
      els.root.style.left = Math.max(0, drag.l0 + (ev.clientX - drag.ox)) + "px";
      els.root.style.top = Math.max(0, drag.t0 + (ev.clientY - drag.oy)) + "px";
    };
    els.bar.onpointerup = function () {
      if (drag && drag.kind === "panel") drag = null;
    };
  }

  function frameLimits() {
    var vw = window.innerWidth || 1024;
    var vh = window.innerHeight || 700;
    return {
      minW: Math.min(680, Math.max(300, vw - 24)),
      minH: Math.min(420, Math.max(260, vh - 24)),
      maxW: Math.max(300, vw - 8),
      maxH: Math.max(260, vh - 8)
    };
  }

  function readFrame() {
    var r = els.root.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  }

  function clampFrame(g) {
    var lim = frameLimits();
    var w = clamp(g.w, lim.minW, lim.maxW);
    var h = clamp(g.h, lim.minH, lim.maxH);
    var left = clamp(g.left, 0, Math.max(0, (window.innerWidth || w) - w));
    var top = clamp(g.top, 0, Math.max(0, (window.innerHeight || h) - h));
    return { left: left, top: top, w: w, h: h };
  }

  function applyFrame(g) {
    if (!els.root) return;
    var c = clampFrame(g);
    els.root.style.left = Math.round(c.left) + "px";
    els.root.style.top = Math.round(c.top) + "px";
    els.root.style.width = Math.round(c.w) + "px";
    els.root.style.height = Math.round(c.h) + "px";
    placeWallGear();
    renderCables();
    renderFlukeLeads();
  }

  var frameDrag = null;
  function bindFrameResize() {
    if (!els.root) return;
    els.root.querySelectorAll("[data-labo-rh]").forEach(function (handle) {
      handle.onpointerdown = function (ev) {
        if (ev.button != null && ev.button !== 0) return;
        ev.preventDefault();
        ev.stopPropagation();
        var g = readFrame();
        frameDrag = {
          mode: handle.getAttribute("data-labo-rh") || "se",
          pointerId: ev.pointerId,
          x0: ev.clientX,
          y0: ev.clientY,
          left0: g.left,
          top0: g.top,
          w0: g.w,
          h0: g.h
        };
        try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
      };
      handle.onpointermove = function (ev) {
        if (!frameDrag || ev.pointerId !== frameDrag.pointerId) return;
        var dx = ev.clientX - frameDrag.x0;
        var dy = ev.clientY - frameDrag.y0;
        var m = frameDrag.mode;
        var next = {
          left: frameDrag.left0,
          top: frameDrag.top0,
          w: frameDrag.w0,
          h: frameDrag.h0
        };
        if (m.indexOf("e") >= 0) next.w = frameDrag.w0 + dx;
        if (m.indexOf("s") >= 0) next.h = frameDrag.h0 + dy;
        if (m.indexOf("w") >= 0) {
          next.w = frameDrag.w0 - dx;
          next.left = frameDrag.left0 + dx;
        }
        if (m.indexOf("n") >= 0) {
          next.h = frameDrag.h0 - dy;
          next.top = frameDrag.top0 + dy;
        }
        var c = clampFrame(next);
        if (m.indexOf("w") >= 0) c.left = frameDrag.left0 + frameDrag.w0 - c.w;
        if (m.indexOf("n") >= 0) c.top = frameDrag.top0 + frameDrag.h0 - c.h;
        applyFrame(c);
      };
      handle.onpointerup = function (ev) {
        if (!frameDrag || ev.pointerId !== frameDrag.pointerId) return;
        frameDrag = null;
      };
    });
  }

  function open() {
    var root = document.getElementById("laboTerre");
    if (!root) return;
    if (!els.stage) buildDom();
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    state.open = true;
    if (state.score === 0 && state.step === 0) {
      coach("Étape 1 : clique les libellés — câble 16 mm², barrette fermée, puits creusé.", "info");
    }
    renderAll();
  }

  function close() {
    var root = document.getElementById("laboTerre");
    if (!root) return;
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    state.open = false;
    state.isFlukeActive = false;
  }

  function ensureShell() {
    if (document.getElementById("laboTerre")) return;
    var div = document.createElement("div");
    div.id = "laboTerre";
    div.className = "labo-terre";
    div.hidden = true;
    div.setAttribute("aria-hidden", "true");
    document.body.appendChild(div);
  }

  function init() {
    ensureShell();
    buildDom();
    var btn = document.getElementById("btnLaboTerreMenu");
    if (btn) btn.onclick = function () { open(); };
    if (/[?&]open=labo-terre\b/.test(location.search) || /[?&]open=terre\b/.test(location.search)) open();
    window.addEventListener("resize", function () {
      if (!els.root || els.root.hidden) return;
      if (els.root.style.width) applyFrame(readFrame());
      else {
        placeWallGear();
        renderCables();
        renderFlukeLeads();
      }
    });
  }

  window.WireLabLaboTerre = {
    open: open,
    close: close,
    reset: reset,
    state: state,
    ACCESSORIES: ACCESSORIES,
    METHODS: METHODS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
