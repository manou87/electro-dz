// =====================================================
// CADe Web Ã¢â‚¬â€ FiaÃƒÂ§ÃƒÂ£o (VERSÃƒÆ’O FINAL COM CAMINHO MANUAL)
// =====================================================

// ---------- VARIÃƒÂVEIS ----------
let corFioAtual = '#b71c1c';
let espessuraFioNivelAtual = 2;
var pontosFioAtual = [];
let previewLine = null;
var listaFios = [];
let fiosSelecionados = new Set();
let emendasSelecionadas = new Set();
let wireSelectionPinned = false;
let wireDragState = null;
let junctionDragState = null;
let wireSelectionClearTimer = null;
let autoWireEnabled = false;
let autoWireGuideTimer = null;
let autoWirePreviewThrottleTimer = null;
let autoWirePreviewLastAt = 0;
let autoWirePreviewPendingComponents = null;
let wireIdSeed = 1;
let wireNumberSeed = 1;
let wireNumberDragState = null;
let wireEditDialogState = null;
const BASE_GRID_SIZE = window.GRID_SIZE || 20;
const DEFAULT_WIRE_SNAP = Math.max(5, Math.round(BASE_GRID_SIZE / 2));
const WIRE_SELECTION_AUTO_CLEAR_MS = 0;
let wireSegmentIndex = null;
let wireSegmentIndexDirty = true;
let wireAssistEnabled = false;
const ASSIST_BORNE_HOVER_RADIUS = 12;
const ASSIST_BORNE_CLICK_RADIUS = 14;
let hovered2DBorne = null;
const REAL_RELE_TOP_OVERLAY_PINS = new Set(['95', '96', '97', '98']);
const REAL_RELE_SEGURANCA_TOP_OVERLAY_PINS = new Set(['A1', 'Y1', 'S21', 'S22', 'S11', 'S12', 'Y2', 'A2']);
const REAL_RELE_TOP_OVERLAY_LENGTH_PX = 110;
let wire2DDecorVisible = false;
let wireJunctionRenderScheduled = false;
let mobileWireTouchState = null;
let mobileWireHoldTimer = null;
const wireVisualSyncInProgress = new WeakSet();
const WIRE_TERMINAL_BITOLA_META = {
    1: { color: '#e53935', label: 'Vermelho', range: '0,5-1,5 mmÂ²' },
    2: { color: '#1e88e5', label: 'Azul', range: '1,5-2,5 mmÂ²' },
    3: { color: '#f1c40f', label: 'Amarelo', range: '4-6 mmÂ²' }
};

function getWireSnapSize() {
    const cssValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--wire-snap')
        .trim();
    const parsed = parseFloat(cssValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_WIRE_SNAP;
    return parsed;
}

function getWireSearchRadius() {
    return Math.max(8, Math.round(getWireSnapSize() * 1.2));
}

const MOBILE_WIRE_TARGET_OFFSET_PX = 92;
const MOBILE_WIRE_TARGET_HOLD_MS = 220;
const MOBILE_WIRE_TARGET_RADIUS = 18;
const MOBILE_WIRE_HOLD_REARM_DELTA_PX = 12;

function getWireThicknessByLevel(level) {
    const safeLevel = [1, 2, 3].includes(level) ? level : 2;
    if (is2DWorkspaceActive()) {
        if (safeLevel === 1) return 4;
        if (safeLevel === 2) return 7;
        return 9;
    }
    const cssValue = getComputedStyle(document.documentElement)
        .getPropertyValue(`--wire-thickness-${safeLevel}`)
        .trim();
    const parsed = parseFloat(cssValue);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;

    if (safeLevel === 1) return 2;
    if (safeLevel === 3) return 7;
    return 4;
}

function getCurrentWireThickness() {
    return getWireThicknessByLevel(espessuraFioNivelAtual);
}

function applyWireThickness(poly, widthPx) {
    if (!poly) return;
    const width = Number.isFinite(widthPx) && widthPx > 0 ? widthPx : getCurrentWireThickness();
    poly.style.setProperty('--wire-width', `${width}px`);
}

function parseHexChannel(value) {
    const parsed = parseInt(value, 16);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseWireColor(color) {
    const raw = String(color || '').trim();
    const hex = raw.startsWith('#') ? raw.slice(1) : raw;
    if (hex.length === 3) {
        return {
            r: parseHexChannel(hex[0] + hex[0]),
            g: parseHexChannel(hex[1] + hex[1]),
            b: parseHexChannel(hex[2] + hex[2])
        };
    }
    if (hex.length === 6) {
        return {
            r: parseHexChannel(hex.slice(0, 2)),
            g: parseHexChannel(hex.slice(2, 4)),
            b: parseHexChannel(hex.slice(4, 6))
        };
    }
    return null;
}

function clampColorChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToCss({ r, g, b }, alpha = 1) {
    const rr = clampColorChannel(r);
    const gg = clampColorChannel(g);
    const bb = clampColorChannel(b);
    if (alpha >= 1) return `rgb(${rr}, ${gg}, ${bb})`;
    return `rgba(${rr}, ${gg}, ${bb}, ${Math.max(0, Math.min(1, alpha))})`;
}

function mixWireColor(color, target, ratio, alpha = 1) {
    const base = parseWireColor(color);
    if (!base) return alpha >= 1 ? String(color || '#b71c1c') : `rgba(255, 255, 255, ${alpha})`;
    return rgbToCss({
        r: base.r + (target.r - base.r) * ratio,
        g: base.g + (target.g - base.g) * ratio,
        b: base.b + (target.b - base.b) * ratio
    }, alpha);
}

function getWireRenderPalette(color) {
    return {
        base: mixWireColor(color, { r: 255, g: 255, b: 255 }, 0.16, 1),
        edge: mixWireColor(color, { r: 0, g: 0, b: 0 }, 0.38, 1),
        highlight: mixWireColor(color, { r: 255, g: 248, b: 248 }, 0.62, 0.84)
    };
}

function applyWireVisualStrokeWidths(wireObj, width) {
    const baseWidth = Number.isFinite(width) && width > 0 ? width : getCurrentWireThickness();
    const outlineWidth = baseWidth + 2.8;
    const bodyWidth = Math.max(1.8, baseWidth - 0.45);
    const highlightWidth = Math.max(0.9, baseWidth * 0.26);
    if (wireObj.outlineEl) wireObj.outlineEl.style.strokeWidth = `${outlineWidth}px`;
    if (wireObj.bodyEl) wireObj.bodyEl.style.strokeWidth = `${bodyWidth}px`;
    if (wireObj.highlightEl) wireObj.highlightEl.style.strokeWidth = `${highlightWidth}px`;
}

function applyWireRenderAppearance(wireObj, color, width) {
    if (!wireObj) return;
    if (!is2DWorkspaceActive() || !wireObj.bodyEl || !wireObj.highlightEl) {
        if (wireObj.element) {
            wireObj.element.style.stroke = color;
            if (!wireObj.element.dataset.originalColor) wireObj.element.dataset.originalColor = wireObj.colorOriginal || color;
            if (!wireObj.element.dataset.configColor) wireObj.element.dataset.configColor = wireObj.configColor || color;
            applyWireThickness(wireObj.element, width);
        }
        if (wireObj.outlineEl) {
            wireObj.outlineEl.style.stroke = 'rgba(255, 255, 255, 0.92)';
            applyWireThickness(wireObj.outlineEl, width);
        }
        return;
    }
    const palette = getWireRenderPalette(color);
    if (wireObj.outlineEl) wireObj.outlineEl.style.stroke = palette.edge;
    if (wireObj.bodyEl) wireObj.bodyEl.style.stroke = palette.base;
    if (wireObj.element) {
        if (wireObj._wireVisualObserver && String(wireObj.element.style.stroke || '').trim() !== 'transparent') {
            wireObj._ignoreNextVisualMutation = true;
        }
        wireObj.element.style.stroke = 'transparent';
        if (!wireObj.element.dataset.originalColor) wireObj.element.dataset.originalColor = wireObj.colorOriginal || color;
        if (!wireObj.element.dataset.configColor) wireObj.element.dataset.configColor = wireObj.configColor || color;
    }
    if (wireObj.highlightEl) wireObj.highlightEl.style.stroke = palette.highlight;
    if (Number.isFinite(width) && width > 0 && wireObj.element) applyWireThickness(wireObj.element, width);
    applyWireVisualStrokeWidths(wireObj, width);
}

function applyWireSimulationColor(wireObj, color) {
    if (!wireObj) return;
    const visualColor = String(color || '#7f8c8d').trim() || '#7f8c8d';
    const width = Number.isFinite(wireObj.width) && wireObj.width > 0
        ? wireObj.width
        : getCurrentWireThickness();
    wireObj.simulationColor = visualColor;
    if (wireObj.element) wireObj.element.dataset.simulationColor = visualColor;
    applyWireRenderAppearance(wireObj, visualColor, width);
}

function clearWireSimulationColor(wireObj) {
    if (!wireObj) return;
    delete wireObj.simulationColor;
    if (wireObj.element) delete wireObj.element.dataset.simulationColor;
}

function syncWireRenderAppearanceFromState(wireObj) {
    if (!wireObj) return;
    const simulationActive = !!(window.simulando || (typeof simulando !== 'undefined' ? simulando : false));
    const liveStroke = String(wireObj.element?.style?.stroke || '').trim();
    const currentColor = (simulationActive && wireObj.simulationColor)
        ? wireObj.simulationColor
        : (liveStroke && liveStroke !== 'transparent')
            ? liveStroke
            : (
                wireObj.configColor ||
                wireObj.baseColor ||
                wireObj.colorOriginal ||
                wireObj.element?.dataset?.configColor ||
                wireObj.element?.dataset?.originalColor ||
                corFioAtual
            );
    const width = Number.isFinite(wireObj.width) && wireObj.width > 0
        ? wireObj.width
        : getCurrentWireThickness();
    applyWireRenderAppearance(wireObj, currentColor, width);
}

function syncAllWireRenderAppearances() {
    if (!Array.isArray(listaFios) || !listaFios.length) return;
    listaFios.forEach(wireObj => {
        if (!wireObj?.element) return;
        updateWireElementPoints(wireObj);
        syncWireRenderAppearanceFromState(wireObj);
    });
}

function scheduleAllWireRenderAppearanceSync(delay = 0) {
    setTimeout(syncAllWireRenderAppearances, Math.max(0, Number(delay) || 0));
}

function installWireSimulationVisualObserver() {
    if (window.__wireSimulationVisualObserverInstalled) return;
    const install = () => {
        if (!document.body || window.__wireSimulationVisualObserverInstalled) return;
        window.__wireSimulationVisualObserverInstalled = true;
        const observer = new MutationObserver(() => {
            if (!is2DWorkspaceActive()) return;
            scheduleAllWireRenderAppearanceSync(0);
            scheduleAllWireRenderAppearanceSync(80);
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        window.__wireSimulationVisualObserver = observer;
    };
    if (document.body) install();
    else document.addEventListener('DOMContentLoaded', install, { once: true });
}

function observeWireRenderStyle(wireObj) {
    if (!wireObj?.element || wireObj._wireVisualObserver) return;
    const observer = new MutationObserver(() => {
        if (wireObj._ignoreNextVisualMutation) {
            wireObj._ignoreNextVisualMutation = false;
            return;
        }
        if (!is2DWorkspaceActive() || wireObj._wireVisualSyncQueued) return;
        wireObj._wireVisualSyncQueued = true;
        setTimeout(() => {
            wireObj._wireVisualSyncQueued = false;
            updateWireElementPoints(wireObj);
            syncWireRenderAppearanceFromState(wireObj);
        }, 0);
    });
    observer.observe(wireObj.element, { attributes: true, attributeFilter: ['style', 'points', 'data-original-color', 'data-config-color'] });
    wireObj._wireVisualObserver = observer;
}

function syncAutoWireButton() {
    const btn = document.getElementById('btn-auto-wire');
    if (!btn) return;
    btn.classList.toggle('toggle-on', !!autoWireEnabled);
    btn.setAttribute('aria-pressed', autoWireEnabled ? 'true' : 'false');
}

function syncWireAssistButton() {
    const btn = document.getElementById('btn-wire');
    if (!btn) return;
    const on = typeof (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'undefined' && (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) === 'fio';
    btn.classList.toggle('toggle-on', on);
    btn.classList.toggle('ativo', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function setAutoWireEnabled(force = null) {
    autoWireEnabled = force === null ? !autoWireEnabled : !!force;
    syncAutoWireButton();
    return autoWireEnabled;
}

function toggleAutoWireEnabled() {
    return setAutoWireEnabled(null);
}

function isAutoWireEnabled() {
    return !!autoWireEnabled;
}

function setWireAssistEnabled(force = null) {
    wireAssistEnabled = force === null ? !wireAssistEnabled : !!force;
    if (!wireAssistEnabled) {
        if (pontosFioAtual.length) cancelarFio();
        setAssistiveWireCursorActive(false);
        if (typeof window.hideMouseGuides === 'function') window.hideMouseGuides();
        if (typeof ativarFerramenta === 'function' && (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) === 'fio') {
            ativarFerramenta('select');
        }
    }
    syncWireAssistButton();
    return wireAssistEnabled;
}

function toggleWireAssistEnabled() {
    return setWireAssistEnabled(null);
}

function isWireAssistEnabled() {
    return !!wireAssistEnabled;
}

function isWireDrawingInteractionActive() {
    if (window.simulando) return false;
    return window.ferramentaAtiva === 'fio';
}

function isAssistiveWireDrawingInProgress() {
    return (
        !(window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) &&
        (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) === 'select' &&
        isWireAssistEnabled() &&
        pontosFioAtual.length > 0
    );
}

function setAssistiveWireCursorActive(active) {
    const bancada = document.querySelector('.mode-workspace.active .workbench') || document.getElementById('bancada');
    if (!bancada) return;
    bancada.classList.toggle('cursor-fio-assist', !!active);
    if (typeof window.updateMobileQuickActionButtons === 'function') {
        window.updateMobileQuickActionButtons();
    }
}

function getAssistiveBorneByCoords(x, y, forClick = false) {
    return getClosestBorne(x, y, forClick ? ASSIST_BORNE_CLICK_RADIUS : ASSIST_BORNE_HOVER_RADIUS);
}

function is2DWorkspaceActive() {
    if (typeof window.activeWorkspaceMode !== 'undefined') {
        return window.activeWorkspaceMode === '2d';
    }
    const bancada = document.querySelector('.mode-workspace.active .workbench') || document.getElementById('bancada');
    const workspace = bancada?.closest?.('.mode-workspace');
    const mode = String(workspace?.dataset?.mode || '').trim().toLowerCase();
    return mode === '2d';
}

function clear2DBorneHover() {
    if (hovered2DBorne && hovered2DBorne.classList) {
        hovered2DBorne.classList.remove('borne-hover-visible');
    }
    hovered2DBorne = null;
}

function set2DBorneHover(borneEl) {
    if (hovered2DBorne === borneEl) return;
    if (hovered2DBorne && hovered2DBorne.classList) {
        hovered2DBorne.classList.remove('borne-hover-visible');
    }
    hovered2DBorne = borneEl || null;
    if (hovered2DBorne && hovered2DBorne.classList) {
        hovered2DBorne.classList.add('borne-hover-visible');
    }
}

function update2DBorneHoverByCoords(x, y) {
    if (!is2DWorkspaceActive()) {
        clear2DBorneHover();
        return;
    }
    const hovered = getClosestBorne(x, y, ASSIST_BORNE_HOVER_RADIUS);
    set2DBorneHover(hovered?.el || null);
}

function snap(v) {
    if (is2DWorkspaceActive()) return v;
    const grid = window.GRID_SIZE || BASE_GRID_SIZE || 20;
    return Math.round(v / grid) * grid;
}

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return { x: x1, y: y1, d: Math.hypot(px - x1, py - y1) };
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    const x = x1 + t * dx;
    const y = y1 + t * dy;
    return { x, y, d: Math.hypot(px - x, py - y) };
}

function pointKey(x, y) {
    return `${Math.round(x)}:${Math.round(y)}`;
}

function parsePointKey(key) {
    const parts = String(key || '').split(':');
    if (parts.length !== 2) return null;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
}

function pointOnSegment(pt, a, b, tol = 1.2) {
    if (!pt || !a || !b) return false;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 <= 1e-9) {
        return Math.hypot((pt.x || 0) - (a.x || 0), (pt.y || 0) - (a.y || 0)) <= tol;
    }
    const len = Math.sqrt(len2);
    const cross = Math.abs((pt.y - a.y) * dx - (pt.x - a.x) * dy);
    const perpDist = cross / len;
    if (perpDist > tol) return false;
    const dot = (pt.x - a.x) * dx + (pt.y - a.y) * dy;
    const margin = tol / len;
    const t = dot / len2;
    return t >= -margin && t <= (1 + margin);
}

function samePoint(a, b) {
    return !!a && !!b && a.x === b.x && a.y === b.y;
}

function wirePointDistance(a, b) {
    if (!a || !b) return Number.POSITIVE_INFINITY;
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
}

function getPerpendicularDistanceToSegment(p, a, b) {
    if (!p || !a || !b) return Number.POSITIVE_INFINITY;
    return distancePointToSegment(p, a, b);
}

function simplifyWirePointsRdp(points, tolerance = 0.5) {
    const pts = Array.isArray(points) ? points : [];
    if (pts.length <= 2) return pts.slice();
    const keep = new Uint8Array(pts.length);
    keep[0] = 1;
    keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
        const [startIdx, endIdx] = stack.pop();
        let maxDist = -1;
        let bestIdx = -1;
        const a = pts[startIdx];
        const b = pts[endIdx];
        for (let i = startIdx + 1; i < endIdx; i++) {
            const dist = getPerpendicularDistanceToSegment(pts[i], a, b);
            if (dist > maxDist) {
                maxDist = dist;
                bestIdx = i;
            }
        }
        if (bestIdx > startIdx && bestIdx < endIdx && maxDist > tolerance) {
            keep[bestIdx] = 1;
            stack.push([startIdx, bestIdx], [bestIdx, endIdx]);
        }
    }
    const out = [];
    for (let i = 0; i < pts.length; i++) {
        if (keep[i]) out.push(pts[i]);
    }
    return out.length >= 2 ? out : pts.slice(0, 2);
}

function normalizeWirePoints(points, opts = {}) {
    const nearTol = Number.isFinite(opts?.nearTol) ? Math.max(0.01, opts.nearTol) : 0.05;
    const collinearTol = Number.isFinite(opts?.collinearTol) ? Math.max(0.01, opts.collinearTol) : 0.18;
    const aggressive = !!opts?.aggressive;
    const rdpTolerance = Number.isFinite(opts?.rdpTolerance) ? Math.max(0.05, opts.rdpTolerance) : 0.45;
    const sanitized = [];
    (Array.isArray(points) ? points : []).forEach(raw => {
        const x = Number(raw?.x);
        const y = Number(raw?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        sanitized.push({ ...raw, x, y });
    });
    if (sanitized.length <= 1) return sanitized;

    const deduped = [];
    sanitized.forEach(p => {
        const last = deduped[deduped.length - 1];
        if (!last || wirePointDistance(last, p) > nearTol) {
            deduped.push(p);
        }
    });
    if (deduped.length <= 2) return deduped;

    const out = [deduped[0]];
    for (let i = 1; i < deduped.length - 1; i++) {
        const prev = out[out.length - 1];
        const curr = deduped[i];
        const next = deduped[i + 1];
        if (!prev || !curr || !next) continue;
        const segLen = wirePointDistance(prev, next);
        if (segLen <= nearTol) continue;
        const dist = getPerpendicularDistanceToSegment(curr, prev, next);
        if (dist <= collinearTol && pointOnSegment(curr, prev, next, collinearTol * 2)) {
            continue;
        }
        out.push(curr);
    }
    out.push(deduped[deduped.length - 1]);

    if (!aggressive || out.length <= 80) return out;
    return simplifyWirePointsRdp(out, rdpTolerance);
}

function optimizeWireGeometryPoints(points, opts = {}) {
    const initial = normalizeWirePoints(points, opts);
    if (!opts?.aggressive || initial.length <= 80) return initial;
    return normalizeWirePoints(
        simplifyWirePointsRdp(initial, Number.isFinite(opts?.rdpTolerance) ? opts.rdpTolerance : 0.45),
        opts
    );
}

function updateWireElementPoints(wireObj) {
    if (!wireObj?.element || !Array.isArray(wireObj.points)) return;
    const pointsAttr = wireObj.points.map(p => `${p.x},${p.y}`).join(' ');
    wireObj.element.setAttribute('points', pointsAttr);
    const roundedPath = buildRoundedWirePath(wireObj.points);
    if (wireObj.outlineEl?.tagName?.toLowerCase?.() === 'path') wireObj.outlineEl.setAttribute('d', roundedPath);
    else if (wireObj.outlineEl) wireObj.outlineEl.setAttribute('points', pointsAttr);
    if (wireObj.bodyEl) wireObj.bodyEl.setAttribute('d', roundedPath);
    if (wireObj.highlightEl) wireObj.highlightEl.setAttribute('d', roundedPath);
}

function getWireGeometryStats(points) {
    const pts = Array.isArray(points) ? points : [];
    if (!pts.length) {
        return {
            points: 0,
            minX: 0, minY: 0, maxX: 0, maxY: 0,
            width: 0, height: 0,
            pathLength: 0,
            directLength: 0,
            ratio: 0
        };
    }
    let minX = pts[0].x;
    let minY = pts[0].y;
    let maxX = pts[0].x;
    let maxY = pts[0].y;
    let pathLength = 0;
    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
        if (i > 0) pathLength += wirePointDistance(pts[i - 1], p);
    }
    const directLength = pts.length >= 2 ? wirePointDistance(pts[0], pts[pts.length - 1]) : 0;
    const ratio = directLength > 0.01 ? (pathLength / directLength) : 0;
    return {
        points: pts.length,
        minX, minY, maxX, maxY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY),
        pathLength,
        directLength,
        ratio
    };
}

function rebuildPathological2DWirePoints(wireObj) {
    const pts = Array.isArray(wireObj?.points) ? wireObj.points : [];
    if (pts.length < 2) return null;
    const start = pts[0];
    const end = pts[pts.length - 1];
    const dx = Math.abs((end?.x || 0) - (start?.x || 0));
    const dy = Math.abs((end?.y || 0) - (start?.y || 0));
    const raw = [{ x: start.x, y: start.y }];
    if (dx > 0.01 && dy > 0.01) {
        let preferHorizontal = dx >= dy;
        for (let i = 1; i < pts.length; i++) {
            const p = pts[i];
            const segDx = Math.abs((p?.x || 0) - start.x);
            const segDy = Math.abs((p?.y || 0) - start.y);
            if ((segDx + segDy) > 2) {
                preferHorizontal = segDx >= segDy;
                break;
            }
        }
        raw.push(
            preferHorizontal
                ? { x: end.x, y: start.y }
                : { x: start.x, y: end.y }
        );
    }
    raw.push({ x: end.x, y: end.y });
    const normalized = normalizeWirePoints(raw, {
        aggressive: false,
        nearTol: 0.05,
        collinearTol: 0.15
    });
    return roundWireCorners(normalized, getWireCornerRadius());
}

function isPathological2DWireStats(stats) {
    const safe = stats && typeof stats === 'object' ? stats : null;
    if (!safe) return false;
    if (!Number.isFinite(safe.points) || safe.points < 600) return false;
    const shortBox = Math.max(safe.width || 0, safe.height || 0) <= 260;
    const extremeRatio = Number.isFinite(safe.ratio) && safe.ratio >= 18;
    const densePath = Number.isFinite(safe.pathLength) && safe.pathLength >= 1500;
    return (shortBox && densePath) || extremeRatio;
}

function log2DWireRepairEvent(wireObj, reason, beforeStats, afterStats) {
    const id = String(wireObj?.id || '?');
    const from = String(wireObj?.origem?.dataset?.pino || '-');
    const to = String(wireObj?.destino?.dataset?.pino || '-');
    const msg = `[auto-repair:${reason}] ${id} ${from}->${to} pts ${beforeStats?.points || 0}->${afterStats?.points || 0} ratio ${Number(beforeStats?.ratio || 0).toFixed(1)}->${Number(afterStats?.ratio || 0).toFixed(1)}`;
    try { console.warn(msg); } catch (_) {}
    if (typeof window.__simPerfLogEvent === 'function') window.__simPerfLogEvent(msg);
}

function log2DWireIssueEvent(wireObj, reason, stats) {
    const id = String(wireObj?.id || '?');
    const from = String(wireObj?.origem?.dataset?.pino || '-');
    const to = String(wireObj?.destino?.dataset?.pino || '-');
    const msg = `[2d-wire-issue:${reason}] ${id} ${from}->${to} pts ${stats?.points || 0} box ${Math.round(stats?.width || 0)}x${Math.round(stats?.height || 0)} ratio ${Number(stats?.ratio || 0).toFixed(1)}`;
    try { console.warn(msg); } catch (_) {}
    if (typeof window.__simPerfLogEvent === 'function') window.__simPerfLogEvent(msg);
}

function setPathological2DWireHighlight(wireObj, flagged, stats = null) {
    const poly = wireObj?.element || null;
    if (!poly) return;
    poly.classList.toggle('wire-pathological', !!flagged);
    if (flagged) {
        poly.dataset.wireIssue = 'pathological-2d';
        const pts = Number(stats?.points || (Array.isArray(wireObj?.points) ? wireObj.points.length : 0));
        const ratio = Number(stats?.ratio || 0).toFixed(1);
        poly.setAttribute('title', `Cabo com geometria corrompida. RefaÃƒÂ§a este cabo. Pontos: ${pts} | Razao: ${ratio}`);
    } else {
        delete poly.dataset.wireIssue;
        poly.removeAttribute('title');
    }
}

function inspectPathological2DWire(wireObj, reason = 'scan') {
    if (!wireObj || !Array.isArray(wireObj.points) || wireObj.points.length < 2) return false;
    const stats = getWireGeometryStats(wireObj.points);
    if (!isPathological2DWireStats(stats)) {
        setPathological2DWireHighlight(wireObj, false);
        return false;
    }
    setPathological2DWireHighlight(wireObj, true, stats);
    log2DWireIssueEvent(wireObj, reason, stats);
    return true;
}

function repairPathological2DWire(wireObj, reason = 'runtime') {
    if (!wireObj || !Array.isArray(wireObj.points) || wireObj.points.length < 2) return false;
    const beforeStats = getWireGeometryStats(wireObj.points);
    if (!isPathological2DWireStats(beforeStats)) return false;
    const rebuilt = rebuildPathological2DWirePoints(wireObj);
    if (!Array.isArray(rebuilt) || rebuilt.length < 2) return false;
    const afterStats = getWireGeometryStats(rebuilt);
    if (afterStats.points >= beforeStats.points) return false;
    wireObj.points = rebuilt.map(p => ({ ...p }));
    updateWireElementPoints(wireObj);
    setPathological2DWireHighlight(wireObj, false);
    log2DWireRepairEvent(wireObj, reason, beforeStats, afterStats);
    return true;
}

function validateAndRepair2DWires(opts = {}) {
    const force = !!opts?.force;
    const repair = !!opts?.repair;
    if (!force && !is2DWorkspaceActive()) {
        return { wiresChanged: 0, pointsRemoved: 0 };
    }
    if (!Array.isArray(listaFios) || !listaFios.length) {
        return { wiresChanged: 0, pointsRemoved: 0 };
    }
    const reason = String(opts?.reason || 'scan');
    const limit = Number.isFinite(opts?.limit) ? Math.max(1, opts.limit) : 999999;
    let wiresChanged = 0;
    let pointsRemoved = 0;
    let issuesFound = 0;
    for (let i = 0; i < listaFios.length && (repair ? wiresChanged : issuesFound) < limit; i++) {
        const wireObj = listaFios[i];
        const before = Array.isArray(wireObj?.points) ? wireObj.points.length : 0;
        if (!repair) {
            if (inspectPathological2DWire(wireObj, reason)) issuesFound += 1;
            continue;
        }
        const repaired = repairPathological2DWire(wireObj, reason);
        if (!repaired) continue;
        const after = Array.isArray(wireObj?.points) ? wireObj.points.length : before;
        wiresChanged += 1;
        pointsRemoved += Math.max(0, before - after);
    }
    if (wiresChanged > 0) {
        markWireIndexDirty();
        requestRenderWireJunctions();
        rebindWireEndpoints();
    }
    if (!repair && issuesFound > 0 && typeof window.showWireIssueOverlay === 'function') {
        const msg = issuesFound === 1
            ? '1 cabo com geometria corrompida foi marcado em rosa. RefaÃƒÂ§a esse cabo.'
            : `${issuesFound} cabos com geometria corrompida foram marcados em rosa. RefaÃƒÂ§a esses cabos.`;
        window.showWireIssueOverlay(msg);
    }
    return { wiresChanged, pointsRemoved, issuesFound };
}

function nextWireId() {
    return `W${wireIdSeed++}`;
}

function normalizeWireNumber(value) {
    const raw = String(value || '').trim();
    if (raw) return raw;
    const next = String(wireNumberSeed++);
    return next;
}

function updateWireNumberSeedFromValue(value) {
    const n = parseInt(String(value || '').trim(), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    wireNumberSeed = Math.max(wireNumberSeed, n + 1);
}

function getWireThicknessLevelFromWidth(widthPx) {
    const w = Number.isFinite(widthPx) && widthPx > 0 ? widthPx : getCurrentWireThickness();
    const levels = [1, 2, 3].map(level => ({ level, width: getWireThicknessByLevel(level) }));
    levels.sort((a, b) => Math.abs(a.width - w) - Math.abs(b.width - w));
    return levels[0]?.level || 2;
}

function cssColorToHex(value, fallback = '#b71c1c') {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
        return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }

    const probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = raw;
    if (!probe.style.color) return fallback;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return fallback;
    const toHex = (n) => {
        const v = Math.max(0, Math.min(255, parseInt(n, 10) || 0));
        return v.toString(16).padStart(2, '0');
    };
    return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
}

function getWireBitolaMeta(level) {
    const safeLevel = [1, 2, 3].includes(level) ? level : 2;
    return WIRE_TERMINAL_BITOLA_META[safeLevel] || WIRE_TERMINAL_BITOLA_META[2];
}

function getTerminalInsulationColorByWireWidth(wireWidth) {
    const level = getWireThicknessLevelFromWidth(wireWidth);
    return getWireBitolaMeta(level).color;
}

function closeWireEditDialog() {
    if (!wireEditDialogState) return;
    if (wireEditDialogState.backdrop?.isConnected) wireEditDialogState.backdrop.remove();
    if (wireEditDialogState.onKeyDown) {
        window.removeEventListener('keydown', wireEditDialogState.onKeyDown, true);
    }
    wireEditDialogState = null;
}

function openWireEditDialog(wireObj) {
    if (!wireObj) return;
    closeWireEditDialog();

    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999'
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
        width: '280px',
        maxWidth: '92vw',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #d5dde6',
        boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
        padding: '12px'
    });
    backdrop.appendChild(panel);

    const title = document.createElement('div');
    title.textContent = 'Editar fio';
    Object.assign(title.style, {
        fontWeight: '700',
        fontSize: '14px',
        marginBottom: '10px',
        color: '#1a2530'
    });
    panel.appendChild(title);

    const makeRow = (labelText, control) => {
        const row = document.createElement('label');
        Object.assign(row.style, {
            display: 'block',
            fontSize: '12px',
            color: '#2c3e50',
            marginBottom: '8px'
        });
        row.textContent = labelText;
        Object.assign(control.style, {
            width: '100%',
            marginTop: '4px',
            boxSizing: 'border-box'
        });
        row.appendChild(control);
        return row;
    };

    const numberInput = document.createElement('input');
    numberInput.type = 'text';
    numberInput.value = String(wireObj.number || '');
    numberInput.placeholder = 'Numero';
    panel.appendChild(makeRow('Numero', numberInput));

    const paletteOptions = (() => {
        const seen = new Set();
        const out = [];
        document.querySelectorAll('.color-dot[data-color]').forEach(dot => {
            const hex = cssColorToHex(dot.dataset.color || '', '');
            if (!hex || seen.has(hex)) return;
            seen.add(hex);
            out.push({
                hex,
                label: String(dot.title || '').trim() || hex.toUpperCase()
            });
        });
        if (out.length) return out;
        return [
            { hex: '#b71c1c', label: 'Fase' },
            { hex: '#333333', label: 'Preto' },
            { hex: '#3498db', label: 'Neutro' },
            { hex: '#2ecc71', label: 'Terra' },
            { hex: '#f39c12', label: 'Laranja' },
            { hex: '#f1c40f', label: 'Amarelo' },
            { hex: '#9b59b6', label: 'Roxo' },
            { hex: '#ffffff', label: 'Branco' }
        ];
    })();
    const currentColor = cssColorToHex(
        wireObj.configColor || wireObj.baseColor || wireObj.colorOriginal || wireObj.element?.dataset?.configColor || wireObj.element?.dataset?.originalColor || wireObj.element?.style?.stroke || corFioAtual,
        '#b71c1c'
    );
    const colorChecksWrap = document.createElement('div');
    Object.assign(colorChecksWrap.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '6px'
    });
    const colorChecks = [];
    paletteOptions.forEach(opt => {
        const item = document.createElement('label');
        Object.assign(item.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 6px',
            border: '1px solid #d7e1eb',
            borderRadius: '6px',
            cursor: 'pointer',
            userSelect: 'none'
        });
        item.title = opt.label;

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = opt.hex;
        cb.checked = opt.hex === currentColor;
        cb.style.margin = '0';

        const swatch = document.createElement('span');
        Object.assign(swatch.style, {
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: opt.hex,
            border: opt.hex === '#ffffff' ? '1px solid #95a5a6' : '1px solid rgba(0,0,0,0.15)'
        });

        cb.addEventListener('change', () => {
            if (cb.checked) {
                colorChecks.forEach(other => {
                    if (other !== cb) other.checked = false;
                });
                return;
            }
            if (!colorChecks.some(x => x.checked)) cb.checked = true;
        });

        item.appendChild(cb);
        item.appendChild(swatch);
        colorChecksWrap.appendChild(item);
        colorChecks.push(cb);
    });
    if (!colorChecks.some(x => x.checked) && colorChecks[0]) colorChecks[0].checked = true;
    const getSelectedColor = () => {
        const selected = colorChecks.find(x => x.checked);
        return selected ? selected.value : (paletteOptions[0]?.hex || '#b71c1c');
    };
    panel.appendChild(makeRow('Cor (padrao)', colorChecksWrap));

    const bitolaSelect = document.createElement('select');
    [1, 2, 3].forEach(level => {
        const meta = getWireBitolaMeta(level);
        const option = document.createElement('option');
        option.value = String(level);
        option.textContent = `${level} (${getWireThicknessByLevel(level)}px - ${meta.label} ${meta.range})`;
        bitolaSelect.appendChild(option);
    });
    bitolaSelect.value = String(getWireThicknessLevelFromWidth(wireObj.width));
    panel.appendChild(makeRow('Bitola', bitolaSelect));

    const actions = document.createElement('div');
    Object.assign(actions.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '10px'
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => closeWireEditDialog());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Salvar';
    Object.assign(saveBtn.style, {
        background: '#1d8cff',
        color: '#fff',
        border: '1px solid #1d8cff',
        borderRadius: '4px',
        padding: '4px 10px'
    });
    saveBtn.addEventListener('click', () => {
        wireObj.number = normalizeWireNumber(numberInput.value);
        updateWireNumberSeedFromValue(wireObj.number);
        syncWireNumbersBySharedBornes(wireObj, wireObj.number);

        const nextColor = cssColorToHex(getSelectedColor(), '#b71c1c');
        wireObj.configColor = nextColor;
        wireObj.baseColor = nextColor;
        wireObj.colorOriginal = nextColor;
        if (wireObj.element) {
            wireObj.element.style.stroke = nextColor;
            wireObj.element.dataset.originalColor = nextColor;
            wireObj.element.dataset.configColor = nextColor;
        }

        const level = parseInt(bitolaSelect.value, 10);
        const width = getWireThicknessByLevel([1, 2, 3].includes(level) ? level : 2);
        wireObj.width = width;
        if (wireObj.element) applyWireThickness(wireObj.element, width);

        renderWireJunctions();
        closeWireEditDialog();
        if (typeof window.scheduleHistoryCheckpoint === 'function') {
            window.scheduleHistoryCheckpoint('wire_label_edit');
        }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    panel.appendChild(actions);

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeWireEditDialog();
    });

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeWireEditDialog();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            saveBtn.click();
        }
    };
    window.addEventListener('keydown', onKeyDown, true);

    wireEditDialogState = { backdrop, onKeyDown };
    document.body.appendChild(backdrop);
    numberInput.focus();
    numberInput.select();
}

