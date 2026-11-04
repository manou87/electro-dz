window.COMPONENTES['real_botoeira_vermelha_frontal'] = {
    cat: 'Componentes Reais',
    nome: 'Botoeira Vermelha Frontal',
    icone: 'fa-circle',
    tipo: 'botao',
    pressable: 'momentary',
    tagDefault: 'S0',
    showTag: true,
    hiddenInMenu: true,
    foto: './componentes/real_botoeira_vermelha_frontal/bt_verm_0.webp',
    html: () => `
        <div class="real-botoeira-frontal-wrap">
            <img class="real-botoeira-frontal-base" src="./componentes/real_botoeira_vermelha_frontal/base_frente.webp" alt="Base frontal da botoeira vermelha">
            <img class="real-botoeira-frontal-btn real-botoeira-frontal-off" src="./componentes/real_botoeira_vermelha_frontal/bt_verm_0.webp" alt="Botao vermelho frontal em repouso">
            <img class="real-botoeira-frontal-btn real-botoeira-frontal-on" src="./componentes/real_botoeira_vermelha_frontal/bt_verm_1.webp" alt="Botao vermelho frontal pressionado">
            <div class="borne" data-pino="11" style="top:12px;left:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-13" data-pin-label="11">1</div>
            <div class="borne" data-pino="12" style="bottom:12px;left:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-14" data-pin-label="12">2</div>
            <div class="borne" data-pino="21" style="top:12px;right:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-23" data-pin-label="21">1</div>
            <div class="borne" data-pino="22" style="bottom:12px;right:20px;"></div>
            <div class="pin-label real-botoeira-frontal-label real-botoeira-frontal-label-24" data-pin-label="22">2</div>
        </div>
    `,
    onDoubleActivate: (comp) => {
        window.openRealBotoeiraConfigModal?.(comp, {
            frontalLib: 'real_botoeira_vermelha_frontal',
            lateralLib: 'real_botoeira_vermelha',
            title: 'Configurar botoeira vermelha',
            defaultView: 'frontal',
            defaultContactConfig: '2nf',
            tagDefault: 'S0'
        });
        return true;
    },
    exportData: (comp) => ({ contactConfig: normalizeRealBotoeiraVermelhaFrontalConfig(comp?.dataset?.contactConfig) }),
    importData: (comp, payload) => applyRealBotoeiraVermelhaFrontalConfig(comp, normalizeRealBotoeiraVermelhaFrontalConfig(payload?.contactConfig)),
    behavior: (inputs, estado, props, comp) => {
        const pressionado = !!props.pressionado;
        return {
            novoEstado: pressionado,
            shorts: getRealBotoeiraVermelhaFrontalShorts(comp, pressionado)
        };
    }
};

function normalizeRealBotoeiraVermelhaFrontalConfig(value) {
    const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    return ['2na', '2nf', '1na1nf'].includes(text) ? text : '2nf';
}

function getRealBotoeiraVermelhaFrontalPins(config) {
    if (config === '2na') return ['13', '14', '23', '24'];
    if (config === '1na1nf') return ['13', '14', '21', '22'];
    return ['11', '12', '21', '22'];
}

function applyRealBotoeiraVermelhaFrontalConfig(comp, config) {
    if (!comp) return;
    const normalized = normalizeRealBotoeiraVermelhaFrontalConfig(config);
    comp.dataset.contactConfig = normalized;
    comp.dataset.botoeiraView = 'frontal';
    const pins = getRealBotoeiraVermelhaFrontalPins(normalized);
    Array.from(comp.querySelectorAll('.borne')).forEach((borne, index) => {
        borne.dataset.pino = pins[index] || borne.dataset.pino;
    });
    Array.from(comp.querySelectorAll('.pin-label')).forEach((label, index) => {
        const pin = pins[index] || label.innerText;
        label.dataset.pinLabel = pin;
        label.innerText = String(pin).slice(-1);
    });
}

function getRealBotoeiraVermelhaFrontalShorts(comp, pressionado) {
    const config = normalizeRealBotoeiraVermelhaFrontalConfig(comp?.dataset?.contactConfig);
    if (config === '2na') return pressionado ? [['13', '14'], ['23', '24']] : [];
    if (config === '1na1nf') return pressionado ? [['13', '14']] : [['21', '22']];
    return pressionado ? [] : [['11', '12'], ['21', '22']];
}
