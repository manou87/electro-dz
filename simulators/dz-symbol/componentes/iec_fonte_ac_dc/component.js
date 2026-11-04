window.COMPONENTES['iec_fonte_ac_dc'] = {
    cat: 'Simbologia IEC',
    nome: 'Fonte AC/DC 24Vcc',
    icone: 'fa-bolt',
    tipo: 'fonte-mista',
    showTag: false,
    foto: './componentes/iec_fonte_ac_dc/fonte_ac_dc.svg',
    html: () => `
        <div style="width:131.5px;height:141px;position:relative;">
            <img src="./componentes/iec_fonte_ac_dc/fonte_ac_dc.svg" alt="Fonte AC/DC 24Vcc" style="position:absolute;left:0;top:0;width:131.5px;height:141px;object-fit:fill;pointer-events:none;">
        </div>
        <div class="borne" data-pino="N_AC" style="left:calc(30px + var(--iec-fonte-ac-dc-borne-x-1, var(--iec-fonte-ac-dc-borne-x, 0px)));top:calc(0px + var(--iec-fonte-ac-dc-borne-y-1, var(--iec-fonte-ac-dc-borne-y, 0px)));"></div>
        <div class="borne" data-pino="L_AC" style="left:calc(70px + var(--iec-fonte-ac-dc-borne-x-2, var(--iec-fonte-ac-dc-borne-x, 0px)));top:calc(0px + var(--iec-fonte-ac-dc-borne-y-2, var(--iec-fonte-ac-dc-borne-y, 0px)));"></div>
        <div class="borne" data-pino="PE" style="left:calc(129px + var(--iec-fonte-ac-dc-borne-x-5, var(--iec-fonte-ac-dc-borne-x, 0px)));top:calc(81px + var(--iec-fonte-ac-dc-borne-y-5, var(--iec-fonte-ac-dc-borne-y, 0px)));"></div>

        <div class="borne" data-pino="24V" style="left:calc(30px + var(--iec-fonte-ac-dc-borne-x-3, var(--iec-fonte-ac-dc-borne-x, 0px)));top:calc(140px + var(--iec-fonte-ac-dc-borne-y-3, var(--iec-fonte-ac-dc-borne-y, 0px)));"></div>
        <div class="borne" data-pino="0V" style="left:calc(70px + var(--iec-fonte-ac-dc-borne-x-4, var(--iec-fonte-ac-dc-borne-x, 0px)));top:calc(140px + var(--iec-fonte-ac-dc-borne-y-4, var(--iec-fonte-ac-dc-borne-y, 0px)));"></div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const asText = (value) => String(value == null ? '' : value).trim().toUpperCase();
        const isPhaseLike = (value) => {
            const txt = asText(value);
            return txt === 'FASE' || txt.startsWith('FASE:');
        };
        const extractPhaseId = (value) => {
            const txt = asText(value);
            if (!txt) return '';
            if (txt === 'FASE') return 'GEN';
            if (!txt.startsWith('FASE:')) return '';
            return txt.slice(5).trim();
        };
        const isNeutralLike = (value) => {
            const txt = asText(value);
            return txt === 'NEUTRO' || txt === 'N' || txt === '0V' || txt === 'M' || txt.includes('NEUTRO');
        };
        const isAcInputValid = (localInputs) => {
            const a = asText(localInputs?.L_AC);
            const b = asText(localInputs?.N_AC);
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
        };
        const setPinPotential = (pin, potential) => {
            const bornes = comp?.querySelectorAll?.(`.borne[data-pino="${pin}"]`) || [];
            bornes.forEach(borne => {
                if (!borne) return;
                if (potential) borne.dataset.potential = potential;
                else delete borne.dataset.potential;
            });
        };

        const isOn = isAcInputValid(inputs || {});
        setPinPotential('24V', isOn ? 'FASE' : '');
        setPinPotential('0V', isOn ? 'NEUTRO' : '');

        return {
            novoEstado: !!isOn,
            shorts: [],
            tipoVisual: isOn ? 'ativo' : ''
        };
    }
};