function pickCanonicalWireNumber(numbers = []) {
    const valid = numbers
        .map(v => String(v || '').trim())
        .filter(Boolean);
    if (!valid.length) return normalizeWireNumber('');
    valid.forEach(updateWireNumberSeedFromValue);
    return valid[0];
}

function syncWireNumbersBySharedBornes(preferredWire = null, preferredNumber = '') {
    if (!Array.isArray(listaFios) || listaFios.length <= 1) return false;

    const parent = listaFios.map((_, idx) => idx);
    const find = (i) => {
        while (parent[i] !== i) {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        return i;
    };
    const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parent[rb] = ra;
    };

    const borneMap = new Map();
    listaFios.forEach((wireObj, idx) => {
        [wireObj?.origem, wireObj?.destino].forEach(borne => {
            if (!borne) return;
            const bucket = borneMap.get(borne) || [];
            bucket.push(idx);
            borneMap.set(borne, bucket);
        });
    });

    borneMap.forEach(indices => {
        if (!indices || indices.length < 2) return;
        const first = indices[0];
        for (let i = 1; i < indices.length; i++) union(first, indices[i]);
    });

    const groups = new Map();
    listaFios.forEach((_, idx) => {
        const root = find(idx);
        const bucket = groups.get(root) || [];
        bucket.push(idx);
        groups.set(root, bucket);
    });

    let changed = false;
    groups.forEach(indices => {
        if (!indices || !indices.length) return;
        const sharedBornes = indices.some(i => {
            const w = listaFios[i];
            return !!(w?.origem || w?.destino);
        });
        if (!sharedBornes) return;

        let chosen = pickCanonicalWireNumber(indices.map(i => listaFios[i]?.number));
        const preferredIndex = preferredWire ? listaFios.indexOf(preferredWire) : -1;
        const preferredInGroup = preferredIndex >= 0 && indices.includes(preferredIndex);
        const preferredText = String(preferredNumber || '').trim();
        if (preferredInGroup && preferredText) {
            chosen = preferredText;
            updateWireNumberSeedFromValue(chosen);
        }
        indices.forEach(i => {
            const w = listaFios[i];
            if (!w) return;
            const current = String(w.number || '').trim();
            if (current !== chosen) {
                w.number = chosen;
                changed = true;
            }
        });
    });

    return changed;
}

function getWireMidpoint(points) {
    if (!Array.isArray(points) || points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return { x: points[0].x, y: points[0].y };

    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    }
    if (total <= 0.0001) return { x: points[0].x, y: points[0].y };

    const half = total / 2;
    let acc = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        if (acc + seg >= half && seg > 0) {
            const t = (half - acc) / seg;
            return {
                x: a.x + ((b.x - a.x) * t),
                y: a.y + ((b.y - a.y) * t)
            };
        }
        acc += seg;
    }
    return { x: points[points.length - 1].x, y: points[points.length - 1].y };
}

function getWirePointAtDistance(points, distance, fromStart = true) {
    if (!Array.isArray(points) || !points.length) return { x: 0, y: 0 };
    if (points.length === 1) return { x: points[0].x, y: points[0].y };
    const ordered = fromStart ? points : points.slice().reverse();
    let remaining = Math.max(0, Number(distance) || 0);
    for (let i = 0; i < ordered.length - 1; i++) {
        const a = ordered[i];
        const b = ordered[i + 1];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        if (seg <= 0.0001) continue;
        if (remaining <= seg) {
            const t = remaining / seg;
            return {
                x: a.x + ((b.x - a.x) * t),
                y: a.y + ((b.y - a.y) * t)
            };
        }
        remaining -= seg;
    }
    return { x: ordered[ordered.length - 1].x, y: ordered[ordered.length - 1].y };
}

function removeWireLabelElements(wireObj) {
    if (!wireObj) return;
    if (wireObj?.labelEl) {
        wireObj.labelEl.remove();
        wireObj.labelEl = null;
    }
    if (Array.isArray(wireObj?.labelEls)) {
        wireObj.labelEls.forEach(label => label?.remove?.());
    }
    wireObj.labelEls = [];
}

function buildWireLabelGroup(wireObj, position = 'mid') {
    const svg = document.getElementById('wire-layer');
    if (!svg || !wireObj) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', 'wire-number');
    group.dataset.labelPosition = String(position || 'mid');

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('class', 'wire-number-bg');
    bg.setAttribute('rx', '3');
    bg.setAttribute('ry', '3');

    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('class', 'wire-number-text');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('x', '0');
    txt.setAttribute('y', '0');

    group.appendChild(bg);
    group.appendChild(txt);

    group.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false))) return;
        if ((wireObj._labelSuppressEditUntil || 0) > Date.now()) return;
        openWireEditDialog(wireObj);
    });

    group.addEventListener('pointerdown', (e) => {
        if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) || (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'select') return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (is2DWorkspaceActive()) {
            if (wireObj?.element && typeof selectWire === 'function') {
                const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
                selectWire(wireObj.element, additive);
            }
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        wireNumberDragState = {
            pointerId: e.pointerId,
            wire: wireObj,
            startX: e.clientX,
            startY: e.clientY,
            startDx: Number.isFinite(wireObj.labelDx) ? wireObj.labelDx : 0,
            startDy: Number.isFinite(wireObj.labelDy) ? wireObj.labelDy : 0,
            moved: false
        };
        if (wireObj?.element && typeof selectWire === 'function') {
            const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
            selectWire(wireObj.element, additive);
        }
        e.preventDefault();
        e.stopPropagation();
    });

    svg.appendChild(group);
    return group;
}

function renderWireLabels() {
    const svg = document.getElementById('wire-layer');
    if (!svg) return;

    if (!Array.isArray(listaFios)) return;
    const aliveLabelEls = new Set();
    const in2D = is2DWorkspaceActive();
    const endDistancePx = 34;

    listaFios.forEach(wireObj => {
        if (!wireObj) return;
        if (!wireObj.id) wireObj.id = nextWireId();
        if (!wireObj.number) wireObj.number = normalizeWireNumber(wireObj.number);
        updateWireNumberSeedFromValue(wireObj.number);
        const textValue = String(wireObj.number || '');
        const w = Math.max(18, (textValue.length * 8) + 8);
        const h = 16;

        if (in2D) {
            if (wireObj.labelEl) {
                wireObj.labelEl.remove();
                wireObj.labelEl = null;
            }
            if (!Array.isArray(wireObj.labelEls) || wireObj.labelEls.length !== 2 || wireObj.labelEls.some(label => !label?.isConnected)) {
                removeWireLabelElements(wireObj);
                wireObj.labelEls = [
                    buildWireLabelGroup(wireObj, 'start'),
                    buildWireLabelGroup(wireObj, 'end')
                ].filter(Boolean);
            }
            const positions = [
                getWirePointAtDistance(wireObj.points || [], endDistancePx, true),
                getWirePointAtDistance(wireObj.points || [], endDistancePx, false)
            ];
            wireObj.labelEls.forEach((group, idx) => {
                if (!group) return;
                aliveLabelEls.add(group);
                const txt = group.querySelector('.wire-number-text');
                const bg = group.querySelector('.wire-number-bg');
                if (!txt || !bg) return;
                txt.textContent = textValue;
                const pos = positions[idx] || positions[0] || { x: 0, y: 0 };
                group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
                bg.setAttribute('x', `${-w / 2}`);
                bg.setAttribute('y', `${-h / 2}`);
                bg.setAttribute('width', `${w}`);
                bg.setAttribute('height', `${h}`);
            });
            return;
        }

        if (Array.isArray(wireObj.labelEls) && wireObj.labelEls.length) {
            wireObj.labelEls.forEach(label => label?.remove?.());
            wireObj.labelEls = [];
        }

        if (!wireObj.labelEl || !wireObj.labelEl.isConnected) {
            wireObj.labelEl = buildWireLabelGroup(wireObj, 'mid');
        }
        const group = wireObj.labelEl;
        if (!group) return;
        aliveLabelEls.add(group);

        const txt = group.querySelector('.wire-number-text');
        const bg = group.querySelector('.wire-number-bg');
        if (!txt || !bg) return;
        txt.textContent = textValue;

        const mid = getWireMidpoint(wireObj.points || []);
        const dx = Number.isFinite(wireObj.labelDx) ? wireObj.labelDx : 0;
        const dy = Number.isFinite(wireObj.labelDy) ? wireObj.labelDy : 0;
        const tx = mid.x + dx;
        const ty = mid.y + dy;
        group.setAttribute('transform', `translate(${tx}, ${ty})`);

        bg.setAttribute('x', `${-w / 2}`);
        bg.setAttribute('y', `${-h / 2}`);
        bg.setAttribute('width', `${w}`);
        bg.setAttribute('height', `${h}`);
    });

    svg.querySelectorAll('g.wire-number').forEach(group => {
        if (!aliveLabelEls.has(group)) group.remove();
    });
}

