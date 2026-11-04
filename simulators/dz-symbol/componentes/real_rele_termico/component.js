window.COMPONENTES['real_rele_termico'] = {
    cat: 'Componentes Reais',
    nome: 'مرحل حراري',
    icone: 'fa-temperature-half',
    tipo: 'protecao',
    tagDefault: 'K1',
    foto: './componentes/real_rele_termico/rele_termico.webp',
    html: () => `
        <div style=\"width:148px;height:220px;position:relative;left:25px;\">
            <img src=\"./componentes/real_rele_termico/rele_termico.webp\" style=\"width:100%;height:100%;pointer-events:none;\">
            <div class=\"borne\" data-pino=\"1L1\" style=\"top:10px;left:25px;\"></div>
            <div class=\"borne\" data-pino=\"3L2\" style=\"top:10px;left:45px;\"></div>
            <div class=\"borne\" data-pino=\"5L3\" style=\"top:10px;left:65px;\"></div>

            <div class=\"borne\" data-pino=\"2T1\" style=\"bottom:30px;left:35px;\"></div>
            <div class=\"borne\" data-pino=\"4T2\" style=\"bottom:30px;left:65px;\"></div>
            <div class=\"borne\" data-pino=\"6T3\" style=\"bottom:30px;left:95px;\"></div>

            <div class=\"borne\" data-pino=\"96\" style=\"top:125px;left:23px;\"></div>
            <div class=\"borne\" data-pino=\"97\" style=\"top:125px;left:48px;\"></div>
            <div class=\"borne\" data-pino=\"98\" style=\"top:125px;left:76px;\"></div>
            <div class=\"borne\" data-pino=\"95\" style=\"top:125px;left:102px;\"></div>
            <div class=\"borne\" data-pino=\"14_EXT\" style=\"top:50px;left:7px;\"></div>
            <div class=\"borne\" data-pino=\"A2_EXT\" style=\"top:50px;left:122px;\"></div>
            <div class="rele-trip-indicator">TRIP</div>
            <div class="rele-controls">
                <button type="button" class="rele-trip-btn">TRIP</button>
                <button type="button" class="rele-reset-btn">RESET</button>
            </div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const normal = comp?.dataset?.releTrip !== 'true';
        const tripped = !normal;
        const shorts = [
            ['1L1','2T1'],
            ['3L2','4T2'],
            ['5L3','6T3'],
        ];
        if (normal) {
            shorts.push(['95','96']);
        } else {
            shorts.push(['97','98']);
        }
        return { novoEstado: tripped, shorts, tipoVisual: tripped ? 'trip' : '' };
    }
};

