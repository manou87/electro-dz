window.COMPONENTES['iec_contato_temp_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'تماس مؤقت مغلق (NC)',
    icone: 'fa-clock-rotate-left',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'D1',
    foto: './componentes/iec_contato_temp_nf/contato_temp_nf_0.svg',
    html: () => `
        <div class="iec-contato-wrap">
            <img
                class="iec-contato-img iec-contato-off"
                src="./componentes/iec_contato_temp_nf/contato_temp_nf_0.svg"
                alt="Contato temporizado NF - repouso"
            >
            <img
                class="iec-contato-img iec-contato-on"
                src="./componentes/iec_contato_temp_nf/contato_temp_nf_1.svg"
                alt="Contato temporizado NF - acionado"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="15">15</div>
        <div class="pin-label pin-bottom" data-pin-label="16">16</div>
        <div class="borne" data-pino="1" style="left:calc(14px + var(--iec-contato-temp-nf-borne-x));top:calc(-4px + var(--iec-contato-temp-nf-borne-top-y));"></div>
        <div class="borne" data-pino="2" style="left:calc(14px + var(--iec-contato-temp-nf-borne-x));top:calc(64px + var(--iec-contato-temp-nf-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = !!props.tagEnergized;
        return { novoEstado: ligado, shorts: ligado ? [] : [['1', '2']] };
    }
};