function handleWireLabelDragMove(e) {
    if (!wireNumberDragState || e.pointerId !== wireNumberDragState.pointerId) return;
    const wireObj = wireNumberDragState.wire;
    if (!wireObj) return;
    if (
        Math.abs(e.clientX - wireNumberDragState.startX) > 2 ||
        Math.abs(e.clientY - wireNumberDragState.startY) > 2
    ) {
        wireNumberDragState.moved = true;
    }
    const dx = (e.clientX - wireNumberDragState.startX) / zoomLevel;
    const dy = (e.clientY - wireNumberDragState.startY) / zoomLevel;
    wireObj.labelDx = wireNumberDragState.startDx + dx;
    wireObj.labelDy = wireNumberDragState.startDy + dy;
    renderWireLabels();
    e.preventDefault();
}

function handleWireLabelDragEnd(e) {
    if (!wireNumberDragState || (e && e.pointerId !== wireNumberDragState.pointerId)) return;
    if (wireNumberDragState.moved && wireNumberDragState.wire) {
        wireNumberDragState.wire._labelSuppressEditUntil = Date.now() + 200;
    }
    wireNumberDragState = null;
    if (typeof window.scheduleHistoryCheckpoint === 'function') {
        window.scheduleHistoryCheckpoint('wire_label_drag');
    }
}

function handleWireLabelPointerDownAtClient(clientX, clientY, opts = {}) {
    if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) || (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'select') return false;
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return false;
    const labelWire = [...listaFios]
        .reverse()
        .find(wireObj => {
            const labels = [];
            if (wireObj?.labelEl) labels.push(wireObj.labelEl);
            if (Array.isArray(wireObj?.labelEls)) labels.push(...wireObj.labelEls);
            return labels.some(labelEl => {
                if (!labelEl?.isConnected) return false;
                const r = labelEl.getBoundingClientRect();
                return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
            });
        });
    if (!labelWire?.element) return false;

    wireNumberDragState = {
        pointerId: opts.pointerId,
        wire: labelWire,
        startX: clientX,
        startY: clientY,
        startDx: Number.isFinite(labelWire.labelDx) ? labelWire.labelDx : 0,
        startDy: Number.isFinite(labelWire.labelDy) ? labelWire.labelDy : 0,
        moved: false
    };
    selectWire(labelWire.element, !!opts.additive);
    return true;
}

function wirePairExists(b1, b2) {
    if (!b1 || !b2 || !Array.isArray(listaFios)) return false;
    return listaFios.some(f =>
        (f.origem === b1 && f.destino === b2) ||
        (f.origem === b2 && f.destino === b1)
    );
}

function getWireConnectionCountForBorne(borneEl, opts = {}) {
    if (!borneEl || !Array.isArray(listaFios)) return 0;
    const ignoreWire = opts?.ignoreWire || null;
    let count = 0;
    listaFios.forEach(f => {
        if (!f || (ignoreWire && f === ignoreWire)) return;
        if (f.origem === borneEl || f.destino === borneEl) count++;
    });
    return count;
}

function borneCanAcceptMoreConnections(borneEl, opts = {}) {
    if (!borneEl) return false;
    return getWireConnectionCountForBorne(borneEl, opts) < 2;
}

function mixHexColors(hexA, hexB, ratio = 0.5) {
    const clamp = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0.5));
    const parse = (hex, fallback) => {
        const safe = cssColorToHex(hex, fallback);
        const m = String(safe || '').match(/^#([0-9a-f]{6})$/i);
        if (!m) return [0, 0, 0];
        const raw = m[1];
        return [
            parseInt(raw.slice(0, 2), 16),
            parseInt(raw.slice(2, 4), 16),
            parseInt(raw.slice(4, 6), 16)
        ];
    };
    const a = parse(hexA, '#000000');
    const b = parse(hexB, '#ffffff');
    const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    const r = a[0] + ((b[0] - a[0]) * clamp);
    const g = a[1] + ((b[1] - a[1]) * clamp);
    const bCh = a[2] + ((b[2] - a[2]) * clamp);
    return `#${toHex(r)}${toHex(g)}${toHex(bCh)}`;
}

function getWireEndpointDirection(points, isStart = true) {
    if (!Array.isArray(points) || points.length < 2) return null;
    const idx = isStart ? 0 : points.length - 1;
    const anchor = points[idx];
    if (!anchor) return null;
    if (isStart) {
        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            const dx = (p?.x || 0) - (anchor?.x || 0);
            const dy = (p?.y || 0) - (anchor?.y || 0);
            const len = Math.hypot(dx, dy);
            if (len > 0.001) return { x: dx / len, y: dy / len };
        }
        return null;
    }
    for (let i = points.length - 2; i >= 0; i--) {
        const p = points[i];
        const dx = (p?.x || 0) - (anchor?.x || 0);
        const dy = (p?.y || 0) - (anchor?.y || 0);
        const len = Math.hypot(dx, dy);
        if (len > 0.001) return { x: dx / len, y: dy / len };
    }
    return null;
}

function getWireEndpointApproachDirection(points, isStart = true, minSegmentLength = 10) {
    if (!Array.isArray(points) || points.length < 2) return null;
    const minLen = Number.isFinite(minSegmentLength) ? Math.max(0.5, minSegmentLength) : 10;

    if (isStart) {
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i];
            const b = points[i + 1];
            const dx = (b?.x || 0) - (a?.x || 0);
            const dy = (b?.y || 0) - (a?.y || 0);
            const len = Math.hypot(dx, dy);
            if (len >= minLen) return { x: dx / len, y: dy / len };
        }
    } else {
        for (let i = points.length - 1; i > 0; i--) {
            const a = points[i];
            const b = points[i - 1];
            const dx = (b?.x || 0) - (a?.x || 0);
            const dy = (b?.y || 0) - (a?.y || 0);
            const len = Math.hypot(dx, dy);
            if (len >= minLen) return { x: dx / len, y: dy / len };
        }
    }

    return getWireEndpointDirection(points, isStart);
}

function getComponentCenterInWorkspace(componentEl) {
    const bancada = document.getElementById('bancada');
    const rect = componentEl?.getBoundingClientRect?.();
    const br = bancada?.getBoundingClientRect?.();
    if (!rect || !br) return null;
    return {
        x: (rect.left + (rect.width / 2) - br.left) / zoomLevel,
        y: (rect.top + (rect.height / 2) - br.top) / zoomLevel
    };
}

function getBorneOutwardDirection(borneEl, anchorPoint) {
    if (!borneEl || !anchorPoint) return null;
    const comp = borneEl.closest?.('.component');
    if (!comp) return null;
    const borneStyle = window.getComputedStyle ? window.getComputedStyle(borneEl) : null;
    const center = getComponentCenterInWorkspace(comp);
    const bancada = document.getElementById('bancada');
    const cr = comp.getBoundingClientRect?.();
    const br = bancada?.getBoundingClientRect?.();
    if (!center || !cr || !br) return null;

    const left = (cr.left - br.left) / zoomLevel;
    const right = (cr.right - br.left) / zoomLevel;
    const top = (cr.top - br.top) / zoomLevel;
    const bottom = (cr.bottom - br.top) / zoomLevel;
    const x = Number(anchorPoint.x) || center.x;
    const y = Number(anchorPoint.y) || center.y;

    const hasTop = !!borneStyle && borneStyle.top && borneStyle.top !== 'auto';
    const hasBottom = !!borneStyle && borneStyle.bottom && borneStyle.bottom !== 'auto';
    const hasLeft = !!borneStyle && borneStyle.left && borneStyle.left !== 'auto';
    const hasRight = !!borneStyle && borneStyle.right && borneStyle.right !== 'auto';

    const lib = String(comp?.dataset?.lib || '').toLowerCase();
    if (lib === 'real_caixa_boia_bomba') {
        return { x: -1, y: 0 };
    }
    if (lib === 'real_rele_termico') {
        // No rele termico real, por padrao todos os terminais apontam para cima.
        // A orientacao fina de pinos especificos (ex.: 14 e A2) e feita via
        // variaveis de rotacao no modo engenharia.
        return { x: 0, y: -1 };
    }
    const allowLateral = lib === 'iec_rele_termico';
    if (!allowLateral) {
        if (hasTop && !hasBottom) return { x: 0, y: -1 };
        if (hasBottom && !hasTop) return { x: 0, y: 1 };
        // Regra geral: terminal apenas para cima/baixo.
        return { x: 0, y: y <= center.y ? -1 : 1 };
    }

    if (hasTop && !hasBottom) return { x: 0, y: -1 };
    if (hasBottom && !hasTop) return { x: 0, y: 1 };
    if (hasLeft && !hasRight) return { x: -1, y: 0 };
    if (hasRight && !hasLeft) return { x: 1, y: 0 };

    const dTop = Math.abs(y - top);
    const dBottom = Math.abs(bottom - y);
    const dLeft = Math.abs(x - left);
    const dRight = Math.abs(right - x);
    const min = Math.min(dTop, dBottom, dLeft, dRight);

    // No rele termico, permite saidas laterais.
    if (min === dTop) return { x: 0, y: -1 };
    if (min === dBottom) return { x: 0, y: 1 };
    if (min === dLeft) return { x: -1, y: 0 };
    if (min === dRight) return { x: 1, y: 0 };

    const dx = x - center.x;
    const dy = y - center.y;
    if (Math.abs(dx) >= Math.abs(dy)) return { x: dx >= 0 ? 1 : -1, y: 0 };
    return { x: 0, y: dy >= 0 ? 1 : -1 };
}

function getTerminalPinKey(borneEl) {
    const raw = String(borneEl?.dataset?.pino || '').trim();
    if (!raw) return '';
    const noExt = raw.replace(/_?ext$/i, '');
    return noExt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getBornePinRaw(borneEl) {
    return String(borneEl?.dataset?.pino || '').trim();
}

function getBornePinNormalized(borneEl) {
    const raw = getBornePinRaw(borneEl);
    return raw.replace(/_?ext$/i, '').toUpperCase();
}

function isRealReleTopOverlayBorne(borneEl) {
    const comp = borneEl?.closest?.('.component');
    if (!comp) return false;
    const lib = String(comp.dataset?.lib || '').toLowerCase();
    if (lib !== 'real_rele_termico') return false;
    return REAL_RELE_TOP_OVERLAY_PINS.has(getBornePinNormalized(borneEl));
}

function wireTouchesRealReleTopOverlayPin(wireObj) {
    if (!wireObj) return false;
    return isRealReleTopOverlayBorne(wireObj.origem) || isRealReleTopOverlayBorne(wireObj.destino);
}

function isTopOverlayBorne(borneEl) {
    const comp = borneEl?.closest?.('.component');
    if (!comp) return false;
    const lib = String(comp.dataset?.lib || '').toLowerCase();
    const pin = getBornePinNormalized(borneEl);
    if (lib === 'real_rele_termico') return REAL_RELE_TOP_OVERLAY_PINS.has(pin);
    if (lib === 'real_rele_seguranca') return REAL_RELE_SEGURANCA_TOP_OVERLAY_PINS.has(pin);
    return false;
}

function wireTouchesTopOverlayPin(wireObj) {
    if (!wireObj) return false;
    return isTopOverlayBorne(wireObj.origem) || isTopOverlayBorne(wireObj.destino);
}

function clear2DWireDecorations() {
    const svg = document.getElementById('wire-layer');
    const topSvg = document.getElementById('wire-top-layer');
    if (svg) svg.querySelectorAll('.wire-terminal').forEach(n => n.remove());
    if (topSvg) {
        topSvg.querySelectorAll('.wire-top-overlay').forEach(n => n.remove());
        topSvg.querySelectorAll('.wire-short-path-overlay').forEach(n => n.remove());
        topSvg.querySelectorAll('.wire-terminal').forEach(n => n.remove());
    }
}

function requestRenderWireJunctions() {
    if (wireJunctionRenderScheduled) return;
    wireJunctionRenderScheduled = true;
    const run = () => {
        wireJunctionRenderScheduled = false;
        renderWireJunctions();
    };
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run);
    } else {
        setTimeout(run, 0);
    }
}

function cleanupDisconnectedWireEndpoints() {
    if (!Array.isArray(listaFios) || !listaFios.length) return false;
    let changed = false;
    for (const f of listaFios) {
        if (!f) continue;
        if (f.origem && !f.origem.isConnected) {
            f.origem = null;
            changed = true;
        }
        if (f.destino && !f.destino.isConnected) {
            f.destino = null;
            changed = true;
        }
    }
    if (changed && syncWireNumbersBySharedBornes()) {
        renderWireLabels();
    }
    return changed;
}

