(function () {
    const VIEW_OPTIONS = [
        { value: 'lateral', label: 'Lateral' },
        { value: 'frontal', label: 'Frontal' }
    ];
    const CONTACT_OPTIONS = [
        { value: '2na', label: '2 NA' },
        { value: '2nf', label: '2 NF' },
        { value: '1na1nf', label: '1 NA + 1 NF' }
    ];

    function normalizeContactConfig(value, fallback = '2na') {
        const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
        return CONTACT_OPTIONS.some(option => option.value === text) ? text : fallback;
    }

    function normalizeView(value) {
        return String(value || '').trim().toLowerCase() === 'frontal' ? 'frontal' : 'lateral';
    }

    function createButton(text, className) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        return button;
    }

    function buildSegmentedControl(options, selectedValue, onChange) {
        const group = document.createElement('div');
        group.className = 'real-botoeira-config-segment';
        options.forEach(option => {
            const button = createButton(option.label, 'real-botoeira-config-choice');
            button.dataset.value = option.value;
            button.setAttribute('aria-pressed', option.value === selectedValue ? 'true' : 'false');
            button.addEventListener('click', () => {
                Array.from(group.children).forEach(child => child.setAttribute('aria-pressed', 'false'));
                button.setAttribute('aria-pressed', 'true');
                onChange(option.value);
            });
            group.appendChild(button);
        });
        return group;
    }

    function applyLateralSelection(comp, context) {
        if (!comp) return;
        if (context?.lateralLib && comp.dataset.lib !== context.lateralLib && typeof window.adicionarComponente === 'function') {
            const lateral = window.adicionarComponente(context.lateralLib, null, comp.style.top, comp.style.left, {
                highlightOnCreate: true,
                ensureVisibleOnCreate: false,
                autoWireOnCreate: false,
                allowOutOfMode: true,
                skipBotoeiraConfig: true
            });
            if (lateral) {
                lateral.dataset.tag = comp.dataset.tag || lateral.dataset.tag || context.tagDefault || 'S1';
                lateral.dataset.botoeiraView = 'lateral';
                const label = lateral.querySelector('.tag-label');
                if (label) label.innerText = lateral.dataset.tag;
                comp.remove();
                return;
            }
        }
        comp.dataset.botoeiraView = 'lateral';
        if (context?.defaultContactConfig) {
            comp.dataset.contactConfig = normalizeContactConfig(context.defaultContactConfig, context.defaultContactConfig);
        }
    }

    function applyFrontalSelection(comp, context, contactConfig) {
        if (!comp || !context?.frontalLib || typeof window.adicionarComponente !== 'function') return;
        const nova = window.adicionarComponente(context.frontalLib, null, comp.style.top, comp.style.left, {
            highlightOnCreate: true,
            ensureVisibleOnCreate: false,
            autoWireOnCreate: false,
            allowOutOfMode: true,
            skipBotoeiraConfig: true
        });
        if (!nova) return;
        nova.dataset.tag = comp.dataset.tag || nova.dataset.tag || context.tagDefault || 'S1';
        nova.dataset.botoeiraView = 'frontal';
        nova.dataset.contactConfig = normalizeContactConfig(contactConfig, context.defaultContactConfig || '2na');
        const label = nova.querySelector('.tag-label');
        if (label) label.innerText = nova.dataset.tag;
        const def = window.BIBLIOTECA?.[nova.dataset.lib] || window.COMPONENTES?.[nova.dataset.lib];
        if (def && typeof def.importData === 'function') {
            def.importData(nova, { contactConfig: nova.dataset.contactConfig }, { source: 'botoeira_config_modal' });
        }
        comp.remove();
    }

    window.openRealBotoeiraConfigModal = function openRealBotoeiraConfigModal(comp, context = {}) {
        if (!comp || context.skip || comp.dataset.skipBotoeiraConfig === 'true') return;
        let selectedView = normalizeView(comp.dataset.botoeiraView || context.defaultView || 'lateral');
        let selectedContact = normalizeContactConfig(comp.dataset.contactConfig, context.defaultContactConfig || '2na');

        const backdrop = document.createElement('div');
        backdrop.className = 'real-botoeira-config-backdrop';

        const panel = document.createElement('div');
        panel.className = 'real-botoeira-config-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');

        const title = document.createElement('h2');
        title.textContent = context.title || 'Configurar botoeira';
        panel.appendChild(title);

        const viewLabel = document.createElement('label');
        viewLabel.textContent = 'Visao';
        panel.appendChild(viewLabel);
        panel.appendChild(buildSegmentedControl(VIEW_OPTIONS, selectedView, value => {
            selectedView = value;
            panel.dataset.view = selectedView;
        }));

        const contactSection = document.createElement('div');
        contactSection.className = 'real-botoeira-config-contact';
        const contactLabel = document.createElement('label');
        contactLabel.textContent = 'Contatos';
        contactSection.appendChild(contactLabel);
        contactSection.appendChild(buildSegmentedControl(CONTACT_OPTIONS, selectedContact, value => {
            selectedContact = value;
        }));
        panel.appendChild(contactSection);
        panel.dataset.view = selectedView;

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
            if (event.key === 'Escape') {
                applyLateralSelection(comp, context);
                close();
            }
        };

        cancel.addEventListener('click', () => {
            applyLateralSelection(comp, context);
            close();
        });
        apply.addEventListener('click', () => {
            if (selectedView === 'frontal') applyFrontalSelection(comp, context, selectedContact);
            else applyLateralSelection(comp, context);
            if (typeof window.scheduleHistoryCheckpoint === 'function') {
                window.scheduleHistoryCheckpoint('real_botoeira_config');
            }
            close();
        });

        document.addEventListener('keydown', onKeyDown, true);
        document.body.appendChild(backdrop);
        apply.focus();
    };
})();
