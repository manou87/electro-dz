window.COMPONENTES['real_sinaleiro'] = {
    cat: 'Componentes Reais',
    nome: 'Sinaleiro',
    icone: 'fa-lightbulb',
    tipo: 'sinaleiro',
    tagDefault: 'H1',
    foto: './componentes/real_sinaleiro/sinaleiro_off.webp',
    html: () => `
        <div class="real-sinaleiro-wrap" style="width:240px;height:140px;position:relative;">
            <img
                class="real-sinaleiro-img real-sinaleiro-cor real-sinaleiro-cor-branco"
                src="./componentes/real_sinaleiro/sinaleiro_off.webp"
                data-fallback-png="./componentes/real_sinaleiro/sinaleiro_off.png"
                alt="Sinaleiro branco"
            >
            <img class="real-sinaleiro-img real-sinaleiro-cor real-sinaleiro-cor-verde" src="./componentes/real_sinaleiro/sinaleiro_verde_on.webp" data-fallback-png="./componentes/real_sinaleiro/sinaleiro_verde_on.png" alt="Sinaleiro verde">
            <img class="real-sinaleiro-img real-sinaleiro-cor real-sinaleiro-cor-vermelho" src="./componentes/real_sinaleiro/sinaleiro_vermelho_on.webp" data-fallback-png="./componentes/real_sinaleiro/sinaleiro_vermelho_on.png" alt="Sinaleiro vermelho">
            <img class="real-sinaleiro-img real-sinaleiro-cor real-sinaleiro-cor-amarelo" src="./componentes/real_sinaleiro/sinaleiro_amarelo_on.webp" data-fallback-png="./componentes/real_sinaleiro/sinaleiro_amarelo_on.png" alt="Sinaleiro amarelo">
            <img class="real-sinaleiro-img real-sinaleiro-cor real-sinaleiro-cor-azul" src="./componentes/real_sinaleiro/sinaleiro_azul_on.webp" data-fallback-png="./componentes/real_sinaleiro/sinaleiro_azul_on.png" alt="Sinaleiro azul">
            <div class="real-sinaleiro-luz" aria-hidden="true"></div>

            <div class="pin-label pin-top" data-pin-label="X1">X1</div>
            <div class="pin-label pin-bottom" data-pin-label="X2">X2</div>
            <div class="borne" data-pino="X1" style="left:190px;top:28px;"></div>
            <div class="borne" data-pino="X2" style="left:190px;top:82px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const getNode = (pino) => {
            const b = comp?.querySelector?.(`.borne[data-pino="${pino}"]`);
            return b ? b._node : null;
        };
        const getPhaseIds = (node) => {
            const ids = new Set();
            if (!node || !node.potenciais) return ids;
            node.potenciais.forEach(p => {
                if (typeof p === 'string' && p.startsWith('FASE:')) {
                    ids.add(p.slice('FASE:'.length));
                }
            });
            return ids;
        };
        const nX1 = getNode('X1');
        const nX2 = getNode('X2');
        const x1F = nX1?.potenciais?.has?.('FASE') || false;
        const x1N = nX1?.potenciais?.has?.('NEUTRO') || false;
        const x2F = nX2?.potenciais?.has?.('FASE') || false;
        const x2N = nX2?.potenciais?.has?.('NEUTRO') || false;
        const x1DcPlus = nX1?.potenciais?.has?.('12V') || nX1?.potenciais?.has?.('24V') || nX1?.potenciais?.has?.('+24V') || nX1?.potenciais?.has?.('V+') || false;
        const x1DcMinus = nX1?.potenciais?.has?.('0V') || nX1?.potenciais?.has?.('GND') || nX1?.potenciais?.has?.('M') || false;
        const x2DcPlus = nX2?.potenciais?.has?.('12V') || nX2?.potenciais?.has?.('24V') || nX2?.potenciais?.has?.('+24V') || nX2?.potenciais?.has?.('V+') || false;
        const x2DcMinus = nX2?.potenciais?.has?.('0V') || nX2?.potenciais?.has?.('GND') || nX2?.potenciais?.has?.('M') || false;

        let ligado = (x1F && x2N) || (x1N && x2F) || (x1DcPlus && x2DcMinus) || (x1DcMinus && x2DcPlus);
        if (!ligado) {
            const p1 = getPhaseIds(nX1);
            const p2 = getPhaseIds(nX2);
            if (p1.size && p2.size) {
                ligado = true;
                p1.forEach(id => {
                    if (p2.has(id)) ligado = false;
                });
            }
        }

        const visual = ligado ? 'sinal-on' : '';
        return { novoEstado: ligado, shorts: [], tipoVisual: visual };
    }
};
