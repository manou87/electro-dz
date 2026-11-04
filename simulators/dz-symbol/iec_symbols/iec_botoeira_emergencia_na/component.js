window.COMPONENTES['iec_botoeira_emergencia_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Bot\u00e3o Emerg\u00eancia NA',
    icone: 'fa-triangle-exclamation',
    tipo: 'botao',
    foto: './componentes/iec_botoeira_emergencia_na/iec_emergencia_na_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap iec-botoeira-emergencia-na-wrap" style="width:80px;height:80px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off iec-botoeira-emergencia-na-img" src="./componentes/iec_botoeira_emergencia_na/iec_emergencia_na_0.svg?v=2" alt="Bot\u00e3o Emerg\u00eancia NA - repouso" style="object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on iec-botoeira-emergencia-na-img" src="./componentes/iec_botoeira_emergencia_na/iec_emergencia_na_1.svg?v=2" alt="Bot\u00e3o Emerg\u00eancia NA - acionado" style="object-fit:fill;object-position:center center;">
            <button type="button" class="toggle-state-btn" title="Alternar bot\u00e3o emerg\u00eancia NA" aria-label="Alternar bot\u00e3o emerg\u00eancia NA"></button>
            <div class="pin-label pin-top" data-pin-label="3" style="left:calc(54px + var(--iec-botoeira-emergencia-na-label-x));top:calc(0px + var(--iec-botoeira-emergencia-na-label-top-y));transform:translate(0,-50%);">3</div>
            <div class="pin-label pin-bottom" data-pin-label="4" style="left:calc(54px + var(--iec-botoeira-emergencia-na-label-x));top:calc(80px + var(--iec-botoeira-emergencia-na-label-bottom-y));transform:translate(0,-50%);">4</div>
            <div class="borne" data-pino="3" style="left:calc(30px + var(--iec-botoeira-emergencia-na-borne-x));top:calc(-10px + var(--iec-botoeira-emergencia-na-borne-top-y));"></div>
            <div class="borne" data-pino="4" style="left:calc(30px + var(--iec-botoeira-emergencia-na-borne-x));top:calc(70px + var(--iec-botoeira-emergencia-na-borne-bottom-y));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const acionado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: acionado, shorts: acionado ? [['3', '4']] : [] };
    }
};
