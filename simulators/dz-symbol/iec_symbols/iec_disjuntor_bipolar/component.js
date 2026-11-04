window.COMPONENTES['iec_disjuntor_bipolar'] = {
    cat: 'Simbologia IEC',
    nome: 'Disjuntor Bipolar IEC',
    icone: 'fa-toggle-on',
    tipo: 'protecao',
    tagDefault: 'Q1',
    foto: './componentes/iec_disjuntor_bipolar/disjuntor_bipolar_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:80px;height:100px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_disjuntor_bipolar/disjuntor_bipolar_0.svg" alt="Disjuntor bipolar desligado">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_disjuntor_bipolar/disjuntor_bipolar_1.svg" alt="Disjuntor bipolar ligado">
            <button type="button" class="toggle-state-btn" title="Alternar disjuntor" aria-label="Alternar disjuntor"></button>
            <div class="borne" data-pino="1" style="left:calc(-2px + var(--iec-disjuntor-bipolar-borne-x-1, var(--iec-disjuntor-bipolar-borne-x)));top:calc(9px + var(--iec-disjuntor-bipolar-borne-y-1, var(--iec-disjuntor-bipolar-borne-y)));"></div>
            <div class="borne" data-pino="2" style="left:calc(-2px + var(--iec-disjuntor-bipolar-borne-x-2, var(--iec-disjuntor-bipolar-borne-x)));top:calc(89px + var(--iec-disjuntor-bipolar-borne-y-2, var(--iec-disjuntor-bipolar-borne-y)));"></div>
            <div class="borne" data-pino="3" style="left:calc(70px + var(--iec-disjuntor-bipolar-borne-x-3, var(--iec-disjuntor-bipolar-borne-x)));top:calc(9px + var(--iec-disjuntor-bipolar-borne-y-3, var(--iec-disjuntor-bipolar-borne-y)));"></div>
            <div class="borne" data-pino="4" style="left:calc(70px + var(--iec-disjuntor-bipolar-borne-x-4, var(--iec-disjuntor-bipolar-borne-x)));top:calc(89px + var(--iec-disjuntor-bipolar-borne-y-4, var(--iec-disjuntor-bipolar-borne-y)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: ligado, shorts: ligado ? [['1', '2'], ['3', '4']] : [] };
    }
};


