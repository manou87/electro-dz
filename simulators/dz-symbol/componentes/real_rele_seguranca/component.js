(function () {
    const LIB_KEY = 'real_rele_seguranca';
    const STYLE_ID = 'real-rele-seguranca-style';
    const FRAME_LEFT = 6;
    const FRAME_WIDTH = 188;
    const FRAME_HEIGHT = 709;

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] {
    min-width: ${FRAME_LEFT + FRAME_WIDTH + 6}px;
    min-height: ${FRAME_HEIGHT}px;
}
.real-rele-seguranca-frame {
    position: relative;
    left: ${FRAME_LEFT}px;
    width: ${FRAME_WIDTH}px;
    height: ${FRAME_HEIGHT}px;
}
.real-rele-seguranca-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}
.real-rele-seguranca-led {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    opacity: 1;
    box-shadow: none;
    pointer-events: none;
}
.real-rele-seguranca-led-pwr {
    background: #45ff5a;
}
.real-rele-seguranca-led-ch1,
.real-rele-seguranca-led-ch2 {
    background: #ffe94d;
}
`;
        document.head.appendChild(style);
    }

    function borneStyle(index, left, top) {
        return `left:calc(${FRAME_LEFT + left}px + var(--real-rele-seguranca-borne-x-${index}, var(--real-rele-seguranca-borne-x, 0px)));top:calc(${top}px + var(--real-rele-seguranca-borne-y-${index}, var(--real-rele-seguranca-borne-y, 0px)));`;
    }

    function ledStyle(kind, left, top) {
        return `left:calc(${FRAME_LEFT + left}px + var(--real-rele-seguranca-led-${kind}-x, 0px));top:calc(${top}px + var(--real-rele-seguranca-led-${kind}-y, 0px));`;
    }

    function normalize(value) {
        return String(value || '').trim().toUpperCase();
    }

    function samePotential(a, b) {
        const pa = normalize(a);
        const pb = normalize(b);
        return !!pa && !!pb && pa === pb;
    }

    function is24Positive(value) {
        const v = normalize(value);
        return !!v && (
            v === '24V' ||
            v === '+24V' ||
            v === '24V+' ||
            v === '24VDC+' ||
            v === 'DC+24V' ||
            v === 'P24' ||
            v === 'FASE'
        );
    }

    function is24Negative(value) {
        const v = normalize(value);
        return !!v && (
            v === '0V' ||
            v === '-24V' ||
            v === '24V-' ||
            v === '24VDC-' ||
            v === 'DC-24V' ||
            v === 'M24' ||
            v === 'NEUTRO'
        );
    }

    function hasValid24V(a, b) {
        return (is24Positive(a) && is24Negative(b)) || (is24Positive(b) && is24Negative(a));
    }

    function html() {
        return `
            <div class="component-fine-adjust real-rele-seguranca-frame">
                <img class="real-rele-seguranca-img" src="./componentes/real_rele_seguranca/rele_seguranca.webp" alt="Relé de segurança">
            </div>

            <div class="borne" data-pino="41" style="${borneStyle(1, 24, 24)}"></div>
            <div class="borne" data-pino="13" style="${borneStyle(2, 66, 24)}"></div>
            <div class="borne" data-pino="23" style="${borneStyle(3, 109, 24)}"></div>
            <div class="borne" data-pino="33" style="${borneStyle(4, 151, 24)}"></div>

            <div class="borne" data-pino="A1" style="${borneStyle(5, 24, 179)}"></div>
            <div class="borne" data-pino="Y1" style="${borneStyle(6, 66, 179)}"></div>
            <div class="borne" data-pino="S21" style="${borneStyle(7, 109, 179)}"></div>
            <div class="borne" data-pino="S22" style="${borneStyle(8, 151, 179)}"></div>

            <div class="borne" data-pino="S11" style="${borneStyle(9, 24, 514)}"></div>
            <div class="borne" data-pino="S12" style="${borneStyle(10, 66, 514)}"></div>
            <div class="borne" data-pino="Y2" style="${borneStyle(11, 109, 514)}"></div>
            <div class="borne" data-pino="A2" style="${borneStyle(12, 151, 514)}"></div>

            <div class="borne" data-pino="42" style="${borneStyle(13, 24, 668)}"></div>
            <div class="borne" data-pino="14" style="${borneStyle(14, 66, 668)}"></div>
            <div class="borne" data-pino="24" style="${borneStyle(15, 109, 668)}"></div>
            <div class="borne" data-pino="34" style="${borneStyle(16, 151, 668)}"></div>

            <div class="real-rele-seguranca-led real-rele-seguranca-led-pwr" title="Alimentação 24V OK" style="${ledStyle('pwr', 36, 256)}"></div>
            <div class="real-rele-seguranca-led real-rele-seguranca-led-ch1" title="Canal S11-S12 fechado" style="${ledStyle('ch1', 36, 306)}"></div>
            <div class="real-rele-seguranca-led real-rele-seguranca-led-ch2" title="Canal S21-S22 fechado" style="${ledStyle('ch2', 36, 356)}"></div>
        `;
    }

    ensureStyle();

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'مرحل أمان',
        icone: 'fa-shield-halved',
        tipo: 'rele',
        tagDefault: 'SR1',
        showTag: true,
        foto: './componentes/real_rele_seguranca/rele_seguranca.webp',
        html,
        behavior: (inputs, estado, props, comp) => {
            const getNodeByPin = (pin) => comp?.querySelector?.(`.borne[data-pino="${pin}"]`) ?._node || null;
            const getNodePotentials = (pin) => {
                const node = getNodeByPin(pin);
                if (!node?.potenciais) return [];
                return Array.from(node.potenciais).map(v => String(v || '')).sort();
            };
            const nodeHasPhase = (node) => {
                if (!node?.potenciais) return false;
                return node.potenciais.has('FASE') || Array.from(node.potenciais).some(p => String(p || '').startsWith('FASE:'));
            };
            const nodeHasNeutral = (node) => {
                if (!node?.potenciais) return false;
                return node.potenciais.has('NEUTRO');
            };
            const hasPowerOnNodes = (pinA, pinB) => {
                const nodeA = getNodeByPin(pinA);
                const nodeB = getNodeByPin(pinB);
                if (!nodeA || !nodeB) return false;
                const aPhase = nodeHasPhase(nodeA);
                const aNeutral = nodeHasNeutral(nodeA);
                const bPhase = nodeHasPhase(nodeB);
                const bNeutral = nodeHasNeutral(nodeB);
                return (aPhase && bNeutral) || (aNeutral && bPhase);
            };
            const activeShortsEngine = Array.from(document.querySelectorAll('.component')).flatMap(c => {
                const localBornes = Array.from(c.querySelectorAll('.borne'));
                const cShorts = Array.isArray(c._activeShorts) ? c._activeShorts : [];
                if (!cShorts.length) return [];
                return cShorts.map(([p1, p2]) => {
                    const b1 = localBornes.find(b => b.dataset.pino === p1);
                    const b2 = localBornes.find(b => b.dataset.pino === p2);
                    if (!b1?._node || !b2?._node) return null;
                    return { n1: b1._node, n2: b2._node };
                }).filter(Boolean);
            });
            const areNodesConnected = (nodeA, nodeB) => {
                if (!nodeA || !nodeB) return false;
                if (nodeA === nodeB) return true;
                const visited = new Set();
                const queue = [nodeA];
                while (queue.length) {
                    const current = queue.shift();
                    if (current === nodeB) return true;
                    visited.add(current);
                    for (const edge of activeShortsEngine) {
                        if (edge.n1 === current && !visited.has(edge.n2)) queue.push(edge.n2);
                        else if (edge.n2 === current && !visited.has(edge.n1)) queue.push(edge.n1);
                    }
                }
                return false;
            };
            const hasContinuity = (pinA, pinB) => {
                const nodeA = getNodeByPin(pinA);
                const nodeB = getNodeByPin(pinB);
                if (nodeA && nodeB) {
                    if (areNodesConnected(nodeA, nodeB)) return true;
                }
                return samePotential(inputs[pinA], inputs[pinB]);
            };

            const powerValid = hasPowerOnNodes('A1', 'A2') || hasValid24V(inputs['A1'], inputs['A2']);
            const channel1Closed = hasContinuity('S11', 'S12');
            const channel2Closed = hasContinuity('S21', 'S22');
            const resetClosed = hasContinuity('Y1', 'Y2');

            if (!comp._srInitialized) {
                comp._srInitialized = true;
                comp._srArmed = false;
                comp._srResetPrev = false;
            }

            if (!powerValid) {
                // Sempre que perder alimentacao, volta desabilitado.
                comp._srArmed = false;
            } else {
                const safetyLoopOpen = !channel1Closed || !channel2Closed;
                if (safetyLoopOpen) {
                    // Qualquer abertura monitorada derruba as saidas
                    // e exige novo reset.
                    comp._srArmed = false;
                } else {
                    const resetPulse = !!resetClosed && !comp._srResetPrev;
                    if (resetPulse) {
                        comp._srArmed = true;
                    }
                }
            }
            comp._srResetPrev = !!resetClosed;

            const energized = !!(powerValid && channel1Closed && channel2Closed && comp._srArmed);
            const shorts = [];
            if (energized) {
                shorts.push(['13', '14'], ['23', '24'], ['33', '34']);
            } else {
                shorts.push(['41', '42']);
            }

            const ledPower = comp?.querySelector?.('.real-rele-seguranca-led-pwr');
            const ledCh1 = comp?.querySelector?.('.real-rele-seguranca-led-ch1');
            const ledCh2 = comp?.querySelector?.('.real-rele-seguranca-led-ch2');
            if (ledPower) {
                ledPower.style.opacity = '1';
                ledPower.style.filter = powerValid ? 'brightness(1.2)' : 'brightness(0.42)';
                ledPower.style.boxShadow = powerValid ? '0 0 10px rgba(76, 255, 76, 0.85)' : 'none';
            }
            if (ledCh1) {
                const ch1Ok = !!(powerValid && channel1Closed);
                ledCh1.style.opacity = '1';
                ledCh1.style.filter = ch1Ok ? 'brightness(1.18)' : 'brightness(0.42)';
                ledCh1.style.boxShadow = ch1Ok ? '0 0 10px rgba(255, 235, 59, 0.85)' : 'none';
            }
            if (ledCh2) {
                const ch2Ok = !!(powerValid && channel2Closed);
                ledCh2.style.opacity = '1';
                ledCh2.style.filter = ch2Ok ? 'brightness(1.18)' : 'brightness(0.42)';
                ledCh2.style.boxShadow = ch2Ok ? '0 0 10px rgba(255, 235, 59, 0.85)' : 'none';
            }

            const visualPhasePairs = powerValid
                ? [['A1', 'S11'], ['A1', 'S21']]
                : [];

            return {
                novoEstado: energized,
                shorts,
                visualPhasePairs,
                tipoVisual: energized ? 'ativo' : (powerValid ? 'monitorando' : '')
            };
        }
    };
})();
