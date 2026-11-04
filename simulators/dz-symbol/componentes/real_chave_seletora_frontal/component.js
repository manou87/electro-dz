(function () {
    function createButton(text, className) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        return button;
    }

    function openRealChaveSeletoraConfigModal(comp, context = {}) {
        if (!comp || context.skip) return;
        let selectedView = comp.dataset.chaveView === 'frontal' ? 'frontal' : 'lateral';

        const backdrop = document.createElement('div');
        backdrop.className = 'real-botoeira-config-backdrop';
        const panel = document.createElement('div');
        panel.className = 'real-botoeira-config-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.dataset.view = selectedView;

        const title = document.createElement('h2');
        title.textContent = 'Configurar chave seletora';
        panel.appendChild(title);

        const label = document.createElement('label');
        label.textContent = 'Visao';
        panel.appendChild(label);

        const choices = document.createElement('div');
        choices.className = 'real-botoeira-config-segment';
        [
            { value: 'lateral', label: 'Lateral' },
            { value: 'frontal', label: 'Frontal' }
        ].forEach(option => {
            const choice = createButton(option.label, 'real-botoeira-config-choice');
            choice.dataset.value = option.value;
            choice.setAttribute('aria-pressed', option.value === selectedView ? 'true' : 'false');
            choice.addEventListener('click', () => {
                selectedView = option.value;
                panel.dataset.view = selectedView;
                Array.from(choices.children).forEach(child => child.setAttribute('aria-pressed', 'false'));
                choice.setAttribute('aria-pressed', 'true');
            });
            choices.appendChild(choice);
        });
        panel.appendChild(choices);

        const actions = document.createElement('div');
        actions.className = 'real-botoeira-config-actions';
        const cancel = createButton('Cancelar', 'real-botoeira-config-cancel');
        const apply = createButton('Aplicar', 'real-botoeira-config-apply');
        actions.append(cancel, apply);
        panel.appendChild(actions);
        backdrop.appendChild(panel);

        const close = () => {
            if (backdrop.isConnected) backdrop.remove();
            document.removeEventListener('keydown', onKeyDown, true);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') close();
        };

        cancel.addEventListener('click', close);
        apply.addEventListener('click', () => {
            if (selectedView === 'frontal' && comp.dataset.lib !== 'real_chave_seletora_frontal') {
                const nova = window.adicionarComponente?.('real_chave_seletora_frontal', null, comp.style.top, comp.style.left, {
                    highlightOnCreate: true,
                    ensureVisibleOnCreate: false,
                    autoWireOnCreate: false,
                    allowOutOfMode: true,
                    skipChaveSeletoraConfig: true
                });
                if (nova) {
                    nova.dataset.tag = comp.dataset.tag || nova.dataset.tag || 'S1';
                    nova.dataset.chaveView = 'frontal';
                    const tag = nova.querySelector('.tag-label');
                    if (tag) tag.innerText = nova.dataset.tag;
                    comp.remove();
                }
            } else if (selectedView === 'lateral' && comp.dataset.lib === 'real_chave_seletora_frontal') {
                const lateral = window.adicionarComponente?.('real_chave_seletora', null, comp.style.top, comp.style.left, {
                    highlightOnCreate: true,
                    ensureVisibleOnCreate: false,
                    autoWireOnCreate: false,
                    allowOutOfMode: true,
                    skipChaveSeletoraConfig: true
                });
                if (lateral) {
                    lateral.dataset.tag = comp.dataset.tag || lateral.dataset.tag || 'S1';
                    lateral.dataset.chaveView = 'lateral';
                    const tag = lateral.querySelector('.tag-label');
                    if (tag) tag.innerText = lateral.dataset.tag;
                    comp.remove();
                }
            } else {
                comp.dataset.chaveView = selectedView;
            }
            if (typeof window.scheduleHistoryCheckpoint === 'function') {
                window.scheduleHistoryCheckpoint('real_chave_seletora_config');
            }
            close();
        });

        document.addEventListener('keydown', onKeyDown, true);
        document.body.appendChild(backdrop);
        apply.focus();
    }

    window.openRealChaveSeletoraConfigModal = openRealChaveSeletoraConfigModal;
})();

window.COMPONENTES['real_chave_seletora_frontal'] = {
    cat: 'Componentes Reais',
    nome: 'Chave Seletora Frontal',
    icone: 'fa-arrows-rotate',
    tipo: 'chave',
    tagDefault: 'S1',
    showTag: true,
    hiddenInMenu: true,
    foto: './componentes/real_chave_seletora_frontal/ch_seletora_0_graus.webp',
    html: () => `
        <div class="real-chave-seletora-frontal-wrap">
            <img class="real-chave-seletora-frontal-base" src="./componentes/real_chave_seletora_frontal/base_frente.webp" alt="Base frontal da chave seletora">
            <img class="real-chave-seletora-frontal-knob real-chave-seletora-frontal-state-0" src="./componentes/real_chave_seletora_frontal/ch_seletora_0_graus.webp" alt="Chave seletora frontal em 0 graus">
            <img class="real-chave-seletora-frontal-knob real-chave-seletora-frontal-state-1" src="./componentes/real_chave_seletora_frontal/ch_seletora_90_graus.webp" alt="Chave seletora frontal em 90 graus">
            <button type="button" class="toggle-state-btn real-chave-seletora-frontal-toggle" title="Alternar chave seletora frontal" aria-label="Alternar chave seletora frontal"></button>

            <div class="borne" data-pino="13" style="top:6px;left:20px;"></div>
            <div class="pin-label real-chave-seletora-frontal-label real-chave-seletora-frontal-label-13" data-pin-label="13">3</div>
            <div class="borne" data-pino="14" style="bottom:6px;left:20px;"></div>
            <div class="pin-label real-chave-seletora-frontal-label real-chave-seletora-frontal-label-14" data-pin-label="14">4</div>
            <div class="borne" data-pino="21" style="top:6px;right:20px;"></div>
            <div class="pin-label real-chave-seletora-frontal-label real-chave-seletora-frontal-label-21" data-pin-label="21">1</div>
            <div class="borne" data-pino="22" style="bottom:6px;right:20px;"></div>
            <div class="pin-label real-chave-seletora-frontal-label real-chave-seletora-frontal-label-22" data-pin-label="22">2</div>
        </div>
    `,
    onDoubleActivate: (comp) => {
        window.openRealChaveSeletoraConfigModal?.(comp);
        return true;
    },
    behavior: (inputs, estado, props, comp) => {
        const ligado = comp?.dataset?.manualOn === 'true';
        return {
            novoEstado: ligado,
            shorts: ligado ? [['13', '14']] : [['21', '22']],
            tipoVisual: ligado ? 'ativo' : ''
        };
    }
};
