(function () {
    const LIB_KEY = 'iec_rele_falta_fase';
    const TAG_DEFAULT = 'RFF1';
    const ZERO_GLITCH_HOLD_MS = 140;

    function normalize(value) {
        return String(value || '').trim().toUpperCase();
    }

    function isPhaseLike(value) {
        const v = normalize(value);
        return v === 'FASE' || v.startsWith('FASE:') || v === 'L1' || v === 'L2' || v === 'L3' || v === 'R' || v === 'S' || v === 'T';
    }

    function canonicalPhaseId(value) {
        const v = normalize(value);
        if (v === 'R') return 'L1';
        if (v === 'S') return 'L2';
        if (v === 'T') return 'L3';
        return v;
    }

    function extractPhaseId(value, fallback) {
        const v = normalize(value);
        if (!v) return '';
        if (v.startsWith('FASE:')) return canonicalPhaseId(v.slice(5).trim() || fallback);
        if (v === 'FASE') return canonicalPhaseId(fallback || 'GEN');
        if (v === 'L1' || v === 'L2' || v === 'L3' || v === 'R' || v === 'S' || v === 'T') return canonicalPhaseId(v);
        return '';
    }

    function getNodeByPin(comp, pin) {
        return comp?.querySelector?.(`.borne[data-pino="${pin}"]`) ?._node || null;
    }

    function collectPhaseIds(comp, pin, fallbackLabel, inputValue) {
        const ids = new Set();
        const node = getNodeByPin(comp, pin);
        if (node?.potenciais) {
            Array.from(node.potenciais).forEach((potential) => {
                if (!isPhaseLike(potential)) return;
                const id = extractPhaseId(potential, fallbackLabel);
                if (id) ids.add(id);
            });
        }
        if (isPhaseLike(inputValue)) {
            const id = extractPhaseId(inputValue, fallbackLabel);
            if (id) ids.add(id);
        }
        return Array.from(ids);
    }

    function evaluatePhaseState(comp, inputs, pinDefs) {
        const activePins = [];
        pinDefs.forEach(({ pin, label }) => {
            const ids = collectPhaseIds(comp, pin, label, inputs?.[pin]);
            if (!ids.includes(canonicalPhaseId(label))) return;
            activePins.push(pin);
        });
        const presentCount = activePins.length;
        const powered = presentCount === pinDefs.length;
        const alarm = presentCount > 0 && presentCount < pinDefs.length;
        return { presentCount, powered, alarm };
    }

    function makeBorne(pin, index, left, top) {
        return `<div class="borne" data-pino="${pin}" style="left:calc(${left}px + var(--iec-rele-falta-fase-borne-x-${index}, var(--iec-rele-falta-fase-borne-x, 0px)));top:calc(${top}px + var(--iec-rele-falta-fase-borne-y-${index}, var(--iec-rele-falta-fase-borne-y, 0px)));"></div>`;
    }

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Simbologia IEC',
        nome: 'مرحل سقوط الطور',
        icone: 'fa-wave-square',
        tipo: 'rele',
        showTag: true,
        tagDefault: TAG_DEFAULT,
        foto: './componentes/iec_rele_falta_fase/rele_falta_fase_0.svg',
        html: () => `
            <div class="iec-dual-state-wrap" style="width:110px;height:74.5px;position:relative;">
                <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_rele_falta_fase/rele_falta_fase_0.svg" alt="Relé de falta de fase em repouso" style="object-fit:fill;object-position:center center;">
                <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_rele_falta_fase/rele_falta_fase_1.svg" alt="Relé de falta de fase acionado" style="object-fit:fill;object-position:center center;">
                ${makeBorne('1', 1, 12, -10)}
                ${makeBorne('2', 2, 52, -10)}
                ${makeBorne('3', 3, 92, -10)}
            </div>
        `,
        behavior: (inputs, estado, props, comp) => {
            const pinDefs = [
                { pin: '1', label: 'L1' },
                { pin: '2', label: 'L2' },
                { pin: '3', label: 'L3' }
            ];
            const rawPhaseState = evaluatePhaseState(comp, inputs || {}, pinDefs);
            const now = Date.now();
            let phaseState = rawPhaseState;

            if (comp) {
                if (rawPhaseState.presentCount > 0) {
                    comp._rffLastNonZeroPhaseState = { ...rawPhaseState, ts: now };
                } else if (comp._rffLastNonZeroPhaseState && (now - comp._rffLastNonZeroPhaseState.ts) <= ZERO_GLITCH_HOLD_MS) {
                    phaseState = {
                        presentCount: comp._rffLastNonZeroPhaseState.presentCount,
                        powered: comp._rffLastNonZeroPhaseState.powered,
                        alarm: comp._rffLastNonZeroPhaseState.alarm
                    };
                }
            }
            return {
                novoEstado: phaseState.powered,
                shorts: [],
                tipoVisual: phaseState.powered ? 'ativo' : (phaseState.alarm ? 'monitorando' : '')
            };
        }
    };
})();
