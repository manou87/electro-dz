window.COMPONENTES['iec_contato_rele_term_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'تماس مرحل حراري مغلق (NC)',
    icone: 'fa-toggle-off',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'F1',
    foto: './componentes/iec_contato_rele_term_nf/contato_rele_term_nf_0.svg',
    html: () => `
        <div class="iec-contato-wrap" style="width:73.92px;height:80.64px;margin-left:-1px;">
            <img class="iec-contato-img iec-contato-off" src="./componentes/iec_contato_rele_term_nf/contato_rele_term_nf_0.svg" alt="Contato térmico NF - repouso" style="object-fit:fill;object-position:center center;">
            <img class="iec-contato-img iec-contato-on" src="./componentes/iec_contato_rele_term_nf/contato_rele_term_nf_1.svg" alt="Contato térmico NF - acionado" style="object-fit:fill;object-position:center center;">
        </div>
        <div class="pin-label pin-top" data-pin-label="95" style="left:25px;top:0px;">95</div>
        <div class="pin-label pin-bottom" data-pin-label="96" style="left:25px;top:67px;">96</div>
        <div class="borne" data-pino="95" style="left:calc(31px + var(--iec-contato-rele-term-nf-borne-x));top:calc(-10px + var(--iec-contato-rele-term-nf-borne-top-y));"></div>
        <div class="borne" data-pino="96" style="left:calc(31px + var(--iec-contato-rele-term-nf-borne-x));top:calc(71px + var(--iec-contato-rele-term-nf-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props) => {
        const ligado = !!(props?.overloadTrip ?? props?.tagEnergized);
        return { novoEstado: ligado, shorts: ligado ? [] : [['95', '96']] };
    }
};


