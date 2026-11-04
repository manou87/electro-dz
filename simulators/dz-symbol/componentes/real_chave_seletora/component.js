window.COMPONENTES['real_chave_seletora'] = {
    cat: 'Componentes Reais',
    nome: 'Chave Seletora',
    icone: 'fa-arrows-rotate',
    tipo: 'chave',
    tagDefault: 'S1',
    showTag: true,
    foto: './componentes/real_chave_seletora/chave_seletora_0.webp',
    html: () => `
        <div class="real-chave-seletora-wrap" style="width:220px;height:240px;position:relative;left:4px;">
            <img
                class="real-chave-seletora-img real-chave-seletora-state-0"
                src="./componentes/real_chave_seletora/chave_seletora_0.webp"
                alt="Chave seletora na posicao 0"
            >
            <img
                class="real-chave-seletora-img real-chave-seletora-state-1"
                src="./componentes/real_chave_seletora/chave_seletora_1.webp"
                alt="Chave seletora na posicao 1"
            >
            <button
                type="button"
                class="toggle-state-btn real-chave-seletora-toggle"
                title="Alternar chave seletora"
                aria-label="Alternar chave seletora"
            ></button>

            <div class="borne" data-pino="13" style="top:14px;left:28px;"></div>
            <div class="pin-label real-chave-seletora-label-13" data-pin-label="13">13</div>
            <div class="borne" data-pino="21" style="top:14px;left:92px;"></div>
            <div class="pin-label real-chave-seletora-label-21" data-pin-label="21">21</div>
            <div class="borne" data-pino="14" style="bottom:12px;left:28px;"></div>
            <div class="pin-label real-chave-seletora-label-14" data-pin-label="14">14</div>
            <div class="borne" data-pino="22" style="bottom:12px;left:92px;"></div>
            <div class="pin-label real-chave-seletora-label-22" data-pin-label="22">22</div>
        </div>
    `,
    onPlaced: (comp, context = {}) => {
        window.openRealChaveSeletoraConfigModal?.(comp, { skip: !!context.skipChaveSeletoraConfig });
    },
    onDoubleActivate: (comp) => {
        window.openRealChaveSeletoraConfigModal?.(comp);
        return true;
    },    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        const shorts = ligado ? [['13', '14']] : [['21', '22']];
        return {
            novoEstado: ligado,
            shorts,
            tipoVisual: ligado ? 'ativo' : ''
        };
    }
};


