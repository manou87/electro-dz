window.COMPONENTES['iec_chave_seletora_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Chave Seletora NA',
    icone: 'fa-arrows-rotate',
    tipo: 'chave',
    showTag: true,
    tagDefault: 'S1',
    foto: './componentes/iec_chave_seletora_na/chave_seletora_na_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:87px;height:102px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_chave_seletora_na/chave_seletora_na_0.svg" alt="Chave seletora NA em repouso" style="inset:auto;left:calc(-10px + var(--iec-chave-seletora-na-img-offset-x,0px));top:calc(0px + var(--iec-chave-seletora-na-img-offset-y,0px));width:87px;height:102px;object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_chave_seletora_na/chave_seletora_na_1.svg" alt="Chave seletora NA acionada" style="inset:auto;left:calc(-10px + var(--iec-chave-seletora-na-img-offset-x,0px));top:calc(0px + var(--iec-chave-seletora-na-img-offset-y,0px));width:87px;height:102px;object-fit:fill;object-position:center center;">
            <button type="button" class="toggle-state-btn" title="Alternar chave seletora NA" aria-label="Alternar chave seletora NA"></button>
            <div class="pin-label" data-pin-label="13" style="left:calc(40px + var(--iec-chave-seletora-na-label-x,0px));top:calc(-15px + var(--iec-chave-seletora-na-label-top-y,0px));transform:translate(-50%,-50%);">13</div>
            <div class="pin-label" data-pin-label="14" style="left:calc(40px + var(--iec-chave-seletora-na-label-x,0px));top:calc(106px + var(--iec-chave-seletora-na-label-bottom-y,0px));transform:translate(-50%,-50%);">14</div>
            <div class="borne" data-pino="13" style="left:calc(30px + var(--iec-chave-seletora-na-borne-x,0px));top:calc(-10px + var(--iec-chave-seletora-na-borne-top-y,0px));"></div>
            <div class="borne" data-pino="14" style="left:calc(30px + var(--iec-chave-seletora-na-borne-x,0px));top:calc(90px + var(--iec-chave-seletora-na-borne-bottom-y,0px));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: ligado, shorts: ligado ? [['13', '14']] : [] };
    }
};
