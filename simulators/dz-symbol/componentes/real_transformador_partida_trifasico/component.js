window.COMPONENTES['real_transformador_partida_trifasico'] = {
    cat: 'Comandos Realistas',
    nome: 'Trafo Partida 3F Real',
    icone: 'fa-bolt',
    tipo: 'transformador',
    html: () => `
        <div style="width:236px;height:236px;position:relative;">
            <img src="./componentes/real_transformador_partida_trifasico/trafo_partida_3f.webp" style="width:236px;height:236px;pointer-events:none;user-select:none;">

            <div class="borne" data-pino="L1_100" style="left:4px;top:40px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l1-100-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l1-100-y, 0px)));" title="L1 100%"></div>
            <div class="borne" data-pino="L1_80" style="left:4px;top:80px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l1-80-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l1-80-y, 0px)));" title="L1 80%"></div>
            <div class="borne" data-pino="L1_65" style="left:4px;top:120px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l1-65-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l1-65-y, 0px)));" title="L1 65%"></div>
            <div class="borne" data-pino="L1_0" style="left:4px;top:160px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l1-0-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l1-0-y, 0px)));" title="L1 0"></div>

            <div class="borne" data-pino="L2_100" style="left:76px;top:40px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l2-100-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l2-100-y, 0px)));" title="L2 100%"></div>
            <div class="borne" data-pino="L2_80" style="left:76px;top:80px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l2-80-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l2-80-y, 0px)));" title="L2 80%"></div>
            <div class="borne" data-pino="L2_65" style="left:76px;top:120px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l2-65-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l2-65-y, 0px)));" title="L2 65%"></div>
            <div class="borne" data-pino="L2_0" style="left:76px;top:160px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l2-0-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l2-0-y, 0px)));" title="L2 0"></div>

            <div class="borne" data-pino="L3_100" style="left:149px;top:40px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l3-100-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l3-100-y, 0px)));" title="L3 100%"></div>
            <div class="borne" data-pino="L3_80" style="left:149px;top:80px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l3-80-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l3-80-y, 0px)));" title="L3 80%"></div>
            <div class="borne" data-pino="L3_65" style="left:149px;top:120px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l3-65-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l3-65-y, 0px)));" title="L3 65%"></div>
            <div class="borne" data-pino="L3_0" style="left:149px;top:160px;transform:translate(calc(var(--real-transformador-partida-trifasico-borne-x, 0px) + var(--real-transformador-partida-trifasico-borne-l3-0-x, 0px)), calc(var(--real-transformador-partida-trifasico-borne-y, 0px) + var(--real-transformador-partida-trifasico-borne-l3-0-y, 0px)));" title="L3 0"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const phases = ['L1', 'L2', 'L3'];
        const bornes = Array.from(comp.querySelectorAll('.borne'));
        const shorts = [];
        const visualPhasePairs = [];

        // Coleta todos os curtos ativos no momento na engine para Pathfinding
        const curtosEngine = Array.from(document.querySelectorAll('.component')).flatMap(c => {
            const bLocais = Array.from(c.querySelectorAll('.borne'));
            const cShorts = c._activeShorts || [];
            if (!cShorts.length) return [];
            
            const tag = c.dataset.tag || COMPONENTES[c.dataset.lib]?.tagDefault || 'comp';
            return cShorts.map(([p1, p2]) => {
                const b1 = bLocais.find(b => b.dataset.pino === p1);
                const b2 = bLocais.find(b => b.dataset.pino === p2);
                if (!b1?._node || !b2?._node) return null;
                return { n1: b1._node, n2: b2._node, comp: tag };
            }).filter(Boolean);
        });

        // Helper de Pathfinding (BFS) para ver se dois nós estão unidos eletricamente (ponto estrela)
        const estaoConectados = (nodeA, nodeB) => {
            if (!nodeA || !nodeB) return false;
            if (nodeA === nodeB) return true;
            const visitados = new Set();
            const fila = [nodeA];
            while (fila.length > 0) {
                const atual = fila.shift();
                if (atual === nodeB) return true;
                visitados.add(atual);
                for (const edge of curtosEngine) {
                    if (edge.n1 === atual && !visitados.has(edge.n2)) fila.push(edge.n2);
                    else if (edge.n2 === atual && !visitados.has(edge.n1)) fila.push(edge.n1);
                }
            }
            return false;
        };

        const node0L1 = bornes.find(b => b.dataset.pino === 'L1_0')?._node;
        const node0L2 = bornes.find(b => b.dataset.pino === 'L2_0')?._node;
        const node0L3 = bornes.find(b => b.dataset.pino === 'L3_0')?._node;

        // Estrela está OK se L1_0, L2_0 e L3_0 estão unidos entre si
        const c12 = estaoConectados(node0L1, node0L2);
        const c23 = estaoConectados(node0L2, node0L3);
        const estrelaOK = !!(node0L1 && node0L2 && node0L3 && c12 && c23);

        phases.forEach((ph) => {
            const p100 = inputs[`${ph}_100`];
            // Se o ponto 100% tem fase E o ponto estrela está fechado
            if (p100 && estrelaOK) {
                // Ativa a indução para os taps de 80% e 65%
                shorts.push([`${ph}_100`, `${ph}_80`], [`${ph}_100`, `${ph}_65`]);
                visualPhasePairs.push([`${ph}_100`, `${ph}_0`]);
            }
        });

        const active = shorts.length > 0;
        return {
            novoEstado: active,
            shorts,
            visualPhasePairs,
            tipoVisual: active ? 'ativo' : ''
        };
    }
};
