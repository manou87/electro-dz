(function () {
    const LIB_KEY = 'iec_rele_seguranca';

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

    function makeBorne(pin, index, left, top) {
        return `<div class="borne" data-pino="${pin}" style="left:calc(${left}px + var(--iec-rele-seguranca-borne-x-${index}, var(--iec-rele-seguranca-borne-x, 0px)));top:calc(${top}px + var(--iec-rele-seguranca-borne-y-${index}, var(--iec-rele-seguranca-borne-y, 0px)));"></div>`;
    }

    function html() {
        return `
            <div class="iec-dual-state-wrap" style="width:430px;height:382.5px;position:relative;">
                <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_rele_seguranca/rele_seg_0.svg" alt="Relé de segurança em repouso" style="object-fit:fill;object-position:center center;">
                <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_rele_seguranca/rele_seg_1.svg" alt="Relé de segurança acionado" style="object-fit:fill;object-position:center center;">

                ${makeBorne('Y1', 1, 18, -25)}
                ${makeBorne('Y2', 2, 58, -25)}
                ${makeBorne('13', 3, 178, -25)}
                ${makeBorne('23', 4, 218, -25)}
                ${makeBorne('33', 5, 258, -25)}
                ${makeBorne('41', 6, 298, -25)}
                ${makeBorne('A1', 7, 398, -25)}

                ${makeBorne('S22', 8, 18, 355)}
                ${makeBorne('S21', 9, 58, 355)}
                ${makeBorne('S12', 10, 98, 355)}
                ${makeBorne('S11', 11, 138, 355)}
                ${makeBorne('14', 12, 178, 355)}
                ${makeBorne('24', 13, 218, 355)}
                ${makeBorne('34', 14, 258, 355)}
                ${makeBorne('42', 15, 358, 355)}
                ${makeBorne('A2', 16, 398, 355)}
            </div>
        `;
    }

    function getNodeByPin(comp, pin) {
        return comp?.querySelector?.(`.borne[data-pino="${pin}"]`) ?._node || null;
    }

    function getAllActiveShorts() {
        return Array.from(document.querySelectorAll('.component')).flatMap(c => {
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
    }

    function areNodesConnected(nodeA, nodeB, activeShorts) {
        if (!nodeA || !nodeB) return false;
        if (nodeA === nodeB) return true;
        const visited = new Set();
        const queue = [nodeA];
        while (queue.length) {
            const current = queue.shift();
            if (current === nodeB) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            for (const edge of activeShorts) {
                if (edge.n1 === current && !visited.has(edge.n2)) queue.push(edge.n2);
                else if (edge.n2 === current && !visited.has(edge.n1)) queue.push(edge.n1);
            }
        }
        return false;
    }

    function nodeHasPhase(node) {
        if (!node?.potenciais) return false;
        return node.potenciais.has('FASE') || Array.from(node.potenciais).some(p => String(p || '').startsWith('FASE:'));
    }

    function nodeHasNeutral(node) {
        if (!node?.potenciais) return false;
        return node.potenciais.has('NEUTRO');
    }

    function hasPowerOnNodes(comp, pinA, pinB) {
        const nodeA = getNodeByPin(comp, pinA);
        const nodeB = getNodeByPin(comp, pinB);
        if (!nodeA || !nodeB) return false;
        const aPhase = nodeHasPhase(nodeA);
        const aNeutral = nodeHasNeutral(nodeA);
        const bPhase = nodeHasPhase(nodeB);
        const bNeutral = nodeHasNeutral(nodeB);
        return (aPhase && bNeutral) || (aNeutral && bPhase);
    }

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Simbologia IEC',
        nome: 'مرحل أمان',
        icone: 'fa-shield-halved',
        tipo: 'rele',
        showTag: true,
        tagDefault: 'SR1',
        foto: './componentes/iec_rele_seguranca/rele_seg_0.svg',
        html,
        behavior: (inputs, estado, props, comp) => {
            const activeShorts = getAllActiveShorts();
            const hasContinuity = (pinA, pinB) => {
                const nodeA = getNodeByPin(comp, pinA);
                const nodeB = getNodeByPin(comp, pinB);
                if (nodeA && nodeB && areNodesConnected(nodeA, nodeB, activeShorts)) {
                    return true;
                }
                return samePotential(inputs[pinA], inputs[pinB]);
            };

            const powerValid = hasPowerOnNodes(comp, 'A1', 'A2') || hasValid24V(inputs['A1'], inputs['A2']);
            const channel1Closed = hasContinuity('S11', 'S12');
            const channel2Closed = hasContinuity('S21', 'S22');
            const resetClosed = hasContinuity('Y1', 'Y2');

            if (!comp._srInitialized) {
                comp._srInitialized = true;
                comp._srArmed = false;
                comp._srResetPrev = false;
            }

            if (!powerValid) {
                comp._srArmed = false;
            } else {
                const safetyLoopOpen = !channel1Closed || !channel2Closed;
                if (safetyLoopOpen) {
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
            const shorts = energized
                ? [['13', '14'], ['23', '24'], ['33', '34']]
                : [['41', '42']];

            const visualPhasePairs = powerValid
                ? [['A1', 'S11'], ['A1', 'S21']]
                : [];

            return {
                novoEstado: energized,
                shorts,
                visualPhasePairs,
                tipoVisual: energized ? 'ativo' : ''
            };
        }
    };
})();
