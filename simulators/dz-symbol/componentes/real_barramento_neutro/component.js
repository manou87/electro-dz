(function () {
    const LIB_KEY = 'real_barramento_neutro';
    const STYLE_ID = 'real-barramento-neutro-style';
    const PINS = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10'];
    const X_POSITIONS = [84, 108, 131, 154, 177, 201, 224, 247, 270, 294];

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] {
    z-index: 42 !important;
}
.real-barramento-wrap {
    position: relative;
    width: 388px;
    height: 64px;
}
.real-barramento-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}
.real-barramento-borne {
    transform: translate(-50%, -50%);
}
`;
        document.head.appendChild(style);
    }

    function buildHtml() {
        const bornes = PINS.map((pin, index) => {
            return `<div class="borne real-barramento-borne" data-pino="${pin}" style="left:${X_POSITIONS[index]}px;top:24px;"></div>`;
        }).join('');
        return `
            <div class="real-barramento-wrap">
                <img class="real-barramento-img" src="./componentes/real_barramento_neutro/barramento_neutro.webp" alt="Barramento de neutro">
                ${bornes}
            </div>
        `;
    }

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Barramento Neutro',
        icone: 'fa-grip-lines',
        tipo: 'barramento',
        tagDefault: 'BN1',
        foto: './componentes/real_barramento_neutro/barramento_neutro.webp',
        html: buildHtml,
        behavior: () => ({
            novoEstado: true,
            shorts: PINS.slice(1).map((pin) => ['N1', pin]),
            tipoVisual: 'ativo-local'
        })
    };
})();
