window.COMPONENTES['iec_contator_forca'] = {
    cat: 'Simbologia IEC',
    nome: 'Contator Força',
    icone: 'fa-bolt',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'K1',
    foto: './componentes/iec_contator_forca/contator_forca_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:80px;height:80px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_contator_forca/contator_forca_0.svg" alt="Contator de forca em repouso">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_contator_forca/contator_forca_1.svg" alt="Contator de forca acionado">

            <div class="borne" data-pino="1" style="left:calc(6px + var(--iec-contator-forca-borne-x));top:calc(-10px + var(--iec-contator-forca-borne-y));"></div>
            <div class="borne" data-pino="3" style="left:calc(37px + var(--iec-contator-forca-borne-x));top:calc(-10px + var(--iec-contator-forca-borne-y));"></div>
            <div class="borne" data-pino="5" style="left:calc(68px + var(--iec-contator-forca-borne-x));top:calc(-10px + var(--iec-contator-forca-borne-y));"></div>
            <div class="borne" data-pino="2" style="left:calc(6px + var(--iec-contator-forca-borne-x));top:calc(69px + var(--iec-contator-forca-borne-y));"></div>
            <div class="borne" data-pino="4" style="left:calc(37px + var(--iec-contator-forca-borne-x));top:calc(69px + var(--iec-contator-forca-borne-y));"></div>
            <div class="borne" data-pino="6" style="left:calc(68px + var(--iec-contator-forca-borne-x));top:calc(69px + var(--iec-contator-forca-borne-y));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = !!props.tagEnergized;
        return {
            novoEstado: ligado,
            shorts: ligado ? [['1', '2'], ['3', '4'], ['5', '6']] : []
        };
    }
};
