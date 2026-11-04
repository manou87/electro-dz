window.COMPONENTES['iec_botao_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Botão NA',
    icone: 'fa-circle-dot',
    tipo: 'botao',
    pressable: 'momentary',
    foto: './componentes/iec_botao_na/botoeira_na_0.svg',
    html: () => `
        <div class="iec-botao-na-wrap">
            <img
                class="iec-na-img iec-na-off"
                src="./componentes/iec_botao_na/botoeira_na_0.svg?v=2"
                alt="Botoeira NA - repouso"
            >
            <img
                class="iec-na-img iec-na-on"
                src="./componentes/iec_botao_na/botoeira_na_1.svg?v=2"
                alt="Botoeira NA - pressionada"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="1">1</div>
        <div class="pin-label pin-bottom" data-pin-label="2">2</div>
        <div class=\"borne\" data-pino=\"1\" style=\"left:calc(14px + var(--iec-botao-na-borne-x));top:calc(-4px + var(--iec-botao-na-borne-top-y));\"></div>
        <div class=\"borne\" data-pino=\"2\" style=\"left:calc(14px + var(--iec-botao-na-borne-x));top:calc(84px + var(--iec-botao-na-borne-bottom-y));\"></div>
    `,
    behavior: (inputs, estado, props) => {
        const shorts = props.pressionado ? [['1','2']] : [];
        return { novoEstado: props.pressionado, shorts };
    }
};




