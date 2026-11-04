window.COMPONENTES['iec_chave_seletora_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'مفتاح اختيار مغلق (NC)',
    icone: 'fa-arrows-rotate',
    tipo: 'chave',
    showTag: true,
    tagDefault: 'S1',
    foto: './componentes/iec_chave_seletora_nf/chave_seletora_nf_0.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:86px;height:102px;position:relative;">
            <img class="iec-dual-state-img iec-dual-state-img-off" src="./componentes/iec_chave_seletora_nf/chave_seletora_nf_0.svg" alt="Chave seletora NF em repouso" style="inset:auto;left:calc(-8px + var(--iec-chave-seletora-nf-img-offset-x,0px));top:calc(0px + var(--iec-chave-seletora-nf-img-offset-y,0px));width:86px;height:102px;object-fit:fill;object-position:center center;">
            <img class="iec-dual-state-img iec-dual-state-img-on" src="./componentes/iec_chave_seletora_nf/chave_seletora_nf_1.svg" alt="Chave seletora NF acionada" style="inset:auto;left:calc(-8px + var(--iec-chave-seletora-nf-img-offset-x,0px));top:calc(0px + var(--iec-chave-seletora-nf-img-offset-y,0px));width:86px;height:102px;object-fit:fill;object-position:center center;">
            <button type="button" class="toggle-state-btn" title="Alternar chave seletora NF" aria-label="Alternar chave seletora NF"></button>
            <div class="pin-label" data-pin-label="21" style="left:calc(40px + var(--iec-chave-seletora-nf-label-x,0px));top:calc(-15px + var(--iec-chave-seletora-nf-label-top-y,0px));transform:translate(-50%,-50%);">21</div>
            <div class="pin-label" data-pin-label="22" style="left:calc(40px + var(--iec-chave-seletora-nf-label-x,0px));top:calc(106px + var(--iec-chave-seletora-nf-label-bottom-y,0px));transform:translate(-50%,-50%);">22</div>
            <div class="borne" data-pino="21" style="left:calc(30px + var(--iec-chave-seletora-nf-borne-x,0px));top:calc(-10px + var(--iec-chave-seletora-nf-borne-top-y,0px));"></div>
            <div class="borne" data-pino="22" style="left:calc(30px + var(--iec-chave-seletora-nf-borne-x,0px));top:calc(90px + var(--iec-chave-seletora-nf-borne-bottom-y,0px));"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return { novoEstado: ligado, shorts: ligado ? [] : [['21', '22']] };
    }
};
