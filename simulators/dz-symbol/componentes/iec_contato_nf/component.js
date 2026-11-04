window.COMPONENTES['iec_contato_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'تماس مغلق (NC)',
    icone: 'fa-toggle-off',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'K1',
    foto: './componentes/iec_contato_nf/contato_nf_0.svg',
    html: () => `
        <div class="iec-contato-wrap">
            <img
                class="iec-contato-img iec-contato-off"
                src="./componentes/iec_contato_nf/contato_nf_0.svg"
                alt="Contato NF - repouso"
            >
            <img
                class="iec-contato-img iec-contato-on"
                src="./componentes/iec_contato_nf/contato_nf_1.svg"
                alt="Contato NF - acionado"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="11">11</div>
        <div class="pin-label pin-bottom" data-pin-label="12">12</div>
        <div class="borne" data-pino="1" style="left:calc(14px + var(--iec-contato-nf-borne-x));top:calc(-4px + var(--iec-contato-nf-borne-top-y));"></div>
        <div class="borne" data-pino="2" style="left:calc(14px + var(--iec-contato-nf-borne-x));top:calc(64px + var(--iec-contato-nf-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props) => {
        const ligado = !!props.tagEnergized;
        return { novoEstado: ligado, shorts: ligado ? [] : [['1','2']] };
    }
};

