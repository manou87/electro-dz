window.COMPONENTES['iec_bobina_temp'] = {
    cat: 'Simbologia IEC',
    nome: 'وشيعة مؤقت زمني',
    icone: 'fa-clock',
    tipo: 'bobina_temporizada',
    showTag: true,
    tagDefault: 'D1',
    foto: './componentes/iec_bobina_temp/bobina_temp_0.svg',
    html: () => `
        <div class="iec-bobina-wrap">
            <img
                class="iec-bobina-img iec-bobina-off"
                src="./componentes/iec_bobina_temp/bobina_temp_0.svg"
                alt="Bobina temporizadora - desenergizada"
            >
            <img
                class="iec-bobina-img iec-bobina-on"
                src="./componentes/iec_bobina_temp/bobina_temp_1.svg"
                alt="Bobina temporizadora - temporizada ativa"
            >
            <div class="timer-label" data-timer-seconds="3">3s</div>
        </div>
        <div class="pin-label pin-top" data-pin-label="A1">A1</div>
        <div class="pin-label pin-bottom" data-pin-label="A2">A2</div>
        <div class="borne" data-pino="A1" style="left:calc(24px + var(--iec-bobina-temp-borne-x));top:calc(-4px + var(--iec-bobina-temp-borne-top-y));"></div>
        <div class="borne" data-pino="A2" style="left:calc(24px + var(--iec-bobina-temp-borne-x));top:calc(64px + var(--iec-bobina-temp-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const a1 = inputs['A1'];
        const a2 = inputs['A2'];
        const ligado = typeof props?.coilEnergized === 'boolean'
            ? props.coilEnergized
            : !!(a1 && a2 && a1 !== a2);
        const tag = comp?.dataset?.tag || 'D1';
        const debugState = JSON.stringify({ tag, ligado: !!ligado, a1: a1 || null, a2: a2 || null });
        if (comp && comp._debugLastBobinaTempState !== debugState) {
            comp._debugLastBobinaTempState = debugState;
            console.debug('[iec_bobina_temp]', { tag, ligado: !!ligado, a1: a1 || null, a2: a2 || null });
        }
        return { novoEstado: ligado, shorts: [] };
    }
};
