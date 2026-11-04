window.COMPONENTES['real_motor_6_ligacoes'] = {
    cat: 'Componentes Reais',
    nome: 'Motor 3F (6 ligações)',
    icone: 'fa-fan',
    tipo: 'motor',
    tagDefault: 'M1',
    foto: './componentes/real_motor_6_ligacoes/motor_6_ligacoes.webp',
    html: () => `
        <div class="real-motor-wrap" style="width:260px;height:230px;position:relative;">
            <img
                src="./componentes/real_motor_6_ligacoes/motor_6_ligacoes.webp"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <div class="motor-axis-indicator">
                <img
                    class="motor-axis-img motor-axis-cw"
                    src="./componentes/real_motor_6_ligacoes/setas_sent_horario.webp"
                    alt="Sentido horario"
                >
                <img
                    class="motor-axis-img motor-axis-ccw"
                    src="./componentes/real_motor_6_ligacoes/setas_sent_ant_horario.webp"
                    alt="Sentido anti-horario"
                >
            </div>
            <div class="motor-direction-label">
                <span class="motor-side motor-side-cw">Sentido horario</span>
                <span class="motor-side motor-side-ccw">Sentido anti-horario</span>
            </div>
            <div class="motor-error-text">Ligacao invalida (estrela/triangulo)</div>

            <div class="pin-label" data-pin-label="U1" style="left:5px;top:12px;">U1</div>
            <div class="pin-label" data-pin-label="V1" style="left:43px;top:12px;">V1</div>
            <div class="pin-label" data-pin-label="W1" style="left:80px;top:12px;">W1</div>
            <div class="pin-label" data-pin-label="U2" style="left:117px;top:12px;">U2</div>
            <div class="pin-label" data-pin-label="V2" style="left:155px;top:12px;">V2</div>
            <div class="pin-label" data-pin-label="W2" style="left:192px;top:12px;">W2</div>

            <div class="borne" data-pino="U1" style="left:-5px;top:-8px;"></div>
            <div class="borne" data-pino="V1" style="left:33px;top:-8px;"></div>
            <div class="borne" data-pino="W1" style="left:70px;top:-8px;"></div>
            <div class="borne" data-pino="U2" style="left:107px;top:-8px;"></div>
            <div class="borne" data-pino="V2" style="left:145px;top:-8px;"></div>
            <div class="borne" data-pino="W2" style="left:182px;top:-8px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const getBorne = (pino) => comp?.querySelector?.(`.borne[data-pino="${pino}"]`) || null;
        const getNode = (pino) => getBorne(pino)?._node || null;
        const areNodesConnected = (a, b) => {
            if (!a || !b) return false;
            if (a === b) return true;

            const adjacency = new Map();
            const link = (n1, n2) => {
                if (!n1 || !n2) return;
                if (!adjacency.has(n1)) adjacency.set(n1, new Set());
                if (!adjacency.has(n2)) adjacency.set(n2, new Set());
                adjacency.get(n1).add(n2);
                adjacency.get(n2).add(n1);
            };

            document.querySelectorAll('.component').forEach(c => {
                const shorts = Array.isArray(c._activeShorts) ? c._activeShorts : [];
                if (!shorts.length) return;

                const borneByPino = new Map();
                c.querySelectorAll('.borne').forEach(br => {
                    if (!br.dataset?.pino || !br._node) return;
                    borneByPino.set(br.dataset.pino, br._node);
                });

                shorts.forEach(([p1, p2]) => {
                    link(borneByPino.get(p1), borneByPino.get(p2));
                });
            });

            const seen = new Set([a]);
            const queue = [a];
            while (queue.length) {
                const cur = queue.shift();
                const nexts = adjacency.get(cur);
                if (!nexts) continue;
                for (const n of nexts) {
                    if (n === b) return true;
                    if (seen.has(n)) continue;
                    seen.add(n);
                    queue.push(n);
                }
            }
            return false;
        };
        const getNodePhaseId = (node) => {
            if (!node || !node.potenciais) return null;
            const ids = new Set();
            node.potenciais.forEach(p => {
                if (typeof p !== 'string') return;
                const m = p.match(/^FASE:(L[123])$/);
                if (m) ids.add(m[1]);
            });
            if (ids.size !== 1) return null;
            return Array.from(ids)[0];
        };
        const getDirection = (ids) => {
            const idx = { L1: 0, L2: 1, L3: 2 };
            const perm = ids.map(id => idx[id]);
            if (perm.some(v => typeof v !== 'number')) return null;
            let inversions = 0;
            for (let i = 0; i < perm.length; i++) {
                for (let j = i + 1; j < perm.length; j++) {
                    if (perm[i] > perm[j]) inversions++;
                }
            }
            return (inversions % 2 === 0) ? 'motor-cw' : 'motor-ccw';
        };

        const nU1 = getNode('U1');
        const nV1 = getNode('V1');
        const nW1 = getNode('W1');
        const nU2 = getNode('U2');
        const nV2 = getNode('V2');
        const nW2 = getNode('W2');

        const ids = [nU1, nV1, nW1].map(getNodePhaseId);
        const hasThreePhases = ids.every(Boolean) && (new Set(ids)).size === 3;
        if (!hasThreePhases) return { novoEstado: false, shorts: [] };

        const estrela = !!(nU2 && nV2 && nW2 &&
            areNodesConnected(nU2, nV2) && areNodesConnected(nV2, nW2));
        const trianguloA = !!(nU1 && nV1 && nW1 && nW2 && nU2 && nV2 &&
            areNodesConnected(nU1, nW2) &&
            areNodesConnected(nV1, nU2) &&
            areNodesConnected(nW1, nV2));
        const trianguloB = !!(nU1 && nV1 && nW1 && nV2 && nW2 && nU2 &&
            areNodesConnected(nU1, nV2) &&
            areNodesConnected(nV1, nW2) &&
            areNodesConnected(nW1, nU2));

        const fechado = estrela || trianguloA || trianguloB;
        if (!fechado) {
            return { novoEstado: false, shorts: [], tipoVisual: 'motor-erro' };
        }

        const direction = getDirection(ids);
        return {
            novoEstado: !!direction,
            shorts: [],
            visualPhasePairs: [['U1', 'U2'], ['V1', 'V2'], ['W1', 'W2']],
            tipoVisual: direction || 'motor-cw'
        };
    }
};

