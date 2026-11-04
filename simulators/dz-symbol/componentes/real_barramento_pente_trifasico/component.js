(function () {
    const LIB_KEY = 'real_barramento_pente_trifasico';
    const STYLE_ID = 'real-barramento-pente-trifasico-style';
    const MIN_CONTACTS = 3;
    const MAX_CONTACTS = 12;
    const DEFAULT_CONTACTS = 6;
    const MODULE_PITCH = 66;
    const FIRST_TOOTH_CENTER_X = 33;
    const SIDE_PADDING = 33;
    const BODY_HEIGHT = 30;
    const TOOTH_OVERLAP = 7;
    const TOOTH_TOP = BODY_HEIGHT - TOOTH_OVERLAP;
    const TOOTH_HEIGHT = 47;
    const TOOTH_WIDTH = 14;
    const TOOTH_BOTTOM_Y = TOOTH_TOP + TOOTH_HEIGHT;
    const TOOTH_CONTACT_UPPER_Y = TOOTH_TOP + 10;
    const TOOTH_CONTACT_LOWER_Y = TOOTH_BOTTOM_Y - 8;
    const TOOTH_CONTACT_UPPER_OFFSETS_X = [-12, -6, 0, 6, 12];
    const TOOTH_CONTACT_SPINE_Y = [TOOTH_TOP + 18, TOOTH_TOP + 30, TOOTH_BOTTOM_Y - 4];
    const SVG_HEIGHT = TOOTH_BOTTOM_Y + 6;
    const PHASE_SEQUENCE = ['L1', 'L2', 'L3'];

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeContacts(value) {
        const parsed = parseInt(value, 10);
        if (!Number.isFinite(parsed)) return DEFAULT_CONTACTS;
        return clamp(parsed, MIN_CONTACTS, MAX_CONTACTS);
    }

    function getContactDefs(count) {
        const safeCount = normalizeContacts(count);
        return Array.from({ length: safeCount }, (_, index) => {
            const phase = PHASE_SEQUENCE[index % PHASE_SEQUENCE.length];
            return {
                key: `${phase}_${index + 1}`,
                phase
            };
        });
    }

    function normalizeInverted(value) {
        return String(value || '').trim().toLowerCase() === 'true';
    }

    function getUpperPins(contactDef) {
        return TOOTH_CONTACT_UPPER_OFFSETS_X.map((_, index) => `${contactDef.key}_UP${index + 1}`);
    }

    function getLowerPin(contactDef) {
        return `${contactDef.key}_DN`;
    }

    function getSupportPins(contactDef) {
        return TOOTH_CONTACT_SPINE_Y.map((_, index) => `${contactDef.key}_MID${index + 1}`);
    }

    function getWidthPx(count) {
        const safeCount = normalizeContacts(count);
        return ((safeCount - 1) * MODULE_PITCH) + (SIDE_PADDING * 2);
    }

    function getToothCenterX(index) {
        return FIRST_TOOTH_CENTER_X + (index * MODULE_PITCH);
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] {
    z-index: 42 !important;
    overflow: visible;
    --real-barramento-pente-trifasico-borne-x: -10px;
    --real-barramento-pente-trifasico-borne-y: -10px;
}
.component[data-lib="${LIB_KEY}"] .tag-label {
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 15px;
    font-weight: 700;
}
.real-barramento-pente-root {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
.real-barramento-pente-visual {
    position: absolute;
    inset: 0;
    z-index: -1;
}
.real-barramento-pente-svg {
    display: block;
    width: 100%;
    height: 100%;
}
.real-barramento-pente-bornes {
    position: absolute;
    inset: 0;
    z-index: 2;
}
.real-barramento-pente-borne {
    transform: translate(-50%, -50%);
}
.real-barramento-pente-borne.pente-contact-hit {
    opacity: 1 !important;
    background: rgba(255, 72, 72, 0.16) !important;
    box-shadow:
        0 0 0 2px rgba(255, 48, 48, 0.98),
        0 0 8px rgba(255, 48, 48, 0.55) !important;
    pointer-events: none !important;
}
.real-barramento-pente-support-borne {
    opacity: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    pointer-events: none !important;
}
`;
        document.head.appendChild(style);
    }

    function mirrorY(y) {
        return SVG_HEIGHT - y;
    }

    function buildVisualMarkup(count, inverted) {
        const contacts = getContactDefs(count);
        const width = getWidthPx(contacts.length);
        const bodyWidth = Math.max(1, width - 2);
        const firstCenter = getToothCenterX(0);
        const lastCenter = getToothCenterX(contacts.length - 1);
        const teeth = [];
        const labels = [];
        const labelBandTop = inverted ? (SVG_HEIGHT - 24) : 6;
        const labelTextY = inverted ? (SVG_HEIGHT - 11) : 20;

        contacts.forEach((contactDef, index) => {
            const x = getToothCenterX(index);
            const toothLeft = x - (TOOTH_WIDTH / 2);
            teeth.push(`
                <rect x="${toothLeft}" y="${TOOTH_TOP}" width="${TOOTH_WIDTH}" height="${TOOTH_HEIGHT}" rx="1.5" fill="url(#penteCopperGrad)" stroke="#b2662f" stroke-width="0.8"></rect>
                <rect x="${toothLeft + 1.5}" y="${TOOTH_TOP + 2}" width="${Math.max(1, TOOTH_WIDTH - 3)}" height="${Math.max(1, TOOTH_HEIGHT - 6)}" rx="1" fill="rgba(255,255,255,0.16)"></rect>
            `);
            labels.push(`<text x="${x}" y="${labelTextY}" text-anchor="middle" font-size="14" font-weight="700" fill="#17202a" font-family="Arial, sans-serif">${contactDef.phase}</text>`);
        });

        const labelBandLeft = Math.max(10, firstCenter - 22);
        const labelBandWidth = Math.max(20, (lastCenter - firstCenter) + 44);

        return `
            <svg class="real-barramento-pente-svg" width="${width}" height="${SVG_HEIGHT}" viewBox="0 0 ${width} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-label="Barramento pente trifasico">
                <defs>
                    <linearGradient id="penteBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff"></stop>
                        <stop offset="60%" stop-color="#f4f6f8"></stop>
                        <stop offset="100%" stop-color="#dde3ea"></stop>
                    </linearGradient>
                    <linearGradient id="penteCopperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#efb07b"></stop>
                        <stop offset="40%" stop-color="#d78a56"></stop>
                        <stop offset="100%" stop-color="#b96d39"></stop>
                    </linearGradient>
                </defs>

                <g ${inverted ? `transform="translate(0 ${SVG_HEIGHT}) scale(1 -1)"` : ''}>
                    ${teeth.join('')}
                    <rect x="4" y="5" width="${bodyWidth}" height="${BODY_HEIGHT}" rx="4" fill="rgba(0,0,0,0.12)"></rect>
                    <rect x="1" y="1" width="${bodyWidth}" height="${BODY_HEIGHT}" rx="4" fill="url(#penteBodyGrad)" stroke="#a8b0b8" stroke-width="1.1"></rect>
                    <rect x="3" y="${BODY_HEIGHT - 2}" width="${Math.max(1, width - 6)}" height="5" rx="2.5" fill="rgba(222,228,235,0.95)"></rect>
                    <line x1="10" y1="${BODY_HEIGHT - 5}" x2="${Math.max(10, width - 10)}" y2="${BODY_HEIGHT - 5}" stroke="rgba(0,0,0,0.12)" stroke-width="1"></line>
                </g>
                <rect x="${labelBandLeft}" y="${labelBandTop}" width="${labelBandWidth}" height="18" rx="9" fill="rgba(246,248,250,0.88)"></rect>
                ${labels.join('')}
            </svg>
        `;
    }

    function syncBornes(componentEl, bornesEl, count, inverted) {
        if (!componentEl || !bornesEl) return;
        const contacts = getContactDefs(count);
        const existing = new Map(
            Array.from(bornesEl.querySelectorAll('.real-barramento-pente-borne')).map((borneEl) => [borneEl.dataset.pino, borneEl])
        );

        contacts.forEach((contactDef, index) => {
            const x = getToothCenterX(index);
            const borneDefs = getUpperPins(contactDef).map((upperPin, upperIndex) => ({
                pin: upperPin,
                left: x + TOOTH_CONTACT_UPPER_OFFSETS_X[upperIndex],
                top: TOOTH_CONTACT_UPPER_Y
            }));
            getSupportPins(contactDef).forEach((supportPin, supportIndex) => {
                borneDefs.push({
                    pin: supportPin,
                    left: x,
                    top: TOOTH_CONTACT_SPINE_Y[supportIndex],
                    className: 'borne real-barramento-pente-borne real-barramento-pente-support-borne'
                });
            });
            borneDefs.push({
                pin: getLowerPin(contactDef),
                left: x,
                top: TOOTH_CONTACT_LOWER_Y
            });
            if (inverted) {
                borneDefs.forEach((borneDef) => {
                    borneDef.top = mirrorY(borneDef.top);
                });
            }

            borneDefs.forEach((borneDef) => {
                let borneEl = existing.get(borneDef.pin);
                if (!borneEl) {
                    borneEl = document.createElement('div');
                    borneEl.className = borneDef.className || 'borne real-barramento-pente-borne';
                    borneEl.dataset.pino = borneDef.pin;
                }
                borneEl.className = borneDef.className || 'borne real-barramento-pente-borne';
                borneEl.style.left = `${borneDef.left}px`;
                borneEl.style.top = `${borneDef.top}px`;
                bornesEl.appendChild(borneEl);
                existing.delete(borneEl.dataset.pino);
            });
        });

        existing.forEach((borneEl) => borneEl.remove());
    }

    function renderBarramento(componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        const count = normalizeContacts(componentEl.dataset.penteContacts);
        const inverted = normalizeInverted(componentEl.dataset.penteInverted);
        const width = getWidthPx(count);
        const rootEl = componentEl.querySelector('.real-barramento-pente-root');
        const visualEl = componentEl.querySelector('.real-barramento-pente-visual');
        const bornesEl = componentEl.querySelector('.real-barramento-pente-bornes');

        componentEl.dataset.penteContacts = String(count);
        componentEl.dataset.penteInverted = inverted ? 'true' : 'false';
        componentEl.style.width = `${width}px`;
        componentEl.style.height = `${SVG_HEIGHT}px`;
        componentEl.style.overflow = 'visible';
        componentEl.style.background = 'transparent';
        componentEl.style.border = 'none';
        componentEl.style.boxShadow = 'none';
        if (rootEl) {
            rootEl.style.width = `${width}px`;
            rootEl.style.height = `${SVG_HEIGHT}px`;
        }

        if (visualEl) visualEl.innerHTML = buildVisualMarkup(count, inverted);
        if (bornesEl) syncBornes(componentEl, bornesEl, count, inverted);
    }

    window.initRealBarramentoPenteTrifasicoComponent = function (componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        renderBarramento(componentEl);
    };

    window.refreshRealBarramentoPenteTrifasicoComponent = function (componentEl) {
        if (!componentEl || componentEl.dataset.lib !== LIB_KEY) return;
        renderBarramento(componentEl);
    };

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Barramento Pente 3F',
        hiddenInMenu: true,
        icone: 'fa-grip-lines',
        tipo: 'barramento',
        tagDefault: 'BP3',
        foto: './componentes/real_barramento_pente_trifasico/preview.svg',
        html: () => `
            <div class="real-barramento-pente-root" style="width:${getWidthPx(DEFAULT_CONTACTS)}px;height:${SVG_HEIGHT}px;">
                <div class="real-barramento-pente-visual"></div>
                <div class="real-barramento-pente-bornes"></div>
            </div>
        `,
        mountComponent: (componentEl) => {
            renderBarramento(componentEl);
        },
        behavior: (inputs, estado, props, comp) => {
            const contacts = getContactDefs(comp?.dataset?.penteContacts);
            const shorts = [];
            const groupedLowerPins = new Map();

            contacts.forEach((contactDef) => {
                const lowerPin = getLowerPin(contactDef);
                getUpperPins(contactDef).forEach((upperPin) => {
                    shorts.push([upperPin, lowerPin]);
                });
                getSupportPins(contactDef).forEach((supportPin) => {
                    shorts.push([supportPin, lowerPin]);
                });
                if (!groupedLowerPins.has(contactDef.phase)) groupedLowerPins.set(contactDef.phase, []);
                groupedLowerPins.get(contactDef.phase).push(lowerPin);
            });

            groupedLowerPins.forEach((phasePins) => {
                phasePins.slice(1).forEach((lowerPin) => {
                    shorts.push([phasePins[0], lowerPin]);
                });
            });

            return {
                novoEstado: true,
                shorts,
                tipoVisual: 'ativo-local'
            };
        },
        exportData: (componentEl) => ({
            penteContacts: normalizeContacts(componentEl?.dataset?.penteContacts),
            penteInverted: normalizeInverted(componentEl?.dataset?.penteInverted)
        }),
        importData: (componentEl, payload) => {
            componentEl.dataset.penteContacts = String(normalizeContacts(payload?.penteContacts));
            componentEl.dataset.penteInverted = normalizeInverted(payload?.penteInverted) ? 'true' : 'false';
            renderBarramento(componentEl);
        }
    };
})();
