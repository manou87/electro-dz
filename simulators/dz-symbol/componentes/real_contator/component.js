window.COMPONENTES['real_contator'] = {
    cat: 'Componentes Reais',
    nome: 'Contator Auxiliar',
    icone: 'fa-microchip',
    tipo: 'contator',
    tagDefault: 'K1',
    foto: './componentes/real_contator/contator.webp',
    html: () => `
        <div style=\"width:148px;height:148px;position:relative;left:25px\">
            <img src=\"./componentes/real_contator/contator.webp\" style=\"width:100%;height:100%;pointer-events:none;\">
            <div class="contator-io-indicator" title="Contator acionado"></div>
            <div class=\"borne\" data-pino=\"13\" style=\"top:10px;left:27px;\"></div>
            <div class=\"borne\" data-pino=\"21\" style=\"top:10px;left:47px;\"></div>
            <div class=\"borne\" data-pino=\"31\" style=\"top:10px;left:67px;\"></div>
            <div class=\"borne\" data-pino=\"43\" style=\"top:10px;left:87px;\"></div>
            <div class=\"borne\" data-pino=\"A1\" style=\"top:10px;left:107px;\"></div>

            <div class=\"borne\" data-pino=\"14\" style=\"bottom:10px;left:27px;\"></div>
            <div class=\"borne\" data-pino=\"22\" style=\"bottom:10px;left:47px;\"></div>
            <div class=\"borne\" data-pino=\"32\" style=\"bottom:10px;left:67px;\"></div>
            <div class=\"borne\" data-pino=\"44\" style=\"bottom:10px;left:87px;\"></div>
            <div class=\"borne\" data-pino=\"A2\" style=\"bottom:10px;left:107px;\"></div>
        </div>
    `,
    behavior: (inputs, estado, props) => {
        const now = (typeof window !== 'undefined' && typeof window.getSimulationTimeMs === 'function')
            ? window.getSimulationTimeMs()
            : Date.now();
        const OPEN_PULSE_MS = 350;
        const a1 = inputs['A1'];
        const a2 = inputs['A2'];
        const ligadoLocal = typeof props?.coilEnergized === 'boolean'
            ? props.coilEnergized
            : !!(a1 && a2 && a1 !== a2);

        const pulseActive = !!(props?.openPulseUntilMs && Number(props.openPulseUntilMs) > now);
        const shouldStartPulse = ligadoLocal && !estado && !pulseActive;
        const openPulseUntilMs = shouldStartPulse ? now + OPEN_PULSE_MS : Number(props?.openPulseUntilMs || 0);
        const heldOpen = openPulseUntilMs > now;
        const conduzindo = !!ligadoLocal || heldOpen;
        const shorts = conduzindo ? [['13', '14'], ['43', '44']] : [['21', '22'], ['31', '32']];
        return {
            novoEstado: !!conduzindo,
            shorts,
            tipoVisual: conduzindo ? 'ativo-local' : '',
            openPulseUntilMs
        };
    }
};
