window.COMPONENTES['iec_botao_pulsador_comum_na_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'Botao Pulsador Comum NA/NF',
    icone: 'fa-circle-half-stroke',
    tipo: 'botao',
    pressable: 'momentary',
    foto: './componentes/iec_botao_pulsador_comum_na_nf/botao_pulsador_comum_na_nf_0.svg',
    html: () => `
        <div class="iec-botao-pulsador-comum-na-nf-wrap" style="width:100px;height:100px;position:relative;">
            <img
                class="iec-dual-state-img iec-dual-state-img-off iec-botao-pulsador-na-nf-off"
                src="./componentes/iec_botao_pulsador_comum_na_nf/botao_pulsador_comum_na_nf_0.svg?v=1"
                alt="Botao pulsador comum NA/NF em repouso"
                style="inset:0;width:100px;height:100px;object-fit:fill;object-position:center center;"
            >
            <img
                class="iec-dual-state-img iec-dual-state-img-on iec-botao-pulsador-na-nf-on"
                src="./componentes/iec_botao_pulsador_comum_na_nf/botao_pulsador_comum_na_nf_1.svg?v=1"
                alt="Botao pulsador comum NA/NF pressionado"
                style="inset:0;width:100px;height:100px;object-fit:fill;object-position:center center;"
            >

            <div class="pin-label" data-pin-label="11" style="left:calc(28px + var(--iec-botao-pulsador-comum-na-nf-label-x-11,0px));top:calc(100px + var(--iec-botao-pulsador-comum-na-nf-label-y-11,0px));transform:translate(-100%,-50%);">11</div>
            <div class="pin-label" data-pin-label="12" style="left:calc(82px + var(--iec-botao-pulsador-comum-na-nf-label-x-12,0px));top:calc(100px + var(--iec-botao-pulsador-comum-na-nf-label-y-12,0px));transform:translate(0,-50%);">12</div>
            <div class="pin-label" data-pin-label="13" style="left:calc(48px + var(--iec-botao-pulsador-comum-na-nf-label-x-13,0px));top:calc(0px + var(--iec-botao-pulsador-comum-na-nf-label-y-13,0px));transform:translate(-100%,-50%);">13</div>

            <div class="borne" data-pino="11" data-label="11" style="left:calc(30px + var(--iec-botao-pulsador-comum-na-nf-borne-x-11,0px));top:calc(90px + var(--iec-botao-pulsador-comum-na-nf-borne-y-11,0px));"></div>
            <div class="borne" data-pino="12" data-label="12" style="left:calc(70px + var(--iec-botao-pulsador-comum-na-nf-borne-x-12,0px));top:calc(90px + var(--iec-botao-pulsador-comum-na-nf-borne-y-12,0px));"></div>
            <div class="borne" data-pino="13" data-label="13" style="left:calc(50px + var(--iec-botao-pulsador-comum-na-nf-borne-x-13,0px));top:calc(-10px + var(--iec-botao-pulsador-comum-na-nf-borne-y-13,0px));"></div>
        </div>
    `,
    behavior: (inputs, estado, props) => {
        const pressionado = !!props.pressionado;
        return {
            novoEstado: pressionado,
            shorts: pressionado ? [['13', '12']] : [['13', '11']]
        };
    }
};
