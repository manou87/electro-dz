/**
 * Page unifilaire-auto — aperçu SVG pro (gabarit bureau d’études).
 */
(function () {
  var U = window.ElectroDzUnifilarFromBalance;
  var STORAGE_REPORT = 'electrodz-unifilar-source-report-v1';

  var previewEl = document.getElementById('unifPreview');
  var tableBody = document.getElementById('unifTableBody');
  var boardSelect = document.getElementById('unifBoardSelect');
  var emptyEl = document.getElementById('unifEmpty');
  var contentEl = document.getElementById('unifContent');

  var project = null;
  var sourceReport = null;

  function t(key) {
    return window.UnifilarAutoI18n ? window.UnifilarAutoI18n.t(key) : key;
  }

  function loadSourceReport() {
    try {
      var raw = sessionStorage.getItem(STORAGE_REPORT) || localStorage.getItem(STORAGE_REPORT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function rebuildBoardSelect() {
    if (!boardSelect || !sourceReport) return;
    var boards = U.listBoardsFromReport(sourceReport);
    boardSelect.innerHTML = boards
      .map(function (b) {
        return '<option value="' + b.replace(/"/g, '&quot;') + '">' + b + '</option>';
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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

  function refreshPreview() {
    if (!previewEl || !project) return;
    if (!window.ElectroDzUnifilarProSvg) {
      previewEl.innerHTML =
        '<p style="color:#b91c1c;padding:16px">Module unifilaire pro non chargé. Rechargez la page (Ctrl+F5).</p>';
      return;
    }
    U.saveProject(project);
    previewEl.innerHTML =
      '<div class="unif-svg-pro-wrap">' + (U.projectToSvgPro ? U.projectToSvgPro(project) : '') + '</div>';
  }

  function generateFromBoard() {
    var board = boardSelect ? boardSelect.value : '';
    var built = U.buildProjectFromReport(sourceReport, board === '—' ? '' : board);
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

  function openEditor() {
    if (!project) return;
    try {
      if (U.projectToDrawioXml) {
        localStorage.setItem(U.STORAGE_DRAWIO, U.projectToDrawioXml(project));
      }
    } catch (e) {}
    window.location.href = 'schemas-plans.html?from=unifilar';
  }

  function printSvg() {
    if (!project || !U.projectToSvgPro) return;
    var w = window.open('', '_blank');
    if (!w) {
      alert('Autorisez les fenêtres popup pour imprimer.');
      return;
    }
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unifilaire</title>' +
        '<style>body{margin:12mm}svg{max-width:100%;height:auto}</style></head><body>' +
        U.projectToSvgPro(project) +
        '<script>onload=function(){setTimeout(function(){print()},400)}<\/script></body></html>'
    );
    w.document.close();
  }

  function initFromStorage() {
    if (U.purgeLegacyUnifilarCache) U.purgeLegacyUnifilarCache();
    var forceFresh = /[?&]fresh=1/.test(window.location.search || '');
    sourceReport = loadSourceReport();
    project = forceFresh ? null : U.loadProject();
    if (project && project.circuits && project.circuits.length && !forceFresh) {
      showContent(true);
      if (sourceReport) rebuildBoardSelect();
      renderTable();
      refreshPreview();
      return;
    }
    if (sourceReport && sourceReport.r && sourceReport.r.ok) {
      rebuildBoardSelect();
      generateFromBoard();
      showContent(true);
      if (forceFresh && history.replaceState) {
        history.replaceState(null, '', 'unifilaire-auto.html');
      }
      return;
    }
    showContent(false);
  }

  document.getElementById('btnUnifRegen')?.addEventListener('click', generateFromBoard);
  boardSelect?.addEventListener('change', generateFromBoard);
  document.getElementById('btnUnifEditor')?.addEventListener('click', openEditor);
  document.getElementById('btnUnifPrint')?.addEventListener('click', printSvg);

  document.getElementById('btnUnifBackCalc')?.addEventListener('click', function () {
    window.location.href = 'calcul-electrique.html#balance';
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromStorage);
  } else {
    initFromStorage();
  }
})();