function getWireSubpathFromEndpoint(points, fromStart = true, maxLength = REAL_RELE_TOP_OVERLAY_LENGTH_PX) {
    if (!Array.isArray(points) || points.length < 2) return null;
    const ordered = fromStart ? points : points.slice().reverse();
    const out = [{ x: ordered[0].x, y: ordered[0].y }];
    let remaining = Number.isFinite(maxLength) ? Math.max(1, maxLength) : REAL_RELE_TOP_OVERLAY_LENGTH_PX;

    for (let i = 0; i < ordered.length - 1 && remaining > 0.001; i++) {
        const a = ordered[i];
        const b = ordered[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const segLen = Math.hypot(dx, dy);
        if (segLen < 0.001) continue;

        if (segLen <= remaining + 0.001) {
            out.push({ x: b.x, y: b.y });
            remaining -= segLen;
            continue;
        }

        const t = remaining / segLen;
        out.push({
            x: a.x + (dx * t),
            y: a.y + (dy * t)
        });
        remaining = 0;
        break;
    }

    const normalized = normalizeWirePoints(out);
    return normalized.length >= 2 ? normalized : null;
}

function getTopOverlaySegmentsForWire(wireObj) {
    if (!wireObj || !Array.isArray(wireObj.points) || wireObj.points.length < 2) return [];
    const out = [];
    let totalLen = 0;
    for (let i = 0; i < wireObj.points.length - 1; i++) {
        const a = wireObj.points[i];
        const b = wireObj.points[i + 1];
        totalLen += Math.hypot(b.x - a.x, b.y - a.y);
    }
    const perEndpointLen = Math.max(14, Math.min(REAL_RELE_TOP_OVERLAY_LENGTH_PX, totalLen * 0.45));

    if (isTopOverlayBorne(wireObj.origem)) {
        const seg = getWireSubpathFromEndpoint(wireObj.points, true, perEndpointLen);
        if (seg) out.push(seg);
    }
    if (isTopOverlayBorne(wireObj.destino)) {
        const seg = getWireSubpathFromEndpoint(wireObj.points, false, perEndpointLen);
        if (seg) out.push(seg);
    }
    return out;
}

function getBorneIndexInComponent(borneEl) {
    const comp = borneEl?.closest?.('.component');
    if (!comp) return 1;
    const bornes = Array.from(comp.querySelectorAll('.borne'));
    const idx = bornes.indexOf(borneEl);
    return idx >= 0 ? (idx + 1) : 1;
}

function getCssVarNumber(rootStyle, name, fallback = 0) {
    const raw = String(rootStyle?.getPropertyValue(name) || '').trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
}

function getTerminalAdjustForBorne(borneEl, rootStyle) {
    const comp = borneEl?.closest?.('.component');
    const lib = String(comp?.dataset?.lib || '').trim();
    if (!lib) return { rotateDeg: 0, insertPx: 0, shiftPx: 0 };
    const cssKey = lib.replaceAll('_', '-');
    const idx = getBorneIndexInComponent(borneEl);
    const pinKey = getTerminalPinKey(borneEl);
    const isRealPushbutton =
        lib === 'real_botoeira_verde' ||
        lib === 'real_botoeira_vermelha';
    const isTopPushbuttonTerminal =
        isRealPushbutton && (
            pinKey === '3' ||
            idx === 1
        );
    const isRealIndicator = lib === 'real_sinaleiro';
    const isTopIndicatorTerminal =
        isRealIndicator && (
            pinKey === 'x1' ||
            idx === 1
        );
    const baseRotateDeg =
        lib === 'real_rele_termico'
            ? 180
            : 0;
    const specialRotateDeg =
        (isTopPushbuttonTerminal || isTopIndicatorTerminal)
            ? 180
            : 0;

    const rotateGlobal = getCssVarNumber(rootStyle, `--${cssKey}-terminal-rotate`, 0);
    const insertGlobal = getCssVarNumber(rootStyle, `--${cssKey}-terminal-insert`, 0);
    const shiftGlobal = getCssVarNumber(rootStyle, `--${cssKey}-terminal-shift`, 0);

    const rotateByIndex = getCssVarNumber(rootStyle, `--${cssKey}-terminal-rotate-${idx}`, rotateGlobal);
    const insertByIndex = getCssVarNumber(rootStyle, `--${cssKey}-terminal-insert-${idx}`, insertGlobal);
    const shiftByIndex = getCssVarNumber(rootStyle, `--${cssKey}-terminal-shift-${idx}`, shiftGlobal);

    const rotateByPin = pinKey
        ? getCssVarNumber(rootStyle, `--${cssKey}-terminal-rotate-${pinKey}`, rotateByIndex)
        : rotateByIndex;
    const insertByPin = pinKey
        ? getCssVarNumber(rootStyle, `--${cssKey}-terminal-insert-${pinKey}`, insertByIndex)
        : insertByIndex;
    const shiftByPin = pinKey
        ? getCssVarNumber(rootStyle, `--${cssKey}-terminal-shift-${pinKey}`, shiftByIndex)
        : shiftByIndex;

    return {
        rotateDeg: baseRotateDeg + specialRotateDeg + rotateByPin,
        insertPx: insertByPin,
        shiftPx: shiftByPin
    };
}

function buildTerminalBodyPath(topY, bodyLen, topWidth, bottomWidth) {
    const bottomY = topY + bodyLen;
    const shoulderY = topY + Math.min(3.8, bodyLen * 0.42);
    const topHalf = topWidth / 2;
    const bottomHalf = bottomWidth / 2;
    return [
        `M ${-topHalf} ${topY}`,
        `L ${topHalf} ${topY}`,
        `Q ${bottomHalf} ${topY + 0.6} ${bottomHalf} ${shoulderY}`,
        `L ${bottomHalf} ${bottomY - 1.2}`,
        `Q ${bottomHalf} ${bottomY} ${bottomHalf - 1.2} ${bottomY}`,
        `L ${-(bottomHalf - 1.2)} ${bottomY}`,
        `Q ${-bottomHalf} ${bottomY} ${-bottomHalf} ${bottomY - 1.2}`,
        `L ${-bottomHalf} ${shoulderY}`,
        `Q ${-bottomHalf} ${topY + 0.6} ${-topHalf} ${topY}`,
        'Z'
    ].join(' ');
}

function getWireTerminalTypeForBorne(borneEl, connections = 1) {
    const lib = String(borneEl?.closest?.('.component')?.dataset?.lib || '').toLowerCase();
    if (lib === 'real_transformador_partida_trifasico') return 'ring';
    return connections >= 2 ? 'double' : 'single';
}

function getWireTerminalLengthScaleForBorne(borneEl, onTop = false) {
    const comp = borneEl?.closest?.('.component');
    const lib = String(comp?.dataset?.lib || '').toLowerCase();
    if (lib === 'real_rele_seguranca') {
        return onTop ? 0.42 : 0.72;
    }
    return onTop ? 0.5 : 1;
}

function getPreferredWireTerminalDirection(type, wireDirection, outwardDirection) {
    if (type === 'ring') return wireDirection || outwardDirection || null;
    return wireDirection || outwardDirection || null;
}

function createWireTerminalMarker(endpoint, direction, type = 'single', wireColor = '#3498db', wireWidth = 6, opts = {}) {
    if (!endpoint || !direction) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const normalizedType = type === 'ring' ? 'ring' : (type === 'double' ? 'double' : 'single');
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', `wire-terminal wire-terminal-${normalizedType}`);

    const TERMINAL_SCALE = 1.5;
    const lengthScale = Number.isFinite(opts?.lengthScale) ? Math.max(0.35, opts.lengthScale) : 1;
    const widthFactor = Math.max(0.88, Math.min(1.45, (wireWidth || 6) / 6)) * TERMINAL_SCALE;

    const insertPx = Number.isFinite(opts?.insertPx) ? opts.insertPx : 0;
    const shiftPx = Number.isFinite(opts?.shiftPx) ? opts.shiftPx : 0;
    const rotateDeg = Number.isFinite(opts?.rotateDeg) ? opts.rotateDeg : 0;
    const perpX = -direction.y;
    const perpY = direction.x;
    const px = endpoint.x - (direction.x * insertPx) + (perpX * shiftPx);
    const py = endpoint.y - (direction.y * insertPx) + (perpY * shiftPx);
    const angle = ((Math.atan2(direction.y, direction.x) * 180) / Math.PI) - 90 + rotateDeg;
    g.setAttribute('transform', `translate(${px} ${py}) rotate(${angle})`);

    if (normalizedType === 'ring') {
        const ringRadius = 4.1 * widthFactor;
        const ringStroke = 2.1 * widthFactor;
        const neckWidth = 3.2 * widthFactor;
        const neckLen = 4.8 * widthFactor * lengthScale;
        const barrelWidth = 6.8 * widthFactor;
        const barrelLen = 15.2 * widthFactor * lengthScale;
        const barrelStartY = ringRadius + neckLen - 0.55;
        const metalStroke = '#aeb7c2';
        const metalFill = '#d9dee5';
        const metalDark = '#7e8894';

        const ring = document.createElementNS(ns, 'circle');
        ring.setAttribute('class', 'wire-terminal-ring');
        ring.setAttribute('cx', '0');
        ring.setAttribute('cy', '0');
        ring.setAttribute('r', `${ringRadius}`);
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', metalStroke);
        ring.setAttribute('stroke-width', `${ringStroke}`);

        const ringInnerShadow = document.createElementNS(ns, 'circle');
        ringInnerShadow.setAttribute('class', 'wire-terminal-ring-shadow');
        ringInnerShadow.setAttribute('cx', '0');
        ringInnerShadow.setAttribute('cy', '0');
        ringInnerShadow.setAttribute('r', `${Math.max(0.8, ringRadius - (ringStroke * 0.52))}`);
        ringInnerShadow.setAttribute('fill', 'none');
        ringInnerShadow.setAttribute('stroke', metalDark);
        ringInnerShadow.setAttribute('stroke-width', `${Math.max(0.7, ringStroke * 0.22)}`);
        ringInnerShadow.setAttribute('opacity', '0.45');

        const neck = document.createElementNS(ns, 'rect');
        neck.setAttribute('class', 'wire-terminal-ring-neck');
        neck.setAttribute('x', `${-neckWidth / 2}`);
        neck.setAttribute('y', `${ringRadius - 0.4}`);
        neck.setAttribute('width', `${neckWidth}`);
        neck.setAttribute('height', `${neckLen}`);
        neck.setAttribute('rx', `${Math.max(0.8, neckWidth * 0.24)}`);
        neck.setAttribute('fill', metalFill);
        neck.setAttribute('stroke', metalDark);
        neck.setAttribute('stroke-width', '0.7');

        const neckShine = document.createElementNS(ns, 'line');
        neckShine.setAttribute('class', 'wire-terminal-ring-shine');
        neckShine.setAttribute('x1', `${-neckWidth * 0.18}`);
        neckShine.setAttribute('y1', `${ringRadius + 0.5}`);
        neckShine.setAttribute('x2', `${-neckWidth * 0.18}`);
        neckShine.setAttribute('y2', `${ringRadius + Math.max(1.3, neckLen - 0.4)}`);

        const barrel = document.createElementNS(ns, 'rect');
        barrel.setAttribute('class', 'wire-terminal-ring-barrel');
        barrel.setAttribute('x', `${-barrelWidth / 2}`);
        barrel.setAttribute('y', `${barrelStartY}`);
        barrel.setAttribute('width', `${barrelWidth}`);
        barrel.setAttribute('height', `${barrelLen}`);
        barrel.setAttribute('rx', `${Math.max(1.2, barrelWidth * 0.24)}`);
        barrel.setAttribute('fill', wireColor);
        barrel.setAttribute('stroke', mixHexColors(wireColor, '#000000', 0.28));
        barrel.setAttribute('stroke-width', '0.75');

        const barrelShine = document.createElementNS(ns, 'line');
        barrelShine.setAttribute('class', 'wire-terminal-ring-barrel-shine');
        barrelShine.setAttribute('x1', `${-barrelWidth * 0.16}`);
        barrelShine.setAttribute('y1', `${barrelStartY + 1.0}`);
        barrelShine.setAttribute('x2', `${-barrelWidth * 0.16}`);
        barrelShine.setAttribute('y2', `${barrelStartY + Math.max(1.8, barrelLen - 1.0)}`);

        g.appendChild(ring);
        g.appendChild(ringInnerShadow);
        g.appendChild(neck);
        g.appendChild(neckShine);
        g.appendChild(barrel);
        g.appendChild(barrelShine);
        if (opts?.ghost) g.classList.add('wire-terminal-ghost');
        return g;
    }

    const sleeveLen = (normalizedType === 'double' ? 10.3 : 11.2) * widthFactor * lengthScale;
    const sleeveWidth = 5.2 * widthFactor;
    const bodyLen = (normalizedType === 'double' ? 10.6 : 8.8) * widthFactor * lengthScale;
    const bodyTopWidth = (normalizedType === 'double' ? 8.2 : 6.2) * widthFactor;
    const bodyBottomWidth = (normalizedType === 'double' ? 12.3 : 9.0) * widthFactor;
    const terminalCenterAlong = (sleeveLen + bodyLen) * 0.5;

    // Mantem o pivô no centro geometrico do terminal para rotacao sem deslocar.
    const centerWrap = document.createElementNS(ns, 'g');
    centerWrap.setAttribute('transform', `translate(0 ${-terminalCenterAlong})`);

    const sleeve = document.createElementNS(ns, 'rect');
    sleeve.setAttribute('class', 'wire-terminal-sleeve');
    sleeve.setAttribute('x', `${-sleeveWidth / 2}`);
    sleeve.setAttribute('y', '0');
    sleeve.setAttribute('width', `${sleeveWidth}`);
    sleeve.setAttribute('height', `${sleeveLen}`);
    sleeve.setAttribute('rx', `${Math.max(1.1, sleeveWidth * 0.26)}`);
    sleeve.setAttribute('ry', `${Math.max(1.1, sleeveWidth * 0.26)}`);

    const sleeveShine = document.createElementNS(ns, 'line');
    sleeveShine.setAttribute('class', 'wire-terminal-sleeve-shine');
    sleeveShine.setAttribute('x1', `${-sleeveWidth * 0.18}`);
    sleeveShine.setAttribute('y1', '0.9');
    sleeveShine.setAttribute('x2', `${-sleeveWidth * 0.18}`);
    sleeveShine.setAttribute('y2', `${Math.max(1.4, sleeveLen - 0.8)}`);

    const topY = sleeveLen - 0.35;
    const body = document.createElementNS(ns, 'path');
    body.setAttribute('class', 'wire-terminal-body');
    body.setAttribute('d', buildTerminalBodyPath(topY, bodyLen, bodyTopWidth, bodyBottomWidth));
    body.setAttribute('fill', wireColor);
    body.setAttribute('stroke', mixHexColors(wireColor, '#000000', 0.28));

    const bodyShine = document.createElementNS(ns, 'path');
    bodyShine.setAttribute('class', 'wire-terminal-body-shine');
    const bottomY = topY + bodyLen;
    bodyShine.setAttribute(
        'd',
        [
            `M ${-bodyTopWidth * 0.26} ${topY + 1.1}`,
            `L ${-bodyTopWidth * 0.08} ${topY + 1.1}`,
            `L ${-bodyBottomWidth * 0.15} ${bottomY - 1.2}`,
            `L ${-bodyBottomWidth * 0.31} ${bottomY - 1.2}`,
            'Z'
        ].join(' ')
    );
    bodyShine.setAttribute('fill', mixHexColors(wireColor, '#ffffff', 0.42));

    centerWrap.appendChild(sleeve);
    centerWrap.appendChild(sleeveShine);
    centerWrap.appendChild(body);
    centerWrap.appendChild(bodyShine);
    g.appendChild(centerWrap);
    if (opts?.ghost) g.classList.add('wire-terminal-ghost');
    return g;
}

function renderTopWireOverlays() {
    const topSvg = document.getElementById('wire-top-layer');
    if (!topSvg) return;
    topSvg.querySelectorAll('.wire-top-overlay').forEach(n => n.remove());

    if (!is2DWorkspaceActive()) return;
    if (!Array.isArray(listaFios) || !listaFios.length) return;

    listaFios.forEach(wireObj => {
        if (!wireObj?.points || wireObj.points.length < 2) return;
        if (!wireTouchesTopOverlayPin(wireObj)) return;
        const overlaySegments = getTopOverlaySegmentsForWire(wireObj);
        if (!overlaySegments.length) return;

        const color = wireObj.configColor || wireObj.baseColor || wireObj.colorOriginal || wireObj.element?.dataset?.configColor || wireObj.element?.dataset?.originalColor || wireObj.element?.style?.stroke || corFioAtual;
        const width = Number.isFinite(wireObj.width) && wireObj.width > 0 ? wireObj.width : getCurrentWireThickness();
        overlaySegments.forEach(seg => {
            const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            poly.setAttribute('class', 'wire-top-overlay');
            poly.setAttribute('points', seg.map(p => `${p.x},${p.y}`).join(' '));
            poly.style.stroke = color;
            applyWireThickness(poly, width);
            topSvg.appendChild(poly);
        });
    });
}

function renderWireTerminals() {
    const svg = document.getElementById('wire-layer');
    const topSvg = document.getElementById('wire-top-layer');
    if (!svg) return;
    svg.querySelectorAll('.wire-terminal').forEach(n => n.remove());
    if (topSvg) topSvg.querySelectorAll('.wire-terminal').forEach(n => n.remove());

    if (!is2DWorkspaceActive()) return;
    const showEngineeringGhosts = !!(
        typeof engineeringMode !== 'undefined' &&
        typeof engineeringShowTerminals !== 'undefined' &&
        engineeringMode &&
        engineeringShowTerminals
    );
    if ((!Array.isArray(listaFios) || !listaFios.length) && !showEngineeringGhosts) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const borneUsage = new Map();
    const incUsage = (borneEl) => {
        if (!borneEl) return;
        borneUsage.set(borneEl, (borneUsage.get(borneEl) || 0) + 1);
    };
    listaFios.forEach(wireObj => {
        incUsage(wireObj?.origem || null);
        incUsage(wireObj?.destino || null);
    });

    const frag = document.createDocumentFragment();
    const fragTop = document.createDocumentFragment();
    listaFios.forEach(wireObj => {
        if (!wireObj || !Array.isArray(wireObj.points) || wireObj.points.length < 2) return;
        const pts = wireObj.points;
        const wireWidth = Number.isFinite(wireObj.width) && wireObj.width > 0
            ? wireObj.width
            : getCurrentWireThickness();
        const terminalColor = getTerminalInsulationColorByWireWidth(wireWidth);

        const endpoints = [
            { point: pts[0], direction: getWireEndpointDirection(pts, true), approachDirection: getWireEndpointApproachDirection(pts, true), borne: wireObj.origem || null, isStart: true },
            { point: pts[pts.length - 1], direction: getWireEndpointDirection(pts, false), approachDirection: getWireEndpointApproachDirection(pts, false), borne: wireObj.destino || null, isStart: false }
        ];
        endpoints.forEach(ep => {
            if (!ep?.borne) return;
            const borneCenter = getBorneCenterExact(ep.borne) || ep.point || null;
            if (!borneCenter) return;
            const connections = ep.borne ? (borneUsage.get(ep.borne) || 1) : 1;
            const type = getWireTerminalTypeForBorne(ep.borne, connections);
            const outward = ep.borne ? getBorneOutwardDirection(ep.borne, borneCenter) : null;
            const wireDirection = ep.approachDirection || ep.direction || null;
            const finalDirection = getPreferredWireTerminalDirection(type, wireDirection, outward);
            if (!finalDirection) return;
            const adjustBase = getTerminalAdjustForBorne(ep.borne, rootStyle);
            // Em render normal, o terminal segue o proprio eixo do cabo.
            // Rotacao e shift de engenharia ficam restritos ao modo de ajuste.
            const adjust = showEngineeringGhosts ? adjustBase : { ...adjustBase, rotateDeg: 0, shiftPx: 0 };
            const onTop = isTopOverlayBorne(ep.borne);
            const marker = createWireTerminalMarker(
                ep.point || borneCenter,
                finalDirection,
                type,
                terminalColor,
                wireWidth,
                { ...adjust, lengthScale: getWireTerminalLengthScaleForBorne(ep.borne, onTop) }
            );
            if (marker) (onTop && topSvg ? fragTop : frag).appendChild(marker);
        });
    });

    if (showEngineeringGhosts) {
        const allBornes = Array.from(document.querySelectorAll('#bancada .borne'));
        allBornes.forEach(borneEl => {
            const point = getBorneCenterExact(borneEl);
            if (!point) return;
            const direction = getBorneOutwardDirection(borneEl, point);
            if (!direction) return;
            const connections = borneUsage.get(borneEl) || 0;
            if (connections > 0) return;
            const adjust = getTerminalAdjustForBorne(borneEl, rootStyle);
            const marker = createWireTerminalMarker(
                point,
                direction,
                getWireTerminalTypeForBorne(borneEl, 1),
                '#7f8c8d',
                6,
                { ...adjust, ghost: true }
            );
            if (marker) frag.appendChild(marker);
        });
    }

    svg.appendChild(frag);
    if (topSvg) topSvg.appendChild(fragTop);
}

function createWireFromPoints(points, opts = {}) {
    const normalized = optimizeWireGeometryPoints(Array.isArray(points) ? points : [], {
        aggressive: is2DWorkspaceActive(),
        rdpTolerance: 0.45
    });
    if (normalized.length < 2) return null;
    const enforce2DRules = is2DWorkspaceActive() && !opts?.skip2DRestrictions;
    const origem = opts?.origem || null;
    const destino = opts?.destino || null;
    if (enforce2DRules) {
        if (!origem || !destino) return null;
        if (origem === destino) return null;
        if (!borneCanAcceptMoreConnections(origem)) return null;
        if (!borneCanAcceptMoreConnections(destino)) return null;
    }
    const svg = document.getElementById('wire-layer');
    if (!svg) return null;

    const pointsAttr = normalized.map(p => `${p.x},${p.y}`).join(' ');
    const use2DVisual = is2DWorkspaceActive();
    const roundedPath = buildRoundedWirePath(normalized);

    const outline = document.createElementNS('http://www.w3.org/2000/svg', use2DVisual ? 'path' : 'polyline');
    if (use2DVisual) outline.setAttribute('d', roundedPath);
    else outline.setAttribute('points', pointsAttr);
    outline.setAttribute('class', 'user-wire-outline');
    outline.setAttribute('pointer-events', 'none');

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', pointsAttr);
    poly.setAttribute('class', 'user-wire');

    let body = null;
    let highlight = null;
    if (use2DVisual) {
        body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        body.setAttribute('d', roundedPath);
        body.setAttribute('class', 'user-wire-body');
        body.setAttribute('pointer-events', 'none');

        highlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        highlight.setAttribute('d', roundedPath);
        highlight.setAttribute('class', 'user-wire-highlight');
        highlight.setAttribute('pointer-events', 'none');
    }

    const color = opts.configColor || opts.baseColor || opts.color || corFioAtual;
    const width = Number.isFinite(opts.width) && opts.width > 0 ? opts.width : getCurrentWireThickness();

    poly.addEventListener('click', e => {
        if ((window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) === 'borracha') {
            e.stopPropagation();
            removeWireByElement(poly, { skipRender: true });
            requestRenderWireJunctions();
        }
    });

    svg.appendChild(poly);
    svg.appendChild(outline);
    if (body) svg.appendChild(body);
    if (highlight) svg.appendChild(highlight);
    const wireObj = {
        id: opts.id || nextWireId(),
        element: poly,
        outlineEl: outline,
        bodyEl: body,
        highlightEl: highlight,
        points: normalized.map(p => ({ x: p.x, y: p.y })),
        colorOriginal: color,
        baseColor: color,
        configColor: color,
        width,
        origem,
        destino,
        number: normalizeWireNumber(opts.number),
        labelDx: Number.isFinite(opts.labelDx) ? opts.labelDx : 0,
        labelDy: Number.isFinite(opts.labelDy) ? opts.labelDy : 0,
        labelEl: null,
        labelEls: []
    };
    applyWireRenderAppearance(wireObj, color, width);
    observeWireRenderStyle(wireObj);
    updateWireNumberSeedFromValue(wireObj.number);
    listaFios.push(wireObj);
    if (enforce2DRules) {
        const flaggedOnCreate = inspectPathological2DWire(wireObj, 'create');
        if (flaggedOnCreate && typeof window.showWireIssueOverlay === 'function') {
            window.showWireIssueOverlay('Cabo criado com geometria corrompida e marcado em rosa. RefaÃ§a este cabo agora.');
        }
    }
    syncWireNumbersBySharedBornes();
    markWireIndexDirty();
    if (typeof window.construirNosEletricos === 'function') {
        window.construirNosEletricos();
    }
    renderWireJunctions();
    return wireObj;
}
function clearAutoWireGuides() {
    if (autoWireGuideTimer) {
        clearTimeout(autoWireGuideTimer);
        autoWireGuideTimer = null;
    }
    if (autoWirePreviewThrottleTimer) {
        clearTimeout(autoWirePreviewThrottleTimer);
        autoWirePreviewThrottleTimer = null;
    }
    autoWirePreviewPendingComponents = null;
    document.querySelectorAll('#wire-layer .auto-wire-guide').forEach(l => l.remove());
}

function appendAutoWireGuidesForComponent(svg, bancada, componentEl) {
    if (!svg || !bancada || !componentEl) return;
    const br = bancada.getBoundingClientRect();
    const width = parseFloat(svg.getAttribute('width') || '5000') || 5000;
    const height = parseFloat(svg.getAttribute('height') || '5000') || 5000;
    const points = [];
    const toWs = (screenPx, originPx) => (screenPx - originPx) / zoomLevel;
    const fmt = (n) => Number.isFinite(n) ? String(Math.round(n * 1000) / 1000) : '0';
    const lib = String(componentEl?.dataset?.lib || '');
    const isRealReleTermico = lib === 'real_rele_termico';
    const releTopPowerPins = new Set(['1L1', '3L2', '5L3']);
    const releBottomPowerPins = new Set(['2T1', '4T2', '6T3']);

    componentEl.querySelectorAll('.borne').forEach(b => {
        const pino = String(b?.dataset?.pino || '').trim().toUpperCase();
        if (
            isRealReleTermico &&
            !releTopPowerPins.has(pino) &&
            !releBottomPowerPins.has(pino)
        ) {
            return;
        }
        const r = b.getBoundingClientRect();
        const x = toWs(r.left + r.width / 2, br.left);
        const y = toWs(r.top + r.height / 2, br.top);
        points.push({ x, y });
        let y1 = 0;
        let y2 = height;
        if (isRealReleTermico) {
            if (releTopPowerPins.has(pino)) y2 = y;
            else if (releBottomPowerPins.has(pino)) y1 = y;
        }
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'auto-wire-guide');
        line.setAttribute('x1', fmt(x));
        line.setAttribute('y1', fmt(y1));
        line.setAttribute('x2', fmt(x));
        line.setAttribute('y2', fmt(y2));
        svg.appendChild(line);
    });

    // Guia horizontal de posicionamento: usa bornes superior/inferior dos dois lados.
    if (points.length) {
        const compRect = componentEl.getBoundingClientRect();
        const centerX = toWs(compRect.left + compRect.width / 2, br.left);
        const left = points.filter(p => p.x <= centerX);
        const right = points.filter(p => p.x >= centerX);
        const yTargets = new Set();

        const addSideExtremes = (list) => {
            if (!list.length) return;
            let minY = list[0].y;
            let maxY = list[0].y;
            list.forEach(p => {
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            yTargets.add(minY);
            yTargets.add(maxY);
        };

        addSideExtremes(left);
        addSideExtremes(right);
        if (!yTargets.size) addSideExtremes(points);

        yTargets.forEach(y => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'auto-wire-guide auto-wire-guide-horizontal');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', fmt(y));
            line.setAttribute('x2', fmt(width));
            line.setAttribute('y2', fmt(y));
            svg.appendChild(line);
        });
    }
}

function showAutoWireGuidesForComponents(componentEls, durationMs = 1000, options = {}) {
    const force = !!options.force;
    if (!autoWireEnabled && !force) {
        clearAutoWireGuides();
        return;
    }
    const list = Array.isArray(componentEls) ? componentEls.filter(Boolean) : [];
    if (!list.length) return;
    const svg = document.getElementById('wire-layer');
    const bancada = document.getElementById('bancada');
    if (!svg || !bancada) return;
    clearAutoWireGuides();

    list.forEach(comp => appendAutoWireGuidesForComponent(svg, bancada, comp));

    if (Number.isFinite(durationMs) && durationMs > 0) {
        autoWireGuideTimer = setTimeout(() => {
            clearAutoWireGuides();
        }, Math.max(100, durationMs));
    }
}

function showAutoWireGuidesForComponent(componentEl, durationMs = 1000, options = {}) {
    showAutoWireGuidesForComponents(componentEl ? [componentEl] : [], durationMs, options);
}

function previewAutoWireGuidesForComponents(componentEls, options = {}) {
    const force = !!options.force;
    if (!autoWireEnabled && !force) {
        clearAutoWireGuides();
        return;
    }
    const list = Array.isArray(componentEls) ? componentEls.filter(Boolean) : [];
    autoWirePreviewPendingComponents = { list, force };

    const PREVIEW_INTERVAL_MS = 60;
    const now = Date.now();
    const elapsed = now - autoWirePreviewLastAt;
    const waitMs = elapsed >= PREVIEW_INTERVAL_MS ? 0 : (PREVIEW_INTERVAL_MS - elapsed);
    if (autoWirePreviewThrottleTimer) return;

    autoWirePreviewThrottleTimer = setTimeout(() => {
        autoWirePreviewThrottleTimer = null;
        autoWirePreviewLastAt = Date.now();
        const pendingState = autoWirePreviewPendingComponents && typeof autoWirePreviewPendingComponents === 'object'
            ? autoWirePreviewPendingComponents
            : { list: [], force: false };
        const pending = Array.isArray(pendingState.list)
            ? pendingState.list
            : [];
        autoWirePreviewPendingComponents = null;
        showAutoWireGuidesForComponents(pending, 0, { force: !!pendingState.force });
    }, waitMs);
}

function previewAutoWireGuidesForComponent(componentEl, options = {}) {
    previewAutoWireGuidesForComponents(componentEl ? [componentEl] : [], options);
}

function previewPlacementGuidesForComponents(componentEls) {
    previewAutoWireGuidesForComponents(componentEls, { force: true });
}

function previewPlacementGuidesForComponent(componentEl) {
    previewPlacementGuidesForComponents(componentEl ? [componentEl] : []);
}

