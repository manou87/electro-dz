(function () {
    const LIB_KEY = 'iec_borne_sak';
    const SVG_SRC = './componentes/iec_borne_sak/borne_simbolo.svg?v=1';
    const PINS = ['X1', 'X2'];

    function allBornes() {
        return Array.from(document.querySelectorAll(`.component[data-lib="${LIB_KEY}"]`));
    }

    function normalizeNumber(value) {
        const number = parseInt(String(value == null ? '' : value).trim(), 10);
        return Number.isFinite(number) && number > 0 ? number : null;
    }

    function numberInUse(number, except = null) {
        return allBornes().some(comp =>
            comp !== except && normalizeNumber(comp.dataset.borneNumber) === number
        );
    }

    function nextAvailableNumber(except = null) {
        const used = new Set(
            allBornes()
                .filter(comp => comp !== except)
                .map(comp => normalizeNumber(comp.dataset.borneNumber))
                .filter(Number.isFinite)
        );
        let number = 1;
        while (used.has(number)) number += 1;
        return number;
    }

    function refresh(comp) {
        if (!comp) return;
        let number = normalizeNumber(comp.dataset.borneNumber);
        if (!number || numberInUse(number, comp)) number = nextAvailableNumber(comp);
        comp.dataset.borneNumber = String(number);
        const label = comp.querySelector('.iec-borne-sak-number');
        if (label) label.textContent = String(number);
    }

    function editNumber(comp) {
        if (!comp || window.simulando) return true;
        refresh(comp);
        const current = comp.dataset.borneNumber;
        const answer = window.prompt('Numero do borne:', current);
        if (answer == null) return true;
        const number = normalizeNumber(answer);
        if (!number) {
            window.alert('Informe um numero inteiro maior que zero.');
            return true;
        }
        if (numberInUse(number, comp)) {
            window.alert(`O borne ${number} ja existe.`);
            return true;
        }
        comp.dataset.borneNumber = String(number);
        refresh(comp);
        if (typeof window.scheduleHistoryCheckpoint === 'function') {
            window.scheduleHistoryCheckpoint('iec_borne_sak_number');
        }
        return true;
    }

    function ensureStyle() {
        if (document.getElementById('iec-borne-sak-style')) return;
        const style = document.createElement('style');
        style.id = 'iec-borne-sak-style';
        style.textContent = `
.component[data-lib="${LIB_KEY}"] > .tag-label {
    display: none !important;
}
.iec-borne-sak-wrap {
    position: relative;
    width: 40px;
    height: 110px;
}
.iec-borne-sak-symbol {
    position: absolute;
    inset: 0;
    width: 40px;
    height: 110px;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
}
.iec-borne-sak-number {
    position: absolute;
    left: 20px;
    top: 55px;
    min-width: 22px;
    transform: translate(-50%, -50%);
    color: #111;
    font: 700 12px/1 Arial, sans-serif;
    text-align: center;
    pointer-events: none;
}
.iec-borne-sak-borne {
    transform: translate(-50%, -50%);
}
`;
        document.head.appendChild(style);
    }

    function buildMarkup() {
        return `
            <div class="iec-borne-sak-wrap" data-grid-reference-x="20" data-grid-reference-y="20">
                <img class="iec-borne-sak-symbol" src="${SVG_SRC}" alt="Borne SAK em simbologia">
                <span class="iec-borne-sak-number"></span>
                <div class="borne iec-borne-sak-borne" data-pino="X1" style="left:20px;top:20px;"></div>
                <div class="borne iec-borne-sak-borne" data-pino="X2" style="left:20px;top:100px;"></div>
            </div>
        `;
    }

    ensureStyle();
    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;
    window.COMPONENTES[LIB_KEY] = {
        cat: 'Simbologia IEC',
        nome: 'Borne SAK',
        icone: 'fa-grip-lines',
        tipo: 'conector',
        tagDefault: 'BORNE1',
        foto: SVG_SRC,
        showTag: false,
        gridReference: { x: 20, y: 20 },
        promptQuantityOnAdd: true,
        maxAddQuantity: 100,
        batchSpacing: { x: 20, y: 0 },
        html: buildMarkup,
        mountComponent: refresh,
        onDoubleActivate: editNumber,
        exportData: comp => {
            refresh(comp);
            return { number: normalizeNumber(comp.dataset.borneNumber) };
        },
        importData: (comp, payload) => {
            const requested = normalizeNumber(payload?.number);
            comp.dataset.borneNumber = String(
                requested && !numberInUse(requested, comp)
                    ? requested
                    : nextAvailableNumber(comp)
            );
            refresh(comp);
        },
        behavior: () => ({
            novoEstado: true,
            shorts: [[PINS[0], PINS[1]]],
            tipoVisual: 'ativo-local'
        })
    };

    window.refreshIecBorneSakNumber = refresh;
})();
