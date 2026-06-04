/**
 * Page unifilaire-auto.html — aperçu diagrams.net (même moteur que draw.io pro).
 */
(function () {
  var U = window.ElectroDzUnifilarFromBalance;
  var STORAGE_REPORT = 'electrodz-unifilar-source-report-v1';
  var EMBED_ORIGIN = 'https://embed.diagrams.net';

  var previewEl = document.getElementById('unifPreview');
  var drawioFrame = document.getElementById('unifDrawioFrame');
  var previewLoading = document.getElementById('unifPreviewLoading');
  var tableBody = document.getElementById('unifTableBody');
  var boardSelect = document.getElementById('unifBoardSelect');
  var emptyEl = document.getElementById('unifEmpty');
  var contentEl = document.getElementById('unifContent');

  var project = null;
  var sourceReport = null;
  var embedReady = false;
  var embedQueue = [];

  function t(key) {
    return window.UnifilarAutoI18n ? window.UnifilarAutoI18n.t(key) : key;
  }

  function lang() {
    return window.UnifilarAutoI18n && window.UnifilarAutoI18n.lang === 'ar' ? 'ar' : 'fr';
  }

  function postEmbed(msg) {
    if (!drawioFrame || !drawioFrame.contentWindow) return;
    drawioFrame.contentWindow.postMessage(JSON.stringify(msg), EMBED_ORIGIN);
  }

  function whenEmbedReady(msg) {
    if (embedReady) postEmbed(msg);
    else embedQueue.push(msg);
  }

  function flushEmbedQueue() {
    embedQueue.forEach(postEmbed);
    embedQueue = [];
  }

  function embedUrl() {
    var u = new URL(EMBED_ORIGIN + '/');
    u.searchParams.set('embed', '1');
    u.searchParams.set('proto', 'json');
    u.searchParams.set('spin', '1');
    u.searchParams.set('libraries', '1');
    u.searchParams.set('configure', '1');
    u.searchParams.set('noSaveBtn', '1');
    u.searchParams.set('noExitBtn', '1');
    u.searchParams.set('saveAndExit', '0');
    u.searchParams.set('ui', 'min');
    u.searchParams.set('lang', lang() === 'ar' ? 'ar' : 'fr');
    return u.toString();
  }

  function loadPreviewInEmbed() {
    if (!project || !U) return;
    var xml = U.projectToDrawioXml(project);
    if (!xml || xml.indexOf('mxgraph.electrical') === -1) {
      if (previewLoading) {
        previewLoading.textContent = 'Moteur draw.io non chargé — rechargez la page (Ctrl+F5).';
      }
      return;
    }
    whenEmbedReady({
      action: 'load',
      xml: xml,
      autosave: 0,
      modified: false,
      editable: false,
      libs: 'electrical',
      title: project.board || 'Unifilaire',
    });
  }

  function initEmbedOnce() {
    if (!drawioFrame || drawioFrame.dataset.init === '1') return;
    drawioFrame.dataset.init = '1';
    drawioFrame.removeAttribute('hidden');
    drawioFrame.src = embedUrl();
    window.addEventListener('message', function (evt) {
      if (evt.origin !== EMBED_ORIGIN) return;
      var msg;
      try {
        msg = JSON.parse(evt.data);
      } catch (e) {
        return;
      }
      if (msg.event === 'configure') {
        postEmbed({
          action: 'configure',
          config: { defaultLibraries: 'electrical' },
        });
        return;
      }
      if (msg.event === 'init') {
        embedReady = true;
        if (previewLoading) previewLoading.hidden = true;
        flushEmbedQueue();
        loadPreviewInEmbed();
        return;
      }
      if (msg.event === 'load') {
        if (previewLoading) previewLoading.hidden = true;
      }
    });
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
    if (!project) return;
    if (!window.ElectroDzUnifilarDrawio) {
      if (previewEl) {
        previewEl.innerHTML =
          '<p style="color:#b91c1c;padding:12px">Bibliothèque draw.io manquante. Rechargez la page.</p>';
      }
      return;
    }
    U.saveProject(project);
    initEmbedOnce();
    if (embedReady) loadPreviewInEmbed();
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
      localStorage.setItem(U.STORAGE_DRAWIO, U.projectToDrawioXml(project));
    } catch (e) {}
    window.location.href = 'schemas-plans.html?from=unifilar';
  }

  function initFromStorage() {
    if (U.purgeLegacyUnifilarCache) U.purgeLegacyUnifilarCache();
    var forceFresh = /[?&]fresh=1/.test(window.location.search || '');
    sourceReport = loadSourceReport();
    project = forceFresh ? null : U.loadProject();
    if (project && project.circuits && project.circuits.length && !forceFresh) {
      showContent(true);
      renderTable();
      refreshPreview();
      if (sourceReport) rebuildBoardSelect();
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
  document.getElementById('btnUnifPrint')?.addEventListener('click', openEditor);

  document.getElementById('btnUnifBackCalc')?.addEventListener('click', function () {
    window.location.href = 'calcul-electrique.html#balance';
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromStorage);
  } else {
    initFromStorage();
  }
})();