function createAutoWiresForComponent(componentEl) {
    const lib = String(componentEl?.dataset?.lib || '');
    if (!componentEl || !autoWireEnabled) return 0;
    const bancada = componentEl.closest('.workbench') || document.getElementById('bancada');
    if (!bancada) return 0;
    const br = bancada.getBoundingClientRect();
    const allBornes = Array.from(bancada.querySelectorAll('.borne'));
    const ownBornes = Array.from(componentEl.querySelectorAll('.borne'));
    const toleranceX = Math.max(2, Math.round((window.GRID_SIZE || BASE_GRID_SIZE || 20) * 0.25));
    const toleranceY = Math.max(2, Math.round((window.GRID_SIZE || BASE_GRID_SIZE || 20) * 0.25));
    let created = 0;

    const getXY = (borne) => {
        const r = borne.getBoundingClientRect();
        return {
            x: snap((r.left + r.width / 2 - br.left) / zoomLevel),
            y: snap((r.top + r.height / 2 - br.top) / zoomLevel)
        };
    };
    const getCenter = (comp) => {
        const r = comp?.getBoundingClientRect?.();
        if (!r) return null;
        return {
            x: (r.left + r.right) / 2,
            y: (r.top + r.bottom) / 2
        };
    };
    const connectThreePhaseBundlePair = () => {
        const lib = String(componentEl?.dataset?.lib || '');
        const continuationLib = 'iec_setas_continuacao_3fnt';
        const sourceLibs = new Set(['iec_fonte_trifasica_nt', 'real_fonte_trifasica_nt']);
        const channels = ['L1', 'L2', 'L3', 'N', 'T'];

        let targetSelector = null;
        let preferredSide = null; // 'left' | 'right' | null
        let ownPin = (p) => p;
        let targetPin = (p) => p;

        if (lib === continuationLib) {
            targetSelector = (c) => sourceLibs.has(String(c?.dataset?.lib || ''));
            preferredSide = 'left';
            ownPin = (p) => p;
            targetPin = (p) => p;
        } else if (sourceLibs.has(lib)) {
            targetSelector = (c) => String(c?.dataset?.lib || '') === continuationLib;
            preferredSide = 'right';
            ownPin = (p) => p;
            targetPin = (p) => p;
        } else {
            return { created: 0, matched: false, handled: false };
        }

        const ownCenter = getCenter(componentEl);
        if (!ownCenter) return { created: 0, matched: false, handled: true };

        const candidates = Array.from(bancada.querySelectorAll('.component'))
            .filter(c => c && c !== componentEl && targetSelector(c));
        if (!candidates.length) return { created: 0, matched: false, handled: true };

        const sideCandidates = candidates.filter(c => {
            const center = getCenter(c);
            if (!center) return false;
            if (preferredSide === 'left') return center.x < (ownCenter.x - 1);
            if (preferredSide === 'right') return center.x > (ownCenter.x + 1);
            return true;
        });

        const getBundleAlignmentMetrics = (counterpartComp) => {
            let totalDx = 0;
            let maxDy = 0;
            for (const ch of channels) {
                const bOwn = componentEl.querySelector(`.borne[data-pino="${ownPin(ch)}"]`);
                const bTarget = counterpartComp.querySelector(`.borne[data-pino="${targetPin(ch)}"]`);
                if (!bOwn || !bTarget) return null;
                const pA = getXY(bOwn);
                const pB = getXY(bTarget);
                if (!pA || !pB) return null;
                const dy = Math.abs(pA.y - pB.y);
                const dx = pB.x - pA.x;
                if (dy > toleranceY) return null;
                if (preferredSide === 'left' && dx >= -0.1) return null;
                if (preferredSide === 'right' && dx <= 0.1) return null;
                totalDx += Math.abs(dx);
                maxDy = Math.max(maxDy, dy);
            }
            return { totalDx, maxDy };
        };

        const pool = sideCandidates
            .map(comp => ({
                comp,
                center: getCenter(comp),
                metrics: getBundleAlignmentMetrics(comp)
            }))
            .filter(item => item.center && item.metrics);
        if (!pool.length) return { created: 0, matched: false, handled: true };

        pool.sort((a, b) => {
            if (a.metrics.totalDx !== b.metrics.totalDx) return a.metrics.totalDx - b.metrics.totalDx;
            if (a.metrics.maxDy !== b.metrics.maxDy) return a.metrics.maxDy - b.metrics.maxDy;
            const da = Math.abs(a.center.x - ownCenter.x) + Math.abs(a.center.y - ownCenter.y);
            const db = Math.abs(b.center.x - ownCenter.x) + Math.abs(b.center.y - ownCenter.y);
            return da - db;
        });
        const counterpart = pool[0]?.comp || null;
        if (!counterpart) return { created: 0, matched: false, handled: true };

        let localCreated = 0;
        channels.forEach((ch, idx) => {
            const bOwn = componentEl.querySelector(`.borne[data-pino="${ownPin(ch)}"]`);
            const bTarget = counterpart.querySelector(`.borne[data-pino="${targetPin(ch)}"]`);
            if (!bOwn || !bTarget) return;
            if (wirePairExists(bOwn, bTarget)) return;

            const pA = getXY(bOwn);
            const pB = getXY(bTarget);
            if (!pA || !pB) return;

            let points = [{ x: pA.x, y: pA.y }, { x: pB.x, y: pB.y }];
            if (pA.x !== pB.x && pA.y !== pB.y) {
                const signX = pB.x >= pA.x ? 1 : -1;
                const spacing = Math.max(6, Math.round((window.GRID_SIZE || BASE_GRID_SIZE || 20) * 0.5));
                const laneOffset = (idx - ((channels.length - 1) / 2)) * spacing;
                let laneX = ((pA.x + pB.x) / 2) + laneOffset;
                if (Math.abs(laneX - pA.x) < 3) laneX = pA.x + (signX * spacing);
                if (Math.abs(laneX - pB.x) < 3) laneX = pB.x - (signX * spacing);
                points = [
                    { x: pA.x, y: pA.y },
                    { x: laneX, y: pA.y },
                    { x: laneX, y: pB.y },
                    { x: pB.x, y: pB.y }
                ];
            }

            const wire = createWireFromPoints(points, {
                origem: bOwn,
                destino: bTarget
            });
            if (wire) localCreated++;
        });

        return { created: localCreated, matched: true, handled: true };
    };
    const getComponentRectWs = (comp) => {
        const r = comp?.getBoundingClientRect?.();
        if (!r) return null;
        const top = (r.top - br.top) / zoomLevel;
        const bottom = (r.bottom - br.top) / zoomLevel;
        return {
            top,
            bottom,
            midY: (top + bottom) / 2,
            height: Math.max(1, bottom - top)
        };
    };
    const getBorneVerticalDirection = (borne) => {
        const comp = borne?.closest?.('.component');
        if (!comp) return 0;
        const rect = getComponentRectWs(comp);
        const pos = getXY(borne);
        if (!rect || !pos) return 0;
        const deadZone = Math.max(4, rect.height * 0.12);
        if (pos.y <= (rect.midY - deadZone)) return -1; // borne superior: procura acima
        if (pos.y >= (rect.midY + deadZone)) return 1;  // borne inferior: procura abaixo
        return 0; // borne central/lateral: sem restricao vertical
    };

    const bundleAuto = connectThreePhaseBundlePair();
    created += (bundleAuto?.created || 0);
    if (bundleAuto?.handled) {
        return created;
    }

    const singleSourceLibs = new Set(['iec_fase', 'iec_neutro']);
    const connectedSingleSourceBornes = new Set();
    const getSingleSourcePriority = (sourcePos, otherPos) => {
        if (!sourcePos || !otherPos) return null;
        const dx = otherPos.x - sourcePos.x;
        const dy = otherPos.y - sourcePos.y;
        if (Math.abs(dy) <= toleranceY && dx > 0.1) {
            return { priority: 0, dist: dx };
        }
        if (Math.abs(dx) <= toleranceX && dy < -0.1) {
            return { priority: 1, dist: Math.abs(dy) };
        }
        if (Math.abs(dx) <= toleranceX && dy > 0.1) {
            return { priority: 2, dist: dy };
        }
        return null;
    };
    const getSingleSourceBorne = (comp) => comp?.querySelector?.('.borne');
    const getRegularAlignedCandidates = (src, srcPos) => {
        const srcDir = getBorneVerticalDirection(src);
        return allBornes
            .filter(b => b && b !== src && b.closest('.component') !== componentEl)
            .filter(b => !singleSourceLibs.has(String(b.closest('.component')?.dataset?.lib || '')))
            .map(b => ({ borne: b, ...getXY(b) }))
            .filter(p => Math.abs(p.x - srcPos.x) <= toleranceX && Math.abs(p.y - srcPos.y) > 0.1)
            .filter(p => {
                if (srcDir < 0) return p.y < (srcPos.y - 0.1);
                if (srcDir > 0) return p.y > (srcPos.y + 0.1);
                return true;
            });
    };
    const createSingleSourceWire = (sourceBorne, targetBorne) => {
        if (!sourceBorne || !targetBorne) return false;
        if (wirePairExists(sourceBorne, targetBorne)) return false;
        const pA = getXY(sourceBorne);
        const pB = getXY(targetBorne);
        if (!pA || !pB) return false;
        const wire = createWireFromPoints([{ x: pA.x, y: pA.y }, { x: pB.x, y: pB.y }], {
            origem: sourceBorne,
            destino: targetBorne
        });
        if (!wire) return false;
        connectedSingleSourceBornes.add(sourceBorne);
        created++;
        return true;
    };

    if (singleSourceLibs.has(lib)) {
        const sourceBorne = ownBornes[0];
        const sourcePos = sourceBorne ? getXY(sourceBorne) : null;
        const candidates = allBornes
            .filter(b => b && b !== sourceBorne && b.closest('.component') !== componentEl)
            .map(b => {
                const pos = getXY(b);
                const special = getSingleSourcePriority(sourcePos, pos);
                return special ? { borne: b, pos, special } : null;
            })
            .filter(Boolean);
        if (candidates.length) {
            candidates.sort((a, b) => {
                if (a.special.priority !== b.special.priority) return a.special.priority - b.special.priority;
                return a.special.dist - b.special.dist;
            });
            createSingleSourceWire(sourceBorne, candidates[0].borne);
        }
    } else {
        const hasRegularCandidate = ownBornes.some(b => {
            const pos = getXY(b);
            if (!pos) return false;
            return getRegularAlignedCandidates(b, pos).length > 0;
        });

        if (!hasRegularCandidate) {
            const singleSourceComponents = Array.from(bancada.querySelectorAll('.component'))
                .filter(c => c && c !== componentEl && singleSourceLibs.has(String(c?.dataset?.lib || '')));

            singleSourceComponents.forEach(sourceComp => {
                const sourceBorne = getSingleSourceBorne(sourceComp);
                if (!sourceBorne || connectedSingleSourceBornes.has(sourceBorne)) return;
                const sourcePos = getXY(sourceBorne);
                const candidates = ownBornes
                    .map(b => {
                        const pos = getXY(b);
                        const special = getSingleSourcePriority(sourcePos, pos);
                        return special ? { borne: b, pos, special } : null;
                    })
                    .filter(Boolean);
                if (!candidates.length) return;
                candidates.sort((a, b) => {
                    if (a.special.priority !== b.special.priority) return a.special.priority - b.special.priority;
                    return a.special.dist - b.special.dist;
                });
                createSingleSourceWire(sourceBorne, candidates[0].borne);
            });
        }
    }

    ownBornes.forEach(src => {
        const srcPos = getXY(src);
        if (!srcPos) return;
        const candidates = getRegularAlignedCandidates(src, srcPos);
        if (!candidates.length) return;

        candidates.sort((a, b) => Math.abs(a.y - srcPos.y) - Math.abs(b.y - srcPos.y));
        const target = candidates[0];
        if (!target?.borne) return;
        if (wirePairExists(src, target.borne)) return;

        const x = srcPos.x;
        const points = [{ x, y: srcPos.y }, { x, y: target.y }];
        const wire = createWireFromPoints(points, {
            origem: src,
            destino: target.borne
        });
        if (wire) created++;
    });
    return created;
}

function handleAutoWireAfterComponentDrop(componentEl, opts = {}) {
    return handleAutoWireAfterComponentsDrop(componentEl ? [componentEl] : [], opts);
}

function handleAutoWireAfterComponentsDrop(componentEls, opts = {}) {
    const list = Array.isArray(componentEls) ? componentEls.filter(Boolean) : [];
    if (!list.length) return { guides: 0, created: 0 };
    if (!autoWireEnabled) {
        clearAutoWireGuides();
        return { guides: 0, created: 0 };
    }

    const showGuides = autoWireEnabled && opts?.showGuides !== false;
    const durationMs = Number.isFinite(opts?.durationMs) ? opts.durationMs : 1000;
    if (showGuides) showAutoWireGuidesForComponents(list, durationMs);
    else clearAutoWireGuides();

    let created = 0;
    list.forEach(componentEl => {
        created += createAutoWiresForComponent(componentEl);
    });
    return { guides: showGuides ? list.length : 0, created };
}

function markWireIndexDirty() {
    wireSegmentIndexDirty = true;
}

function ensureWireSegmentIndex() {
    if (typeof window.RBush !== 'function') return null;
    if (!wireSegmentIndexDirty && wireSegmentIndex) return wireSegmentIndex;

    const index = new window.RBush();
    const items = [];

    listaFios.forEach((f, wireIdx) => {
        const pts = f.points || [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            items.push({
                minX: Math.min(p1.x, p2.x),
                minY: Math.min(p1.y, p2.y),
                maxX: Math.max(p1.x, p2.x),
                maxY: Math.max(p1.y, p2.y),
                wireIdx,
                segIdx: i
            });
        }
    });

    if (items.length) index.load(items);
    wireSegmentIndex = index;
    wireSegmentIndexDirty = false;
    return wireSegmentIndex;
}

function getClosestWirePoint(x, y) {
    let best = null;
    const wireSearchRadius = getWireSearchRadius();
    let minDist = wireSearchRadius;

    const idx = ensureWireSegmentIndex();
    const candidates = idx
        ? idx.search({
            minX: x - wireSearchRadius,
            minY: y - wireSearchRadius,
            maxX: x + wireSearchRadius,
            maxY: y + wireSearchRadius
        })
        : null;

    if (candidates && candidates.length) {
        candidates.forEach(item => {
            const f = listaFios[item.wireIdx];
            if (!f || !f.points || !f.points[item.segIdx + 1]) return;
            const p1 = f.points[item.segIdx];
            const p2 = f.points[item.segIdx + 1];
            const c = closestPointOnSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (c.d < minDist) {
                minDist = c.d;
                best = { x: snap(c.x), y: snap(c.y), d: c.d, wire: f };
            }
        });
    } else {
        listaFios.forEach(f => {
            const pts = f.points || [];
            for (let i = 0; i < pts.length - 1; i++) {
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const c = closestPointOnSegment(x, y, p1.x, p1.y, p2.x, p2.y);
                if (c.d < minDist) {
                    minDist = c.d;
                    best = { x: snap(c.x), y: snap(c.y), d: c.d, wire: f };
                }
            }
        });
    }

    return best;
}

function addOrthogonalCornerIfNeeded(targetX, targetY) {
    if (pontosFioAtual.length === 0) return;
    const last = pontosFioAtual[pontosFioAtual.length - 1];
    if (last.x === targetX || last.y === targetY) return;

    const dx = Math.abs(targetX - last.x);
    const dy = Math.abs(targetY - last.y);
    const corner = (dx >= dy)
        ? { x: targetX, y: last.y, borne: null }
        : { x: last.x, y: targetY, borne: null };

    pontosFioAtual.push(corner);
}

function getWireCornerRadius() {
    const snapSize = getWireSnapSize();
    return Math.max(8, Math.min(20, snapSize * 0.85));
}

function buildRoundedWirePath(points, radius = getWireCornerRadius()) {
    const src = normalizeWirePoints(
        (Array.isArray(points) ? points : [])
            .map(p => ({
                x: Number.isFinite(Number(p?.x)) ? Number(p.x) : 0,
                y: Number.isFinite(Number(p?.y)) ? Number(p.y) : 0
            }))
    );
    if (!src.length) return '';
    if (src.length === 1) return `M ${src[0].x} ${src[0].y}`;
    if (src.length === 2 || !is2DWorkspaceActive()) return `M ${src[0].x} ${src[0].y} L ${src.slice(1).map(p => `${p.x} ${p.y}`).join(' L ')}`;

    const fmt = (v) => Math.round(v * 1000) / 1000;
    const maxRadius = Number.isFinite(radius) ? Math.max(2, radius * 0.7) : 6;
    let d = `M ${fmt(src[0].x)} ${fmt(src[0].y)}`;

    for (let i = 1; i < src.length - 1; i++) {
        const a = src[i - 1];
        const b = src[i];
        const c = src[i + 1];
        const v1x = a.x - b.x;
        const v1y = a.y - b.y;
        const v2x = c.x - b.x;
        const v2y = c.y - b.y;
        const d1 = Math.hypot(v1x, v1y);
        const d2 = Math.hypot(v2x, v2y);
        if (d1 < 0.001 || d2 < 0.001) {
            d += ` L ${fmt(b.x)} ${fmt(b.y)}`;
            continue;
        }

        const u1x = v1x / d1;
        const u1y = v1y / d1;
        const u2x = v2x / d2;
        const u2y = v2y / d2;
        const dot = (u1x * u2x) + (u1y * u2y);
        const cross = (u1x * u2y) - (u1y * u2x);
        const isCorner = Math.abs(dot) < 0.3 && Math.abs(cross) > 0.35;
        if (!isCorner) {
            d += ` L ${fmt(b.x)} ${fmt(b.y)}`;
            continue;
        }

        const r = Math.min(maxRadius, d1 * 0.45, d2 * 0.45);
        if (r < 1.5) {
            d += ` L ${fmt(b.x)} ${fmt(b.y)}`;
            continue;
        }

        const sx = fmt(b.x + (u1x * r));
        const sy = fmt(b.y + (u1y * r));
        const ex = fmt(b.x + (u2x * r));
        const ey = fmt(b.y + (u2y * r));
        d += ` L ${sx} ${sy} Q ${fmt(b.x)} ${fmt(b.y)} ${ex} ${ey}`;
    }

    const last = src[src.length - 1];
    d += ` L ${fmt(last.x)} ${fmt(last.y)}`;
    return d;
}

function roundWireCorners(points, radius = getWireCornerRadius()) {
    const src = normalizeWirePoints(
        (Array.isArray(points) ? points : [])
            .map(p => ({
                x: Number.isFinite(Number(p?.x)) ? Number(p.x) : 0,
                y: Number.isFinite(Number(p?.y)) ? Number(p.y) : 0
            }))
    );
    if (src.length < 3) return src;

    const fmt = (v) => Math.round(v * 1000) / 1000;
    const maxRadius = Number.isFinite(radius) ? Math.max(2, radius * 0.7) : 6;
    const out = [{ x: src[0].x, y: src[0].y }];

    for (let i = 1; i < src.length - 1; i++) {
        const a = src[i - 1];
        const b = src[i];
        const c = src[i + 1];
        const v1x = a.x - b.x;
        const v1y = a.y - b.y;
        const v2x = c.x - b.x;
        const v2y = c.y - b.y;
        const d1 = Math.hypot(v1x, v1y);
        const d2 = Math.hypot(v2x, v2y);
        if (d1 < 0.001 || d2 < 0.001) {
            out.push({ x: b.x, y: b.y });
            continue;
        }

        const u1x = v1x / d1;
        const u1y = v1y / d1;
        const u2x = v2x / d2;
        const u2y = v2y / d2;
        const dot = (u1x * u2x) + (u1y * u2y);
        const cross = (u1x * u2y) - (u1y * u2x);
        const isCorner = Math.abs(dot) < 0.3 && Math.abs(cross) > 0.35;
        if (!isCorner) {
            out.push({ x: b.x, y: b.y });
            continue;
        }

        const r = Math.min(maxRadius, d1 * 0.45, d2 * 0.45);
        if (r < 1.5) {
            out.push({ x: b.x, y: b.y });
            continue;
        }

        out.push({
            x: fmt(b.x + (u1x * r)),
            y: fmt(b.y + (u1y * r))
        });
        out.push({
            x: fmt(b.x + (u2x * r)),
            y: fmt(b.y + (u2y * r))
        });
    }

    out.push({ x: src[src.length - 1].x, y: src[src.length - 1].y });
    return normalizeWirePoints(out);
}

function renderWireJunctions() {
    const svg = document.getElementById('wire-layer');
    if (!svg) return;
    svg.querySelectorAll('.wire-junction').forEach(n => n.remove());
    const in2D = is2DWorkspaceActive();
    if (in2D) {
        renderTopWireOverlays();
        renderWireTerminals();
        wire2DDecorVisible = true;
        emendasSelecionadas.clear();
        renderWireLabels();
        return;
    }
    if (wire2DDecorVisible) {
        clear2DWireDecorations();
        wire2DDecorVisible = false;
    }
    const keys = new Set();
    const counts = new Map();
    const endpoints = [];
    let totalSegments = 0;
    const nowMs = () => Date.now();
    const scanStartMs = nowMs();
    const JUNCTION_SCAN_BUDGET_MS = 14;
    const exceededBudget = () => (nowMs() - scanStartMs) > JUNCTION_SCAN_BUDGET_MS;
    const MAX_POINT_SAMPLES = 12000;
    let pointSamples = 0;
    for (const f of listaFios) {
        if (exceededBudget() || pointSamples >= MAX_POINT_SAMPLES) break;
        const pts = f.points || [];
        totalSegments += Math.max(0, pts.length - 1);
        const seenInWire = new Set();
        for (const p of pts) {
            if (exceededBudget() || pointSamples >= MAX_POINT_SAMPLES) break;
            pointSamples++;
            const k = pointKey(p.x, p.y);
            if (seenInWire.has(k)) continue;
            seenInWire.add(k);
            counts.set(k, (counts.get(k) || 0) + 1);
        }
        if (pts.length) {
            endpoints.push({ x: pts[0].x, y: pts[0].y, wire: f });
            endpoints.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, wire: f });
        }
    }

    counts.forEach((v, k) => {
        if (v >= 2) keys.add(k);
    });

    const MAX_INDEX_SEGMENTS = 4500;
    const segmentIndex = totalSegments <= MAX_INDEX_SEGMENTS ? ensureWireSegmentIndex() : null;

    // ponta no meio de segmento de outro fio.
    // Modo rapido com indice espacial para proteger desempenho no modo simbologia.
    const endpointSegTol = 1.2;
    const MAX_ENDPOINT_QUERIES = 1200;
    let endpointQueries = 0;
    if (segmentIndex && typeof segmentIndex.search === 'function') {
        for (const ep of endpoints) {
            if (exceededBudget()) break;
            if (endpointQueries >= MAX_ENDPOINT_QUERIES) break;
            const hits = segmentIndex.search({
                minX: ep.x - endpointSegTol,
                minY: ep.y - endpointSegTol,
                maxX: ep.x + endpointSegTol,
                maxY: ep.y + endpointSegTol
            }) || [];
            for (const hit of hits) {
                endpointQueries++;
                if (endpointQueries >= MAX_ENDPOINT_QUERIES) break;
                if (exceededBudget()) break;
                const f = listaFios[hit.wireIdx];
                const pts = f?.points || [];
                const a = pts[hit.segIdx];
                const b = pts[hit.segIdx + 1];
                if (!a || !b) continue;
                const isSegmentEndpoint =
                    (Math.abs(ep.x - a.x) < 0.5 && Math.abs(ep.y - a.y) < 0.5) ||
                    (Math.abs(ep.x - b.x) < 0.5 && Math.abs(ep.y - b.y) < 0.5);
                if (isSegmentEndpoint) continue;
                if (pointOnSegment(ep, a, b, endpointSegTol)) {
                    keys.add(pointKey(ep.x, ep.y));
                }
            }
        }
    } else {
        // Fallback sem indice: limita para evitar congelamento.
        const canRunEndpointSegmentScan = (listaFios.length <= 60) && (totalSegments <= 500);
        if (canRunEndpointSegmentScan) {
            for (const ep of endpoints) {
                if (exceededBudget()) break;
                for (const f of listaFios) {
                    if (exceededBudget()) break;
                    const pts = f.points || [];
                    for (let i = 0; i < pts.length - 1; i++) {
                        endpointQueries++;
                        if (endpointQueries >= MAX_ENDPOINT_QUERIES) break;
                        if (exceededBudget()) break;
                        const a = pts[i];
                        const b = pts[i + 1];
                        const isSegmentEndpoint =
                            (Math.abs(ep.x - a.x) < 0.5 && Math.abs(ep.y - a.y) < 0.5) ||
                            (Math.abs(ep.x - b.x) < 0.5 && Math.abs(ep.y - b.y) < 0.5);
                        if (isSegmentEndpoint) continue;
                        if (pointOnSegment(ep, a, b, endpointSegTol)) keys.add(pointKey(ep.x, ep.y));
                    }
                }
            }
        }
    }

    emendasSelecionadas.forEach(k => {
        if (!keys.has(k)) emendasSelecionadas.delete(k);
    });

    keys.forEach(k => {
        const [x, y] = k.split(':').map(Number);
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('class', 'wire-junction');
        c.dataset.key = k;
        c.setAttribute('cx', x);
        c.setAttribute('cy', y);
        c.setAttribute('r', 5);
        if (emendasSelecionadas.has(k)) c.classList.add('junction-selected');
        svg.appendChild(c);
    });

    renderWireLabels();
}

