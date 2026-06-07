/**
 * Bibliothèque de symboles IEC 60617 pour schémas unifilaires.
 * Réf. : Hager « Normen » (symboles schémas électriques, NIBT 2020 / electrosuisse).
 * Rendu : traits uniquement, connexions N/S sur grille 48×48.
 */
(function (g) {
  'use strict';

  var VB = 48;

  /** @type {Record<string,{id:string,label:string,category:string,body:string,ports:{n:[number,number],s:[number,number]}}>} */
  var SYMBOL_DB = {
    ac_source: {
      id: 'ac_source',
      label: 'Courant alternatif',
      category: 'source',
      body:
        '<circle cx="24" cy="24" r="20" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M14 24c4-10 8-10 12 0s8 10 12 0 8-10 12 0" fill="none" stroke="#0f172a" stroke-width="1.6"/>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    ac_source_tri: {
      id: 'ac_source_tri',
      label: 'Triphasé 400/230 V',
      category: 'source',
      body:
        '<circle cx="24" cy="24" r="20" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M14 24c4-10 8-10 12 0s8 10 12 0" fill="none" stroke="#0f172a" stroke-width="1.6"/>' +
        '<text x="24" y="28" text-anchor="middle" font-size="7" fill="#0f172a">3~</text>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    energy_meter: {
      id: 'energy_meter',
      label: 'Compteur (c)',
      category: 'measure',
      body:
        '<rect x="8" y="10" width="32" height="28" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<text x="24" y="30" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a">M</text>',
      ports: { n: [24, 10], s: [24, 38] },
    },
    circuit_breaker: {
      id: 'circuit_breaker',
      label: 'Disjoncteur',
      category: 'protection',
      body:
        '<line x1="24" y1="4" x2="24" y2="14" stroke="#0f172a" stroke-width="2"/>' +
        '<line x1="24" y1="34" x2="24" y2="44" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="14" y="14" width="20" height="20" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="18" y1="32" x2="30" y2="16" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="18" y1="16" x2="30" y2="32" stroke="#0f172a" stroke-width="1.8"/>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    rcd: {
      id: 'rcd',
      label: 'DDR / RCD',
      category: 'protection',
      body:
        '<line x1="24" y1="4" x2="24" y2="12" stroke="#0f172a" stroke-width="2"/>' +
        '<line x1="24" y1="36" x2="24" y2="44" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="14" y="12" width="20" height="16" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="18" y1="26" x2="30" y2="14" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="18" y1="14" x2="30" y2="26" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M20 30 L24 36 L28 30 Z" fill="none" stroke="#0f172a" stroke-width="1.5"/>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    fuse: {
      id: 'fuse',
      label: 'Fusible',
      category: 'protection',
      body:
        '<line x1="24" y1="4" x2="24" y2="14" stroke="#0f172a" stroke-width="2"/>' +
        '<line x1="24" y1="34" x2="24" y2="44" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="16" y="14" width="16" height="20" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="20" y1="24" x2="28" y2="24" stroke="#0f172a" stroke-width="1.8"/>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    isolator: {
      id: 'isolator',
      label: 'Sectionneur',
      category: 'protection',
      body:
        '<line x1="24" y1="4" x2="24" y2="18" stroke="#0f172a" stroke-width="2"/>' +
        '<line x1="24" y1="30" x2="24" y2="44" stroke="#0f172a" stroke-width="2"/>' +
        '<line x1="18" y1="22" x2="30" y2="26" stroke="#0f172a" stroke-width="2"/>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    busbar: {
      id: 'busbar',
      label: 'Barre',
      category: 'transmission',
      body: '<line x1="0" y1="24" x2="48" y2="24" stroke="#0284c7" stroke-width="5"/>',
      ports: { n: [24, 24], s: [24, 24] },
    },
    conductor_v: {
      id: 'conductor_v',
      label: 'Liaison',
      category: 'conductor',
      body: '<line x1="24" y1="0" x2="24" y2="48" stroke="#0284c7" stroke-width="2"/>',
      ports: { n: [24, 0], s: [24, 48] },
    },
    motor: {
      id: 'motor',
      label: 'Moteur M',
      category: 'load',
      body:
        '<circle cx="24" cy="24" r="18" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<text x="24" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">M</text>',
      ports: { n: [24, 6], s: [24, 42] },
    },
    lamp: {
      id: 'lamp',
      label: 'Lampe',
      category: 'load',
      body:
        '<circle cx="24" cy="24" r="16" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="16" y1="16" x2="32" y2="32" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="32" y1="16" x2="16" y2="32" stroke="#0f172a" stroke-width="1.8"/>',
      ports: { n: [24, 8], s: [24, 40] },
    },
    socket: {
      id: 'socket',
      label: 'Prise',
      category: 'load',
      body:
        '<line x1="24" y1="4" x2="24" y2="12" stroke="#0f172a" stroke-width="2"/>' +
        '<path d="M12 28 A12 12 0 0 1 36 28" fill="none" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M12 34 A12 12 0 0 0 36 34" fill="none" stroke="#0f172a" stroke-width="1.8"/>',
      ports: { n: [24, 4], s: [24, 40] },
    },
    heating: {
      id: 'heating',
      label: 'Corps de chauffe',
      category: 'load',
      body:
        '<line x1="24" y1="4" x2="24" y2="10" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="10" y="10" width="28" height="28" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M14 34 L18 18 L22 30 L26 16 L30 28 L34 20" fill="none" stroke="#0f172a" stroke-width="1.6"/>',
      ports: { n: [24, 4], s: [24, 42] },
    },
    resistor_load: {
      id: 'resistor_load',
      label: 'Résistance / charge',
      category: 'load',
      body:
        '<line x1="24" y1="4" x2="24" y2="10" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="10" y="10" width="28" height="28" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M14 30 L18 18 L22 28 L26 16 L30 26 L34 18" fill="none" stroke="#0f172a" stroke-width="1.6"/>',
      ports: { n: [24, 4], s: [24, 42] },
    },
    transformer: {
      id: 'transformer',
      label: 'Transformateur',
      category: 'conversion',
      body:
        '<circle cx="18" cy="24" r="12" fill="none" stroke="#0f172a" stroke-width="1.8"/>' +
        '<circle cx="30" cy="24" r="12" fill="none" stroke="#0f172a" stroke-width="1.8"/>',
      ports: { n: [24, 8], s: [24, 40] },
    },
    contactor: {
      id: 'contactor',
      label: 'Contacteur',
      category: 'control',
      body:
        '<line x1="24" y1="4" x2="24" y2="12" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="12" y="12" width="24" height="24" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="18" y1="24" x2="30" y2="24" stroke="#0f172a" stroke-width="2"/>',
      ports: { n: [24, 4], s: [24, 40] },
    },
    battery: {
      id: 'battery',
      label: 'Batterie',
      category: 'source',
      body:
        '<line x1="16" y1="12" x2="16" y2="36" stroke="#0f172a" stroke-width="3"/>' +
        '<line x1="22" y1="16" x2="22" y2="32" stroke="#0f172a" stroke-width="1.5"/>' +
        '<line x1="28" y1="12" x2="28" y2="36" stroke="#0f172a" stroke-width="3"/>',
      ports: { n: [24, 8], s: [24, 40] },
    },
    surge_protector: {
      id: 'surge_protector',
      label: 'Parafoudre',
      category: 'protection',
      body:
        '<line x1="24" y1="4" x2="24" y2="16" stroke="#0f172a" stroke-width="2"/>' +
        '<line x1="24" y1="32" x2="24" y2="44" stroke="#0f172a" stroke-width="2"/>' +
        '<rect x="16" y="16" width="16" height="16" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<path d="M20 28 L24 18 L28 28 Z" fill="none" stroke="#0f172a" stroke-width="1.5"/>' +
        '<line x1="20" y1="32" x2="28" y2="32" stroke="#0f172a" stroke-width="1.2"/>',
      ports: { n: [24, 4], s: [24, 44] },
    },
    pv_array: {
      id: 'pv_array',
      label: 'PV',
      category: 'source',
      body:
        '<rect x="8" y="14" width="32" height="22" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="12" y1="20" x2="36" y2="20" stroke="#0f172a" stroke-width="1"/>' +
        '<line x1="12" y1="26" x2="36" y2="26" stroke="#0f172a" stroke-width="1"/>' +
        '<line x1="12" y1="32" x2="36" y2="32" stroke="#0f172a" stroke-width="1"/>',
      ports: { n: [24, 14], s: [24, 36] },
    },
    appliance: {
      id: 'appliance',
      label: 'Appareil',
      category: 'load',
      body:
        '<rect x="10" y="12" width="28" height="26" rx="3" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>' +
        '<line x1="16" y1="25" x2="32" y2="25" stroke="#0f172a" stroke-width="1.5"/>',
      ports: { n: [24, 12], s: [24, 38] },
    },
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

  function getSymbol(id) {
    return SYMBOL_DB[id] || SYMBOL_DB.resistor_load;
  }

  function symbolSvg(id, w, h) {
    var sym = getSymbol(id);
    w = w || VB;
    h = h || VB;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      VB +
      ' ' +
      VB +
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
    return 'data:image/svg+xml,' + encodeURIComponent(symbolSvg(id, VB, VB));
  }

  function renderSymbolG(id, cx, cy, size) {
    var sym = getSymbol(id);
    size = size || 48;
    var half = size / 2;
    return (
      '<g transform="translate(' +
      (cx - half) +
      ',' +
      (cy - half) +
      ') scale(' +
      size / VB +
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
    return Object.keys(SYMBOL_DB).map(function (k) {
      var s = SYMBOL_DB[k];
      return { id: s.id, label: s.label, category: s.category };
    });
  }

  g.ElectroDzIecSymbols = {
    SYMBOL_DB: SYMBOL_DB,
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
    VIEWBOX: VB,
  };
})(typeof window !== 'undefined' ? window : globalThis);
