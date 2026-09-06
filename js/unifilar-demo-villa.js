/**
 * Bilan démo — Villa R+1 + atelier (installation complète pour tests unifilaire / légende).
 */
(function (g) {
  'use strict';

  var STORAGE_REPORT = 'electrodz-unifilar-source-report-v1';

  /** Lignes : Pi, Ku, Ks, cos — mono/tri géré par Uline du rapport. */
  var DEMO_LINES = [
    { schemaRef: 'Q01', board: 'TGBT', location: 'LOCAL-TECH', templateId: 'light_rooms', usage: 'lighting', label: 'Éclairage local tech', p: 400, ku: 0.9, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q02', board: 'TGBT', location: 'LOCAL-TECH', templateId: 'sockets_garage', usage: 'sockets', label: 'Prises local tech', p: 1200, ku: 0.5, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q03', board: 'TD-RDC', location: 'RDC', templateId: 'light_rooms', usage: 'lighting', label: 'Éclairage pièces RDC', p: 400, ku: 0.9, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q04', board: 'TD-RDC', location: 'RDC', templateId: 'light_stairs', usage: 'lighting', label: 'Éclairage escalier', p: 200, ku: 0.9, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q05', board: 'TD-RDC', location: 'RDC', templateId: 'sockets_living', usage: 'sockets', label: 'Prises séjour', p: 2500, ku: 0.5, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q06', board: 'TD-RDC', location: 'RDC', templateId: 'sockets_kitchen', usage: 'sockets', label: 'Prises cuisine', p: 3500, ku: 0.5, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q07', board: 'TD-RDC', location: 'RDC', templateId: 'sockets_bathroom', usage: 'sockets', label: 'Prises salles d’eau', p: 800, ku: 0.5, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q08', board: 'TD-RDC', location: 'RDC', templateId: 'cooker', usage: 'heating', label: 'Cuisinière', p: 7000, ku: 0.8, ks: 1, cosPhi: 1 },
    { schemaRef: 'Q09', board: 'TD-RDC', location: 'RDC', templateId: 'oven', usage: 'heating', label: 'Four', p: 3000, ku: 0.7, ks: 1, cosPhi: 1 },
    { schemaRef: 'Q10', board: 'TD-RDC', location: 'RDC', templateId: 'dishwasher', usage: 'heating', label: 'Lave-vaisselle', p: 2200, ku: 0.7, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q11', board: 'TD-RDC', location: 'RDC', templateId: 'water_heater', usage: 'heating', label: 'Chauffe-eau', p: 2400, ku: 1, ks: 1, cosPhi: 1 },
    { schemaRef: 'Q12', board: 'TD-RDC', location: 'RDC', templateId: 'hvac_ventilation', usage: 'motors', label: 'VMC', p: 800, ku: 1, ks: 0.9, cosPhi: 0.75 },
    { schemaRef: 'Q13', board: 'TD-ETAGE1', location: 'R+1', templateId: 'light_rooms', usage: 'lighting', label: 'Éclairage étage', p: 400, ku: 0.9, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q14', board: 'TD-ETAGE1', location: 'R+1', templateId: 'sockets_bedrooms', usage: 'sockets', label: 'Prises chambres', p: 2000, ku: 0.4, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q15', board: 'TD-ETAGE1', location: 'R+1', templateId: 'sockets_office', usage: 'sockets', label: 'Bureau', p: 1500, ku: 0.6, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q16', board: 'TD-ETAGE1', location: 'R+1', templateId: 'washing_machine', usage: 'motors', label: 'Lave-linge', p: 2200, ku: 0.7, ks: 1, cosPhi: 0.75 },
    { schemaRef: 'Q17', board: 'TD-ETAGE1', location: 'R+1', templateId: 'dryer', usage: 'heating', label: 'Sèche-linge', p: 2500, ku: 0.7, ks: 1, cosPhi: 1 },
    { schemaRef: 'Q18', board: 'TD-ETAGE1', location: 'R+1', templateId: 'heating_electric', usage: 'heating', label: 'Chauffage électrique', p: 6000, ku: 1, ks: 1, cosPhi: 1 },
    { schemaRef: 'Q19', board: 'LOCAL-TECH', location: 'SOUS-SOL', templateId: 'motor_pump', usage: 'motors', label: 'Pompe', p: 2200, ku: 1, ks: 0.8, cosPhi: 0.75 },
    { schemaRef: 'Q20', board: 'LOCAL-TECH', location: 'SOUS-SOL', templateId: 'motor_lift', usage: 'motors', label: 'Ascenseur', p: 8000, ku: 1, ks: 0.7, cosPhi: 0.75 },
    { schemaRef: 'Q21', board: 'LOCAL-TECH', location: 'EXT', templateId: 'light_parking', usage: 'lighting', label: 'Éclairage parking', p: 300, ku: 0.8, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q22', board: 'LOCAL-TECH', location: 'EXT', templateId: 'outdoor_light', usage: 'lighting', label: 'Éclairage extérieur', p: 500, ku: 0.8, ks: 1, cosPhi: 0.9 },
    { schemaRef: 'Q23', board: 'LOCAL-TECH', location: 'PARKING', templateId: 'ev_charger', usage: 'heating', label: 'Borne VE', p: 7400, ku: 1, ks: 0.9, cosPhi: 0.98 },
    { schemaRef: 'Q24', board: 'LOCAL-TECH', location: 'GARAGE', templateId: 'sockets_garage', usage: 'sockets', label: 'Prises garage', p: 1200, ku: 0.5, ks: 1, cosPhi: 0.8 },
    { schemaRef: 'Q25', board: 'LOCAL-TECH', location: 'GARAGE', templateId: 'welding', usage: 'welding', label: 'Poste à souder', p: 5000, ku: 0.7, ks: 0.6, cosPhi: 0.7 },
  ];

  function buildDetailRows(Uline, isTri) {
    var rows = DEMO_LINES.map(function (row, i) {
      var pi = row.p;
      var ku = row.ku;
      var ks = row.ks;
      var cosPhi = row.cosPhi;
      var pdem = pi * ku * ks;
      var tanPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi)) / cosPhi;
      var qdVar = pdem * tanPhi;
      var sdVA = pdem / cosPhi;
      return {
        circuitRef: 'C' + (i + 1),
        schemaRef: row.schemaRef,
        label: row.label,
        location: row.location,
        board: row.board,
        usage: row.usage,
        templateId: row.templateId,
        pi: pi,
        ku: ku,
        ks: ks,
        cosPhi: cosPhi,
        pdem: pdem,
        qdVar: qdVar,
        sdVA: sdVA,
      };
    });
    return rows;
  }

  function buildDemoReport() {
    var Uline = 400;
    var isTri = true;
    var detailRows = buildDetailRows(Uline, isTri);
    var pTotalW = detailRows.reduce(function (s, r) {
      return s + r.pdem;
    }, 0);
    var qTotalVar = detailRows.reduce(function (s, r) {
      return s + r.qdVar;
    }, 0);
    var sTotalVA = Math.sqrt(pTotalW * pTotalW + qTotalVar * qTotalVar);
    var cosPhiFinal = sTotalVA > 0 ? pTotalW / sTotalVA : 0;
    var ib = sTotalVA / (Math.sqrt(3) * Uline);

    function aggregateBy(getKey) {
      var groups = {};
      detailRows.forEach(function (r) {
        var key = getKey(r) || '—';
        if (!groups[key]) groups[key] = { pdW: 0, qdVar: 0, count: 0 };
        groups[key].pdW += r.pdem;
        groups[key].qdVar += r.qdVar;
        groups[key].count += 1;
      });
      Object.keys(groups).forEach(function (key) {
        var b = groups[key];
        b.sdVA = Math.sqrt(b.pdW * b.pdW + b.qdVar * b.qdVar);
        b.ibA = b.sdVA / (Math.sqrt(3) * Uline);
      });
      return groups;
    }

    return {
      r: {
        ok: true,
        data: {
          formula: 'Pd = Σ(Pi×Ku×Ks) · Qd = Σ(Pd×tg φ) · Sd = √(Pd²+Qd²) · cos φ = Pd/Sd',
          result: (pTotalW / 1000).toFixed(2),
          unit: 'kW',
          additionalData: {
            ibA: ib.toFixed(2),
            pTotalW: pTotalW.toFixed(0),
            qTotalKvar: (qTotalVar / 1000).toFixed(2),
            sTotalKva: (sTotalVA / 1000).toFixed(2),
            cosPhiFinal: cosPhiFinal.toFixed(3),
            Uline: Uline,
            isTri: isTri,
            detailRows: detailRows,
            byBoard: aggregateBy(function (r) {
              return r.board;
            }),
            byLocation: aggregateBy(function (r) {
              return r.location;
            }),
          },
        },
      },
      meta: {
        ref: 'DEMO-VILLA-R1',
        site: 'Villa R+1 + atelier (démo test)',
        client: 'Electro DZ — scénario test',
        engineer: 'Démo automatique',
      },
    };
  }

  function persistDemoReport(report) {
    var payload = JSON.stringify(report);
    try {
      sessionStorage.setItem(STORAGE_REPORT, payload);
      localStorage.setItem(STORAGE_REPORT, payload);
    } catch (e) {
      return false;
    }
    return true;
  }

  g.ElectroDzUnifilarDemoVilla = {
    STORAGE_REPORT: STORAGE_REPORT,
    DEMO_LINES: DEMO_LINES,
    buildDemoReport: buildDemoReport,
    persistDemoReport: persistDemoReport,
  };
})(typeof window !== 'undefined' ? window : globalThis);
