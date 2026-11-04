window.COMPONENTES['iec_botoeira_emergencia_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'Bot\u00e3o Emerg\u00eancia NF',
    icone: 'fa-circle-exclamation',
    tipo: 'botao',
    foto: './componentes/iec_botoeira_emergencia_nf/iec_emergencia_nf_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap iec-botoeira-emergencia-nf-wrap" style="width:80px;height:80px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off iec-botoeira-emergencia-nf-img" src="./componentes/iec_botoeira_emergencia_nf/iec_emergencia_nf_0.svg?v=2" alt="Bot\u00e3o Emerg\u00eancia NF - repouso" style="object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on iec-botoeira-emergencia-nf-img" src="./componentes/iec_botoeira_emergencia_nf/iec_emergencia_nf_1.svg?v=2" alt="Bot\u00e3o Emerg\u00eancia NF - acionado" style="object-fit:fill;object-position:center center;">
            <button type="button" class="toggle-state-btn" title="Alternar bot\u00e3o emerg\u00eancia NF" aria-label="Alternar bot\u00e3o emerg\u00eancia NF"></button>
            <div class="pin-label pin-top" data-pin-label="1" style="left:calc(54px + var(--iec-botoeira-emergencia-nf-label-x));top:calc(0px + var(--iec-botoeira-emergencia-nf-label-top-y));transform:translate(0,-50%);">1</div>
            <div class="pin-label pin-bottom" data-pin-label="2" style="left:calc(54px + var(--iec-botoeira-emergencia-nf-label-x));top:calc(80px + var(--iec-botoeira-emergencia-nf-label-bottom-y));transform:translate(0,-50%);">2</div>
            <div class="borne" data-pino="1" style="left:calc(30px + var(--iec-botoeira-emergencia-nf-borne-x));top:calc(-10px + var(--iec-botoeira-emergencia-nf-borne-top-y));"></div>
            <div class="borne" data-pino="2" style="left:calc(30px + var(--iec-botoeira-emergencia-nf-borne-x));top:calc(70px + var(--iec-botoeira-emergencia-nf-borne-bottom-y));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const acionado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: acionado, shorts: acionado ? [] : [['1', '2']] };
    }
};
