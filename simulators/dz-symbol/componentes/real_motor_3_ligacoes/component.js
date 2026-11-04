window.COMPONENTES['real_motor_3_ligacoes'] = {
    cat: 'Componentes Reais',
    nome: 'Motor 3F (3 ligações)',
    icone: 'fa-fan',
    tipo: 'motor',
    tagDefault: 'M1',
    foto: './componentes/real_motor_3_ligacoes/motor_3_ligacoes.webp',
    html: () => `
        <div class="real-motor-wrap" style="width:240px;height:220px;position:relative;">
            <img
                src="./componentes/real_motor_3_ligacoes/motor_3_ligacoes.webp"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <div class="motor-axis-indicator">
                <img
                    class="motor-axis-img motor-axis-cw"
                    src="./componentes/real_motor_3_ligacoes/setas_sent_horario.webp"
                    alt="Sentido horario"
                >
                <img
                    class="motor-axis-img motor-axis-ccw"
                    src="./componentes/real_motor_3_ligacoes/setas_sent_ant_horario.webp"
                    alt="Sentido anti-horario"
                >
            </div>
            <div class="motor-direction-label">
                <span class="motor-side motor-side-cw">Sentido horario</span>
                <span class="motor-side motor-side-ccw">Sentido anti-horario</span>
            </div>

            <div class="borne" data-pino="U" style="left:17px;top:-8px;"></div>
            <div class="borne" data-pino="V" style="left:54px;top:-8px;"></div>
            <div class="borne" data-pino="W" style="left:89px;top:-8px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const getBorneNode = (pino) => {
            const b = comp?.querySelector?.(`.borne[data-pino="${pino}"]`);
            return b?._node || null;
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

        const ids = ['U', 'V', 'W'].map(pino => getNodePhaseId(getBorneNode(pino)));
        const valid = ids.every(Boolean) && (new Set(ids)).size === 3;
        if (!valid) return { novoEstado: false, shorts: [] };

        const direction = getDirection(ids);
        return {
            novoEstado: !!direction,
            shorts: [],
            tipoVisual: direction || 'motor-cw'
        };
    }
};


