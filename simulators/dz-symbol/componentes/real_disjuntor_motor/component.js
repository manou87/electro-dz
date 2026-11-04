window.COMPONENTES['real_disjuntor_motor'] = {
    cat: 'Componentes Reais',
    nome: 'Disjuntor Motor',
    icone: 'fa-shield-halved',
    tipo: 'protecao',
    tagDefault: 'Q1',
    foto: './componentes/real_disjuntor_motor/disj_motor_0.webp',
    html: () => `
        <div class="real-disjuntor-motor-wrap" style="width:101px;height:200px;position:relative;left:2px;">
            <img
                class="real-disjuntor-motor-img real-disjuntor-motor-off"
                src="./componentes/real_disjuntor_motor/disj_motor_0.webp"
                alt="Disjuntor motor desligado"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <img
                class="real-disjuntor-motor-img real-disjuntor-motor-on"
                src="./componentes/real_disjuntor_motor/disj_motor_1.webp"
                alt="Disjuntor motor ligado"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >

            <button
                type="button"
                class="manual-off-btn real-disjuntor-motor-stop-btn"
                title="STOP"
                aria-label="Parar disjuntor motor"
            ></button>
            <button
                type="button"
                class="manual-on-btn real-disjuntor-motor-start-btn"
                title="START"
                aria-label="Ligar disjuntor motor"
            ></button>

            <div class="borne" data-pino="1L1" style="top:5px;left:18px;"></div>
            <div class="borne" data-pino="3L2" style="top:5px;left:42px;"></div>
            <div class="borne" data-pino="5L3" style="top:5px;left:68px;"></div>
            <div class="borne" data-pino="2T1" style="bottom:5px;left:18px;"></div>
            <div class="borne" data-pino="4T2" style="bottom:5px;left:42px;"></div>
            <div class="borne" data-pino="6T3" style="bottom:5px;left:68px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: ligado,
            shorts: ligado ? [['1L1', '2T1'], ['3L2', '4T2'], ['5L3', '6T3']] : [],
            tipoVisual: ligado ? 'ativo' : ''
        };
    }
};
