(function () {
    const LIB_KEY = 'real_regua_milimetrada';
    const PX_PER_MM = 3.77;
    const SVG_HEIGHT = 68;
    const EDGE_PX = 6;
    const BASELINE_Y = 48;
    const DEFAULT_LENGTH_MM = 100;
    const MIN_LENGTH_MM = 20;
    const MAX_LENGTH_MM = 2000;
    const ALLOWED_ANGLES = [0, 45, 90, 180, 270];

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeLengthMm(value) {
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) return DEFAULT_LENGTH_MM;
        return clamp(Math.round(parsed), MIN_LENGTH_MM, MAX_LENGTH_MM);
    }

    function normalizeAngle(value) {
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) return 0;
        if (ALLOWED_ANGLES.includes(parsed)) return parsed;
        let nearest = ALLOWED_ANGLES[0];
        let bestDelta = Math.abs(parsed - nearest);
        ALLOWED_ANGLES.forEach(a => {
            const delta = Math.abs(parsed - a);
            if (delta < bestDelta) {
                bestDelta = delta;
                nearest = a;
            }
        });
        return nearest;
    }

    function mmToPx(mm) {
        return Math.round(mm * PX_PER_MM * 1000) / 1000;
    }

    function normalizeMarkerMm(value, lengthMm) {
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) return 0;
        return clamp(parsed, 0, lengthMm);
    }

    function normalizeDisplayUnit(value) {
        return String(value || '').trim().toLowerCase() === 'cm' ? 'cm' : 'mm';
    }

    function formatMeasurement(mmValue, unit) {
        if (unit === 'cm') return `${(mmValue / 10).toFixed(2)} cm`;
        return `${mmValue.toFixed(1)} mm`;
    }

    function buildRulerSvg(lengthMm) {
        const widthPx = mmToPx(lengthMm) + (EDGE_PX * 2);
        let svg = '';

        svg += `<rect x="1" y="10" width="${Math.max(1, widthPx - 2)}" height="46" rx="3" fill="#f7e7a6" stroke="#8e7d44" stroke-width="1.2"></rect>`;
        svg += `<line x1="${EDGE_PX}" y1="${BASELINE_Y}" x2="${Math.max(EDGE_PX, widthPx - EDGE_PX)}" y2="${BASELINE_Y}" stroke="#2f2f2f" stroke-width="1.2"></line>`;

        for (let mm = 0; mm <= lengthMm; mm++) {
            const x = mmToPx(mm) + EDGE_PX;
            const isCm = mm % 10 === 0;
            const isHalfCm = mm % 5 === 0;
            const tickTop = isCm ? 14 : (isHalfCm ? 23 : 30);
            const tickWidth = isCm ? 1.3 : 1;
            svg += `<line x1="${x}" y1="${tickTop}" x2="${x}" y2="${BASELINE_Y}" stroke="#1f1f1f" stroke-width="${tickWidth}"></line>`;
            if (isCm) {
                const label = Math.floor(mm / 10);
                svg += `<text x="${x}" y="64" font-size="9" text-anchor="middle" fill="#1f1f1f" font-family="Arial, sans-serif">${label}</text>`;
            }
        }

        svg += `<text x="${EDGE_PX + 6}" y="19" font-size="9" fill="#2d2d2d" font-family="Arial, sans-serif">mm / cm</text>`;
        return { widthPx, markup: svg };
    }

    function renderRealRegua(componentEl, opts = {}) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        const wrap = componentEl.querySelector('.real-regua-wrap');
        const svg = componentEl.querySelector('.real-regua-svg');
        const lengthInput = componentEl.querySelector('.regua-length-input');
        const markerEl = componentEl.querySelector('.real-regua-marker');
        const markerValueEl = componentEl.querySelector('.real-regua-marker-value');
        const markerUnitBtn = componentEl.querySelector('.regua-unit-btn');
        const axisStartEl = componentEl.querySelector('.real-regua-axis-start');
        const axisEndEl = componentEl.querySelector('.real-regua-axis-end');
        const zeroGuide = componentEl.querySelector('.real-regua-zero-guide');
        if (!wrap || !svg) return;

        const lengthMm = normalizeLengthMm(componentEl.dataset.reguaLengthMm);
        const angle = normalizeAngle(componentEl.dataset.reguaAngle);
        const markerMm = normalizeMarkerMm(componentEl.dataset.reguaMarkerMm, lengthMm);
        const displayUnit = normalizeDisplayUnit(componentEl.dataset.reguaDisplayUnit);
        componentEl.dataset.reguaLengthMm = String(lengthMm);
        componentEl.dataset.reguaAngle = String(angle);
        componentEl.dataset.reguaMarkerMm = String(markerMm);
        componentEl.dataset.reguaDisplayUnit = displayUnit;
        componentEl.style.setProperty('--regua-axis-y', `${BASELINE_Y}px`);
        componentEl.style.setProperty('--regua-guide-half', `${Math.max(BASELINE_Y + 8, 56)}px`);

        const { widthPx, markup } = buildRulerSvg(lengthMm);
        wrap.style.width = `${widthPx}px`;
        wrap.style.height = `${SVG_HEIGHT}px`;
        wrap.style.transform = `rotate(${angle}deg)`;
        wrap.style.transformOrigin = 'left top';

        svg.setAttribute('width', String(widthPx));
        svg.setAttribute('height', String(SVG_HEIGHT));
        svg.setAttribute('viewBox', `0 0 ${widthPx} ${SVG_HEIGHT}`);
        svg.innerHTML = markup;

        if (lengthInput) lengthInput.value = String(lengthMm);
        if (axisStartEl) {
            axisStartEl.style.left = `${EDGE_PX}px`;
            axisStartEl.style.top = `${BASELINE_Y}px`;
        }
        if (axisEndEl) {
            axisEndEl.style.left = `${EDGE_PX + mmToPx(lengthMm)}px`;
            axisEndEl.style.top = `${BASELINE_Y}px`;
        }
        if (zeroGuide) {
            zeroGuide.style.left = `${EDGE_PX}px`;
        }
        if (markerEl) {
            markerEl.style.left = `${EDGE_PX + mmToPx(markerMm)}px`;
        }
        if (markerValueEl) {
            markerValueEl.textContent = formatMeasurement(markerMm, displayUnit);
        }
        if (markerUnitBtn) {
            markerUnitBtn.textContent = displayUnit.toUpperCase();
        }
        componentEl.querySelectorAll('.regua-angle-btn').forEach(btn => {
            const btnAngle = normalizeAngle(btn.dataset.angle);
            btn.classList.toggle('active', btnAngle === angle);
        });
        if (!opts.skipCheckpoint && typeof window.scheduleHistoryCheckpoint === 'function') {
            // Sem checkpoint automÃ¡tico aqui; checkpoints sÃ£o emitidos pelos eventos.
        }
    }

    function commitReguaChange() {
        if (typeof window.scheduleHistoryCheckpoint === 'function') {
            window.scheduleHistoryCheckpoint('real_regua_change');
        }
    }

    function updateMarkerFromClient(componentEl, clientX, clientY, opts = {}) {
        if (!componentEl) return false;
        const axisStart = componentEl.querySelector('.real-regua-axis-start');
        const axisEnd = componentEl.querySelector('.real-regua-axis-end');
        if (!axisStart || !axisEnd) return false;

        const s = axisStart.getBoundingClientRect();
        const e = axisEnd.getBoundingClientRect();
        const p0 = { x: s.left + (s.width / 2), y: s.top + (s.height / 2) };
        const p1 = { x: e.left + (e.width / 2), y: e.top + (e.height / 2) };
        const axis = { x: p1.x - p0.x, y: p1.y - p0.y };
        const len2 = (axis.x * axis.x) + (axis.y * axis.y);
        if (len2 <= 1e-9) return false;

        const v = { x: clientX - p0.x, y: clientY - p0.y };
        let t = ((v.x * axis.x) + (v.y * axis.y)) / len2;
        t = clamp(t, 0, 1);
        const lengthMm = normalizeLengthMm(componentEl.dataset.reguaLengthMm);
        const markerMm = t * lengthMm;

        componentEl.dataset.reguaMarkerMm = String(markerMm);
        renderRealRegua(componentEl, { skipCheckpoint: true });
        if (opts.commit) commitReguaChange();
        return true;
    }

    function bindRealRegua(componentEl) {
        if (!componentEl || componentEl._realReguaBound) return;
        componentEl._realReguaBound = true;

        const controls = componentEl.querySelector('.real-regua-controls');
        const wrap = componentEl.querySelector('.real-regua-wrap');
        const markerEl = componentEl.querySelector('.real-regua-marker');
        const unitBtn = componentEl.querySelector('.regua-unit-btn');
        if (!controls) return;

        controls.addEventListener('pointerdown', e => e.stopPropagation());
        controls.addEventListener('mousedown', e => e.stopPropagation());
        controls.addEventListener('dblclick', e => e.stopPropagation());

        controls.querySelectorAll('.regua-angle-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                componentEl.dataset.reguaAngle = String(normalizeAngle(btn.dataset.angle));
                renderRealRegua(componentEl);
                commitReguaChange();
            });
        });

        controls.querySelectorAll('.regua-length-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const step = parseFloat(btn.dataset.step);
                const current = normalizeLengthMm(componentEl.dataset.reguaLengthMm);
                componentEl.dataset.reguaLengthMm = String(normalizeLengthMm(current + step));
                renderRealRegua(componentEl);
                commitReguaChange();
            });
        });

        if (unitBtn) {
            unitBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const current = normalizeDisplayUnit(componentEl.dataset.reguaDisplayUnit);
                componentEl.dataset.reguaDisplayUnit = current === 'cm' ? 'mm' : 'cm';
                renderRealRegua(componentEl);
                commitReguaChange();
            });
        }

        const lengthInput = controls.querySelector('.regua-length-input');
        if (lengthInput) {
            const applyLength = () => {
                componentEl.dataset.reguaLengthMm = String(normalizeLengthMm(lengthInput.value));
                renderRealRegua(componentEl);
                commitReguaChange();
            };
            lengthInput.addEventListener('click', e => e.stopPropagation());
            lengthInput.addEventListener('keydown', e => {
                e.stopPropagation();
                if (e.key === 'Enter') applyLength();
            });
            lengthInput.addEventListener('change', applyLength);
            lengthInput.addEventListener('blur', applyLength);
        }

        if (markerEl && wrap) {
            markerEl.addEventListener('mousedown', e => e.stopPropagation());
            markerEl.addEventListener('dblclick', e => e.stopPropagation());
            markerEl.addEventListener('click', e => e.stopPropagation());

            let markerDragging = false;
            let markerPointerId = null;
            let moved = false;
            let startMm = 0;

            const onMove = (e) => {
                if (!markerDragging || e.pointerId !== markerPointerId) return;
                moved = true;
                updateMarkerFromClient(componentEl, e.clientX, e.clientY, { commit: false });
            };
            const onUp = (e) => {
                if (!markerDragging || e.pointerId !== markerPointerId) return;
                markerDragging = false;
                markerPointerId = null;
                window.removeEventListener('pointermove', onMove, true);
                window.removeEventListener('pointerup', onUp, true);
                window.removeEventListener('pointercancel', onUp, true);
                try {
                    if (typeof markerEl.releasePointerCapture === 'function') {
                        markerEl.releasePointerCapture(e.pointerId);
                    }
                } catch (_) {}
                const endMm = parseFloat(componentEl.dataset.reguaMarkerMm || '0') || 0;
                if (moved || Math.abs(endMm - startMm) > 0.001) commitReguaChange();
            };

            markerEl.addEventListener('pointerdown', e => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                try {
                    if (typeof markerEl.setPointerCapture === 'function') {
                        markerEl.setPointerCapture(e.pointerId);
                    }
                } catch (_) {}
                markerDragging = true;
                markerPointerId = e.pointerId;
                moved = false;
                startMm = parseFloat(componentEl.dataset.reguaMarkerMm || '0') || 0;
                updateMarkerFromClient(componentEl, e.clientX, e.clientY, { commit: false });
                window.addEventListener('pointermove', onMove, true);
                window.addEventListener('pointerup', onUp, true);
                window.addEventListener('pointercancel', onUp, true);
            });
        }
    }

    window.initRealReguaMilimetradaComponent = function (componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        bindRealRegua(componentEl);
        renderRealRegua(componentEl);
    };

    window.refreshRealReguaMilimetradaComponent = function (componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        renderRealRegua(componentEl);
    };

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Régua mm/cm',
        icone: 'fa-ruler-horizontal',
        tipo: 'instrumento',
        tagDefault: 'RG1',
        foto: './componentes/real_regua_milimetrada/preview.svg',
        html: () => `
            <div class="real-regua-root" style="position:relative;">
                <div class="real-regua-controls">
                    <button type="button" class="regua-control-btn regua-angle-btn" data-angle="0">0deg</button>
                    <button type="button" class="regua-control-btn regua-angle-btn" data-angle="45">45deg</button>
                    <button type="button" class="regua-control-btn regua-angle-btn" data-angle="90">90deg</button>
                    <button type="button" class="regua-control-btn regua-angle-btn" data-angle="180">180deg</button>
                    <button type="button" class="regua-control-btn regua-angle-btn" data-angle="270">270deg</button>
                    <span class="regua-controls-sep"></span>
                    <button type="button" class="regua-control-btn regua-length-btn" data-step="-10">-10</button>
                    <input class="regua-length-input" type="number" min="${MIN_LENGTH_MM}" max="${MAX_LENGTH_MM}" step="1" value="${DEFAULT_LENGTH_MM}" aria-label="Comprimento da regua em milimetros">
                    <span class="regua-mm-label">mm</span>
                    <button type="button" class="regua-control-btn regua-length-btn" data-step="10">+10</button>
                    <button type="button" class="regua-control-btn regua-unit-btn" title="Alternar unidade do display">MM</button>
                </div>
                <div class="real-regua-wrap">
                    <svg class="real-regua-svg" role="img" aria-label="Regua em milimetros e centimetros"></svg>
                    <div class="real-regua-axis-start" aria-hidden="true"></div>
                    <div class="real-regua-axis-end" aria-hidden="true"></div>
                    <div class="real-regua-zero-guide" aria-hidden="true"></div>
                    <div class="real-regua-marker" aria-label="Marcador de medicao">
                        <div class="real-regua-marker-display">
                            <span class="real-regua-marker-value">0.0 mm</span>
                        </div>
                        <div class="real-regua-marker-head" aria-hidden="true"></div>
                        <div class="real-regua-marker-guide" aria-hidden="true"></div>
                    </div>
                </div>
            </div>
        `
    };
})();




