window.COMPONENTES['iec_botao_pulsador_na_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'زر ضاغط مزدوج NO/NC',
    icone: 'fa-circle-half-stroke',
    tipo: 'botao',
    pressable: 'momentary',
    foto: './componentes/iec_botao_pulsador_na_nf/preview.svg',
    html: () => `
        <div class="iec-botao-pulsador-na-nf-wrap" style="width:160px;height:80px;position:relative;">
            <img
                class="iec-botao-pulsador-na-nf-img iec-botao-pulsador-na-nf-off"
                src="./componentes/iec_botao_pulsador_na_nf/botao_pulsador_na_nf_0.svg?v=1"
                alt="Botao pulsador NA/NF em repouso"
                style="object-fit:fill;object-position:center center;"
            >
            <img
                class="iec-botao-pulsador-na-nf-img iec-botao-pulsador-na-nf-on"
                src="./componentes/iec_botao_pulsador_na_nf/botao_pulsador_na_nf_1.svg?v=1"
                alt="Botao pulsador NA/NF pressionado"
                style="object-fit:fill;object-position:center center;"
            >

            <div class="pin-label" data-pin-label="11" style="left:calc(74px + var(--iec-botao-pulsador-na-nf-label-x-1, var(--iec-botao-pulsador-na-nf-label-x, 0px)));top:calc(-10px + var(--iec-botao-pulsador-na-nf-label-y-1, var(--iec-botao-pulsador-na-nf-label-top-y, 0px)));transform:translate(0,-50%);">11</div>
            <div class="pin-label" data-pin-label="12" style="left:calc(74px + var(--iec-botao-pulsador-na-nf-label-x-2, var(--iec-botao-pulsador-na-nf-label-x, 0px)));top:calc(90px + var(--iec-botao-pulsador-na-nf-label-y-2, var(--iec-botao-pulsador-na-nf-label-bottom-y, 0px)));transform:translate(0,-50%);">12</div>
            <div class="pin-label" data-pin-label="13" style="left:calc(134px + var(--iec-botao-pulsador-na-nf-label-x-3, var(--iec-botao-pulsador-na-nf-label-x, 0px)));top:calc(-10px + var(--iec-botao-pulsador-na-nf-label-y-3, var(--iec-botao-pulsador-na-nf-label-top-y, 0px)));transform:translate(0,-50%);">13</div>
            <div class="pin-label" data-pin-label="14" style="left:calc(134px + var(--iec-botao-pulsador-na-nf-label-x-4, var(--iec-botao-pulsador-na-nf-label-x, 0px)));top:calc(90px + var(--iec-botao-pulsador-na-nf-label-y-4, var(--iec-botao-pulsador-na-nf-label-bottom-y, 0px)));transform:translate(0,-50%);">14</div>

            <div class="borne" data-pino="11" data-label="11" style="left:calc(50px + var(--iec-botao-pulsador-na-nf-borne-x-1, var(--iec-botao-pulsador-na-nf-borne-x, 0px)));top:calc(-10px + var(--iec-botao-pulsador-na-nf-borne-y-1, var(--iec-botao-pulsador-na-nf-borne-top-y, 0px)));"></div>
            <div class="borne" data-pino="12" data-label="12" style="left:calc(50px + var(--iec-botao-pulsador-na-nf-borne-x-2, var(--iec-botao-pulsador-na-nf-borne-x, 0px)));top:calc(70px + var(--iec-botao-pulsador-na-nf-borne-y-2, var(--iec-botao-pulsador-na-nf-borne-bottom-y, 0px)));"></div>
            <div class="borne" data-pino="13" data-label="13" style="left:calc(110px + var(--iec-botao-pulsador-na-nf-borne-x-3, var(--iec-botao-pulsador-na-nf-borne-x, 0px)));top:calc(-10px + var(--iec-botao-pulsador-na-nf-borne-y-3, var(--iec-botao-pulsador-na-nf-borne-top-y, 0px)));"></div>
            <div class="borne" data-pino="14" data-label="14" style="left:calc(110px + var(--iec-botao-pulsador-na-nf-borne-x-4, var(--iec-botao-pulsador-na-nf-borne-x, 0px)));top:calc(70px + var(--iec-botao-pulsador-na-nf-borne-y-4, var(--iec-botao-pulsador-na-nf-borne-bottom-y, 0px)));"></div>
        </div>
    `,
    behavior: (inputs, estado, props) => {
        const pressionado = !!props.pressionado;
        return {
            novoEstado: pressionado,
            shorts: pressionado ? [['13', '14']] : [['11', '12']]
        };
    }
};