function getJunctionKeysInsideScreenRect(screenRect, touchMode = false) {
    if (!screenRect) return [];
    const insideTol = 3;
    const selectedKeys = [];
    document.querySelectorAll('#wire-layer .wire-junction').forEach(node => {
        const key = String(node?.dataset?.key || '').trim();
        if (!key) return;
        const r = node.getBoundingClientRect();
        const hit = touchMode
            ? !(r.right < screenRect.left || r.left > screenRect.right || r.bottom < screenRect.top || r.top > screenRect.bottom)
            : (
                r.left >= (screenRect.left - insideTol) &&
                r.right <= (screenRect.right + insideTol) &&
                r.top >= (screenRect.top - insideTol) &&
                r.bottom <= (screenRect.bottom + insideTol)
            );
        if (hit) selectedKeys.push(key);
    });
    return selectedKeys;
}

function refreshJunctionSelectionVisual() {
    document.querySelectorAll('#wire-layer .wire-junction').forEach(node => {
        const key = String(node?.dataset?.key || '').trim();
        node.classList.toggle('junction-selected', !!key && emendasSelecionadas.has(key));
    });
}

function selectJunctionByKey(key, additive = false) {
    const normalized = String(key || '').trim();
    if (!normalized) return;
    if (!additive) clearWireSelection();
    if (additive && emendasSelecionadas.has(normalized)) {
        emendasSelecionadas.delete(normalized);
        refreshJunctionSelectionVisual();
        scheduleWireSelectionAutoClear();
        return;
    }
    emendasSelecionadas.add(normalized);
    refreshJunctionSelectionVisual();
    scheduleWireSelectionAutoClear();
}

function removeWireByElement(poly, opts = {}) {
    if (!poly) return;
    const skipRender = !!opts?.skipRender;
    fiosSelecionados.delete(poly);
    poly.classList.remove('wire-selected');
    const wireObj = getWireByElement(poly);
    removeWireLabelElements(wireObj);
    if (wireObj?.outlineEl) wireObj.outlineEl.remove();
    if (wireObj?.bodyEl) wireObj.bodyEl.remove();
    if (wireObj?.highlightEl) wireObj.highlightEl.remove();
    poly.remove();
    listaFios = listaFios.filter(f => f.element !== poly);
    markWireIndexDirty();
    if (typeof window.construirNosEletricos === 'function') {
        window.construirNosEletricos();
    }
    if (!skipRender) requestRenderWireJunctions();
}

function deleteSelectedWires() {
    const domSelected = Array.from(document.querySelectorAll('#wire-layer .user-wire.wire-selected'));
    const selected = new Set([
        ...Array.from(fiosSelecionados || []),
        ...domSelected
    ]);
    if (!selected.size) return false;

    // Delecao em lote para evitar custo O(n^2) quando houver muitos fios.
    selected.forEach(poly => {
        if (!poly) return;
        const wireObj = getWireByElement(poly);
        removeWireLabelElements(wireObj);
        if (wireObj?.outlineEl) wireObj.outlineEl.remove();
        if (wireObj?.bodyEl) wireObj.bodyEl.remove();
        if (wireObj?.highlightEl) wireObj.highlightEl.remove();
        poly.classList.remove('wire-selected');
        poly.remove();
    });

    listaFios = listaFios.filter(f => !selected.has(f?.element));
    fiosSelecionados.clear();
    emendasSelecionadas.clear();
    wireSelectionPinned = false;
    if (wireSelectionClearTimer) {
        clearTimeout(wireSelectionClearTimer);
        wireSelectionClearTimer = null;
    }

    markWireIndexDirty();
    requestRenderWireJunctions();
    return true;
}

function clearWireSelection() {
    if (wireSelectionClearTimer) {
        clearTimeout(wireSelectionClearTimer);
        wireSelectionClearTimer = null;
    }
    fiosSelecionados.forEach(poly => poly?.classList?.remove('wire-selected'));
    fiosSelecionados.clear();
    emendasSelecionadas.clear();
    wireSelectionPinned = false;
    refreshJunctionSelectionVisual();
}

function scheduleWireSelectionAutoClear() {
    if (wireSelectionPinned) {
        wireSelectionClearTimer = null;
        return;
    }
    if (wireSelectionClearTimer) clearTimeout(wireSelectionClearTimer);
    if (!Number.isFinite(WIRE_SELECTION_AUTO_CLEAR_MS) || WIRE_SELECTION_AUTO_CLEAR_MS <= 0) {
        wireSelectionClearTimer = null;
        return;
    }
    if (!fiosSelecionados.size && !emendasSelecionadas.size) {
        wireSelectionClearTimer = null;
        return;
    }
    wireSelectionClearTimer = setTimeout(() => {
        clearWireSelection();
    }, WIRE_SELECTION_AUTO_CLEAR_MS);
}

function pauseWireSelectionAutoClear() {
    if (wireSelectionClearTimer) {
        clearTimeout(wireSelectionClearTimer);
        wireSelectionClearTimer = null;
    }
}

function resumeWireSelectionAutoClear() {
    scheduleWireSelectionAutoClear();
}

function setWireSelectionPinned(pinned = true) {
    wireSelectionPinned = !!pinned;
    if (wireSelectionPinned) {
        pauseWireSelectionAutoClear();
    } else {
        scheduleWireSelectionAutoClear();
    }
}

function selectWire(poly, additive = false) {
    if (!poly) return;
    wireSelectionPinned = false;
    if (!additive) {
        clearWireSelection();
        if (typeof window.clearComponentSelection === 'function') window.clearComponentSelection();
        if (typeof window.clearDrawingSelection === 'function') window.clearDrawingSelection();
    }
    if (additive && fiosSelecionados.has(poly)) {
        fiosSelecionados.delete(poly);
        poly.classList.remove('wire-selected');
        scheduleWireSelectionAutoClear();
        return;
    }
    fiosSelecionados.add(poly);
    poly.classList.add('wire-selected');
    scheduleWireSelectionAutoClear();
}

function getSelectedWireElements() {
    return Array.from(fiosSelecionados);
}

function openSelectedWireEditMobile() {
    if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false))) return false;
    const selected = Array.from(fiosSelecionados || []);
    if (selected.length !== 1) return false;
    const poly = selected[0];
    const wireObj = listaFios.find(f => f?.element === poly);
    if (!wireObj) return false;
    openWireEditDialog(wireObj);
    return true;
}

function selectWiresByScreenRect(screenRect, additive = false, mode = 'inside', options = {}) {
    if (!screenRect) return [];
    if (!additive) clearWireSelection();
    const persist = !!options.persist;
    // Para fios e emendas, selecao por intersecao e mais previsivel.
    const touchMode = true;
    const insideTol = 3;

    const selectedNow = [];
    listaFios.forEach(f => {
        const poly = f?.element;
        if (!poly) return;
        const r = poly.getBoundingClientRect();
        const hit = touchMode
            ? !(r.right < screenRect.left || r.left > screenRect.right || r.bottom < screenRect.top || r.top > screenRect.bottom)
            : (
                r.left >= (screenRect.left - insideTol) &&
                r.right <= (screenRect.right + insideTol) &&
                r.top >= (screenRect.top - insideTol) &&
                r.bottom <= (screenRect.bottom + insideTol)
            );
        if (!hit) return;
        fiosSelecionados.add(poly);
        poly.classList.add('wire-selected');
        selectedNow.push(poly);
    });

    getJunctionKeysInsideScreenRect(screenRect, touchMode).forEach(key => {
        emendasSelecionadas.add(key);
    });
    refreshJunctionSelectionVisual();

    if (persist && (selectedNow.length || emendasSelecionadas.size)) {
        wireSelectionPinned = true;
    }
    scheduleWireSelectionAutoClear();
    return selectedNow;
}

function moveSelectedWiresByDelta(delta, movedComponents = [], options = {}) {
    const dx = Number.isFinite(delta?.dx) ? delta.dx : 0;
    const dy = Number.isFinite(delta?.dy) ? delta.dy : 0;
    const doSnap = !!options.snap;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001 && !doSnap) return false;
    if (!fiosSelecionados.size) return false;

    let updated = false;
    fiosSelecionados.forEach(poly => {
        const f = getWireByElement(poly);
        if (!f || !Array.isArray(f.points)) return;

        f.points = f.points.map(p => ({
            x: doSnap ? snap(p.x + dx) : (p.x + dx),
            y: doSnap ? snap(p.y + dy) : (p.y + dy)
        }));
        updateWireElementPoints(f);
        updated = true;
    });

    if (!updated) return false;
    markWireIndexDirty();
    requestRenderWireJunctions();
    rebindWireEndpoints();
    return true;
}

function getBorneCenterExact(borneEl) {
    const comp = borneEl?.closest?.('.component');
    if (!borneEl || !comp) return null;
    const in2D = is2DWorkspaceActive();
    const applyWireAnchorAdjust = (baseX, baseY) => {
        if (!in2D) {
            return { x: snap(baseX), y: snap(baseY) };
        }
        const basePoint = { x: baseX, y: baseY };
        const rootStyle = window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null;
        const adjust = getTerminalAdjustForBorne(borneEl, rootStyle);
        const outward = getBorneOutwardDirection(borneEl, basePoint);
        if (!outward) return basePoint;
        const perpX = -outward.y;
        const perpY = outward.x;
        const shiftPx = Number.isFinite(adjust?.shiftPx) ? adjust.shiftPx : 0;
        return {
            x: basePoint.x + (perpX * shiftPx),
            y: basePoint.y + (perpY * shiftPx)
        };
    };

    const bancada = document.getElementById('bancada');
    if (borneEl?.getBoundingClientRect && bancada?.getBoundingClientRect) {
        const borneRect = borneEl.getBoundingClientRect();
        const bancadaRect = bancada.getBoundingClientRect();
        const safeZoom = Number.isFinite(zoomLevel) && zoomLevel > 0 ? zoomLevel : 1;
        const rectX = ((borneRect.left + (borneRect.width / 2)) - bancadaRect.left) / safeZoom;
        const rectY = ((borneRect.top + (borneRect.height / 2)) - bancadaRect.top) / safeZoom;
        if (Number.isFinite(rectX) && Number.isFinite(rectY)) {
            const visualPoint = applyWireAnchorAdjust(rectX, rectY);
            return { x: visualPoint.x, y: visualPoint.y };
        }
    }

    const compLeft = parseFloat(comp.style.left) || comp.offsetLeft || 0;
    const compTop = parseFloat(comp.style.top) || comp.offsetTop || 0;
    const cs = getComputedStyle(borneEl);
    const left = parseFloat(cs.left) || 0;
    const top = parseFloat(cs.top) || 0;
    let tx = 0;
    let ty = 0;
    const transform = String(cs.transform || '').trim();
    const m2 = transform.match(/^matrix\(([^)]+)\)$/i);
    const m3 = transform.match(/^matrix3d\(([^)]+)\)$/i);
    if (m2) {
        const parts = m2[1].split(',').map(v => parseFloat(v.trim()));
        tx = Number.isFinite(parts[4]) ? parts[4] : 0;
        ty = Number.isFinite(parts[5]) ? parts[5] : 0;
    } else if (m3) {
        const parts = m3[1].split(',').map(v => parseFloat(v.trim()));
        tx = Number.isFinite(parts[12]) ? parts[12] : 0;
        ty = Number.isFinite(parts[13]) ? parts[13] : 0;
    }
    const width = parseFloat(cs.width) || 20;
    const height = parseFloat(cs.height) || 20;
    const fallbackPoint = applyWireAnchorAdjust(
        compLeft + left + tx + (width / 2),
        compTop + top + ty + (height / 2)
    );
    return {
        x: fallbackPoint.x,
        y: fallbackPoint.y
    };
}

function reanchorSelectedWiresToComponents(movedComponents = []) {
    if (!Array.isArray(movedComponents) || !movedComponents.length) return false;
    if (!fiosSelecionados.size) return false;

    const movedBornes = new Set();
    movedComponents.forEach(comp => {
        comp?.querySelectorAll?.('.borne')?.forEach(b => movedBornes.add(b));
    });
    if (!movedBornes.size) return false;

    let updated = false;
    fiosSelecionados.forEach(poly => {
        const f = getWireByElement(poly);
        if (!f || !Array.isArray(f.points) || f.points.length < 2) return;

        const firstIdx = 0;
        const lastIdx = f.points.length - 1;

        if (f.origem && movedBornes.has(f.origem)) {
            const pos = getBorneCenterExact(f.origem);
            if (pos) {
                const oldStart = { ...f.points[firstIdx] };
                const oldNext = f.points.length > 1 ? { ...f.points[firstIdx + 1] } : null;
                f.points[firstIdx] = { ...f.points[firstIdx], x: pos.x, y: pos.y };
                if (oldNext && f.points.length > 2) {
                    const horizontal = Math.abs((oldNext.x || 0) - (oldStart.x || 0))
                        >= Math.abs((oldNext.y || 0) - (oldStart.y || 0));
                    if (horizontal) {
                        f.points[firstIdx + 1] = { ...f.points[firstIdx + 1], y: pos.y };
                    } else {
                        f.points[firstIdx + 1] = { ...f.points[firstIdx + 1], x: pos.x };
                    }
                }
                updated = true;
            }
        }
        if (f.destino && movedBornes.has(f.destino)) {
            const pos = getBorneCenterExact(f.destino);
            if (pos) {
                const oldEnd = { ...f.points[lastIdx] };
                const oldPrev = f.points.length > 1 ? { ...f.points[lastIdx - 1] } : null;
                f.points[lastIdx] = { ...f.points[lastIdx], x: pos.x, y: pos.y };
                if (oldPrev && f.points.length > 2) {
                    const horizontal = Math.abs((oldEnd.x || 0) - (oldPrev.x || 0))
                        >= Math.abs((oldEnd.y || 0) - (oldPrev.y || 0));
                    if (horizontal) {
                        f.points[lastIdx - 1] = { ...f.points[lastIdx - 1], y: pos.y };
                    } else {
                        f.points[lastIdx - 1] = { ...f.points[lastIdx - 1], x: pos.x };
                    }
                }
                updated = true;
            }
        }

        if (updated) {
            updateWireElementPoints(f);
        }
    });

    if (!updated) return false;
    markWireIndexDirty();
    requestRenderWireJunctions();
    rebindWireEndpoints();
    return true;
}

function getWireByElement(poly) {
    return listaFios.find(f => f.element === poly) || null;
}

function collectJunctionPointRefs(keys) {
    const normalizedKeys = Array.from(new Set(
        (Array.isArray(keys) ? keys : [])
            .map(k => String(k || '').trim())
            .filter(Boolean)
    ));
    if (!normalizedKeys.length) return [];

    const pointByKey = new Map();
    normalizedKeys.forEach(key => {
        const p = parsePointKey(key);
        if (p) pointByKey.set(key, p);
    });
    if (!pointByKey.size) return [];

    // Garante vertice explicito quando a emenda estiver no meio de um segmento.
    const insertsByWire = new Map();
    listaFios.forEach((wire, wireIdx) => {
        if (!wire?.points || wire.points.length < 2) return;
        pointByKey.forEach((pt, key) => {
            for (let segIdx = 0; segIdx < wire.points.length - 1; segIdx++) {
                const a = wire.points[segIdx];
                const b = wire.points[segIdx + 1];
                const isEndpoint =
                    (Math.abs(pt.x - a.x) < 0.5 && Math.abs(pt.y - a.y) < 0.5) ||
                    (Math.abs(pt.x - b.x) < 0.5 && Math.abs(pt.y - b.y) < 0.5);
                if (isEndpoint) continue;
                if (!pointOnSegment(pt, a, b, 1.5) && distancePointToSegment(pt, a, b) > 6) continue;
                if (!insertsByWire.has(wireIdx)) insertsByWire.set(wireIdx, []);
                insertsByWire.get(wireIdx).push({ segIdx, x: pt.x, y: pt.y, key });
            }
        });
    });

    insertsByWire.forEach((entries, wireIdx) => {
        const wire = listaFios[wireIdx];
        if (!wire) return;
        const unique = new Map();
        entries.forEach(item => {
            unique.set(`${item.segIdx}:${item.key}`, item);
        });
        Array.from(unique.values())
            .sort((a, b) => b.segIdx - a.segIdx)
            .forEach(item => {
                insertPointOnWire(wire, item.segIdx, { x: item.x, y: item.y });
            });
    });

    const refs = [];
    const seen = new Set();
    listaFios.forEach((wire, wireIdx) => {
        if (!wire?.points || wire.points.length < 1) return;
        wire.points.forEach((pt, idx) => {
            const key = pointKey(pt.x, pt.y);
            if (!pointByKey.has(key)) return;
            const refKey = `${wireIdx}:${idx}`;
            if (seen.has(refKey)) return;
            seen.add(refKey);
            refs.push({ wire, wireIdx, idx });
        });
    });

    return refs;
}

function stabilizeWireJunctions(tol = 1.5) {
    if (!Array.isArray(listaFios) || !listaFios.length) return false;
    let changed = false;
    const allRefs = [];

    listaFios.forEach((wire, wireIdx) => {
        if (!wire?.points || !wire.points.length) return;
        wire.points.forEach((pt, idx) => {
            allRefs.push({ wire, wireIdx, idx, x: pt.x, y: pt.y });
        });
    });

    for (let i = 0; i < allRefs.length; i++) {
        for (let j = i + 1; j < allRefs.length; j++) {
            const aRef = allRefs[i];
            const bRef = allRefs[j];
            const aPt = aRef.wire?.points?.[aRef.idx];
            const bPt = bRef.wire?.points?.[bRef.idx];
            if (!aPt || !bPt) continue;
            if (Math.abs(aPt.x - bPt.x) > tol || Math.abs(aPt.y - bPt.y) > tol) continue;
            const mx = (aPt.x + bPt.x) / 2;
            const my = (aPt.y + bPt.y) / 2;
            const targetX = Math.abs(mx - snap(mx)) <= (tol * 2) ? snap(mx) : mx;
            const targetY = Math.abs(my - snap(my)) <= (tol * 2) ? snap(my) : my;
            if (Math.abs(aPt.x - targetX) > 0.01 || Math.abs(aPt.y - targetY) > 0.01) {
                aPt.x = targetX;
                aPt.y = targetY;
                changed = true;
            }
            if (Math.abs(bPt.x - targetX) > 0.01 || Math.abs(bPt.y - targetY) > 0.01) {
                bPt.x = targetX;
                bPt.y = targetY;
                changed = true;
            }
        }
    }

    const insertsByWire = new Map();
    const pointsNow = [];
    listaFios.forEach((wire, wireIdx) => {
        if (!wire?.points || !wire.points.length) return;
        wire.points.forEach(pt => pointsNow.push({ wireIdx, x: pt.x, y: pt.y }));
    });

    listaFios.forEach((wire, wireIdx) => {
        if (!wire?.points || wire.points.length < 2) return;
        for (let segIdx = 0; segIdx < wire.points.length - 1; segIdx++) {
            const a = wire.points[segIdx];
            const b = wire.points[segIdx + 1];
            pointsNow.forEach(p => {
                if (p.wireIdx === wireIdx) return;
                const isEndpoint =
                    (Math.abs(p.x - a.x) < 1.0 && Math.abs(p.y - a.y) < 1.0) ||
                    (Math.abs(p.x - b.x) < 1.0 && Math.abs(p.y - b.y) < 1.0);
                if (isEndpoint) return;
                if (!pointOnSegment(p, a, b, tol) && distancePointToSegment(p, a, b) > (tol * 2.5)) return;
                if (!insertsByWire.has(wireIdx)) insertsByWire.set(wireIdx, []);
                insertsByWire.get(wireIdx).push({ segIdx, x: p.x, y: p.y });
            });
        }
    });

    insertsByWire.forEach((entries, wireIdx) => {
        const wire = listaFios[wireIdx];
        if (!wire) return;
        const unique = new Map();
        entries.forEach(item => unique.set(`${item.segIdx}:${pointKey(item.x, item.y)}`, item));
        Array.from(unique.values())
            .sort((a, b) => b.segIdx - a.segIdx)
            .forEach(item => {
                const inserted = insertPointOnWire(wire, item.segIdx, { x: item.x, y: item.y });
                changed = changed || inserted;
            });
    });

    if (!changed) return false;
    listaFios.forEach(wire => {
        if (!wire?.element || !Array.isArray(wire.points)) return;
        wire.points = normalizeWirePoints(wire.points);
        updateWireElementPoints(wire);
    });
    markWireIndexDirty();
    renderWireJunctions();
    rebindWireEndpoints();
    return true;
}

