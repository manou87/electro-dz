window.COMPONENTES['iec_sensor_capacitivo_na'] = {
    cat: 'Simbologia IEC',
    nome: 'Sensor Capacitivo NA',
    icone: 'fa-bullseye',
    tipo: 'sensor',
    showTag: true,
    tagDefault: 'B1',
    foto: './componentes/iec_sensor_capacitivo_na/preview.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:80px;height:100px;position:relative;">
            <img
                class="iec-dual-state-img iec-dual-state-img-off"
                src="./componentes/iec_sensor_capacitivo_na/sensor_capacitivo_na_0.svg"
                alt="Sensor capacitivo NA em repouso"
                style="inset:auto;left:0;top:0;width:80px;height:100px;object-fit:fill;object-position:center center;"
            >
            <img
                class="iec-dual-state-img iec-dual-state-img-on"
                src="./componentes/iec_sensor_capacitivo_na/sensor_capacitivo_na_1.svg"
                alt="Sensor capacitivo NA acionado"
                style="inset:auto;left:0;top:0;width:80px;height:100px;object-fit:fill;object-position:center center;"
            >
            <button type="button" class="toggle-state-btn" title="Alternar sensor capacitivo NA" aria-label="Alternar sensor capacitivo NA"></button>
            <div class="pin-label" data-pin-label="13" style="left:54px;top:0;transform:translate(0,-50%);">13</div>
            <div class="pin-label" data-pin-label="14" style="left:54px;top:100px;transform:translate(0,-50%);">14</div>
            <div class="borne" data-pino="13" data-label="13" style="left:30px;top:-10px;"></div>
            <div class="borne" data-pino="14" data-label="14" style="left:30px;top:90px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const acionado = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: acionado,
            shorts: acionado ? [['13', '14']] : []
        };
    }
};
