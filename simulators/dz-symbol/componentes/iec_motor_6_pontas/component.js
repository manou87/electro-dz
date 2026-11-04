window.COMPONENTES['iec_motor_6_pontas'] = {
    cat: 'Simbologia IEC',
    nome: 'Motor 3F (6 pontas)',
    icone: 'fa-fan',
    tipo: 'motor',
    tagDefault: 'M1',
    foto: './componentes/iec_motor_6_pontas/motor_6_pontas_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:167.5px;height:222px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_motor_6_pontas/motor_6_pontas_0.svg" alt="Motor 3F de 6 pontas parado" style="object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_motor_6_pontas/motor_6_pontas_1.svg" alt="Motor 3F de 6 pontas em funcionamento" style="object-fit:fill;object-position:center center;">
            <div class="iec-motor-direction-indicator">
                <span class="iec-motor-direction-icon iec-motor-direction-icon-cw">&#8635;</span>
                <span class="iec-motor-direction-icon iec-motor-direction-icon-ccw">&#8634;</span>
                <span class="iec-motor-direction-text iec-motor-direction-text-cw">Sentido hor&aacute;rio</span>
                <span class="iec-motor-direction-text iec-motor-direction-text-ccw">Sentido anti-hor&aacute;rio</span>
                <span class="iec-motor-closure iec-motor-closure-star">Estrela</span>
                <span class="iec-motor-closure iec-motor-closure-delta">Tri&acirc;ngulo</span>
            </div>
            <div class="motor-error-text">Liga&ccedil;&atilde;o inv&aacute;lida (estrela/tri&acirc;ngulo)</div>

            <div class="pin-label" data-pin-label="U1" style="left:21px;top:-18px;font-size:14px;font-weight:700;transform:translate(-50%,-50%);">U1</div>
            <div class="pin-label" data-pin-label="V1" style="left:70px;top:-18px;font-size:14px;font-weight:700;transform:translate(-50%,-50%);">V1</div>
            <div class="pin-label" data-pin-label="W1" style="left:118px;top:-18px;font-size:14px;font-weight:700;transform:translate(-50%,-50%);">W1</div>
            <div class="pin-label" data-pin-label="U2" style="left:22px;top:238px;font-size:14px;font-weight:700;transform:translate(-50%,-50%);">U2</div>
            <div class="pin-label" data-pin-label="V2" style="left:70px;top:238px;font-size:14px;font-weight:700;transform:translate(-50%,-50%);">V2</div>
            <div class="pin-label" data-pin-label="W2" style="left:119px;top:238px;font-size:14px;font-weight:700;transform:translate(-50%,-50%);">W2</div>
            <div class="pin-label" data-pin-label="PE" style="left:171px;top:-18px;font-size:14px;font-weight:700;color:#0d6b2f;transform:translate(0,-50%);">PE</div>

            <div class="borne" data-pino="U1" style="left:12px;top:-8px;"></div>
            <div class="borne" data-pino="V1" style="left:61px;top:-8px;"></div>
            <div class="borne" data-pino="W1" style="left:109px;top:-8px;"></div>
            <div class="borne" data-pino="U2" style="left:13px;top:214px;"></div>
            <div class="borne" data-pino="V2" style="left:61px;top:214px;"></div>
            <div class="borne" data-pino="W2" style="left:110px;top:214px;"></div>
            <div class="borne" data-pino="T" style="left:156px;top:-8px;"></div>
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
                const m = p.match(/^(FASE:|F-)(L[123])$/);
                if (m) ids.add(m[2]);
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
        const closure = estrela ? 'estrela' : 'triangulo';
        return {
            novoEstado: !!direction,
            shorts: [],
            visualPhasePairs: [['U1', 'U2'], ['V1', 'V2'], ['W1', 'W2']],
            tipoVisual: (direction || 'motor-cw') + '-' + closure
        };
    }
};
