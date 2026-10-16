/**
 * Modèle câblage EduVolt Designer — objet « câble » (REA APK 2.2.10).
 * Hors scope : goulottes / wire duct (pas le câblage).
 *
 * REA evidence (isolate strings + CableElement tokens) :
 *  - Dibujar / Dibujando Cable · hWire / vWire
 *  - Snap horizontal/vertical · Snap to grid ON/OFF
 *  - Cable (loose end) · Extremos independientes
 *  - startLabel / endLabel / syncLabels (Same label both ends)
 *  - Segments : Segmento N · Renombrar / Eliminar / Subir / Bajar
 *  - cable_confirm / cable_cancel / Exit cable mode
 *  - BORNES SIN CONEXIÓN
 */
(function (global) {
  "use strict";

  const PRESETS = {
    v1: { id: "v1", name: "Câble v1", section: 1.5, color: "#92400e" },
    v2: { id: "v2", name: "Câble v2", section: 2.5, color: "#0088ce" },
    v3: { id: "v3", name: "Câble v3", section: 6, color: "#111111" }
  };
  /** EduVolt grille câble ≈ 50 px (REA: Snap horizontal/vertical + grille). */
  const CABLE_GRID = 50;

  function S() {
    return global.state;
  }

  function ensureState() {
    const state = S();
    if (!state) return null;
    if (!Array.isArray(state.cables)) state.cables = [];
    if (state.cableNo == null) state.cableNo = 1;
    if (!state.cableTool) state.cableTool = "h";
    if (state.cablePreset == null) state.cablePreset = "v1";
    if (state.cableDraft == null) state.cableDraft = null;
    if (state.selectedCable == null) state.selectedCable = null;
    /* Pas de cadres flottants sur le plan (REA = data/strings, pas overlay canvas). */
    if (state.showFreeTermsPanel == null) state.showFreeTermsPanel = false;
    if (state.cableSnapGrid == null) state.cableSnapGrid = true;
    if (state.cableSyncLabels == null) state.cableSyncLabels = false;
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

  function gridStep() {
    const state = ensureState();
    if (state && state.cableSnapGrid === false) return 1;
    return CABLE_GRID;
  }

  function snapPoint(x, y, step) {
    const s = step > 0 ? step : gridStep();
    return { x: Math.round(x / s) * s, y: Math.round(y / s) * s };
  }

  /** Snap H/V puis grille (REA: Snap horizontal/vertical). */
  function projectOrtho(last, x, y, tool) {
    if (!last) return snapPoint(x, y);
    let px = x, py = y;
    if (tool === "h") py = last.y;
    else if (tool === "v") px = last.x;
    else if (Math.abs(x - last.x) >= Math.abs(y - last.y)) py = last.y;
    else px = last.x;
    const snapped = snapPoint(px, py);
    /* Garder l’axe verrouillé après snap grille. */
    if (tool === "h") snapped.y = last.y;
    if (tool === "v") snapped.x = last.x;
    return snapped;
  }

  function pickNearTerminal(x, y, skip) {
    const state = ensureState();
    if (!state || typeof global.nearestPanelTerm !== "function") return null;
    return global.nearestPanelTerm(x, y, {
      skipUid: skip && skip.uid,
      skipTerm: skip && skip.term,
      maxDist: 28
    }) || null;
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
    let start = snapPoint(x, y);
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
    const label = preset.name;
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
      startLabel: label,
      endLabel: state.cableSyncLabels ? label : "",
      syncLabels: !!state.cableSyncLabels,
      segments: [{ name: "Segmento 1", fromIdx: 0, type: state.cableTool === "v" ? "v" : "h" }]
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
    state.preview = { pts: draftPointsAbsolute(draft).concat([{ x: cur.x, y: cur.y }]), eduvoltCable: true };
  }

  function addDraftCorner(x, y) {
    const state = ensureState();
    const draft = state && state.cableDraft;
    if (!draft) return false;
    const last = draft.points[draft.points.length - 1];
    const cur = projectOrtho(last, x, y, draft.tool);
    if (Math.hypot(cur.x - last.x, cur.y - last.y) < Math.max(8, gridStep() * 0.4)) return false;
    draft.points.push(cur);
    const segType = draft.tool;
    draft.tool = draft.tool === "h" ? "v" : "h";
    if (!draft.segments) draft.segments = [];
    draft.segments.push({
      name: "Segmento " + (draft.segments.length + 1),
      fromIdx: draft.points.length - 1,
      type: segType
    });
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
        else {
          /* Dernier segment : snap ortho vers la borne. */
          const prev = points[points.length - 2] || points[0];
          const ortho = projectOrtho(prev, tp.x, tp.y, draft.tool);
          points[points.length - 1] = { x: ortho.x, y: ortho.y };
          if (Math.hypot(ortho.x - tp.x, ortho.y - tp.y) > 1) points.push({ x: tp.x, y: tp.y });
        }
      }
      looseEnd = false;
    }

    if (points.length < 2) {
      clearCableDraft();
      return null;
    }

    if (typeof global.pushHistory === "function") global.pushHistory();

    const startLabel = String(draft.startLabel || "").trim().slice(0, 32);
    let endLabel = String(draft.endLabel || "").trim().slice(0, 32);
    const syncLabels = !!(draft.syncLabels || state.cableSyncLabels);
    if (syncLabels && startLabel) endLabel = startLabel;

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
      startLabel: startLabel,
      endLabel: endLabel,
      syncLabels: syncLabels,
      segments: (draft.segments || []).slice(),
      wireId: null
    };
    state.cables.push(cable);
    syncCableToWire(cable);
    clearCableDraft();
    state.selectedCable = cable.id;
    state.selectedWire = cable.wireId || null;
    renderSegmentsPanel();
    renderLabelsPanel();
    syncToolbar();
    return cable;
  }

  function cancelDraft() {
    clearCableDraft();
  }

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
        tagA: cable.startLabel || null,
        tagB: cable.endLabel || null,
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
      w.tagA = cable.startLabel || null;
      w.tagB = cable.endLabel || null;
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
      showEndTerminal: c.showEndTerminal !== false && !c.b,
      syncLabels: !!c.syncLabels
    };
    if (c.preset) out.preset = c.preset;
    if (c.colorManual) out.colorManual = true;
    if (c.startLabel) out.startLabel = String(c.startLabel).slice(0, 32);
    if (c.endLabel) out.endLabel = String(c.endLabel).slice(0, 32);
    if (c.a && c.a.uid != null) out.a = { uid: c.a.uid, term: c.a.term };
    if (c.b && c.b.uid != null) out.b = { uid: c.b.uid, term: c.b.term };
    if (c.wireId) out.wireId = c.wireId;
    if (Array.isArray(c.segments) && c.segments.length) {
      out.segments = c.segments.map((s) => ({
        name: String((s && s.name) || "").slice(0, 32),
        fromIdx: Number(s && s.fromIdx) || 0,
        type: s && (s.type === "v" || s.type === "h") ? s.type : undefined
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
        out.push({ uid: item.uid, term: t.id, tag: item.tag || item.type, type: item.type });
      });
    });
    return out;
  }

  function selectedCableObj() {
    const state = ensureState();
    if (!state || !state.selectedCable) return null;
    return (state.cables || []).find((c) => c.id === state.selectedCable) || null;
  }

  function renameSegment(cableId, segIndex, name) {
    const state = ensureState();
    const cab = (state.cables || []).find((c) => c.id === cableId);
    if (!cab || !cab.segments || !cab.segments[segIndex]) return false;
    if (typeof global.pushHistory === "function") global.pushHistory();
    cab.segments[segIndex].name = String(name || "").trim().slice(0, 32) || ("Segmento " + (segIndex + 1));
    return true;
  }

  function deleteSegment(cableId, segIndex) {
    const state = ensureState();
    const cab = (state.cables || []).find((c) => c.id === cableId);
    if (!cab || !cab.segments || cab.segments.length <= 1) return false;
    if (segIndex < 0 || segIndex >= cab.segments.length) return false;
    if (typeof global.pushHistory === "function") global.pushHistory();
    const from = cab.segments[segIndex].fromIdx | 0;
    const next = cab.segments[segIndex + 1];
    const to = next ? (next.fromIdx | 0) : ((cab.points || []).length - 1);
    if (cab.points && cab.points.length > 2 && to > from) {
      cab.points.splice(from + 1, Math.max(0, to - from - 1));
    }
    cab.segments.splice(segIndex, 1);
    cab.segments.forEach((s, i) => {
      if (!s.name || /^(Segmento|Segment)\s+\d+$/i.test(s.name)) s.name = "Segmento " + (i + 1);
    });
    syncCableToWire(cab);
    return true;
  }

  function moveSegment(cableId, segIndex, dir) {
    const state = ensureState();
    const cab = (state.cables || []).find((c) => c.id === cableId);
    if (!cab || !cab.segments) return false;
    const j = segIndex + (dir < 0 ? -1 : 1);
    if (segIndex < 0 || j < 0 || segIndex >= cab.segments.length || j >= cab.segments.length) return false;
    if (typeof global.pushHistory === "function") global.pushHistory();
    const tmp = cab.segments[segIndex];
    cab.segments[segIndex] = cab.segments[j];
    cab.segments[j] = tmp;
    return true;
  }

  function setCableLabels(cableId, startLabel, endLabel, sync) {
    const state = ensureState();
    const cab = (state.cables || []).find((c) => c.id === cableId);
    if (!cab) return false;
    if (typeof global.pushHistory === "function") global.pushHistory();
    cab.startLabel = String(startLabel || "").trim().slice(0, 32);
    cab.syncLabels = !!sync;
    cab.endLabel = cab.syncLabels ? cab.startLabel : String(endLabel || "").trim().slice(0, 32);
    syncCableToWire(cab);
    return true;
  }

  function onBoardPointer(ev, pt) {
    const state = ensureState();
    if (!state || state.mode !== "cable") return false;
    const draft = state.cableDraft;
    const snap = pickNearTerminal(pt.x, pt.y, draft && draft.a);

    if (!draft) {
      if (snap) startDraft(pt.x, pt.y, snap);
      else startDraft(pt.x, pt.y, null);
      return true;
    }
    if (snap) {
      finalizeDraft({ b: { uid: snap.uid, term: snap.term } });
      return true;
    }
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

  function drawEndLabel(svg, NS, pt, text, dy) {
    if (!text || !pt) return;
    const lab = document.createElementNS(NS, "text");
    lab.setAttribute("class", "wire-len eduvolt-end-label");
    lab.setAttribute("x", pt.x);
    lab.setAttribute("y", pt.y + dy);
    lab.setAttribute("text-anchor", "middle");
    lab.textContent = String(text).slice(0, 24);
    svg.appendChild(lab);
  }

  function pathD(pts) {
    if (!pts || pts.length < 2) return "";
    let d = "M " + pts[0].x + " " + pts[0].y;
    for (let i = 1; i < pts.length; i++) d += " L " + pts[i].x + " " + pts[i].y;
    return d;
  }

  function selectCable(cableId) {
    const state = ensureState();
    if (!state) return;
    const cab = (state.cables || []).find((c) => c.id === cableId);
    if (!cab) return;
    state.selectedCable = cab.id;
    state.selectedWire = cab.wireId || null;
    state.selected = null;
    state.selectedIds = [];
    renderSegmentsPanel();
    renderLabelsPanel();
  }

  function drawCables(svg, NS, drawPathFn) {
    const state = ensureState();
    if (!state || !svg || !NS) return;
    (state.cables || []).forEach((cable) => {
      if (cable.a && cable.b && cable.wireId) {
        /* Labels d’extrémités même si le path est le wire sync. */
        const pts = cablePointsAbsolute(cable);
        if (pts.length >= 2) {
          drawEndLabel(svg, NS, pts[0], cable.startLabel, -10);
          drawEndLabel(svg, NS, pts[pts.length - 1], cable.endLabel, 14);
        }
        return;
      }
      const pts = cablePointsAbsolute(cable);
      if (pts.length < 2) return;
      const d = pathD(pts);
      const selected = state.selectedCable === cable.id;
      /* Hit cible propre câble (id cab* ≠ wire id). */
      const hit = document.createElementNS(NS, "path");
      hit.setAttribute("d", d);
      hit.setAttribute("fill", "none");
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "18");
      hit.setAttribute("stroke-linecap", "round");
      hit.setAttribute("stroke-linejoin", "round");
      hit.setAttribute("class", "eduvolt-cable-hit");
      hit.style.pointerEvents = "stroke";
      hit.style.cursor = "pointer";
      hit.addEventListener("pointerdown", (ev) => {
        ev.stopPropagation();
        if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
        ev.preventDefault();
        if (ev.button === 2) return;
            selectCable(cable.id);
        try { if (typeof global.render === "function") global.render(); } catch (_) {}
        renderSegmentsPanel();
        renderLabelsPanel();
      });
      svg.appendChild(hit);
      if (selected) {
        const ring = document.createElementNS(NS, "path");
        ring.setAttribute("d", d);
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "#3b82f6");
        ring.setAttribute("stroke-width", "10");
        ring.setAttribute("stroke-linecap", "round");
        ring.setAttribute("stroke-linejoin", "round");
        ring.setAttribute("class", "eduvolt-cable-sel");
        ring.setAttribute("pointer-events", "none");
        svg.appendChild(ring);
      }
      /* Tracé visible sans id wire (évite collision selectedWire). */
      if (typeof drawPathFn === "function") drawPathFn(pts, cable.color, false, null, false);
      else {
        const stroke = document.createElementNS(NS, "path");
        stroke.setAttribute("d", d);
        stroke.setAttribute("fill", "none");
        stroke.setAttribute("stroke", cable.color || "#92400e");
        stroke.setAttribute("stroke-width", "3.5");
        stroke.setAttribute("stroke-linecap", "round");
        stroke.setAttribute("stroke-linejoin", "round");
        stroke.setAttribute("pointer-events", "none");
        svg.appendChild(stroke);
      }
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
      drawEndLabel(svg, NS, pts[0], cable.startLabel, -10);
      drawEndLabel(svg, NS, pts[pts.length - 1], cable.endLabel, 14);
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
    state.cablePreset = PRESETS[key] ? key : "v1";
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
      state.cableDraft.startLabel = p.name;
      if (state.cableDraft.syncLabels) state.cableDraft.endLabel = p.name;
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
    const btnSnap = document.getElementById("cableSnapGrid");
    const sel = document.getElementById("cablePreset");
    const banner = document.getElementById("eduvoltCableBanner");
    const btnDuct = document.getElementById("btnWireDuct");
    if (btnDuct) btnDuct.hidden = true; /* hors câblage */
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
    if (btnSnap) {
      btnSnap.hidden = mode !== "cable";
      btnSnap.classList.toggle("active", !!state.cableSnapGrid);
      btnSnap.title = state.cableSnapGrid
        ? "Snap to grid: ON — Snap horizontal/vertical"
        : "Snap to grid: OFF";
      btnSnap.setAttribute("aria-pressed", state.cableSnapGrid ? "true" : "false");
    }
    if (sel && state.cablePreset && sel.value !== state.cablePreset) sel.value = state.cablePreset || "v1";
    /* Banner bas d’écran : pas dans EduVolt sur le plan — masqué. */
    if (banner) banner.hidden = true;
    try { document.body.classList.toggle("eduvolt-cable-mode", mode === "cable"); } catch (_) {}
    renderFreeTermsPanel();
    renderSegmentsPanel();
    renderLabelsPanel();
  }

  /** Cadres flottants retirés du plan (v138) — REA = modèle, pas overlays EduVolt canvas. */
  function renderFreeTermsPanel() {
    const panel = document.getElementById("eduvoltFreeTerms");
    if (panel) panel.hidden = true;
  }

  function renderSegmentsPanel() {
    const panel = document.getElementById("eduvoltSegments");
    if (panel) panel.hidden = true;
  }

  function renderLabelsPanel() {
    const panel = document.getElementById("eduvoltCableLabels");
    if (panel) panel.hidden = true;
  }

  function bindUi() {
    ensureState();
    applyPreset((S() && S().cablePreset) || "v1");
    const btnCable = document.getElementById("modeCable");
    const btnH = document.getElementById("cableToolH");
    const btnV = document.getElementById("cableToolV");
    const btnExit = document.getElementById("cableExit");
    const btnSnap = document.getElementById("cableSnapGrid");
    const btnDuct = document.getElementById("btnWireDuct");
    const sel = document.getElementById("cablePreset");
    if (btnDuct) { btnDuct.hidden = true; btnDuct.onclick = null; }
    if (btnCable) btnCable.onclick = () => enterCableMode((S() && S().cableTool) || "h");
    if (btnH) btnH.onclick = () => {
      const state = ensureState();
      if (state) state.cableTool = "h";
      enterCableMode("h");
      try { global.render(); } catch (_) {}
    };
    if (btnV) btnV.onclick = () => {
      const state = ensureState();
      if (state) state.cableTool = "v";
      enterCableMode("v");
      try { global.render(); } catch (_) {}
    };
    if (btnExit) btnExit.onclick = () => { exitCableMode(); try { global.render(); } catch (_) {} };
    if (btnSnap) btnSnap.onclick = () => {
      const state = ensureState();
      if (!state) return;
      state.cableSnapGrid = !state.cableSnapGrid;
      syncToolbar();
    };
    if (sel) sel.onchange = () => {
      applyPreset(sel.value || "v1");
      if (S() && S().mode !== "cable") enterCableMode((S() && S().cableTool) || "h");
      try { global.render(); } catch (_) {}
    };

    const startInp = document.getElementById("evLabelStart");
    const endInp = document.getElementById("evLabelEnd");
    const syncChk = document.getElementById("evLabelSync");
    const commitLabels = () => {
      const cab = selectedCableObj();
      if (!cab) return;
      setCableLabels(cab.id, startInp && startInp.value, endInp && endInp.value, syncChk && syncChk.checked);
      try { global.render(); } catch (_) {}
      renderLabelsPanel();
    };
    if (startInp) startInp.onchange = commitLabels;
    if (endInp) endInp.onchange = commitLabels;
    if (syncChk) syncChk.onchange = commitLabels;

    document.addEventListener("keydown", (ev) => {
      const state = ensureState();
      if (!state || state.mode !== "cable") return;
      if (ev.key === "Escape") {
        if (state.cableDraft) cancelDraft();
        else exitCableMode();
        try { global.render(); } catch (_) {}
        ev.preventDefault();
      } else if (ev.key === "Enter" && state.cableDraft) {
        finalizeDraft({});
        try { global.render(); } catch (_) {}
        ev.preventDefault();
      }
    });
    syncToolbar();
  }

  global.EduVoltCable = {
    PRESETS: PRESETS,
    CABLE_GRID: CABLE_GRID,
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
    renderSegmentsPanel: renderSegmentsPanel,
    renderLabelsPanel: renderLabelsPanel,
    renameSegment: renameSegment,
    deleteSegment: deleteSegment,
    moveSegment: moveSegment,
    setCableLabels: setCableLabels,
    selectCable: selectCable,
    bindUi: bindUi,
    cablePointsAbsolute: cablePointsAbsolute
  };
})(typeof window !== "undefined" ? window : globalThis);
