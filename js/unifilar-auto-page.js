/**
 * Page unifilaire-auto — aperçu SVG pro + projets enregistrés (compte / local).
 */
(function () {
  var U = window.ElectroDzUnifilarFromBalance;
  var STORAGE_REPORT = 'electrodz-unifilar-source-report-v1';
  var LOCAL_SAVES = 'electrodz-unifilar-saved-v1';
  var MAX_SAVED = 30;

  var previewEl = document.getElementById('unifPreview');
  var tableBody = document.getElementById('unifTableBody');
  var boardSelect = document.getElementById('unifBoardSelect');
  var emptyEl = document.getElementById('unifEmpty');
  var contentEl = document.getElementById('unifContent');

  var project = null;
  var sourceReport = null;
  var savedState = { loggedIn: false, items: [] };

  function t(key) {
    return window.UnifilarAutoI18n ? window.UnifilarAutoI18n.t(key) : key;
  }

  function localeTag() {
    var lang = window.UnifilarAutoI18n && window.UnifilarAutoI18n.lang;
    if (lang === 'ar') return 'ar-DZ';
    if (lang === 'en') return 'en-GB';
    return 'fr-FR';
  }

  function unifApi() {
    return window.ElectroDzSavedUnifilar || null;
  }

  function loadSourceReport() {
    try {
      var raw = sessionStorage.getItem(STORAGE_REPORT) || localStorage.getItem(STORAGE_REPORT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function loadSavedListLocal() {
    try {
      var raw = localStorage.getItem(LOCAL_SAVES);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function writeSavedListLocal(list) {
    try {
      localStorage.setItem(LOCAL_SAVES, JSON.stringify((list || []).slice(0, MAX_SAVED)));
    } catch (_) {
      alert(t('save.errStorage'));
    }
  }

  function setSavedStatus(msg) {
    var el = document.getElementById('unif-saved-status');
    if (el) el.textContent = msg || '';
  }

  function updateSavedTitle() {
    var el = document.querySelector('#unif-saved-dock .unif-saved-title');
    if (!el) return;
    var key = savedState.loggedIn ? 'saved.title' : 'saved.titleLocal';
    el.setAttribute('data-i18n', key);
    el.textContent = t(key);
  }

  function paintSavedSelect(selectedId) {
    var sel = document.getElementById('unif-saved-select');
    if (!sel) return;
    var list = (savedState.items || [])
      .slice()
      .sort(function (a, b) {
        return String(b.savedAt || '').localeCompare(String(a.savedAt || ''));
      });
    var pickLabel = t('saved.pick');
    sel.innerHTML =
      '<option value="">' +
      escapeHtml(pickLabel) +
      '</option>' +
      list
        .map(function (item) {
          var label = item.name || item.id;
          var date = item.savedAt
            ? new Date(item.savedAt).toLocaleString(localeTag(), {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : '';
          return (
            '<option value="' +
            escapeHtml(item.id) +
            '"' +
            (item.id === selectedId ? ' selected' : '') +
            '>' +
            escapeHtml(label) +
            (date ? ' · ' + escapeHtml(date) : '') +
            '</option>'
          );
        })
        .join('');
    updateSavedTitle();
  }

  async function refreshSavedSelect(selectedId) {
    var api = unifApi();
    try {
      if (api) {
        savedState = await api.list();
      } else {
        savedState = { loggedIn: false, items: loadSavedListLocal() };
      }
    } catch (_) {
      savedState = { loggedIn: false, items: loadSavedListLocal() };
      setSavedStatus(t('save.errCloud'));
    }
    paintSavedSelect(selectedId || '');
  }

  function defaultSaveName() {
    var base =
      (project && project.meta && (project.meta.ref || project.meta.client || project.meta.site)) ||
      (project && project.board) ||
      t('save.defaultName');
    var d = new Date().toLocaleDateString(localeTag());
    return base + ' — ' + d;
  }

  function applyLoadedProject(proj) {
    if (!proj || !proj.circuits || !proj.circuits.length) return false;
    project = proj;
    if (U.saveProject) U.saveProject(project);
    showContent(true);
    renderTable();
    refreshPreview();
    return true;
  }

  function rebuildBoardSelect() {
    if (!boardSelect || !sourceReport) return;
    var boards = U.listBoardsFromReport(sourceReport);
    var allLabel = t('board.all');
    var opts =
      '<option value="__ALL__">' +
      escapeHtml(allLabel) +
      '</option>' +
      boards
        .map(function (b) {
          return '<option value="' + b.replace(/"/g, '&quot;') + '">' + escapeHtml(b) + '</option>';
        })
        .join('');
    boardSelect.innerHTML = opts;
    boardSelect.value = '__ALL__';
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTable() {
    if (!tableBody || !project) return;
    tableBody.innerHTML = project.circuits
      .map(function (c, i) {
        return (
          '<tr data-idx="' +
          i +
          '">' +
          '<td>' +
          escapeHtml(c.schemaRef) +
          '</td>' +
          '<td>' +
          escapeHtml(c.label) +
          '</td>' +
          '<td>' +
          c.pdemW +
          ' W</td>' +
          '<td>' +
          c.ibA +
          ' A</td>' +
          '<td><input type="number" min="6" max="125" step="1" class="unif-in" value="' +
          c.inA +
          '" data-idx="' +
          i +
          '"></td>' +
          '</tr>'
        );
      })
      .join('');

    tableBody.querySelectorAll('.unif-in').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var idx = parseInt(inp.getAttribute('data-idx'), 10);
        var v = parseInt(inp.value, 10);
        if (project.circuits[idx] && v >= 6) {
          project.circuits[idx].inA = v;
          refreshPreview();
          U.saveProject(project);
        }
      });
    });
  }

  function legendOnceHtml() {
    var bust = '20260906legcompact2';
    /* Une seule planche compacte N/B : tous les pictos en petits tampons */
    var items = [
      { file: 'disjoncteur-1p.png', key: 'legend.item.dj' },
      { file: 'ddr-id.png', key: 'legend.item.ddr' },
      { file: 'rcbo.png', key: 'legend.item.rcbo' },
      { file: 'contact-no.png', key: 'legend.item.no' },
      { file: 'contact-nc.png', key: 'legend.item.nc' },
      { file: 'bobine.png', key: 'legend.item.coil' },
      { file: 'eclairage.png', key: 'legend.item.lamp' },
      { file: 'prise.png', key: 'legend.item.socket' },
      { file: 'chauffage.png', key: 'legend.item.heat' },
      { file: 'ecs.png', key: 'legend.item.ecs' },
      { file: 'cuisiniere.png', key: 'legend.item.cooker' },
      { file: 'four.png', key: 'legend.item.oven' },
      { file: 'lave_vaisselle.png', key: 'legend.item.dishwasher' },
      { file: 'lave_linge.png', key: 'legend.item.washing' },
      { file: 'seche_linge.png', key: 'legend.item.dryer' },
      { file: 'vmc.png', key: 'legend.item.vmc' },
      { file: 'pompe.png', key: 'legend.item.pump' },
      { file: 'moteur.png', key: 'legend.item.motor' },
      { file: 'ascenseur.png', key: 'legend.item.lift' },
      { file: 'borne_ve.png', key: 'legend.item.ev' },
      { file: 'souder.png', key: 'legend.item.weld' },
    ];
    var figs = items
      .map(function (it) {
        return (
          '<figure class="unif-legend-pro-cell">' +
          '<img src="assets/unifilar/legend/symbols/' +
          it.file +
          '?v=' +
          bust +
          '" width="32" height="32" alt="' +
          escapeHtml(t(it.key)) +
          '" decoding="async"/>' +
          '<figcaption>' +
          escapeHtml(t(it.key)) +
          '</figcaption></figure>'
        );
      })
      .join('');
    return (
      '<section class="unif-legend-pro" aria-label="' +
      escapeHtml(t('legend.title')) +
      '">' +
      '<div class="unif-legend-pro-sheet">' +
      '<h3 class="unif-legend-pro-title">' +
      escapeHtml(t('legend.title')) +
      '</h3>' +
      '<div class="unif-legend-pro-grid">' +
      figs +
      '</div></div></section>'
    );
  }

  function refreshPreview() {
    if (!previewEl || !project) return;
    if (!window.ElectroDzUnifilarProSvg) {
      previewEl.innerHTML =
        '<p style="color:#b91c1c;padding:16px">Module unifilaire pro non chargé. Rechargez la page (Ctrl+F5).</p>';
      return;
    }
    U.saveProject(project);

    var board = boardSelect ? boardSelect.value : '__ALL__';
    var wantAll = !board || board === '__ALL__';
    var boards =
      wantAll && sourceReport && U.listBoardsFromReport
        ? U.listBoardsFromReport(sourceReport)
        : [];

    if (wantAll && boards.length > 1) {
      previewEl.innerHTML =
        boards
          .map(function (b) {
            var built = U.buildProjectFromReport(sourceReport, b);
            if (built.error || !built.circuits || !built.circuits.length) return '';
            return (
              '<div class="unif-svg-pro-wrap unif-board-block">' +
              '<h3 class="unif-board-title">' +
              escapeHtml(b) +
              ' · ' +
              built.circuits.length +
              ' ' +
              escapeHtml(t('svg.loads')) +
              '</h3>' +
              (U.projectToSvgPro ? U.projectToSvgPro(built) : '') +
              '</div>'
            );
          })
          .join('') + legendOnceHtml();
      return;
    }

    previewEl.innerHTML =
      '<div class="unif-svg-pro-wrap">' +
      (U.projectToSvgPro ? U.projectToSvgPro(project) : '') +
      '</div>' +
      legendOnceHtml();
  }

  function generateFromBoard() {
    var board = boardSelect ? boardSelect.value : '__ALL__';
    var filter = !board || board === '__ALL__' ? '' : board;
    var built = U.buildProjectFromReport(sourceReport, filter);
    if (built.error) {
      alert(t('errGenerate'));
      return;
    }
    project = built;
    U.saveProject(project);
    renderTable();
    refreshPreview();
  }

  function showContent(show) {
    if (emptyEl) emptyEl.hidden = show;
    if (contentEl) contentEl.hidden = !show;
  }

  function printSvg() {
    if (!project) return;
    var P = window.ElectroDzUnifilarProSvg;
    var board = boardSelect ? boardSelect.value : '__ALL__';
    var wantAll = !board || board === '__ALL__';
    var boards =
      wantAll && sourceReport && U.listBoardsFromReport
        ? U.listBoardsFromReport(sourceReport)
        : [];

    if (wantAll && boards.length > 1 && P && P.openPrint) {
      var w = window.open('', '_blank');
      if (!w) {
        alert('Autorisez les fenêtres popup pour imprimer.');
        return;
      }
      var chunks = boards
        .map(function (b, i) {
          var built = U.buildProjectFromReport(sourceReport, b);
          if (built.error) return '';
          var html = P.buildPrintHtml(built, 'SwissDZ', { includeLegend: false });
          var body = html.replace(/^[\s\S]*<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '');
          return (
            (i ? '<div style="page-break-before:always"></div>' : '') +
            '<h1 style="font-size:15px;margin:0 0 8px">' +
            escapeHtml(b) +
            '</h1>' +
            body
          );
        })
        .join('');
      w.document.write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unifilaire</title>' +
          '<style>body{margin:12mm;font-family:Arial,sans-serif}svg{max-width:100%;height:auto}</style></head><body>' +
          chunks +
          (function () {
            var base = (location.href || '').replace(/[^/]*$/, '');
            var legendItems = [
              ['symbols/disjoncteur-1p.png', 'Disjoncteur'],
              ['symbols/ddr-id.png', 'DDR'],
              ['symbols/rcbo.png', 'RCBO'],
              ['symbols/contact-no.png', 'Contact NO'],
              ['symbols/contact-nc.png', 'Contact NC'],
              ['symbols/bobine.png', 'Bobine'],
              ['symbols/eclairage.png', 'Éclairage'],
              ['symbols/prise.png', 'Prise'],
              ['symbols/chauffage.png', 'Chauffage'],
              ['symbols/ecs.png', 'Chauffe-eau'],
              ['symbols/cuisiniere.png', 'Cuisinière'],
              ['symbols/four.png', 'Four'],
              ['symbols/lave_vaisselle.png', 'Lave-vaisselle'],
              ['symbols/lave_linge.png', 'Lave-linge'],
              ['symbols/seche_linge.png', 'Sèche-linge'],
              ['symbols/vmc.png', 'VMC'],
              ['symbols/pompe.png', 'Pompe'],
              ['symbols/moteur.png', 'Moteur'],
              ['symbols/ascenseur.png', 'Ascenseur'],
              ['symbols/borne_ve.png', 'Borne VE'],
              ['symbols/souder.png', 'Poste à souder'],
            ];
            return (
              '<div style="margin-top:12px;page-break-inside:avoid;border:1.5px solid #000;padding:8px 10px;background:#fff;color:#000;max-width:640px">' +
              '<h2 style="font-size:11px;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #000;text-transform:uppercase">Légende</h2>' +
              '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px 6px">' +
              legendItems
                .map(function (it) {
                  return (
                    '<figure style="margin:0;text-align:center">' +
                    '<img src="' +
                    base +
                    'assets/unifilar/legend/' +
                    it[0] +
                    '?v=20260906legcompact2" alt="" style="display:block;width:32px;height:32px;margin:0 auto 2px;object-fit:contain"/>' +
                    '<figcaption style="font-size:8px;font-weight:600;color:#000;line-height:1.15">' +
                    it[1] +
                    '</figcaption></figure>'
                  );
                })
                .join('') +
              '</div></div>'
            );
          })() +
          '<script>onload=function(){setTimeout(function(){print()},400)}<\/script></body></html>'
      );
      w.document.close();
      return;
    }

    if (P && P.openPrint) {
      if (!P.openPrint(project, 'SwissDZ')) {
        alert('Autorisez les fenêtres popup pour imprimer.');
      }
      return;
    }
    if (!U.projectToSvgPro) return;
    var w2 = window.open('', '_blank');
    if (!w2) {
      alert('Autorisez les fenêtres popup pour imprimer.');
      return;
    }
    w2.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unifilaire</title>' +
        '<style>body{margin:12mm}svg{max-width:100%;height:auto}</style></head><body>' +
        U.projectToSvgPro(project) +
        '<script>onload=function(){setTimeout(function(){print()},400)}<\/script></body></html>'
    );
    w2.document.close();
  }

  async function saveUnifilarLocal(name) {
    var api = unifApi();
    var entry = {
      id: 'uni-' + Date.now(),
      name: name,
      savedAt: new Date().toISOString(),
      project: project,
    };
    try {
      if (api && api.saveLocal) {
        var res = api.saveLocal(entry);
        await refreshSavedSelect((res.item && res.item.id) || entry.id);
      } else {
        var list = loadSavedListLocal();
        list.unshift(entry);
        writeSavedListLocal(list);
        await refreshSavedSelect(entry.id);
      }
      setSavedStatus(t('save.okLocal').replace('{name}', name));
    } catch (_) {
      alert(t('save.errStorage'));
    }
  }

  async function saveUnifilar() {
    if (!project || !project.circuits || !project.circuits.length) {
      alert(t('save.needProject'));
      return;
    }

    var api = unifApi();
    var session = null;
    try {
      session = api ? await api.getSession() : null;
    } catch (_) {
      session = null;
    }

    if (!session) {
      var goLogin = window.confirm(t('save.needLogin'));
      if (goLogin) {
        location.href =
          (api && api.loginUrl && api.loginUrl()) ||
          'login.html?redirect=' +
            encodeURIComponent(location.pathname + location.search + location.hash);
        return;
      }
      var nameLocal = window.prompt(t('save.prompt'), defaultSaveName());
      if (nameLocal == null) return;
      await saveUnifilarLocal(nameLocal.trim() || defaultSaveName());
      return;
    }

    var nameIn = window.prompt(t('save.prompt'), defaultSaveName());
    if (nameIn == null) return;
    var name = nameIn.trim() || defaultSaveName();
    var entry = {
      name: name,
      savedAt: new Date().toISOString(),
      project: project,
    };

    try {
      var res = await api.save(entry);
      if (res && res.needLogin) {
        location.href = api.loginUrl();
        return;
      }
      if (!res || !res.ok) throw new Error('save_failed');
      await refreshSavedSelect((res.item && res.item.id) || '');
      setSavedStatus(t('save.ok').replace('{name}', name));
    } catch (_) {
      alert(t('save.errCloud'));
    }
  }

  async function loadUnifilar() {
    var sel = document.getElementById('unif-saved-select');
    var id = sel && sel.value;
    if (!id) {
      alert(t('load.pick'));
      return;
    }
    var item = (savedState.items || []).find(function (x) {
      return x.id === id;
    });
    if (!item || !item.project) {
      try {
        var api = unifApi();
        item = (api && api.getById && (await api.getById(id))) || null;
      } catch (_) {
        item = null;
      }
    }
    if (!item || !item.project) {
      alert(t('load.err'));
      return;
    }
    if (!applyLoadedProject(item.project)) {
      alert(t('load.err'));
      return;
    }
    await refreshSavedSelect(id);
    setSavedStatus(t('load.ok').replace('{name}', item.name || id));
  }

  async function deleteUnifilar() {
    var sel = document.getElementById('unif-saved-select');
    var id = sel && sel.value;
    if (!id) {
      alert(t('load.pick'));
      return;
    }
    if (!confirm(t('delete.confirm'))) return;
    var api = unifApi();
    try {
      if (api) {
        await api.remove(id);
      } else {
        writeSavedListLocal(
          loadSavedListLocal().filter(function (x) {
            return x.id !== id;
          })
        );
      }
      await refreshSavedSelect('');
      setSavedStatus(t('delete.ok'));
    } catch (_) {
      alert(t('save.errCloud'));
    }
  }

  function loadDemoVilla() {
    var Demo = window.ElectroDzUnifilarDemoVilla;
    if (!Demo || !U) {
      alert(t('demo.err'));
      return;
    }
    var report = Demo.buildDemoReport();
    if (!Demo.persistDemoReport(report)) {
      alert(t('demo.err'));
      return;
    }
    sourceReport = report;
    rebuildBoardSelect();
    generateFromBoard();
    showContent(true);
    setSavedStatus(t('demo.ok'));
    if (history.replaceState) {
      history.replaceState(null, '', 'unifilaire-auto.html?demo=1');
    }
  }

  function initFromStorage() {
    if (U.purgeLegacyUnifilarCache) U.purgeLegacyUnifilarCache();
    var forceFresh = /[?&]fresh=1/.test(window.location.search || '');
    var wantDemo = /[?&]demo=1/.test(window.location.search || '');
    sourceReport = loadSourceReport();
    project = forceFresh ? null : U.loadProject();

    if (wantDemo) {
      loadDemoVilla();
      refreshSavedSelect('');
      return;
    }

    // Toujours reconstruire depuis le bilan s'il est dispo (évite un schéma
    // obsolète filtré sur un seul tableau).
    if (sourceReport && sourceReport.r && sourceReport.r.ok) {
      rebuildBoardSelect();
      generateFromBoard();
      showContent(true);
      if (forceFresh && history.replaceState) {
        history.replaceState(null, '', 'unifilaire-auto.html');
      }
      refreshSavedSelect('');
      return;
    }

    if (project && project.circuits && project.circuits.length) {
      showContent(true);
      renderTable();
      refreshPreview();
      refreshSavedSelect('');
      return;
    }
    showContent(false);
    refreshSavedSelect('');
  }

  document.getElementById('btnUnifDemo')?.addEventListener('click', loadDemoVilla);
  document.getElementById('btnUnifDemoEmpty')?.addEventListener('click', loadDemoVilla);
  document.getElementById('btnUnifRegen')?.addEventListener('click', generateFromBoard);
  boardSelect?.addEventListener('change', generateFromBoard);
  document.getElementById('btnUnifPrint')?.addEventListener('click', printSvg);
  document.getElementById('unif-save-btn')?.addEventListener('click', function () {
    saveUnifilar().catch(function () {});
  });
  document.getElementById('unif-load-btn')?.addEventListener('click', function () {
    loadUnifilar().catch(function () {});
  });
  document.getElementById('unif-delete-save-btn')?.addEventListener('click', function () {
    deleteUnifilar().catch(function () {});
  });
  document.addEventListener('electrodz-lang-changed', function () {
    if (sourceReport) rebuildBoardSelect();
    if (project) {
      renderTable();
      refreshPreview();
    }
    paintSavedSelect(document.getElementById('unif-saved-select')?.value || '');
  });

  document.getElementById('btnUnifBackCalc')?.addEventListener('click', function () {
    window.location.href = 'calcul-electrique.html#balance';
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromStorage);
  } else {
    initFromStorage();
  }
})();
