window.COMPONENTES['iec_fusiveis'] = {
    cat: 'Simbologia IEC',
    nome: 'Conjunto de Fusíveis',
    icone: 'fa-fire',
    tipo: 'protecao',
    tagDefault: 'FU1',
    foto: './componentes/iec_fusiveis/fusiveis_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:60px;height:60px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_fusiveis/fusiveis_0.svg" alt="Fusiveis integros">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_fusiveis/fusiveis_1.svg" alt="Fusiveis atuados">
            <button type="button" class="toggle-state-btn" title="Alternar estado dos fusiveis" aria-label="Alternar estado dos fusiveis"></button>

            <div class="borne" data-pino="1" style="left:calc(3px + var(--iec-fusiveis-borne-x-1, var(--iec-fusiveis-borne-x)));top:calc(-2px + var(--iec-fusiveis-borne-y-1, var(--iec-fusiveis-borne-y)));"></div>
            <div class="borne" data-pino="2" style="left:calc(3px + var(--iec-fusiveis-borne-x-2, var(--iec-fusiveis-borne-x)));top:calc(50px + var(--iec-fusiveis-borne-y-2, var(--iec-fusiveis-borne-y)));"></div>
            <div class="borne" data-pino="3" style="left:calc(20px + var(--iec-fusiveis-borne-x-3, var(--iec-fusiveis-borne-x)));top:calc(-2px + var(--iec-fusiveis-borne-y-3, var(--iec-fusiveis-borne-y)));"></div>
            <div class="borne" data-pino="4" style="left:calc(20px + var(--iec-fusiveis-borne-x-4, var(--iec-fusiveis-borne-x)));top:calc(50px + var(--iec-fusiveis-borne-y-4, var(--iec-fusiveis-borne-y)));"></div>
            <div class="borne" data-pino="5" style="left:calc(44px + var(--iec-fusiveis-borne-x-5, var(--iec-fusiveis-borne-x)));top:calc(-2px + var(--iec-fusiveis-borne-y-5, var(--iec-fusiveis-borne-y)));"></div>
            <div class="borne" data-pino="6" style="left:calc(44px + var(--iec-fusiveis-borne-x-6, var(--iec-fusiveis-borne-x)));top:calc(50px + var(--iec-fusiveis-borne-y-6, var(--iec-fusiveis-borne-y)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const atuado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: atuado, shorts: atuado ? [] : [['1', '2'], ['3', '4'], ['5', '6']] };
    }
};


