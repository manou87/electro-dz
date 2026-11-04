(function () {
    'use strict';

    var LIB_KEY = 'real_transformador_comandos';
    var IMAGE_SRC = './componentes/real_transformador_comandos/trafo_comandos.webp';
    var PRIMARY_PINS = ['1', '2', '3', '4', '5'];
    var SECONDARY_PINS = ['6', '8', '7', '9'];
    var SOURCE_LINE_VOLTAGE = { 127: 220, 220: 380, 254: 440 };
    var DISPLAY_SCALE = 0.56;
    var DISPLAY_WIDTH = 280;
    var DISPLAY_HEIGHT = 291.2;

    function pinBorne(componentEl, pin) {
        return componentEl && componentEl.querySelector
            ? componentEl.querySelector('.borne[data-pino="' + pin + '"]')
            : null;
    }

    function pinNode(componentEl, pin) {
        var borne = pinBorne(componentEl, pin);
        return borne && borne._node ? borne._node : null;
    }

    function nodePhaseIds(node) {
        var ids = new Set();
        if (!node || !node.potenciais || !node.potenciais.forEach) return ids;
        node.potenciais.forEach(function (potential) {
            var value = String(potential || '').trim().toUpperCase();
            if (!value.startsWith('FASE:')) return;
            var id = value.slice(5).trim();
            if (id) ids.add(id);
        });
        return ids;
    }

    function nodeHasInputPotential(node) {
        if (!node || !node.potenciais) return false;
        return Array.from(node.potenciais).some(function (potential) {
            var value = String(potential || '').trim().toUpperCase();
            return value === 'FASE' || value === 'NEUTRO' || value.startsWith('FASE:');
        });
    }

    function distinctPhasePair(nodeA, nodeB) {
        if (!nodeA || !nodeB || nodeA === nodeB) return false;
        var idsA = Array.from(nodePhaseIds(nodeA));
        var idsB = Array.from(nodePhaseIds(nodeB));
        if (!idsA.length || !idsB.length) return false;
        return idsA.some(function (idA) {
            return idsB.some(function (idB) { return idA !== idB; });
        });
    }

    function configuredLineVoltage(nodeA, nodeB) {
        var ids = new Set(Array.from(nodePhaseIds(nodeA)).concat(Array.from(nodePhaseIds(nodeB))));
        if (ids.size < 2) return 0;
        var candidates = new Set();

        document.querySelectorAll('.component[data-lib="real_fonte_trifasica_nt"]').forEach(function (source) {
            var availablePins = new Set(['L1', 'L2', 'L3'].filter(function (pin) {
                return !!source.querySelector('.borne[data-pino="' + pin + '"]');
            }));
            if (!Array.from(ids).every(function (id) { return availablePins.has(id); })) return;
            var phaseVoltage = Number(source.dataset.phaseVoltage || 127);
            var lineVoltage = SOURCE_LINE_VOLTAGE[phaseVoltage];
            if (lineVoltage) candidates.add(lineVoltage);
        });
        return candidates.size === 1 ? Array.from(candidates)[0] : 0;
    }

    function sameNode(nodes, pinA, pinB) {
        return !!nodes[pinA] && nodes[pinA] === nodes[pinB];
    }

    function wireList() {
        if (Array.isArray(window.listaFios)) return window.listaFios;
        return [];
    }

    function wireDirectlyConnects(componentEl, pinA, pinB) {
        var borneA = pinBorne(componentEl, pinA);
        var borneB = pinBorne(componentEl, pinB);
        if (!borneA || !borneB) return false;
        return wireList().some(function (wire) {
            return (wire.origem === borneA && wire.destino === borneB) ||
                (wire.origem === borneB && wire.destino === borneA);
        });
    }

    function pinsBridged(componentEl, nodes, pinA, pinB) {
        return sameNode(nodes, pinA, pinB) || wireDirectlyConnects(componentEl, pinA, pinB);
    }

    function allDifferent(nodes) {
        var values = Object.keys(nodes).map(function (key) { return nodes[key]; });
        return values.every(function (node, index) {
            return !!node && values.indexOf(node) === index;
        });
    }

    function unusedPinIsSafe(nodes, pin, usedPins) {
        var node = nodes[pin];
        if (!node || nodeHasInputPotential(node)) return false;
        return usedPins.every(function (usedPin) { return node !== nodes[usedPin]; });
    }

    function assessPrimary(componentEl) {
        var nodes = {};
        PRIMARY_PINS.forEach(function (pin) { nodes[pin] = pinNode(componentEl, pin); });
        if (Object.keys(nodes).some(function (pin) { return !nodes[pin]; })) {
            return { active: false, voltage: 0 };
        }

        var configs = [
            {
                voltage: 220,
                input: ['1', '2'],
                matches: function () {
                    return pinsBridged(componentEl, nodes, '1', '3') &&
                        pinsBridged(componentEl, nodes, '2', '5') &&
                        nodes['1'] !== nodes['2'] &&
                        unusedPinIsSafe(nodes, '4', ['1', '2', '3', '5']);
                }
            },
            {
                voltage: 380,
                input: ['1', '4'],
                matches: function () {
                    return pinsBridged(componentEl, nodes, '2', '3') &&
                        allDifferent({ inputA: nodes['1'], bridge: nodes['2'], inputB: nodes['4'], unused: nodes['5'] }) &&
                        unusedPinIsSafe(nodes, '5', ['1', '2', '3', '4']);
                }
            },
            {
                voltage: 440,
                input: ['1', '5'],
                matches: function () {
                    return pinsBridged(componentEl, nodes, '2', '3') &&
                        allDifferent({ inputA: nodes['1'], bridge: nodes['2'], unused: nodes['4'], inputB: nodes['5'] }) &&
                        unusedPinIsSafe(nodes, '4', ['1', '2', '3', '5']);
                }
            }
        ];

        for (var index = 0; index < configs.length; index += 1) {
            var config = configs[index];
            if (!config.matches()) continue;
            var nodeA = nodes[config.input[0]];
            var nodeB = nodes[config.input[1]];
            if (!distinctPhasePair(nodeA, nodeB)) continue;
            var measuredLineVoltage = configuredLineVoltage(nodeA, nodeB);
            if (measuredLineVoltage && measuredLineVoltage !== config.voltage) continue;
            return { active: true, voltage: config.voltage };
        }
        return { active: false, voltage: 0 };
    }

    function assessSecondary(componentEl) {
        var nodes = {};
        SECONDARY_PINS.forEach(function (pin) { nodes[pin] = pinNode(componentEl, pin); });
        if (Object.keys(nodes).some(function (pin) { return !nodes[pin]; })) {
            return { voltage: 0, positive: [], negative: [] };
        }

        if (
            pinsBridged(componentEl, nodes, '6', '8') &&
            pinsBridged(componentEl, nodes, '7', '9') &&
            nodes['6'] !== nodes['7']
        ) {
            return { voltage: 12, positive: ['6', '8'], negative: ['7', '9'] };
        }
        if (
            pinsBridged(componentEl, nodes, '7', '8') &&
            nodes['6'] !== nodes['9'] &&
            nodes['6'] !== nodes['7'] &&
            nodes['9'] !== nodes['7']
        ) {
            return { voltage: 24, positive: ['6'], negative: ['9'] };
        }
        return { voltage: 0, positive: [], negative: [] };
    }

    function clearOutputPin(componentEl, pin) {
        var borne = pinBorne(componentEl, pin);
        if (!borne) return;
        delete borne.dataset.potential;
        delete borne.dataset.dcPotential;
        delete borne.dataset.transformerVoltage;
        delete borne.dataset.transformerPolarity;
    }

    function setOutputPin(componentEl, pin, potential, voltage, polarity, sourceAnchor) {
        var borne = pinBorne(componentEl, pin);
        if (!borne) return;
        // Um único borne representa a fonte de cada polo. Nos fechamentos em
        // paralelo, marcar os dois bornes como FASE criaria FASE:6 e FASE:8 no
        // mesmo nó, que o motor interpretaria incorretamente como curto bifásico.
        var isTwelveVoltOutput = Number(voltage) === 12;
        if (sourceAnchor && isTwelveVoltOutput) {
            borne.dataset.dcPotential = potential;
            delete borne.dataset.potential;
        } else if (sourceAnchor) {
            borne.dataset.potential = potential;
            delete borne.dataset.dcPotential;
        } else {
            delete borne.dataset.potential;
            delete borne.dataset.dcPotential;
        }
        borne.dataset.transformerVoltage = String(voltage);
        borne.dataset.transformerPolarity = polarity;
        if (borne._node && borne._node.potenciais && borne._node.potenciais.add) {
            borne._node.potenciais.add(potential);
            // Compatibilidade visual e elétrica com os consumidores existentes.
            // Estes marcadores vivem somente no ciclo atual; a fonte persistente
            // de 12 V continua sendo 12V/0V, sem criar identificadores de fase.
            if (isTwelveVoltOutput) {
                borne._node.potenciais.add(polarity === 'A' ? 'FASE' : 'NEUTRO');
            }
        }
    }

    function applyOutput(componentEl, enabled, primaryVoltage, secondary) {
        SECONDARY_PINS.forEach(function (pin) { clearOutputPin(componentEl, pin); });
        if (enabled && secondary.voltage) {
            var positivePotential = secondary.voltage === 12 ? '12V' : 'FASE';
            var negativePotential = secondary.voltage === 12 ? '0V' : 'NEUTRO';
            secondary.positive.forEach(function (pin, index) {
                setOutputPin(componentEl, pin, positivePotential, secondary.voltage, 'A', index === 0);
            });
            secondary.negative.forEach(function (pin, index) {
                setOutputPin(componentEl, pin, negativePotential, secondary.voltage, 'B', index === 0);
            });
        }
        componentEl.dataset.transformerOn = enabled && secondary.voltage ? '1' : '0';
        componentEl.dataset.transformerInputVoltage = enabled ? String(primaryVoltage || '') : '';
        componentEl.dataset.transformerOutputVoltage = enabled ? String(secondary.voltage || '') : '';
    }

    function borneHtml(pin, x, y, title, terminalSide) {
        var displayX = Math.round(x * DISPLAY_SCALE * 100) / 100;
        var displayY = Math.round(y * DISPLAY_SCALE * 100) / 100;
        return '<div class="borne" data-pino="' + pin + '" data-terminal-side="' + terminalSide + '" title="' + title +
            '" style="left:' + displayX + 'px;top:' + displayY + 'px;transform:translate(-50%,-50%);"></div>';
    }

    function html() {
        return [
            '<div style="width:' + DISPLAY_WIDTH + 'px;height:' + DISPLAY_HEIGHT + 'px;position:relative;">',
            '<img src="' + IMAGE_SRC + '" alt="Transformador de comandos" width="500" height="520" decoding="async" style="position:absolute;inset:0;width:' + DISPLAY_WIDTH + 'px;height:' + DISPLAY_HEIGHT + 'px;object-fit:contain;image-rendering:auto;pointer-events:none;user-select:none;">',
            borneHtml('1', 84, 148, 'Primário 1', 'left'),
            borneHtml('2', 84, 191, 'Primário 2', 'left'),
            borneHtml('3', 85, 240, 'Primário 3', 'left'),
            borneHtml('4', 85, 282, 'Primário 4', 'left'),
            borneHtml('5', 84, 325, 'Primário 5', 'left'),
            borneHtml('6', 406, 181, 'Secundário 6', 'right'),
            borneHtml('8', 408, 228, 'Secundário 8', 'right'),
            borneHtml('7', 408, 276, 'Secundário 7', 'right'),
            borneHtml('9', 409, 322, 'Secundário 9', 'right'),
            '</div>'
        ].join('');
    }

    window.COMPONENTES = window.COMPONENTES || {};
    window.BIBLIOTECA = window.BIBLIOTECA || window.COMPONENTES;
    window.COMPONENTES[LIB_KEY] = {
        cat: 'Comandos Realistas',
        nome: 'Transformador de comandos 220/380/440 V — 12/24 V',
        icone: 'fa-bolt',
        tipo: 'transformador',
        tagDefault: 'TC1',
        foto: IMAGE_SRC,
        html: html,
        behavior: function (inputs, estado, props, componentEl) {
            var primary = assessPrimary(componentEl);
            var secondary = assessSecondary(componentEl);
            var active = primary.active && secondary.voltage > 0;
            applyOutput(componentEl, active, primary.voltage, secondary);
            return {
                novoEstado: active,
                shorts: [],
                tipoVisual: active ? 'ativo-local' : ''
            };
        }
    };
})();
