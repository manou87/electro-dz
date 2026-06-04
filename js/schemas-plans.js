/**
 * Schémas et plans — intégration diagrams.net (draw.io) en mode embed
 * https://www.diagrams.net/doc/faq/embed-mode
 */
(function () {
  var EMBED_ORIGIN = "https://embed.diagrams.net";
  var STORAGE_DRAFT = "electrodz-drawio-draft-v1";
  var STORAGE_META = "electrodz-drawio-meta-v1";
  var STARTER_URL = "data/schemas/starter.drawio.xml";

  var iframe = document.getElementById("drawioFrame");
  var loadingEl = document.getElementById("schemasLoading");
  var statusEl = document.getElementById("schemasStatus");
  var fileInput = document.getElementById("schemaFileInput");
  var metaPanel = document.getElementById("schemasMetaPanel");

  var editorReady = false;
  var queue = [];
  var starterXml = null;
  var exportPending = null;

  function t(key) {
    return window.SchemasPlansI18n ? window.SchemasPlansI18n.t(key) : key;
  }

  function lang() {
    return window.SchemasPlansI18n ? window.SchemasPlansI18n.getLang() : "fr";
  }

  function setStatus(mode) {
    if (!statusEl) return;
    statusEl.classList.remove("is-dirty", "is-ok");
    if (mode === "dirty") {
      statusEl.textContent = t("status.dirty");
      statusEl.classList.add("is-dirty");
    } else if (mode === "saved") {
      statusEl.textContent = t("status.saved");
      statusEl.classList.add("is-ok");
    } else {
      statusEl.textContent = t("status.ready");
    }
  }

  function post(msg) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify(msg), EMBED_ORIGIN);
  }

  function whenReady(msg) {
    if (editorReady) post(msg);
    else queue.push(msg);
  }

  function flushQueue() {
    queue.forEach(post);
    queue = [];
  }

  function embedBaseUrl() {
    var u = new URL(EMBED_ORIGIN + "/");
    u.searchParams.set("embed", "1");
    u.searchParams.set("proto", "json");
    u.searchParams.set("spin", "1");
    u.searchParams.set("libraries", "1");
    u.searchParams.set("configure", "1");
    u.searchParams.set("noSaveBtn", "1");
    u.searchParams.set("noExitBtn", "1");
    u.searchParams.set("saveAndExit", "0");
    u.searchParams.set("clibs", "0");
    u.searchParams.set("lang", lang() === "ar" ? "ar" : "fr");
    return u.toString();
  }

  function getMeta() {
    var fields = ["project", "client", "site", "author", "date", "notes"];
    var meta = {};
    fields.forEach(function (name) {
      var el = document.querySelector('[data-meta="' + name + '"]');
      meta[name] = el ? el.value.trim() : "";
    });
    return meta;
  }

  function saveMeta() {
    try {
      localStorage.setItem(STORAGE_META, JSON.stringify(getMeta()));
    } catch (e) {}
  }

  function loadMeta() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_META);
    } catch (e) {}
    if (!raw) return;
    try {
      var meta = JSON.parse(raw);
      Object.keys(meta).forEach(function (key) {
        var el = document.querySelector('[data-meta="' + key + '"]');
        if (el) el.value = meta[key] || "";
      });
    } catch (e2) {}
  }

  function loadStarter() {
    if (starterXml) return Promise.resolve(starterXml);
    return fetch(STARTER_URL, { cache: "no-store" })
      .then(function (r) {
        return r.text();
      })
      .then(function (xml) {
        starterXml = xml;
        return xml;
      })
      .catch(function () {
        starterXml =
          '<mxfile><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';
        return starterXml;
      });
  }

  function diagramTitle() {
    var m = getMeta();
    return m.project || t("page.title");
  }

  function loadIntoEditor(xml, opts) {
    opts = opts || {};
    whenReady({
      action: "load",
      xml: xml,
      autosave: opts.autosave !== undefined ? opts.autosave : 1,
      modified: opts.modified !== undefined ? opts.modified : "modified",
      title: diagramTitle(),
      libs: opts.libs !== undefined ? opts.libs : "electrical;general;floorplan;signs;networking",
      exportProtocol: true,
    });
  }

  function syncMetaFromUnifilarProject() {
    try {
      var raw =
        localStorage.getItem("electrodz-unifilar-project-v2") ||
        localStorage.getItem("electrodz-unifilar-project-v1");
      if (!raw) return;
      var proj = JSON.parse(raw);
      var m = proj.meta || {};
      var map = {
        project: m.ref,
        client: m.client,
        site: m.site,
        author: m.engineer,
      };
      Object.keys(map).forEach(function (key) {
        var el = document.querySelector('[data-meta="' + key + '"]');
        if (el && map[key]) el.value = map[key];
      });
    } catch (e) {}
  }

  function purgeLegacyUnifilarStorage() {
    ["electrodz-unifilar-project-v1", "electrodz-unifilar-drawio-v1"].forEach(function (k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
  }

  function loadUnifilarXmlFresh() {
    var U = window.ElectroDzUnifilarFromBalance;
    if (!U || !window.ElectroDzIecSymbols) return null;
    purgeLegacyUnifilarStorage();
    var proj = U.loadProject();
    if (!proj || !proj.circuits || !proj.circuits.length) return null;
    var xml = U.projectToDrawioXml(proj);
    try {
      localStorage.setItem(U.STORAGE_DRAWIO, xml);
    } catch (e2) {}
    return xml;
  }

  function initEditorContent() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("from") === "unifilar") {
      syncMetaFromUnifilarProject();
      var freshXml = loadUnifilarXmlFresh();
      if (freshXml && freshXml.length > 80) {
        loadIntoEditor(freshXml, { libs: "", autosave: 0, modified: false });
        return;
      }
      try {
        var unifXml = localStorage.getItem("electrodz-unifilar-drawio-v2");
        if (unifXml && unifXml.indexOf("data:image/svg+xml") !== -1 && unifXml.length > 80) {
          loadIntoEditor(unifXml, { libs: "", autosave: 0, modified: false });
          return;
        }
      } catch (e) {}
      purgeLegacyUnifilarStorage();
    }
    var draft = null;
    try {
      draft = localStorage.getItem(STORAGE_DRAFT);
    } catch (e) {}
    if (draft && draft.length > 20) {
      loadIntoEditor(draft);
      return;
    }
    loadStarter().then(loadIntoEditor);
  }

  function hideLoading() {
    if (loadingEl) loadingEl.hidden = true;
  }

  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime || "application/octet-stream" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 2000);
  }

  function slugName() {
    var m = getMeta();
    var base = m.project || "schema";
    return base.replace(/[^\w\u0600-\u06FF\-]+/g, "-").replace(/-+/g, "-") || "schema";
  }

  function handleExportResponse(msg) {
    if (!exportPending) return;
    var job = exportPending;
    exportPending = null;

    if (job.type === "save") {
      if (msg.xml) {
        try {
          localStorage.setItem(STORAGE_DRAFT, msg.xml);
        } catch (e) {}
        downloadFile(slugName() + ".drawio", msg.xml, "application/xml");
        setStatus("saved");
      }
      return;
    }

    if (job.type === "png" && msg.data) {
      downloadFromDataUri(slugName() + ".png", msg.data);
      return;
    }

    if (job.type === "svg" && (msg.data || msg.svg)) {
      if (msg.data && msg.data.indexOf("svg") !== -1) {
        downloadFromDataUri(slugName() + ".svg", msg.data);
      } else if (msg.svg) {
        downloadFile(slugName() + ".svg", msg.svg, "image/svg+xml");
      }
      return;
    }

    if (job.type === "print" && msg.data) {
      openPrintView(msg.data, job.format);
    }
  }

  function downloadFromDataUri(filename, dataUri) {
    var a = document.createElement("a");
    a.href = dataUri;
    a.download = filename;
    a.click();
  }

  function buildPrintHtml(dataUri) {
    var m = getMeta();
    var rows = [];
    if (m.project) rows.push("<tr><th>" + escapeHtml(t("meta.project")) + "</th><td>" + escapeHtml(m.project) + "</td></tr>");
    if (m.client) rows.push("<tr><th>" + escapeHtml(t("meta.client")) + "</th><td>" + escapeHtml(m.client) + "</td></tr>");
    if (m.site) rows.push("<tr><th>" + escapeHtml(t("meta.site")) + "</th><td>" + escapeHtml(m.site) + "</td></tr>");
    if (m.author) rows.push("<tr><th>" + escapeHtml(t("meta.author")) + "</th><td>" + escapeHtml(m.author) + "</td></tr>");
    if (m.date) rows.push("<tr><th>" + escapeHtml(t("meta.date")) + "</th><td>" + escapeHtml(m.date) + "</td></tr>");
    if (m.notes) rows.push("<tr><th>" + escapeHtml(t("meta.notes")) + "</th><td>" + escapeHtml(m.notes) + "</td></tr>");

    return (
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" +
      escapeHtml(t("print.title")) +
      "</title><style>" +
      "body{font-family:Segoe UI,system-ui,sans-serif;margin:24px;color:#111}" +
      "h1{font-size:1.25rem;margin:0 0 12px}" +
      "table{border-collapse:collapse;width:100%;max-width:720px;margin-bottom:20px;font-size:.9rem}" +
      "th{text-align:left;padding:6px 10px;background:#f1f5f9;width:28%}" +
      "td{padding:6px 10px;border-bottom:1px solid #e2e8f0}" +
      "img{max-width:100%;height:auto;display:block;margin:0 auto}" +
      "@media print{body{margin:12mm}}" +
      "</style></head><body>" +
      "<h1>" +
      escapeHtml(m.project || t("print.title")) +
      "</h1>" +
      (rows.length ? "<table>" + rows.join("") + "</table>" : "") +
      "<img src=\"" +
      dataUri +
      "\" alt=\"schema\" />" +
      "<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>" +
      "</body></html>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openPrintView(dataUri, format) {
    var w = window.open("", "_blank");
    if (!w) {
      alert("Autorisez les fenêtres popup pour imprimer.");
      return;
    }
    w.document.write(buildPrintHtml(dataUri));
    w.document.close();
  }

  function requestExport(type) {
    exportPending = { type: type, format: type };
    var fmt = "png";
    var extra = { scale: 2, border: 10, transparent: false };

    if (type === "svg") fmt = "svg";
    if (type === "save") fmt = "xml";
    if (type === "print" || type === "pdf") {
      fmt = "png";
      extra.scale = 2;
    }

    whenReady(
      Object.assign({ action: "export", format: fmt }, extra)
    );
  }

  window.addEventListener("message", function (evt) {
    if (evt.origin !== EMBED_ORIGIN) return;
    var msg;
    try {
      msg = JSON.parse(evt.data);
    } catch (e) {
      return;
    }

    if (msg.event === "configure") {
      post({
        action: "configure",
        config: {
          defaultLibraries: "electrical;general",
        },
      });
      return;
    }

    if (msg.event === "init") {
      editorReady = true;
      hideLoading();
      flushQueue();
      initEditorContent();
      setStatus("ready");
      return;
    }

    if (msg.event === "load") {
      hideLoading();
      setStatus("ready");
      return;
    }

    if (msg.event === "autosave") {
      if (msg.xml) {
        try {
          localStorage.setItem(STORAGE_DRAFT, msg.xml);
        } catch (e) {}
        setStatus("dirty");
      }
      return;
    }

    if (msg.event === "save") {
      if (msg.xml) {
        try {
          localStorage.setItem(STORAGE_DRAFT, msg.xml);
        } catch (e) {}
        setStatus("saved");
      }
      return;
    }

    if (msg.event === "export") {
      handleExportResponse(msg);
      return;
    }
  });

  function bindUi() {
    document.getElementById("btnSchemaNew").addEventListener("click", function () {
      if (!confirm(t("confirm.new"))) return;
      loadStarter().then(function (xml) {
        loadIntoEditor(xml);
        setStatus("dirty");
      });
    });

    document.getElementById("btnSchemaOpen").addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        loadIntoEditor(reader.result);
        setStatus("dirty");
      };
      reader.readAsText(file);
    });

    document.getElementById("btnSchemaSave").addEventListener("click", function () {
      saveMeta();
      exportPending = { type: "save" };
      whenReady({ action: "export", format: "xml" });
    });

    document.getElementById("btnSchemaPrint").addEventListener("click", function () {
      saveMeta();
      requestExport("print");
    });

    document.getElementById("btnSchemaPng").addEventListener("click", function () {
      requestExport("png");
    });

    document.getElementById("btnSchemaSvg").addEventListener("click", function () {
      requestExport("svg");
    });

    document.getElementById("btnSchemaPdf").addEventListener("click", function () {
      saveMeta();
      requestExport("print");
    });

    document.getElementById("btnSchemaMeta").addEventListener("click", function () {
      if (!metaPanel) return;
      metaPanel.hidden = !metaPanel.hidden;
    });

    document.querySelectorAll("[data-meta]").forEach(function (el) {
      el.addEventListener("change", saveMeta);
      el.addEventListener("blur", saveMeta);
    });
  }

  document.addEventListener("electrodz-lang-changed", function () {
    if (!iframe) return;
    editorReady = false;
    queue = [];
    if (loadingEl) loadingEl.hidden = false;
    iframe.src = embedBaseUrl();
  });

  function boot() {
    loadMeta();
    bindUi();
    if (iframe) iframe.src = embedBaseUrl();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
