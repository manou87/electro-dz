// =====================================================
// CADe Web â€” ENGINE NOVA (NÃ“S ELÃ‰TRICOS REAIS)
// CORREÃ‡ÃƒO DEFINITIVA DE CURTO-CIRCUITO
// =====================================================

const ENGINE_MODE = 'new'; // 'old' ou 'new'
const DEBUG_NODES = false;

const POT = {
    FASE: 'FASE',
    NEUTRO: 'NEUTRO'
};
const POT_PHASE_PREFIX = 'FASE:';
const POT_TRACE_PHASE_PREFIX = 'TRACE:';
const BORNE_ATTACH_TOL = 4;
const NODE_POINT_MERGE_TOL = 2;
const BORNE_ATTACH_TOL_2D = 2;
const NODE_POINT_MERGE_TOL_2D = 1;
const NODE_BUCKET_SIZE = 4;
const NODE_GEOMETRY_BUCKET_SIZE = 64;
const NODE_GEOMETRY_MAX_SEGMENT_BUCKETS = 4096;
const SHORT_VISUAL_HOLD_MS = 4000;
const SHORT_CONFIRM_MS = 1000;

function getBorneAttachTolerance() {
    return (typeof window.is2DWorkspaceActive === 'function' && window.is2DWorkspaceActive())
        ? BORNE_ATTACH_TOL_2D
        : BORNE_ATTACH_TOL;
}

function getNodePointMergeTolerance() {
    return (typeof window.is2DWorkspaceActive === 'function' && window.is2DWorkspaceActive())
        ? NODE_POINT_MERGE_TOL_2D
        : NODE_POINT_MERGE_TOL;
}

function getWorkbenchRelativeBorneCenter(b) {
    const comp = b?.closest?.('.component');
    if (!b || !comp) return null;
    const compLeft = parseFloat(comp.style.left) || comp.offsetLeft || 0;
    const compTop = parseFloat(comp.style.top) || comp.offsetTop || 0;
    const cs = getComputedStyle(b);
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
    return {
        x: compLeft + left + tx + (width / 2),
        y: compTop + top + ty + (height / 2)
    };
}

function getShortInfoKey(shortInfo) {
    if (!shortInfo) return '';
    const labels = Array.isArray(shortInfo.labels)
        ? shortInfo.labels.map(label => String(label)).join('x')
        : '';
    const point = shortInfo.point && Number.isFinite(shortInfo.point.x) && Number.isFinite(shortInfo.point.y)
        ? `${Number(shortInfo.point.x.toFixed(1))},${Number(shortInfo.point.y.toFixed(1))}`
        : '';
    return `${String(shortInfo.type || '')}|${labels}|${point}`;
}

function shouldUseContactorDeenergizeHold() {
    return typeof window.is2DWorkspaceActive === 'function'
        ? window.is2DWorkspaceActive()
        : (typeof activeWorkspaceMode !== 'undefined' && activeWorkspaceMode === '2d');
}

// Memoria do ultimo estado resolvido das TAGs para suportar selo entre passos
// consecutivos sem transformar bobina em memoria mecanica permanente.
let lastResolvedTagStatesByTag = new Map();
// Memoria de estado das bobinas temporizadas por TAG.
let lastCoilStatesByTag = new Map();
// Pequeno atraso no desligamento da bobina temporizada para a comutacao
// terminar dentro do mesmo ciclo de simulacao sem derrubar o circuito.
const TEMP_COIL_DEENERGIZE_HOLD_MS = 250;
// Contatores nao podem ser retidos entre passos: em partidas estrela-triangulo
// isso sobrepoe estrela e triangulo e derrota o break-before-make do temporizador.
const CONTACTOR_COIL_DEENERGIZE_HOLD_MS = 0;
let contactorCoilHoldUntilByTag = new Map();
let shortVisualHoldUntilMs = 0;
let shortVisualMessage = '';
let shortVisualWireSet = new Set();
let shortVisualSegmentMap = new Map();
let shortVisualPoint = null;
let shortPendingSinceMs = 0;
let shortPendingKey = '';

function getTempCoilSeconds(comp) {
    const timerLabel = comp?.querySelector?.('.timer-label');
    const raw = timerLabel?.dataset?.timerSeconds || '3';
    const parsed = parseFloat(String(raw).replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.round(parsed)) : 3;
}

function updateTempCoilLabel(comp, seconds) {
    const timerLabel = comp?.querySelector?.('.timer-label');
    if (!timerLabel) return;
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
    timerLabel.innerText = `${safe}s`;
}

function getTempCoilOutput(comp, energized, nowMs) {
    const delaySec = getTempCoilSeconds(comp);
    if (!energized) {
        const holdUntil = Number(comp?._tempDropHoldUntilMs || 0);
        if (holdUntil > nowMs) {
            const heldRemaining = Number.isFinite(comp?._tempHeldRemainingSec)
                ? comp._tempHeldRemainingSec
                : delaySec;
            updateTempCoilLabel(comp, heldRemaining);
            comp._tempDone = !!comp?._tempHeldOutput;
            return !!comp?._tempHeldOutput;
        }

        comp._tempDropHoldUntilMs = 0;
        comp._tempHeldOutput = false;
        comp._tempHeldRemainingSec = delaySec;
        comp._tempStartMs = null;
        comp._tempDone = false;
        updateTempCoilLabel(comp, delaySec);
        return false;
    }

    if (!comp._tempStartMs) comp._tempStartMs = nowMs;
    const elapsedSec = Math.max(0, (nowMs - comp._tempStartMs) / 1000);
    const elapsedWhole = Math.floor(elapsedSec);
    const remaining = Math.max(0, delaySec - elapsedWhole);
    updateTempCoilLabel(comp, remaining);
    comp._tempDropHoldUntilMs = nowMs + TEMP_COIL_DEENERGIZE_HOLD_MS;
    comp._tempHeldRemainingSec = remaining;

    if (remaining <= 0) {
        comp._tempDone = true;
        comp._tempHeldOutput = true;
        return true;
    }

    comp._tempDone = false;
    comp._tempHeldOutput = false;
    return false;
}

function resetEngineNewState() {
    lastResolvedTagStatesByTag = new Map();
    lastCoilStatesByTag = new Map();
    contactorCoilHoldUntilByTag = new Map();
    shortVisualHoldUntilMs = 0;
    shortVisualMessage = '';
    shortVisualWireSet = new Set();
    shortVisualSegmentMap = new Map();
    shortVisualPoint = null;
    shortPendingSinceMs = 0;
    shortPendingKey = '';
    hideCurto();
    clearShortPathOverlays();
    hideReleCouplingOverlay();
    clearReleCouplingBadges();
    document.querySelectorAll('.component[data-lib="real_rele_termico"]').forEach(comp => {
        comp.removeAttribute('data-coupled');
        comp.removeAttribute('data-coupling-label');
    });
    document.querySelectorAll('.component[data-lib="real_contator_forca"]').forEach(comp => {
        comp.removeAttribute('data-rele-coupled');
    });
    document.querySelectorAll('.component[data-lib="real_contator"]').forEach(comp => {
        comp._realContatorOpenUntilMs = 0;
    });
    const svg = document.getElementById('wire-layer');
    if (svg) svg.querySelectorAll('.debug-node').forEach(n => n.remove());
    document.querySelectorAll('.component[data-lib="iec_bobina_temp"]').forEach(comp => {
        comp._tempStartMs = null;
        comp._tempDone = false;
        comp._tempDropHoldUntilMs = 0;
        comp._tempHeldOutput = false;
        comp._tempHeldRemainingSec = getTempCoilSeconds(comp);
        updateTempCoilLabel(comp, getTempCoilSeconds(comp));
    });
    document.querySelectorAll('.component[data-lib="real_temporizador"]').forEach(comp => {
        comp._rtStartMs = null;
        comp._rtDone = false;
        comp._rtDropHoldUntil = 0;
        comp._rtHeldDone = false;
        comp._rtHeldResult = null;
        const timerLabel = comp.querySelector('.timer-label');
        const raw = timerLabel?.dataset?.timerSeconds || '3';
        const parsed = parseFloat(String(raw).replace(',', '.'));
        const delaySec = Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.round(parsed)) : 3;
        comp._rtHeldLabel = `${delaySec}s`;
        if (timerLabel) timerLabel.innerText = `${delaySec}s`;
    });
}

// =====================================================
// OVERLAY DE ALERTA
// =====================================================
let curtoOverlay = null;
let releCouplingOverlay = null;
let releCouplingBadges = [];

