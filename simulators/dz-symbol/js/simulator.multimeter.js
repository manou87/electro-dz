(() => {
    const cfg = window.RESIDENCIAL_MULTIMETRO_COMPONENT || {
        assets: {
            body: 'componentes/multimetro/multimetro.webp',
            probeBlack: 'componentes/multimetro/ponteira_preta.webp',
            probeRed: 'componentes/multimetro/ponteira_vermelha.webp',
            selector: 'componentes/multimetro/seletor.webp'
        },
        selectorPositions: [
            { key: 'off', label: '', angle: -132 },
            { key: 'volt', label: '0V', angle: -82 },
            { key: 'cont', label: ')))', angle: 46 }
        ]
    };

    const VARS = Object.freeze({
        globalScale: '--multimeter-global-scale',
        selectorLeft: '--multimeter-selector-left',
        selectorTop: '--multimeter-selector-top',
        selectorScale: '--multimeter-selector-scale',
        offAngle: '--multimeter-off-angle',
        voltAngle: '--multimeter-volt-angle',
        contAngle: '--multimeter-cont-angle',
        displayLeft: '--multimeter-display-left',
        displayTop: '--multimeter-display-top',
        displayWidth: '--multimeter-display-width',
        displayHeight: '--multimeter-display-height',
        offLeft: '--multimeter-off-left',
        offTop: '--multimeter-off-top',
        offWidth: '--multimeter-off-width',
        offHeight: '--multimeter-off-height',
        voltLeft: '--multimeter-volt-left',
        voltTop: '--multimeter-volt-top',
        voltWidth: '--multimeter-volt-width',
        voltHeight: '--multimeter-volt-height',
        contLeft: '--multimeter-cont-left',
        contTop: '--multimeter-cont-top',
        contWidth: '--multimeter-cont-width',
        contHeight: '--multimeter-cont-height',
        plugBlackX: '--multimeter-plug-black-x',
        plugBlackY: '--multimeter-plug-black-y',
        plugRedX: '--multimeter-plug-red-x',
        plugRedY: '--multimeter-plug-red-y',
        probeBlackX: '--multimeter-probe-black-x',
        probeBlackY: '--multimeter-probe-black-y',
        probeRedX: '--multimeter-probe-red-x',
        probeRedY: '--multimeter-probe-red-y',
        probeBlackTipX: '--multimeter-probe-black-tip-x',
        probeBlackTipY: '--multimeter-probe-black-tip-y',
        probeRedTipX: '--multimeter-probe-red-tip-x',
        probeRedTipY: '--multimeter-probe-red-tip-y',
        probeTipRadius: '--multimeter-probe-tip-radius'
    });

    const defaultTuning = {
        globalScale: 0.82,
        selectorLeft: 24.3,
        selectorTop: 31.7,
        selectorScale: 1,
        offAngle: -132,
        voltAngle: -82,
        contAngle: 46,
        displayLeft: 22,
        displayTop: 16.2,
        displayWidth: 56,
        displayHeight: 8.2,
        offLeft: 33,
        offTop: 38,
        offWidth: 12,
        offHeight: 9,
        voltLeft: 43,
        voltTop: 36.5,
        voltWidth: 15,
        voltHeight: 12,
        contLeft: 63,
        contTop: 56,
        contWidth: 12,
        contHeight: 11,
        plugBlackX: 104,
        plugBlackY: 251,
        plugRedX: 134,
        plugRedY: 251,
        probeBlackX: 18,
        probeBlackY: 140,
        probeRedX: 19,
        probeRedY: 140,
        probeBlackTipX: 17,
        probeBlackTipY: 8,
        probeRedTipX: 20,
        probeRedTipY: 8,
        probeTipRadius: 10
    };

    const state = {
        mounted: false,
        visible: false,
        mode: cfg.selectorPositions[0]?.key || 'off',
        meter: { x: 920, y: 460 },
        probes: {
            red: { x: 1220, y: 660 },
            black: { x: 760, y: 660 }
        },
        drag: null,
        spawned: false,
        tuning: loadTuningFromRoot(),
        contacts: {
            red: null,
            black: null
        },
        continuityClosed: false,
        continuityUnsafe: false,
        continuityWarningLatched: false
    };

    let refs = null;
    let syncTimer = null;
    let continuityBeepTimer = null;
    let engineeringPatched = false;
    const nodeIdentityMap = new WeakMap();
    let nextNodeIdentity = 1;

    function rootVar(name) {
        return String(getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim();
    }

    function parseUnitValue(raw, fallback) {
        const parsed = parseFloat(String(raw || '').trim());
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function loadTuningFromRoot() {
        return {
            globalScale: parseUnitValue(rootVar(VARS.globalScale), defaultTuning.globalScale),
            selectorLeft: parseUnitValue(rootVar(VARS.selectorLeft), defaultTuning.selectorLeft),
            selectorTop: parseUnitValue(rootVar(VARS.selectorTop), defaultTuning.selectorTop),
            selectorScale: parseUnitValue(rootVar(VARS.selectorScale), defaultTuning.selectorScale),
            offAngle: parseUnitValue(rootVar(VARS.offAngle), defaultTuning.offAngle),
            voltAngle: parseUnitValue(rootVar(VARS.voltAngle), defaultTuning.voltAngle),
            contAngle: parseUnitValue(rootVar(VARS.contAngle), defaultTuning.contAngle),
            displayLeft: parseUnitValue(rootVar(VARS.displayLeft), defaultTuning.displayLeft),
            displayTop: parseUnitValue(rootVar(VARS.displayTop), defaultTuning.displayTop),
            displayWidth: parseUnitValue(rootVar(VARS.displayWidth), defaultTuning.displayWidth),
            displayHeight: parseUnitValue(rootVar(VARS.displayHeight), defaultTuning.displayHeight),
            offLeft: parseUnitValue(rootVar(VARS.offLeft), defaultTuning.offLeft),
            offTop: parseUnitValue(rootVar(VARS.offTop), defaultTuning.offTop),
            offWidth: parseUnitValue(rootVar(VARS.offWidth), defaultTuning.offWidth),
            offHeight: parseUnitValue(rootVar(VARS.offHeight), defaultTuning.offHeight),
            voltLeft: parseUnitValue(rootVar(VARS.voltLeft), defaultTuning.voltLeft),
            voltTop: parseUnitValue(rootVar(VARS.voltTop), defaultTuning.voltTop),
            voltWidth: parseUnitValue(rootVar(VARS.voltWidth), defaultTuning.voltWidth),
            voltHeight: parseUnitValue(rootVar(VARS.voltHeight), defaultTuning.voltHeight),
            contLeft: parseUnitValue(rootVar(VARS.contLeft), defaultTuning.contLeft),
            contTop: parseUnitValue(rootVar(VARS.contTop), defaultTuning.contTop),
            contWidth: parseUnitValue(rootVar(VARS.contWidth), defaultTuning.contWidth),
            contHeight: parseUnitValue(rootVar(VARS.contHeight), defaultTuning.contHeight),
            plugBlackX: parseUnitValue(rootVar(VARS.plugBlackX), defaultTuning.plugBlackX),
            plugBlackY: parseUnitValue(rootVar(VARS.plugBlackY), defaultTuning.plugBlackY),
            plugRedX: parseUnitValue(rootVar(VARS.plugRedX), defaultTuning.plugRedX),
            plugRedY: parseUnitValue(rootVar(VARS.plugRedY), defaultTuning.plugRedY),
            probeBlackX: parseUnitValue(rootVar(VARS.probeBlackX), defaultTuning.probeBlackX),
            probeBlackY: parseUnitValue(rootVar(VARS.probeBlackY), defaultTuning.probeBlackY),
            probeRedX: parseUnitValue(rootVar(VARS.probeRedX), defaultTuning.probeRedX),
            probeRedY: parseUnitValue(rootVar(VARS.probeRedY), defaultTuning.probeRedY),
            probeBlackTipX: parseUnitValue(rootVar(VARS.probeBlackTipX), defaultTuning.probeBlackTipX),
            probeBlackTipY: parseUnitValue(rootVar(VARS.probeBlackTipY), defaultTuning.probeBlackTipY),
            probeRedTipX: parseUnitValue(rootVar(VARS.probeRedTipX), defaultTuning.probeRedTipX),
            probeRedTipY: parseUnitValue(rootVar(VARS.probeRedTipY), defaultTuning.probeRedTipY),
            probeTipRadius: parseUnitValue(rootVar(VARS.probeTipRadius), defaultTuning.probeTipRadius)
        };
    }

    function pushTuningToRoot() {
        document.documentElement.style.setProperty(VARS.globalScale, `${state.tuning.globalScale}`);
        document.documentElement.style.setProperty(VARS.selectorLeft, `${state.tuning.selectorLeft}%`);
        document.documentElement.style.setProperty(VARS.selectorTop, `${state.tuning.selectorTop}%`);
        document.documentElement.style.setProperty(VARS.selectorScale, `${state.tuning.selectorScale}`);
        document.documentElement.style.setProperty(VARS.offAngle, `${state.tuning.offAngle}`);
        document.documentElement.style.setProperty(VARS.voltAngle, `${state.tuning.voltAngle}`);
        document.documentElement.style.setProperty(VARS.contAngle, `${state.tuning.contAngle}`);
        document.documentElement.style.setProperty(VARS.displayLeft, `${state.tuning.displayLeft}%`);
        document.documentElement.style.setProperty(VARS.displayTop, `${state.tuning.displayTop}%`);
        document.documentElement.style.setProperty(VARS.displayWidth, `${state.tuning.displayWidth}%`);
        document.documentElement.style.setProperty(VARS.displayHeight, `${state.tuning.displayHeight}%`);
        document.documentElement.style.setProperty(VARS.offLeft, `${state.tuning.offLeft}%`);
        document.documentElement.style.setProperty(VARS.offTop, `${state.tuning.offTop}%`);
        document.documentElement.style.setProperty(VARS.offWidth, `${state.tuning.offWidth}%`);
        document.documentElement.style.setProperty(VARS.offHeight, `${state.tuning.offHeight}%`);
        document.documentElement.style.setProperty(VARS.voltLeft, `${state.tuning.voltLeft}%`);
        document.documentElement.style.setProperty(VARS.voltTop, `${state.tuning.voltTop}%`);
        document.documentElement.style.setProperty(VARS.voltWidth, `${state.tuning.voltWidth}%`);
        document.documentElement.style.setProperty(VARS.voltHeight, `${state.tuning.voltHeight}%`);
        document.documentElement.style.setProperty(VARS.contLeft, `${state.tuning.contLeft}%`);
        document.documentElement.style.setProperty(VARS.contTop, `${state.tuning.contTop}%`);
        document.documentElement.style.setProperty(VARS.contWidth, `${state.tuning.contWidth}%`);
        document.documentElement.style.setProperty(VARS.contHeight, `${state.tuning.contHeight}%`);
        document.documentElement.style.setProperty(VARS.plugBlackX, `${state.tuning.plugBlackX}`);
        document.documentElement.style.setProperty(VARS.plugBlackY, `${state.tuning.plugBlackY}`);
        document.documentElement.style.setProperty(VARS.plugRedX, `${state.tuning.plugRedX}`);
        document.documentElement.style.setProperty(VARS.plugRedY, `${state.tuning.plugRedY}`);
        document.documentElement.style.setProperty(VARS.probeBlackX, `${state.tuning.probeBlackX}`);
        document.documentElement.style.setProperty(VARS.probeBlackY, `${state.tuning.probeBlackY}`);
        document.documentElement.style.setProperty(VARS.probeRedX, `${state.tuning.probeRedX}`);
        document.documentElement.style.setProperty(VARS.probeRedY, `${state.tuning.probeRedY}`);
        document.documentElement.style.setProperty(VARS.probeBlackTipX, `${state.tuning.probeBlackTipX}`);
        document.documentElement.style.setProperty(VARS.probeBlackTipY, `${state.tuning.probeBlackTipY}`);
        document.documentElement.style.setProperty(VARS.probeRedTipX, `${state.tuning.probeRedTipX}`);
        document.documentElement.style.setProperty(VARS.probeRedTipY, `${state.tuning.probeRedTipY}`);
        document.documentElement.style.setProperty(VARS.probeTipRadius, `${state.tuning.probeTipRadius}`);
    }

    function is2DActive() {
        return true;
    }

    function isEngineeringModeActive() {
        return document.body.classList.contains('engineering-mode');
    }

    function hasEngineeringSelection() {
        try {
            return typeof getEngineeringSelectedComponent === 'function' && !!getEngineeringSelectedComponent();
        } catch (_) {
            return false;
        }
    }

    function isSheetEngineeringTargetActive() {
        try {
            return typeof engineeringSheetScaleTargetActive !== 'undefined' && !!engineeringSheetScaleTargetActive;
        } catch (_) {
            return false;
        }
    }

    function isMultimeterEngineeringTarget() {
        return !!(state.visible && is2DActive() && isEngineeringModeActive() && !hasEngineeringSelection() && !isSheetEngineeringTargetActive());
    }

    function getZoom() {
        return Number.isFinite(window.zoomLevel) && window.zoomLevel > 0 ? window.zoomLevel : 1;
    }

    function getPanX() {
        return Number.isFinite(window.panX) ? window.panX : 0;
    }

    function getPanY() {
        return Number.isFinite(window.panY) ? window.panY : 0;
    }

    function getViewport() {
        return document.getElementById('viewport');
    }

    function getWorkbench2D() {
        return document.getElementById('bancada') || document.querySelector('.workbench');
    }

    function injectStyles() {
        if (document.getElementById('residencial-multimetro-style')) return;
        const style = document.createElement('style');
        style.id = 'residencial-multimetro-style';
        style.textContent = `
#multimeter-fab {
    position: absolute;
    right: 14px;
    top: 84px;
    width: 60px;
    height: 60px;
    border: 0;
    border-radius: 18px;
    background: linear-gradient(180deg, #1b2735 0%, #101923 100%);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
    cursor: pointer;
    z-index: 2600;
    display: none;
    padding: 8px;
}
#multimeter-fab[data-visible="true"] { display: block; }
#multimeter-fab img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}
#multimeter-scene {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 80;
    display: none;
}
#multimeter-scene[data-visible="true"] { display: block; }
#multimeter-scene .multimeter-device,
#multimeter-scene .multimeter-probe,
#multimeter-scene .multimeter-scale-hit {
    position: absolute;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
}
#multimeter-scene .multimeter-device {
    width: 210px;
    height: 320px;
    z-index: 1;
}
#multimeter-scene .multimeter-body {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
}
#multimeter-scene .multimeter-display {
    position: absolute;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(192, 214, 166, 0.72);
    color: #182112;
    font: 700 22px/1 'Consolas', 'Courier New', monospace;
    letter-spacing: 1px;
    text-transform: uppercase;
    pointer-events: none;
}
#multimeter-scene .multimeter-selector {
    position: absolute;
    width: 49.8%;
    transform-origin: 50% 50%;
    cursor: pointer;
    transition: transform 180ms ease;
    z-index: 10;
    pointer-events: auto;
}
#multimeter-scene .multimeter-probe {
    width: 36px;
    height: 144px;
    z-index: 4;
}
#multimeter-scene .multimeter-probe[data-probe="red"] { width: 40px; }
#multimeter-scene .multimeter-probe img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
}
#multimeter-scene .multimeter-tip-collider {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 7;
    pointer-events: none;
    opacity: 0;
    box-sizing: border-box;
}
#multimeter-scene .multimeter-tip-collider[data-probe="black"] {
    border: 1px dashed rgba(28, 28, 28, 0.95);
    background: rgba(28, 28, 28, 0.16);
}
#multimeter-scene .multimeter-tip-collider[data-probe="red"] {
    border: 1px dashed rgba(214, 29, 29, 0.95);
    background: rgba(214, 29, 29, 0.16);
}
body.engineering-mode #multimeter-scene .multimeter-tip-collider,
#multimeter-scene .multimeter-tip-collider.is-touching {
    opacity: 1;
}
#multimeter-scene .multimeter-tip-collider.is-touching {
    box-shadow: 0 0 0 2px rgba(255, 238, 117, 0.72);
}
#multimeter-scene .multimeter-leads {
    position: absolute;
    inset: 0;
    overflow: visible;
    z-index: 3;
}
#multimeter-scene .multimeter-wire {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}
#multimeter-scene .multimeter-wire.outer.red { stroke: #8c0f12; stroke-width: 7; }
#multimeter-scene .multimeter-wire.outer.black { stroke: #141414; stroke-width: 7; }
#multimeter-scene .multimeter-wire.inner.red { stroke: #dd2323; stroke-width: 3.2; }
#multimeter-scene .multimeter-wire.inner.black { stroke: #2b2b2b; stroke-width: 3.2; }
#multimeter-scene .multimeter-plug {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 4;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
}
#multimeter-scene .multimeter-plug.red { background: #d61d1d; }
#multimeter-scene .multimeter-plug.black { background: #1b1b1b; }
#multimeter-scene .multimeter-scale-hit {
    border: 0;
    background: transparent;
    border-radius: 999px;
    cursor: pointer;
    z-index: 6;
}
body.engineering-mode #multimeter-scene .multimeter-scale-hit {
    background: rgba(255, 80, 80, 0.18);
    box-shadow: inset 0 0 0 1px rgba(255, 80, 80, 0.95);
}
body.engineering-mode #multimeter-scene .multimeter-scale-hit {
    background: rgba(255, 80, 80, 0.18);
    box-shadow: inset 0 0 0 1px rgba(255, 80, 80, 0.95);
}
`;
        document.head.appendChild(style);
    }

    function buildEngineeringLines() {
        return [
            `${VARS.globalScale}: ${state.tuning.globalScale};`,
            `${VARS.selectorLeft}: ${state.tuning.selectorLeft}%;`,
            `${VARS.selectorTop}: ${state.tuning.selectorTop}%;`,
            `${VARS.selectorScale}: ${state.tuning.selectorScale};`,
            `${VARS.offAngle}: ${state.tuning.offAngle};`,
            `${VARS.voltAngle}: ${state.tuning.voltAngle};`,
            `${VARS.contAngle}: ${state.tuning.contAngle};`,
            `${VARS.displayLeft}: ${state.tuning.displayLeft}%;`,
            `${VARS.displayTop}: ${state.tuning.displayTop}%;`,
            `${VARS.displayWidth}: ${state.tuning.displayWidth}%;`,
            `${VARS.displayHeight}: ${state.tuning.displayHeight}%;`,
            `${VARS.offLeft}: ${state.tuning.offLeft}%;`,
            `${VARS.offTop}: ${state.tuning.offTop}%;`,
            `${VARS.offWidth}: ${state.tuning.offWidth}%;`,
            `${VARS.offHeight}: ${state.tuning.offHeight}%;`,
            `${VARS.voltLeft}: ${state.tuning.voltLeft}%;`,
            `${VARS.voltTop}: ${state.tuning.voltTop}%;`,
            `${VARS.voltWidth}: ${state.tuning.voltWidth}%;`,
            `${VARS.voltHeight}: ${state.tuning.voltHeight}%;`,
            `${VARS.contLeft}: ${state.tuning.contLeft}%;`,
            `${VARS.contTop}: ${state.tuning.contTop}%;`,
            `${VARS.contWidth}: ${state.tuning.contWidth}%;`,
            `${VARS.contHeight}: ${state.tuning.contHeight}%;`,
            `${VARS.plugBlackX}: ${state.tuning.plugBlackX};`,
            `${VARS.plugBlackY}: ${state.tuning.plugBlackY};`,
            `${VARS.plugRedX}: ${state.tuning.plugRedX};`,
            `${VARS.plugRedY}: ${state.tuning.plugRedY};`,
            `${VARS.probeBlackX}: ${state.tuning.probeBlackX};`,
            `${VARS.probeBlackY}: ${state.tuning.probeBlackY};`,
            `${VARS.probeRedX}: ${state.tuning.probeRedX};`,
            `${VARS.probeRedY}: ${state.tuning.probeRedY};`,
            `${VARS.probeBlackTipX}: ${state.tuning.probeBlackTipX};`,
            `${VARS.probeBlackTipY}: ${state.tuning.probeBlackTipY};`,
            `${VARS.probeRedTipX}: ${state.tuning.probeRedTipX};`,
            `${VARS.probeRedTipY}: ${state.tuning.probeRedTipY};`,
            `${VARS.probeTipRadius}: ${state.tuning.probeTipRadius};`
        ];
    }

    function applyEngineeringTextareaToTuning() {
        const textarea = document.getElementById('engineering-vars');
        if (!textarea) return false;
        const lines = String(textarea.value || '').split(/\r?\n/);
        let changed = false;
        lines.forEach(raw => {
            const line = raw.trim();
            if (!line || line.startsWith('/*')) return;
            const m = line.match(/^(--[a-z0-9\-]+)\s*:\s*([^;]+);?$/i);
            if (!m) return;
            const name = m[1].trim();
            const value = m[2].trim();
            const parsed = parseFloat(value);
            if (!Number.isFinite(parsed)) return;
            switch (name) {
                case VARS.globalScale: state.tuning.globalScale = parsed; changed = true; break;
                case VARS.selectorLeft: state.tuning.selectorLeft = parsed; changed = true; break;
                case VARS.selectorTop: state.tuning.selectorTop = parsed; changed = true; break;
                case VARS.selectorScale: state.tuning.selectorScale = parsed; changed = true; break;
                case VARS.offAngle: state.tuning.offAngle = parsed; changed = true; break;
                case VARS.voltAngle: state.tuning.voltAngle = parsed; changed = true; break;
                case VARS.contAngle: state.tuning.contAngle = parsed; changed = true; break;
                case VARS.displayLeft: state.tuning.displayLeft = parsed; changed = true; break;
                case VARS.displayTop: state.tuning.displayTop = parsed; changed = true; break;
                case VARS.displayWidth: state.tuning.displayWidth = parsed; changed = true; break;
                case VARS.displayHeight: state.tuning.displayHeight = parsed; changed = true; break;
                case VARS.offLeft: state.tuning.offLeft = parsed; changed = true; break;
                case VARS.offTop: state.tuning.offTop = parsed; changed = true; break;
                case VARS.offWidth: state.tuning.offWidth = parsed; changed = true; break;
                case VARS.offHeight: state.tuning.offHeight = parsed; changed = true; break;
                case VARS.voltLeft: state.tuning.voltLeft = parsed; changed = true; break;
                case VARS.voltTop: state.tuning.voltTop = parsed; changed = true; break;
                case VARS.voltWidth: state.tuning.voltWidth = parsed; changed = true; break;
                case VARS.voltHeight: state.tuning.voltHeight = parsed; changed = true; break;
                case VARS.contLeft: state.tuning.contLeft = parsed; changed = true; break;
                case VARS.contTop: state.tuning.contTop = parsed; changed = true; break;
                case VARS.contWidth: state.tuning.contWidth = parsed; changed = true; break;
                case VARS.contHeight: state.tuning.contHeight = parsed; changed = true; break;
                case VARS.plugBlackX: state.tuning.plugBlackX = parsed; changed = true; break;
                case VARS.plugBlackY: state.tuning.plugBlackY = parsed; changed = true; break;
                case VARS.plugRedX: state.tuning.plugRedX = parsed; changed = true; break;
                case VARS.plugRedY: state.tuning.plugRedY = parsed; changed = true; break;
                case VARS.probeBlackX: state.tuning.probeBlackX = parsed; changed = true; break;
                case VARS.probeBlackY: state.tuning.probeBlackY = parsed; changed = true; break;
                case VARS.probeRedX: state.tuning.probeRedX = parsed; changed = true; break;
                case VARS.probeRedY: state.tuning.probeRedY = parsed; changed = true; break;
                case VARS.probeBlackTipX: state.tuning.probeBlackTipX = parsed; changed = true; break;
                case VARS.probeBlackTipY: state.tuning.probeBlackTipY = parsed; changed = true; break;
                case VARS.probeRedTipX: state.tuning.probeRedTipX = parsed; changed = true; break;
                case VARS.probeRedTipY: state.tuning.probeRedTipY = parsed; changed = true; break;
                case VARS.probeTipRadius: state.tuning.probeTipRadius = parsed; changed = true; break;
                default: break;
            }
        });
        if (changed) {
            pushTuningToRoot();
            render();
        }
        return changed;
    }

    function setEngineeringUiForMultimeter() {
        if (!isMultimeterEngineeringTarget()) return false;
        const targetEl = document.getElementById('engineering-target');
        const textarea = document.getElementById('engineering-vars');
        if (!targetEl || !textarea) return false;
        targetEl.innerText = 'Multimetro';
        textarea.value = buildEngineeringLines().join('\n');
        return true;
    }

    function parseEngineeringVarLineLocal(line) {
        const m = String(line || '').trim().match(/^(--[a-z0-9\-]+)\s*:\s*([^;]+);?$/i);
        if (!m) return null;
        const name = m[1].trim();
        const rawValue = m[2].trim();
        const unitMatch = rawValue.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (!unitMatch) return { name, rawValue, numeric: false };
        return {
            name,
            rawValue,
            numeric: Number.isFinite(parseFloat(unitMatch[1])),
            number: parseFloat(unitMatch[1]),
            unit: String(unitMatch[2] || '').trim()
        };
    }

    function getSliderBounds(name) {
        if (name === VARS.globalScale) return { min: 0.45, max: 1.5, step: 0.01 };
        if (name === VARS.selectorLeft) return { min: 10, max: 34, step: 0.1 };
        if (name === VARS.selectorTop) return { min: 24, max: 40, step: 0.1 };
        if (name === VARS.selectorScale) return { min: 0.7, max: 1.3, step: 0.01 };
        if (name === VARS.offAngle || name === VARS.voltAngle || name === VARS.contAngle) return { min: -180, max: 180, step: 1 };
        if (name === VARS.displayLeft) return { min: 14, max: 30, step: 0.1 };
        if (name === VARS.displayTop) return { min: 10, max: 22, step: 0.1 };
        if (name === VARS.displayWidth) return { min: 42, max: 70, step: 0.1 };
        if (name === VARS.displayHeight) return { min: 6, max: 22, step: 0.1 };
        if (name === VARS.offLeft || name === VARS.voltLeft || name === VARS.contLeft) return { min: 0, max: 100, step: 0.1 };
        if (name === VARS.offTop || name === VARS.voltTop || name === VARS.contTop) return { min: 0, max: 100, step: 0.1 };
        if (name === VARS.offWidth || name === VARS.voltWidth || name === VARS.contWidth) return { min: 2, max: 40, step: 0.1 };
        if (name === VARS.offHeight || name === VARS.voltHeight || name === VARS.contHeight) return { min: 2, max: 40, step: 0.1 };
        if (name === VARS.plugBlackX || name === VARS.plugRedX) return { min: 30, max: 150, step: 0.1 };
        if (name === VARS.plugBlackY || name === VARS.plugRedY) return { min: 100, max: 300, step: 0.1 };
        if (name === VARS.probeBlackX || name === VARS.probeRedX) return { min: -40, max: 40, step: 0.1 };
        if (name === VARS.probeBlackY || name === VARS.probeRedY) return { min: 110, max: 170, step: 0.1 };
        if (name === VARS.probeBlackTipX || name === VARS.probeRedTipX) return { min: -100, max: 100, step: 0.1 };
        if (name === VARS.probeBlackTipY || name === VARS.probeRedTipY) return { min: -30, max: 30, step: 0.1 };
        if (name === VARS.probeTipRadius) return { min: 4, max: 24, step: 0.1 };
        return { min: 0, max: 100, step: 0.1 };
    }

    function renderEngineeringSlidersForMultimeter() {
        const host = document.getElementById('engineering-sliders');
        const textarea = document.getElementById('engineering-vars');
        if (!host || !textarea) return false;
        if (!isMultimeterEngineeringTarget()) return false;

        const entries = textarea.value
            .split(/\r?\n/)
            .map(parseEngineeringVarLineLocal)
            .filter(v => v && v.numeric);

        host.innerHTML = '';
        entries.forEach(entry => {
            const row = document.createElement('div');
            row.className = 'engineering-slider-row';
            const label = document.createElement('label');
            label.className = 'engineering-slider-label';
            label.textContent = entry.name.replace(/^--multimeter-/, '').replace(/-/g, ' ');
            const range = document.createElement('input');
            range.type = 'range';
            const num = document.createElement('input');
            num.type = 'number';
            const bounds = getSliderBounds(entry.name);

            num.step = String(bounds.step);
            range.min = String(bounds.min);
            range.max = String(bounds.max);
            range.step = String(bounds.step);
            range.value = String(entry.number);
            num.min = range.min;
            num.max = range.max;
            num.value = String(entry.number);

            const applyValue = (value) => {
                const parsed = parseFloat(String(value));
                if (!Number.isFinite(parsed)) return;
                const lines = textarea.value.split(/\r?\n/);
                textarea.value = lines.map(line => {
                    if (!String(line).trim().startsWith(entry.name + ':')) return line;
                    return `${entry.name}: ${parsed}${entry.unit};`;
                }).join('\n');
                range.value = String(parsed);
                num.value = String(parsed);
                applyEngineeringTextareaToTuning();
            };

            range.addEventListener('input', () => applyValue(range.value));
            num.addEventListener('input', () => applyValue(num.value));

            row.appendChild(label);
            row.appendChild(range);
            row.appendChild(num);
            host.appendChild(row);
        });
        return true;
    }

    function patchEngineeringWorkflow() {
        if (engineeringPatched) return;
        const originalReload = window.recarregarVarsEngenharia;
        const originalApply = window.aplicarVarsEngenharia;
        const originalRender = window.renderEngineeringSlidersFromTextarea;
        const textarea = document.getElementById('engineering-vars');

        window.recarregarVarsEngenharia = function (...args) {
            if (typeof originalReload === 'function') originalReload.apply(this, args);
            if (setEngineeringUiForMultimeter()) {
                if (!renderEngineeringSlidersForMultimeter() && typeof originalRender === 'function') {
                    originalRender();
                }
            }
        };

        window.aplicarVarsEngenharia = function (...args) {
            if (isMultimeterEngineeringTarget()) {
                applyEngineeringTextareaToTuning();
                setEngineeringUiForMultimeter();
                renderEngineeringSlidersForMultimeter();
                if (typeof scheduleHistoryCheckpoint === 'function') {
                    scheduleHistoryCheckpoint('engineering_vars');
                }
                return;
            }
            if (typeof originalApply === 'function') originalApply.apply(this, args);
        };

        window.renderEngineeringSlidersFromTextarea = function (...args) {
            if (renderEngineeringSlidersForMultimeter()) return;
            if (typeof originalRender === 'function') originalRender.apply(this, args);
        };

        if (textarea) {
            textarea.addEventListener('input', () => {
                if (!isMultimeterEngineeringTarget()) return;
                applyEngineeringTextareaToTuning();
                renderEngineeringSlidersForMultimeter();
            });
        }

        engineeringPatched = true;
    }

    function getVisibleWorldRect() {
        const viewport = getViewport();
        const zoom = getZoom();
        if (!viewport) return { left: 0, top: 0, width: 1400, height: 900 };
        return {
            left: (-getPanX()) / zoom,
            top: (-getPanY()) / zoom,
            width: (viewport.clientWidth || 1200) / zoom,
            height: (viewport.clientHeight || 900) / zoom
        };
    }

    function placeDefaultLayout() {
        const rect = getVisibleWorldRect();
        const isOffscreen = state.meter.x < (rect.left - 50) || state.meter.x > (rect.left + rect.width + 50) ||
                            state.meter.y < (rect.top - 50) || state.meter.y > (rect.top + rect.height + 50);
        if (!state.spawned || isOffscreen) {
            state.meter.x = Math.round(rect.left + Math.max(50, rect.width * 0.38));
            state.meter.y = Math.round(rect.top + Math.max(50, rect.height * 0.15));
            state.probes.red.x = Math.round(state.meter.x + 230);
            state.probes.red.y = Math.round(state.meter.y + 130);
            state.probes.black.x = Math.max(rect.left + 15, Math.round(state.meter.x - 120));
            state.probes.black.y = Math.round(state.meter.y + 130);
            state.spawned = true;
        }
    }

    function buildSceneMarkup() {
        return `
            <svg class="multimeter-leads" width="5000" height="5000" viewBox="0 0 5000 5000" aria-hidden="true" style="position:absolute;left:0;top:0;width:5000px;height:5000px;pointer-events:none;overflow:visible;z-index:3;">
                <path class="multimeter-wire outer red" data-wire="red-outer"></path>
                <path class="multimeter-wire inner red" data-wire="red-inner"></path>
                <path class="multimeter-wire outer black" data-wire="black-outer"></path>
                <path class="multimeter-wire inner black" data-wire="black-inner"></path>
            </svg>
            <div class="multimeter-device" data-role="meter">
                <img class="multimeter-body" src="${cfg.assets.body}" alt="Multimetro">
                <div class="multimeter-display" data-role="display"></div>
                <button type="button" class="multimeter-scale-hit" data-mode="off" style="left: 33%; top: 38%; width: 12%; height: 9%;"></button>
                <button type="button" class="multimeter-scale-hit" data-mode="volt" style="left: 43%; top: 36.5%; width: 15%; height: 12%;"></button>
                <button type="button" class="multimeter-scale-hit" data-mode="cont" style="left: 63%; top: 56%; width: 12%; height: 11%;"></button>
                <img class="multimeter-selector" data-role="selector" src="${cfg.assets.selector}" alt="Seletor">
            </div>
            <div class="multimeter-plug black" data-role="plug-black"></div>
            <div class="multimeter-plug red" data-role="plug-red"></div>
            <div class="multimeter-probe" data-role="probe" data-probe="black">
                <img src="${cfg.assets.probeBlack}" alt="Ponteira preta">
            </div>
            <div class="multimeter-probe" data-role="probe" data-probe="red">
                <img src="${cfg.assets.probeRed}" alt="Ponteira vermelha">
            </div>
            <div class="multimeter-tip-collider" data-role="tip-collider" data-probe="black"></div>
            <div class="multimeter-tip-collider" data-role="tip-collider" data-probe="red"></div>
        `;
    }

    function ensureMounted() {
        if (state.mounted) return;
        injectStyles();
        pushTuningToRoot();

        const fab = document.createElement('button');
        fab.id = 'multimeter-fab';
        fab.type = 'button';
        fab.title = 'Abrir multimetro';
        fab.innerHTML = `<img src="${cfg.assets.body}" alt="Multimetro">`;
        const fabHost = document.querySelector('.app-container') || document.body;
        fabHost.appendChild(fab);

        const scene = document.createElement('div');
        scene.id = 'multimeter-scene';
        scene.innerHTML = buildSceneMarkup();

        refs = {
            fab,
            scene,
            meter: scene.querySelector('[data-role="meter"]'),
            display: scene.querySelector('[data-role="display"]'),
            selector: scene.querySelector('[data-role="selector"]'),
            plugBlack: scene.querySelector('[data-role="plug-black"]'),
            plugRed: scene.querySelector('[data-role="plug-red"]'),
            probeBlack: scene.querySelector('.multimeter-probe[data-probe="black"]'),
            probeRed: scene.querySelector('.multimeter-probe[data-probe="red"]'),
            probeBlackTip: scene.querySelector('.multimeter-tip-collider[data-probe="black"]'),
            probeRedTip: scene.querySelector('.multimeter-tip-collider[data-probe="red"]'),
            hits: Array.from(scene.querySelectorAll('[data-mode]')),
            hitByMode: {
                off: scene.querySelector('[data-mode="off"]'),
                volt: scene.querySelector('[data-mode="volt"]'),
                cont: scene.querySelector('[data-mode="cont"]')
            },
            wires: {
                redOuter: scene.querySelector('[data-wire="red-outer"]'),
                redInner: scene.querySelector('[data-wire="red-inner"]'),
                blackOuter: scene.querySelector('[data-wire="black-outer"]'),
                blackInner: scene.querySelector('[data-wire="black-inner"]')
            }
        };

        fab.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (!is2DActive()) return;
            placeDefaultLayout();
            state.visible = !state.visible;
            render();
            if (typeof window.recarregarVarsEngenharia === 'function') {
                window.recarregarVarsEngenharia();
            }
        });

        function activateModeHit(modeKey, event) {
            if (event) { event.preventDefault(); event.stopPropagation(); }
            setMode(modeKey || 'off');
        }

                refs.hits.forEach(hit => {
            const modeKey = hit.dataset.mode || off;
            const handleModeEvent = event => activateModeHit(modeKey, event);
            hit.style.pointerEvents = auto;
            hit.style.touchAction = manipulation;
            hit.onpointerdown = handleModeEvent;
            hit.onmousedown = handleModeEvent;
            hit.ontouchstart = handleModeEvent;
            hit.onclick = handleModeEvent;
        });

        // Clic direct sur le bouton rotatif ou le multimètre pour basculer facilement : OFF -> Volt (AC/DC) -> Continuité
        if (refs?.selector) {
            refs.selector.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                const modes = ["off", "volt", "cont"];
                const curIdx = modes.indexOf(state.mode);
                const nextMode = modes[(curIdx + 1) % modes.length];
                setMode(nextMode);
            });
        }

        bindDrag(refs.meter, 'meter');
        bindDrag(refs.probeRed, 'probe-red');
        bindDrag(refs.probeBlack, 'probe-black');

        window.addEventListener('resize', render);
        patchEngineeringWorkflow();
        syncTimer = window.setInterval(() => {
            syncVisibilityAndHost();
            if (state.visible && is2DActive()) {
                updateProbeContacts();
                if (refs?.display) refs.display.textContent = getDisplayContent();
            }
            if (isMultimeterEngineeringTarget()) {
                setEngineeringUiForMultimeter();
            }
        }, 180);

        state.mounted = true;
        exposeMultimeterApi();
        syncVisibilityAndHost();
        render();
    }

    function syncSceneHost() {
        if (!refs?.scene) return;
        const host = getWorkbench2D();
        if (!host) return;
        if (refs.scene.parentElement !== host) host.appendChild(refs.scene);
    }

    function bindDrag(element, type) {
        element.addEventListener('pointerdown', event => {
            if (!is2DActive() || !state.visible) return;
            event.preventDefault();
            event.stopPropagation();
            let source = null;
            if (type === 'meter') source = state.meter;
            if (type === 'probe-red') source = state.probes.red;
            if (type === 'probe-black') source = state.probes.black;
            if (!source) return;
            state.drag = {
                type,
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startX: source.x,
                startY: source.y,
                startRed: { ...state.probes.red },
                startBlack: { ...state.probes.black }
            };
            element.setPointerCapture(event.pointerId);
        });

        element.addEventListener('pointermove', event => {
            if (!state.drag || state.drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            const zoom = getZoom();
            const dx = (event.clientX - state.drag.startClientX) / zoom;
            const dy = (event.clientY - state.drag.startClientY) / zoom;
            if (state.drag.type === 'meter') {
                state.meter.x = state.drag.startX + dx;
                state.meter.y = state.drag.startY + dy;
                state.probes.red.x = state.drag.startRed.x + dx;
                state.probes.red.y = state.drag.startRed.y + dy;
                state.probes.black.x = state.drag.startBlack.x + dx;
                state.probes.black.y = state.drag.startBlack.y + dy;
            } else if (state.drag.type === 'probe-red') {
                state.probes.red.x = state.drag.startX + dx;
                state.probes.red.y = state.drag.startY + dy;
            } else if (state.drag.type === 'probe-black') {
                state.probes.black.x = state.drag.startX + dx;
                state.probes.black.y = state.drag.startY + dy;
            }
            render();
        });

        function finishDrag(event) {
            if (!state.drag || state.drag.pointerId !== event.pointerId) return;
            state.drag = null;
        }

        element.addEventListener('pointerup', finishDrag);
        element.addEventListener('pointercancel', finishDrag);
    }

    function beepContinuity() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!window.__multimeterAudioCtx) window.__multimeterAudioCtx = new AudioCtx();
            const ctx = window.__multimeterAudioCtx;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.value = 1760;
            gain.gain.value = 0.02;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            oscillator.start(now);
            oscillator.stop(now + 0.12);
        } catch (_) {}
    }

    function setMode(modeKey) {
        if (!cfg.selectorPositions.some(item => item.key === modeKey)) return;
        state.mode = modeKey;
        if (refs?.display && refs?.selector) applyTuning();
        syncContinuityBeepLoop();
        render();
    }

    function getSelectorIndex() {
        const idx = cfg.selectorPositions.findIndex(item => item.key === state.mode);
        return idx >= 0 ? idx : 0;
    }

    function getModeLabel() {
        return cfg.selectorPositions[getSelectorIndex()]?.label || '';
    }

    function getModeAngle() {
        if (state.mode === 'off') return state.tuning.offAngle;
        if (state.mode === 'volt') return state.tuning.voltAngle;
        if (state.mode === 'cont') return state.tuning.contAngle;
        return state.tuning.offAngle;
    }

    function normalizePotentialToken(value) {
        return String(value == null ? '' : value).trim().toUpperCase();
    }

    function extractPhaseIdsFromTarget(target) {
        const ids = new Set();
        const tokens = Array.isArray(target?.nodePotentials) ? target.nodePotentials : [];
        tokens.forEach(token => {
            const normalized = normalizePotentialToken(token);
            if (normalized.startsWith('FASE:')) ids.add(normalized.slice(5));
            if (normalized.startsWith('TRACE:')) ids.add(normalized.slice(6));
        });
        const pin = normalizePotentialToken(target?.pin);
        const potential = normalizePotentialToken(target?.potential);
        if (!ids.size && potential === 'FASE' && /^L[123]$/.test(pin)) ids.add(pin);
        return ids;
    }

    function buildContactElectricalInfo(contact) {
        const target = contact?.target || null;
        const tokens = Array.isArray(target?.nodePotentials) ? target.nodePotentials.map(normalizePotentialToken) : [];
        const phaseIds = extractPhaseIdsFromTarget(target);
        const pin = normalizePotentialToken(target?.pin);
        const potential = normalizePotentialToken(target?.potential);
        const componentLib = normalizePotentialToken(target?.componentLib).toLowerCase();
        const hasPhase = tokens.includes('FASE') || phaseIds.size > 0 || potential === 'FASE';
        const hasNeutral = tokens.includes('NEUTRO') || potential === 'NEUTRO';
        const isIecAcDc = componentLib === "iec_fonte_ac_dc" || componentLib.includes("fonte_ac_dc");
        const is24VPin = pin === "24V" || pin === "+24V" || pin === "+" || pin === "V+";
        const is0VPin = pin === "0V" || pin === "GND" || pin === "-" || pin === "V-";
        const dcVoltage = tokens.includes("12V") ? 12 :
            (tokens.includes("24V") || ((componentLib === "real_fonte_24v" || isIecAcDc) && is24VPin) ? 24 : 0);
        const isDcPlus = dcVoltage > 0 || (isIecAcDc && is24VPin);
        const isDcMinus = tokens.includes("0V") || ((componentLib === "real_fonte_24v" || isIecAcDc) && is0VPin);
        const signature = `${tokens.slice().sort().join('|')}::${potential}::${pin}::${componentLib}`;
        return {
            hasContact: !!target,
            phaseIds,
            hasPhase,
            hasNeutral,
            isDcPlus,
            isDcMinus,
            dcVoltage,
            isLive: hasPhase || isDcPlus,
            nodeId: target?.nodeId || null,
            nodeRef: target?.nodeRef || target?.element?._node || null,
            signature
        };
    }

    function setsIntersect(a, b) {
        for (const item of a) {
            if (b.has(item)) return true;
        }
        return false;
    }

    function getSimulationComponents() {
        if (typeof window.getSimulationActiveComponents === 'function') {
            return window.getSimulationActiveComponents();
        }
        return Array.from(document.querySelectorAll('#bancada .component'));
    }

    function normalizeFontePhaseVoltage(value) {
        return '230';
    }

    function getFonteTrifasicaConfiguredPhaseVoltage(phaseInfo, neutralInfo) {
        const phaseIds = phaseInfo?.phaseIds instanceof Set ? phaseInfo.phaseIds : new Set();
        const phaseNode = phaseInfo?.nodeRef || null;
        const neutralNode = neutralInfo?.nodeRef || null;
        const sourceComponents = getSimulationComponents().filter(comp =>
            String(comp?.dataset?.lib || '').trim().toLowerCase() === 'real_fonte_trifasica_nt'
        );

        for (const comp of sourceComponents) {
            const sourceVoltage = normalizeFontePhaseVoltage(comp?.dataset?.phaseVoltage);
            if (!phaseIds.size) {
                if (sourceVoltage) return sourceVoltage;
                continue;
            }

            let phaseMatches = false;
            phaseIds.forEach((phaseId) => {
                if (phaseMatches) return;
                const borne = comp.querySelector(`.borne[data-pino="${phaseId}"]`);
                if (!borne) return;
                if (phaseNode && borne._node === phaseNode) {
                    phaseMatches = true;
                    return;
                }
                phaseMatches = true;
            });
            if (!phaseMatches) continue;

            if (neutralNode) {
                const neutralBorne = comp.querySelector('.borne[data-pino="N"]');
                if (neutralBorne && neutralBorne._node && neutralBorne._node !== neutralNode) {
                    return sourceVoltage;
                }
            }
            return sourceVoltage;
        }

        return '230';
    }

    function getSsw05AnalogOutputVoltageText(redInfo, blackInfo) {
        const redNode = redInfo?.nodeRef || null;
        const blackNode = blackInfo?.nodeRef || null;
        if (!redNode || !blackNode || redNode === blackNode) return '';
        const components = getSimulationComponents().filter(comp =>
            ['real_ssw05', 'iec_ssw05'].includes(
                String(comp?.dataset?.lib || '').trim().toLowerCase()
            )
        );

        for (const comp of components) {
            const outputs = ['U', 'V', 'W']
                .map(pin => comp.querySelector(`.borne[data-pino="${pin}"]`))
                .filter(Boolean);
            const redOut = outputs.find(borne => borne._node === redNode);
            const blackOut = outputs.find(borne => borne._node === blackNode);
            if (!redOut || !blackOut || redOut === blackOut) continue;
            const active = String(redOut.dataset.vfdSource || blackOut.dataset.vfdSource || '').toLowerCase() === 'ssw05';
            if (!active) continue;
            const mode = String(redOut.dataset.vfdVoltageMode || blackOut.dataset.vfdVoltageMode || '').toLowerCase();
            const nominal = Math.max(0, Number(comp.dataset.ssw05NominalVoltage || 220) || 220);
            if (mode === 'volts') {
                const volts = Math.max(0, Number(redOut.dataset.vfdVoltage || blackOut.dataset.vfdVoltage || comp.dataset.ssw05Voltage || 0) || 0);
                return `${Math.round(Math.min(nominal, volts))}V`;
            }
            const percent = Math.max(0, Math.min(100, Number(redOut.dataset.vfdVoltage || blackOut.dataset.vfdVoltage || comp.dataset.ssw05VoltagePercent || 0)));
            return `${Math.round((nominal * percent) / 100)}V`;
        }
        return '';
    }

    function getControlTransformerOutputVoltageText(redInfo, blackInfo) {
        const redNode = redInfo?.nodeRef || null;
        const blackNode = blackInfo?.nodeRef || null;
        if (!redNode || !blackNode || redNode === blackNode) return '';

        const transformers = getSimulationComponents().filter(comp =>
            String(comp?.dataset?.lib || '').trim().toLowerCase() === 'real_transformador_comandos' &&
            comp?.dataset?.transformerOn === '1'
        );
        for (const comp of transformers) {
            const voltage = Number(comp.dataset.transformerOutputVoltage || 0);
            if (voltage !== 12 && voltage !== 24) continue;
            const positiveNodes = new Set();
            const negativeNodes = new Set();
            comp.querySelectorAll('.borne[data-transformer-polarity]').forEach(borne => {
                if (!borne?._node) return;
                if (borne.dataset.transformerPolarity === 'A') positiveNodes.add(borne._node);
                if (borne.dataset.transformerPolarity === 'B') negativeNodes.add(borne._node);
            });
            if (
                (positiveNodes.has(redNode) && negativeNodes.has(blackNode)) ||
                (positiveNodes.has(blackNode) && negativeNodes.has(redNode))
            ) {
                return `${voltage}V`;
            }
        }
        return '';
    }

    function getMeasuredVoltageText() {
        const red = buildContactElectricalInfo(state.contacts.red);
        const black = buildContactElectricalInfo(state.contacts.black);
        if (!red.hasContact || !black.hasContact) return '0V';
        if (red.signature && black.signature && red.signature === black.signature) return '0V';
        const transformerVoltage = getControlTransformerOutputVoltageText(red, black);
        if (transformerVoltage) return transformerVoltage;
        const softStarterVoltage = getSsw05AnalogOutputVoltageText(red, black);
        if (softStarterVoltage) return softStarterVoltage;
        if ((red.isDcPlus && black.isDcMinus) || (red.isDcMinus && black.isDcPlus)) {
            return `${red.dcVoltage || black.dcVoltage || 24}V`;
        }
        if ((red.hasPhase && black.hasNeutral) || (black.hasPhase && red.hasNeutral)) {
            if (red.isDcPlus || red.isDcMinus || black.isDcPlus || black.isDcMinus) {
                return `${red.dcVoltage || black.dcVoltage || 24}V`;
            }
            const phaseInfo = red.hasPhase ? red : black;
            const neutralInfo = red.hasNeutral ? red : black;
            return `${getFonteTrifasicaConfiguredPhaseVoltage(phaseInfo, neutralInfo)}V`;
        }
        if (red.hasPhase && black.hasPhase) {
            const lineVoltage = '400V';
            if (red.phaseIds.size && black.phaseIds.size) {
                return setsIntersect(red.phaseIds, black.phaseIds) ? '0V' : lineVoltage;
            }
            return red.signature === black.signature ? '0V' : lineVoltage;
        }
        if (red.hasNeutral && black.hasNeutral) return '0V';
        return '0V';
    }

    function connectContinuityAdjacency(adjacency, nodeA, nodeB) {
        if (!nodeA || !nodeB || nodeA === nodeB) return;
        if (!adjacency.has(nodeA)) adjacency.set(nodeA, new Set());
        if (!adjacency.has(nodeB)) adjacency.set(nodeB, new Set());
        adjacency.get(nodeA).add(nodeB);
        adjacency.get(nodeB).add(nodeA);
    }

    function buildContinuityAdjacency() {
        const adjacency = new Map();
        const host = getWorkbench2D();
        if (!host) return adjacency;
        host.querySelectorAll('.component').forEach(comp => {
            let shorts = Array.isArray(comp?._activeShorts) ? comp._activeShorts : [];
            if (String(comp?.dataset?.lib || '').trim().toLowerCase() === 'real_rele_termico') {
                const normal = comp?.dataset?.releTrip !== 'true';
                const withoutAuxiliaryContacts = shorts.filter(pair => {
                    if (!Array.isArray(pair) || pair.length < 2) return true;
                    const pins = new Set(pair.map(pin => String(pin ?? '').trim()));
                    return !(
                        pins.has('95') || pins.has('96') || pins.has('97') || pins.has('98')
                    );
                });
                shorts = normal
                    ? [...withoutAuxiliaryContacts, ['95', '96']]
                    : [...withoutAuxiliaryContacts, ['97', '98']];
            }
            if (!shorts.length) return;
            const borneByPin = new Map();
            comp.querySelectorAll('.borne').forEach(borne => {
                const pin = String(borne?.dataset?.pino || '').trim();
                if (pin) borneByPin.set(pin, borne);
            });
            shorts.forEach(pair => {
                if (!Array.isArray(pair) || pair.length < 2) return;
                const nodeA = borneByPin.get(String(pair[0] ?? '').trim())?._node || null;
                const nodeB = borneByPin.get(String(pair[1] ?? '').trim())?._node || null;
                connectContinuityAdjacency(adjacency, nodeA, nodeB);
            });
        });
        return adjacency;
    }

    function areNodesContinuityConnected(startNode, endNode) {
        if (!startNode || !endNode) return false;
        if (startNode === endNode) return true;
        const adjacency = buildContinuityAdjacency();
        const queue = [startNode];
        const visited = new Set([startNode]);
        while (queue.length) {
            const current = queue.shift();
            const neighbors = adjacency.get(current);
            if (!neighbors) continue;
            for (const next of neighbors) {
                if (next === endNode) return true;
                if (visited.has(next)) continue;
                visited.add(next);
                queue.push(next);
            }
        }
        return false;
    }

    function hasContinuityBetweenContacts() {
        const red = buildContactElectricalInfo(state.contacts.red);
        const black = buildContactElectricalInfo(state.contacts.black);
        if (!red.hasContact || !black.hasContact) return false;
        if (red.nodeRef && black.nodeRef && red.nodeRef === black.nodeRef) return true;
        if (red.nodeId && black.nodeId && red.nodeId === black.nodeId) return true;
        return areNodesContinuityConnected(red.nodeRef, black.nodeRef);
    }

    function areProbeTipsTouching() {
        const blackTip = getProbeTipPoint('black');
        const redTip = getProbeTipPoint('red');
        const maxDistance = Math.max(4, (blackTip.radius || 0) + (redTip.radius || 0));
        return Math.hypot(blackTip.x - redTip.x, blackTip.y - redTip.y) <= maxDistance;
    }

    function isUnsafeContinuityMeasurement() {
        const red = buildContactElectricalInfo(state.contacts.red);
        const black = buildContactElectricalInfo(state.contacts.black);
        return !!(red.isLive || black.isLive);
    }

    function dispatchContinuitySafetyWarning() {
        const message = 'PERIGO: nao meca continuidade em ponto energizado. Desenergize o circuito antes do teste para evitar acidente e dano ao instrumento.';
        if (typeof window.__notifySimulationEditLocked === 'function') {
            window.__notifySimulationEditLocked(message);
            return;
        }
        console.warn('[residencial multimetro]', message);
    }

    function stopContinuityBeepLoop() {
        if (continuityBeepTimer) {
            window.clearInterval(continuityBeepTimer);
            continuityBeepTimer = null;
        }
    }

    function syncContinuityBeepLoop() {
        const shouldBeep = !!(state.visible && is2DActive() && state.mode === 'cont' && state.continuityClosed && !state.continuityUnsafe);
        if (!shouldBeep) {
            stopContinuityBeepLoop();
            return;
        }
        if (continuityBeepTimer) return;
        beepContinuity();
        continuityBeepTimer = window.setInterval(() => {
            if (!(state.visible && is2DActive() && state.mode === 'cont' && state.continuityClosed && !state.continuityUnsafe)) {
                stopContinuityBeepLoop();
                return;
            }
            beepContinuity();
        }, 500);
    }

    function updateContinuityState() {
        const unsafe = isUnsafeContinuityMeasurement();
        state.continuityUnsafe = unsafe;
        if (state.mode === 'cont' && unsafe && !state.continuityWarningLatched) {
            dispatchContinuitySafetyWarning();
        }
        state.continuityWarningLatched = state.mode === 'cont' && unsafe;
        state.continuityClosed = !unsafe && (hasContinuityBetweenContacts() || areProbeTipsTouching());
        syncContinuityBeepLoop();
    }

    function getDisplayContent() {
        if (state.mode === 'off') return '';
        if (state.mode === 'volt') return getMeasuredVoltageText();
        if (state.mode === 'cont') return state.continuityUnsafe ? 'PERIGO' : (state.continuityClosed ? ')))' : 'OL');
        return getModeLabel();
    }

    function scaleValue(value) {
        return value * state.tuning.globalScale;
    }

    function applyHitTuning(hit, left, top, width, height) {
        if (!hit) return;
        hit.style.left = `${left}%`;
        hit.style.top = `${top}%`;
        hit.style.width = `${width}%`;
        hit.style.height = `${height}%`;
    }

    function applyTuning() {
        refs.meter.style.transform = `scale(${state.tuning.globalScale})`;
        refs.probeBlack.style.transform = `scale(${state.tuning.globalScale}) rotate(30deg)`;
        refs.probeRed.style.transform = `scale(${state.tuning.globalScale}) rotate(-30deg)`;
        refs.selector.style.left = `${state.tuning.selectorLeft}%`;
        refs.selector.style.top = `${state.tuning.selectorTop}%`;
        refs.selector.style.transform = `scale(${state.tuning.selectorScale}) rotate(${getModeAngle()}deg)`;
        refs.display.style.left = `${state.tuning.displayLeft}%`;
        refs.display.style.top = `${state.tuning.displayTop}%`;
        refs.display.style.width = `${state.tuning.displayWidth}%`;
        refs.display.style.height = `${state.tuning.displayHeight}%`;
        refs.display.style.fontSize = `${Math.round(22 * state.tuning.globalScale)}px`;
        refs.display.textContent = getDisplayContent();
        applyHitTuning(refs.hitByMode.off, state.tuning.offLeft, state.tuning.offTop, state.tuning.offWidth, state.tuning.offHeight);
        applyHitTuning(refs.hitByMode.volt, state.tuning.voltLeft, state.tuning.voltTop, state.tuning.voltWidth, state.tuning.voltHeight);
        applyHitTuning(refs.hitByMode.cont, state.tuning.contLeft, state.tuning.contTop, state.tuning.contWidth, state.tuning.contHeight);
    }

    function getMeterPortPoint(color) {
        if (color === 'black') {
            return {
                x: state.meter.x + scaleValue(state.tuning.plugBlackX),
                y: state.meter.y + scaleValue(state.tuning.plugBlackY)
            };
        }
        return {
            x: state.meter.x + scaleValue(state.tuning.plugRedX),
            y: state.meter.y + scaleValue(state.tuning.plugRedY)
        };
    }

    function getProbeCablePoint(color) {
        const probe = color === 'red' ? state.probes.red : state.probes.black;
        if (color === 'red') {
            return {
                x: probe.x + scaleValue(state.tuning.probeRedX),
                y: probe.y + scaleValue(state.tuning.probeRedY)
            };
        }
        return {
            x: probe.x + scaleValue(state.tuning.probeBlackX),
            y: probe.y + scaleValue(state.tuning.probeBlackY)
        };
    }

    function getProbeTipPoint(color) {
        const probe = color === 'red' ? state.probes.red : state.probes.black;
        if (color === 'red') {
            return {
                x: probe.x + scaleValue(state.tuning.probeRedTipX),
                y: probe.y + scaleValue(state.tuning.probeRedTipY),
                radius: scaleValue(state.tuning.probeTipRadius)
            };
        }
        return {
            x: probe.x + scaleValue(state.tuning.probeBlackTipX),
            y: probe.y + scaleValue(state.tuning.probeBlackTipY),
            radius: scaleValue(state.tuning.probeTipRadius)
        };
    }

    function readNodePotentials(node) {
        if (!node) return [];
        const src = node.potenciais;
        if (src instanceof Set) return Array.from(src);
        if (Array.isArray(src)) return src.slice();
        return [];
    }

    function getNodeIdentity(node) {
        if (!node || typeof node !== 'object') return null;
        if (!nodeIdentityMap.has(node)) nodeIdentityMap.set(node, 'node-' + (nextNodeIdentity++));
        return nodeIdentityMap.get(node);
    }

    function summarizeBorneHit(borne, distance) {
        const comp = borne?.closest?.('.component') || null;
        return {
            kind: 'borne',
            distance,
            pin: borne?.dataset?.pino || '',
            potential: borne?.dataset?.potential || '',
            componentLib: comp?.dataset?.lib || '',
            componentTag: comp?.dataset?.tag || '',
            nodeId: getNodeIdentity(borne?._node),
            nodePotentials: readNodePotentials(borne?._node),
            element: borne
        };
    }

    function getBorneProbeHitLimitPx(borne, radius) {
        const rect = borne?.getBoundingClientRect?.();
        const baseRadius = Number.isFinite(radius) ? radius : 0;
        const rectLimit = rect ? Math.max(rect.width, rect.height) * 0.8 : 0;
        const comp = borne?.closest?.('.component') || null;
        const lib = String(comp?.dataset?.lib || '').trim().toLowerCase();
        let limit = Math.max(baseRadius, rectLimit, 16);

        if (
            lib === 'real_idr_bipolar' ||
            lib === 'real_idr_tetrapolar' ||
            lib === 'real_dps' ||
            lib === 'real_terminal_generico'
        ) {
            limit = Math.max(limit, 26);
        }

        return limit;
    }

    function findNearestBorneHit(clientX, clientY, radius) {
        const host = getWorkbench2D();
        if (!host) return null;
        let best = null;
        host.querySelectorAll('.component .borne').forEach(borne => {
            const rect = borne.getBoundingClientRect();
            if (!rect.width && !rect.height) return;
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(centerX - clientX, centerY - clientY);
            const limit = getBorneProbeHitLimitPx(borne, radius);
            if (distance > limit) return;
            if (!best || distance < best.distance) {
                best = summarizeBorneHit(borne, distance);
            }
        });
        host.querySelectorAll('.component[data-lib="real_sensor_indutivo"] .ind-sensor-terminal[data-pin], .component[data-lib="real_sensor_capacitivo"] .ind-sensor-terminal[data-pin]').forEach(terminal => {
            const rect = terminal.getBoundingClientRect();
            if (!rect.width && !rect.height) return;
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(centerX - clientX, centerY - clientY);
            const limit = Math.max(radius, Math.max(rect.width, rect.height) * 2.2, 42); // Plus tolérant sur tactile
            if (distance > limit) return;
            const comp = terminal.closest('.component[data-lib="real_sensor_indutivo"], .component[data-lib="real_sensor_capacitivo"]');
            const pin = terminal.dataset.pin || '';
            const borne = comp?.querySelector?.(`.borne[data-pino="${pin}"]`);
            if (!borne) return;
            const hit = summarizeBorneHit(borne, distance);
            hit.kind = 'sensor-terminal';
            hit.element = terminal;
            if (!best || distance < best.distance) best = hit;
        });
        return best;
    }

    function summarizeSvgHit(element, kind, distance) {
        const sourceBorne = element?._borne || null;
        const sourceComponent = sourceBorne?.closest?.('.component') || null;
        const electricalNode = sourceBorne?._node || element?._node || null;
        return {
            kind,
            distance,
            classes: Array.from(element?.classList || []),
            pin: sourceBorne?.dataset?.pino || element?.dataset?.pin || '',
            potential: sourceBorne?.dataset?.potential || element?.dataset?.potential || '',
            componentLib: sourceComponent?.dataset?.lib || element?.dataset?.componentLib || '',
            nodeId: getNodeIdentity(electricalNode),
            nodeRef: electricalNode,
            nodePotentials: readNodePotentials(electricalNode),
            element
        };
    }

    function findNearestSvgHit(clientX, clientY, radius) {
        const selectors = [
            '#wire-top-layer .wire-junction',
            '#wire-layer .wire-junction',
            '#wire-top-layer .wire-terminal',
            '#wire-layer .wire-terminal'
        ];
        let best = null;
        document.querySelectorAll(selectors.join(', ')).forEach(element => {
            const rect = element.getBoundingClientRect();
            if (!rect.width && !rect.height) return;
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(centerX - clientX, centerY - clientY);
            const limit = Math.max(radius, Math.max(rect.width, rect.height) * 0.6);
            if (distance > limit) return;
            const kind = element.classList.contains('wire-junction') ? 'wire-junction' : 'wire-terminal';
            if (!best || distance < best.distance) best = summarizeSvgHit(element, kind, distance);
        });
        return best;
    }

    function getWireCollection() {
        if (Array.isArray(window.listaFios)) return window.listaFios;
        try {
            if (typeof listaFios !== 'undefined' && Array.isArray(listaFios)) return listaFios;
        } catch (_) {}
        return [];
    }

    function distancePointToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax;
        const dy = by - ay;
        if (!dx && !dy) return Math.hypot(px - ax, py - ay);
        const t = Math.max(0, Math.min(1, (((px - ax) * dx) + ((py - ay) * dy)) / ((dx * dx) + (dy * dy))));
        const x = ax + (t * dx);
        const y = ay + (t * dy);
        return Math.hypot(px - x, py - y);
    }

    function findNearestWireHit(worldX, worldY, radiusWorld) {
        let best = null;
        getWireCollection().forEach(wire => {
            const points = Array.isArray(wire?.points) ? wire.points : [];
            if (points.length < 2) return;
            for (let i = 0; i < points.length - 1; i++) {
                const a = points[i];
                const b = points[i + 1];
                const distance = distancePointToSegment(worldX, worldY, a.x, a.y, b.x, b.y);
                const limit = Math.max(radiusWorld, 8);
                if (distance > limit) continue;
                if (!best || distance < best.distanceWorld) {
                    best = {
                        kind: 'wire',
                        distance: distance * getZoom(),
                        distanceWorld: distance,
                        nodeId: getNodeIdentity(wire?.origem?._node || wire?.destino?._node || wire?._node),
                        nodeRef: wire?.origem?._node || wire?.destino?._node || wire?._node || null,
                        nodePotentials: readNodePotentials(wire?.origem?._node || wire?.destino?._node || wire?._node),
                        wireId: wire?.id || '',
                        element: wire?.element || null
                    };
                }
            }
        });
        return best;
    }

    function findProbeContactByCollider(color) {
        const collider = color === 'red' ? refs?.probeRedTip : refs?.probeBlackTip;
        if (!collider) return null;
        const rect = collider.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const radius = rect.width / 2;
        const target = findNearestBorneHit(clientX, clientY, radius);

        collider.classList.toggle('is-touching', !!target);
        return {
            probe: color,
            clientX,
            clientY,
            radius,
            target
        };
    }

    function updateProbeContacts() {
        state.contacts.black = findProbeContactByCollider('black');
        state.contacts.red = findProbeContactByCollider('red');
        updateContinuityState();
    }

    function cloneProbeContact(contact) {
        if (!contact) return null;
        const target = contact.target ? { ...contact.target } : null;
        if (target && Object.prototype.hasOwnProperty.call(target, 'element')) delete target.element;
        return {
            probe: contact.probe,
            clientX: contact.clientX,
            clientY: contact.clientY,
            radius: contact.radius,
            target
        };
    }

    function exposeMultimeterApi() {
        window.toggleMultimetro = function() {
        if (!state.mounted) ensureMounted();
        placeDefaultLayout();
        state.visible = !state.visible;
        render();
        return state.visible;
    };
    window.RESIDENCIAL_MULTIMETRO = {
            getMode: () => state.mode,
            isVisible: () => !!state.visible,
            getProbeTipPoint: (color) => ({ ...getProbeTipPoint(color) }),
            getProbeContact: (color) => cloneProbeContact(color === 'red' ? state.contacts.red : state.contacts.black),
            getContacts: () => ({
                red: cloneProbeContact(state.contacts.red),
                black: cloneProbeContact(state.contacts.black)
            }),
            refreshContacts: () => {
                if (state.mounted && is2DActive() && state.visible) updateProbeContacts();
                return {
                    red: cloneProbeContact(state.contacts.red),
                    black: cloneProbeContact(state.contacts.black)
                };
            }
        };
    }

    function buildLeadPath(from, to) {
        const sagY = Math.max(from.y, to.y) + Math.max(scaleValue(44), Math.abs(to.x - from.x) * 0.18);
        return `M ${from.x} ${from.y} C ${from.x} ${sagY}, ${to.x} ${sagY}, ${to.x} ${to.y}`;
    }

    function renderLeads() {
        const blackFrom = getMeterPortPoint('black');
        const redFrom = getMeterPortPoint('red');
        const blackTo = getProbeCablePoint('black');
        const redTo = getProbeCablePoint('red');
        const blackPath = buildLeadPath(blackFrom, blackTo);
        const redPath = buildLeadPath(redFrom, redTo);
        const blackTip = getProbeTipPoint('black');
        const redTip = getProbeTipPoint('red');
        const outerStroke = Math.max(4.8, scaleValue(7));
        const innerStroke = Math.max(2.2, scaleValue(3.2));
        const plugSize = Math.max(9, scaleValue(12));
        const tipSize = Math.max(8, scaleValue(state.tuning.probeTipRadius * 2));
        refs.wires.blackOuter.setAttribute('d', blackPath);
        refs.wires.blackInner.setAttribute('d', blackPath);
        refs.wires.redOuter.setAttribute('d', redPath);
        refs.wires.redInner.setAttribute('d', redPath);
        refs.wires.blackOuter.style.strokeWidth = `${outerStroke}px`;
        refs.wires.redOuter.style.strokeWidth = `${outerStroke}px`;
        refs.wires.blackInner.style.strokeWidth = `${innerStroke}px`;
        refs.wires.redInner.style.strokeWidth = `${innerStroke}px`;
        refs.plugBlack.style.left = `${blackFrom.x}px`;
        refs.plugBlack.style.top = `${blackFrom.y}px`;
        refs.plugBlack.style.width = `${plugSize}px`;
        refs.plugBlack.style.height = `${plugSize}px`;
        refs.plugRed.style.left = `${redFrom.x}px`;
        refs.plugRed.style.top = `${redFrom.y}px`;
        refs.plugRed.style.width = `${plugSize}px`;
        refs.plugRed.style.height = `${plugSize}px`;
        refs.probeBlackTip.style.left = `${blackTip.x}px`;
        refs.probeBlackTip.style.top = `${blackTip.y}px`;
        refs.probeBlackTip.style.width = `${tipSize}px`;
        refs.probeBlackTip.style.height = `${tipSize}px`;
        refs.probeRedTip.style.left = `${redTip.x}px`;
        refs.probeRedTip.style.top = `${redTip.y}px`;
        refs.probeRedTip.style.width = `${tipSize}px`;
        refs.probeRedTip.style.height = `${tipSize}px`;
    }

    function syncVisibilityAndHost() {
        if (!state.mounted) return;
        syncSceneHost();
        const active = is2DActive();
        refs.fab.dataset.visible = active ? 'true' : 'false';
        refs.scene.dataset.visible = active && state.visible ? 'true' : 'false';
        if (!active && state.visible) {
            state.visible = false;
            refs.scene.dataset.visible = 'false';
            state.contacts.red = null;
            state.contacts.black = null;
            state.continuityClosed = false;
            state.continuityUnsafe = false;
            state.continuityWarningLatched = false;
            stopContinuityBeepLoop();
        }
    }

    function render() {
        if (!state.mounted) return;
        syncVisibilityAndHost();
        if (!(is2DActive() && state.visible)) return;
        refs.meter.style.left = `${state.meter.x}px`;
        refs.meter.style.top = `${state.meter.y}px`;
        refs.probeBlack.style.left = `${state.probes.black.x}px`;
        refs.probeBlack.style.top = `${state.probes.black.y}px`;
        refs.probeRed.style.left = `${state.probes.red.x}px`;
        refs.probeRed.style.top = `${state.probes.red.y}px`;
        applyTuning();
        renderLeads();
        updateProbeContacts();
        if (refs?.display) refs.display.textContent = getDisplayContent();
    }

    function init() {
        ensureMounted();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();






















