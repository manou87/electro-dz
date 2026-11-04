window.COMPONENTES['iec_contato_comum_na_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'تماس مشترك NO/NC',
    icone: 'fa-toggle-on',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'K1',
    foto: './componentes/iec_contato_comum_na_nf/contato_comum_na_nf_0.svg',
    html: () => `
        <div class="iec-contato-comum-na-nf-wrap" style="width:80px;height:100px;position:relative;">
            <img
                class="iec-dual-state-img iec-dual-state-img-off"
                src="./componentes/iec_contato_comum_na_nf/contato_comum_na_nf_0.svg?v=1"
                alt="Contato comum NA/NF em repouso"
                style="inset:0;width:80px;height:100px;object-fit:fill;object-position:center center;"
            >
            <img
                class="iec-dual-state-img iec-dual-state-img-on"
                src="./componentes/iec_contato_comum_na_nf/contato_comum_na_nf_1.svg?v=1"
                alt="Contato comum NA/NF acionado"
                style="inset:0;width:80px;height:100px;object-fit:fill;object-position:center center;"
            >

            <div class="pin-label" data-pin-label="11" style="left:calc(8px + var(--iec-contato-comum-na-nf-label-x-11,0px));top:calc(100px + var(--iec-contato-comum-na-nf-label-y-11,0px));transform:translate(-100%,-50%);">11</div>
            <div class="pin-label" data-pin-label="12" style="left:calc(62px + var(--iec-contato-comum-na-nf-label-x-12,0px));top:calc(100px + var(--iec-contato-comum-na-nf-label-y-12,0px));transform:translate(0,-50%);">12</div>
            <div class="pin-label" data-pin-label="13" style="left:calc(28px + var(--iec-contato-comum-na-nf-label-x-13,0px));top:calc(0px + var(--iec-contato-comum-na-nf-label-y-13,0px));transform:translate(-100%,-50%);">13</div>

            <div class="borne" data-pino="11" data-label="11" style="left:calc(10px + var(--iec-contato-comum-na-nf-borne-x-11,0px));top:calc(90px + var(--iec-contato-comum-na-nf-borne-y-11,0px));"></div>
            <div class="borne" data-pino="12" data-label="12" style="left:calc(50px + var(--iec-contato-comum-na-nf-borne-x-12,0px));top:calc(90px + var(--iec-contato-comum-na-nf-borne-y-12,0px));"></div>
            <div class="borne" data-pino="13" data-label="13" style="left:calc(30px + var(--iec-contato-comum-na-nf-borne-x-13,0px));top:calc(-10px + var(--iec-contato-comum-na-nf-borne-y-13,0px));"></div>
        </div>
    `,
    behavior: (inputs, estado, props) => {
        const ligado = !!props.tagEnergized;
        return {
            novoEstado: ligado,
            shorts: ligado ? [['13', '12']] : [['13', '11']]
        };
    }
};
