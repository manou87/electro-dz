/**
 * Bibliothèque officielle Hager Normen — symboles extraits de pdf/hager-normen.pdf
 * IEC 60617 / NIBT 2020 / electrosuisse — base Electro DZ
 * Données : js/hager-symbols-official-data.js (315 symboles)
 */
(function (g) {
  'use strict';

  var VB_DEFAULT = 48;

  var IEC_ALIASES = {
    ac_source: 'p5_005_courant_alternatif',
    ac_source_tri: 'p5_011_conducteur_de_neutre_50_hz_400_230_v',
    energy_meter: 'p7_030_c_compteur',
    circuit_breaker: 'p6_039_disjoncteur',
    rcd: 'ddr_fi',
    fuse: 'p6_058_coupe_circuit_de_surintensit_fusible',
    isolator: 'p6_051_sectionneur',
    busbar: 'p10_020_en_g_n_ral',
    conductor_v: 'p10_020_en_g_n_ral',
    motor: 'machine_m',
    lamp: 'p7_035_lampe_lampe_t_moin',
    socket: 'p6_032_prise_ou_prise_enfichable',
    heating: 'p6_035_corps_de_chauffe',
    resistor_load: 'p6_017_r_sistance_symbole_g_n_ral',
    appliance: 'p10_074_appareil_m_nager',
    transformer: 'p6_038_transformateur_avec_deux_enroulements',
    contactor: 'p6_009_relais_symbole_g_n_ral',
    battery: 'p6_048_batterie_de_piles_ou_d_accumulateurs',
    surge_protector: 'p6_007_parafoudre',
    pv_array: 'p6_038_transformateur_avec_deux_enroulements',
  };

  var IEC_CATEGORIES = {
    ac_source: 'source',
    ac_source_tri: 'source',
    energy_meter: 'measure',
    circuit_breaker: 'protection',
    rcd: 'protection',
    fuse: 'protection',
    isolator: 'protection',
    surge_protector: 'protection',
    busbar: 'transmission',
    conductor_v: 'conductor',
    motor: 'load',
    lamp: 'load',
    socket: 'load',
    heating: 'load',
    resistor_load: 'load',
    appliance: 'load',
    transformer: 'conversion',
    contactor: 'control',
    battery: 'source',
    pv_array: 'source',
  };

  var TEMPLATE_TO_IEC = {
    light_rooms: 'lamp',
    light_stairs: 'lamp',
    light_parking: 'lamp',
    outdoor_light: 'lamp',
    sockets_living: 'socket',
    sockets_kitchen: 'socket',
    sockets_bedrooms: 'socket',
    sockets_bathroom: 'socket',
    sockets_office: 'socket',
    sockets_garage: 'socket',
    hvac_ventilation: 'motor',
    motor_pump: 'motor',
    motor_lift: 'motor',
    washing_machine: 'appliance',
    heating_electric: 'heating',
    water_heater: 'heating',
    cooker: 'heating',
    oven: 'heating',
    dishwasher: 'appliance',
    dryer: 'heating',
    welding: 'motor',
    ev_charger: 'appliance',
  };

  var OFFICIAL_BY_ID = {};
  var official = g.ElectroDzHagerSymbolsOfficial;
  if (official && official.symbols) {
    official.symbols.forEach(function (s) {
      OFFICIAL_BY_ID[s.id] = s;
    });
  }

  function normalize(raw, shortId, category) {
    var vb = raw.viewBox || VB_DEFAULT;
    return {
      id: shortId || raw.id,
      hagerId: raw.id,
      label: raw.labelFr,
      category: category || raw.category || 'hager_normen',
      body: raw.body,
      viewBox: vb,
      ports: raw.ports || { n: [vb / 2, 2], s: [vb / 2, vb - 2] },
      page: raw.page,
      source: raw.source || 'Hager Normen PDF',
      iecRef: raw.iecRef || 'IEC 60617',
    };
  }

  var SYMBOL_DB = {};
  Object.keys(IEC_ALIASES).forEach(function (shortId) {
    var raw = OFFICIAL_BY_ID[IEC_ALIASES[shortId]];
    if (raw) SYMBOL_DB[shortId] = normalize(raw, shortId, IEC_CATEGORIES[shortId]);
  });

  if (!SYMBOL_DB.resistor_load) {
    SYMBOL_DB.resistor_load = {
      id: 'resistor_load',
      label: 'Charge / résistance',
      category: 'load',
      body: '<rect x="10" y="10" width="28" height="28" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>',
      viewBox: VB_DEFAULT,
      ports: { n: [24, 4], s: [24, 44] },
    };
  }

  function symVb(sym) {
    return (sym && sym.viewBox) || VB_DEFAULT;
  }

  function getSymbol(id) {
    if (SYMBOL_DB[id]) return SYMBOL_DB[id];
    if (OFFICIAL_BY_ID[id]) return normalize(OFFICIAL_BY_ID[id]);
    return SYMBOL_DB.resistor_load;
  }

  function symbolSvg(id, w, h) {
    var sym = getSymbol(id);
    var vb = symVb(sym);
    w = w || vb;
    h = h || vb;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      vb +
      ' ' +
      vb +
      '" width="' +
      w +
      '" height="' +
      h +
      '">' +
      sym.body +
      '</svg>'
    );
  }

  function symbolDataUri(id) {
    var sym = getSymbol(id);
    return 'data:image/svg+xml,' + encodeURIComponent(symbolSvg(id, symVb(sym), symVb(sym)));
  }

  function renderSymbolG(id, cx, cy, size) {
    var sym = getSymbol(id);
    var vb = symVb(sym);
    size = size || vb;
    var half = size / 2;
    return (
      '<g transform="translate(' +
      (cx - half) +
      ',' +
      (cy - half) +
      ') scale(' +
      size / vb +
      ')">' +
      sym.body +
      '</g>'
    );
  }

  function drawioImageStyle(id, w, h) {
    w = w || 48;
    h = h || 48;
    return (
      'shape=image;html=1;aspect=fixed;imageAspect=0;verticalLabelPosition=bottom;verticalAlign=top;labelBackgroundColor=none;image=' +
      symbolDataUri(id) +
      ';'
    );
  }

  function resolveLoadSymbol(c) {
    var tid = c.templateId || '';
    if (TEMPLATE_TO_IEC[tid]) return TEMPLATE_TO_IEC[tid];
    var label = String(c.label || '').toLowerCase();
    if (/lamp|éclair|eclair|luminaire|light/.test(label)) return 'lamp';
    if (/moteur|motor|pompe|ventil|ascenseur|lift/.test(label)) return 'motor';
    if (/prise|socket/.test(label)) return 'socket';
    if (/chauffe|cumulus|ballon|four|cuisini|plaque|oven/.test(label)) return 'heating';
    if (/borne|irve|véhicule|ve /.test(label)) return 'appliance';
    if (/pv|photovolt|panneau/.test(label)) return 'pv_array';
    switch (c.usage) {
      case 'lighting':
        return 'lamp';
      case 'motors':
        return 'motor';
      case 'sockets':
        return 'socket';
      case 'heating':
        return 'heating';
      case 'welding':
        return 'motor';
      default:
        return 'resistor_load';
    }
  }

  function resolveBranchProtection(c) {
    return c.rcd ? 'rcd' : 'circuit_breaker';
  }

  function resolveSourceSymbol(supply) {
    return supply && supply.isTri ? 'ac_source_tri' : 'ac_source';
  }

  function listSymbols() {
    if (official && official.symbols) {
      return official.symbols.map(function (s) {
        return {
          id: s.id,
          label: s.labelFr,
          category: s.category,
          page: s.page,
          hagerId: s.id,
        };
      });
    }
    return Object.keys(SYMBOL_DB).map(function (k) {
      var s = SYMBOL_DB[k];
      return { id: s.id, label: s.label, category: s.category };
    });
  }

  function listCanonical() {
    return Object.keys(SYMBOL_DB).map(function (k) {
      var s = SYMBOL_DB[k];
      return { id: s.id, label: s.label, category: s.category, hagerId: s.hagerId };
    });
  }

  g.ElectroDzIecSymbols = {
    SYMBOL_DB: SYMBOL_DB,
    OFFICIAL_BY_ID: OFFICIAL_BY_ID,
    IEC_ALIASES: IEC_ALIASES,
    TEMPLATE_TO_IEC: TEMPLATE_TO_IEC,
    getSymbol: getSymbol,
    symbolSvg: symbolSvg,
    symbolDataUri: symbolDataUri,
    renderSymbolG: renderSymbolG,
    drawioImageStyle: drawioImageStyle,
    resolveLoadSymbol: resolveLoadSymbol,
    resolveBranchProtection: resolveBranchProtection,
    resolveSourceSymbol: resolveSourceSymbol,
    listSymbols: listSymbols,
    listCanonical: listCanonical,
    symVb: symVb,
    VIEWBOX: VB_DEFAULT,
    officialCount: official ? official.count : 0,
    sourcePdf: 'pdf/hager-normen.pdf',
  };
})(typeof window !== 'undefined' ? window : globalThis);
