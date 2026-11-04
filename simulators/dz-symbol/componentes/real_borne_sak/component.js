(function () {
    const LIB_KEY = 'real_borne_sak';
    const STYLE_ID = 'real-borne-sak-style';
    const PINS = ['A', 'B'];

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] {
    z-index: 43 !important;
    overflow: visible;
}
.real-borne-sak-wrap {
    position: relative;
    width: 36px;
    height: 194px;
}
.real-borne-sak-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}
.real-borne-sak-borne {
    transform: translate(-50%, -50%);
}
`;
        document.head.appendChild(style);
    }

    function buildHtml() {
        return `
            <div class="real-borne-sak-wrap">
                <img class="real-borne-sak-img" src="./componentes/real_borne_sak/borne_sak.webp" alt="Borne SAK">
                <div class="borne real-borne-sak-borne" data-pino="A" style="left:17.6px;top:44px;transform:translate(calc(-50% + var(--real-borne-sak-borne-x-1, var(--real-borne-sak-borne-x, 0px))), calc(-50% + var(--real-borne-sak-borne-y-1, var(--real-borne-sak-borne-y, 0px))));"></div>
                <div class="borne real-borne-sak-borne" data-pino="B" style="left:17.6px;top:150.4px;transform:translate(calc(-50% + var(--real-borne-sak-borne-x-2, var(--real-borne-sak-borne-x, 0px))), calc(-50% + var(--real-borne-sak-borne-y-2, var(--real-borne-sak-borne-y, 0px))));"></div>
            </div>
        `;
    }

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Borne SAK',
        icone: 'fa-grip-lines',
        tipo: 'conector',
        tagDefault: 'BS1',
        foto: './componentes/real_borne_sak/borne_sak.webp',
        html: buildHtml,
        behavior: () => ({
            novoEstado: true,
            shorts: PINS.slice(1).map((pin) => [PINS[0], pin]),
            tipoVisual: 'ativo-local'
        })
    };
})();
