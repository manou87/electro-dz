window.COMPONENTES['iec_disjuntor_monopolar'] = {
    cat: 'Simbologia IEC',
    nome: 'Disjuntor Monopolar IEC',
    icone: 'fa-toggle-on',
    tipo: 'protecao',
    tagDefault: 'Q1',
    foto: './componentes/iec_disjuntor_monopolar/disjuntor_monopolar_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:36.9px;height:160.4px;position:relative;margin-left:2px;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_disjuntor_monopolar/disjuntor_monopolar_0.svg" alt="Disjuntor monopolar desligado" style="object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_disjuntor_monopolar/disjuntor_monopolar_1.svg" alt="Disjuntor monopolar ligado" style="object-fit:fill;object-position:center center;">
            <button type="button" class="toggle-state-btn" title="Alternar disjuntor" aria-label="Alternar disjuntor"></button>
            <div class="borne" data-pino="1" style="left:calc(9px + var(--iec-disjuntor-monopolar-borne-x-1, var(--iec-disjuntor-monopolar-borne-x)));top:calc(-7px + var(--iec-disjuntor-monopolar-borne-y-1, var(--iec-disjuntor-monopolar-borne-y)));"></div>
            <div class="borne" data-pino="2" style="left:calc(9px + var(--iec-disjuntor-monopolar-borne-x-2, var(--iec-disjuntor-monopolar-borne-x)));top:calc(154px + var(--iec-disjuntor-monopolar-borne-y-2, var(--iec-disjuntor-monopolar-borne-y)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: ligado, shorts: ligado ? [['1', '2']] : [] };
    }
};


