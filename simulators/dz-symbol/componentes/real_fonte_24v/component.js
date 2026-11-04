(function () {
    const LIB_KEY = 'real_fonte_24v';
    const STYLE_ID = 'real-fonte-24v-style';
    const DC_PLUS_PIN = '24V';
    const DC_MINUS_PIN = '0V';

    function asText(value) {
        return String(value == null ? '' : value).trim().toUpperCase();
    }

    function isPhaseLike(value) {
        const txt = asText(value);
        return txt === 'FASE' || txt.startsWith('FASE:');
    }

    function extractPhaseId(value) {
        const txt = asText(value);
        if (!txt) return '';
        if (txt === 'FASE') return 'GEN';
        if (!txt.startsWith('FASE:')) return '';
        return txt.slice(5).trim();
    }

    function isNeutralLike(value) {
        const txt = asText(value);
        return txt === 'NEUTRO' || txt === 'N' || txt === '0V' || txt === 'M' || txt.includes('NEUTRO');
    }

    function isAcInputValid(inputs) {
        const a = asText(inputs?.L_AC);
        const b = asText(inputs?.N_AC);
        if (!a || !b || a === b) return false;
        const aPhase = isPhaseLike(a);
        const bPhase = isPhaseLike(b);
        const aNeutral = isNeutralLike(a);
        const bNeutral = isNeutralLike(b);
        if ((aPhase && bNeutral) || (bPhase && aNeutral)) return true;
        if (aPhase && bPhase) {
            const idA = extractPhaseId(a);
            const idB = extractPhaseId(b);
            if (idA && idB) return idA !== idB;
            return a !== b;
        }
        return false;
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] > .tag-label {
    display: none !important;
}
.ps24-wrap {
    width: 216px;
    height: 388px;
    position: relative;
}
.ps24-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}
.ps24-led {
    position: absolute;
    left: calc(72px + var(--real-fonte-24v-led-x, 0px));
    top: calc(165px + var(--real-fonte-24v-led-y, 0px));
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #28403a;
    border: 1px solid rgba(13, 18, 19, 0.7);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset;
}
.ps24-led.on {
    background: #34e57c;
    box-shadow: 0 0 10px rgba(52, 229, 124, 0.85), 0 0 0 1px rgba(255,255,255,0.18) inset;
}
.ps24-borne {
    transform: translate(-50%, -50%);
}
`;
        document.head.appendChild(style);
    }

    function setPinPotential(componentEl, pin, potential) {
        const bornes = componentEl?.querySelectorAll?.(`.borne[data-pino="${pin}"]`) || [];
        bornes.forEach(borne => {
            if (!borne) return;
            if (potential) borne.dataset.potential = potential;
            else delete borne.dataset.potential;
        });
    }

    function applyOutputPotentials(componentEl, isOn) {
        const plusPotential = isOn ? 'FASE' : '';
        const minusPotential = isOn ? 'NEUTRO' : '';
        setPinPotential(componentEl, DC_PLUS_PIN, plusPotential);
        setPinPotential(componentEl, DC_MINUS_PIN, minusPotential);
        const led = componentEl?.querySelector?.('.ps24-led');
        if (led) led.classList.toggle('on', !!isOn);
        if (componentEl) componentEl.dataset.ps24On = isOn ? '1' : '0';
    }

    function html() {
        return `
            <div class="ps24-wrap">
                <img class="ps24-img" src="./componentes/real_fonte_24v/fonte.webp" alt="Fonte 24V">
                <div class="ps24-led" style="left:58px;top:136px;"></div>

                <div class="borne ps24-borne" data-pino="24V" style="left:66px;top:42px;"></div>
                <div class="borne ps24-borne" data-pino="24V" style="left:92px;top:42px;"></div>
                <div class="borne ps24-borne" data-pino="0V" style="left:117px;top:42px;"></div>
                <div class="borne ps24-borne" data-pino="0V" style="left:142px;top:42px;"></div>

                <div class="borne ps24-borne" data-pino="T_AC" style="left:57px;top:362px;"></div>
                <div class="borne ps24-borne" data-pino="N_AC" style="left:99px;top:362px;"></div>
                <div class="borne ps24-borne" data-pino="L_AC" style="left:142px;top:362px;"></div>
            </div>
        `;
    }

    ensureStyle();

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Fonte 100-220V / 24Vcc',
        icone: 'fa-bolt',
        tipo: 'fonte-mista',
        foto: './componentes/real_fonte_24v/fonte.webp',
        showTag: false,
        html,
        behavior: (inputs, estado, props, comp) => {
            const isOn = isAcInputValid(inputs || {});
            applyOutputPotentials(comp, isOn);
            return {
                novoEstado: !!isOn,
                shorts: [],
                tipoVisual: isOn ? 'ativo-local' : ''
            };
        }
    };
})();
