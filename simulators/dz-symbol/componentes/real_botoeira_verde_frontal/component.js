window.COMPONENTES['real_botoeira_verde_frontal'] = {
    cat: 'Componentes Reais',
    nome: 'Botoeira Verde Frontal',
    icone: 'fa-circle',
    tipo: 'botao',
    pressable: 'momentary',
    tagDefault: 'S1',
    showTag: true,
    hiddenInMenu: true,
    foto: './componentes/real_botoeira_verde_frontal/bt_verde_0.webp',
    html: () => `
        <div class="real-botoeira-frontal-wrap">
            <img class="real-botoeira-frontal-base" src="./componentes/real_botoeira_verde_frontal/base_frente.webp" alt="Base frontal da botoeira verde">
            <img class="real-botoeira-frontal-btn real-botoeira-frontal-off" src="./componentes/real_botoeira_verde_frontal/bt_verde_0.webp" alt="Botao verde frontal em repouso">
            <img class="real-botoeira-frontal-btn real-botoeira-frontal-on" src="./componentes/real_botoeira_verde_frontal/bt_verde_1.webp" alt="Botao verde frontal pressionado">
            <div class="borne" data-pino="13" style="top:12px;left:40px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-13" data-pin-label="13">3</div>
            <div class="borne" data-pino="14" style="bottom:12px;left:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-14" data-pin-label="14">4</div>
            <div class="borne" data-pino="23" style="top:12px;right:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-23" data-pin-label="23">3</div>
            <div class="borne" data-pino="24" style="bottom:12px;right:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-24" data-pin-label="24">4</div>
        </div>
    `,
    onDoubleActivate: (comp) => {
        window.openRealBotoeiraConfigModal?.(comp, {
            frontalLib: 'real_botoeira_verde_frontal',
            lateralLib: 'real_botoeira_verde',
            title: 'Configurar botoeira verde',
            defaultView: 'frontal',
            defaultContactConfig: '2na',
            tagDefault: 'S1'
        });
        return true;
    },
    exportData: (comp) => ({ contactConfig: normalizeRealBotoeiraVerdeFrontalConfig(comp?.dataset?.contactConfig) }),
    importData: (comp, payload) => applyRealBotoeiraVerdeFrontalConfig(comp, normalizeRealBotoeiraVerdeFrontalConfig(payload?.contactConfig)),
    behavior: (inputs, estado, props, comp) => {
        const pressionado = !!props.pressionado;
        return {
            novoEstado: pressionado,
            shorts: getRealBotoeiraVerdeFrontalShorts(comp, pressionado)
        };
    }
};

function normalizeRealBotoeiraVerdeFrontalConfig(value) {
    const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    return ['2na', '2nf', '1na1nf'].includes(text) ? text : '2na';
}

function getRealBotoeiraVerdeFrontalPins(config) {
    if (config === '2nf') return ['11', '12', '21', '22'];
    if (config === '1na1nf') return ['13', '14', '21', '22'];
    return ['13', '14', '23', '24'];
}

function applyRealBotoeiraVerdeFrontalConfig(comp, config) {
    if (!comp) return;
    const normalized = normalizeRealBotoeiraVerdeFrontalConfig(config);
    comp.dataset.contactConfig = normalized;
    comp.dataset.botoeiraView = 'frontal';
    const pins = getRealBotoeiraVerdeFrontalPins(normalized);
    Array.from(comp.querySelectorAll('.borne')).forEach((borne, index) => {
        borne.dataset.pino = pins[index] || borne.dataset.pino;
    });
    Array.from(comp.querySelectorAll('.pin-label')).forEach((label, index) => {
        const pin = pins[index] || label.innerText;
        label.dataset.pinLabel = pin;
        label.innerText = String(pin).slice(-1);
    });
}

function getRealBotoeiraVerdeFrontalShorts(comp, pressionado) {
    const config = normalizeRealBotoeiraVerdeFrontalConfig(comp?.dataset?.contactConfig);
    if (config === '2nf') return pressionado ? [] : [['11', '12'], ['21', '22']];
    if (config === '1na1nf') return pressionado ? [['13', '14']] : [['21', '22']];
    return pressionado ? [['13', '14'], ['23', '24']] : [];
}
