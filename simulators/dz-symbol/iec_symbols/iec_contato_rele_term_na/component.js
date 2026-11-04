window.COMPONENTES['iec_contato_rele_term_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Contato Relé Térmico NA',
    icone: 'fa-toggle-on',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'F1',
    foto: './componentes/iec_contato_rele_term_na/contato_rele_term_na_0.svg',
    html: () => `
        <div class="iec-contato-wrap" style="width:73.92px;height:80.64px;">
            <img class="iec-contato-img iec-contato-off" src="./componentes/iec_contato_rele_term_na/contato_rele_term_na_0.svg" alt="Contato térmico NA - repouso" style="object-fit:fill;object-position:center center;">
            <img class="iec-contato-img iec-contato-on" src="./componentes/iec_contato_rele_term_na/contato_rele_term_na_1.svg" alt="Contato térmico NA - acionado" style="object-fit:fill;object-position:center center;">
        </div>
        <div class="pin-label pin-top" data-pin-label="97" style="left:24px;top:0px;">97</div>
        <div class="pin-label pin-bottom" data-pin-label="98" style="left:24px;top:66px;">98</div>
        <div class="borne" data-pino="97" style="left:calc(30px + var(--iec-contato-rele-term-na-borne-x));top:calc(-9px + var(--iec-contato-rele-term-na-borne-top-y));"></div>
        <div class="borne" data-pino="98" style="left:calc(30px + var(--iec-contato-rele-term-na-borne-x));top:calc(70px + var(--iec-contato-rele-term-na-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props) => {
        const ligado = !!(props?.overloadTrip ?? props?.tagEnergized);
        return { novoEstado: ligado, shorts: ligado ? [['97', '98']] : [] };
    }
};


