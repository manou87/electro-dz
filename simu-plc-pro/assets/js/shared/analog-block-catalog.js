(function (global) {
  'use strict';

  if (global.SimuPLCAnalogCatalog) return;

  const TYPES = Object.freeze({
    CONST: 'analog_constant',
    INPUT: 'analog_input',
    SCALE: 'scale',
    GT: 'gt',
    LT: 'lt',
    EQ: 'eq',
    GTE: 'gte',
    LTE: 'lte',
    HYST: 'hyst',
    PWM: 'pwm_output',
    AO: 'analog_output',
    PID: 'pid',
    SPLIT: 'split_range'
  });

  const RAW_DEFINITIONS = [
    {
      type: TYPES.CONST,
      symbol: 'CONST',
      name: 'Constante analogique',
      shortName: 'Constante',
      family: 'source',
      inputType: null,
      outputType: 'analog',
      description: 'Fournit une valeur analogique fixe interne pour comparateurs, mise à l’échelle, PWM, AO et futures consignes PID.',
      aliases: ['const', 'constant', 'analog_constant', 'constante', 'constante_analogica', 'constante analogique'],
      editors: { fbd: true, ladder: true },
      defaults: { value: 50, unit: '', decimals: 1 }
    },
    {
      type: TYPES.INPUT,
      symbol: 'AI',
      name: 'Entrée analogique',
      shortName: 'Entrée analogique',
      family: 'source',
      inputType: null,
      outputType: 'analog',
      description: 'Lit ou simule un signal analogique et peut le fournir en valeur RAW ou en unité d’ingénierie.',
      aliases: ['ai', 'analog-input', 'analoginput', 'entrada_analogica', 'entrée analogique'],
      editors: { fbd: true, ladder: true },
      defaults: { rawMin: 0, rawMax: 4095, engMin: 0, engMax: 100, rawValue: 0, unit: '%', decimals: 1, clamp: true }
    },
    {
      type: TYPES.SCALE,
      symbol: 'SCALE',
      name: 'Escalamiento',
      shortName: 'Escalamiento',
      family: 'processing',
      inputType: 'analog',
      outputType: 'analog',
      description: 'Convertit un signal d’une plage d’entrée vers une autre plage de sortie.',
      aliases: ['scaler', 'escalar', 'escalamiento'],
      editors: { fbd: true, ladder: true },
      defaults: { inMin: 0, inMax: 100, outMin: 0, outMax: 100, unit: '', decimals: 1, clamp: true }
    },
    {
      type: TYPES.GT,
      symbol: '>',
      name: 'Supérieur à',
      shortName: 'Supérieur à',
      family: 'comparator',
      inputType: 'analog',
      outputType: 'digital',
      description: 'Active sa sortie quand le signal analogique est supérieur à la valeur configurée.',
      aliases: ['greater-than', 'greater_than', 'mayor'],
      editors: { fbd: true, ladder: true },
      defaults: { threshold: 50, unit: '', decimals: 1 }
    },
    {
      type: TYPES.LT,
      symbol: '<',
      name: 'Inférieur à',
      shortName: 'Inférieur à',
      family: 'comparator',
      inputType: 'analog',
      outputType: 'digital',
      description: 'Active sa sortie quand le signal analogique est inférieur à la valeur configurée.',
      aliases: ['less-than', 'less_than', 'menor'],
      editors: { fbd: true, ladder: true },
      defaults: { threshold: 50, unit: '', decimals: 1 }
    },
    {
      type: TYPES.EQ,
      symbol: '=',
      name: 'Égal à',
      shortName: 'Égal à',
      family: 'comparator',
      inputType: 'analog',
      outputType: 'digital',
      description: 'Active sa sortie quand le signal se trouve dans la tolérance de la valeur configurée.',
      aliases: ['equal', 'equal-to', 'igual'],
      editors: { fbd: true, ladder: true },
      defaults: { threshold: 50, tolerance: 0.1, unit: '', decimals: 1 }
    },
    {
      type: TYPES.GTE,
      symbol: '≥',
      name: 'Supérieur ou égal',
      shortName: 'Supérieur ou égal',
      family: 'comparator',
      inputType: 'analog',
      outputType: 'digital',
      description: 'Active sa sortie quand le signal analogique est supérieur ou égal à la valeur configurée.',
      aliases: ['greater-or-equal', 'greater_equal', 'mayor_igual', '>='],
      editors: { fbd: true, ladder: true },
      defaults: { threshold: 50, unit: '', decimals: 1 }
    },
    {
      type: TYPES.LTE,
      symbol: '≤',
      name: 'Inférieur ou égal',
      shortName: 'Inférieur ou égal',
      family: 'comparator',
      inputType: 'analog',
      outputType: 'digital',
      description: 'Active sa sortie quand le signal analogique est inférieur ou égal à la valeur configurée.',
      aliases: ['less-or-equal', 'less_equal', 'menor_igual', '<='],
      editors: { fbd: true, ladder: true },
      defaults: { threshold: 50, unit: '', decimals: 1 }
    },
    {
      type: TYPES.HYST,
      symbol: 'HYS',
      name: 'Hystérésis',
      shortName: 'Hystérésis',
      family: 'comparator',
      inputType: 'analog',
      outputType: 'digital',
      description: 'Utilise un seuil d’allumage et un autre d’extinction pour éviter les commutations rapides.',
      aliases: ['hys', 'hysteresis', 'histeresis', 'histéresis'],
      editors: { fbd: true, ladder: true },
      defaults: { low: 40, high: 60, unit: '', decimals: 1, hystState: 0 }
    },
    {
      type: TYPES.PID,
      symbol: 'PID',
      name: 'Régulateur PID',
      shortName: 'PID',
      family: 'processing',
      inputType: 'analog',
      outputType: 'analog',
      description: 'Compare PV avec SP et calcule une sortie analogique avec action proportionnelle, intégrale et dérivée.',
      aliases: ['pid', 'pid_controller', 'controlador_pid', 'controlador pid'],
      editors: { fbd: true, ladder: true },
      defaults: { kp: 2, ki: 0.5, kd: 0.1, sampleMs: 100, outMin: 0, outMax: 100, mode: 'auto', manualOutput: 0, direction: 'heating', unit: '%', decimals: 1 }
    },
    {
      type: TYPES.SPLIT,
      symbol: 'SPLIT',
      name: 'Commande bidirectionnelle / Split Range',
      shortName: 'Split Range',
      family: 'processing',
      inputType: 'analog',
      outputType: 'analog',
      outputCount: 2,
      outputRoles: ['LLENAR', 'VACIAR'],
      description: 'Divise une sortie analogique autour d’un point neutre : une sortie proportionnelle pour remplir/avancer et une autre pour vider/reculer, avec zone morte et verrouillage.',
      aliases: ['split', 'split-range', 'split_range', 'rango_dividido', 'control_bidireccional', 'control bidireccional'],
      editors: { fbd: true, ladder: true },
      defaults: { inMin: 0, inMax: 100, neutral: 50, deadband: 2, outMax: 100, unit: '%', decimals: 1, clamp: true }
    },
    {
      type: TYPES.PWM,
      symbol: 'PWM',
      name: 'Sortie PWM',
      shortName: 'Sortie PWM',
      family: 'output',
      inputType: 'analog',
      outputType: null,
      description: 'Convertit un signal analogique en rapport cyclique PWM pour vitesse, éclairage ou puissance.',
      aliases: ['pwm', 'pwm_output', 'salida_pwm', 'salida pwm'],
      editors: { fbd: true, ladder: true },
      defaults: { inMin: 0, inMax: 100, unit: '%', decimals: 1, clamp: true, frequency: 1000, resolution: 8 }
    },
    {
      type: TYPES.AO,
      symbol: 'AO',
      name: 'Sortie analogique',
      shortName: 'Sortie analogique',
      family: 'output',
      inputType: 'analog',
      outputType: null,
      description: 'Convertit un signal d’ingénierie en une sortie DAC analogique réelle lorsque la carte dispose d’un DAC.',
      aliases: ['ao', 'analog_output', 'salida_analogica', 'sortie analogique'],
      editors: { fbd: true, ladder: true },
      defaults: { inMin: 0, inMax: 100, unit: '%', decimals: 1, clamp: true, voltageMin: 0, voltageMax: 3.3, outputUnit: 'V' }
    }
  ];

  function deepFreezeDefinition(definition) {
    const clone = Object.assign({}, definition, {
      aliases: Object.freeze((definition.aliases || []).slice()),
      editors: Object.freeze(Object.assign({}, definition.editors || {})),
      defaults: Object.freeze(Object.assign({}, definition.defaults || {}))
    });
    return Object.freeze(clone);
  }

  const DEFINITIONS = Object.freeze(RAW_DEFINITIONS.map(deepFreezeDefinition));
  const BY_TYPE = new Map();
  const ALIASES = new Map();

  function normalizeKey(value) {
    return String(value == null ? '' : value)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  DEFINITIONS.forEach(function (definition) {
    BY_TYPE.set(definition.type, definition);
    ALIASES.set(normalizeKey(definition.type), definition.type);
    ALIASES.set(normalizeKey(definition.symbol), definition.type);
    (definition.aliases || []).forEach(function (alias) {
      ALIASES.set(normalizeKey(alias), definition.type);
    });
  });

  function normalizeType(value) {
    const key = normalizeKey(value);
    return ALIASES.get(key) || key;
  }

  function get(value) {
    return BY_TYPE.get(normalizeType(value)) || null;
  }

  function list() {
    return DEFINITIONS.slice();
  }

  function isAnalog(value) {
    return !!get(value && typeof value === 'object' ? value.type : value);
  }

  function isSource(value) {
    const definition = get(value && typeof value === 'object' ? value.type : value);
    return !!definition && definition.outputType === 'analog';
  }

  function isOutput(value) {
    const definition = get(value && typeof value === 'object' ? value.type : value);
    return !!definition && definition.family === 'output';
  }

  function isComparator(value) {
    const definition = get(value && typeof value === 'object' ? value.type : value);
    return !!definition && definition.family === 'comparator';
  }

  function symbolFor(value, fallback) {
    const definition = get(value);
    return definition ? definition.symbol : (fallback == null ? String(value || '').toUpperCase() : fallback);
  }

  function nameFor(value, fallback) {
    const definition = get(value);
    return definition ? definition.name : (fallback == null ? String(value || '') : fallback);
  }

  function shortNameFor(value, fallback) {
    const definition = get(value);
    return definition ? definition.shortName : nameFor(value, fallback);
  }

  function descriptionFor(value, fallback) {
    const definition = get(value);
    return definition ? definition.description : (fallback || '');
  }

  function defaultParamsFor(value) {
    const definition = get(value);
    return definition ? Object.assign({}, definition.defaults) : {};
  }

  function supportsEditor(value, editor) {
    const definition = get(value);
    if (!definition || !definition.editors) return false;
    return definition.editors[String(editor || '').toLowerCase()] || false;
  }

  function decorateLibraryElement(element) {
    if (!element || !element.dataset) return null;
    const definition = get(element.dataset.type);
    if (!definition) return null;
    element.dataset.analogCatalog = '1';
    element.dataset.analogFamily = definition.family;
    element.dataset.inputSignal = definition.inputType || 'none';
    element.dataset.outputSignal = definition.outputType || 'none';
    element.setAttribute('aria-label', definition.name + ' (' + definition.symbol + ')');
    element.title = definition.name + ': ' + definition.description;
    return definition;
  }

  global.SimuPLCAnalogCatalog = Object.freeze({
    version: 7,
    TYPES: TYPES,
    definitions: DEFINITIONS,
    normalizeType: normalizeType,
    get: get,
    list: list,
    isAnalog: isAnalog,
    isSource: isSource,
    isComparator: isComparator,
    isOutput: isOutput,
    symbolFor: symbolFor,
    nameFor: nameFor,
    shortNameFor: shortNameFor,
    descriptionFor: descriptionFor,
    defaultParamsFor: defaultParamsFor,
    supportsEditor: supportsEditor,
    decorateLibraryElement: decorateLibraryElement,
    getDiagnostics: function () {
      return {
        ok: true,
        module: 'analog-block-catalog',
        version: 7,
        definitionCount: DEFINITIONS.length,
        fbdReady: DEFINITIONS.every(function (item) { return item.editors.fbd === true; }),
        ladderAIReady: supportsEditor(TYPES.INPUT, 'ladder') === true,
        ladderAnalogReady: DEFINITIONS.every(function (item) { return item.editors.ladder === true; }),
        ladderPlannedCount: DEFINITIONS.filter(function (item) { return item.editors.ladder === 'planned'; }).length
      };
    }
  });
})(window);
