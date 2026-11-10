(function (global) {
  'use strict';

  if (global.SimuPLCProjectSchema) return;

  const MAX_FBD_NODES = 20000;
  const MAX_FBD_CONNECTIONS = 50000;
  const MAX_LADDER_RUNGS = 5000;
  const MAX_LADDER_ELEMENTS = 30000;
  const MAX_LADDER_WIRES = 60000;
  const MAX_LADDER_JUNCTIONS = 30000;

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function emptyFBD() {
    return {
      type: 'simuplc-fbd',
      version: 4,
      savedAt: new Date().toISOString(),
      nodes: [],
      connections: [],
      freeTexts: [],
      settings: { counts: {}, view: {} }
    };
  }

  function emptyLadder() {
    return {
      type: 'ladder-phase9',
      version: 1,
      rungs: [{ id: 'r1', elements: [] }],
      proWires: [],
      proJunctions: [],
      referenceTexts: [],
      settings: {}
    };
  }

  function normalizeFBD(value) {
    value = clone(value || {});
    if (value.editors && value.editors.fbd) value = value.editors.fbd;
    if (value.fbd && !value.nodes) value = value.fbd;
    if (value.data && Array.isArray(value.data.nodes)) value = value.data;
    if (!isObject(value)) value = {};
    if (!Array.isArray(value.nodes)) value.nodes = [];
    if (!Array.isArray(value.connections)) {
      value.connections = Array.isArray(value.wires) ? value.wires : [];
    }
    if (!Array.isArray(value.freeTexts)) {
      value.freeTexts = Array.isArray(value.annotations) ? value.annotations : (Array.isArray(value.texts) ? value.texts : []);
    }
    value.type = value.type || 'simuplc-fbd';
    value.version = Number(value.version || value.v || 4) || 4;
    value.settings = isObject(value.settings) ? value.settings : {};
    return value;
  }

  function normalizeLadder(value) {
    value = clone(value || {});
    if (value.editors && value.editors.ladder) value = value.editors.ladder;
    if (value.ladder && !value.rungs) value = value.ladder;
    if (value.data && Array.isArray(value.data.rungs)) value = value.data;
    if (!isObject(value)) value = {};
    if (!Array.isArray(value.rungs)) value.rungs = emptyLadder().rungs;
    value.rungs = value.rungs.map(function (rung, index) {
      if (!isObject(rung)) return { id: 'r' + (index + 1), elements: [] };
      if (!Array.isArray(rung.elements)) rung.elements = [];
      if (!rung.id) rung.id = 'r' + (index + 1);
      return rung;
    });
    if (!value.rungs.length) value.rungs = emptyLadder().rungs;
    if (!Array.isArray(value.proWires)) value.proWires = [];
    if (!Array.isArray(value.proJunctions)) value.proJunctions = [];
    if (!Array.isArray(value.referenceTexts)) {
      value.referenceTexts = Array.isArray(value.annotations) ? value.annotations : (Array.isArray(value.texts) ? value.texts : []);
    }
    value.type = value.type || 'ladder-phase9';
    value.version = Number(value.version || 1) || 1;
    value.settings = isObject(value.settings) ? value.settings : {};
    return value;
  }

  function createProject(options) {
    options = options || {};
    const config = global.SimuPLCConfig || {
      appName: 'SimuPLC Lab', appVersion: 'desconocida',
      projectType: 'simuplc-project', projectSchemaVersion: 1
    };
    const now = new Date().toISOString();

    return {
      type: config.projectType,
      schemaVersion: config.projectSchemaVersion,
      version: config.projectSchemaVersion,
      app: { name: config.appName, version: config.appVersion },
      name: String(options.name || 'Projet SimuPLC'),
      createdAt: options.createdAt || options.savedAt || now,
      updatedAt: now,
      savedAt: now,
      activeEditor: options.activeEditor === 'ladder' ? 'ladder' : 'fbd',
      editors: {
        fbd: normalizeFBD(options.fbd || emptyFBD()),
        ladder: normalizeLadder(options.ladder || emptyLadder())
      },
      hardware: isObject(options.hardware) ? clone(options.hardware) : {}
    };
  }

  function assertCompatibleVersion(source) {
    const config = global.SimuPLCConfig || { projectSchemaVersion: 1, projectType: 'simuplc-project' };
    if (!source || source.type !== config.projectType) return;
    const incoming = Number(source.schemaVersion || source.version || 1) || 1;
    const supported = Number(config.projectSchemaVersion || 1) || 1;
    if (incoming > supported) {
      throw new Error('El projet usa la version ' + incoming + ', mais cette application prend en charge jusqu’à la version ' + supported + '. Actualiza SimuPLC Lab para abrirlo.');
    }
  }

  function migrate(input, fallbacks) {
    const config = global.SimuPLCConfig || {};
    const source = clone(input || {});
    fallbacks = fallbacks || {};
    assertCompatibleVersion(source);

    if (source.type === config.projectType && source.editors) {
      return createProject({
        name: source.name,
        createdAt: source.createdAt || source.savedAt,
        activeEditor: source.activeEditor,
        fbd: source.editors.fbd,
        ladder: source.editors.ladder,
        hardware: source.hardware || source.mcuConfig
      });
    }

    if (source.editors || source.fbd || source.ladder || source.type === config.legacyDualProjectType) {
      return createProject({
        name: source.name,
        createdAt: source.createdAt || source.savedAt,
        activeEditor: source.activeEditor,
        fbd: (source.editors && source.editors.fbd) || source.fbd || fallbacks.fbd,
        ladder: (source.editors && source.editors.ladder) || source.ladder || fallbacks.ladder,
        hardware: source.hardware || source.mcuConfig || fallbacks.hardware
      });
    }

    if (Array.isArray(source.nodes) || (source.data && Array.isArray(source.data.nodes))) {
      return createProject({
        name: source.name || 'Projet FBD importé',
        activeEditor: 'fbd',
        fbd: source.data && Array.isArray(source.data.nodes) ? source.data : source,
        ladder: fallbacks.ladder,
        hardware: source.hardware || source.mcuConfig || fallbacks.hardware
      });
    }

    if (Array.isArray(source.rungs) || source.type === 'ladder-phase9' || source.type === 'ladder-free-pro-industrial') {
      return createProject({
        name: source.name || 'Projet Ladder importé',
        activeEditor: 'ladder',
        fbd: fallbacks.fbd,
        ladder: source,
        hardware: source.hardware || source.mcuConfig || fallbacks.hardware
      });
    }

    throw new Error('Le fichier ne contient pas un projet SimuPLC reconnu.');
  }

  function validateFBD(fbd, errors, warnings, strict) {
    if (!isObject(fbd)) {
      errors.push('La section FBD n’est pas valide.');
      return;
    }
    if (!Array.isArray(fbd.nodes)) errors.push('FBD ne contient pas une liste nodes valide.');
    if (!Array.isArray(fbd.connections)) errors.push('FBD ne contient pas une liste connections valide.');
    if (Array.isArray(fbd.nodes) && fbd.nodes.length > MAX_FBD_NODES) errors.push('FBD dépasse la limite sûre de ' + MAX_FBD_NODES + ' bloques.');
    if (Array.isArray(fbd.connections) && fbd.connections.length > MAX_FBD_CONNECTIONS) errors.push('FBD dépasse la limite sûre de ' + MAX_FBD_CONNECTIONS + ' conexiones.');
    if (Array.isArray(fbd.nodes)) {
      fbd.nodes.forEach(function (node, index) {
        if (!isObject(node)) errors.push('El bloc FBD #' + (index + 1) + ' est endommagé.');
        else if (strict && !node.type) errors.push('El bloc FBD #' + (index + 1) + ' n’a pas de type.');
        else if (!node.id) warnings.push('El bloc FBD #' + (index + 1) + ' n’a pas d’identifiant ; régénération tentée.');
      });
    }
    if (Array.isArray(fbd.connections)) {
      fbd.connections.forEach(function (wire, index) {
        if (!isObject(wire)) errors.push('La connexion FBD #' + (index + 1) + ' est endommagée.');
      });
    }
  }

  function validateLadder(ladder, errors, warnings, strict) {
    if (!isObject(ladder)) {
      errors.push('La section Ladder n’est pas valide.');
      return;
    }
    if (!Array.isArray(ladder.rungs)) errors.push('Ladder ne contient pas une liste rungs valide.');
    if (!Array.isArray(ladder.proWires)) errors.push('Ladder ne contient pas une liste proWires valide.');
    if (!Array.isArray(ladder.proJunctions)) errors.push('Ladder ne contient pas une liste proJunctions valide.');
    if (Array.isArray(ladder.rungs) && ladder.rungs.length > MAX_LADDER_RUNGS) errors.push('Ladder dépasse la limite sûre de ' + MAX_LADDER_RUNGS + ' lignes.');
    let elementCount = 0;
    if (Array.isArray(ladder.rungs)) {
      ladder.rungs.forEach(function (rung, rungIndex) {
        if (!isObject(rung)) {
          errors.push('La ligne Ladder #' + (rungIndex + 1) + ' est endommagée.');
          return;
        }
        if (!Array.isArray(rung.elements)) {
          errors.push('La ligne Ladder #' + (rungIndex + 1) + ' ne contient pas une liste elements valide.');
          return;
        }
        elementCount += rung.elements.length;
        rung.elements.forEach(function (element, elementIndex) {
          if (!isObject(element)) errors.push('L’élément Ladder #' + (elementIndex + 1) + ' de la ligne ' + (rungIndex + 1) + ' est endommagé.');
          else if (strict && !element.type) errors.push('L’élément Ladder #' + (elementIndex + 1) + ' de la ligne ' + (rungIndex + 1) + ' n’a pas de type.');
          else if (!element.id) warnings.push('Un élément Ladder de la ligne ' + (rungIndex + 1) + ' n’a pas d’identifiant.');
        });
      });
    }
    if (elementCount > MAX_LADDER_ELEMENTS) errors.push('Ladder dépasse la limite sûre de ' + MAX_LADDER_ELEMENTS + ' éléments.');
    if (Array.isArray(ladder.proWires) && ladder.proWires.length > MAX_LADDER_WIRES) errors.push('Ladder dépasse la limite sûre de ' + MAX_LADDER_WIRES + ' cables.');
    if (Array.isArray(ladder.proWires)) {
      ladder.proWires.forEach(function (wire, index) {
        if (!isObject(wire)) errors.push('El câble Ladder #' + (index + 1) + ' est endommagé.');
      });
    }
    if (Array.isArray(ladder.proJunctions) && ladder.proJunctions.length > MAX_LADDER_JUNCTIONS) errors.push('Ladder dépasse la limite sûre de ' + MAX_LADDER_JUNCTIONS + ' points de jonction.');
    if (Array.isArray(ladder.proJunctions)) {
      ladder.proJunctions.forEach(function (junction, index) {
        if (!isObject(junction)) errors.push('Le point de jonction Ladder #' + (index + 1) + ' est endommagé.');
        else if (!junction.id) warnings.push('Le point de jonction Ladder #' + (index + 1) + ' n’a pas d’identifiant.');
        else if (!Number.isFinite(Number(junction.x)) || !Number.isFinite(Number(junction.y))) errors.push('Le point de jonction Ladder #' + (index + 1) + ' n’a pas de coordonnées valides.');
      });
    }
  }

  function validate(project, options) {
    options = options || {};
    const errors = [];
    const warnings = [];
    const config = global.SimuPLCConfig || { projectType: 'simuplc-project', projectSchemaVersion: 1 };
    if (!isObject(project)) return { ok: false, errors: ['El projet no es un objeto valide.'], warnings: [] };

    const incoming = Number(project.schemaVersion || project.version || 1) || 1;
    const supported = Number(config.projectSchemaVersion || 1) || 1;
    if (project.type === config.projectType && incoming > supported) {
      errors.push('El projet requiere el esquema ' + incoming + ' y esta version admite hasta el ' + supported + '.');
    }
    if (project.type !== config.projectType) warnings.push('Le type n’est pas le format canonique actuel.');
    if (!isObject(project.editors)) {
      errors.push('Falta la section editors.');
      return { ok: false, errors: errors, warnings: warnings };
    }
    validateFBD(project.editors.fbd, errors, warnings, !!options.strict);
    validateLadder(project.editors.ladder, errors, warnings, !!options.strict);
    if (project.activeEditor !== 'fbd' && project.activeEditor !== 'ladder') warnings.push('L’éditeur actif n’est pas défini correctement ; FBD sera utilisé.');
    return { ok: errors.length === 0, errors: errors, warnings: warnings };
  }

  function validateImportSource(source) {
    const errors = [];
    const warnings = [];
    const config = global.SimuPLCConfig || { projectType: 'simuplc-project', projectSchemaVersion: 1, legacyDualProjectType: 'simuplc-dual-project' };
    if (!isObject(source)) return { ok: false, errors: ['Le fichier ne contient pas un objet de projet valide.'], warnings: [] };

    if (source.type === config.projectType) {
      const incoming = Number(source.schemaVersion || source.version || 1) || 1;
      const supported = Number(config.projectSchemaVersion || 1) || 1;
      if (incoming > supported) errors.push('Ce fichier a été créé avec une version plus récente de SimuPLC Lab. Schéma requis : ' + incoming + '.');
      if (!isObject(source.editors)) errors.push('Le projet canonique ne contient pas la section editors.');
    }

    const looksDual = !!(source.editors || source.fbd || source.ladder || source.type === config.legacyDualProjectType);
    const looksFBD = Array.isArray(source.nodes) || !!(source.data && Array.isArray(source.data.nodes));
    const looksLadder = Array.isArray(source.rungs) || source.type === 'ladder-phase9' || source.type === 'ladder-free-pro-industrial';
    if (!looksDual && !looksFBD && !looksLadder) errors.push('Le fichier ne semble contenir ni circuit FBD, ni Ladder, ni projet combiné.');

    if (!errors.length) {
      try {
        const migrated = migrate(source);
        const validation = validate(migrated, { strict: true });
        errors.push.apply(errors, validation.errors);
        warnings.push.apply(warnings, validation.warnings);
      } catch (error) {
        errors.push(String(error && error.message || error));
      }
    }
    return { ok: errors.length === 0, errors: errors, warnings: warnings };
  }

  function toLegacyDual(project) {
    project = migrate(project);
    return {
      type: 'simuplc-dual-project',
      version: 2,
      name: project.name,
      savedAt: project.savedAt,
      activeEditor: project.activeEditor,
      editors: clone(project.editors),
      fbd: clone(project.editors.fbd),
      ladder: clone(project.editors.ladder),
      hardware: clone(project.hardware || {})
    };
  }

  global.SimuPLCProjectSchema = Object.freeze({
    emptyFBD: emptyFBD,
    emptyLadder: emptyLadder,
    normalizeFBD: normalizeFBD,
    normalizeLadder: normalizeLadder,
    createProject: createProject,
    migrate: migrate,
    validate: validate,
    validateImportSource: validateImportSource,
    toLegacyDual: toLegacyDual
  });
})(window);
