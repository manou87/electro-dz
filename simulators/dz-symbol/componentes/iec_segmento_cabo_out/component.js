(function () {
    const LIB_KEY = 'iec_segmento_cabo_out';
    const SVG_SRC = './componentes/iec_segmento_cabo_out/assets/segmento_out.svg?v=1';

    function buildMarkup() {
        return `
            <div class="iec-segmento-cabo-wrap" data-grid-reference-x="10" data-grid-reference-y="20">
                <img class="iec-segmento-cabo-symbol" src="${SVG_SRC}" alt="Segmento de cabo OUT">
                <span class="iec-segmento-cabo-role-label out">OUT</span>
                <div class="borne iec-segmento-cabo-borne" data-pino="OUT" style="left:20px;top:20px;"></div>
            </div>
        `;
    }

    function mount(comp) {
        if (typeof window.__mountIecCableSegment === 'function') {
            window.__mountIecCableSegment(comp, 'out');
            return;
        }
        if (comp) comp.dataset.cableContinuation = 'true';
        if (comp) comp.dataset.cableSegmentRole = 'out';
    }

    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;
    window.COMPONENTES[LIB_KEY] = {
        cat: 'Simbologia IEC',
        nome: 'Segmento de Cabo OUT',
        icone: 'fa-right-long',
        tipo: 'segmento_cabo_out',
        showTag: true,
        tagDefault: 'W1',
        foto: SVG_SRC,
        gridReference: { x: 10, y: 20 },
        html: buildMarkup,
        mountComponent: mount,
        behavior: () => ({
            novoEstado: true,
            shorts: []
        })
    };
})();