function showCurto(message = '\u26A0\uFE0F CURTO-CIRCUITO DETECTADO') {
    const text = String(message || '').trim() || '\u26A0\uFE0F CURTO-CIRCUITO DETECTADO';
    if (!curtoOverlay) {
        curtoOverlay = document.createElement('div');
        Object.assign(curtoOverlay.style, {
            position: 'fixed',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(192,57,43,0.95)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            zIndex: 9999,
            animation: 'piscaCurto 1s infinite'
        });

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes piscaCurto {
                0% { opacity: 1; }
                50% { opacity: 0.6; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(curtoOverlay);
    }
    curtoOverlay.innerText = text;
}

function hideCurto() {
    if (curtoOverlay) {
        curtoOverlay.remove();
        curtoOverlay = null;
    }
}

function clearShortPathOverlays() {
    const topSvg = document.getElementById('wire-top-layer');
    if (!topSvg) return;
    topSvg.querySelectorAll('.wire-short-path-overlay, .wire-short-point-overlay').forEach(node => node.remove());
}
function renderShortPointOverlay(point) {
    const topSvg = document.getElementById('wire-top-layer');
    if (!topSvg || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', 'wire-short-point-overlay');
    group.setAttribute('pointer-events', 'none');
    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('cx', String(point.x));
    ring.setAttribute('cy', String(point.y));
    ring.setAttribute('r', '9');
    ring.setAttribute('fill', 'rgba(255,0,255,0.12)');
    ring.setAttribute('stroke', '#ff00ff');
    ring.setAttribute('stroke-width', '2');
    group.appendChild(ring);
    const cross1 = document.createElementNS(ns, 'line');
    cross1.setAttribute('x1', String(point.x - 6));
    cross1.setAttribute('y1', String(point.y - 6));
    cross1.setAttribute('x2', String(point.x + 6));
    cross1.setAttribute('y2', String(point.y + 6));
    cross1.setAttribute('stroke', '#ff00ff');
    cross1.setAttribute('stroke-width', '2');
    cross1.setAttribute('stroke-linecap', 'round');
    group.appendChild(cross1);
    const cross2 = document.createElementNS(ns, 'line');
    cross2.setAttribute('x1', String(point.x - 6));
    cross2.setAttribute('y1', String(point.y + 6));
    cross2.setAttribute('x2', String(point.x + 6));
    cross2.setAttribute('y2', String(point.y - 6));
    cross2.setAttribute('stroke', '#ff00ff');
    cross2.setAttribute('stroke-width', '2');
    cross2.setAttribute('stroke-linecap', 'round');
    group.appendChild(cross2);
    topSvg.appendChild(group);
}
function renderShortPathOverlays(segmentMap) {
    const topSvg = document.getElementById('wire-top-layer');
    clearShortPathOverlays();
    if (!topSvg) return;
    if (!(segmentMap instanceof Map) || !segmentMap.size) return;

    const ns = 'http://www.w3.org/2000/svg';
    segmentMap.forEach((segments, wireObj) => {
        if (!Array.isArray(segments) || !segments.length) return;
        const width = Number.isFinite(wireObj?.width) && wireObj.width > 0 ? wireObj.width : 6;
        segments.forEach(points => {
            if (!Array.isArray(points) || points.length < 2) return;
            const poly = document.createElementNS(ns, 'polyline');
            poly.setAttribute('class', 'wire-short-path-overlay');
            poly.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
            poly.setAttribute('fill', 'none');
            poly.setAttribute('stroke', '#ff00ff');
            poly.setAttribute('stroke-linecap', 'round');
            poly.setAttribute('stroke-linejoin', 'round');
            poly.setAttribute('pointer-events', 'none');
            poly.style.strokeWidth = `${width}px`;
            topSvg.appendChild(poly);
        });
    });
}

function hideReleCouplingOverlay() {
    if (releCouplingOverlay) {
        releCouplingOverlay.remove();
        releCouplingOverlay = null;
    }
}

function clearReleCouplingBadges() {
    releCouplingBadges.forEach(node => {
        try { node?.remove?.(); } catch (_) {}
    });
    releCouplingBadges = [];
}

function renderReleCouplingBadges(reles = []) {
    clearReleCouplingBadges();
    const hintsVisible = document.body.classList.contains('simulation-start-hints');
    if (!simulando || !hintsVisible || !Array.isArray(reles) || !reles.length) return;
    reles.forEach(rele => {
        if (!rele?.isConnected || !rele?.dataset?.coupled) return;
        const rect = rele.getBoundingClientRect();
        const badge = document.createElement('div');
        badge.className = 'rele-coupling-badge';
        badge.dataset.state = String(rele.dataset.coupled);
        badge.textContent = String(rele.dataset.couplingLabel || '').trim();
        badge.style.left = `${rect.left + (rect.width / 2)}px`;
        badge.style.top = `${rect.top - 10}px`;
        document.body.appendChild(badge);
        releCouplingBadges.push(badge);
    });
}

function showReleCouplingOverlay(message) {
    const text = String(message || '').trim();
    if (!text) {
        hideReleCouplingOverlay();
        return;
    }
    if (!releCouplingOverlay) {
        releCouplingOverlay = document.createElement('div');
        Object.assign(releCouplingOverlay.style, {
            position: 'fixed',
            top: '104px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(176,58,46,0.95)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '12px',
            zIndex: 9998
        });
        document.body.appendChild(releCouplingOverlay);
    }
    releCouplingOverlay.textContent = text;
}

window.showCurto = showCurto;
window.hideCurto = hideCurto;
window.resetEngineNewState = resetEngineNewState;

// =====================================================
// NÃ“ ELÃ‰TRICO
// =====================================================
class NodeEletrico {
    constructor(id) {
        this.id = id;
        this.bornes = [];
        this.potenciais = new Set(); // <<< CORREÃ‡ÃƒO
        this.erro = null;
        this.points = [];
        this._pointKeys = [];
        this._pointRefs = [];
    }
    addBorne(b) {
        if (!this.bornes.includes(b)) {
            this.bornes.push(b);
            b._node = this;
        }
    }
}

// =====================================================
// CONSTRUIR NÃ“S
// =====================================================
function construirNosEletricos() {
    window.construirNosEletricos = construirNosEletricos;

    const nodes = [];
    let id = 0;
    const borneToNode = new Map();
    const pointToNode = new Map();
    const pointBuckets = new Map();

    // Indice espacial para evitar percorrer todos os segmentos a cada ponta e borne.
    const buildGeometryIndex = (points, segments, padding = 0) => {
        const indexedPoints = new Map();
        const indexedSegments = new Map();
        const wideSegments = [];
        const cellKey = (bx, by) => `${bx}:${by}`;
        const addToBucket = (map, key, value) => {
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(value);
        };

        (points || []).forEach(point => {
            if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return;
            const bx = Math.floor(point.x / NODE_GEOMETRY_BUCKET_SIZE);
            const by = Math.floor(point.y / NODE_GEOMETRY_BUCKET_SIZE);
            addToBucket(indexedPoints, cellKey(bx, by), point);
        });

        (segments || []).forEach(segment => {
            if (!segment?.a || !segment?.b) return;
            const minBx = Math.floor((Math.min(segment.a.x, segment.b.x) - padding) / NODE_GEOMETRY_BUCKET_SIZE);
            const maxBx = Math.floor((Math.max(segment.a.x, segment.b.x) + padding) / NODE_GEOMETRY_BUCKET_SIZE);
            const minBy = Math.floor((Math.min(segment.a.y, segment.b.y) - padding) / NODE_GEOMETRY_BUCKET_SIZE);
            const maxBy = Math.floor((Math.max(segment.a.y, segment.b.y) + padding) / NODE_GEOMETRY_BUCKET_SIZE);
            const bucketCount = (maxBx - minBx + 1) * (maxBy - minBy + 1);
            if (bucketCount > NODE_GEOMETRY_MAX_SEGMENT_BUCKETS) {
                wideSegments.push(segment);
                return;
            }
            for (let bx = minBx; bx <= maxBx; bx++) {
                for (let by = minBy; by <= maxBy; by++) {
                    addToBucket(indexedSegments, cellKey(bx, by), segment);
                }
            }
        });

        const query = (pos, radius = 0) => {
            const safeRadius = Math.max(0, Number(radius) || 0);
            const minBx = Math.floor((pos.x - safeRadius) / NODE_GEOMETRY_BUCKET_SIZE);
            const maxBx = Math.floor((pos.x + safeRadius) / NODE_GEOMETRY_BUCKET_SIZE);
            const minBy = Math.floor((pos.y - safeRadius) / NODE_GEOMETRY_BUCKET_SIZE);
            const maxBy = Math.floor((pos.y + safeRadius) / NODE_GEOMETRY_BUCKET_SIZE);
            const foundPoints = new Set();
            const foundSegments = new Set(wideSegments);
            for (let bx = minBx; bx <= maxBx; bx++) {
                for (let by = minBy; by <= maxBy; by++) {
                    const key = cellKey(bx, by);
                    (indexedPoints.get(key) || []).forEach(point => foundPoints.add(point));
                    (indexedSegments.get(key) || []).forEach(segment => foundSegments.add(segment));
                }
            }
            return { points: foundPoints, segments: foundSegments };
        };

        return { query };
    };

    const bucketKey = (x, y) => {
        const bx = Math.floor(x / NODE_BUCKET_SIZE);
        const by = Math.floor(y / NODE_BUCKET_SIZE);
        return `${bx}:${by}`;
    };

    const indexNodePoint = (node, pt) => {
        const key = bucketKey(pt.x, pt.y);
        if (!pointBuckets.has(key)) pointBuckets.set(key, []);
        const ref = { x: pt.x, y: pt.y, node };
        pointBuckets.get(key).push(ref);
        node._pointRefs.push(ref);
    };

    const resolveNode = (node) => {
        let cur = node || null;
        const seen = new Set();
        while (cur && cur._mergedInto && !seen.has(cur)) {
            seen.add(cur);
            cur = cur._mergedInto;
        }
        return cur || null;
    };

    const isAliveNode = (node) => {
        const root = resolveNode(node);
        return !!root && nodes.includes(root);
    };

    const findNearNodeByPoint = (x, y, tol = getNodePointMergeTolerance()) => {
        const bx = Math.floor(x / NODE_BUCKET_SIZE);
        const by = Math.floor(y / NODE_BUCKET_SIZE);
        let closest = null;
        let minDist = tol;
        for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
                const key = `${bx + ox}:${by + oy}`;
                const bucket = pointBuckets.get(key);
                if (!bucket?.length) continue;
                bucket.forEach(ref => {
                    const refNode = resolveNode(ref.node);
                    if (!isAliveNode(refNode)) return;
                    const d = Math.hypot(x - ref.x, y - ref.y);
                    if (d <= minDist) {
                        minDist = d;
                        closest = refNode;
                    }
                });
            }
        }
        return closest;
    };

    const getNodeForPoint = (pt, tol = getNodePointMergeTolerance()) => {
        if (!pt) return null;
        const directRaw = pointToNode.get(`${pt.x},${pt.y}`);
        const direct = resolveNode(directRaw);
        if (direct && isAliveNode(direct)) return direct;
        return findNearNodeByPoint(pt.x, pt.y, tol);
    };

    listaFios.forEach(f => {
        f._node = null;
    });

    const mergeNodes = (aRaw, bRaw) => {
        const a = resolveNode(aRaw);
        const b = resolveNode(bRaw);
        if (!a || !b || a === b) return false;
        if (!nodes.includes(a) || !nodes.includes(b)) return false;
        // move bornes from b to a
        b.bornes.forEach(br => a.addBorne(br));
        b.points.forEach(pt => a.points.push(pt));
        b._pointRefs.forEach(ref => {
            ref.node = a;
            a._pointRefs.push(ref);
        });
        b._pointKeys.forEach(k => {
            pointToNode.set(k, a);
            a._pointKeys.push(k);
        });
        // remove b from list
        const idx = nodes.indexOf(b);
        if (idx >= 0) nodes.splice(idx, 1);
        b._mergedInto = a;
        b.bornes = [];
        b.points = [];
        b._pointRefs = [];
        b._pointKeys = [];
        return true;
    };

    listaFios.forEach(f => {
        if (!f.points || f.points.length === 0) return;
        let n = null;

        f.points.forEach(pt => {
            const key = `${pt.x},${pt.y}`;
            const directExisting = resolveNode(pointToNode.get(key));
            const existing = (directExisting && isAliveNode(directExisting))
                ? directExisting
                : findNearNodeByPoint(pt.x, pt.y);
            if (!n && existing) n = existing;
            if (!n && !existing) {
                n = new NodeEletrico(`NF${id++}`);
                nodes.push(n);
            }

            if (existing && n && existing !== n) {
                const didMerge = mergeNodes(n, existing);
                if (didMerge) {
                    n = resolveNode(n) || resolveNode(existing) || n;
                }
            }

            pointToNode.set(key, n);

            if (!existing) {
                n.points.push({ x: pt.x, y: pt.y });
                n._pointKeys.push(key);
                indexNodePoint(n, pt);
            }
        });

        if (!n) return;
        if (f.origem) {
            n.addBorne(f.origem);
            borneToNode.set(f.origem, n);
        }
        if (f.destino) {
            n.addBorne(f.destino);
            borneToNode.set(f.destino, n);
        }
    });

    // Emenda em "T": ponta de um fio no meio de segmento de outro fio.
    // As unioes sao transitivas; uma passagem por todas as relacoes basta.
    const mergeSegments = [];
    listaFios.forEach(wire => {
        if (!Array.isArray(wire?.points) || wire.points.length < 2) return;
        for (let i = 0; i < wire.points.length - 1; i++) {
            mergeSegments.push({ a: wire.points[i], b: wire.points[i + 1], wire });
        }
    });
    const mergeGeometryIndex = buildGeometryIndex([], mergeSegments, 1.2);
    listaFios.forEach(wire => {
        if (!Array.isArray(wire?.points) || wire.points.length < 2) return;
        const endpoints = [wire.points[0], wire.points[wire.points.length - 1]];
        endpoints.forEach(ep => {
            const nodeI = getNodeForPoint(ep);
            if (!nodeI) return;
            const nearby = mergeGeometryIndex.query(ep, 1.2);
            nearby.segments.forEach(segment => {
                if (segment.wire === wire) return;
                const { a, b } = segment;
                const isSegmentEndpoint =
                    (Math.abs(ep.x - a.x) < 0.5 && Math.abs(ep.y - a.y) < 0.5) ||
                    (Math.abs(ep.x - b.x) < 0.5 && Math.abs(ep.y - b.y) < 0.5);
                if (isSegmentEndpoint || !pointOnSegment(ep, a, b)) return;
                const nodeJ = getNodeForPoint(a) || getNodeForPoint(b);
                if (nodeJ) mergeNodes(nodeI, nodeJ);
            });
        });
    });

    // Vincula cada fio ao no eletrico do seu primeiro ponto.
    // Isso cobre fios sem borne nas pontas (ex.: emenda para emenda).
    listaFios.forEach(f => {
        if (!f.points || !f.points.length) return;
        const p0 = f.points[0];
        const n = getNodeForPoint(p0);
        if (n) f._node = n;
    });

    const allPoints = [];
    nodes.forEach(n => {
        n.points.forEach(pt => allPoints.push({ ...pt, node: n }));
    });

    const allSegments = [];
    listaFios.forEach(f => {
        if (!f.points || f.points.length < 2) return;
        const n = getNodeForPoint(f.points[0]);
        if (!n) return;
        for (let i = 0; i < f.points.length - 1; i++) {
            allSegments.push({
                a: f.points[i],
                b: f.points[i + 1],
                node: n
            });
        }
    });

    const attachmentGeometryIndex = buildGeometryIndex(
        allPoints,
        allSegments,
        getBorneAttachTolerance()
    );

    const snapBorne = (b) => getWorkbenchRelativeBorneCenter(b);

    const simulationBornes = (typeof window.getSimulationActiveComponents === 'function')
        ? window.getSimulationActiveComponents().flatMap(comp => Array.from(comp.querySelectorAll('.borne') || []))
        : Array.from(document.querySelectorAll('.borne'));

    simulationBornes.forEach(b => {
        if (borneToNode.has(b)) return;
        const pos = snapBorne(b);
        if (!pos) return;
        let closest = null;
        let min = getBorneAttachTolerance();
        const nearby = attachmentGeometryIndex.query(pos, min);
        nearby.points.forEach(pt => {
            const d = Math.hypot(pos.x - pt.x, pos.y - pt.y);
            if (d < min) {
                min = d;
                closest = resolveNode(pt.node);
            }
        });

        nearby.segments.forEach(seg => {
            const d = distancePointToSegment(pos, seg.a, seg.b);
            if (d < min) {
                min = d;
                closest = resolveNode(seg.node);
            }
        });

        if (closest) {
            closest.addBorne(b);
            borneToNode.set(b, closest);
        } else {
            const n = new NodeEletrico(`NB${id++}`);
            n.addBorne(b);
            nodes.push(n);
            borneToNode.set(b, n);
        }
    });

    const normalizeCableContinuationTag = (value) => String(value || '').trim().toUpperCase();
    const getCableContinuationRole = (comp) => {
        const explicit = String(comp?.dataset?.cableSegmentRole || '').trim().toLowerCase();
        if (explicit === 'in' || explicit === 'out') return explicit;
        const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
        if (lib === 'iec_segmento_cabo_in') return 'in';
        if (lib === 'iec_segmento_cabo_out') return 'out';
        return '';
    };
    const isCableContinuationComponent = (comp) => {
        const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
        return lib === 'iec_segmento_cabo_in' || lib === 'iec_segmento_cabo_out';
    };
    const getCableContinuationBorne = (comp, role) => {
        if (!comp || !role) return null;
        const pin = role === 'in' ? 'IN' : 'OUT';
        return comp.querySelector(`.borne[data-pino="${pin}"]`) || comp.querySelector('.borne');
    };
    const mergeCableContinuationPairs = () => {
        const activeComponents = (typeof window.getSimulationActiveComponents === 'function')
            ? window.getSimulationActiveComponents()
            : Array.from(document.querySelectorAll('.component'));
        const groups = new Map();
        activeComponents.forEach(comp => {
            if (!isCableContinuationComponent(comp)) return;
            const role = getCableContinuationRole(comp);
            if (role !== 'in' && role !== 'out') return;
            const def = BIBLIOTECA[comp.dataset.lib] || {};
            const tag = normalizeCableContinuationTag(comp.dataset.tag || def.tagDefault);
            if (!tag) return;
            const borne = getCableContinuationBorne(comp, role);
            if (!borne?._node) return;
            if (!groups.has(tag)) groups.set(tag, { in: [], out: [] });
            groups.get(tag)[role].push(borne);
        });

        groups.forEach(group => {
            if (!group.in.length || !group.out.length) return;
            const bornes = [...group.out, ...group.in];
            let baseNode = resolveNode(bornes[0]?._node);
            if (!baseNode) return;
            bornes.slice(1).forEach(borne => {
                const nextNode = resolveNode(borne?._node);
                if (!nextNode) return;
                if (mergeNodes(baseNode, nextNode)) {
                    baseNode = resolveNode(baseNode) || resolveNode(nextNode) || baseNode;
                }
            });
        });
    };

    mergeCableContinuationPairs();

    // O Smart Switch possui os dois bornes N ligados ao mesmo barramento interno.
    // A uniao precisa ocorrer na topologia, antes da propagacao de potenciais.
    const mergeSmartSwitchNeutralBus = () => {
        document.querySelectorAll('.component[data-lib="real_wifi_smart_switch"]').forEach(comp => {
            const n1 = comp.querySelector('.borne[data-pino="N1"]');
            const n2 = comp.querySelector('.borne[data-pino="N2"]');
            if (n1?._node && n2?._node) mergeNodes(n1._node, n2._node);
        });
    };

    mergeSmartSwitchNeutralBus();
    return nodes;
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

function isCoilElectricallyEnergized(nodeA1, nodeA2) {
    if (!nodeA1 || !nodeA2) return false;
    const a1F = nodeA1.potenciais.has(POT.FASE);
    const a1N = nodeA1.potenciais.has(POT.NEUTRO);
    const a2F = nodeA2.potenciais.has(POT.FASE);
    const a2N = nodeA2.potenciais.has(POT.NEUTRO);
    const faseNeutro = (a1F && a2N) || (a1N && a2F);
    if (faseNeutro) return true;

    const getPhaseIds = (node) => {
        const ids = new Set();
        node?.potenciais?.forEach?.(p => {
            if (typeof p === 'string' && p.startsWith(POT_PHASE_PREFIX)) {
                ids.add(p.slice(POT_PHASE_PREFIX.length));
            }
        });
        return ids;
    };

    const a1Ids = getPhaseIds(nodeA1);
    const a2Ids = getPhaseIds(nodeA2);
    if (!a1Ids.size || !a2Ids.size) return false;

    for (const id of a1Ids) {
        if (a2Ids.has(id)) return false;
    }
    return true;
}

function renderDebugNodes(nodes) {
    if (!DEBUG_NODES) return;
    const svg = document.getElementById('wire-layer');
    if (!svg) return;

    svg.querySelectorAll('.debug-node').forEach(n => n.remove());

    const bancadaRect = document.getElementById('bancada').getBoundingClientRect();
    const getBornePos = (b) => {
        const r = b.getBoundingClientRect();
        return {
            x: (r.left + r.width / 2 - bancadaRect.left) / zoomLevel,
            y: (r.top + r.height / 2 - bancadaRect.top) / zoomLevel
        };
    };

    nodes.forEach(n => {
        let cor = '#999';
        if (n.erro === 'CURTO') cor = '#ff00ff';
        else if (n.potenciais.has(POT.FASE)) cor = '#ff0000';
        else if (n.potenciais.has(POT.NEUTRO)) cor = '#0066ff';

        const pts = n.points.length
            ? n.points
            : n.bornes.map(getBornePos);

        pts.forEach(p => {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('class', 'debug-node');
            c.setAttribute('cx', p.x);
            c.setAttribute('cy', p.y);
            c.setAttribute('r', '3');
            c.setAttribute('fill', cor);
            svg.appendChild(c);
        });
    });
}

function getNearestBornesToWorkbenchPoint(point, limit = 6, maxDist = 90) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return [];
    const bancada = document.getElementById('bancada');
    if (!bancada) return [];
    const bancadaRect = bancada.getBoundingClientRect();
    const simulationComponents = (typeof window.getSimulationActiveComponents === 'function')
        ? window.getSimulationActiveComponents()
        : Array.from(document.querySelectorAll('.component'));
    return simulationComponents
        .flatMap(comp => Array.from(comp.querySelectorAll('.borne') || []))
        .map(b => {
            const rect = b.getBoundingClientRect();
            const x = (rect.left + rect.width / 2 - bancadaRect.left) / zoomLevel;
            const y = (rect.top + rect.height / 2 - bancadaRect.top) / zoomLevel;
            const dist = Math.hypot(point.x - x, point.y - y);
            const comp = b.closest('.component');
            const tag = String(comp?.dataset?.tag || '').trim();
            const lib = String(comp?.dataset?.lib || '').trim();
            const pino = String(b.dataset.pino || '').trim();
            return {
                ref: `${tag || lib || 'sem-tag'}.${pino || '?'}`,
                dist: Number(dist.toFixed(1))
            };
        })
        .filter(item => item.dist <= maxDist)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, Math.max(1, limit));
}

