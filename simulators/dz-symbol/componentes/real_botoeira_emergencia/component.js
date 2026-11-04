window.COMPONENTES['real_botoeira_emergencia'] = {
    cat: 'Componentes Reais',
    nome: 'Botoeira Emergência',
    icone: 'fa-circle-exclamation',
    tipo: 'botao',
    tagDefault: 'S0',
    showTag: true,
    foto: './componentes/real_botoeira_emergencia/emergencia_0.webp',
    html: () => `
        <div class="real-botoeira-emergencia-wrap" style="width:170px;height:190px;position:relative;left:6px;">
            <img
                class="real-botoeira-emergencia-img real-botoeira-emergencia-state-0"
                src="./componentes/real_botoeira_emergencia/emergencia_0.webp"
                alt="Botoeira de emergência normal"
            >
            <img
                class="real-botoeira-emergencia-img real-botoeira-emergencia-state-1"
                src="./componentes/real_botoeira_emergencia/emergencia_1.webp"
                alt="Botoeira de emergência acionada"
            >
            <button
                type="button"
                class="toggle-state-btn real-botoeira-emergencia-toggle"
                title="Alternar botoeira de emergencia"
                aria-label="Alternar botoeira de emergencia"
            ></button>

            <div class="borne" data-pino="1" style="top:20px;left:16px;"></div>
            <div class="pin-label real-botoeira-emergencia-label-1" data-pin-label="1">1</div>
            <div class="borne" data-pino="2" style="bottom:20px;left:16px;"></div>
            <div class="pin-label real-botoeira-emergencia-label-2" data-pin-label="2">2</div>
        </div>
    `,
    onPlaced: (comp, context = {}) => {
        window.openRealBotoeiraConfigModal?.(comp, {
            frontalLib: 'real_botoeira_emergencia_frontal',
            lateralLib: 'real_botoeira_emergencia',
            title: 'Configurar botoeira de emergencia',
            defaultView: 'lateral',
            defaultContactConfig: '2nf',
            tagDefault: 'S0',
            skip: !!context.skipBotoeiraConfig
        });
    },
    onDoubleActivate: (comp) => {
        window.openRealBotoeiraConfigModal?.(comp, {
            frontalLib: 'real_botoeira_emergencia_frontal',
            lateralLib: 'real_botoeira_emergencia',
            title: 'Configurar botoeira de emergencia',
            defaultView: 'lateral',
            defaultContactConfig: '2nf',
            tagDefault: 'S0'
        });
        return true;
    },
    behavior: (inputs, estado, props, comp) => {
        const acionada = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: acionada,
            shorts: acionada ? [] : [['1', '2']],
            tipoVisual: acionada ? 'ativo' : ''
        };
    }
};
