window.COMPONENTES['iec_contato_temp_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Contato Temp NA',
    icone: 'fa-clock',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'D1',
    foto: './componentes/iec_contato_temp_na/contato_temp_na_0.svg',
    html: () => `
        <div class="iec-contato-wrap">
            <img
                class="iec-contato-img iec-contato-off"
                src="./componentes/iec_contato_temp_na/contato_temp_na_0.svg"
                alt="Contato temporizado NA - repouso"
            >
            <img
                class="iec-contato-img iec-contato-on"
                src="./componentes/iec_contato_temp_na/contato_temp_na_1.svg"
                alt="Contato temporizado NA - acionado"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="16">16</div>
        <div class="pin-label pin-bottom" data-pin-label="18">18</div>
        <div class="borne" data-pino="1" style="left:calc(14px + var(--iec-contato-temp-na-borne-x));top:calc(-4px + var(--iec-contato-temp-na-borne-top-y));"></div>
        <div class="borne" data-pino="2" style="left:calc(14px + var(--iec-contato-temp-na-borne-x));top:calc(64px + var(--iec-contato-temp-na-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = !!props.tagEnergized;
        return { novoEstado: ligado, shorts: ligado ? [['1', '2']] : [] };
    }
};
