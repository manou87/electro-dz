window.COMPONENTES['iec_bobina_contator'] = {
    cat: 'Simbologia IEC',
    nome: 'Bobina Contator',
    icone: 'fa-magnet',
    tipo: 'bobina',
    showTag: true,
    tagDefault: 'K1',
    foto: './componentes/iec_bobina_contator/bobina_0.svg',
    html: () => `
        <div class="iec-bobina-wrap">
            <img
                class="iec-bobina-img iec-bobina-off"
                src="./componentes/iec_bobina_contator/bobina_0.svg"
                alt="Bobina de contator - desenergizada"
            >
            <img
                class="iec-bobina-img iec-bobina-on"
                src="./componentes/iec_bobina_contator/bobina_1.svg"
                alt="Bobina de contator - energizada"
            >
        </div>
        <div class="pin-label pin-top" data-pin-label="A1">A1</div>
        <div class="pin-label pin-bottom" data-pin-label="A2">A2</div>
        <div class="borne" data-pino="A1" style="left:calc(24px + var(--iec-bobina-borne-x));top:calc(-4px + var(--iec-bobina-borne-top-y));"></div>
        <div class="borne" data-pino="A2" style="left:calc(24px + var(--iec-bobina-borne-x));top:calc(64px + var(--iec-bobina-borne-bottom-y));"></div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const a1 = inputs['A1'];
        const a2 = inputs['A2'];
        const ligado = typeof props?.coilEnergized === 'boolean'
            ? props.coilEnergized
            : !!(a1 && a2 && a1 !== a2);
        return { novoEstado: ligado, shorts: [] };
    }
};

