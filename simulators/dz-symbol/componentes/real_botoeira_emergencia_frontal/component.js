window.COMPONENTES['real_botoeira_emergencia_frontal'] = {
    cat: 'Componentes Reais',
    nome: 'Emergencia Frontal',
    icone: 'fa-circle-exclamation',
    tipo: 'botao',
    tagDefault: 'S0',
    showTag: true,
    hiddenInMenu: true,
    foto: './componentes/real_botoeira_emergencia_frontal/emergencia_0.webp',
    html: () => `
        <div class="real-botoeira-frontal-wrap">
            <img class="real-botoeira-frontal-base" src="./componentes/real_botoeira_emergencia_frontal/base_frente.webp" alt="Base frontal da botoeira de emergencia">
            <img class="real-botoeira-frontal-btn real-botoeira-emergencia-frontal-state-0" src="./componentes/real_botoeira_emergencia_frontal/emergencia_0.webp" alt="Emergencia frontal normal">
            <img class="real-botoeira-frontal-btn real-botoeira-emergencia-frontal-state-1" src="./componentes/real_botoeira_emergencia_frontal/emergencia_1.webp" alt="Emergencia frontal acionada">
            <button type="button" class="toggle-state-btn real-botoeira-frontal-toggle" title="Alternar emergencia frontal" aria-label="Alternar emergencia frontal"></button>
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
            frontalLib: 'real_botoeira_emergencia_frontal',
            lateralLib: 'real_botoeira_emergencia',
            title: 'Configurar botoeira de emergencia',
            defaultView: 'frontal',
            defaultContactConfig: '2nf',
            tagDefault: 'S0'
        });
        return true;
    },
    exportData: (comp) => ({ contactConfig: normalizeRealBotoeiraEmergenciaFrontalConfig(comp?.dataset?.contactConfig) }),
    importData: (comp, payload) => applyRealBotoeiraEmergenciaFrontalConfig(comp, normalizeRealBotoeiraEmergenciaFrontalConfig(payload?.contactConfig)),
    behavior: (inputs, estado, props, comp) => {
        const acionada = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: acionada,
            shorts: getRealBotoeiraEmergenciaFrontalShorts(comp, acionada),
            tipoVisual: acionada ? 'ativo' : ''
        };
    }
};

function normalizeRealBotoeiraEmergenciaFrontalConfig(value) {
    const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    return ['2na', '2nf', '1na1nf'].includes(text) ? text : '2nf';
}

function getRealBotoeiraEmergenciaFrontalPins(config) {
    if (config === '2na') return ['13', '14', '23', '24'];
    if (config === '1na1nf') return ['13', '14', '21', '22'];
    return ['11', '12', '21', '22'];
}

function applyRealBotoeiraEmergenciaFrontalConfig(comp, config) {
    if (!comp) return;
    const normalized = normalizeRealBotoeiraEmergenciaFrontalConfig(config);
    comp.dataset.contactConfig = normalized;
    comp.dataset.botoeiraView = 'frontal';
    const pins = getRealBotoeiraEmergenciaFrontalPins(normalized);
    Array.from(comp.querySelectorAll('.borne')).forEach((borne, index) => {
        borne.dataset.pino = pins[index] || borne.dataset.pino;
    });
    Array.from(comp.querySelectorAll('.pin-label')).forEach((label, index) => {
        const pin = pins[index] || label.innerText;
        label.dataset.pinLabel = pin;
        label.innerText = String(pin).slice(-1);
    });
}

function getRealBotoeiraEmergenciaFrontalShorts(comp, acionada) {
    const config = normalizeRealBotoeiraEmergenciaFrontalConfig(comp?.dataset?.contactConfig);
    if (config === '2na') return acionada ? [['13', '14'], ['23', '24']] : [];
    if (config === '1na1nf') return acionada ? [['13', '14']] : [['21', '22']];
    return acionada ? [] : [['11', '12'], ['21', '22']];
}
