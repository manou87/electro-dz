window.COMPONENTES['iec_disjuntor_motor'] = {
    cat: 'Simbologia IEC',
    nome: 'قاطع محرك IEC',
    icone: 'fa-shield-halved',
    tipo: 'protecao',
    tagDefault: 'Q1',
    foto: './componentes/iec_disjuntor_motor/disjuntor_motor_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:120px;height:100px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_disjuntor_motor/disjuntor_motor_0.svg" alt="Disjuntor motor desligado">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_disjuntor_motor/disjuntor_motor_1.svg" alt="Disjuntor motor ligado">
            <button type="button" class="toggle-state-btn" title="Alternar disjuntor" aria-label="Alternar disjuntor"></button>

            <div class="borne" data-pino="1L1" style="left:calc(-2px + var(--iec-disjuntor-motor-borne-x-1, var(--iec-disjuntor-motor-borne-x)));top:calc(9px + var(--iec-disjuntor-motor-borne-y-1, var(--iec-disjuntor-motor-borne-y)));"></div>
            <div class="borne" data-pino="2T1" style="left:calc(-2px + var(--iec-disjuntor-motor-borne-x-2, var(--iec-disjuntor-motor-borne-x)));top:calc(89px + var(--iec-disjuntor-motor-borne-y-2, var(--iec-disjuntor-motor-borne-y)));"></div>
            <div class="borne" data-pino="3L2" style="left:calc(35px + var(--iec-disjuntor-motor-borne-x-3, var(--iec-disjuntor-motor-borne-x)));top:calc(9px + var(--iec-disjuntor-motor-borne-y-3, var(--iec-disjuntor-motor-borne-y)));"></div>
            <div class="borne" data-pino="4T2" style="left:calc(35px + var(--iec-disjuntor-motor-borne-x-4, var(--iec-disjuntor-motor-borne-x)));top:calc(89px + var(--iec-disjuntor-motor-borne-y-4, var(--iec-disjuntor-motor-borne-y)));"></div>
            <div class="borne" data-pino="5L3" style="left:calc(80px + var(--iec-disjuntor-motor-borne-x-5, var(--iec-disjuntor-motor-borne-x)));top:calc(9px + var(--iec-disjuntor-motor-borne-y-5, var(--iec-disjuntor-motor-borne-y)));"></div>
            <div class="borne" data-pino="6T3" style="left:calc(80px + var(--iec-disjuntor-motor-borne-x-6, var(--iec-disjuntor-motor-borne-x)));top:calc(89px + var(--iec-disjuntor-motor-borne-y-6, var(--iec-disjuntor-motor-borne-y)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: ligado, shorts: ligado ? [['1L1', '2T1'], ['3L2', '4T2'], ['5L3', '6T3']] : [] };
    }
};


