window.COMPONENTES['iec_sensor_capacitivo_nf'] = {
    cat: 'Simbologia IEC',
    nome: 'حساس تقاربي سعوي (NC)',
    icone: 'fa-bullseye',
    tipo: 'sensor',
    showTag: true,
    tagDefault: 'B1',
    foto: './componentes/iec_sensor_capacitivo_nf/preview.svg',
    html: () => `
        <div class="iec-dual-state-wrap" style="width:80px;height:100px;position:relative;">
            <img
                class="iec-dual-state-img iec-dual-state-img-off"
                src="./componentes/iec_sensor_capacitivo_nf/sensor_capacitivo_nf_0.svg"
                alt="Sensor capacitivo NF em repouso"
                style="inset:auto;left:0;top:0;width:80px;height:100px;object-fit:fill;object-position:center center;"
            >
            <img
                class="iec-dual-state-img iec-dual-state-img-on"
                src="./componentes/iec_sensor_capacitivo_nf/sensor_capacitivo_nf_1.svg"
                alt="Sensor capacitivo NF acionado"
                style="inset:auto;left:0;top:0;width:80px;height:100px;object-fit:fill;object-position:center center;"
            >
            <button type="button" class="toggle-state-btn" title="Alternar sensor capacitivo NF" aria-label="Alternar sensor capacitivo NF"></button>
            <div class="pin-label" data-pin-label="11" style="left:54px;top:0;transform:translate(0,-50%);">11</div>
            <div class="pin-label" data-pin-label="12" style="left:54px;top:100px;transform:translate(0,-50%);">12</div>
            <div class="borne" data-pino="11" data-label="11" style="left:30px;top:-10px;"></div>
            <div class="borne" data-pino="12" data-label="12" style="left:30px;top:90px;"></div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const acionado = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: acionado,
            shorts: acionado ? [] : [['11', '12']]
        };
    }
};
