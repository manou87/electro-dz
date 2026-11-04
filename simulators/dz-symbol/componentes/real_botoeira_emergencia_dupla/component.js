window.COMPONENTES['real_botoeira_emergencia_dupla'] = {
    cat: 'Componentes Reais',
    nome: 'Botoeira Emergência 2NF',
    icone: 'fa-octagon-exclamation',
    tipo: 'botao',
    tagDefault: 'S0',
    showTag: true,
    foto: './componentes/real_botoeira_emergencia_dupla/emerg_duplo_0.webp',
    html: () => `
        <div class="real-botoeira-emergencia-dupla-wrap" style="width:170px;height:190px;position:relative;left:6px;">
            <img
                class="real-botoeira-emergencia-dupla-img real-botoeira-emergencia-dupla-state-0"
                src="./componentes/real_botoeira_emergencia_dupla/emerg_duplo_0.webp"
                alt="Botoeira de emergência com 2 contatos NF em repouso"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <img
                class="real-botoeira-emergencia-dupla-img real-botoeira-emergencia-dupla-state-1"
                src="./componentes/real_botoeira_emergencia_dupla/emerg_duplo_1.webp"
                alt="Botoeira de emergência com 2 contatos NF acionada"
                style="width:100%;height:100%;object-fit:contain;pointer-events:none;"
            >
            <button
                type="button"
                class="toggle-state-btn real-botoeira-emergencia-dupla-toggle"
                title="Alternar botoeira de emergência 2NF"
                aria-label="Alternar botoeira de emergência 2NF"
            ></button>

            <div class="borne" data-pino="11" style="top:42px;left:18px;"></div>
            <div class="pin-label" data-pin-label="11" style="left:var(--real-botoeira-emergencia-dupla-label-11-x, 2px);top:var(--real-botoeira-emergencia-dupla-label-11-y, 20px);">11</div>
            <div class="borne" data-pino="12" style="bottom:42px;left:18px;"></div>
            <div class="pin-label" data-pin-label="12" style="left:var(--real-botoeira-emergencia-dupla-label-12-x, 2px);top:var(--real-botoeira-emergencia-dupla-label-12-y, 132px);">12</div>

            <div class="borne" data-pino="21" style="top:42px;left:44px;"></div>
            <div class="pin-label" data-pin-label="21" style="left:var(--real-botoeira-emergencia-dupla-label-21-x, 28px);top:var(--real-botoeira-emergencia-dupla-label-21-y, 20px);">21</div>
            <div class="borne" data-pino="22" style="bottom:42px;left:44px;"></div>
            <div class="pin-label" data-pin-label="22" style="left:var(--real-botoeira-emergencia-dupla-label-22-x, 28px);top:var(--real-botoeira-emergencia-dupla-label-22-y, 132px);">22</div>
        </div>
    `,
    behavior: (inputs, estado, props, comp) => {
        const acionada = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: acionada,
            shorts: acionada ? [] : [['11', '12'], ['21', '22']],
            tipoVisual: acionada ? 'ativo' : ''
        };
    }
};
