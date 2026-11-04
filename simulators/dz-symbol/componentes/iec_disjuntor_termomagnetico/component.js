window.COMPONENTES['iec_disjuntor_termomagnetico'] = {
    cat: 'Simbologia IEC',
    nome: 'قاطع مغناطيسي حراري IEC',
    icone: 'fa-shield-halved',
    tipo: 'protecao',
    tagDefault: 'Q1',
    foto: './componentes/iec_disjuntor_termomagnetico/disjuntor_termomagnetico_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:120px;height:100px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_disjuntor_termomagnetico/disjuntor_termomagnetico_0.svg" alt="Disjuntor termomagnetico desligado">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_disjuntor_termomagnetico/disjuntor_termomagnetico_1.svg" alt="Disjuntor termomagnetico ligado">
            <button type="button" class="toggle-state-btn" title="Alternar disjuntor" aria-label="Alternar disjuntor"></button>

            <div class="borne" data-pino="1" style="left:calc(-2px + var(--iec-disjuntor-termomagnetico-borne-x-1, var(--iec-disjuntor-termomagnetico-borne-x)));top:calc(9px + var(--iec-disjuntor-termomagnetico-borne-y-1, var(--iec-disjuntor-termomagnetico-borne-y)));"></div>
            <div class="borne" data-pino="2" style="left:calc(-2px + var(--iec-disjuntor-termomagnetico-borne-x-2, var(--iec-disjuntor-termomagnetico-borne-x)));top:calc(89px + var(--iec-disjuntor-termomagnetico-borne-y-2, var(--iec-disjuntor-termomagnetico-borne-y)));"></div>
            <div class="borne" data-pino="3" style="left:calc(35px + var(--iec-disjuntor-termomagnetico-borne-x-3, var(--iec-disjuntor-termomagnetico-borne-x)));top:calc(9px + var(--iec-disjuntor-termomagnetico-borne-y-3, var(--iec-disjuntor-termomagnetico-borne-y)));"></div>
            <div class="borne" data-pino="4" style="left:calc(35px + var(--iec-disjuntor-termomagnetico-borne-x-4, var(--iec-disjuntor-termomagnetico-borne-x)));top:calc(89px + var(--iec-disjuntor-termomagnetico-borne-y-4, var(--iec-disjuntor-termomagnetico-borne-y)));"></div>
            <div class="borne" data-pino="5" style="left:calc(80px + var(--iec-disjuntor-termomagnetico-borne-x-5, var(--iec-disjuntor-termomagnetico-borne-x)));top:calc(9px + var(--iec-disjuntor-termomagnetico-borne-y-5, var(--iec-disjuntor-termomagnetico-borne-y)));"></div>
            <div class="borne" data-pino="6" style="left:calc(80px + var(--iec-disjuntor-termomagnetico-borne-x-6, var(--iec-disjuntor-termomagnetico-borne-x)));top:calc(89px + var(--iec-disjuntor-termomagnetico-borne-y-6, var(--iec-disjuntor-termomagnetico-borne-y)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: ligado, shorts: ligado ? [['1', '2'], ['3', '4'], ['5', '6']] : [] };
    }
};