function beginJunctionDrag(e, junctionEl) {
    if (is2DWorkspaceActive()) return;
    if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) || (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'select') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const key = String(junctionEl?.dataset?.key || '').trim();
    if (!key) return;

    const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
    if (!emendasSelecionadas.has(key) || additive) {
        selectJunctionByKey(key, additive);
    }
    if (!emendasSelecionadas.size) return;

    if (wireSelectionClearTimer) {
        clearTimeout(wireSelectionClearTimer);
        wireSelectionClearTimer = null;
    }

    const refs = collectJunctionPointRefs(Array.from(emendasSelecionadas));
    if (!refs.length) return;

    const wires = Array.from(new Set(refs.map(r => r.wire).filter(Boolean)));
    const basePointsByWire = new Map();
    wires.forEach(wire => {
        basePointsByWire.set(wire, (wire.points || []).map(p => ({ ...p })));
    });

    junctionDragState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        refs,
        wires,
        basePointsByWire
    };

    e.preventDefault();
    e.stopPropagation();
}

function handleJunctionDragMove(e) {
    if (!junctionDragState || e.pointerId !== junctionDragState.pointerId) return;
    const dx = (e.clientX - junctionDragState.startX) / zoomLevel;
    const dy = (e.clientY - junctionDragState.startY) / zoomLevel;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
    junctionDragState.moved = true;

    junctionDragState.wires.forEach(wire => {
        const base = junctionDragState.basePointsByWire.get(wire);
        if (!wire || !base) return;
        wire.points = base.map(p => ({ x: p.x, y: p.y }));
    });

    const nextKeys = new Set();
    junctionDragState.refs.forEach(ref => {
        const wire = ref?.wire;
        const base = junctionDragState.basePointsByWire.get(wire);
        if (!wire || !base || !wire.points || !base[ref.idx] || !wire.points[ref.idx]) return;
        const nx = snap(base[ref.idx].x + dx);
        const ny = snap(base[ref.idx].y + dy);
        wire.points[ref.idx].x = nx;
        wire.points[ref.idx].y = ny;
        nextKeys.add(pointKey(nx, ny));
    });

    junctionDragState.wires.forEach(wire => {
        if (!wire?.element || !Array.isArray(wire.points)) return;
        wire.points = normalizeWirePoints(wire.points);
        updateWireElementPoints(wire);
    });

    emendasSelecionadas = nextKeys;
    markWireIndexDirty();
    renderWireJunctions();
    e.preventDefault();
}

function handleJunctionDragEnd(e) {
    if (!junctionDragState || (e && e.pointerId !== junctionDragState.pointerId)) return;
    if (!junctionDragState.moved) {
        junctionDragState = null;
        scheduleWireSelectionAutoClear();
        return;
    }
    junctionDragState.wires.forEach(wire => {
        if (!wire || !Array.isArray(wire.points)) return;
        wire.points = optimizeWireGeometryPoints(wire.points, {
            aggressive: true,
            rdpTolerance: 0.45
        });
        inspectPathological2DWire(wire, 'junction_drag_end');
        updateWireElementPoints(wire);
    });
    markWireIndexDirty();
    renderWireJunctions();
    rebindWireEndpoints();
    stabilizeWireJunctions(1.5);
    junctionDragState = null;
    scheduleWireSelectionAutoClear();
}

function beginWireDrag(e, poly) {
    if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) || (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'select') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey);
    if (!fiosSelecionados.has(poly) || additive) selectWire(poly, additive);

    if (!fiosSelecionados.size) return;
    if (wireSelectionClearTimer) {
        clearTimeout(wireSelectionClearTimer);
        wireSelectionClearTimer = null;
    }

    wireDragState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        wires: Array.from(fiosSelecionados),
        pointsByWire: new Map()
    };
    wireDragState.wires.forEach(sel => {
        const wf = getWireByElement(sel);
        if (!wf || !Array.isArray(wf.points)) return;
        wireDragState.pointsByWire.set(sel, wf.points.map(p => ({ ...p })));
    });

    e.preventDefault();
    e.stopPropagation();
}

function handleWireDragMove(e) {
    if (!wireDragState || e.pointerId !== wireDragState.pointerId) return;
    const dx = (e.clientX - wireDragState.startX) / zoomLevel;
    const dy = (e.clientY - wireDragState.startY) / zoomLevel;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
    wireDragState.moved = true;

    wireDragState.wires.forEach(sel => {
        const wf = getWireByElement(sel);
        const base = wireDragState.pointsByWire.get(sel);
        if (!wf || !base) return;
        wf.points = base.map(p => ({ x: snap(p.x + dx), y: snap(p.y + dy) }));
        updateWireElementPoints(wf);
    });

    markWireIndexDirty();
    renderWireJunctions();
    e.preventDefault();
}

function handleWireDragEnd(e) {
    if (!wireDragState || (e && e.pointerId !== wireDragState.pointerId)) return;
    if (!wireDragState.moved) {
        wireDragState = null;
        scheduleWireSelectionAutoClear();
        return;
    }
    wireDragState.wires.forEach(sel => {
        const wf = getWireByElement(sel);
        if (!wf || !Array.isArray(wf.points)) return;
        wf.points = optimizeWireGeometryPoints(wf.points, {
            aggressive: is2DWorkspaceActive(),
            rdpTolerance: 0.45
        });
        if (is2DWorkspaceActive()) inspectPathological2DWire(wf, 'wire_drag_end');
        updateWireElementPoints(wf);
    });
    markWireIndexDirty();
    renderWireJunctions();
    rebindWireEndpoints();
    stabilizeWireJunctions(1.5);
    wireDragState = null;
    scheduleWireSelectionAutoClear();
}

function distancePointToSegment(pt, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (!len2) return Math.hypot(pt.x - a.x, pt.y - a.y);
    const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    return Math.hypot(pt.x - px, pt.y - py);
}

function insertPointOnWire(wireObj, segIdx, p) {
    if (!wireObj || !Array.isArray(wireObj.points) || segIdx < 0 || segIdx >= wireObj.points.length - 1) return false;
    const a = wireObj.points[segIdx];
    const b = wireObj.points[segIdx + 1];
    const sameAsA = Math.abs(a.x - p.x) < 1.0 && Math.abs(a.y - p.y) < 1.0;
    const sameAsB = Math.abs(b.x - p.x) < 1.0 && Math.abs(b.y - p.y) < 1.0;
    if (sameAsA || sameAsB) return false;
    wireObj.points.splice(segIdx + 1, 0, { x: p.x, y: p.y });
    wireObj.points = normalizeWirePoints(wireObj.points);
    updateWireElementPoints(wireObj);
    return true;
}

function simplify2DWireGeometry() {
    if (!Array.isArray(listaFios) || !listaFios.length) {
        return { wiresChanged: 0, pointsRemoved: 0, before: 0, after: 0 };
    }
    let pointsBefore = 0;
    let pointsAfter = 0;
    let wiresChanged = 0;
    listaFios.forEach(wireObj => {
        const beforeCount = Array.isArray(wireObj?.points) ? wireObj.points.length : 0;
        pointsBefore += beforeCount;
        if (!wireObj || beforeCount < 3) {
            pointsAfter += beforeCount;
            return;
        }
        let nextPoints = optimizeWireGeometryPoints(wireObj.points, {
            aggressive: true,
            rdpTolerance: 0.45,
            nearTol: 0.08,
            collinearTol: 0.22
        });
        const beforeStats = getWireGeometryStats(wireObj.points);
        const afterStats = getWireGeometryStats(nextPoints);
        const pathologicallyDense =
            beforeStats.points >= 800 &&
            (
                beforeStats.ratio >= 12 ||
                Math.max(beforeStats.width, beforeStats.height) <= 220
            );
        if (pathologicallyDense && afterStats.points >= Math.max(200, beforeStats.points * 0.8)) {
            const rebuilt = rebuildPathological2DWirePoints(wireObj);
            if (Array.isArray(rebuilt) && rebuilt.length >= 2) {
                nextPoints = rebuilt;
                log2DWireRepairEvent(wireObj, 'manual_simplify', beforeStats, getWireGeometryStats(rebuilt));
            }
        }
        const afterCount = Array.isArray(nextPoints) ? nextPoints.length : beforeCount;
        pointsAfter += afterCount;
        if (afterCount >= 2 && afterCount < beforeCount) {
            wireObj.points = nextPoints.map(p => ({ ...p }));
            updateWireElementPoints(wireObj);
            wiresChanged += 1;
        }
    });
    if (wiresChanged > 0) {
        markWireIndexDirty();
        requestRenderWireJunctions();
        rebindWireEndpoints();
        if (typeof window.scheduleHistoryCheckpoint === 'function') {
            window.scheduleHistoryCheckpoint('simplify_2d_wires');
        }
    }
    return {
        wiresChanged,
        pointsRemoved: Math.max(0, pointsBefore - pointsAfter),
        before: pointsBefore,
        after: pointsAfter
    };
}

function getEmendaCandidate(x, y) {
    if (is2DWorkspaceActive()) return null;
    const tol = 4.5;
    const segs = getWireSegmentsNearPoint(x, y, tol);
    if (segs.length < 2) return null;

    for (let i = 0; i < segs.length; i++) {
        for (let j = i + 1; j < segs.length; j++) {
            const s1 = segs[i];
            const s2 = segs[j];
            if (s1.wire === s2.wire) continue;
            const intersect = intersectSegments(s1.p1, s1.p2, s2.p1, s2.p2);
            if (intersect) {
                // Return raw coordinates for precise placement
                return { x: intersect.x, y: intersect.y };
            }
        }
    }
    return null;
}

function criarEmendaNoPonto(x, y) {
    if (is2DWorkspaceActive()) return false;
    const candidate = getEmendaCandidate(x, y);
    if (!candidate) return false;

    // Use raw coordinates from candidate, NO snapping here to avoid misalignment
    const ex = candidate.x;
    const ey = candidate.y;
    const key = pointKey(ex, ey);

    const wireNodes = getWiresConnectedToPoint(ex, ey, 2.5);
    if (wireNodes.length < 2) return false;

    const existing = document.querySelector(`#wire-layer .wire-junction[data-key="${key}"]`);
    if (existing) return false;

    renderWireJunctions();
    return true;
}


function showEmendaSnapAtWorkspacePoint(pt) {
    const ring = document.getElementById('magnet-target');
    const bancada = document.getElementById('bancada');
    if (!ring || !bancada || !pt) return;
    const br = bancada.getBoundingClientRect();
    const cx = br.left + (pt.x * zoomLevel);
    const cy = br.top + (pt.y * zoomLevel);
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    ring.style.display = 'block';
}

function hideEmendaSnap() {
    const ring = document.getElementById('magnet-target');
    if (ring) ring.style.display = 'none';
}

window.renderWireJunctions = renderWireJunctions;
window.requestRenderWireJunctions = requestRenderWireJunctions;
window.markWireIndexDirty = markWireIndexDirty;
window.removeWireByElement = removeWireByElement;
window.rebindWireEndpoints = rebindWireEndpoints;
window.cleanupDisconnectedWireEndpoints = cleanupDisconnectedWireEndpoints;
window.clearWireSelection = clearWireSelection;
window.getSelectedWireElements = getSelectedWireElements;
window.selectWire = selectWire;
window.setWireSelectionPinned = setWireSelectionPinned;
window.handleWireLabelPointerDownAtClient = handleWireLabelPointerDownAtClient;
window.selectWiresByScreenRect = selectWiresByScreenRect;
window.moveSelectedWiresByDelta = moveSelectedWiresByDelta;
window.reanchorSelectedWiresToComponents = reanchorSelectedWiresToComponents;
window.pauseWireSelectionAutoClear = pauseWireSelectionAutoClear;
window.resumeWireSelectionAutoClear = resumeWireSelectionAutoClear;
window.hideEmendaSnap = hideEmendaSnap;
window.deleteSelectedWires = deleteSelectedWires;
window.createWireFromPoints = createWireFromPoints;
window.applyWireSimulationColor = applyWireSimulationColor;
window.clearWireSimulationColor = clearWireSimulationColor;
window.syncWireRenderAppearanceFromState = syncWireRenderAppearanceFromState;
window.syncAllWireRenderAppearances = syncAllWireRenderAppearances;
installWireSimulationVisualObserver();
window.getWireGeometryStats = getWireGeometryStats;
window.validateAndRepair2DWires = validateAndRepair2DWires;
window.simplify2DWireGeometry = simplify2DWireGeometry;
window.renderWireLabels = renderWireLabels;
window.toggleAutoWireEnabled = toggleAutoWireEnabled;
window.setAutoWireEnabled = setAutoWireEnabled;
window.isAutoWireEnabled = isAutoWireEnabled;
window.toggleWireAssistEnabled = toggleWireAssistEnabled;
window.setWireAssistEnabled = setWireAssistEnabled;
window.isWireAssistEnabled = isWireAssistEnabled;
window.isWireDrawingInteractionActive = isWireDrawingInteractionActive;
window.isWireDrawingInProgress = () => pontosFioAtual.length > 0;
window.openSelectedWireEditMobile = openSelectedWireEditMobile;
window.finishCurrentWireFromMobileShortcut = finishCurrentWireFromMobileShortcut;
window.isWireAssistDrawingInProgress = isAssistiveWireDrawingInProgress;
window.stabilizeWireJunctions = stabilizeWireJunctions;
window.handleAutoWireAfterComponentDrop = handleAutoWireAfterComponentDrop;
window.handleAutoWireAfterComponentsDrop = handleAutoWireAfterComponentsDrop;
window.previewAutoWireGuidesForComponents = previewAutoWireGuidesForComponents;
window.previewAutoWireGuidesForComponent = previewAutoWireGuidesForComponent;
window.previewPlacementGuidesForComponents = previewPlacementGuidesForComponents;
window.previewPlacementGuidesForComponent = previewPlacementGuidesForComponent;
window.clearAutoWireGuides = clearAutoWireGuides;


// =====================================================
// COR DO FIO
// =====================================================
function setCorFio(cor) {
    corFioAtual = cor;
    document.querySelectorAll('.color-dot')
        .forEach(d => d.classList.remove('selected'));

    const targetColor = (cor || '').toLowerCase();
    const dot = Array.from(document.querySelectorAll('.color-dot'))
        .find(d => (d.dataset.color || '').toLowerCase() === targetColor);

    if (dot) dot.classList.add('selected');

    if (!(window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) && isWireAssistEnabled() && typeof ativarFerramenta === 'function' && (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'select') {
        ativarFerramenta('select');
    }
}

function setEspessuraFio(level, opts = {}) {
    const parsed = parseInt(level, 10);
    espessuraFioNivelAtual = [1, 2, 3].includes(parsed) ? parsed : 2;
    const preserveTool = !!opts?.preserveTool;

    document.querySelectorAll('.wire-thickness-dot')
        .forEach(d => d.classList.remove('selected'));
    const dot = document.querySelector(`.wire-thickness-dot[data-wire-size="${espessuraFioNivelAtual}"]`);
    if (dot) dot.classList.add('selected');

    if (previewLine) applyWireThickness(previewLine, getCurrentWireThickness());
    if (!preserveTool && !(window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) && isWireAssistEnabled() && typeof ativarFerramenta === 'function' && (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'select') {
        ativarFerramenta('select');
    }
}

window.setEspessuraFio = setEspessuraFio;

// =====================================================
// COORDENADAS
// =====================================================
function getLocalCoords(e) {
    const rect = document.getElementById('bancada').getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / zoomLevel,
        y: (e.clientY - rect.top) / zoomLevel
    };
}

function getLocalCoordsFromClient(clientX, clientY) {
    const rect = document.getElementById('bancada').getBoundingClientRect();
    return {
        x: (clientX - rect.left) / zoomLevel,
        y: (clientY - rect.top) / zoomLevel
    };
}

function clearMobileWireHoldTimer() {
    if (!mobileWireHoldTimer) return;
    clearTimeout(mobileWireHoldTimer);
    mobileWireHoldTimer = null;
}

function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getMobileWireTargetOffsetPx() {
    const viewport = document.getElementById('viewport');
    const viewportHeight = viewport?.clientHeight || window.innerHeight || 640;
    return Math.max(72, Math.min(MOBILE_WIRE_TARGET_OFFSET_PX, Math.round(viewportHeight * 0.16)));
}

function isMobileWireTargetModeActive() {
    if ((window.simulando || (typeof simulando !== 'undefined' ? simulando : false))) return false;
    if (typeof isMobileViewport === 'function' && !isMobileViewport()) return false;
    if (pinchZoomActive) return false;
    return !!(typeof isWireDrawingInteractionActive === 'function' && isWireDrawingInteractionActive());
}

function findTouchByIdentifier(touchList, identifier) {
    if (!touchList || !Number.isFinite(identifier)) return null;
    for (let i = 0; i < touchList.length; i++) {
        const touch = touchList[i];
        if (touch?.identifier === identifier) return touch;
    }
    return null;
}

function getMobileWireTargetContextFromClient(clientX, clientY) {
    const viewport = document.getElementById('viewport');
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    const pad = 18;
    const targetClientX = clampValue(clientX, rect.left + pad, rect.right - pad);
    const targetClientY = clampValue(clientY - getMobileWireTargetOffsetPx(), rect.top + pad, rect.bottom - pad);
    const local = getLocalCoordsFromClient(targetClientX, targetClientY);
    const borne = getClosestBorne(local.x, local.y, MOBILE_WIRE_TARGET_RADIUS);
    const wirePoint = is2DWorkspaceActive() ? null : getClosestWirePoint(local.x, local.y);
    return {
        clientX: targetClientX,
        clientY: targetClientY,
        x: local.x,
        y: local.y,
        borne: borne || null,
        wirePoint: wirePoint || null
    };
}

function showMobileWireTarget(context) {
    const ring = document.getElementById('magnet-target');
    if (!ring || !context) return;
    ring.style.left = `${context.clientX}px`;
    ring.style.top = `${context.clientY}px`;
    ring.style.display = 'block';
    ring.classList.add('mobile-wire-target');
    ring.classList.toggle('is-on-borne', !!context.borne);
    ring.classList.toggle('is-on-wire', !context.borne && !!context.wirePoint);
    if (typeof window.updateMouseGuidesAtClient === 'function') {
        window.updateMouseGuidesAtClient(context.clientX, context.clientY);
    }
    if (is2DWorkspaceActive()) set2DBorneHover(context.borne?.el || null);
    else clear2DBorneHover();
}

function hideMobileWireTarget() {
    const ring = document.getElementById('magnet-target');
    if (!ring) return;
    ring.style.display = 'none';
    ring.classList.remove('mobile-wire-target', 'is-on-borne', 'is-on-wire');
    if (typeof window.hideMouseGuides === 'function') {
        window.hideMouseGuides();
    }
    clear2DBorneHover();
}

function syncMobileWireTargetFromClient(clientX, clientY) {
    const context = getMobileWireTargetContextFromClient(clientX, clientY);
    if (context) showMobileWireTarget(context);
    return context;
}

function renderPreviewFromCommittedPoints() {
    if (!previewLine) return;
    previewLine.setAttribute(
        'points',
        pontosFioAtual.map(p => `${p.x},${p.y}`).join(' ')
    );
}

function getMobileWireCommitPoint(context) {
    if (!context) return null;
    if (context.borne) return { x: snap(context.borne.x), y: snap(context.borne.y), borne: context.borne.el };
    if (context.wirePoint && !is2DWorkspaceActive()) {
        return {
            x: snap(context.wirePoint.x),
            y: snap(context.wirePoint.y),
            borne: null,
            sourceWire: context.wirePoint.wire || null
        };
    }
    return { x: snap(context.x), y: snap(context.y), borne: null };
}

function beginMobileWireFromContext(context) {
    if (!context?.borne) return false;
    if (is2DWorkspaceActive() && !borneCanAcceptMoreConnections(context.borne.el)) return false;
    iniciarFio(context.borne);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(10); } catch (_) {}
    }
    return true;
}

function scheduleMobileWireHoldStart(state) {
    clearMobileWireHoldTimer();
    if (!state || pontosFioAtual.length > 0 || !state.context?.borne) return;
    mobileWireHoldTimer = window.setTimeout(() => {
        if (!mobileWireTouchState || mobileWireTouchState.identifier !== state.identifier) return;
        const freshContext = syncMobileWireTargetFromClient(state.clientX, state.clientY);
        mobileWireTouchState.context = freshContext;
        if (!beginMobileWireFromContext(freshContext)) return;
        mobileWireTouchState.segmentArmed = true;
        setAssistiveWireCursorActive(true);
    }, MOBILE_WIRE_TARGET_HOLD_MS);
}

function maybeRearmMobileWireHold(state) {
    if (!state || state.segmentArmed || pontosFioAtual.length > 0) return;
    const dx = state.clientX - state.holdAnchorX;
    const dy = state.clientY - state.holdAnchorY;
    if (Math.hypot(dx, dy) < MOBILE_WIRE_HOLD_REARM_DELTA_PX) return;
    state.holdAnchorX = state.clientX;
    state.holdAnchorY = state.clientY;
    scheduleMobileWireHoldStart(state);
}

function commitMobileWireTargetContext(context) {
    if (!context || !pontosFioAtual.length) return false;
    const on2D = is2DWorkspaceActive();
    const commitPoint = getMobileWireCommitPoint(context);
    const last = pontosFioAtual[pontosFioAtual.length - 1] || null;
    if (!commitPoint) return false;

    const sameAsLast = !!last && wirePointDistance(last, commitPoint) < 0.5;
    if (sameAsLast && pontosFioAtual.length === 1) {
        cancelarFio();
        return false;
    }
    if (sameAsLast) {
        renderPreviewFromCommittedPoints();
        return false;
    }

    if (context.borne) {
        if (on2D) {
            const startBorne = pontosFioAtual[0]?.borne || null;
            if (!startBorne) {
                cancelarFio();
                return false;
            }
            if (startBorne === context.borne.el) return false;
            if (!borneCanAcceptMoreConnections(startBorne)) return false;
            if (!borneCanAcceptMoreConnections(context.borne.el)) return false;
        }
        finalizarFio({ x: commitPoint.x, y: commitPoint.y, borne: context.borne.el });
        return true;
    }

    if (context.wirePoint && !on2D) {
        finalizarFio({
            x: commitPoint.x,
            y: commitPoint.y,
            borne: null,
            sourceWire: context.wirePoint.wire || null
        });
        return true;
    }

    adicionarPonto(context.x, context.y);
    renderPreviewFromCommittedPoints();
    return true;
}

