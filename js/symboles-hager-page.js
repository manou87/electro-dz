/**
 * Page catalogue symboles Hager Normen officiels
 */
(function () {
  var I = window.ElectroDzIecSymbols;
  var official = window.ElectroDzHagerSymbolsOfficial;
  if (!I || !official) return;

  var grid = document.getElementById('symGrid');
  var canonical = document.getElementById('symCanonical');
  var search = document.getElementById('symSearch');
  var catSel = document.getElementById('symCategory');
  var pageSel = document.getElementById('symPage');
  var countEl = document.getElementById('symCount');
  var totalEl = document.getElementById('symTotal');

  var CAT_LABELS = {
    courants_tensions_commande: 'Courants, commandes, contacts',
    conducteurs_appareils: 'Conducteurs et appareils',
    machines_mesure_knx: 'Machines, mesure, KNX',
    planification_bpk: 'Planification BPK',
  };

  function cardHtml(sym, showId) {
    var vb = sym.viewBox || 48;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      vb +
      ' ' +
      vb +
      '" width="56" height="56">' +
      sym.body +
      '</svg>';
    var idLine = showId ? '<span>' + sym.id + '</span>' : '';
    return (
      '<div class="sym-card" data-id="' +
      sym.id +
      '">' +
      svg +
      '<strong>' +
      (sym.labelFr || sym.label || sym.id) +
      '</strong>' +
      idLine +
      '</div>'
    );
  }

  function renderCanonical() {
    if (!canonical) return;
    canonical.innerHTML = I.listCanonical()
      .map(function (c) {
        var sym = I.getSymbol(c.id);
        return cardHtml(
          { id: c.id, labelFr: c.label, body: sym.body, viewBox: sym.viewBox },
          true
        );
      })
      .join('');
  }

  function fillCategoryFilter() {
    var cats = {};
    official.symbols.forEach(function (s) {
      cats[s.category] = true;
    });
    Object.keys(cats)
      .sort()
      .forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = CAT_LABELS[c] || c;
        catSel.appendChild(opt);
      });
  }

  function filtered() {
    var q = (search.value || '').toLowerCase().trim();
    var cat = catSel.value;
    var page = pageSel.value;
    return official.symbols.filter(function (s) {
      if (cat && s.category !== cat) return false;
      if (page && String(s.page) !== page) return false;
      if (q) {
        var blob = (s.id + ' ' + s.labelFr + ' ' + s.category).toLowerCase();
        if (blob.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function renderGrid() {
    var list = filtered();
    grid.innerHTML = list.map(function (s) { return cardHtml(s, true); }).join('');
    countEl.textContent = list.length + ' affiché(s)';
  }

  totalEl.textContent = String(official.count || official.symbols.length);
  fillCategoryFilter();
  renderCanonical();
  renderGrid();

  search.addEventListener('input', renderGrid);
  catSel.addEventListener('change', renderGrid);
  pageSel.addEventListener('change', renderGrid);
})();
