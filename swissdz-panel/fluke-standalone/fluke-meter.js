/**
 * SwissDZ Fluke 1664 FC — module standalone (appareil + cordons).
 * API postMessage PanelWire (pas de cours / auth / navigation OIBT).
 *
 * Parent → iframe :
 *   { type: "panelwire/fluke-state", leads: {L,N,PE}, tips?: {L:{nx,ny},...},
 *     ln?, lpe?, sim?, pair? }
 *   { type: "panelwire/fluke-measures", ln, lpe, sim }  (compat)
 *
 * iframe → parent :
 *   { type: "fluke/ready" }
 *   { type: "fluke/tip-move", tip, nx, ny, phase: "start"|"move"|"end" }
 *   { type: "fluke/tip-tap", tip }
 *   { type: "fluke/button", button }
 */
(function () {
  "use strict";

  const JACKS = {
    /* Sortie visuelle haut appareil (bornes L / N / PE) */
    L: { nx: 0.38, ny: 0.08 },
    N: { nx: 0.50, ny: 0.06 },
    PE: { nx: 0.62, ny: 0.08 }
  };
  const COLORS = { L: "#E23A32", N: "#2F6FE0", PE: "#3CB04A" };
  const PAIRS = ["L-PE", "L-N", "PE-N"];

  const params = new URLSearchParams(location.search);
  const isEmbed = params.get("embed") === "1" || window.parent !== window;
  document.body.classList.add(isEmbed ? "embed-panel" : "demo");

  const state = {
    powered: true,
    backlight: false,
    pairIdx: 0,
    leads: { L: false, N: false, PE: false },
    tips: {
      L: { nx: 0.22, ny: 0.92 },
      N: { nx: 0.50, ny: 0.98 },
      PE: { nx: 0.78, ny: 0.92 }
    },
    ln: 0,
    lpe: 0,
    sim: false,
    drag: null
  };

  const el = {
    stage: document.getElementById("stage"),
    device: document.getElementById("device"),
    cables: document.getElementById("cables"),
    tips: document.getElementById("tips"),
    lcd: document.getElementById("lcd"),
    lcdPoles: document.getElementById("lcdPoles"),
    lcdWarn: document.getElementById("lcdWarn"),
    lcdReading: document.getElementById("lcdReading"),
    lcdVal: document.getElementById("lcdVal"),
    lcdUnit: document.getElementById("lcdUnit"),
    lcdPair: document.getElementById("lcdPair"),
    lcdHz: document.getElementById("lcdHz")
  };

  function post(msg) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    } catch (_) {}
  }

  function pair() {
    return PAIRS[state.pairIdx] || "L-PE";
  }

  function pairLeadsOk() {
    const p = pair();
    if (p === "L-PE") return state.leads.L && state.leads.PE;
    if (p === "L-N") return state.leads.L && state.leads.N;
    if (p === "PE-N") return state.leads.PE && state.leads.N;
    return state.leads.L && state.leads.N && state.leads.PE;
  }

  function voltageForPair() {
    const p = pair();
    if (p === "L-N") return state.ln || 0;
    if (p === "L-PE") return state.lpe || 0;
    if (p === "PE-N") {
      if (state.ln && state.lpe) return Math.abs(state.ln - state.lpe);
      return 0;
    }
    return 0;
  }

  function paintTips() {
    el.tips.querySelectorAll(".tip").forEach((tip) => {
      const id = tip.dataset.id;
      const t = state.tips[id];
      if (!t) return;
      tip.style.left = t.nx * 100 + "%";
      tip.style.top = t.ny * 100 + "%";
      tip.classList.toggle("is-connected", !!state.leads[id]);
    });
  }

  function paintCables() {
    /* Embed PanelWire : fils tracés sur le board parent (évite le clip iframe). */
    if (isEmbed) {
      el.cables.innerHTML = "";
      return;
    }
    const stage = el.stage.getBoundingClientRect();
    const device = el.device.getBoundingClientRect();
    if (!stage.width || !device.width) return;

    const paths = [];
    Object.keys(JACKS).forEach((id) => {
      const j = JACKS[id];
      const t = state.tips[id];
      const x0 = (device.left - stage.left) + j.nx * device.width;
      const y0 = (device.top - stage.top) + j.ny * device.height;
      const x1 = t.nx * stage.width;
      const y1 = t.ny * stage.height;
      /* Arc latéral pour ne pas masquer le LCD */
      const side = id === "L" ? -1 : id === "PE" ? 1 : 0;
      const bulge = Math.max(28, Math.abs(y1 - y0) * 0.22);
      const c1x = x0 + side * device.width * 0.10;
      const c1y = y0 - 8;
      const c2x = x1 + side * 18;
      const c2y = y0 + bulge;
      const d = `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      paths.push(
        `<path d="${d}" fill="none" stroke="${COLORS[id]}" stroke-width="5" stroke-linecap="round" opacity="0.95"/>` +
        `<path d="${d}" fill="none" stroke="#0f172a" stroke-width="1.15" stroke-linecap="round" opacity="0.22"/>`
      );
    });
    el.cables.setAttribute("viewBox", `0 0 ${stage.width} ${stage.height}`);
    el.cables.innerHTML = paths.join("");
  }

  function paintLcd() {
    el.lcd.classList.toggle("is-backlight", state.backlight && state.powered);
    el.lcdPair.textContent = pair();

    el.lcdPoles.querySelectorAll("span").forEach((span) => {
      const p = span.dataset.p;
      span.classList.remove("ok", "bad", "open");
      if (!state.powered) {
        span.classList.add("open");
        return;
      }
      span.classList.add(state.leads[p] ? "ok" : "bad");
    });

    if (!state.powered) {
      el.lcdWarn.hidden = true;
      el.lcdReading.hidden = false;
      el.lcdVal.textContent = "";
      el.lcdUnit.textContent = "";
      el.lcdHz.textContent = "";
      return;
    }

    const ok = pairLeadsOk();
    if (!ok) {
      el.lcdWarn.hidden = false;
      el.lcdReading.hidden = true;
      el.lcdHz.textContent = "Hz";
      return;
    }

    el.lcdWarn.hidden = true;
    el.lcdReading.hidden = false;
    const v = voltageForPair();
    if (state.sim && v > 0) {
      el.lcdVal.textContent = String(Math.round(v));
      el.lcdUnit.textContent = "V";
      el.lcdHz.textContent = "50.0 Hz";
    } else {
      el.lcdVal.textContent = "----";
      el.lcdUnit.textContent = "V";
      el.lcdHz.textContent = "Hz";
    }
  }

  function render() {
    paintTips();
    paintCables();
    paintLcd();
  }

  function applyHostMessage(d) {
    if (!d || typeof d !== "object") return;
    if (d.type === "panelwire/fluke-state" || d.type === "panelwire/fluke-measures") {
      if (d.leads) {
        state.leads.L = !!d.leads.L;
        state.leads.N = !!d.leads.N;
        state.leads.PE = !!d.leads.PE;
      }
      if (d.tips) {
        ["L", "N", "PE"].forEach((id) => {
          if (d.tips[id] && typeof d.tips[id].nx === "number") {
            state.tips[id] = { nx: d.tips[id].nx, ny: d.tips[id].ny };
          }
        });
      }
      if (typeof d.ln === "number") state.ln = d.ln;
      if (typeof d.lpe === "number") state.lpe = d.lpe;
      if (typeof d.sim === "boolean") state.sim = d.sim;
      if (typeof d.pair === "string") {
        const i = PAIRS.indexOf(d.pair);
        if (i >= 0) state.pairIdx = i;
      }
      render();
    }
  }

  window.addEventListener("message", (ev) => applyHostMessage(ev.data));

  /* Boutons face */
  document.querySelectorAll("[data-btn]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const name = btn.getAttribute("data-btn");
      if (name === "power") {
        state.powered = !state.powered;
      } else if (name === "f1") {
        state.pairIdx = (state.pairIdx + 1) % PAIRS.length;
      } else if (name === "f3") {
        state.backlight = !state.backlight;
      }
      post({ type: "fluke/button", button: name, pair: pair(), powered: state.powered });
      render();
    });
  });

  /* Drag tips (démo locale + signal parent) */
  function tipFromPoint(clientX, clientY) {
    const r = el.stage.getBoundingClientRect();
    return {
      nx: (clientX - r.left) / r.width,
      ny: (clientY - r.top) / r.height
    };
  }

  el.tips.querySelectorAll(".tip").forEach((tipEl) => {
    tipEl.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const id = tipEl.dataset.id;
      tipEl.setPointerCapture(ev.pointerId);
      tipEl.classList.add("is-drag");
      state.drag = { id, pointerId: ev.pointerId, moved: false, sx: ev.clientX, sy: ev.clientY };
      const p = tipFromPoint(ev.clientX, ev.clientY);
      state.tips[id] = p;
      post({ type: "fluke/tip-move", tip: id, nx: p.nx, ny: p.ny, phase: "start" });
      render();
    });
  });

  window.addEventListener("pointermove", (ev) => {
    if (!state.drag) return;
    const id = state.drag.id;
    if (Math.hypot(ev.clientX - state.drag.sx, ev.clientY - state.drag.sy) > 4) {
      state.drag.moved = true;
    }
    const p = tipFromPoint(ev.clientX, ev.clientY);
    state.tips[id] = {
      nx: Math.max(-0.05, Math.min(1.05, p.nx)),
      ny: Math.max(0.02, Math.min(1.45, p.ny))
    };
    post({
      type: "fluke/tip-move",
      tip: id,
      nx: state.tips[id].nx,
      ny: state.tips[id].ny,
      phase: "move"
    });
    render();
  });

  window.addEventListener("pointerup", (ev) => {
    if (!state.drag) return;
    const d = state.drag;
    state.drag = null;
    const tipEl = el.tips.querySelector(`.tip[data-id="${d.id}"]`);
    if (tipEl) tipEl.classList.remove("is-drag");
    const p = state.tips[d.id];
    if (!d.moved) {
      /* Tap = déconnecter (démo) */
      if (!isEmbed) {
        state.leads[d.id] = false;
      }
      post({ type: "fluke/tip-tap", tip: d.id });
    }
    post({ type: "fluke/tip-move", tip: d.id, nx: p.nx, ny: p.ny, phase: "end" });
    render();
  });

  /* Démo hors PanelWire : double-clic tip = bascule connected */
  if (!isEmbed) {
    el.tips.querySelectorAll(".tip").forEach((tipEl) => {
      tipEl.addEventListener("dblclick", (ev) => {
        ev.preventDefault();
        const id = tipEl.dataset.id;
        state.leads[id] = !state.leads[id];
        if (state.leads.L && state.leads.PE) {
          state.sim = true;
          state.lpe = 230;
          state.ln = 230;
        }
        render();
      });
    });
  }

  window.addEventListener("resize", render);
  requestAnimationFrame(() => {
    render();
    post({ type: "fluke/ready", version: 1 });
  });
})();
