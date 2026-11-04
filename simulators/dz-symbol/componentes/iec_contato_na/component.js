window.COMPONENTES['iec_contato_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Contato NA',
    icone: 'fa-toggle-on',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'K1',
    foto: './componentes/iec_contato_na/contato_na_0.svg',
    html: () => `
        <div class="iec-contato-wrap">
            <img
                class="iec-contato-img iec-contato-off"
                src="./componentes/iec_contato_na/contato_na_0.svg"
                alt="Contato NA - repouso"
            >
            <img
                class="iec-contato-img iec-contato-on"
                src="./componentes/iec_contato_na/contato_na_1.svg"
                alt="Contato NA - acionado"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="13">13</div>
        <div class="pin-label pin-bottom" data-pin-label="14">14</div>
        <div class="borne" data-pino="1" style="left:calc(14px + var(--iec-contato-na-borne-x));top:calc(-4px + var(--iec-contato-na-borne-top-y));"></div>
        <div class="borne" data-pino="2" style="left:calc(14px + var(--iec-contato-na-borne-x));top:calc(64px + var(--iec-contato-na-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = !!props.tagEnergized;
        return { novoEstado: ligado, shorts: ligado ? [['1', '2']] : [] };
    }
};

