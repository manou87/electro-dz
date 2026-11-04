(function () {
    const LIB_KEY = 'iec_segmento_cabo_in';
    const OUT_LIB_KEY = 'iec_segmento_cabo_out';
    const SVG_SRC = './componentes/iec_segmento_cabo_in/assets/segmento_in.svg?v=1';

    function ensureStyle() {
        if (document.getElementById('iec-segmento-cabo-style')) return;
        const style = document.createElement('style');
        style.id = 'iec-segmento-cabo-style';
        style.textContent = `
.iec-segmento-cabo-wrap {
    position: relative;
    width: 60px;
    height: 40px;
}
.iec-segmento-cabo-symbol {
    position: absolute;
    inset: 0;
    width: 60px;
    height: 40px;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
}
.iec-segmento-cabo-role-label {
    position: absolute;
    top: 22px;
    min-width: 18px;
    padding: 0 2px;
    color: #111;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #ddd;
    border-radius: 2px;
    font: 700 8px/1.2 Arial, sans-serif;
    text-align: center;
    pointer-events: none;
}
.iec-segmento-cabo-role-label.in {
    left: 43px;
    transform: translate(-50%, 0);
}
.iec-segmento-cabo-role-label.out {
    left: 8px;
    transform: translate(-50%, 0);
}
.iec-segmento-cabo-borne {
    transform: translate(-50%, -50%);
}
.component[data-lib="iec_segmento_cabo_in"] > .tag-label,
.component[data-lib="iec_segmento_cabo_out"] > .tag-label {
    left: 30px;
    top: -4px;
    transform: translate(-50%, -100%);
    font-weight: 700;
}
.component .cross-ref-label.cable-in,
.component .cross-ref-label.cable-out {
    transform: translateY(-50%);
    top: 50%;
    font-size: 10px;
    font-weight: 700;
}
.component .cross-ref-label.cable-in {
    text-align: right;
    transform: translate(-100%, -50%);
}
`;
        document.head.appendChild(style);
    }

    function normalizeCableTag(value) {
        return String(value || '').trim().toUpperCase();
    }

    function getComponentsByLib(libKey) {
        return Array.from(document.querySelectorAll(`#bancada .component[data-lib="${libKey}"]`) || []);
    }

    function setSegmentTag(comp, tag) {
        const normalized = String(tag || '').trim();
        if (!comp || !normalized) return;
        comp.dataset.tag = normalized;
        const label = comp.querySelector(':scope > .tag-label');
        if (label) label.innerText = normalized;
    }

    function findUnpairedOppositeTag(role, comp) {
        const ownLib = role === 'in' ? LIB_KEY : OUT_LIB_KEY;
        const oppositeLib = role === 'in' ? OUT_LIB_KEY : LIB_KEY;
        const ownTags = new Set(
            getComponentsByLib(ownLib)
                .filter(item => item !== comp)
                .map(item => normalizeCableTag(item.dataset.tag))
                .filter(Boolean)
        );
        return getComponentsByLib(oppositeLib)
            .map(item => String(item.dataset.tag || '').trim())
            .find(tag => tag && !ownTags.has(normalizeCableTag(tag))) || '';
    }

    function mountCableSegment(comp, role) {
        if (!comp) return;
        comp.dataset.cableContinuation = 'true';
        comp.dataset.cableSegmentRole = role;
        const pairTag = findUnpairedOppositeTag(role, comp);
        if (pairTag) setSegmentTag(comp, pairTag);
    }

    window.__mountIecCableSegment = mountCableSegment;

    function buildMarkup() {
        return `
            <div class="iec-segmento-cabo-wrap" data-grid-reference-x="40" data-grid-reference-y="20">
                <img class="iec-segmento-cabo-symbol" src="${SVG_SRC}" alt="Segmento de cabo IN">
                <span class="iec-segmento-cabo-role-label in">IN</span>
                <div class="borne iec-segmento-cabo-borne" data-pino="IN" style="left:40px;top:20px;"></div>
            </div>
        `;
    }

    function mount(comp) {
        mountCableSegment(comp, 'in');
    }

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;
    window.COMPONENTES[LIB_KEY] = {
        cat: 'Simbologia IEC',
        nome: 'Segmento de Cabo IN',
        icone: 'fa-left-long',
        tipo: 'segmento_cabo_in',
        showTag: true,
        tagDefault: 'W1',
        foto: SVG_SRC,
        gridReference: { x: 40, y: 20 },
        html: buildMarkup,
        mountComponent: mount,
        behavior: () => ({
            novoEstado: true,
            shorts: []
        })
    };
})();
