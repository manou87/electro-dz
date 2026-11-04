window.COMPONENTES['real_botoeira_verde'] = {
    cat: 'Componentes Reais',
    nome: 'Botoeira Verde',
    icone: 'fa-circle',
    tipo: 'botao',
    pressable: 'momentary',
    foto: './componentes/real_botoeira_verde/botoeira_verde.webp',
    fotoPressionada: './componentes/real_botoeira_verde/botoeira_verde_1.webp',
    html: () => `
        <div class="real-botoeira-wrap" style="width:120px;height:180px;position:relative;left:10px;">
            <img
                class="real-botoeira-img real-botoeira-off"
                src="./componentes/real_botoeira_verde/botoeira_verde.webp"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;transform:rotate(90deg);transform-origin:center center;"
            >
            <img
                class="real-botoeira-img real-botoeira-on"
                src="./componentes/real_botoeira_verde/botoeira_verde_1.webp"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;transform:rotate(90deg);transform-origin:center center;"
            >
            <div class="borne" data-pino="3" style="bottom:110px;left:5px;"></div>
            <div class="borne" data-pino="4" style="bottom:40px;left:10px;"></div>
        </div>
    `,
    onPlaced: (comp, context = {}) => {
        window.openRealBotoeiraConfigModal?.(comp, {
            frontalLib: 'real_botoeira_verde_frontal',
            lateralLib: 'real_botoeira_verde',
            title: 'Configurar botoeira verde',
            defaultView: 'lateral',
            defaultContactConfig: '2na',
            tagDefault: 'S1',
            skip: !!context.skipBotoeiraConfig
        });
    },
    onDoubleActivate: (comp) => {
        window.openRealBotoeiraConfigModal?.(comp, {
            frontalLib: 'real_botoeira_verde_frontal',
            lateralLib: 'real_botoeira_verde',
            title: 'Configurar botoeira verde',
            defaultView: 'lateral',
            defaultContactConfig: '2na',
            tagDefault: 'S1'
        });
        return true;
    },
    behavior: (inputs, estado, props) => {
        // Verde = NA: em repouso aberto, pressionada fecha
        const shorts = props.pressionado ? [['3', '4']] : [];
        return { novoEstado: !!props.pressionado, shorts };
    }
};

