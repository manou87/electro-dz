/**
 * Modèle câblage EduVolt Designer — objet « câble » (pas borne→borne).
 * Chargé après l’init de `state` / helpers panneau ; exposé sur window.EduVoltCable.
 *
 * Flux UI (strings APK 2.2.10) :
 *  - Dibujar cable / Drawing Cable
 *  - Cable horizontal (hWire) / Cable vertical (vWire)
 *  - Extrémite libre (loose end) ou attachée à une borne
 *  - Segments nommés, presets v1/v2/v3
 *  - Exit cable mode / Cancel drawing / Confirm
 */
(function (global) {
  "use strict";

  const PRESETS = {
    v1: { id: "v1", name: "Câble v1", section: 1.5, color: "#92400e" },
    v2: { id: "v2", name: "Câble v2", section: 2.5, color: "#0088ce" },
    v3: { id: "v3", name: "Câble v3", section: 6, color: "#111111" }
  };

  function S() {
    return global.state;
  }

  function ensureState() {
    const state = S();
    if (!state) return null;
    if (!Array.isArray(state.cables)) state.cables = [];
    if (state.cableNo == null) state.cableNo = 1;
    if (!state.cableTool) state.cableTool = "h"; /* h | v */
    if (state.cablePreset == null) state.cablePreset = "v1";
    if (state.cableDraft == null) state.cableDraft = null;
    if (state.selectedCable == null) state.selectedCable = null;
    if (state.showFreeTermsPanel == null) state.showFreeTermsPanel = true;
    return state;
  }

  function activePreset() {
    const state = ensureState();
    const key = (state && state.cablePreset) || "v1";
    return PRESETS[key] || PRESETS.v1;
  }

  function clearCableDraft() {
    const state = ensureState();
    if (!state) return;
    state.cableDraft = null;
    state.preview = null;
  }

  function snapPoint(x, y, step) {
    const s = step > 0 ? step : 10;
    return { x: Math.round(x / s) * s, y: Math.round(y / s) * s };
  }

  function projectOrtho(last, x, y, tool) {
    if (!last) return { x: x, y: y };
    if (tool === "h") return { x: x, y: last.y };
    if (tool === "v") return { x: last.x, y: y };
    /* free: pick dominant axis */
    if (Math.abs(x - last.x) >= Math.abs(y - last.y)) return { x: x, y: last.y };
    return { x: last.x, y: y };
  }

  function pickNearTerminal(x, y, skip) {
    const state = ensureState();
    if (!state || typeof global.nearestPanelTerm !== "function") return null;
    const hit = global.nearestPanelTerm(x, y, {
      skipUid: skip && skip.uid,
      skipTerm: skip && skip.term,
      maxDist: 28
    });
    return hit || null;
  }

  function termPoint(ref) {
    if (!ref || typeof global.endpoint !== "function") return null;
    try {
      const p = global.endpoint(ref);
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y };
    } catch (_) {}
    return null;
  }

  function draftPointsAbsolute(draft) {
    if (!draft || !draft.points || !draft.points.length) return [];
    const pts = draft.points.map((p) => ({ x: p.x, y: p.y }));
    if (draft.a) {
      const a = termPoint(draft.a);
      if (a) pts[0] = a;
    }
    return pts;
  }

  function cablePointsAbsolute(cable) {
    if (!cable) return [];
    const pts = (cable.points || []).map((p) => ({ x: p.x, y: p.y }));
    if (!pts.length) return pts;
    if (cable.a) {
      const a = termPoint(cable.a);
      if (a) pts[0] = a;
    }
    if (cable.b) {
      const b = termPoint(cable.b);
      if (b) pts[pts.length - 1] = b;
    }
    return pts;
  }

  function startDraft(x, y, termRef) {
    const state = ensureState();
    if (!state) return;
    const preset = activePreset();
    let start = snapPoint(x, y, 10);
    let a = null;
    let looseStart = true;
    if (termRef) {
      a = { uid: termRef.uid, term: termRef.term };
      const tp = termPoint(a);
      if (tp) start = tp;
      looseStart = false;
    } else {
      const near = pickNearTerminal(x, y, null);
      if (near) {
        a = { uid: near.uid, term: near.term };
        const tp = termPoint(a);
        if (tp) start = tp;
        looseStart = false;
      }
    }
    state.cableDraft = {
      tool: state.cableTool === "v" ? "v" : "h",
      points: [start],
      a: a,
      looseStart: looseStart,
      looseEnd: true,
      b: null,
      name: preset.name + " · " + (state.cableNo || 1),
      preset: preset.id,
      color: preset.color,
      section: preset.section,
      colorManual: true,
      segments: [{ name: "Segmento 1", fromIdx: 0 }]
    };
    updateDraftPreview(start.x, start.y);
  }

  function updateDraftPreview(x, y) {
    const state = ensureState();
    const draft = state && state.cableDraft;
    if (!draft || !draft.points.length) {
      if (state) state.preview = null;
      return;
    }
    const last = draft.points[draft.points.length - 1];
    const near = pickNearTerminal(x, y, draft.a);
    let cur;
    if (near) {
      const tp = termPoint({ uid: near.uid, term: near.term });
      cur = tp || projectOrtho(last, x, y, draft.tool);
      state.wireSnap = near;
    } else {
      cur = projectOrtho(last, x, y, draft.tool);
      state.wireSnap = null;
    }
    const pts = draftPointsAbsolute(draft).concat([{ x: cur.x, y: cur.y }]);
    state.preview = { pts: pts, eduvoltCable: true };
  }

  function addDraftCorner(x, y) {
    const state = ensureState();
    const draft = state && state.cableDraft;
    if (!draft) return false;
    const last = draft.points[draft.points.length - 1];
    const cur = projectOrtho(last, x, y, draft.tool);
    if (Math.hypot(cur.x - last.x, cur.y - last.y) < 8) return false;
    draft.points.push(cur);
    /* Alternate H/V after each corner (EduVolt multi-segment). */
    draft.tool = draft.tool === "h" ? "v" : "h";
    const segN = (draft.segments && draft.segments.length) || 0;
    if (!draft.segments) draft.segments = [];
    draft.segments.push({ name: "Segmento " + (segN + 1), fromIdx: draft.points.length - 1 });
    updateDraftPreview(cur.x, cur.y);
    return true;
  }

  function finalizeDraft(opts) {
    const state = ensureState();
    const draft = state && state.cableDraft;
    if (!draft || draft.points.length < 1) {
      clearCableDraft();
      return null;
    }
    opts = opts || {};
    let points = draft.points.map((p) => ({ x: p.x, y: p.y }));
    let b = opts.b || null;
    let looseEnd = !b;

    if (opts.cursor) {
      const last = points[points.length - 1];
      const cur = projectOrtho(last, opts.cursor.x, opts.cursor.y, draft.tool);
      if (Math.hypot(cur.x - last.x, cur.y - last.y) >= 8) points.push(cur);
    }
    if (b) {
      const tp = termPoint(b);
      if (tp) {
        if (points.length === 1) points.push(tp);
        else points[points.length - 1] = tp;
      }
      looseEnd = false;
    }

    if (points.length < 2) {
      /* Single click without move — ignore. */
      clearCableDraft();
      return null;
    }

    if (typeof global.pushHistory === "function") global.pushHistory();

    const cable = {
      id: "cab" + (state.seq++),
      no: state.cableNo++,
      name: draft.name,
      preset: draft.preset,
      color: draft.color,
      section: draft.section,
      colorManual: !!draft.colorManual,
      points: points,
      a: draft.a,
      b: b,
      looseStart: !!draft.looseStart && !draft.a,
      looseEnd: looseEnd,
      showStartTerminal: !draft.a,
      showEndTerminal: looseEnd,
      segments: (draft.segments || []).slice(),
      wireId: null
    };
    state.cables.push(cable);
    syncCableToWire(cable);
    clearCableDraft();
    state.selectedCable = cable.id;
    state.selectedWire = cable.wireId || null;
    return cable;
  }

  function cancelDraft() {
    clearCableDraft();
  }

  /** Quand les 2 extrémités sont sur des bornes → fil sim (bornes électriques). */
  function syncCableToWire(cable) {
    const state = ensureState();
    if (!state || !cable) return;
    if (!(cable.a && cable.b)) {
      if (cable.wireId) {
        state.wires = state.wires.filter((w) => w.id !== cable.wireId);
        cable.wireId = null;
      }
      return;
    }
    const mids = (cable.points || []).slice(1, -1).map((p) => ({ x: p.x, y: p.y }));
    let w = cable.wireId && state.wires.find((x) => x.id === cable.wireId);
    if (!w) {
      w = {
        id: "w" + (state.seq++),
        no: state.wireNo++,
        a: { uid: cable.a.uid, term: cable.a.term },
        b: { uid: cable.b.uid, term: cable.b.term },
        color: cable.color,
        section: cable.section,
        colorManual: true,
        waypoints: mids,
        name: cable.name,
        fromCable: cable.id,
        live: false
      };
      state.wires.push(w);
      cable.wireId = w.id;
    } else {
      w.a = { uid: cable.a.uid, term: cable.a.term };
      w.b = { uid: cable.b.uid, term: cable.b.term };
      w.color = cable.color;
      w.section = cable.section;
      w.colorManual = true;
      w.waypoints = mids;
      w.name = cable.name;
      w.fromCable = cable.id;
    }
  }

  function syncAllCablesToWires() {
    const state = ensureState();
    if (!state) return;
    (state.cables || []).forEach(syncCableToWire);
  }

  function sanitizeCable(c) {
    if (!c) return null;
    const out = {
      id: c.id,
      no: c.no,
      name: c.name != null ? String(c.name).slice(0, 48) : "",
      color: c.color,
      section: Number(c.section),
      points: (c.points || []).map((p) => ({ x: Number(p.x), y: Number(p.y) })),
      looseStart: !!c.looseStart,
      looseEnd: !!c.looseEnd,
      showStartTerminal: c.showStartTerminal !== false && !c.a,
      showEndTerminal: c.showEndTerminal !== false && !c.b
    };
    if (c.preset) out.preset = c.preset;
    if (c.colorManual) out.colorManual = true;
    if (c.a && c.a.uid != null) out.a = { uid: c.a.uid, term: c.a.term };
    if (c.b && c.b.uid != null) out.b = { uid: c.b.uid, term: c.b.term };
    if (c.wireId) out.wireId = c.wireId;
    if (Array.isArray(c.segments) && c.segments.length) {
      out.segments = c.segments.map((s) => ({
        name: String((s && s.name) || "").slice(0, 32),
        fromIdx: Number(s && s.fromIdx) || 0
      }));
    }
    return out;
  }

  function listFreeTerminals() {
    const state = ensureState();
    if (!state || typeof global.termsOf !== "function") return [];
    const used = new Set();
    (state.wires || []).forEach((w) => {
      if (w.a) used.add(w.a.uid + "::" + w.a.term);
      if (w.b) used.add(w.b.uid + "::" + w.b.term);
    });
    (state.cables || []).forEach((c) => {
      if (c.a) used.add(c.a.uid + "::" + c.a.term);
      if (c.b) used.add(c.b.uid + "::" + c.b.term);
    });
    const out = [];
    (state.items || []).forEach((item) => {
      const def = global.LIB && global.LIB[item.type];
      if (!def || def.flukeMeter) return;
      (global.termsOf(item) || []).forEach((t) => {
        try {
          if (typeof global.kmFrHiddenTerm === "function" && global.kmFrHiddenTerm(item, t.id)) return;
        } catch (_) {}
        const key = item.uid + "::" + t.id;
        if (used.has(key)) return;
        out.push({
          uid: item.uid,
          term: t.id,
          tag: item.tag || item.type,
          type: item.type
        });
      });
    });
    return out;
  }

  function onBoardPointer(ev, pt) {
    const state = ensureState();
    if (!state || state.mode !== "cable") return false;
    const draft = state.cableDraft;

    /* Snap to terminal first. */
    const snap = pickNearTerminal(pt.x, pt.y, draft && draft.a);

    if (!draft) {
      if (snap) startDraft(pt.x, pt.y, snap);
      else startDraft(pt.x, pt.y, null);
      return true;
    }

    if (snap) {
      /* Attach end + confirm cable. */
      finalizeDraft({ b: { uid: snap.uid, term: snap.term } });
      return true;
    }

    /* Empty click = add segment corner. */
    addDraftCorner(pt.x, pt.y);
    return true;
  }

  function onTermClick(uid, termId) {
    const state = ensureState();
    if (!state || state.mode !== "cable") return false;
    const draft = state.cableDraft;
    const ref = { uid: uid, term: termId };
    if (!draft) {
      const tp = termPoint(ref) || { x: 0, y: 0 };
      startDraft(tp.x, tp.y, ref);
      return true;
    }
    if (draft.a && draft.a.uid === uid && draft.a.term === termId) {
      cancelDraft();
      return true;
    }
    finalizeDraft({ b: ref });
    return true;
  }

  function drawCables(svg, NS, drawPathFn) {
    const state = ensureState();
    if (!state || !svg || !NS) return;
    (state.cables || []).forEach((cable) => {
      /* Câbles doublement attachés : déjà dessinés via wire sync. */
      if (cable.a && cable.b && cable.wireId) return;
      const pts = cablePointsAbsolute(cable);
      if (pts.length < 2) return;
      if (typeof drawPathFn === "function") {
        drawPathFn(pts, cable.color, false, cable.id, false);
      }
      /* Terminaisons extrémités libres. */
      [[pts[0], cable.showStartTerminal || cable.looseStart],
       [pts[pts.length - 1], cable.showEndTerminal || cable.looseEnd]].forEach((pair) => {
        if (!pair[1] || !pair[0]) return;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", pair[0].x);
        c.setAttribute("cy", pair[0].y);
        c.setAttribute("r", "5");
        c.setAttribute("fill", cable.color || "#92400e");
        c.setAttribute("stroke", "#0f172a");
        c.setAttribute("stroke-width", "1.2");
        c.setAttribute("class", "eduvolt-loose-end");
        c.setAttribute("pointer-events", "none");
        svg.appendChild(c);
      });
      if (cable.name) {
        const mid = pts[Math.floor(pts.length / 2)];
        const lab = document.createElementNS(NS, "text");
        lab.setAttribute("class", "wire-len");
        lab.setAttribute("x", mid.x);
        lab.setAttribute("y", mid.y - 8);
        lab.setAttribute("text-anchor", "middle");
        lab.textContent = String(cable.name).slice(0, 24);
        svg.appendChild(lab);
      }
    });
  }

  function enterCableMode(tool) {
    const state = ensureState();
    if (!state) return;
    state.cableTool = tool === "v" ? "v" : "h";
    if (typeof global.setMode === "function") global.setMode("cable");
    else state.mode = "cable";
    syncToolbar();
  }

  function exitCableMode() {
    cancelDraft();
    if (typeof global.setMode === "function") global.setMode("select");
  }

  function applyPreset(key) {
    const state = ensureState();
    if (!state) return;
    state.cablePreset = PRESETS[key] ? key : "";
    const p = activePreset();
    state.color = p.color;
    state.section = p.section;
    state.colorManual = true;
    state.cableName = p.name;
    if (state.cableDraft) {
      state.cableDraft.preset = p.id;
      state.cableDraft.color = p.color;
      state.cableDraft.section = p.section;
      state.cableDraft.name = p.name + " · " + (state.cableNo || 1);
      state.cableDraft.colorManual = true;
    }
    try { if (typeof global.syncSectionSelect === "function") global.syncSectionSelect(); } catch (_) {}
    try { if (typeof global.syncColorSwatches === "function") global.syncColorSwatches(); } catch (_) {}
    syncToolbar();
  }

  function syncToolbar() {
    const state = ensureState();
    if (!state) return;
    const mode = state.mode;
    const btnCable = document.getElementById("modeCable");
    const btnH = document.getElementById("cableToolH");
    const btnV = document.getElementById("cableToolV");
    const btnExit = document.getElementById("cableExit");
    const sel = document.getElementById("cablePreset");
    const banner = document.getElementById("eduvoltCableBanner");
    if (btnCable) btnCable.classList.toggle("active", mode === "cable");
    if (btnH) {
      btnH.classList.toggle("active", mode === "cable" && state.cableTool === "h");
      btnH.setAttribute("aria-pressed", mode === "cable" && state.cableTool === "h" ? "true" : "false");
    }
    if (btnV) {
      btnV.classList.toggle("active", mode === "cable" && state.cableTool === "v");
      btnV.setAttribute("aria-pressed", mode === "cable" && state.cableTool === "v" ? "true" : "false");
    }
    if (btnExit) btnExit.hidden = mode !== "cable";
    if (sel && state.cablePreset && sel.value !== state.cablePreset) sel.value = state.cablePreset || "";
    if (banner) {
      banner.hidden = mode !== "cable";
      banner.textContent = state.cableDraft
        ? ("Dibujando Cable — " + (state.cableTool === "v" ? "Vertical" : "Horizontal") + " · clic = segment · borne = attach · Entrée = confirmer · Esc = cancelar")
        : ("Dibujar cable — " + (state.cableTool === "v" ? "Cable vertical" : "Cable horizontal") + " · preset " + ((PRESETS[state.cablePreset] || PRESETS.v1).name));
    }
    try { document.body.classList.toggle("eduvolt-cable-mode", mode === "cable"); } catch (_) {}
    renderFreeTermsPanel();
  }

  function renderFreeTermsPanel() {
    const panel = document.getElementById("eduvoltFreeTerms");
    if (!panel) return;
    const state = ensureState();
    const show = state && (state.mode === "cable" || state.mode === "wire") && state.showFreeTermsPanel !== false;
    panel.hidden = !show;
    if (!show) return;
    const list = listFreeTerminals();
    const body = panel.querySelector(".ev-ft-body");
    if (!body) return;
    body.innerHTML = "";
    const title = panel.querySelector(".ev-ft-title");
    if (title) title.textContent = "BORNES SIN CONEXIÓN (" + list.length + ")";
    if (!list.length) {
      body.innerHTML = '<div class="ev-ft-empty">Aucune borne libre</div>';
      return;
    }
    list.slice(0, 80).forEach((ft) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "ev-ft-row";
      row.textContent = (ft.tag || "?") + " · " + ft.term;
      row.title = "Câbler depuis " + ft.tag + " / " + ft.term;
      row.onclick = () => {
        enterCableMode(state.cableTool || "h");
        onTermClick(ft.uid, ft.term);
        try { if (typeof global.render === "function") global.render(); } catch (_) {}
      };
      body.appendChild(row);
    });
  }

  function placeWireDuct() {
    if (typeof global.add === "function") {
      global.add("goulotte_h_480");
      return;
    }
  }

  function bindUi() {
    ensureState();
    applyPreset((S() && S().cablePreset) || "v1");
    const btnCable = document.getElementById("modeCable");
    const btnH = document.getElementById("cableToolH");
    const btnV = document.getElementById("cableToolV");
    const btnExit = document.getElementById("cableExit");
    const btnDuct = document.getElementById("btnWireDuct");
    const sel = document.getElementById("cablePreset");
    if (btnCable) btnCable.onclick = () => enterCableMode((S() && S().cableTool) || "h");
    if (btnH) btnH.onclick = () => {
      const state = ensureState();
      if (state) state.cableTool = "h";
      enterCableMode("h");
      try { if (typeof global.render === "function") global.render(); } catch (_) {}
    };
    if (btnV) btnV.onclick = () => {
      const state = ensureState();
      if (state) state.cableTool = "v";
      enterCableMode("v");
      try { if (typeof global.render === "function") global.render(); } catch (_) {}
    };
    if (btnExit) btnExit.onclick = () => {
      exitCableMode();
      try { if (typeof global.render === "function") global.render(); } catch (_) {}
    };
    if (btnDuct) btnDuct.onclick = () => placeWireDuct();
    if (sel) {
      sel.onchange = () => {
        applyPreset(sel.value || "v1");
        if (S() && S().mode !== "cable") enterCableMode((S() && S().cableTool) || "h");
        try { if (typeof global.render === "function") global.render(); } catch (_) {}
      };
    }
    document.addEventListener("keydown", (ev) => {
      const state = ensureState();
      if (!state || state.mode !== "cable") return;
      if (ev.key === "Escape") {
        if (state.cableDraft) cancelDraft();
        else exitCableMode();
        try { if (typeof global.render === "function") global.render(); } catch (_) {}
        ev.preventDefault();
      } else if (ev.key === "Enter" && state.cableDraft) {
        finalizeDraft({});
        try { if (typeof global.render === "function") global.render(); } catch (_) {}
        ev.preventDefault();
      }
    });
    syncToolbar();
  }

  global.EduVoltCable = {
    PRESETS: PRESETS,
    ensureState: ensureState,
    clearCableDraft: clearCableDraft,
    startDraft: startDraft,
    updateDraftPreview: updateDraftPreview,
    addDraftCorner: addDraftCorner,
    finalizeDraft: finalizeDraft,
    cancelDraft: cancelDraft,
    syncCableToWire: syncCableToWire,
    syncAllCablesToWires: syncAllCablesToWires,
    sanitizeCable: sanitizeCable,
    listFreeTerminals: listFreeTerminals,
    onBoardPointer: onBoardPointer,
    onTermClick: onTermClick,
    drawCables: drawCables,
    enterCableMode: enterCableMode,
    exitCableMode: exitCableMode,
    applyPreset: applyPreset,
    syncToolbar: syncToolbar,
    renderFreeTermsPanel: renderFreeTermsPanel,
    placeWireDuct: placeWireDuct,
    bindUi: bindUi,
    cablePointsAbsolute: cablePointsAbsolute
  };
})(typeof window !== "undefined" ? window : globalThis);
