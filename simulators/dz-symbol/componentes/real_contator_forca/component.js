window.COMPONENTES['real_contator_forca'] = {
    cat: 'Componentes Reais',
    nome: 'كونتاكتور استطاعة',
    icone: 'fa-industry',
    tipo: 'contator',
    tagDefault: 'K1',
    foto: './componentes/real_contator_forca/contator_forca.webp',
    html: () => `
        <div style=\"width:148px;height:148px;position:relative;left:25px;\">
            <img src=\"./componentes/real_contator_forca/contator_forca.webp\" style=\"width:100%;height:100%;pointer-events:none;\">
            <div class="contator-io-indicator" title="Contator acionado"></div>
            <div class=\"borne\" data-pino=\"1L1\" style=\"top:10px;left:27px;\"></div>
            <div class=\"borne\" data-pino=\"3L2\" style=\"top:10px;left:47px;\"></div>
            <div class=\"borne\" data-pino=\"5L3\" style=\"top:10px;left:67px;\"></div>
            <div class=\"borne\" data-pino=\"13\" style=\"top:10px;left:87px;\"></div>
            <div class=\"borne\" data-pino=\"A1\"  style=\"top:10px;left:107px;\"></div>
            

            <div class=\"borne\" data-pino=\"2T1\" style=\"bottom:12px;left:27px;\"></div>
            <div class=\"borne\" data-pino=\"4T2\" style=\"bottom:12px;left:47px;\"></div>
            <div class=\"borne\" data-pino=\"6T3\" style=\"bottom:12px;left:67px;\"></div>
            <div class=\"borne\" data-pino=\"14\" style=\"bottom:12px;left:87px;\"></div>
            <div class=\"borne\" data-pino=\"A2\"  style=\"bottom:12px;left:107px;\"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const a1 = inputs['A1'];
        const a2 = inputs['A2'];
        const ligadoLocal = typeof props?.coilEnergized === 'boolean'
            ? props.coilEnergized
            : !!(a1 && a2 && a1 !== a2);
        const conduzindo = !!ligadoLocal || !!props?.tagEnergized;
        const shorts = conduzindo ? [['1L1', '2T1'], ['3L2', '4T2'], ['5L3', '6T3'], ['13', '14']] : [];
        return {
            novoEstado: !!conduzindo,
            shorts,
            tipoVisual: ligadoLocal ? 'ativo-local' : (conduzindo ? 'ativo-tag' : '')
        };
    }
};
