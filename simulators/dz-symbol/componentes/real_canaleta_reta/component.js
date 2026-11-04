(function () {
    const LIB_KEY = 'real_canaleta_reta';
    const DEFAULT_LENGTH_MM = 160;
    const MIN_LENGTH_MM = 40;
    const MAX_LENGTH_MM = 2000;
    const PX_PER_MM = 3.77;
    const DEFAULT_WIDTH_MM = 30;
    const MIN_WIDTH_MM = 10;
    const MAX_WIDTH_MM = 80;
    const GRID_PX = 10;
    const GUIDE_EXTENT_PX = 5000;
    const ALLOWED_ANGLES = [0, 90, 180, 270];
    const GROUP_TOUCH_TOLERANCE_PX = 14;
    const CANALETA_COLORS = {
        base: '#8ea2a8',
        channel: '#a7b8bd',
        cover: '#7f949b',
        coverCenter: '#8da2a8',
        edgeShadow: '#5f757b',
        slot: '#21383d',
        slotStroke: '#d4dde0',
        highlight: '#c7d3d7'
    };

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeLength(value) {
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) return DEFAULT_LENGTH_MM;
        return clamp(Math.round(parsed), MIN_LENGTH_MM, MAX_LENGTH_MM);
    }

    function normalizeWidth(value) {
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) return DEFAULT_WIDTH_MM;
        return clamp(Math.round(parsed), MIN_WIDTH_MM, MAX_WIDTH_MM);
    }

    function normalizeAngle(value) {
        const parsed = parseFloat(value);
        if (!Number.isFinite(parsed)) return 0;
        const normalized = ((Math.round(parsed / 90) * 90) % 360 + 360) % 360;
        return ALLOWED_ANGLES.includes(normalized) ? normalized : 0;
    }

    function mmToPx(mm) {
        return Math.round(mm * PX_PER_MM * 1000) / 1000;
    }

    function mmToGridPx(mm) {
        return Math.max(GRID_PX, Math.round(mmToPx(mm) / GRID_PX) * GRID_PX);
    }

    function mmToCenterGridPx(mm) {
        const centerGrid = GRID_PX * 2;
        return Math.max(centerGrid, Math.round(mmToPx(mm) / centerGrid) * centerGrid);
    }

    function nextAngle(value) {
        return (normalizeAngle(value) + 90) % 360;
    }

    function ensureStyle() {
        if (document.getElementById('real-canaleta-style')) return;
        const style = document.createElement('style');
        style.id = 'real-canaleta-style';
        style.textContent = `
.component[data-lib="real_canaleta_reta"],
.component[data-lib="real_canaleta_canto_90"] {
    z-index: 0 !important;
}
.component[data-lib="real_canaleta_reta"][data-canaleta-covered="true"],
.component[data-lib="real_canaleta_canto_90"][data-canaleta-covered="true"] {
    z-index: 90 !important;
}
.component.component-selected[data-lib="real_canaleta_reta"],
.component.component-selected[data-lib="real_canaleta_canto_90"] {
    z-index: 0 !important;
}
.component.component-selected[data-lib="real_canaleta_reta"][data-canaleta-covered="true"],
.component.component-selected[data-lib="real_canaleta_canto_90"][data-canaleta-covered="true"] {
    z-index: 90 !important;
}
.component[data-lib="real_canaleta_reta"] > .tag-label,
.component[data-lib="real_canaleta_canto_90"] > .tag-label {
    display: none !important;
}
.component.component-selected[data-lib="real_canaleta_reta"]::before,
.component.component-selected[data-lib="real_canaleta_canto_90"]::before {
    display: none;
}
.real-canaleta-root {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    user-select: none;
}
.real-canaleta-controls {
    position: absolute;
    left: 0;
    top: -32px;
    z-index: 10050;
    display: none;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    padding: 2px 3px;
    border-radius: 5px;
    background: rgba(238, 244, 248, 0.92);
    box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.real-canaleta-controls.canaleta-controls-floating {
    position: fixed;
    z-index: 20060;
    display: flex !important;
    pointer-events: auto;
}
.component:not(.component-selected) .real-canaleta-controls {
    display: none !important;
}
.component.component-selected[data-lib="real_canaleta_reta"] .real-canaleta-controls,
.component.component-selected[data-lib="real_canaleta_canto_90"] .real-canaleta-controls {
    display: flex !important;
}
.canaleta-control-btn {
    min-width: 28px;
    height: 22px;
    border: 1px solid #9aa8b0;
    border-radius: 4px;
    background: #f6fafc;
    color: #24323a;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
}
.canaleta-control-btn:hover {
    background: #e1edf3;
}
.canaleta-control-btn.active {
    background: #1d8cff;
    border-color: #1d8cff;
    color: #fff;
}
.canaleta-cover-btn.active {
    background: #5f6d73;
    border-color: #4a555a;
    color: #fff;
}
.canaleta-cover-group-btn {
    min-width: 30px;
}
.canaleta-length-input {
    width: 58px;
    height: 22px;
    border: 1px solid #9aa8b0;
    border-radius: 4px;
    background: #fff;
    color: #24323a;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 4px;
}
.canaleta-width-input {
    width: 46px;
    height: 22px;
    border: 1px solid #9aa8b0;
    border-radius: 4px;
    background: #fff;
    color: #24323a;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 4px;
}
.canaleta-mm-label {
    font-size: 10px;
    color: #24323a;
    font-weight: 700;
}
.real-canaleta-wrap {
    position: relative;
    display: inline-block;
    transform-origin: left top;
    overflow: visible;
}
.component.component-selected .real-canaleta-wrap::after {
    content: '';
    position: absolute;
    inset: -3px;
    border: 2px dashed #1d8cff;
    border-radius: 4px;
    pointer-events: none;
}
.real-canaleta-svg {
    display: block;
    overflow: visible;
}
.real-canaleta-guide {
    display: none;
    stroke: rgba(29, 140, 255, 0.82);
    stroke-width: 1.2;
    stroke-dasharray: 5 5;
    pointer-events: none;
}
.component:not(.component-selected) .real-canaleta-guide {
    display: none !important;
}
.component.component-selected .real-canaleta-guide {
    display: block !important;
}
`;
        document.head.appendChild(style);
    }

    function getControls(componentEl) {
        return componentEl?._realCanaletaControls || componentEl?.querySelector?.('.real-canaleta-controls') || null;
    }

    function positionFloatingControls(componentEl) {
        const controls = getControls(componentEl);
        if (!componentEl || !controls || !controls.classList.contains('canaleta-controls-floating')) return;
        if (!componentEl.isConnected) {
            controls.remove();
            return;
        }
        const rect = componentEl.getBoundingClientRect();
        const width = controls.offsetWidth || 0;
        const height = controls.offsetHeight || 0;
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        const top = Math.max(8, rect.top - height - 6);
        controls.style.left = `${Math.round(left)}px`;
        controls.style.top = `${Math.round(top)}px`;
    }

    function syncControlsPortal(componentEl) {
        const controls = getControls(componentEl);
        if (!componentEl || !controls) return;
        const selected = componentEl.classList.contains('component-selected');
        if (selected) {
            if (controls.parentElement !== document.body) document.body.appendChild(controls);
            controls.classList.add('canaleta-controls-floating');
            controls.style.display = 'flex';
            requestAnimationFrame(() => positionFloatingControls(componentEl));
            return;
        }
        controls.classList.remove('canaleta-controls-floating');
        controls.style.left = '';
        controls.style.top = '';
        controls.style.display = '';
        const root = componentEl.querySelector('.real-canaleta-root');
        if (root && controls.parentElement !== root) root.insertBefore(controls, root.firstChild);
    }

    function isCanaleta(componentEl) {
        const lib = String(componentEl?.dataset?.lib || '');
        return lib === 'real_canaleta_reta' || lib === 'real_canaleta_canto_90';
    }

    function getCanaletaRect(componentEl) {
        const wrap = componentEl?.querySelector?.('.real-canaleta-wrap');
        return wrap?.getBoundingClientRect?.() || componentEl?.getBoundingClientRect?.() || null;
    }

    function rectsTouchOrNearlyTouch(a, b) {
        if (!a || !b) return false;
        return !(
            a.right + GROUP_TOUCH_TOLERANCE_PX < b.left ||
            b.right + GROUP_TOUCH_TOLERANCE_PX < a.left ||
            a.bottom + GROUP_TOUCH_TOLERANCE_PX < b.top ||
            b.bottom + GROUP_TOUCH_TOLERANCE_PX < a.top
        );
    }

    function getTouchingCanaletaGroup(startEl) {
        if (!isCanaleta(startEl)) return [];
        const all = Array.from(document.querySelectorAll('.component[data-lib="real_canaleta_reta"], .component[data-lib="real_canaleta_canto_90"]'));
        const queue = [startEl];
        const group = new Set([startEl]);
        while (queue.length) {
            const current = queue.shift();
            const currentRect = getCanaletaRect(current);
            all.forEach(candidate => {
                if (group.has(candidate)) return;
                if (!rectsTouchOrNearlyTouch(currentRect, getCanaletaRect(candidate))) return;
                group.add(candidate);
                queue.push(candidate);
            });
        }
        return Array.from(group);
    }

    function refreshCanaletaComponent(componentEl) {
        const lib = String(componentEl?.dataset?.lib || '');
        if (lib === 'real_canaleta_reta' && typeof window.refreshRealCanaletaRetaComponent === 'function') {
            window.refreshRealCanaletaRetaComponent(componentEl);
            return;
        }
        if (lib === 'real_canaleta_canto_90' && typeof window.refreshRealCanaletaCanto90Component === 'function') {
            window.refreshRealCanaletaCanto90Component(componentEl);
        }
    }

    function setTouchingCanaletasCovered(componentEl) {
        const covered = String(componentEl?.dataset?.canaletaCovered || '').toLowerCase() === 'true';
        const nextCovered = !covered;
        getTouchingCanaletaGroup(componentEl).forEach(canaleta => {
            canaleta.dataset.canaletaCovered = nextCovered ? 'true' : 'false';
            refreshCanaletaComponent(canaleta);
        });
        commit();
    }

    function buildStraightSvg(lengthMm, widthMm, covered) {
        const width = Math.max(GRID_PX * 9, mmToGridPx(lengthMm));
        const h = Math.max(GRID_PX * 4, mmToCenterGridPx(widthMm));
        const slotW = clamp(Math.round(h * 0.38), 18, 34);
        const slotH = clamp(Math.round(h * 0.13), 6, 11);
        const gap = Math.max(24, Math.round(h * 0.34));
        const y = (h - slotH) / 2;
        const inset = clamp(Math.round(h * 0.09), 4, 8);
        const wallLineTop = Math.max(2, inset / 2);
        const wallLineBottom = h - wallLineTop;
        let slots = '';
        for (let x = 18; x + slotW <= width - 18; x += slotW + gap) {
            slots += `<rect x="${x}" y="${y}" width="${slotW}" height="${slotH}" rx="3.5" fill="${CANALETA_COLORS.highlight}" stroke="${CANALETA_COLORS.edgeShadow}" stroke-width="0.7"></rect>`;
        }
        return {
            width,
            height: h,
            markup: `
                <rect x="-0.5" y="0" width="${width + 1}" height="${h}" rx="0" fill="${CANALETA_COLORS.base}"></rect>
                <rect x="-0.5" y="${inset}" width="${width + 1}" height="${Math.max(1, h - (inset * 2))}" rx="0" fill="${CANALETA_COLORS.channel}"></rect>
                ${slots}
                ${covered ? `
                    <rect x="-1" y="0" width="${width + 2}" height="${h}" rx="0" fill="${CANALETA_COLORS.cover}"></rect>
                    <rect x="-1" y="${inset}" width="${width + 2}" height="${Math.max(1, h - (inset * 2))}" rx="1" fill="${CANALETA_COLORS.coverCenter}"></rect>
                ` : ''}
                <line x1="-0.5" y1="1" x2="${width + 0.5}" y2="1" stroke="${CANALETA_COLORS.highlight}" stroke-width="1"></line>
                <line x1="-0.5" y1="${h - 1}" x2="${width + 0.5}" y2="${h - 1}" stroke="${CANALETA_COLORS.edgeShadow}" stroke-width="1"></line>
                ${covered ? '' : `
                    <line x1="-0.5" y1="${wallLineTop}" x2="${width + 0.5}" y2="${wallLineTop}" stroke="${CANALETA_COLORS.edgeShadow}" stroke-width="2.2" stroke-dasharray="10 8"></line>
                    <line x1="-0.5" y1="${wallLineBottom}" x2="${width + 0.5}" y2="${wallLineBottom}" stroke="${CANALETA_COLORS.edgeShadow}" stroke-width="2.2" stroke-dasharray="10 8"></line>
                `}
                <line class="real-canaleta-guide" x1="${-GUIDE_EXTENT_PX}" y1="${h / 2}" x2="${GUIDE_EXTENT_PX}" y2="${h / 2}"></line>
                <line class="real-canaleta-guide" x1="0" y1="${-GUIDE_EXTENT_PX}" x2="0" y2="${GUIDE_EXTENT_PX}"></line>
                <line class="real-canaleta-guide" x1="${width}" y1="${-GUIDE_EXTENT_PX}" x2="${width}" y2="${GUIDE_EXTENT_PX}"></line>
            `
        };
    }

    function render(componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        ensureStyle();
        const length = normalizeLength(componentEl.dataset.canaletaLengthMm);
        const channelWidth = normalizeWidth(componentEl.dataset.canaletaWidthMm);
        const angle = normalizeAngle(componentEl.dataset.canaletaAngle);
        const covered = String(componentEl.dataset.canaletaCovered || '').toLowerCase() === 'true';
        componentEl.dataset.canaletaLengthMm = String(length);
        componentEl.dataset.canaletaWidthMm = String(channelWidth);
        componentEl.dataset.canaletaAngle = String(angle);
        componentEl.dataset.canaletaCovered = covered ? 'true' : 'false';

        const wrap = componentEl.querySelector('.real-canaleta-wrap');
        const svg = componentEl.querySelector('.real-canaleta-svg');
        const controls = getControls(componentEl);
        const input = controls?.querySelector('.canaleta-length-input') || null;
        const widthInput = controls?.querySelector('.canaleta-width-input') || null;
        if (!wrap || !svg) return;

        const built = buildStraightSvg(length, channelWidth, covered);
        wrap.style.width = `${built.width}px`;
        wrap.style.height = `${built.height}px`;
        wrap.style.transform = `rotate(${angle}deg)`;
        svg.setAttribute('width', String(built.width));
        svg.setAttribute('height', String(built.height));
        svg.setAttribute('viewBox', `0 0 ${built.width} ${built.height}`);
        svg.innerHTML = built.markup;
        if (input) input.value = String(length);
        if (widthInput) widthInput.value = String(channelWidth);
        const rotateBtn = controls?.querySelector('.canaleta-rotate-btn') || null;
        if (rotateBtn) rotateBtn.title = `Girar canaleta (${angle}deg)`;
        const coverBtn = controls?.querySelector('.canaleta-cover-btn') || null;
        if (coverBtn) {
            coverBtn.classList.toggle('active', covered);
            coverBtn.title = covered ? 'Destampar canaleta' : 'Tampar canaleta';
        }
        const coverGroupBtn = controls?.querySelector('.canaleta-cover-group-btn') || null;
        if (coverGroupBtn) {
            coverGroupBtn.classList.toggle('active', covered);
            coverGroupBtn.title = covered ? 'Destampar canaletas próximas' : 'Tampar canaletas próximas';
        }
        syncControlsPortal(componentEl);
    }

    function commit() {
        if (typeof window.scheduleHistoryCheckpoint === 'function') {
            window.scheduleHistoryCheckpoint('real_canaleta_change');
        }
    }

    function bind(componentEl) {
        if (!componentEl || componentEl._realCanaletaBound) return;
        componentEl._realCanaletaBound = true;
        const controls = componentEl.querySelector('.real-canaleta-controls');
        if (!controls) return;
        componentEl._realCanaletaControls = controls;
        const observer = new MutationObserver(() => syncControlsPortal(componentEl));
        observer.observe(componentEl, { attributes: true, attributeFilter: ['class'] });
        componentEl._realCanaletaObserver = observer;
        ['scroll', 'resize'].forEach(evt => {
            window.addEventListener(evt, () => positionFloatingControls(componentEl), true);
        });
        ['pointerdown', 'mousedown', 'click', 'dblclick'].forEach(evt => {
            controls.addEventListener(evt, e => e.stopPropagation());
        });
        const rotateBtn = controls.querySelector('.canaleta-rotate-btn');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                componentEl.dataset.canaletaAngle = String(nextAngle(componentEl.dataset.canaletaAngle));
                render(componentEl);
                commit();
            });
        }
        const coverBtn = controls.querySelector('.canaleta-cover-btn');
        if (coverBtn) {
            coverBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const covered = String(componentEl.dataset.canaletaCovered || '').toLowerCase() === 'true';
                componentEl.dataset.canaletaCovered = covered ? 'false' : 'true';
                render(componentEl);
                commit();
            });
        }
        const coverGroupBtn = controls.querySelector('.canaleta-cover-group-btn');
        if (coverGroupBtn) {
            coverGroupBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                setTouchingCanaletasCovered(componentEl);
            });
        }
        controls.querySelectorAll('.canaleta-length-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const step = parseFloat(btn.dataset.step || '0') || 0;
                componentEl.dataset.canaletaLengthMm = String(normalizeLength(normalizeLength(componentEl.dataset.canaletaLengthMm) + step));
                render(componentEl);
                commit();
            });
        });
        const input = controls.querySelector('.canaleta-length-input');
        if (input) {
            const apply = () => {
                componentEl.dataset.canaletaLengthMm = String(normalizeLength(input.value));
                render(componentEl);
                commit();
            };
            input.addEventListener('keydown', e => {
                e.stopPropagation();
                if (e.key === 'Enter') apply();
            });
            input.addEventListener('change', apply);
            input.addEventListener('blur', apply);
        }
        const widthInput = controls.querySelector('.canaleta-width-input');
        if (widthInput) {
            const applyWidth = () => {
                componentEl.dataset.canaletaWidthMm = String(normalizeWidth(widthInput.value));
                render(componentEl);
                commit();
            };
            widthInput.addEventListener('keydown', e => {
                e.stopPropagation();
                if (e.key === 'Enter') applyWidth();
            });
            widthInput.addEventListener('change', applyWidth);
            widthInput.addEventListener('blur', applyWidth);
        }
    }

    function mount(componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        ensureStyle();
        bind(componentEl);
        render(componentEl);
    }

    window.initRealCanaletaRetaComponent = mount;
    window.refreshRealCanaletaRetaComponent = render;

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Canaleta reta',
        icone: 'fa-grip-lines',
        tipo: 'acessorio',
        tagDefault: 'CN1',
        foto: './componentes/real_canaleta_reta/preview.svg',
        html: () => `
            <div class="real-canaleta-root">
                <div class="real-canaleta-controls">
                    <button type="button" class="canaleta-control-btn canaleta-rotate-btn" title="Girar canaleta"><i class="fa-solid fa-rotate-right"></i></button>
                    <button type="button" class="canaleta-control-btn canaleta-cover-btn" title="Tampar canaleta"><i class="fa-solid fa-box"></i></button>
                    <button type="button" class="canaleta-control-btn canaleta-cover-group-btn" title="Tampar canaletas próximas"><i class="fa-solid fa-layer-group"></i></button>
                    <button type="button" class="canaleta-control-btn canaleta-length-btn" data-step="-20">-20</button>
                    <input class="canaleta-length-input" type="number" min="${MIN_LENGTH_MM}" max="${MAX_LENGTH_MM}" step="1" value="${DEFAULT_LENGTH_MM}" aria-label="Comprimento da canaleta">
                    <span class="canaleta-mm-label">mm</span>
                    <button type="button" class="canaleta-control-btn canaleta-length-btn" data-step="20">+20</button>
                    <span class="canaleta-mm-label">L</span>
                    <input class="canaleta-width-input" type="number" min="${MIN_WIDTH_MM}" max="${MAX_WIDTH_MM}" step="1" value="${DEFAULT_WIDTH_MM}" aria-label="Largura da canaleta">
                </div>
                <div class="real-canaleta-wrap">
                    <svg class="real-canaleta-svg" role="img" aria-label="Canaleta reta"></svg>
                </div>
            </div>
        `,
        mountComponent: mount,
        exportData: (componentEl) => ({
            canaletaLengthMm: normalizeLength(componentEl?.dataset?.canaletaLengthMm),
            canaletaWidthMm: normalizeWidth(componentEl?.dataset?.canaletaWidthMm),
            canaletaAngle: normalizeAngle(componentEl?.dataset?.canaletaAngle),
            canaletaCovered: String(componentEl?.dataset?.canaletaCovered || '').toLowerCase() === 'true'
        }),
        importData: (componentEl, payload) => {
            if (!componentEl || !payload) return;
            componentEl.dataset.canaletaLengthMm = String(normalizeLength(payload.canaletaLengthMm));
            componentEl.dataset.canaletaWidthMm = String(normalizeWidth(payload.canaletaWidthMm));
            componentEl.dataset.canaletaAngle = String(normalizeAngle(payload.canaletaAngle));
            componentEl.dataset.canaletaCovered = payload.canaletaCovered ? 'true' : 'false';
            mount(componentEl);
        }
    };
})();
