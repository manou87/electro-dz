window.COMPONENTES['iec_botao_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'زر ضاغط مغلق (NC)',
    icone: 'fa-circle',
    tipo: 'botao',
    pressable: 'momentary',
    foto: './componentes/iec_botao_nf/botoeira_nf_0.svg',
    html: () => `
        <div class="iec-botao-nf-wrap">
            <img
                class="iec-nf-img iec-nf-off"
                src="./componentes/iec_botao_nf/botoeira_nf_0.svg?v=3"
                alt="Botoeira NF - repouso"
            >
            <img
                class="iec-nf-img iec-nf-on"
                src="./componentes/iec_botao_nf/botoeira_nf_1.svg?v=3"
                alt="Botoeira NF - pressionada"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="1">1</div>
        <div class="pin-label pin-bottom" data-pin-label="2">2</div>
        <div class="borne" data-pino="1" style="left:calc(14px + var(--iec-botao-nf-borne-x));top:calc(-4px + var(--iec-botao-nf-borne-top-y));"></div>
        <div class="borne" data-pino="2" style="left:calc(14px + var(--iec-botao-nf-borne-x));top:calc(84px + var(--iec-botao-nf-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props) => {
        const shorts = props.pressionado ? [] : [['1','2']];
        return { novoEstado: props.pressionado, shorts };
    }
};


