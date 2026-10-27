/**
 * Câble secteur Fluke — Contrôle électrique UNIQUEMENT (#ctrlElec).
 * Tête L/PE/N + fiche Schuko amovibles, rotation 90°, snap pins → trous.
 * Ne touche pas flukeMeter / meter-embed (chemin plan).
 * API Flutter (hors embed=1) : window.__ctrlFlukeMains
 */
(function () {
  "use strict";

  var ASSET_HEAD = "assets/fluke/fluke-cable-secteur-tete-lpn.png?v=mains-cable-4";
  var ASSET_PLUG = "assets/fluke/fluke-cable-secteur-schuko.png?v=mains-cable-4";
  var HEAD_W = 132;
  var HEAD_H = 116;
  var PLUG_W = 100;
  var PLUG_H = 94;
  var CORNER_R = 18;
  var STUB = 28;
  var WIRE_W = 8;
  /* Broches (fractions du sprite, orientation 0°) — alignement snap. */
  var HEAD_PIN = { nx: 0.50, ny: 0.88 };
  var PLUG_PIN = { nx: 0.58, ny: 0.82 };

  var STATE = {
    open: false,
    clipFluke: false,
    plugR2: false,
    head: { x: 40, y: 40, rot: 0 },
    plug: { x: 160, y: 120, rot: 0 },
    waypoints: [],
    drag: null
  };

  var els = {};

  function ctrlOpen() {
    var wrap = document.getElementById("ctrlElec");
    return !!(wrap && !wrap.hidden);
  }

  function bridge() {
    return window.__ctrlFlukeMains || null;
  }

  function ready() {
    return STATE.clipFluke && STATE.plugR2;
  }

  function syncBridge() {
    var b = bridge();
    if (!b || typeof b.setState !== "function") return;
    try {
      b.setState({
        clipped: STATE.clipFluke,
        plugged: STATE.plugR2,
        outletId: "outlet-r2"
      });
    } catch (_) {}
    if (ready()) {
      setTimeout(function () {
        try {
          var b2 = bridge();
          if (b2 && typeof b2.setState === "function") {
            b2.setState({ clipped: true, plugged: true, outletId: "outlet-r2" });
          }
        } catch (_) {}
      }, 600);
    }
  }

  function hintText() {
    if (ready()) return "Câble secteur OK — tête clipsée + fiche sur R2 · mesures mono possibles";
    if (STATE.clipFluke && !STATE.plugR2) return "Tête clipsée — tourne/fiche Schuko vers R2 (broches dans les trous)";
    if (!STATE.clipFluke && STATE.plugR2) return "Fiche sur R2 — clipse la tête L/PE/N (broches sur bornes Fluke)";
    return "Glisse tête + fiche (↻ pour tourner) — broches pile sur trous / bornes";
  }

  function updateHint() {
    if (!els.hint) return;
    els.hint.textContent = hintText();
    els.hint.dataset.ok = ready() ? "1" : "0";
    if (els.layer) els.layer.classList.toggle("is-ready", ready());
    if (els.head) els.head.classList.toggle("is-snapped", STATE.clipFluke);
    if (els.plug) els.plug.classList.toggle("is-snapped", STATE.plugR2);
  }

  function stageRect() {
    return els.stage ? els.stage.getBoundingClientRect() : null;
  }

  function flukeJackZone() {
    var stage = els.stage;
    if (!stage) return null;
    var sr = stage.getBoundingClientRect();
    var box = document.querySelector("#ctrlFlukeChrome .ctrl-fluke-box.is-on") ||
      document.querySelector("#ctrlFlukeChrome .ctrl-fluke-box");
    if (box) {
      var br = box.getBoundingClientRect();
      if (br.width >= 20 && br.height >= 20) {
        return {
          left: br.left - sr.left + br.width * 0.18,
          top: br.top - sr.top - 6,
          width: br.width * 0.58,
          height: Math.max(40, br.height * 0.2)
        };
      }
    }
    var host = document.getElementById("ctrlElecHost");
    if (!host) return null;
    var hr = host.getBoundingClientRect();
    return {
      left: hr.left - sr.left + hr.width * 0.58,
      top: hr.top - sr.top + hr.height * 0.06,
      width: hr.width * 0.32,
      height: hr.height * 0.16
    };
  }

  function r2Zone() {
    var host = document.getElementById("ctrlElecHost");
    var stage = els.stage;
    if (!host || !stage) return null;
    var hr = host.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    var left = hr.left - sr.left + hr.width * 0.30;
    var top = hr.top - sr.top + hr.height * 0.70;
    var w = hr.width * 0.15;
    var h = hr.height * 0.17;
    var b = bridge();
    if (b && typeof b.getOutletRect === "function") {
      try {
        var or = b.getOutletRect("outlet-r2");
        if (or && or.width > 8) {
          left = or.left - sr.left;
          top = or.top - sr.top;
          w = or.width;
          h = or.height;
        }
      } catch (_) {}
    }
    return { left: left, top: top, width: w, height: h };
  }

  function placeZone(el, z) {
    if (!el || !z) {
      if (el) el.classList.remove("is-show");
      return;
    }
    el.style.left = z.left + "px";
    el.style.top = z.top + "px";
    el.style.width = z.width + "px";
    el.style.height = z.height + "px";
  }

  function showZones(show) {
    if (els.zoneFluke) {
      placeZone(els.zoneFluke, flukeJackZone());
      els.zoneFluke.classList.toggle("is-show", !!show);
    }
    if (els.zoneR2) {
      placeZone(els.zoneR2, r2Zone());
      els.zoneR2.classList.toggle("is-show", !!show);
    }
  }

  function pointIn(z, x, y) {
    if (!z) return false;
    return x >= z.left && x <= z.left + z.width && y >= z.top && y <= z.top + z.height;
  }

  function endSize(which) {
    return which === "head"
      ? { w: HEAD_W, h: HEAD_H, pin: HEAD_PIN }
      : { w: PLUG_W, h: PLUG_H, pin: PLUG_PIN };
  }

  function clampEnd(which, x, y) {
    var stage = els.stage;
    if (!stage) return { x: x, y: y };
    var sw = stage.clientWidth;
    var sh = stage.clientHeight;
    var sz = endSize(which);
    return {
      x: Math.max(4, Math.min(sw - sz.w - 4, x)),
      y: Math.max(4, Math.min(sh - sz.h - 4, y))
    };
  }

  function applyEndTransform(which) {
    var el = which === "head" ? els.head : els.plug;
    var p = STATE[which];
    if (!el || !p) return;
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.transform = "rotate(" + (p.rot || 0) + "deg)";
    el.style.transformOrigin = "50% 50%";
    var rotBtn = el.querySelector(".ctrl-mains-rot");
    if (rotBtn) rotBtn.textContent = "↻ " + ((p.rot || 0) % 360);
  }

  function setEndPos(which, x, y) {
    var p = clampEnd(which, x, y);
    STATE[which].x = p.x;
    STATE[which].y = p.y;
    applyEndTransform(which);
  }

  function rotateEnd(which, delta) {
    var p = STATE[which];
    p.rot = ((p.rot || 0) + (delta || 90) + 360) % 360;
    if (which === "head" && STATE.clipFluke) snapHeadToFluke();
    else if (which === "plug" && STATE.plugR2) snapPlugToR2();
    else applyEndTransform(which);
    paintWire();
    updateHint();
  }

  /** Position monde de la broche (centre) selon rotation. */
  function pinWorld(which) {
    var p = STATE[which];
    var sz = endSize(which);
    var nx = sz.pin.nx - 0.5;
    var ny = sz.pin.ny - 0.5;
    var rad = ((p.rot || 0) * Math.PI) / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    var rx = nx * cos - ny * sin;
    var ry = nx * sin + ny * cos;
    return {
      x: p.x + sz.w * 0.5 + rx * sz.w,
      y: p.y + sz.h * 0.5 + ry * sz.h
    };
  }

  /** Place l’objet pour que la broche tombe pile sur (tx, ty). */
  function placeByPin(which, tx, ty) {
    var p = STATE[which];
    var sz = endSize(which);
    var nx = sz.pin.nx - 0.5;
    var ny = sz.pin.ny - 0.5;
    var rad = ((p.rot || 0) * Math.PI) / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    var rx = nx * cos - ny * sin;
    var ry = nx * sin + ny * cos;
    setEndPos(which, tx - sz.w * 0.5 - rx * sz.w, ty - sz.h * 0.5 - ry * sz.h);
  }

  function cableAnchor(which) {
    var p = STATE[which];
    var sz = endSize(which);
    var local = which === "head"
      ? { nx: 0.10, ny: 0.20, dx: -0.70, dy: -0.45 }
      : { nx: 0.12, ny: 0.16, dx: -0.65, dy: -0.50 };
    var nx = local.nx - 0.5;
    var ny = local.ny - 0.5;
    var rad = ((p.rot || 0) * Math.PI) / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    var rx = nx * cos - ny * sin;
    var ry = nx * sin + ny * cos;
    var rdx = local.dx * cos - local.dy * sin;
    var rdy = local.dx * sin + local.dy * cos;
    return {
      x: p.x + sz.w * 0.5 + rx * sz.w,
      y: p.y + sz.h * 0.5 + ry * sz.h,
      dx: rdx,
      dy: rdy
    };
  }

  function almostEq(a, b) {
    return Math.abs(a - b) < 0.6;
  }

  function dedupePts(pts) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      var prev = out[out.length - 1];
      if (!prev || Math.hypot(q.x - prev.x, q.y - prev.y) > 0.8) out.push({ x: q.x, y: q.y });
    }
    return out;
  }

  function isHvElbow(a, b, c) {
    var abH = almostEq(a.y, b.y);
    var abV = almostEq(a.x, b.x);
    var bcH = almostEq(b.y, c.y);
    var bcV = almostEq(b.x, c.x);
    return (abH && bcV) || (abV && bcH);
  }

  function routePts() {
    var A = cableAnchor("head");
    var B = cableAnchor("plug");
    var A2 = { x: A.x + A.dx * STUB, y: A.y + A.dy * STUB };
    var B2 = { x: B.x + B.dx * STUB, y: B.y + B.dy * STUB };
    var mid = (STATE.waypoints || []).map(function (p) {
      return { x: p.x, y: p.y };
    });
    if (!mid.length) {
      if (Math.abs(A2.x - B2.x) > 1 && Math.abs(A2.y - B2.y) > 1) {
        mid.push({ x: A2.x, y: (A2.y + B2.y) * 0.5 });
        mid.push({ x: B2.x, y: (A2.y + B2.y) * 0.5 });
      }
    }
    return dedupePts([{ x: A.x, y: A.y }, A2].concat(mid).concat([B2, { x: B.x, y: B.y }]));
  }

  function pathD(pts) {
    var p = dedupePts(pts || []);
    if (p.length < 2) return "";
    if (p.length === 2) {
      return "M " + p[0].x.toFixed(1) + " " + p[0].y.toFixed(1) +
        " L " + p[1].x.toFixed(1) + " " + p[1].y.toFixed(1);
    }
    var d = "M " + p[0].x.toFixed(1) + " " + p[0].y.toFixed(1);
    for (var i = 1; i < p.length - 1; i++) {
      var a = p[i - 1], b = p[i], c = p[i + 1];
      var inLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      var outLen = Math.hypot(c.x - b.x, c.y - b.y) || 1;
      if (!isHvElbow(a, b, c)) {
        d += " L " + b.x.toFixed(1) + " " + b.y.toFixed(1);
        continue;
      }
      var r = Math.min(CORNER_R, inLen * 0.49, outLen * 0.49);
      var ux = (b.x - a.x) / inLen, uy = (b.y - a.y) / inLen;
      var vx = (c.x - b.x) / outLen, vy = (c.y - b.y) / outLen;
      if (r >= 1.2) {
        var p1x = b.x - ux * r, p1y = b.y - uy * r;
        var p2x = b.x + vx * r, p2y = b.y + vy * r;
        var sweep = (ux * vy - uy * vx) >= 0 ? 1 : 0;
        d += " L " + p1x.toFixed(1) + " " + p1y.toFixed(1);
        d += " A " + r.toFixed(1) + " " + r.toFixed(1) + " 0 0 " + sweep +
          " " + p2x.toFixed(1) + " " + p2y.toFixed(1);
      } else {
        d += " L " + b.x.toFixed(1) + " " + b.y.toFixed(1);
      }
    }
    var last = p[p.length - 1];
    d += " L " + last.x.toFixed(1) + " " + last.y.toFixed(1);
    return d;
  }

  function paintWire() {
    if (!els.wirePath || !els.wireGlow) return;
    var d = pathD(routePts());
    els.wireGlow.setAttribute("d", d);
    els.wirePath.setAttribute("d", d);
    els.wireGlow.setAttribute("stroke-width", String(WIRE_W + 5));
    els.wirePath.setAttribute("stroke-width", String(WIRE_W));
    if (els.wireHit) {
      els.wireHit.setAttribute("d", d);
      els.wireHit.setAttribute("stroke-width", String(Math.max(18, WIRE_W + 12)));
    }
  }

  function snapEvaluate() {
    var fz = flukeJackZone();
    var rz = r2Zone();
    var hp = pinWorld("head");
    var pp = pinWorld("plug");
    var wasClip = STATE.clipFluke;
    var wasPlug = STATE.plugR2;
    STATE.clipFluke = pointIn(fz, hp.x, hp.y);
    STATE.plugR2 = pointIn(rz, pp.x, pp.y);
    if (els.zoneFluke) els.zoneFluke.classList.toggle("is-hot", STATE.clipFluke);
    if (els.zoneR2) els.zoneR2.classList.toggle("is-hot", STATE.plugR2);
    if (STATE.clipFluke !== wasClip || STATE.plugR2 !== wasPlug) {
      syncBridge();
      updateHint();
    } else {
      updateHint();
    }
  }

  function snapHeadToFluke() {
    var z = flukeJackZone();
    if (!z) return;
    /* Cible = centre des bornes / trous Fluke */
    placeByPin("head", z.left + z.width * 0.5, z.top + z.height * 0.55);
    STATE.clipFluke = true;
  }

  function snapPlugToR2() {
    var z = r2Zone();
    if (!z) return;
    /* Cible = centre des trous de la prise */
    placeByPin("plug", z.left + z.width * 0.5, z.top + z.height * 0.48);
    STATE.plugR2 = true;
  }

  function parkIdle() {
    var stage = els.stage;
    if (!stage) return;
    var sh = stage.clientHeight;
    STATE.head.rot = 0;
    STATE.plug.rot = 0;
    setEndPos("head", 18, Math.max(18, sh - HEAD_H - 96));
    setEndPos("plug", 18 + HEAD_W + 36, Math.max(18, sh - PLUG_H - 88));
    STATE.waypoints = [];
    paintWire();
  }

  function resetCable() {
    STATE.clipFluke = false;
    STATE.plugR2 = false;
    STATE.waypoints = [];
    syncBridge();
    parkIdle();
    updateHint();
    showZones(false);
  }

  function onPointerDown(ev) {
    if (ev.button != null && ev.button !== 0) return;
    if (ev.target && ev.target.closest && ev.target.closest(".ctrl-mains-rot")) return;
    var endEl = ev.currentTarget;
    var which = endEl && endEl.getAttribute("data-end");
    if (which !== "head" && which !== "plug") return;
    ev.preventDefault();
    ev.stopPropagation();
    var sr = stageRect();
    if (!sr) return;
    if (which === "head" && STATE.clipFluke) STATE.clipFluke = false;
    if (which === "plug" && STATE.plugR2) STATE.plugR2 = false;
    syncBridge();
    STATE.drag = {
      end: which,
      id: ev.pointerId,
      ox: ev.clientX - sr.left - STATE[which].x,
      oy: ev.clientY - sr.top - STATE[which].y
    };
    endEl.classList.add("is-dragging");
    try { endEl.setPointerCapture(ev.pointerId); } catch (_) {}
    showZones(true);
    updateHint();
  }

  function onPointerMove(ev) {
    if (!STATE.drag || STATE.drag.id !== ev.pointerId) return;
    var sr = stageRect();
    if (!sr) return;
    var which = STATE.drag.end;
    setEndPos(which, ev.clientX - sr.left - STATE.drag.ox, ev.clientY - sr.top - STATE.drag.oy);
    paintWire();
    snapEvaluate();
  }

  function onPointerUp(ev) {
    if (!STATE.drag || STATE.drag.id !== ev.pointerId) return;
    var which = STATE.drag.end;
    var endEl = which === "head" ? els.head : els.plug;
    STATE.drag = null;
    if (endEl) endEl.classList.remove("is-dragging");
    snapEvaluate();
    if (which === "head" && STATE.clipFluke) snapHeadToFluke();
    if (which === "plug" && STATE.plugR2) snapPlugToR2();
    paintWire();
    snapEvaluate();
    syncBridge();
    updateHint();
    showZones(false);
  }

  function ensureRotBtn(el, which) {
    if (!el) return;
    var btn = el.querySelector(".ctrl-mains-rot");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ctrl-mains-rot";
      btn.title = "Tourner 90°";
      el.appendChild(btn);
    }
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      rotateEnd(which, 90);
    };
  }

  function bindEnd(el) {
    if (!el || el.__bound) return;
    el.__bound = true;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("dblclick", function (e) {
      e.preventDefault();
      resetCable();
    });
  }

  function ensureDom() {
    var stage = document.querySelector("#ctrlElec .ctrl-elec-stage");
    if (!stage) return false;
    els.stage = stage;
    var layer = stage.querySelector(".ctrl-mains-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "ctrl-mains-layer";
      layer.innerHTML =
        '<div class="ctrl-mains-zone" data-zone="fluke" title="Bornes L / PE / N"></div>' +
        '<div class="ctrl-mains-zone" data-zone="r2" title="Prise mono R2"></div>' +
        '<svg class="ctrl-mains-wire" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path class="ctrl-mains-wire-glow" fill="none" stroke="rgba(15,23,42,.28)" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '<path class="ctrl-mains-wire-stroke" fill="none" stroke="#141414" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '<path class="ctrl-mains-wire-hit" fill="none" stroke="transparent" stroke-linecap="round" stroke-linejoin="round"></path>' +
        "</svg>" +
        '<div class="ctrl-mains-end" data-end="head" id="ctrlMainsHead" title="Tête L/PE/N — glisser / ↻ tourner">' +
        '<img alt="Tête L PE N Fluke" src="' + ASSET_HEAD + '" draggable="false" />' +
        "</div>" +
        '<div class="ctrl-mains-end" data-end="plug" id="ctrlMainsPlug" title="Fiche Schuko — glisser / ↻ tourner">' +
        '<img alt="Fiche Schuko" src="' + ASSET_PLUG + '" draggable="false" />' +
        "</div>" +
        '<div class="ctrl-mains-tray">' +
        '<p class="ctrl-mains-hint" id="ctrlMainsHint"></p>' +
        '<div class="ctrl-mains-actions">' +
        '<button type="button" id="ctrlMainsReset">Débrancher</button>' +
        '<button type="button" id="ctrlMainsHelp">Aide</button>' +
        "</div></div>";
      stage.appendChild(layer);
    } else if (
      !layer.querySelector(".ctrl-mains-wire") ||
      layer.querySelector(".ctrl-mains-end-badge") ||
      layer.querySelector(".ctrl-mains-pins")
    ) {
      layer.innerHTML = "";
      layer.className = "ctrl-mains-layer";
      stage.removeChild(layer);
      return ensureDom();
    }
    els.layer = layer;
    els.head = layer.querySelector("#ctrlMainsHead");
    els.plug = layer.querySelector("#ctrlMainsPlug");
    if (els.head) {
      var himg = els.head.querySelector("img");
      if (himg && himg.getAttribute("src") !== ASSET_HEAD) himg.setAttribute("src", ASSET_HEAD);
      ensureRotBtn(els.head, "head");
    }
    if (els.plug) {
      var pimg = els.plug.querySelector("img");
      if (pimg && pimg.getAttribute("src") !== ASSET_PLUG) pimg.setAttribute("src", ASSET_PLUG);
      ensureRotBtn(els.plug, "plug");
    }
    els.hint = layer.querySelector("#ctrlMainsHint");
    els.zoneFluke = layer.querySelector('[data-zone="fluke"]');
    els.zoneR2 = layer.querySelector('[data-zone="r2"]');
    els.wireGlow = layer.querySelector(".ctrl-mains-wire-glow");
    els.wirePath = layer.querySelector(".ctrl-mains-wire-stroke");
    els.wireHit = layer.querySelector(".ctrl-mains-wire-hit");
    bindEnd(els.head);
    bindEnd(els.plug);
    applyEndTransform("head");
    applyEndTransform("plug");
    var resetBtn = layer.querySelector("#ctrlMainsReset");
    var helpBtn = layer.querySelector("#ctrlMainsHelp");
    if (resetBtn && !resetBtn.__bound) {
      resetBtn.__bound = true;
      resetBtn.onclick = function () { resetCable(); };
    }
    if (helpBtn && !helpBtn.__bound) {
      helpBtn.__bound = true;
      helpBtn.onclick = function () {
        showZones(true);
        updateHint();
        setTimeout(function () { showZones(false); }, 2400);
      };
    }
    if (!layer.__resizeBound) {
      layer.__resizeBound = true;
      window.addEventListener("resize", function () {
        if (!STATE.open) return;
        if (STATE.clipFluke) snapHeadToFluke();
        if (STATE.plugR2) snapPlugToR2();
        paintWire();
        updateHint();
      });
    }
    return true;
  }

  function open() {
    if (!ensureDom()) return;
    STATE.open = true;
    if (!STATE.clipFluke && !STATE.plugR2) parkIdle();
    else {
      if (STATE.clipFluke) snapHeadToFluke();
      if (STATE.plugR2) snapPlugToR2();
      paintWire();
    }
    updateHint();
    syncBridge();
  }

  function close() {
    STATE.open = false;
    showZones(false);
  }

  window.WireLabCtrlMainsCable = {
    open: open,
    close: close,
    reset: resetCable,
    ready: ready
  };
})();