// =====================================================
// ENGINE STEP NOVA
// =====================================================
function engineStepNew() {
    const nodes = construirNosEletricos();
    const simulationComponents = (typeof window.getSimulationActiveComponents === 'function')
        ? window.getSimulationActiveComponents()
        : Array.from(document.querySelectorAll('.component'));
    let curto = false;
    const iecDiagEnabled = typeof window.__simIecDiagEnabled === 'function' && window.__simIecDiagEnabled();
    if (iecDiagEnabled && typeof window.__simIecDiagStartStep === 'function') {
        window.__simIecDiagStartStep({
            mode: (typeof activeWorkspaceMode !== 'undefined' ? activeWorkspaceMode : 'simbologia'),
            components: simulationComponents.length,
            nodes: nodes.length,
            wires: Array.isArray(listaFios) ? listaFios.length : 0
        });
    }

    // Reset
    nodes.forEach(n => {
        n.potenciais.clear();
        n.erro = null;
    });

    // 1ï¸âƒ£ InjeÃ§Ã£o de fontes (ACUMULANDO)
    simulationComponents.forEach(comp => {
        const def = BIBLIOTECA[comp.dataset.lib];
        if (!def) return;

        comp.querySelectorAll('.borne').forEach(b => {
            const n = b._node;
            if (!n) return;

            const potential = (b.dataset.potential || '').toUpperCase();
            if (potential === POT.FASE) {
                n.potenciais.add(POT.FASE);
                const pino = (b.dataset.pino || '').trim().toUpperCase();
                if (pino) n.potenciais.add(`${POT_PHASE_PREFIX}${pino}`);
            }
            if (potential === POT.NEUTRO) n.potenciais.add(POT.NEUTRO);

            if (def.tipo === 'fonte-fase') {
                n.potenciais.add(POT.FASE);
                const pino = (b.dataset.pino || '').trim().toUpperCase();
                if (pino) n.potenciais.add(`${POT_PHASE_PREFIX}${pino}`);
            }
            if (def.tipo === 'fonte-neutro') n.potenciais.add(POT.NEUTRO);
        });
    });
    const basePotentialsByNode = new Map();
    nodes.forEach(n => {
        basePotentialsByNode.set(n, new Set(n.potenciais));
    });

    // 2) Componentes internos (iterativo, com acionamento por TAG)
    const comps = simulationComponents.slice();
    const MAX_ITERS = 24;
    const normalizeTag = (s) => (s || '').trim().toUpperCase();
    const supportsTagCoilPropagation = (comp, def) => {
        const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
        const tipo = String(def?.tipo || '').trim().toLowerCase();
        if (tipo === 'bobina' || tipo === 'bobina_temporizada') return true;
        if (lib === 'real_contator' || lib === 'real_contator_forca') return true;
        return false;
    };
    const supportsTagMechanicalPropagation = (comp, def) => {
        const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
        const tipo = String(def?.tipo || '').trim().toLowerCase();
        if (supportsTagCoilPropagation(comp, def)) return true;
        if (lib === 'iec_rele_falta_fase' || lib === 'real_rele_falta_fase') return true;
        if (tipo === 'botao') return true;
        if (lib === 'iec_botoeira_emergencia_na' || lib === 'iec_botoeira_emergencia_nf') return true;
        if (lib === 'real_botoeira_verde' || lib === 'real_botoeira_vermelha' || lib === 'real_botoeira_emergencia') return true;
        return false;
    };
    const thermalTripByTag = new Map();
    const temporizedCoilTags = new Set();
    const contactorCoilTags = new Set();
    comps.forEach(comp => {
        const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
        if (lib !== 'iec_rele_termico' && lib !== 'real_rele_termico') {
            return;
        }
        const def = BIBLIOTECA[comp.dataset.lib] || {};
        const tag = normalizeTag(comp.dataset.tag || def.tagDefault);
        if (!tag) return;
        const tripped = (comp.dataset.releTrip === 'true') || (comp.dataset.manualOn === 'true');
        const prev = thermalTripByTag.get(tag) || false;
        thermalTripByTag.set(tag, prev || tripped);
    });
    comps.forEach(comp => {
        const def = BIBLIOTECA[comp.dataset.lib];
        if (!def || def.tipo !== 'bobina_temporizada') return;
        const tag = normalizeTag(comp.dataset.tag || def.tagDefault);
        if (tag) temporizedCoilTags.add(tag);
    });
    comps.forEach(comp => {
        const def = BIBLIOTECA[comp.dataset.lib];
        if (!def || !supportsTagCoilPropagation(comp, def)) return;
        if (def.tipo === 'bobina_temporizada') return;
        const tag = normalizeTag(comp.dataset.tag || def.tagDefault);
        if (tag) contactorCoilTags.add(tag);
    });
    const getNodePhaseIds = (node) => {
        const ids = new Set();
        node?.potenciais?.forEach?.(p => {
            if (typeof p !== 'string') return;
            if (!p.startsWith(POT_PHASE_PREFIX)) return;
            const id = p.slice(POT_PHASE_PREFIX.length).trim().toUpperCase();
            if (id) ids.add(id);
        });
        return ids;
    };
    const nodeSinglePotential = (node) => {
        if (!node) return null;
        const hasF = node.potenciais.has(POT.FASE);
        const hasN = node.potenciais.has(POT.NEUTRO);
        if (hasF && !hasN) {
            const ids = getNodePhaseIds(node);
            if (ids.size === 1) return `${POT_PHASE_PREFIX}${Array.from(ids)[0]}`;
            return POT.FASE;
        }
        if (hasN && !hasF) return POT.NEUTRO;
        return null;
    };
    const getNodeShortInfo = (node) => {
        if (!node) return null;
        const phaseIds = Array.from(getNodePhaseIds(node));
        const hasGenericPhase = node.potenciais.has(POT.FASE);
        const hasNeutral = node.potenciais.has(POT.NEUTRO);
        if (hasNeutral && (hasGenericPhase || phaseIds.length)) {
            return {
                type: 'phase-neutral',
                labels: [phaseIds[0] || 'FASE', 'N']
            };
        }
        if (phaseIds.length >= 2) {
            return {
                type: 'phase-phase',
                labels: [phaseIds[0], phaseIds[1]]
            };
        }
        return null;
    };
    const addPotentials = (fromNode, toNode) => {
        if (!fromNode || !toNode) return false;
        let changed = false;
        fromNode.potenciais.forEach(p => {
            if (!toNode.potenciais.has(p)) {
                toNode.potenciais.add(p);
                changed = true;
            }
        });
        return changed;
    };
    const addVisualPhaseTrace = (fromNode, toNode) => {
        if (!fromNode || !toNode) return false;
        let changed = false;
        const phaseIds = getNodePhaseIds(fromNode);
        if (phaseIds.size) {
            phaseIds.forEach(id => {
                const token = POT_TRACE_PHASE_PREFIX + id;
                if (!toNode.potenciais.has(token)) {
                    toNode.potenciais.add(token);
                    changed = true;
                }
            });
            return changed;
        }
        if (fromNode.potenciais.has(POT.FASE)) {
            const token = POT_TRACE_PHASE_PREFIX + 'FASE';
            if (!toNode.potenciais.has(token)) {
                toNode.potenciais.add(token);
                changed = true;
            }
        }
        return changed;
    };
    const getBorneNode = (comp, pino) => {
        const b = comp.querySelector(`.borne[data-pino="${pino}"]`);
        return b ? b._node : null;
    };
    const getBornePos = (comp, pino) => {
        const borne = comp?.querySelector?.(`.borne[data-pino="${pino}"]`);
        if (!borne) return null;
        const r = borne.getBoundingClientRect();
        return { x: r.left + (r.width / 2), y: r.top + (r.height / 2) };
    };
    const areContatorReleCoupled = (contator, rele) => {
        // Regra principal: acoplamento pelos pinos de interface
        // (saidas do contator para entradas do rele).
        const pairs = [
            ['2T1', '1L1'],
            ['4T2', '3L2'],
            ['6T3', '5L3']
        ];
        let alignedCount = 0;
        pairs.forEach(([pc, pr]) => {
            const c = getBornePos(contator, pc);
            const r = getBornePos(rele, pr);
            if (!c || !r) return;
            const dx = Math.abs(c.x - r.x);
            const dy = Math.abs(c.y - r.y);
            if (dx <= 14 && dy <= 44) alignedCount++;
        });
        if (alignedCount >= 2) return true;

        // Fallback por proximidade geral para tolerar pequenos desvios.
        const cRect = contator.getBoundingClientRect();
        const rRect = rele.getBoundingClientRect();
        const horizontalOverlap = Math.min(cRect.right, rRect.right) - Math.max(cRect.left, rRect.left);
        const verticalGap = rRect.top - cRect.bottom;
        return horizontalOverlap >= 30 && verticalGap >= -8 && verticalGap <= 80;
    };
    const buildContatorReleCouplingState = () => {
        const contatoresForca = comps.filter(c => c.dataset.lib === 'real_contator_forca');
        const relesTermicos = comps.filter(c => c.dataset.lib === 'real_rele_termico');
        const normalizeTagLocal = (s) => (s || '').trim().toUpperCase();
        const byContator = new Map();
        const coupledReles = new Set();

        contatoresForca.forEach(c => {
            let bestRele = null;
            let bestScore = Number.POSITIVE_INFINITY;
            const cTag = normalizeTagLocal(c.dataset.tag || BIBLIOTECA[c.dataset.lib]?.tagDefault);
            const cTop = parseInt(c.style.top || '0', 10);
            const cLeft = parseInt(c.style.left || '0', 10);

            relesTermicos.forEach(r => {
                if (!areContatorReleCoupled(c, r)) return;
                const rTag = normalizeTagLocal(r.dataset.tag || BIBLIOTECA[r.dataset.lib]?.tagDefault);
                const rTop = parseInt(r.style.top || '0', 10);
                const rLeft = parseInt(r.style.left || '0', 10);
                const dy = Math.abs(rTop - cTop);
                const dx = Math.abs(rLeft - cLeft);
                const tagPenalty = (cTag && rTag && cTag === rTag) ? 0 : 1000;
                const score = tagPenalty + (dy * 2) + dx;
                if (score < bestScore) {
                    bestScore = score;
                    bestRele = r;
                }
            });

            if (!bestRele) return;
            byContator.set(c, bestRele);
            coupledReles.add(bestRele);
        });

        return { contatoresForca, relesTermicos, byContator, coupledReles };
    };
    const couplingState = buildContatorReleCouplingState();
    const updateReleCouplingStatusUi = () => {
        if (!couplingState.contatoresForca.length || !couplingState.relesTermicos.length) {
            couplingState.relesTermicos.forEach(rele => {
                rele.removeAttribute('data-coupled');
                rele.removeAttribute('data-coupling-label');
            });
            couplingState.contatoresForca.forEach(contator => {
                contator.removeAttribute('data-rele-coupled');
            });
            hideReleCouplingOverlay();
            clearReleCouplingBadges();
            return;
        }
        couplingState.relesTermicos.forEach(rele => {
            const coupled = couplingState.coupledReles.has(rele);
            const coupledText = coupled ? 'true' : 'false';
            const labelText = coupled ? 'ENCAIXADO' : 'NAO ENCAIXADO';
            if (rele.dataset.coupled !== coupledText) rele.dataset.coupled = coupledText;
            if (rele.dataset.couplingLabel !== labelText) rele.dataset.couplingLabel = labelText;
        });
        couplingState.contatoresForca.forEach(contator => {
            const coupled = couplingState.byContator.has(contator);
            const coupledText = coupled ? 'true' : 'false';
            if (contator.dataset.releCoupled !== coupledText) contator.dataset.releCoupled = coupledText;
        });

        if (!simulando) {
            hideReleCouplingOverlay();
            clearReleCouplingBadges();
            return;
        }
        if (!document.body.classList.contains('simulation-start-hints')) {
            hideReleCouplingOverlay();
            clearReleCouplingBadges();
            return;
        }
        renderReleCouplingBadges(couplingState.relesTermicos);
        const uncoupledTags = couplingState.relesTermicos
            .filter(rele => !couplingState.coupledReles.has(rele))
            .map(rele => {
                const tag = String(rele.dataset.tag || '').trim();
                return tag ? tag.toUpperCase() : 'SEM TAG';
            });
        if (!uncoupledTags.length) {
            hideReleCouplingOverlay();
            return;
        }
        const uniqTags = Array.from(new Set(uncoupledTags));
        const msg = uniqTags.length === 1
            ? `RELE TERMICO ${uniqTags[0]} nao encaixado no contator de forca`
            : `RELES TERMICOS nao encaixados: ${uniqTags.join(', ')}`;
        showReleCouplingOverlay(msg);
    };
    updateReleCouplingStatusUi();
    const connectNodes = (adjacency, a, b) => {
        if (!a || !b || a === b) return;
        if (!adjacency.has(a)) adjacency.set(a, new Set());
        if (!adjacency.has(b)) adjacency.set(b, new Set());
        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
    };
    const buildConnectivityAdjacency = () => {
        const adjacency = new Map();

        // Ligações internas ativas dos componentes (contatos/temporizadores/etc.).
        comps.forEach(comp => {
            const shorts = Array.isArray(comp?._activeShorts) ? comp._activeShorts : [];
            if (!shorts.length) return;
            shorts.forEach(([p1, p2]) => {
                const n1 = getBorneNode(comp, p1);
                const n2 = getBorneNode(comp, p2);
                connectNodes(adjacency, n1, n2);
            });
        });

        // Acoplamento contator de força + relé térmico (mesma regra usada na propagação).
        couplingState.byContator.forEach((bestRele, c) => {
            [
                ['2T1', '1L1'],
                ['4T2', '3L2'],
                ['6T3', '5L3'],
                ['14', '14_EXT'],
                ['A2', 'A2_EXT']
            ].forEach(([pc, pr]) => {
                const nC = getBorneNode(c, pc);
                const nR = getBorneNode(bestRele, pr);
                connectNodes(adjacency, nC, nR);
            });
        });

        return adjacency;
    };
    const getBorneWorkspacePos = (borne) => getWorkbenchRelativeBorneCenter(borne);
    const getNearestNodePointKey = (node, borne) => {
        if (!node || !Array.isArray(node._pointKeys) || !node._pointKeys.length) return null;
        if (!Array.isArray(node.points) || !node.points.length || !borne) return node._pointKeys[0];
        const pos = getBorneWorkspacePos(borne);
        if (!pos) return node._pointKeys[0];
        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        node.points.forEach((pt, idx) => {
            const d = Math.hypot(pos.x - pt.x, pos.y - pt.y);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = idx;
            }
        });
        return node._pointKeys[Math.max(0, Math.min(bestIdx, node._pointKeys.length - 1))] || node._pointKeys[0];
    };
    const addPathEdge = (adjacency, a, b, wire = null, comp = null) => {
        if (!a || !b || a === b) return;
        if (!adjacency.has(a)) adjacency.set(a, []);
        if (!adjacency.has(b)) adjacency.set(b, []);
        adjacency.get(a).push({ to: b, wire, comp });
        adjacency.get(b).push({ to: a, wire, comp });
    };
    const buildWirePathAdjacency = () => {
        const adjacency = new Map();
        listaFios.forEach(f => {
            const pts = Array.isArray(f?.points) ? f.points : [];
            if (!pts.length) return;
            for (let i = 0; i < pts.length - 1; i++) {
                const a = pts[i];
                const b = pts[i + 1];
                const ka = `${a.x},${a.y}`;
                const kb = `${b.x},${b.y}`;
                addPathEdge(adjacency, ka, kb, f);
            }
            if (pts.length === 1) {
                const k = `${pts[0].x},${pts[0].y}`;
                if (!adjacency.has(k)) adjacency.set(k, []);
            }
        });
        return adjacency;
    };
    const addComponentPathEdgeByPins = (adjacency, comp, p1, p2) => {
        const b1 = comp?.querySelector?.(`.borne[data-pino="${p1}"]`);
        const b2 = comp?.querySelector?.(`.borne[data-pino="${p2}"]`);
        if (!b1 || !b2) return;
        const k1 = getNearestNodePointKey(b1._node, b1);
        const k2 = getNearestNodePointKey(b2._node, b2);
        addPathEdge(adjacency, k1, k2, null, comp || null);
    };
    const addComponentShortEdgesToWireAdjacency = (adjacency) => {
        comps.forEach(comp => {
            const shorts = Array.isArray(comp?._activeShorts) ? comp._activeShorts : [];
            shorts.forEach(([p1, p2]) => {
                addComponentPathEdgeByPins(adjacency, comp, p1, p2);
            });
        });

        // Replica acoplamento contator + rele termico usado na propagacao.
        couplingState.byContator.forEach((bestRele, c) => {
            [
                ['2T1', '1L1'],
                ['4T2', '3L2'],
                ['6T3', '5L3'],
                ['14', '14_EXT'],
                ['A2', 'A2_EXT']
            ].forEach(([pc, pr]) => {
                const bC = c.querySelector(`.borne[data-pino="${pc}"]`);
                const bR = bestRele.querySelector(`.borne[data-pino="${pr}"]`);
                if (!bC || !bR) return;
                const kC = getNearestNodePointKey(bC._node, bC);
                const kR = getNearestNodePointKey(bR._node, bR);
                addPathEdge(adjacency, kC, kR, null);
            });
        });
    };
    const collectShortSourcePointKeys = (shortInfo) => {
        const keyA = new Set();
        const keyB = new Set();
        const type = String(shortInfo?.type || '').trim().toLowerCase();
        const labelA = String(shortInfo?.labels?.[0] || '').trim().toUpperCase();
        const labelB = String(shortInfo?.labels?.[1] || '').trim().toUpperCase();
        const addPhaseKey = (set, key) => { if (key) set.add(key); };
        const addNeutralKey = (set, key) => { if (key) set.add(key); };

        comps.forEach(comp => {
            const def = BIBLIOTECA[comp.dataset.lib];
            if (!def) return;
            comp.querySelectorAll('.borne').forEach(b => {
                const pino = (b.dataset.pino || '').trim().toUpperCase();
                const potential = (b.dataset.potential || '').trim().toUpperCase();
                const key = getNearestNodePointKey(b._node, b);
                if (!key) return;

                const isPhaseSource =
                    def.tipo === 'fonte-fase' ||
                    potential === POT.FASE ||
                    (def.tipo === 'fonte-mista' && /^L[123]$/.test(pino));
                const isNeutralSource =
                    def.tipo === 'fonte-neutro' ||
                    potential === POT.NEUTRO ||
                    (def.tipo === 'fonte-mista' && pino === 'N');

                if (type === 'phase-phase') {
                    if (isPhaseSource && pino === labelA) addPhaseKey(keyA, key);
                    if (isPhaseSource && pino === labelB) addPhaseKey(keyB, key);
                    return;
                }
                if (type === 'phase-neutral') {
                    if (isPhaseSource && (!labelA || labelA === 'FASE' || pino === labelA)) addPhaseKey(keyA, key);
                    if (isNeutralSource) addNeutralKey(keyB, key);
                }
            });
        });

        // Fallback: so usa nos quando nao conseguiu localizar a fonte fisica correspondente.
        if (!keyA.size) {
            nodes.forEach(n => {
                if (type === 'phase-phase') {
                    const phaseIds = getNodePhaseIds(n);
                    if (!phaseIds.has(labelA)) return;
                } else if (type === 'phase-neutral') {
                    if (labelA && labelA !== 'FASE') {
                        const phaseIds = getNodePhaseIds(n);
                        if (!phaseIds.has(labelA)) return;
                    } else if (!n?.potenciais?.has?.(POT.FASE)) {
                        return;
                    }
                } else {
                    return;
                }
                const k = getNearestNodePointKey(n, null);
                if (k) keyA.add(k);
            });
        }
        if (!keyB.size) {
            nodes.forEach(n => {
                if (type === 'phase-phase') {
                    const phaseIds = getNodePhaseIds(n);
                    if (!phaseIds.has(labelB)) return;
                } else if (type === 'phase-neutral') {
                    if (!n?.potenciais?.has?.(POT.NEUTRO)) return;
                } else {
                    return;
                }
                const k = getNearestNodePointKey(n, null);
                if (k) keyB.add(k);
            });
        }

        return { keyA, keyB };
    };
    const collectShortFaultPointKeys = (shortInfo) => {
        const out = new Set();
        const type = String(shortInfo?.type || '').trim().toLowerCase();
        const labels = Array.isArray(shortInfo?.labels)
            ? shortInfo.labels.map(v => String(v || '').trim().toUpperCase()).filter(Boolean)
            : [];
        nodes.forEach(n => {
            const info = getNodeShortInfo(n);
            if (!info || String(info.type || '').trim().toLowerCase() !== type) return;
            const infoLabels = Array.isArray(info.labels)
                ? info.labels.map(v => String(v || '').trim().toUpperCase()).filter(Boolean)
                : [];
            const sameLabels =
                labels.length === infoLabels.length &&
                labels.every(label => infoLabels.includes(label));
            if (!sameLabels) return;
            const keys = Array.isArray(n._pointKeys) ? n._pointKeys : [];
            keys.forEach(key => { if (key) out.add(key); });
        });
        return out;
    };
    const tracePathToTargets = (startKeys, targetKeys, adjacency, options = {}) => {
        if (!(startKeys instanceof Set) || !startKeys.size) return null;
        if (!(targetKeys instanceof Set) || !targetKeys.size) return null;
        const prefer = String(options?.prefer || 'nearest').trim().toLowerCase() === 'farthest'
            ? 'farthest'
            : 'nearest';
        const queue = [];
        const seen = new Set();
        const prev = new Map();
        const dist = new Map();

        startKeys.forEach(k => {
            if (!k) return;
            queue.push(k);
            seen.add(k);
            prev.set(k, null);
            dist.set(k, 0);
        });

        while (queue.length) {
            const cur = queue.shift();
            const edges = adjacency.get(cur);
            if (!edges || !edges.length) continue;
            edges.forEach(edge => {
                const next = edge?.to;
                if (!next || seen.has(next)) return;
                seen.add(next);
                prev.set(next, { from: cur, wire: edge.wire || null, comp: edge.comp || null });
                dist.set(next, (dist.get(cur) || 0) + 1);
                queue.push(next);
            });
        }

        let found = null;
        let bestDist = prefer === 'nearest' ? Number.POSITIVE_INFINITY : -1;
        targetKeys.forEach(key => {
            if (!seen.has(key) || startKeys.has(key)) return;
            const d = dist.get(key);
            if (!Number.isFinite(d)) return;
            const isBetter =
                (prefer === 'nearest' && (d < bestDist || (d === bestDist && String(key) < String(found || '')))) ||
                (prefer === 'farthest' && (d > bestDist || (d === bestDist && String(key) < String(found || ''))));
            if (isBetter) {
                bestDist = d;
                found = key;
            }
        });
        if (!found) return null;
        const wireSet = new Set();
        const componentSet = new Set();
        const keySet = new Set();
        const edgeSteps = [];
        let cur = found;
        while (cur) {
            keySet.add(cur);
            const step = prev.get(cur);
            if (!step) break;
            if (step.wire) wireSet.add(step.wire);
            if (step.comp) componentSet.add(step.comp);
            edgeSteps.push({
                from: step.from,
                to: cur,
                wire: step.wire || null,
                comp: step.comp || null
            });
            cur = step.from;
        }
        edgeSteps.reverse();
        return { wireSet, componentSet, keySet, edgeSteps };
    };
    const findShortPathWireData = (shortInfo) => {
        const { keyA, keyB } = collectShortSourcePointKeys(shortInfo);
        if (!keyA.size || !keyB.size) return null;

        const adjacency = buildWirePathAdjacency();
        addComponentShortEdgesToWireAdjacency(adjacency);
        const parsePointKey = (key) => {
            const [xRaw, yRaw] = String(key || '').split(',');
            const x = Number(xRaw);
            const y = Number(yRaw);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
            return { x, y };
        };
        const buildSegmentMapFromEdges = (edgeSteps, keySet, directWireSet) => {
            const segmentMap = new Map();
            const pushSegment = (wire, aKey, bKey) => {
                if (!wire || !aKey || !bKey || aKey === bKey) return;
                const a = parsePointKey(aKey);
                const b = parsePointKey(bKey);
                if (!a || !b) return;
                if (!segmentMap.has(wire)) segmentMap.set(wire, []);
                const segments = segmentMap.get(wire);
                const last = segments[segments.length - 1];
                if (last && last.length) {
                    const tail = last[last.length - 1];
                    if (tail.x === a.x && tail.y === a.y) {
                        last.push({ x: b.x, y: b.y });
                        return;
                    }
                }
                segments.push([{ x: a.x, y: a.y }, { x: b.x, y: b.y }]);
            };

            if (Array.isArray(edgeSteps) && edgeSteps.length) {
                edgeSteps.forEach(step => {
                    if (!step?.wire) return;
                    pushSegment(step.wire, step.from, step.to);
                });
            }

            if (segmentMap.size) return segmentMap;

            if (directWireSet instanceof Set && directWireSet.size) {
                directWireSet.forEach(wire => {
                    const pts = Array.isArray(wire?.points) ? wire.points : [];
                    if (pts.length < 2) return;
                    segmentMap.set(wire, [pts.map(p => ({ x: p.x, y: p.y }))]);
                });
            }

            if (segmentMap.size || !(keySet instanceof Set) || !keySet.size) return segmentMap;

            listaFios.forEach(f => {
                const pts = Array.isArray(f?.points) ? f.points : [];
                if (pts.length < 2) return;
                for (let i = 0; i < pts.length - 1; i++) {
                    const aKey = `${pts[i].x},${pts[i].y}`;
                    const bKey = `${pts[i + 1].x},${pts[i + 1].y}`;
                    if (keySet.has(aKey) && keySet.has(bKey)) {
                        pushSegment(f, aKey, bKey);
                    }
                }
            });
            return segmentMap;
        };
        const normalizePathData = (path) => {
            if (!path) return null;
            const directWireSet = new Set(path.wireSet || []);
            const wireSet = new Set(directWireSet);
            const componentSet = new Set(path.componentSet || []);
            const keySet = new Set(path.keySet || []);
            const edgeSteps = Array.isArray(path.edgeSteps) ? path.edgeSteps.slice() : [];
            if (!wireSet.size && !componentSet.size && !keySet.size && !edgeSteps.length) return null;
            if (keySet.size) {
                listaFios.forEach(f => {
                    const pts = Array.isArray(f?.points) ? f.points : [];
                    if (!pts.length) return;
                    const originKeys = Array.isArray(f?.origem?._node?._pointKeys) ? f.origem._node._pointKeys : [];
                    const destKeys = Array.isArray(f?.destino?._node?._pointKeys) ? f.destino._node._pointKeys : [];
                    const endpointMatch = originKeys.some(key => keySet.has(key)) || destKeys.some(key => keySet.has(key));
                    if (pts.length === 1) {
                        const k = `${pts[0].x},${pts[0].y}`;
                        if (keySet.has(k) || endpointMatch) wireSet.add(f);
                        return;
                    }
                    let pointMatch = false;
                    for (let i = 0; i < pts.length - 1; i++) {
                        const k1 = `${pts[i].x},${pts[i].y}`;
                        const k2 = `${pts[i + 1].x},${pts[i + 1].y}`;
                        if (keySet.has(k1) && keySet.has(k2)) {
                            wireSet.add(f);
                            pointMatch = true;
                            break;
                        }
                    }
                    if (!pointMatch) {
                        for (let i = 0; i < pts.length; i++) {
                            const k = `${pts[i].x},${pts[i].y}`;
                            if (keySet.has(k)) {
                                wireSet.add(f);
                                pointMatch = true;
                                break;
                            }
                        }
                    }
                    if (!pointMatch && endpointMatch) wireSet.add(f);
                });
            }
            const segmentMap = buildSegmentMapFromEdges(edgeSteps, keySet, directWireSet);
            return { wireSet, directWireSet, componentSet, keySet, edgeSteps, segmentMap };
        };

        const faultKeys = collectShortFaultPointKeys(shortInfo);
        if (faultKeys.size) {
            const wireSet = new Set();
            const componentSet = new Set();
            const keySet = new Set();
            const edgeSteps = [];
            const mergePath = (path) => {
                if (!path) return;
                path.wireSet?.forEach?.(wire => wireSet.add(wire));
                path.componentSet?.forEach?.(comp => componentSet.add(comp));
                path.keySet?.forEach?.(key => keySet.add(key));
                path.edgeSteps?.forEach?.(step => edgeSteps.push(step));
            };
            mergePath(tracePathToTargets(keyA, faultKeys, adjacency, { prefer: 'nearest' }));
            mergePath(tracePathToTargets(keyB, faultKeys, adjacency, { prefer: 'nearest' }));
            const branchPath = normalizePathData({ wireSet, componentSet, keySet, edgeSteps });
            if (branchPath && (branchPath.wireSet.size || branchPath.componentSet.size)) {
                return branchPath;
            }
        }

        const directPath = normalizePathData(tracePathToTargets(keyA, keyB, adjacency, { prefer: 'nearest' }));
        return directPath;
    };
    const isAutoTripProtectionLib = (lib) => {
        const key = String(lib || '').trim().toLowerCase();
        return key.includes('disjuntor');
    };
    const tripShortedProtectionDevices = (shortPathData, shortInfo = null) => {
        const componentSet = shortPathData?.componentSet;
        if (!(componentSet instanceof Set) || !componentSet.size) return false;
        const shortType = String(shortInfo?.type || '').trim().toLowerCase();
        const motorBreakers = Array.from(componentSet).filter(comp => {
            const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
            return lib.includes('disjuntor_motor');
        });
        const targetComponents = (shortType === 'phase-phase' && motorBreakers.length)
            ? motorBreakers
            : Array.from(componentSet);
        let changed = false;
        targetComponents.forEach(comp => {
            const lib = String(comp?.dataset?.lib || '').trim();
            if (!isAutoTripProtectionLib(lib)) return;
            if (comp.dataset.manualOn === 'false' && comp._proximoEstado === false) return;
            comp.dataset.manualOn = 'false';
            comp._proximoEstado = false;
            comp._estadoMecanico = false;
            comp._tipoVisual = '';
            changed = true;
        });
        return changed;
    };
    const tripMotorBreakerFallback = () => {
        let changed = false;
        comps.forEach(comp => {
            const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
            if (!lib.includes('disjuntor_motor')) return;
            if (comp.dataset.manualOn === 'false' && comp._proximoEstado === false) return;
            comp.dataset.manualOn = 'false';
            comp._proximoEstado = false;
            comp._estadoMecanico = false;
            comp._tipoVisual = '';
            changed = true;
        });
        return changed;
    };

    const propagateConductivePathsForState = (coilStateSource) => {
        const getTagEnergizedForComp = (comp, def) => {
            const compTag = normalizeTag(comp.dataset.tag || def.tagDefault);
            const overloadTrip = thermalTripByTag.get(compTag) || false;
            return (comp.dataset.lib === 'iec_rele_termico' ||
                comp.dataset.lib === 'iec_contato_rele_term_na' ||
                comp.dataset.lib === 'iec_contato_rele_term_nf')
                ? overloadTrip
                : (coilStateSource.get(compTag) || false);
        };

        const applyComponentShorts = () => {
            let changed = false;
            comps.forEach(comp => {
                const def = BIBLIOTECA[comp.dataset.lib];
                if (!def || !def.behavior) return;

                const bornes = Array.from(comp.querySelectorAll('.borne'));
                const inputs = {};
                bornes.forEach(b => {
                    if (!b.dataset.pino || !b._node) return;
                    const p = nodeSinglePotential(b._node);
                    if (p) inputs[b.dataset.pino] = p;
                });
                const bA1 = bornes.find(b => b.dataset.pino === 'A1');
                const bA2 = bornes.find(b => b.dataset.pino === 'A2');
                const coilEnergizedForShorts = bA1 && bA2
                    ? isCoilElectricallyEnergized(bA1._node, bA2._node)
                    : false;

                const res = def.behavior(inputs, comp._simIterEstado === true, {
                    pressionado: comp.dataset.pressionado === 'true',
                    coilEnergized: coilEnergizedForShorts,
                    openPulseUntilMs: Number(comp._realContatorOpenUntilMs || 0),
                    tagEnergized: getTagEnergizedForComp(comp, def),
                    overloadTrip: thermalTripByTag.get(normalizeTag(comp.dataset.tag || def.tagDefault)) || false
                }, comp);
                if (comp.dataset.lib === 'real_contator' && Number.isFinite(Number(res?.openPulseUntilMs))) {
                    comp._realContatorOpenUntilMs = Number(res.openPulseUntilMs) || 0;
                }
                const shorts = Array.isArray(res?.shorts) ? res.shorts : [];
                shorts.forEach(([p1, p2]) => {
                    const b1 = bornes.find(b => b.dataset.pino === p1);
                    const b2 = bornes.find(b => b.dataset.pino === p2);
                    if (b1 && b2 && b1._node && b2._node) {
                        if (addPotentials(b2._node, b1._node)) changed = true;
                        if (addPotentials(b1._node, b2._node)) changed = true;
                    }
                });
            });
            return changed;
        };

        const applyCouplingShorts = () => {
            let changed = false;
            couplingState.byContator.forEach((bestRele, c) => {
                const bridges = [
                    ['2T1', '1L1'],
                    ['4T2', '3L2'],
                    ['6T3', '5L3'],
                    ['14', '14_EXT'],
                    ['A2', 'A2_EXT']
                ];
                bridges.forEach(([pc, pr]) => {
                    const nC = getBorneNode(c, pc);
                    const nR = getBorneNode(bestRele, pr);
                    if (!nC || !nR) return;
                    if (addPotentials(nC, nR)) changed = true;
                    if (addPotentials(nR, nC)) changed = true;
                });
            });
            return changed;
        };

        const maxPasses = Math.max(8, comps.length + (couplingState.byContator?.size || 0) * 2);
        for (let pass = 0; pass < maxPasses; pass++) {
            let changed = false;
            if (applyComponentShorts()) changed = true;
            if (applyCouplingShorts()) changed = true;
            if (!changed) break;
        }
    };

    const filterTemporizedCoilStateMap = (source) => {
        const out = new Map();
        if (!(source instanceof Map)) return out;
        source.forEach((value, tag) => {
            if (!temporizedCoilTags.has(tag)) return;
            if (value) out.set(tag, true);
        });
        return out;
    };
    const buildMechanicalTagStateMap = () => {
        const out = new Map();
        comps.forEach(comp => {
            const def = BIBLIOTECA[comp.dataset.lib];
            if (!def || !supportsTagMechanicalPropagation(comp, def)) return;
            if (supportsTagCoilPropagation(comp, def)) return;
            const tag = normalizeTag(comp.dataset.tag || def.tagDefault);
            if (!tag) return;
            const isOn =
                comp._estadoMecanico === true ||
                comp._proximoEstado === true ||
                comp.getAttribute('data-state') === 'ativo' ||
                comp.getAttribute('data-state') === 'ativo-local' ||
                comp.getAttribute('data-state') === 'ativo-tag';
            if (!isOn) return;
            out.set(tag, true);
        });
        return out;
    };
    const trackedDiagnosticTags = (() => {
        const out = new Set();
        comps.forEach(comp => {
            const def = BIBLIOTECA[comp.dataset.lib];
            if (!def || !supportsTagMechanicalPropagation(comp, def)) return;
            const tag = normalizeTag(comp.dataset.tag || def.tagDefault);
            if (!tag) return;
            out.add(tag);
        });
        return Array.from(out).sort();
    })();
    let prevTagKey = '';
    let prevStateKey = '';
    let prevPotentialKey = '';
    const useContactorDeenergizeHold = CONTACTOR_COIL_DEENERGIZE_HOLD_MS > 0 &&
        shouldUseContactorDeenergizeHold();
    const previousResolvedTagStates = new Map();
    if (lastResolvedTagStatesByTag instanceof Map) {
        lastResolvedTagStatesByTag.forEach((value, tag) => {
            if (value) previousResolvedTagStates.set(tag, true);
        });
    }
    const previousCoilStates = filterTemporizedCoilStateMap(lastCoilStatesByTag);
    const previousContactorHeldStates = new Map();
    if (useContactorDeenergizeHold && contactorCoilHoldUntilByTag instanceof Map) {
        const holdNow = (typeof window.getSimulationTimeMs === 'function')
            ? window.getSimulationTimeMs()
            : Date.now();
        contactorCoilHoldUntilByTag.forEach((until, tag) => {
            if (!contactorCoilTags.has(tag)) return;
            if ((Number(until) || 0) > holdNow) previousContactorHeldStates.set(tag, true);
        });
    }
    const initialMechanicalTagStates = buildMechanicalTagStateMap();
    let iterTagStates = new Map(initialMechanicalTagStates);
    previousResolvedTagStates.forEach((value, tag) => {
        if (value) iterTagStates.set(tag, true);
    });
    previousCoilStates.forEach((value, tag) => {
        if (value) iterTagStates.set(tag, true);
    });
    previousContactorHeldStates.forEach((value, tag) => {
        if (value) iterTagStates.set(tag, true);
    });
    let finalTagStates = new Map(iterTagStates);
    const tempCoilSawEnergizedThisStep = new WeakMap();
    let executedIterations = 0;
    let stopReason = 'max_iters';
    comps.forEach(comp => {
        comp._simIterEstado = comp._estadoMecanico === true;
    });
    for (let it = 0; it < MAX_ITERS; it++) {
        executedIterations = it + 1;
        nodes.forEach(n => {
            n.potenciais.clear();
            const base = basePotentialsByNode.get(n);
            if (!base) return;
            base.forEach(p => n.potenciais.add(p));
        });
        propagateConductivePathsForState(iterTagStates);
        const electricalCoilStates = new Map();
        const mechanicalTagStates = buildMechanicalTagStateMap();
        const now = (typeof window.getSimulationTimeMs === 'function')
            ? window.getSimulationTimeMs()
            : Date.now();

        // Bobinas (normal/temporizada) acionam sua tag.
        comps.forEach(comp => {
            const def = BIBLIOTECA[comp.dataset.lib];
            if (!def || !supportsTagCoilPropagation(comp, def)) return;
            const bornes = Array.from(comp.querySelectorAll('.borne'));
            const bA1 = bornes.find(b => b.dataset.pino === 'A1');
            const bA2 = bornes.find(b => b.dataset.pino === 'A2');
            if (!bA1 || !bA2) return;

            const a1 = nodeSinglePotential(bA1._node);
            const a2 = nodeSinglePotential(bA2._node);
            const ligadoEletrico = isCoilElectricallyEnergized(bA1._node, bA2._node);
            let ligado = ligadoEletrico;
            if (def.tipo === 'bobina_temporizada') {
                const sawBefore = tempCoilSawEnergizedThisStep.get(comp) || false;
                const visualEnergized =
                    comp._estadoMecanico === true ||
                    comp._proximoEstado === true ||
                    comp.getAttribute('data-state') === 'ativo';
                const effectiveEnergized = ligadoEletrico || sawBefore || visualEnergized;
                if (ligadoEletrico || visualEnergized) tempCoilSawEnergizedThisStep.set(comp, true);
                ligado = getTempCoilOutput(comp, effectiveEnergized, now);
            }
            const tag = normalizeTag(comp.dataset.tag || def.tagDefault);
            if (!tag) return;
            if (useContactorDeenergizeHold && contactorCoilTags.has(tag) && ligadoEletrico) {
                contactorCoilHoldUntilByTag.set(tag, now + CONTACTOR_COIL_DEENERGIZE_HOLD_MS);
            }
            const prev = electricalCoilStates.get(tag) || false;
            electricalCoilStates.set(tag, prev || ligado);
        });

        const nextTagStates = new Map();
        const allTags = new Set([
            ...previousCoilStates.keys(),
            ...previousContactorHeldStates.keys(),
            ...iterTagStates.keys(),
            ...electricalCoilStates.keys(),
            ...mechanicalTagStates.keys()
        ]);
        allTags.forEach(tag => {
            const ligadoEletrico = electricalCoilStates.get(tag) || false;
            const ligadoMecanico = mechanicalTagStates.get(tag) || false;
            const useTemporalMemory = temporizedCoilTags.has(tag);
            const keepByContactorHold = useContactorDeenergizeHold &&
                contactorCoilTags.has(tag) &&
                ((contactorCoilHoldUntilByTag.get(tag) || 0) > now);
            const keepFromPreviousStep = useTemporalMemory && it === 0 && (previousCoilStates.get(tag) || false);
            nextTagStates.set(tag, !!(ligadoMecanico || ligadoEletrico || keepFromPreviousStep || keepByContactorHold));
        });
        finalTagStates = nextTagStates;

        const tagKey = JSON.stringify(Array.from(nextTagStates.entries()).sort((a, b) => a[0].localeCompare(b[0])));
        let stateChanged = false;
        const changedComponents = [];

        comps.forEach(comp => {
            const def = BIBLIOTECA[comp.dataset.lib];
            if (!def || !def.behavior) return;

            const bornes = Array.from(comp.querySelectorAll('.borne'));
            const inputs = {};
            bornes.forEach(b => {
                if (!b.dataset.pino || !b._node) return;
                const p = nodeSinglePotential(b._node);
                if (p) inputs[b.dataset.pino] = p;
            });

            const estado = comp._simIterEstado === true;
            const compTag = normalizeTag(comp.dataset.tag || def.tagDefault);
            const overloadTrip = thermalTripByTag.get(compTag) || false;
            const bA1 = bornes.find(b => b.dataset.pino === 'A1');
            const bA2 = bornes.find(b => b.dataset.pino === 'A2');
            const coilEnergized = bA1 && bA2
                ? isCoilElectricallyEnergized(bA1._node, bA2._node)
                : false;
            const props = {
                pressionado: comp.dataset.pressionado === 'true',
                coilEnergized,
                openPulseUntilMs: Number(comp._realContatorOpenUntilMs || 0),
                tagEnergized:
                    (comp.dataset.lib === 'iec_rele_termico' ||
                        comp.dataset.lib === 'iec_contato_rele_term_na' ||
                        comp.dataset.lib === 'iec_contato_rele_term_nf')
                        ? overloadTrip
                        : (iterTagStates.get(compTag) || false),
                overloadTrip
            };
            const res = def.behavior(inputs, estado, props, comp);
            if (comp.dataset.lib === 'real_contator' && Number.isFinite(Number(res?.openPulseUntilMs))) {
                comp._realContatorOpenUntilMs = Number(res.openPulseUntilMs) || 0;
            }
            const nextState = !!res.novoEstado;
            if (nextState !== estado) {
                stateChanged = true;
                const compTagLabel = normalizeTag(comp.dataset.tag || def.tagDefault) || String(comp.dataset.lib || 'comp');
                changedComponents.push(`${compTagLabel}:${estado ? 1 : 0}->${nextState ? 1 : 0}`);
            }
            comp._simIterEstado = nextState;
            comp._proximoEstado = nextState;
            comp._tipoVisual = res.tipoVisual || (comp._proximoEstado ? 'ativo' : '');
            comp._activeShorts = Array.isArray(res.shorts) ? res.shorts : [];

            if (res.shorts) {
                res.shorts.forEach(([p1, p2]) => {
                    const b1 = bornes.find(b => b.dataset.pino === p1);
                    const b2 = bornes.find(b => b.dataset.pino === p2);
                    if (b1 && b2 && b1._node && b2._node) {
                        addPotentials(b2._node, b1._node);
                        addPotentials(b1._node, b2._node);
                    }
                });
            }
            if (Array.isArray(res.visualPhasePairs)) {
                res.visualPhasePairs.forEach(([fromPin, toPin]) => {
                    const fromBorne = bornes.find(b => b.dataset.pino === fromPin);
                    const toBorne = bornes.find(b => b.dataset.pino === toPin);
                    if (fromBorne && toBorne && fromBorne._node && toBorne._node) {
                        addVisualPhaseTrace(fromBorne._node, toBorne._node);
                    }
                });
            }
        });

        // Acoplamento contator de forca + rele termico por proximidade fisica.
        // Em campo, o rele termico fica montado diretamente no contator.
        // Mantemos preferencia por mesma TAG, mas aceitamos apenas proximidade.
        couplingState.byContator.forEach((bestRele, c) => {
            const bridges = [
                ['2T1', '1L1'],
                ['4T2', '3L2'],
                ['6T3', '5L3']
            ];
            bridges.forEach(([pc, pr]) => {
                const nC = getBorneNode(c, pc);
                const nR = getBorneNode(bestRele, pr);
                if (!nC || !nR) return;
                addPotentials(nC, nR);
                addPotentials(nR, nC);
            });

            // Bornes auxiliares "transportados" para o rele quando encaixado:
            // facilita acesso aos pontos 14 e A2 do contator de forca.
            const auxBridges = [
                ['14', '14_EXT'],
                ['A2', 'A2_EXT']
            ];
            auxBridges.forEach(([pc, pr]) => {
                const nC = getBorneNode(c, pc);
                const nR = getBorneNode(bestRele, pr);
                if (!nC || !nR) return;
                addPotentials(nC, nR);
                addPotentials(nR, nC);
            });
        });

        const potentialKey = JSON.stringify(
            nodes
                .map(n => `${n.id}:${Array.from(n.potenciais).sort().join('|')}`)
                .sort()
        );
        const stateKey = JSON.stringify(
            comps
                .map(comp => `${comp.dataset.uid || comp.id || comp.dataset.lib}:${comp._simIterEstado === true ? 1 : 0}`)
                .sort()
        );
        if (iecDiagEnabled && typeof window.__simIecDiagIter === 'function') {
            const activeCoils = Array.from(nextTagStates.entries())
                .filter(([, on]) => !!on)
                .map(([tag]) => String(tag));
            const potentialCount = nodes.reduce((sum, n) => sum + (n?.potenciais?.size || 0), 0);
            const tagDiagnostics = trackedDiagnosticTags.map(tag => {
                const mech = iterTagStates.get(tag) ? 1 : 0;
                const local = electricalCoilStates.get(tag) ? 1 : 0;
                const next = nextTagStates.get(tag) ? 1 : 0;
                return `${tag}[m${mech} l${local} n${next}]`;
            });
            window.__simIecDiagIter({
                iter: it + 1,
                coils: activeCoils,
                tags: tagDiagnostics,
                changed: changedComponents.slice(0, 12),
                potentials: potentialCount
            });
        }
        if (!stateChanged && tagKey === prevTagKey && stateKey === prevStateKey && potentialKey === prevPotentialKey) {
            stopReason = 'stable';
            break;
        }
        prevTagKey = tagKey;
        prevStateKey = stateKey;
        prevPotentialKey = potentialKey;
        iterTagStates = new Map(nextTagStates);
    }

    lastResolvedTagStatesByTag = new Map();
    finalTagStates.forEach((value, tag) => {
        if (value) lastResolvedTagStatesByTag.set(tag, true);
    });
    lastCoilStatesByTag = filterTemporizedCoilStateMap(finalTagStates);

    // 3) DETECCAO DE CURTO REAL
    let firstShortInfo = null;
    const shortCandidateNodes = [];
    const shortVisualNowMs = Date.now();
    nodes.forEach(n => {
        const shortInfo = getNodeShortInfo(n);
        if (shortInfo) {
            shortCandidateNodes.push(n);
            if (!firstShortInfo) firstShortInfo = shortInfo;
        }
    });

    const shortDetectedNow = !!firstShortInfo;
    if (shortDetectedNow) {
        const shortKey = getShortInfoKey(firstShortInfo);
        if (!shortPendingSinceMs || shortPendingKey !== shortKey) {
            shortPendingSinceMs = shortVisualNowMs;
            shortPendingKey = shortKey;
        }
        if ((shortVisualNowMs - shortPendingSinceMs) >= SHORT_CONFIRM_MS) {
            curto = true;
            shortCandidateNodes.forEach(n => {
                n.erro = 'CURTO';
            });
        }
    } else {
        shortPendingSinceMs = 0;
        shortPendingKey = '';
    }

    const shortPathData = curto ? findShortPathWireData(firstShortInfo) : null;
    const shortPathWires = (curto && shortPathData?.wireSet && shortPathData.wireSet.size)
        ? shortPathData.wireSet
        : null;
    let protectionTripped = false;
    if (curto && shortPathData) {
        protectionTripped = tripShortedProtectionDevices(shortPathData, firstShortInfo);
    }
    if (curto && !protectionTripped && String(firstShortInfo?.type || '') === 'phase-phase') {
        protectionTripped = tripMotorBreakerFallback();
        if (protectionTripped && typeof window.__simPerfLogEvent === 'function') {
            window.__simPerfLogEvent('fallback curto entre fases: disjuntor motor desligado');
        }
    }
    if (curto) {
        const msg = firstShortInfo?.type === 'phase-phase'
            ? `\u26A0\uFE0F CURTO ENTRE FASES (${firstShortInfo.labels[0]} \u00D7 ${firstShortInfo.labels[1]})`
            : `\u26A0\uFE0F CURTO-CIRCUITO DETECTADO (${firstShortInfo?.labels?.[0] || 'FASE'} \u00D7 ${firstShortInfo?.labels?.[1] || 'N'})`;
        shortVisualHoldUntilMs = shortVisualNowMs + SHORT_VISUAL_HOLD_MS;
        shortVisualMessage = msg;
        shortVisualWireSet = new Set(shortPathWires ? Array.from(shortPathWires) : []);
        shortVisualSegmentMap = shortPathData?.segmentMap instanceof Map
            ? new Map(Array.from(shortPathData.segmentMap.entries()).map(([wire, segments]) => [wire, segments.map(seg => seg.map(p => ({ x: p.x, y: p.y })))]))
            : new Map();
        shortVisualPoint = firstShortInfo?.point && Number.isFinite(firstShortInfo.point.x) && Number.isFinite(firstShortInfo.point.y)
            ? { x: firstShortInfo.point.x, y: firstShortInfo.point.y }
            : null;
        const shortDebug = {
            message: msg,
            type: String(firstShortInfo?.type || ''),
            labels: Array.isArray(firstShortInfo?.labels) ? firstShortInfo.labels.slice() : [],
            point: shortVisualPoint ? { x: Number(shortVisualPoint.x.toFixed(1)), y: Number(shortVisualPoint.y.toFixed(1)) } : null,
            wires: shortPathWires ? Array.from(shortPathWires).map(w => String(w?._numero || w?.numero || w?.id || '?')) : [],
            bornes: shortVisualPoint ? getNearestBornesToWorkbenchPoint(shortVisualPoint, 8, 120) : []
        };
        window.__lastShortDebug = shortDebug;
        const shortDebugKey = JSON.stringify({
            message: shortDebug.message,
            point: shortDebug.point,
            wires: shortDebug.wires,
            bornes: shortDebug.bornes.map(item => item.ref)
        });
        if (window.__lastShortDebugKey !== shortDebugKey) {
            window.__lastShortDebugKey = shortDebugKey;
            console.warn('[sim_short_debug]', shortDebug);
        }
        showCurto(msg);
    } else if (shortVisualHoldUntilMs > shortVisualNowMs && shortVisualMessage) {
        showCurto(shortVisualMessage);
    } else {
        shortVisualHoldUntilMs = 0;
        shortVisualMessage = '';
        shortVisualWireSet = new Set();
        shortVisualSegmentMap = new Map();
        shortVisualPoint = null;
        window.__lastShortDebug = null;
        window.__lastShortDebugKey = '';
        hideCurto();
    }

    renderDebugNodes(nodes);

    // 4ï¸âƒ£ Render
    simulationComponents.forEach(c => {
        c._estadoMecanico = c._simIterEstado === true;
        c._proximoEstado = c._estadoMecanico;
        delete c._simIterEstado;
        const prevVisualState = String(c._lastSoundState || c.getAttribute('data-state') || '');
        const keepVisualState = c._estadoMecanico || !!(c._tipoVisual && String(c._tipoVisual).trim());
        if (keepVisualState) c.setAttribute('data-state', c._tipoVisual || 'ativo');
        else c.removeAttribute('data-state');
        const nextVisualState = String(c.getAttribute('data-state') || '');
        if (typeof window.__playRealComponentStateSound === 'function') {
            window.__playRealComponentStateSound(c, prevVisualState, nextVisualState);
        }
        c._lastSoundState = nextVisualState;
    });

    listaFios.forEach(f => {
        const n = f.origem?._node || f.destino?._node || f._node;
        let cor = '#7f8c8d';

        const hasEnergy = !!(
            n?.potenciais?.has?.(POT.FASE) ||
            n?.potenciais?.has?.(POT.NEUTRO) ||
            Array.from(n?.potenciais || []).some(p => typeof p === 'string' && (p.startsWith(POT_PHASE_PREFIX) || p.startsWith(POT_TRACE_PHASE_PREFIX)))
        );
        cor = hasEnergy ? '#ff0000' : '#7f8c8d';

        if (typeof window.applyWireSimulationColor === 'function') {
            window.applyWireSimulationColor(f, cor);
        } else if (f.element) {
            f.element.style.stroke = cor;
        }
    });
    const visualShortActive = curto || (shortVisualHoldUntilMs > shortVisualNowMs);
    const visualShortSegments = curto
        ? (shortPathData?.segmentMap instanceof Map ? shortPathData.segmentMap : shortVisualSegmentMap)
        : shortVisualSegmentMap;
    const visualShortPoint = curto
        ? firstShortInfo?.point
        : shortVisualPoint;
    if (visualShortActive) {
        renderShortPathOverlays(visualShortSegments);
        renderShortPointOverlay(visualShortPoint);
    } else clearShortPathOverlays();

    if (iecDiagEnabled && typeof window.__simIecDiagFinish === 'function') {
        const activeCoils = Array.from(finalTagStates.entries())
            .filter(([, on]) => !!on)
            .map(([tag]) => String(tag));
        window.__simIecDiagFinish({
            reason: stopReason,
            iterations: executedIterations,
            short: curto,
            coils: activeCoils
        });
    }
}

