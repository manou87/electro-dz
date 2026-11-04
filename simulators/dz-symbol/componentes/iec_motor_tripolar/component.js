window.COMPONENTES['iec_motor_tripolar'] = {
    cat: 'Simbologia IEC',
    nome: 'محرك ثلاثي الأطوار IEC',
    icone: 'fa-fan',
    tipo: 'motor',
    tagDefault: 'M1',
    foto: './componentes/iec_motor_tripolar/motor_tripolar_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:138px;height:150px;position:relative;margin-left:2px;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_motor_tripolar/motor_tripolar_0.svg" alt="Motor tripolar parado" style="object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_motor_tripolar/motor_tripolar_1.svg" alt="Motor tripolar em funcionamento" style="object-fit:fill;object-position:center center;">
            <div class="iec-motor-direction-indicator">
                <span class="iec-motor-direction-icon iec-motor-direction-icon-cw">↻</span>
                <span class="iec-motor-direction-icon iec-motor-direction-icon-ccw">↺</span>
                <span class="iec-motor-direction-text iec-motor-direction-text-cw">Sentido horario</span>
                <span class="iec-motor-direction-text iec-motor-direction-text-ccw">Sentido anti-horario</span>
            </div>

            <div class="borne" data-pino="U" style="left:calc(2px + var(--iec-motor-tripolar-borne-x-1, var(--iec-motor-tripolar-borne-x)));top:calc(-9px + var(--iec-motor-tripolar-borne-y-1, var(--iec-motor-tripolar-borne-y)));"></div>
            <div class="borne" data-pino="V" style="left:calc(29px + var(--iec-motor-tripolar-borne-x-2, var(--iec-motor-tripolar-borne-x)));top:calc(-9px + var(--iec-motor-tripolar-borne-y-2, var(--iec-motor-tripolar-borne-y)));"></div>
            <div class="borne" data-pino="W" style="left:calc(55px + var(--iec-motor-tripolar-borne-x-3, var(--iec-motor-tripolar-borne-x)));top:calc(-9px + var(--iec-motor-tripolar-borne-y-3, var(--iec-motor-tripolar-borne-y)));"></div>
            <div class="borne" data-pino="T" style="left:calc(82px + var(--iec-motor-tripolar-borne-x-4, var(--iec-motor-tripolar-borne-x)));top:calc(-8px + var(--iec-motor-tripolar-borne-y-4, var(--iec-motor-tripolar-borne-y)));"></div>
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
                const m = p.match(/^(FASE:|F-)(L[123])$/);
                if (m) ids.add(m[2]);
            });
            if (ids.size !== 1) return null;
            return Array.from(ids)[0];
        };
        const getDirection = (phaseIds) => {
            const idx = { L1: 0, L2: 1, L3: 2 };
            const perm = phaseIds.map(id => idx[id]);
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
        const direction = valid ? getDirection(ids) : null;
        return { novoEstado: !!direction, shorts: [], tipoVisual: direction || '' };
    }
};


