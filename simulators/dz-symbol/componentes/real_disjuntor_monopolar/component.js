window.COMPONENTES['real_disjuntor_monopolar'] = {
    cat: 'Componentes Reais',
    nome: 'Disjuntor Monopolar',
    icone: 'fa-toggle-on',
    tipo: 'protecao',
    tagDefault: 'Q1',
    foto: './componentes/real_disjuntor_monopolar/disjuntor_monopolar_0.webp',
    html: () => `
        <div class="real-disjuntor-wrap" style="width:61px;height:166px;position:relative;left:2px;">
            <img
                class="real-disjuntor-img real-disjuntor-off"
                src="./componentes/real_disjuntor_monopolar/disjuntor_monopolar_0.webp"
                alt="Disjuntor monopolar desligado"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <img
                class="real-disjuntor-img real-disjuntor-on"
                src="./componentes/real_disjuntor_monopolar/disjuntor_monopolar_1.webp"
                alt="Disjuntor monopolar ligado"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <button
                type="button"
                class="toggle-state-btn real-disjuntor-toggle"
                title="Alternar disjuntor"
                aria-label="Alternar disjuntor"
            ></button>
            <div class="borne" data-pino="1" style="top:5px;left:23px;"></div>
            <div class="borne" data-pino="2" style="bottom:5px;left:23px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: ligado,
            shorts: ligado ? [['1', '2']] : [],
            tipoVisual: ligado ? 'ativo' : ''
        };
    }
};