// =====================================================
// INTERCEPTOR
// =====================================================
const _engineOld = window.engineStep;
const ENGINE_STEP_SLOW_WARN_MS = 120;
const ENGINE_STEP_ABORT_MS = 450;
const ENGINE_STEP_CATASTROPHIC_MS = 2000;
const ENGINE_STEP_SLOW_STREAK_LIMIT = 6;
const ENGINE_STEP_ABORT_STREAK_LIMIT = 3;
let engineStepSlowStreak = 0;
let engineStepAbortStreak = 0;
let engineStepLastAlertAt = 0;

function handleEngineStepFailure(message, errorObj = null) {
    if (errorObj) {
        console.error('[engine.new] simulation step failed:', errorObj);
    } else {
        console.warn('[engine.new] simulation guard:', message);
    }
    if (!simulando) return;
    if (typeof toggleSimulacao === 'function') {
        toggleSimulacao();
    }
    const now = Date.now();
    if (now - engineStepLastAlertAt > 2500) {
        engineStepLastAlertAt = now;
        alert(message);
    }
}

window.engineStep = function () {
    if (ENGINE_MODE === 'new') {
        const t0 = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();
        try {
            if (typeof window.tickSimulationClock === 'function') window.tickSimulationClock();
            engineStepNew();
        } catch (err) {
            handleEngineStepFailure(
                'A simulacao encontrou um erro interno e foi interrompida para proteger o projeto. Veja o Console (F12) para o detalhe tecnico.',
                err
            );
            return;
        }
        const t1 = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();
        const elapsedMs = Math.max(0, t1 - t0);
        if (elapsedMs > ENGINE_STEP_SLOW_WARN_MS) engineStepSlowStreak += 1;
        else engineStepSlowStreak = 0;
        if (elapsedMs > ENGINE_STEP_ABORT_MS) engineStepAbortStreak += 1;
        else engineStepAbortStreak = 0;

        if (
            elapsedMs > ENGINE_STEP_CATASTROPHIC_MS ||
            engineStepAbortStreak >= ENGINE_STEP_ABORT_STREAK_LIMIT ||
            engineStepSlowStreak >= ENGINE_STEP_SLOW_STREAK_LIMIT
        ) {
            handleEngineStepFailure(
                'A simulacao ficou pesada demais e foi pausada para evitar travamento. Revise emendas/fios sobrepostos e tente novamente.'
            );
            engineStepSlowStreak = 0;
            engineStepAbortStreak = 0;
            return;
        }
    }
    else _engineOld();
};
















