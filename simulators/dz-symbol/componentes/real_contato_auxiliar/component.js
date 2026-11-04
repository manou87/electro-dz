window.COMPONENTES['real_contato_auxiliar'] = {
    cat: 'Componentes Reais',
    nome: 'تماس مساعد',
    icone: 'fa-plug-circle-check',
    tipo: 'contato',
    showTag: true,
    tagDefault: 'K1',
    foto: './componentes/real_contato_auxiliar/contato_auxiliar.webp',
    html: () => `
        <div style="width:136px;height:102px;position:relative;left:14px;">
            <img src="./componentes/real_contato_auxiliar/contato_auxiliar.webp" style="width:100%;height:100%;pointer-events:none;">

            <div class="borne" data-pino="13" style="top:10px;left:25px;"></div>
            <div class="borne" data-pino="21" style="top:10px;left:45px;"></div>
            <div class="borne" data-pino="33" style="top:10px;left:65px;"></div>
            <div class="borne" data-pino="41" style="top:10px;left:85px;"></div>

            <div class="borne" data-pino="14" style="top:80px;left:25px;"></div>
            <div class="borne" data-pino="22" style="top:80px;left:45px;"></div>
            <div class="borne" data-pino="34" style="top:80px;left:65px;"></div>
            <div class="borne" data-pino="42" style="top:80px;left:85px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props) => {
        const ligado = !!props?.tagEnergized;
        const shorts = ligado
            ? [['13','14'], ['33','34']]
            : [['21','22'], ['41','42']];
        return { novoEstado: ligado, shorts, tipoVisual: ligado ? 'ativo' : '' };
    }
};
