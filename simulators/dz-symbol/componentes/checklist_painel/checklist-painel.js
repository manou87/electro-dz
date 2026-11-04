(function () {
    'use strict';

    var data = window.PAINEL_ELETRICO_CHECKLIST;
    if (!data || !Array.isArray(data.items) || !data.items.length) return;

    var simulatorSegment = String((document.body && document.body.dataset.simulatorSegment) || 'simulador');
    var STORAGE_KEY = 'simucir:' + simulatorSegment + ':checklist-painel:v1';
    var state = loadState();
    var itemViews = [];
    var lastFocusedElement = null;

    function isChecklistLanguageAvailable() {
        try {
            var lang = window.SimuDzI18n && typeof window.SimuDzI18n.getLanguage === 'function'
                ? window.SimuDzI18n.getLanguage()
                : 'pt-BR';
            return lang === 'pt-BR';
        } catch (error) {
            return true;
        }
    }

    function applyLanguageVisibility() {
        var available = isChecklistLanguageAvailable();
        var panel = document.getElementById('panel-checklist');
        var trigger = document.getElementById('panel-checklist-trigger');
        var backdrop = document.getElementById('panel-checklist-backdrop');

        if (!available) setOpen(false, { skipRestoreFocus: true });
        if (trigger) {
            trigger.hidden = !available;
            trigger.tabIndex = available ? 0 : -1;
            trigger.setAttribute('aria-hidden', String(!available));
            if (!available) trigger.setAttribute('aria-expanded', 'false');
        }
        if (panel) {
            panel.hidden = !available;
            if (!available) {
                panel.inert = true;
                panel.setAttribute('aria-hidden', 'true');
            }
        }
        if (backdrop) {
            backdrop.hidden = !available;
            if (!available) backdrop.classList.remove('is-open');
        }
    }

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (typeof text === 'string') node.textContent = text;
        return node;
    }

    function loadState() {
        try {
            var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
            return saved && typeof saved === 'object' ? saved : {};
        } catch (error) {
            return {};
        }
    }

    function saveState() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            // A checklist continua funcionando quando o armazenamento está indisponível.
        }
    }

    function childKey(itemIndex, childIndex) {
        return 'item-' + itemIndex + '-detail-' + childIndex;
    }

    function createTrigger() {
        var trigger = element('button', 'panel-checklist-trigger');
        trigger.type = 'button';
        trigger.id = 'panel-checklist-trigger';
        trigger.setAttribute('aria-controls', 'panel-checklist');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.title = 'Abrir checklist de apoio para o painel elétrico';

        var icon = element('span', 'panel-checklist-trigger__icon', '✓');
        icon.setAttribute('aria-hidden', 'true');
        var text = element('span', 'panel-checklist-trigger__text');
        text.appendChild(element('strong', '', 'Checklist'));
        text.appendChild(element('small', '', 'Painel elétrico'));
        var count = element('span', 'panel-checklist-trigger__count', '0/' + data.items.length);
        count.id = 'panel-checklist-trigger-count';
        text.appendChild(count);

        trigger.appendChild(icon);
        trigger.appendChild(text);
        return trigger;
    }

    function createPanel() {
        var panel = element('aside', 'panel-checklist');
        panel.id = 'panel-checklist';
        panel.setAttribute('aria-labelledby', 'panel-checklist-title');
        panel.setAttribute('aria-hidden', 'true');
        panel.inert = true;

        var header = element('header', 'panel-checklist__header');
        var titleRow = element('div', 'panel-checklist__title-row');
        var heading = element('div', 'panel-checklist__heading');
        var title = element('h2', '', data.title);
        title.id = 'panel-checklist-title';
        heading.appendChild(title);
        heading.appendChild(element('p', '', data.subtitle));

        var close = element('button', 'panel-checklist__close', '×');
        close.type = 'button';
        close.id = 'panel-checklist-close';
        close.setAttribute('aria-label', 'Fechar checklist');
        titleRow.appendChild(heading);
        titleRow.appendChild(close);
        header.appendChild(titleRow);

        var progressRow = element('div', 'panel-checklist__progress-row');
        progressRow.appendChild(element('span', '', 'Progresso dos tópicos'));
        var progressText = element('strong', '', '0 de ' + data.items.length);
        progressText.id = 'panel-checklist-progress-text';
        progressRow.appendChild(progressText);
        header.appendChild(progressRow);

        var progress = element('div', 'panel-checklist__progress');
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-label', 'Progresso da checklist');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', String(data.items.length));
        progress.setAttribute('aria-valuenow', '0');
        var progressFill = element('span');
        progressFill.id = 'panel-checklist-progress-fill';
        progress.appendChild(progressFill);
        header.appendChild(progress);

        var search = element('input', 'panel-checklist__search');
        search.type = 'search';
        search.id = 'panel-checklist-search';
        search.placeholder = 'Buscar item ou detalhe...';
        search.setAttribute('aria-label', 'Buscar na checklist');
        search.autocomplete = 'off';
        header.appendChild(search);

        var tools = element('div', 'panel-checklist__tools');
        var expand = element('button', 'panel-checklist__tool', 'Abrir todos');
        expand.type = 'button';
        expand.id = 'panel-checklist-expand';
        var collapse = element('button', 'panel-checklist__tool', 'Fechar todos');
        collapse.type = 'button';
        collapse.id = 'panel-checklist-collapse';
        var reset = element('button', 'panel-checklist__tool', 'Limpar marcações');
        reset.type = 'button';
        reset.id = 'panel-checklist-reset';
        tools.appendChild(expand);
        tools.appendChild(collapse);
        tools.appendChild(reset);
        header.appendChild(tools);
        panel.appendChild(header);

        var body = element('div', 'panel-checklist__body');
        body.appendChild(element('p', 'panel-checklist__notice', data.notice));
        var tree = element('div', 'panel-checklist__tree');
        tree.id = 'panel-checklist-tree';
        tree.setAttribute('role', 'tree');
        data.items.forEach(function (item, itemIndex) {
            tree.appendChild(createTreeItem(item, itemIndex));
        });
        body.appendChild(tree);

        var empty = element('p', 'panel-checklist__empty', 'Nenhum item encontrado.');
        empty.id = 'panel-checklist-empty';
        empty.hidden = true;
        body.appendChild(empty);
        body.appendChild(createReference());
        panel.appendChild(body);
        return panel;
    }

    function createTreeItem(item, itemIndex) {
        var details = element('details', 'panel-checklist__item');
        details.setAttribute('role', 'treeitem');
        details.dataset.search = [item.title]
            .concat(item.details)
            .concat(item.references || [])
            .join(' ')
            .toLocaleLowerCase('pt-BR');

        var summary = element('summary', 'panel-checklist__summary');
        var parentCheckbox = element('input', 'panel-checklist__checkbox');
        parentCheckbox.type = 'checkbox';
        parentCheckbox.setAttribute('aria-label', 'Marcar tópico ' + (itemIndex + 1) + ': ' + item.title);
        var name = element('span', 'panel-checklist__name', (itemIndex + 1) + '. ' + item.title);
        summary.appendChild(parentCheckbox);
        summary.appendChild(name);
        if (item.badge) summary.appendChild(element('span', 'panel-checklist__badge', item.badge));
        else summary.appendChild(element('span'));
        details.appendChild(summary);

        var children = element('div', 'panel-checklist__children');
        children.setAttribute('role', 'group');
        var childCheckboxes = [];
        item.details.forEach(function (detailText, childIndex) {
            var label = element('label', 'panel-checklist__child');
            var checkbox = element('input', 'panel-checklist__child-checkbox');
            checkbox.type = 'checkbox';
            checkbox.checked = state[childKey(itemIndex, childIndex)] === true;
            checkbox.setAttribute('aria-label', detailText);
            label.appendChild(checkbox);
            label.appendChild(element('span', '', detailText));
            children.appendChild(label);
            childCheckboxes.push(checkbox);
            checkbox.addEventListener('change', function () {
                state[childKey(itemIndex, childIndex)] = checkbox.checked;
                saveState();
                syncItem(itemViews[itemIndex]);
                updateProgress();
            });
        });
        details.appendChild(children);

        var references = element('div', 'panel-checklist__references');
        references.appendChild(element('strong', '', 'Referências normativas'));
        var referenceList = element('ul');
        (item.references || []).forEach(function (referenceText) {
            referenceList.appendChild(element('li', '', referenceText));
        });
        references.appendChild(referenceList);
        details.appendChild(references);

        var view = { details: details, parent: parentCheckbox, children: childCheckboxes };
        itemViews[itemIndex] = view;
        parentCheckbox.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        parentCheckbox.addEventListener('change', function () {
            childCheckboxes.forEach(function (checkbox, childIndex) {
                checkbox.checked = parentCheckbox.checked;
                state[childKey(itemIndex, childIndex)] = parentCheckbox.checked;
            });
            saveState();
            syncItem(view);
            updateProgress();
        });
        syncItem(view);
        return details;
    }

    function createReference() {
        var reference = element('details', 'panel-checklist__reference');
        var summary = element('summary', 'panel-checklist__summary');
        summary.appendChild(element('span', 'panel-checklist__reference-icon', '☷'));
        summary.appendChild(element('span', 'panel-checklist__name', 'Referência: arquitetura típica'));
        reference.appendChild(summary);
        var list = element('ul');
        data.architecture.forEach(function (text) {
            list.appendChild(element('li', '', text));
        });
        reference.appendChild(list);
        return reference;
    }

    function syncItem(view) {
        if (!view) return;
        var checked = view.children.filter(function (checkbox) { return checkbox.checked; }).length;
        view.parent.checked = checked === view.children.length;
        view.parent.indeterminate = checked > 0 && checked < view.children.length;
        view.details.classList.toggle('is-complete', checked === view.children.length);
    }

    function updateProgress() {
        var completed = itemViews.filter(function (view) { return view.parent.checked; }).length;
        var percent = Math.round((completed / data.items.length) * 100);
        var progressText = document.getElementById('panel-checklist-progress-text');
        var progressFill = document.getElementById('panel-checklist-progress-fill');
        var progress = progressFill && progressFill.parentElement;
        var triggerCount = document.getElementById('panel-checklist-trigger-count');
        if (progressText) progressText.textContent = completed + ' de ' + data.items.length + ' (' + percent + '%)';
        if (progressFill) progressFill.style.width = percent + '%';
        if (progress) progress.setAttribute('aria-valuenow', String(completed));
        if (triggerCount) triggerCount.textContent = completed + '/' + data.items.length;
    }

    function setOpen(open, options) {
        options = options || {};
        if (open && !isChecklistLanguageAvailable()) return;
        var panel = document.getElementById('panel-checklist');
        var trigger = document.getElementById('panel-checklist-trigger');
        var backdrop = document.getElementById('panel-checklist-backdrop');
        if (!panel || !trigger) return;

        panel.classList.toggle('is-open', open);
        panel.setAttribute('aria-hidden', String(!open));
        panel.inert = !open;
        trigger.setAttribute('aria-expanded', String(open));
        if (backdrop) backdrop.classList.toggle('is-open', open);

        if (open) {
            lastFocusedElement = document.activeElement;
            window.setTimeout(function () {
                var search = document.getElementById('panel-checklist-search');
                if (search) search.focus();
            }, 30);
        } else if (!options.skipRestoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }

    function filterItems(query) {
        var normalized = String(query || '').trim().toLocaleLowerCase('pt-BR');
        var visible = 0;
        itemViews.forEach(function (view) {
            var matches = !normalized || view.details.dataset.search.indexOf(normalized) !== -1;
            view.details.hidden = !matches;
            if (matches) {
                visible += 1;
                if (normalized) view.details.open = true;
            }
        });
        var empty = document.getElementById('panel-checklist-empty');
        if (empty) empty.hidden = visible !== 0;
    }

    function protectSimulatorEvents(node) {
        ['pointerdown', 'mousedown', 'touchstart', 'click', 'dblclick', 'contextmenu', 'wheel'].forEach(function (eventName) {
            node.addEventListener(eventName, function (event) {
                event.stopPropagation();
            });
        });
    }

    function init() {
        if (document.getElementById('panel-checklist')) return;
        var trigger = createTrigger();
        var backdrop = element('button', 'panel-checklist-backdrop');
        backdrop.type = 'button';
        backdrop.id = 'panel-checklist-backdrop';
        backdrop.tabIndex = -1;
        backdrop.setAttribute('aria-label', 'Fechar checklist');
        var panel = createPanel();

        var triggerHost = document.getElementById('viewport') || document.querySelector('.main-content') || document.body;
        triggerHost.appendChild(trigger);
        document.body.appendChild(backdrop);
        document.body.appendChild(panel);
        protectSimulatorEvents(trigger);
        protectSimulatorEvents(panel);
        protectSimulatorEvents(backdrop);

        trigger.addEventListener('click', function () { setOpen(true); });
        backdrop.addEventListener('click', function () { setOpen(false); });
        document.getElementById('panel-checklist-close').addEventListener('click', function () { setOpen(false); });
        document.getElementById('panel-checklist-search').addEventListener('input', function (event) {
            filterItems(event.target.value);
        });
        document.getElementById('panel-checklist-expand').addEventListener('click', function () {
            itemViews.forEach(function (view) { if (!view.details.hidden) view.details.open = true; });
        });
        document.getElementById('panel-checklist-collapse').addEventListener('click', function () {
            itemViews.forEach(function (view) { view.details.open = false; });
        });
        document.getElementById('panel-checklist-reset').addEventListener('click', function () {
            if (!window.confirm('Limpar todas as marcações desta checklist?')) return;
            state = {};
            itemViews.forEach(function (view) {
                view.children.forEach(function (checkbox) { checkbox.checked = false; });
                syncItem(view);
            });
            saveState();
            updateProgress();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
        });
        updateProgress();
        applyLanguageVisibility();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    window.addEventListener('simucir:languagechange', applyLanguageVisibility);
})();