// =====================================================
// BORNES
// =====================================================
function getClosestBorne(x, y, maxDist = 30) {
    const bornes = document.querySelectorAll('#bancada .borne');
    let closest = null;
    let minDist = maxDist;

    const br = document.getElementById('bancada').getBoundingClientRect();

    bornes.forEach(b => {
        const r = b.getBoundingClientRect();
        const bx = snap((r.left + r.width / 2 - br.left) / zoomLevel);
        const by = snap((r.top + r.height / 2 - br.top) / zoomLevel);
        const d = Math.hypot(x - bx, y - by);

        if (d < minDist) {
            minDist = d;
            closest = { el: b, x: bx, y: by };
        }
    });

    return closest;
}

function getDirectBorneFromTarget(target) {
    if (!target) return null;
    const borneEl = target.classList?.contains('borne') ? target : target.closest('.borne');
    if (!borneEl) return null;
    const center = getBorneCenterExact(borneEl);
    if (!center) return null;
    return {
        el: borneEl,
        x: center.x,
        y: center.y
    };
}

function findClosestBorneByPoint(x, y, maxDist = 30) {
    const bancada = document.getElementById('bancada');
    if (!bancada) return null;
    const bornes = bancada.querySelectorAll('.borne');
    const br = bancada.getBoundingClientRect();

    let closestEl = null;
    let minDist = maxDist;

    bornes.forEach(b => {
        const r = b.getBoundingClientRect();
        const bx = snap((r.left + r.width / 2 - br.left) / zoomLevel);
        const by = snap((r.top + r.height / 2 - br.top) / zoomLevel);
        const d = Math.hypot(x - bx, y - by);
        if (d < minDist) {
            minDist = d;
            closestEl = b;
        }
    });

    return closestEl;
}

function rebindWireEndpoints() {
    if (!Array.isArray(listaFios) || !listaFios.length) return;
    const on2D = is2DWorkspaceActive();

    const chooseEndpointBorne = (pt, currentBorne, wireObj) => {
        const current = currentBorne && currentBorne.isConnected ? currentBorne : null;
        const closest = findClosestBorneByPoint(pt.x, pt.y, 30);
        if (!current) {
            if (!on2D) return closest;
            if (!closest) return null;
            if (!borneCanAcceptMoreConnections(closest, { ignoreWire: wireObj })) return null;
            return closest;
        }

        const currentPos = getBorneCenterExact(current);
        if (!currentPos) return closest || null;

        const dCurrent = Math.hypot((pt.x || 0) - currentPos.x, (pt.y || 0) - currentPos.y);
        const keepRadius = 42;
        if (!closest) {
            return on2D ? current : (dCurrent <= keepRadius ? current : null);
        }

        const closestPos = getBorneCenterExact(closest);
        const dClosest = closestPos
            ? Math.hypot((pt.x || 0) - closestPos.x, (pt.y || 0) - closestPos.y)
            : Number.POSITIVE_INFINITY;

        // Histerese: evita trocar de borne entre vizinhos quando a ponta
        // ainda esta suficientemente proxima do borne originalmente ligado.
        if (dCurrent <= keepRadius && dCurrent <= (dClosest + 8)) {
            return current;
        }
        if (!on2D) return closest;
        if (!closest) return current;
        if (!borneCanAcceptMoreConnections(closest, { ignoreWire: wireObj })) {
            return current;
        }
        return closest;
    };

    listaFios.forEach(f => {
        if (!f || !Array.isArray(f.points) || f.points.length < 2) return;
        const first = f.points[0];
        const last = f.points[f.points.length - 1];
        f.origem = chooseEndpointBorne(first, f.origem, f);
        f.destino = chooseEndpointBorne(last, f.destino, f);
    });
    if (syncWireNumbersBySharedBornes()) {
        renderWireLabels();
    }
}

// =====================================================
// FIO Ã¢â‚¬â€ INÃƒÂCIO
// =====================================================
function iniciarFio(b) {
    // Ponto inicial precisa bater exatamente no borne
    pontosFioAtual = [{ x: snap(b.x), y: snap(b.y), borne: b.el }];
    criarPreview();
    if (typeof window.updateMobileQuickActionButtons === 'function') {
        window.updateMobileQuickActionButtons();
    }
}

function iniciarFioEmenda(x, y) {
    pontosFioAtual = [{ x: snap(x), y: snap(y), borne: null, sourceWire: null }];
    criarPreview();
    if (typeof window.updateMobileQuickActionButtons === 'function') {
        window.updateMobileQuickActionButtons();
    }
}

function iniciarFioEmendaComOrigem(x, y, wireObj) {
    pontosFioAtual = [{ x: snap(x), y: snap(y), borne: null, sourceWire: wireObj || null }];
    criarPreview();
    if (typeof window.updateMobileQuickActionButtons === 'function') {
        window.updateMobileQuickActionButtons();
    }
}

// =====================================================
// PREVIEW
// =====================================================
function criarPreview() {
    const svg = document.getElementById('wire-layer');
    if (previewLine) previewLine.remove();

    previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    previewLine.setAttribute('class', 'wire-preview');
    previewLine.setAttribute('stroke', corFioAtual);
    applyWireThickness(previewLine, getCurrentWireThickness());

    svg.appendChild(previewLine);
}

function atualizarPreview(x, y) {
    if (!previewLine || pontosFioAtual.length === 0) return;

    const last = pontosFioAtual[pontosFioAtual.length - 1];
    const dx = Math.abs(x - last.x);
    const dy = Math.abs(y - last.y);

    let nx = x;
    let ny = y;

    if (dx > dy) ny = last.y;
    else nx = last.x;

    const pts = [
        ...pontosFioAtual,
        { x: snap(nx), y: snap(ny) }
    ];

    previewLine.setAttribute(
        'points',
        pts.map(p => `${p.x},${p.y}`).join(' ')
    );
}

function getCurrentWirePreviewPoint() {
    if (mobileWireTouchState?.context) {
        const contextPoint = getMobileWireCommitPoint(mobileWireTouchState.context);
        if (contextPoint) return contextPoint;
    }
    const pointsAttr = String(previewLine?.getAttribute?.('points') || '').trim();
    if (!pointsAttr) return null;
    const rawPoint = pointsAttr.split(/\s+/).pop();
    if (!rawPoint) return null;
    const [rawX, rawY] = rawPoint.split(',');
    const x = parseFloat(rawX);
    const y = parseFloat(rawY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x: snap(x), y: snap(y), borne: null };
}

// =====================================================
// ADICIONAR PONTO INTERMEDIÃƒÂRIO
// =====================================================
function adicionarPonto(x, y) {
    const last = pontosFioAtual[pontosFioAtual.length - 1];
    const dx = Math.abs(x - last.x);
    const dy = Math.abs(y - last.y);

    let nx = x;
    let ny = y;

    if (dx > dy) ny = last.y;
    else nx = last.x;

    pontosFioAtual.push({
        x: snap(nx),
        y: snap(ny),
        borne: null
    });
}

function alignWireEndpointNeighborToBorne(points) {
    if (!is2DWorkspaceActive()) return points;
    if (!Array.isArray(points) || points.length < 2) return points;

    const alignNeighbor = (endpointIndex, neighborIndex) => {
        const endpoint = points[endpointIndex];
        const neighbor = points[neighborIndex];
        const borne = endpoint?.borne || null;
        if (!endpoint || !neighbor || !borne) return;
        if (getWireTerminalTypeForBorne(borne, 1) === 'ring') return;

        const outward = getBorneOutwardDirection(borne, endpoint);
        if (outward) {
            const nextNeighbor = {
                x: neighbor.x,
                y: neighbor.y
            };
            if (Math.abs(outward.y) >= Math.abs(outward.x)) {
                nextNeighbor.x = endpoint.x;
            } else {
                nextNeighbor.y = endpoint.y;
            }
            // Nao elimine o primeiro cotovelo escolhido pelo usuario. Se o
            // alinhamento encostar o vizinho no borne, a normalizacao seguinte
            // removeria esse ponto e criaria um segmento diagonal ate o proximo.
            if (wirePointDistance(endpoint, nextNeighbor) < 0.5) {
                return;
            }
            neighbor.x = nextNeighbor.x;
            neighbor.y = nextNeighbor.y;
            return;
        }

        const dx = Math.abs((neighbor.x || 0) - (endpoint.x || 0));
        const dy = Math.abs((neighbor.y || 0) - (endpoint.y || 0));
        const nextNeighbor = { x: neighbor.x, y: neighbor.y };
        if (dx >= dy) nextNeighbor.y = endpoint.y;
        else nextNeighbor.x = endpoint.x;
        if (wirePointDistance(endpoint, nextNeighbor) < 0.5) {
            return;
        }
        neighbor.x = nextNeighbor.x;
        neighbor.y = nextNeighbor.y;
    };

    alignNeighbor(0, 1);
    alignNeighbor(points.length - 1, points.length - 2);
    return points;
}

// =====================================================
// FINALIZAR FIO
// =====================================================
function finalizarFio(pontoFinal) {
    addOrthogonalCornerIfNeeded(pontoFinal.x, pontoFinal.y);

    const candidatos = [
        ...pontosFioAtual,
        {
            x: pontoFinal.x,
            y: pontoFinal.y,
            borne: pontoFinal.borne || null
        }
    ];
    const pontosFinalizados = normalizeWirePoints(candidatos);
    if (pontosFinalizados.length < 2) {
        cancelarFio();
        return;
    }
    alignWireEndpointNeighborToBorne(pontosFinalizados);
    const origemBorne = pontosFinalizados[0].borne || null;
    const destinoBorne = pontosFinalizados[pontosFinalizados.length - 1].borne || null;
    const pontosArredondados = roundWireCorners(
        pontosFinalizados.map(p => ({ x: p.x, y: p.y })),
        getWireCornerRadius()
    );
    if (!Array.isArray(pontosArredondados) || pontosArredondados.length < 2) {
        cancelarFio();
        return;
    }
    const inheritedNumber =
        pontosFioAtual[0]?.sourceWire?.number ||
        pontoFinal?.sourceWire?.number ||
        '';
    createWireFromPoints(pontosArredondados, {
        origem: origemBorne,
        destino: destinoBorne,
        number: inheritedNumber
    });

    cancelarFio();
}

function finishCurrentWireFromMobileShortcut() {
    if (!pontosFioAtual.length) return false;
    const previewPoint = getCurrentWirePreviewPoint();
    const lastPoint = pontosFioAtual[pontosFioAtual.length - 1] || null;
    if (!previewPoint || !lastPoint) {
        cancelarFio();
        return false;
    }
    if (wirePointDistance(lastPoint, previewPoint) < 0.5) {
        cancelarFio();
        return false;
    }
    finalizarFio(previewPoint);
    return true;
}

// =====================================================
// CANCELAR
// =====================================================
function cancelarFio() {
    clearMobileWireHoldTimer();
    pontosFioAtual = [];
    if (previewLine) previewLine.remove();
    previewLine = null;
    setAssistiveWireCursorActive(false);
    if (!mobileWireTouchState) hideMobileWireTarget();
    if (typeof window.updateMobileQuickActionButtons === 'function') {
        window.updateMobileQuickActionButtons();
    }
}

function handleMobileWireTouchStart(e) {
    if (!isMobileWireTargetModeActive()) return;
    if ((e.touches?.length || 0) !== 1) {
        clearMobileWireHoldTimer();
        mobileWireTouchState = null;
        hideMobileWireTarget();
        return;
    }

    const touch = e.changedTouches?.[0];
    if (!touch) return;

    const context = syncMobileWireTargetFromClient(touch.clientX, touch.clientY);
    mobileWireTouchState = {
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        holdAnchorX: touch.clientX,
        holdAnchorY: touch.clientY,
        context,
        segmentArmed: pontosFioAtual.length > 0
    };

    if (mobileWireTouchState.segmentArmed && pontosFioAtual.length > 0) {
        const previewPoint = getMobileWireCommitPoint(context);
        if (previewPoint) atualizarPreview(previewPoint.x, previewPoint.y);
        setAssistiveWireCursorActive(true);
    } else {
        scheduleMobileWireHoldStart(mobileWireTouchState);
    }

    e.preventDefault();
    e.stopPropagation();
}

function handleMobileWireTouchMove(e) {
    if (!mobileWireTouchState) return;
    if ((e.touches?.length || 0) > 1) {
        clearMobileWireHoldTimer();
        mobileWireTouchState = null;
        hideMobileWireTarget();
        return;
    }

    const touch =
        findTouchByIdentifier(e.touches, mobileWireTouchState.identifier) ||
        findTouchByIdentifier(e.changedTouches, mobileWireTouchState.identifier);
    if (!touch) return;

    mobileWireTouchState.clientX = touch.clientX;
    mobileWireTouchState.clientY = touch.clientY;
    mobileWireTouchState.context = syncMobileWireTargetFromClient(touch.clientX, touch.clientY);

    if (mobileWireTouchState.segmentArmed && pontosFioAtual.length > 0) {
        const previewPoint = getMobileWireCommitPoint(mobileWireTouchState.context);
        if (previewPoint) atualizarPreview(previewPoint.x, previewPoint.y);
        setAssistiveWireCursorActive(true);
    } else {
        maybeRearmMobileWireHold(mobileWireTouchState);
    }

    e.preventDefault();
    e.stopPropagation();
}

function handleMobileWireTouchEnd(e) {
    if (!mobileWireTouchState) return;
    const isCancel = e.type === 'touchcancel';
    const touch = findTouchByIdentifier(e.changedTouches, mobileWireTouchState.identifier);
    if (!touch && !isCancel) return;
    const previousContext = mobileWireTouchState.context;

    clearMobileWireHoldTimer();

    if (touch && !isCancel) {
        mobileWireTouchState.clientX = touch.clientX;
        mobileWireTouchState.clientY = touch.clientY;
        const currentContext = syncMobileWireTargetFromClient(touch.clientX, touch.clientY);
        mobileWireTouchState.context = currentContext;
        if (
            previousContext &&
            (previousContext.borne || previousContext.wirePoint) &&
            currentContext &&
            !currentContext.borne &&
            !currentContext.wirePoint
        ) {
            mobileWireTouchState.context = previousContext;
        }
    }

    if (!isCancel && mobileWireTouchState.segmentArmed && pontosFioAtual.length > 0) {
        commitMobileWireTargetContext(mobileWireTouchState.context);
    }

    mobileWireTouchState = null;
    hideMobileWireTarget();
    setAssistiveWireCursorActive(!!pontosFioAtual.length);

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
}

// =====================================================
// LISTENERS (COM CAMINHO MANUAL)
// =====================================================
document.getElementById('viewport').addEventListener('touchstart', handleMobileWireTouchStart, { passive: false, capture: true });
document.getElementById('viewport').addEventListener('touchmove', handleMobileWireTouchMove, { passive: false, capture: true });
document.getElementById('viewport').addEventListener('touchend', handleMobileWireTouchEnd, { passive: false, capture: true });
document.getElementById('viewport').addEventListener('touchcancel', handleMobileWireTouchEnd, { passive: false, capture: true });

document.getElementById('viewport').addEventListener('mousedown', e => {
    if (window.simulando) return;

    var fa = window.ferramentaAtiva;
    var on2D = is2DWorkspaceActive();

    if (fa === 'emenda') {
        const c = getLocalCoords(e);
        const candidate = getEmendaCandidate(c.x, c.y);
        if (candidate) {
            iniciarFioEmenda(candidate.x, candidate.y);
            e.preventDefault();
            e.stopPropagation();
        }
        return;
    }

    if (!isWireDrawingInteractionActive()) {
        setAssistiveWireCursorActive(false);
        return;
    }

    const assistiveSelectMode = fa === 'select' && isWireAssistEnabled();
    const c = getLocalCoords(e);
    const directBorne = getDirectBorneFromTarget(e.target);
    const assistBorne = assistiveSelectMode ? getAssistiveBorneByCoords(c.x, c.y, true) : null;
    const b = assistiveSelectMode
        ? (directBorne || assistBorne)
        : (directBorne || getClosestBorne(c.x, c.y));
    const w = getClosestWirePoint(c.x, c.y);

    if (pontosFioAtual.length === 0) {
        if (assistiveSelectMode) {
            if (!b) return;
            if (on2D && !borneCanAcceptMoreConnections(b.el)) return;
            iniciarFio(b);
            setAssistiveWireCursorActive(true);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (b) {
            if (on2D && !borneCanAcceptMoreConnections(b.el)) return;
            iniciarFio(b);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (w && !on2D) {
            iniciarFioEmendaComOrigem(w.x, w.y, w.wire || null);
            e.preventDefault();
            e.stopPropagation();
        }
        return;
    }

    if (b) {
        if (on2D) {
            const startBorne = pontosFioAtual[0]?.borne || null;
            if (!startBorne) {
                cancelarFio();
                return;
            }
            if (startBorne === b.el) return;
            if (!borneCanAcceptMoreConnections(startBorne)) return;
            if (!borneCanAcceptMoreConnections(b.el)) return;
        }
        finalizarFio({ x: snap(b.x), y: snap(b.y), borne: b.el });
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    if (w && !on2D) {
        finalizarFio({ x: w.x, y: w.y, borne: null, sourceWire: w.wire || null });
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    adicionarPonto(c.x, c.y);
    if (assistiveSelectMode) setAssistiveWireCursorActive(true);
    e.preventDefault();
    e.stopPropagation();
});

document.getElementById('viewport').addEventListener('mousemove', e => {
    const s = (window.simulando || (typeof (window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) !== 'undefined' ? (window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) : false));
    if (s) {
        hideEmendaSnap();
        setAssistiveWireCursorActive(false);
        clear2DBorneHover();
        return;
    }
    const fa = typeof window.ferramentaAtiva !== 'undefined' ? window.ferramentaAtiva : (typeof (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'undefined' ? (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) : '');
    if (fa === 'emenda') {
        if (is2DWorkspaceActive()) {
            hideEmendaSnap();
            return;
        }
        const c = getLocalCoords(e);
        const candidate = getEmendaCandidate(c.x, c.y);
        if (candidate) showEmendaSnapAtWorkspacePoint(candidate);
        else hideEmendaSnap();
    } else {
        const c = getLocalCoords(e);
        update2DBorneHoverByCoords(c.x, c.y);

        if (fa === 'select' && isWireAssistEnabled()) {
            if (pontosFioAtual.length === 0) {
                const hoverBorne = getAssistiveBorneByCoords(c.x, c.y, false);
                setAssistiveWireCursorActive(!!hoverBorne);
            } else {
                setAssistiveWireCursorActive(true);
            }
        } else {
            setAssistiveWireCursorActive(false);
        }

        if (pontosFioAtual.length > 0) {
            const w = is2DWorkspaceActive() ? null : getClosestWirePoint(c.x, c.y);
            if (w) atualizarPreview(w.x, w.y);
            else atualizarPreview(c.x, c.y);
        }
    }
});

document.getElementById('viewport').addEventListener('mouseleave', () => {
    hideEmendaSnap();
    setAssistiveWireCursorActive(false);
    clear2DBorneHover();
});

document.getElementById('viewport').addEventListener('pointerdown', e => {
    const s = (window.simulando || (typeof (window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) !== 'undefined' ? (window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) : false));
    if (s) return;
    if (isAssistiveWireDrawingInProgress()) return;

    const junction = e.target?.closest?.('circle.wire-junction');
    if (junction) {
        const fa = typeof window.ferramentaAtiva !== 'undefined' ? window.ferramentaAtiva : (typeof (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'undefined' ? (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) : '');
        if (fa === 'select') {
            beginJunctionDrag(e, junction);
        }
        return;
    }

    const poly = e.target?.closest?.('polyline.user-wire');
    if (!poly) return;

    const fa = typeof window.ferramentaAtiva !== 'undefined' ? window.ferramentaAtiva : (typeof (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'undefined' ? (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) : '');
    if (fa === 'borracha') {
        e.preventDefault();
        e.stopPropagation();
        removeWireByElement(poly, { skipRender: true });
        requestRenderWireJunctions();
        return;
    }

    if (fa === 'select') {
        beginWireDrag(e, poly);
    }
}, true);

document.getElementById('viewport').addEventListener('dblclick', e => {
    const s = (window.simulando || (typeof (window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) !== 'undefined' ? (window.simulando || (typeof simulando !== 'undefined' ? simulando : false)) : false));
    const fa = typeof window.ferramentaAtiva !== 'undefined' ? window.ferramentaAtiva : (typeof (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) !== 'undefined' ? (window.ferramentaAtiva || (typeof ferramentaAtiva !== 'undefined' ? ferramentaAtiva : '')) : '');
    if (s || fa !== 'select') return;

    const poly = e.target?.closest?.('polyline.user-wire');
    if (!poly) return;
    const wireId = poly?.dataset?.id;
    const wireObj = wireId ? (listaFios.find(f => f?.id === wireId) || null) : (listaFios.find(f => f?.element === poly) || null);
    if (!wireObj) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof selectWire === 'function') selectWire(poly, false);
    openWireEditDialog(wireObj);
}, true);
window.addEventListener('pointermove', handleJunctionDragMove, true);
window.addEventListener('pointerup', handleJunctionDragEnd, true);
window.addEventListener('pointercancel', handleJunctionDragEnd, true);
window.addEventListener('pointermove', handleWireDragMove, true);
window.addEventListener('pointerup', handleWireDragEnd, true);
window.addEventListener('pointercancel', handleWireDragEnd, true);
window.addEventListener('pointermove', handleWireLabelDragMove, true);
window.addEventListener('pointerup', handleWireLabelDragEnd, true);
window.addEventListener('pointercancel', handleWireLabelDragEnd, true);

function loadWires(wiresData) {
    if (!Array.isArray(wiresData)) return;
    wiresData.forEach(data => {
        if (!data || !Array.isArray(data.points)) return;
        createWireFromPoints(data.points, {
            origem: data.origem,
            destino: data.destino,
            color: data.color,
            width: data.width,
            number: data.number
        });
    });
    if (typeof window.construirNosEletricos === 'function') {
        window.construirNosEletricos();
    }
    requestRenderWireJunctions();
}

window.loadWires = loadWires;
window.syncAutoWireButton = syncAutoWireButton;
window.syncWireAssistButton = syncWireAssistButton;
window.isWireDrawingInteractionActive = isWireDrawingInteractionActive;
window.is2DWorkspaceActive = is2DWorkspaceActive;
window.cancelarFio = cancelarFio;
window.toggleWireAssistEnabled = toggleWireAssistEnabled;
window.setWireAssistEnabled = setWireAssistEnabled;
window.isWireAssistEnabled = isWireAssistEnabled;

syncAutoWireButton();
syncWireAssistButton();

