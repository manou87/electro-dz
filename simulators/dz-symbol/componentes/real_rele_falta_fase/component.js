(function () {
    const LIB_KEY = 'real_rele_falta_fase';
    const STYLE_ID = 'real-rele-falta-fase-style';
    const DESIGN_WIDTH = 188;
    const DESIGN_HEIGHT = 458;
    const FRAME_WIDTH = 125;
    const FRAME_HEIGHT = 305;
    const SCALE_X = FRAME_WIDTH / DESIGN_WIDTH;
    const SCALE_Y = FRAME_HEIGHT / DESIGN_HEIGHT;
    function normalize(value) {
        return String(value || '').trim().toUpperCase();
    }

    function isPhasePotential(value) {
        const potential = normalize(value);
        return potential === 'FASE' ||
            potential.startsWith('FASE:') ||
            potential === 'L1' ||
            potential === 'L2' ||
            potential === 'L3' ||
            potential === 'R' ||
            potential === 'S' ||
            potential === 'T';
    }

    function getNodeByPin(comp, pin) {
        return comp?.querySelector?.(`.borne[data-pino="${pin}"]`) ?._node || null;
    }

    function hasPhaseAtInput(comp, pin, inputValue) {
        const node = getNodeByPin(comp, pin);
        const nodeHasPhase = Array.from(node?.potenciais || []).some(isPhasePotential);
        return nodeHasPhase || isPhasePotential(inputValue);
    }

    function evaluatePhaseState(comp, inputs) {
        const present = ['R', 'S', 'T'].map((pin) => hasPhaseAtInput(comp, pin, inputs?.[pin]));
        const presentCount = present.filter(Boolean).length;
        const powered = presentCount === 3;
        return {
            presentCount,
            powered,
            alarm: !powered
        };
    }
    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
.component[data-lib="${LIB_KEY}"] {
    min-width: ${FRAME_WIDTH}px;
    min-height: ${FRAME_HEIGHT}px;
}
.real-rele-falta-fase-frame {
    position: relative;
    width: ${FRAME_WIDTH}px;
    height: ${FRAME_HEIGHT}px;
}
.real-rele-falta-fase-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}
.real-rele-falta-fase-led {
    position: absolute;
    width: ${23 * SCALE_X}px;
    height: ${23 * SCALE_Y}px;
    border-radius: 50%;
    opacity: 1;
    box-shadow: none;
    pointer-events: none;
}
.real-rele-falta-fase-led-power {
    background: #43ff57;
}
.real-rele-falta-fase-led-trip {
    background: #ff2b2b;
}
`;
        document.head.appendChild(style);
    }

    function borneStyle(index, left, top) {
        return `left:calc(${left * SCALE_X}px + var(--real-rele-falta-fase-borne-x-${index}, var(--real-rele-falta-fase-borne-x, 0px)));top:calc(${top * SCALE_Y}px + var(--real-rele-falta-fase-borne-y-${index}, var(--real-rele-falta-fase-borne-y, 0px)));`;
    }

    function ledStyle(kind, left, top) {
        return `left:calc(${left * SCALE_X}px + var(--real-rele-falta-fase-led-${kind}-x, 0px));top:calc(${top * SCALE_Y}px + var(--real-rele-falta-fase-led-${kind}-y, 0px));`;
    }

    ensureStyle();

    window.COMPONENTES[LIB_KEY] = {
        cat: 'Componentes Reais',
        nome: 'Relé de Falta de Fase',
        icone: 'fa-bolt-lightning',
        tipo: 'rele',
        showTag: true,
        tagDefault: 'RFF1',
        foto: './componentes/real_rele_falta_fase/rele_falta_fase_2D.webp',
        html: () => `
            <div class="real-rele-falta-fase-frame">
                <img class="real-rele-falta-fase-img" src="./componentes/real_rele_falta_fase/rele_falta_fase_2D.webp" alt="Relé de falta de fase">

                <div class="borne" data-pino="R" style="${borneStyle(1, 27, 21)}"></div>
                <div class="borne" data-pino="S" style="${borneStyle(2, 83, 21)}"></div>
                <div class="borne" data-pino="T" style="${borneStyle(3, 139, 21)}"></div>

                <div class="borne" data-pino="14" style="${borneStyle(4, 27, 423)}"></div>
                <div class="borne" data-pino="11" style="${borneStyle(5, 83, 423)}"></div>
                <div class="borne" data-pino="12" style="${borneStyle(6, 139, 423)}"></div>

                <div class="real-rele-falta-fase-led real-rele-falta-fase-led-power" title="Relé energizado" style="${ledStyle('power', 37, 96)}"></div>
                <div class="real-rele-falta-fase-led real-rele-falta-fase-led-trip" title="Falta de fase detectada" style="${ledStyle('trip', 37, 266)}"></div>
            </div>
        `,
        behavior: (inputs, estado, props, comp) => {
            const phaseState = evaluatePhaseState(comp, inputs || {});
            // Usa o estado consolidado da iteracao anterior para fazer a troca SPDT sem sobrepor NF e NA.
            const contactPowered = estado === true;
            const greenLedOn = phaseState.presentCount >= 2;
            const redLedOn = !contactPowered && phaseState.presentCount >= 2;
            const ledPower = comp?.querySelector?.('.real-rele-falta-fase-led-power');
            const ledTrip = comp?.querySelector?.('.real-rele-falta-fase-led-trip');
            if (ledPower) {
                ledPower.style.opacity = '1';
                ledPower.style.filter = greenLedOn ? 'brightness(1.2)' : 'brightness(0.35)';
                ledPower.style.boxShadow = greenLedOn ? '0 0 10px rgba(67, 255, 87, 0.85)' : 'none';
            }
            if (ledTrip) {
                ledTrip.style.opacity = '1';
                ledTrip.style.filter = redLedOn ? 'brightness(1.18)' : 'brightness(0.35)';
                ledTrip.style.boxShadow = redLedOn ? '0 0 10px rgba(255, 43, 43, 0.88)' : 'none';
            }

            return {
                novoEstado: phaseState.powered,
                shorts: contactPowered ? [['11', '14']] : [['11', '12']],
                tipoVisual: phaseState.powered ? 'acionado' : (phaseState.alarm ? 'ativo' : '')
            };
        }
    };
})();
