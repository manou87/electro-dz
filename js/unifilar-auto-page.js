/**
 * Page unifilaire-auto.html
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

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function refreshPreview() {
    if (!previewEl || !project) return;
    previewEl.innerHTML = U.projectToSvg(project);
    U.saveProject(project);
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

  function initFromStorage() {
    project = U.loadProject();
    sourceReport = loadSourceReport();
    if (project && project.circuits && project.circuits.length) {
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
      return;
    }
    showContent(false);
  }

  document.getElementById('btnUnifRegen')?.addEventListener('click', generateFromBoard);
  boardSelect?.addEventListener('change', generateFromBoard);

  document.getElementById('btnUnifEditor')?.addEventListener('click', function () {
    if (!project) return;
    try {
      localStorage.setItem(U.STORAGE_DRAWIO, U.projectToDrawioXml(project));
    } catch (e) {}
    window.location.href = 'schemas-plans.html?from=unifilar';
  });

  document.getElementById('btnUnifPrint')?.addEventListener('click', function () {
    if (!project) return;
    var w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
        escapeHtml(project.board) +
        '</title><style>body{margin:16px;font-family:system-ui}@media print{margin:8mm}</style></head><body>' +
        U.projectToSvg(project) +
        '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>'
    );
    w.document.close();
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
