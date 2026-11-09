/**
 * Offline API bridge for Électro Marker on static hosting.
 * Intercepts /v3.5.1/preview (+ download tokens) and /v3.5.1/marking
 * because there is no Electromarker backend — without this,
 * "Générer le fichier" and project save/download are no-ops.
 */
(function () {
  if (window.__DZ_OFFLINE_PDF__) return;
  window.__DZ_OFFLINE_PDF__ = true;

  var TOKEN_PREFIX = "/dzmarker-app/v3.5.1/__dz_offline/";
  var MARKINGS_KEY = "dz_offline_markings_v1";
  var GUEST_MARKING_KEY = "marking";
  var cache = Object.create(null);
  /** Real generated offline files (PDF/CSV) — drives "%count% fichiers disponibles". */
  var offlineFiles = [];
  window.__DZ_OFFLINE_FILES__ = offlineFiles;
  window.__DZ_OFFLINE_FILE_COUNT__ = 0;
  var origFetch = window.fetch.bind(window);

  function findStore() {
    var els = document.querySelectorAll("*");
    for (var i = 0; i < els.length; i++) {
      var vue = els[i].__vue__;
      if (!vue) continue;
      var v = vue;
      while (v && v.$parent) v = v.$parent;
      if (v && v.$store) return v.$store;
    }
    return null;
  }

  function jsonResponse(obj, status) {
    return new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  function absUrl(path) {
    try {
      return new URL(path, window.location.origin).href;
    } catch (e) {
      return path;
    }
  }

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function loadMarkingsDb() {
    var db = safeParse(localStorage.getItem(MARKINGS_KEY), null);
    if (!db || typeof db !== "object" || !Array.isArray(db.items)) {
      db = { items: [], byId: {} };
    }
    if (!db.byId || typeof db.byId !== "object") db.byId = {};
    return db;
  }

  function persistMarkingsDb(db) {
    try {
      localStorage.setItem(MARKINGS_KEY, JSON.stringify(db));
    } catch (e) {}
  }

  function countRails(payload) {
    var rails = (payload && payload.rails) || [];
    var modCount = 0;
    var idCount = 0;
    rails.forEach(function (rail) {
      var mods = rail.modules || rail.items || [];
      modCount += mods.length;
      mods.forEach(function (m) {
        if (m && (m.deviceNumber || m.textid)) idCount += 1;
      });
    });
    return {
      railsCount: rails.length,
      modCount: modCount,
      idCount: idCount,
      connCount: ((payload && payload.connections) || []).length,
      labelCount: ((payload && payload.labelsMarking) || []).length,
      cableCount: ((payload && payload.cablesMarking) || []).length,
      symbolCount: ((payload && payload.labelsMarking) || []).reduce(function (
        n,
        line
      ) {
        return (
          n +
          ((line && line.items) || []).filter(function (it) {
            return it && it.icon;
          }).length
        );
      },
      0),
      iconCount: (function () {
        var n = 0;
        rails.forEach(function (rail) {
          (rail.modules || rail.items || []).forEach(function (m) {
            if (m && m.icons && m.icons.length) n += m.icons.length;
            else if (m && m.icon) n += 1;
          });
        });
        return n;
      })()
    };
  }

  function listItemFromPayload(payload, id) {
    var counts = countRails(payload);
    return Object.assign(
      {
        id: id,
        name: (payload && payload.name) || "marking",
        date: Date.now() / 1000,
        object: (payload && payload.object) || {}
      },
      counts
    );
  }

  function downloadBlob(blob, filename) {
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {}
      }, 1500);
    } catch (e) {
      console.error("[dz-offline-save] download failed", e);
    }
  }

  function safeFileStem(payload) {
    return (
      String((payload && payload.name) || "marquage")
        .replace(/^marking\.name$/i, "marquage")
        .replace(/[^\w\-àâäéèêëïîôùûüç]+/gi, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48) || "marquage"
    );
  }

  function fileStamp() {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  }

  function parseBody(init) {
    try {
      var body = init && init.body;
      if (typeof body === "string") return JSON.parse(body);
      if (body && typeof body === "object") return body;
    } catch (e) {}
    return {};
  }

  function markingIdFromUrl(url) {
    var m = String(url).match(/\/v3\.5\.1\/marking\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function isMarkingCollection(url) {
    return /\/v3\.5\.1\/marking\/?(\?|$)/.test(String(url));
  }

  function isMarkingItem(url) {
    return /\/v3\.5\.1\/marking\/[^/?#]+/.test(String(url));
  }

  function handleMarkingRequest(url, method, init) {
    var db = loadMarkingsDb();
    var body = parseBody(init);

    if (method === "GET" && isMarkingCollection(url)) {
      return jsonResponse({ params: db.items.slice() });
    }

    if (method === "POST" && isMarkingCollection(url)) {
      var newId =
        (body && body.from_id && db.byId[body.from_id] && "dz-" + Date.now().toString(36)) ||
        "dz-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      var source =
        body && body.from_id && db.byId[body.from_id]
          ? JSON.parse(JSON.stringify(db.byId[body.from_id]))
          : body || {};
      source.id = newId;
      if (!source.name) source.name = "marking.name";
      db.byId[newId] = source;
      db.items = db.items.filter(function (x) {
        return x.id !== newId;
      });
      db.items.unshift(listItemFromPayload(source, newId));
      persistMarkingsDb(db);
      try {
        localStorage.setItem(GUEST_MARKING_KEY, JSON.stringify(source));
      } catch (e) {}
      // Persist only — never auto-download / auto-generate PDF on save or page open.
      return jsonResponse(source);
    }

    var id = markingIdFromUrl(url);
    if (!id) return jsonResponse({ error: "not found" }, 404);

    if (method === "GET") {
      if (!db.byId[id]) return jsonResponse({ error: "not found" }, 404);
      return jsonResponse(db.byId[id]);
    }

    if (method === "PUT" || method === "PATCH") {
      var prev = db.byId[id] || { id: id };
      var next = Object.assign({}, prev, body || {}, { id: id });
      db.byId[id] = next;
      var summary = listItemFromPayload(next, id);
      var idx = db.items.findIndex(function (x) {
        return x.id === id;
      });
      if (idx >= 0) db.items[idx] = summary;
      else db.items.unshift(summary);
      db.items.sort(function (a, b) {
        return (b.date || 0) - (a.date || 0);
      });
      persistMarkingsDb(db);
      try {
        localStorage.setItem(GUEST_MARKING_KEY, JSON.stringify(next));
      } catch (e) {}
      // Autosave / Enregistrer must not trigger PDF download or the ready panel.
      var counts = countRails(next);
      return jsonResponse(
        Object.assign(
          {
            saved: "yes",
            dat: summary.date
          },
          counts
        )
      );
    }

    if (method === "DELETE") {
      delete db.byId[id];
      db.items = db.items.filter(function (x) {
        return x.id !== id;
      });
      persistMarkingsDb(db);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "method" }, 405);
  }

  function waitForLibs() {
    return new Promise(function (resolve, reject) {
      var n = 0;
      (function tick() {
        if (window.jspdf && (window.jspdf.jsPDF || window.jspdf) && window.html2canvas) {
          resolve();
          return;
        }
        if (++n > 100) {
          reject(new Error("jsPDF/html2canvas unavailable"));
          return;
        }
        setTimeout(tick, 50);
      })();
    });
  }

  function captureTarget(tab) {
    tab = String(tab || "main");
    var pick = function () {
      for (var i = 0; i < arguments.length; i++) {
        var el = arguments[i];
        if (!el) continue;
        var r = el.getBoundingClientRect && el.getBoundingClientRect();
        if (r && r.width >= 8 && r.height >= 8) return el;
        if (!r && (el.scrollWidth > 8 || el.offsetWidth > 8)) return el;
      }
      return null;
    };
    if (tab === "legend") {
      return (
        pick(
          document.querySelector(".content .legend"),
          document.querySelector(".custom-legend"),
          document.querySelector(".legend"),
          document.querySelector(".rails")
        ) || document.body
      );
    }
    if (tab === "labels") {
      return (
        pick(
          document.querySelector(".content .labels"),
          document.querySelector(".labels"),
          document.querySelector(".badge"),
          document.querySelector(".content"),
          document.querySelector(".rails")
        ) || document.body
      );
    }
    if (tab === "devices") {
      return (
        pick(
          document.querySelector(".devices-and-ids"),
          document.querySelector(".content .devices"),
          document.querySelector(".devices"),
          document.querySelector(".modnumbers"),
          document.querySelector(".rails")
        ) || document.body
      );
    }
    if (tab === "wiring" || tab === "board" || tab === "cables") {
      return (
        pick(
          document.querySelector(".wiring-canvas"),
          document.querySelector("." + tab),
          document.querySelector(".content ." + tab),
          document.querySelector(".rails")
        ) || document.body
      );
    }
    return (
      pick(
        document.querySelector(".content .rails"),
        document.querySelector(".rails"),
        document.querySelector(".modnumbers"),
        document.querySelector(".content")
      ) || document.body
    );
  }

  function syncDownloadsCount() {
    window.__DZ_OFFLINE_FILE_COUNT__ = offlineFiles.length;
    try {
      var store = findStore();
      if (store && store.state && store.state.user && store.state.user.profile) {
        // Honest count for "X fichiers disponibles" — never fake 9999.
        store.state.user.profile.downloads = offlineFiles.length;
      }
    } catch (e) {}
  }

  function ensureFilesPanel() {
    var panel = document.getElementById("dz-offline-files");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "dz-offline-files";
    panel.className = "dz-offline-files";
    panel.setAttribute("aria-live", "polite");
    panel.hidden = true;
    document.body.appendChild(panel);
    return panel;
  }

  function clearFilesPanel() {
    offlineFiles = [];
    window.__DZ_OFFLINE_FILES__ = offlineFiles;
    window.__DZ_OFFLINE_FILE_COUNT__ = 0;
    var panel = document.getElementById("dz-offline-files");
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = "";
    }
    syncDownloadsCount();
  }

  function renderFilesPanel() {
    var panel = ensureFilesPanel();
    if (!offlineFiles.length) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    panel.hidden = false;
    var html =
      '<div class="dz-offline-files__head">Fichiers PDF prêts (' +
      offlineFiles.length +
      ")</div><ul class=\"dz-offline-files__list\">";
    offlineFiles.forEach(function (f, idx) {
      html +=
        '<li class="dz-offline-files__item">' +
        '<div class="dz-offline-files__meta">' +
        "<strong>" +
        (f.label || f.name) +
        "</strong>" +
        "<span>" +
        (f.tab || "main") +
        " · " +
        (f.bytes ? Math.round(f.bytes / 1024) + " Ko" : "") +
        "</span></div>" +
        '<button type="button" class="dz-offline-files__btn" data-idx="' +
        idx +
        '">Télécharger le PDF</button>' +
        "</li>";
    });
    html += "</ul>";
    panel.innerHTML = html;
    panel.onclick = function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest("[data-idx]");
      if (!btn) return;
      var i = Number(btn.getAttribute("data-idx"));
      var file = offlineFiles[i];
      if (!file) return;
      downloadBlob(file.blob, file.name);
    };
  }

  function registerOfflineFile(entry, opts) {
    opts = opts || {};
    offlineFiles = offlineFiles.filter(function (f) {
      return !(f.token === entry.token && f.kind === entry.kind);
    });
    offlineFiles.unshift(entry);
    if (offlineFiles.length > 12) offlineFiles.length = 12;
    window.__DZ_OFFLINE_FILES__ = offlineFiles;
    syncDownloadsCount();
    // Official UI file proposal = preview popup a.downloadLink (links[tab]),
    // not an invented floating "Fichiers PDF prêts" dump.
    if (opts.showPanel) {
      // Keep panel hidden — real proposal is the Electromarker downloadLink.
      var panel = document.getElementById("dz-offline-files");
      if (panel) {
        panel.hidden = true;
        panel.innerHTML = "";
      }
    }
  }

  /** Hide prepare/auth overlays so capture matches on-screen marking (icons/labels). */
  function withOverlaysHidden(run) {
    var hidden = [];
    var nodes = document.querySelectorAll(
      ".fader, .popup.getMarking, .weusecookie, .dz-offline-files, #pre_loading, #pre_lang"
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      hidden.push({
        el: el,
        visibility: el.style.visibility,
        pointerEvents: el.style.pointerEvents
      });
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
    }
    return Promise.resolve()
      .then(run)
      .then(
        function (result) {
          hidden.forEach(function (h) {
            h.el.style.visibility = h.visibility;
            h.el.style.pointerEvents = h.pointerEvents;
          });
          return result;
        },
        function (err) {
          hidden.forEach(function (h) {
            h.el.style.visibility = h.visibility;
            h.el.style.pointerEvents = h.pointerEvents;
          });
          throw err;
        }
      );
  }

  function waitForImages(root, ms) {
    root = root || document;
    var imgs = Array.prototype.slice.call(root.querySelectorAll("img"));
    var pending = imgs.map(function (img) {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(function (resolve) {
        var done = function () {
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, ms || 800);
      });
    });
    return Promise.all(pending).then(function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          setTimeout(resolve, 48);
        });
      });
    });
  }

  function previewDataUrlFromCanvas(canvas) {
    var fallback =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    if (!canvas || canvas.width < 2 || canvas.height < 2) return fallback;
    try {
      var maxW = 1200;
      var scale = Math.min(1, maxW / canvas.width);
      var w = Math.max(2, Math.round(canvas.width * scale));
      var h = Math.max(2, Math.round(canvas.height * scale));
      // Pad short captures so the order dialog does not show a 1px-tall strip.
      var outH = Math.max(h, 220);
      var out = document.createElement("canvas");
      out.width = w;
      out.height = outH;
      var ctx = out.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, outH);
      ctx.drawImage(canvas, 0, Math.floor((outH - h) / 2), w, h);
      return out.toDataURL("image/jpeg", 0.9);
    } catch (e) {
      try {
        return canvas.toDataURL("image/jpeg", 0.85);
      } catch (e2) {
        return fallback;
      }
    }
  }

  /**
   * Mirror official Electromarker download: PDF is a capture of the live
   * marking HTML/canvas (rails / legend / labels), not an invented sheet layout.
   * No schematic rail dumps, no "export hors-ligne" banners.
   */
  function buildPdfDoc(canvas) {
    var JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    var landscape =
      !canvas || !canvas.width || !canvas.height || canvas.width >= canvas.height;
    var pdf = new JsPDF({
      orientation: landscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4"
    });
    var pageW = pdf.internal.pageSize.getWidth();
    var pageH = pdf.internal.pageSize.getHeight();
    var margin = 6;

    if (canvas && canvas.width > 2 && canvas.height > 2) {
      var maxW = pageW - margin * 2;
      var maxH = pageH - margin * 2;
      var ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      var w = canvas.width * ratio;
      var h = canvas.height * ratio;
      var x = margin + (maxW - w) / 2;
      var y = margin + (maxH - h) / 2;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", x, y, w, h);
    }
    return pdf;
  }

  function buildXlsText(store) {
    var rows = [["Rail", "Index", "Type", "Nom", "In", "Courbe", "Pôles"]];
    try {
      var rails = store.state.rails.items || [];
      rails.forEach(function (rail, ri) {
        (rail.items || []).forEach(function (d, di) {
          rows.push([
            String(ri + 1),
            String(di + 1),
            d.type || "",
            d.deviceNumber || d.name || d.text || "",
            d.In != null ? String(d.In) : "",
            d.curve || "",
            d.poles || ""
          ]);
        });
      });
    } catch (e) {}
    return rows
      .map(function (r) {
        return r
          .map(function (c) {
            return '"' + String(c).replace(/"/g, '""') + '"';
          })
          .join(";");
      })
      .join("\n");
  }

  async function html2canvasSafe(target) {
    if (!target) return null;
    try {
      return await window.html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 1500,
        removeContainer: true,
        // Keep SVG/icon symbols in the print sheet (as on screen).
        foreignObjectRendering: false,
        windowWidth: Math.max(
          target.scrollWidth || 1200,
          document.documentElement.clientWidth || 1200
        ),
        ignoreElements: function (el) {
          if (!el || !el.classList) return false;
          return (
            el.classList.contains("fader") ||
            el.classList.contains("popup") ||
            el.classList.contains("auth") ||
            el.classList.contains("weusecookie") ||
            el.classList.contains("dz-offline-files") ||
            el.id === "dz-offline-files" ||
            el.id === "pre_loading" ||
            el.id === "pre_lang"
          );
        }
      });
    } catch (e) {
      return null;
    }
  }

  function activateTabForCapture(tab) {
    var store = findStore();
    if (!store || !store.state || !tab) return null;
    var prev = store.state.tab;
    if (tab !== "main" && tab !== prev) {
      try {
        store.commit("assign", { tab: tab });
      } catch (e) {
        store.state.tab = tab;
      }
    }
    return prev;
  }

  function restoreTab(prev) {
    var store = findStore();
    if (!store || !store.state || prev == null || prev === store.state.tab) return;
    try {
      store.commit("assign", { tab: prev });
    } catch (e) {
      store.state.tab = prev;
    }
  }

  async function captureMarkingCanvas(tab) {
    tab = tab || "main";
    return withOverlaysHidden(async function () {
      var prev = activateTabForCapture(tab);
      var target = captureTarget(tab);
      await waitForImages(target, 1200);
      var canvas = await html2canvasSafe(target);
      // Legend/empty tabs can yield a near-blank capture — fall back to rails.
      if (
        (!canvas || canvas.width < 8 || canvas.height < 8) &&
        tab &&
        tab !== "main"
      ) {
        var mainTarget = captureTarget("main");
        await waitForImages(mainTarget, 800);
        canvas = await html2canvasSafe(mainTarget);
      }
      restoreTab(prev);
      return canvas;
    });
  }

  /** Shared path for « Obtenir / Générer » — live marking capture only. */
  async function generatePdfBlob(tab) {
    await waitForLibs();
    var store = findStore();
    var canvas = await captureMarkingCanvas(tab);
    var pdf = buildPdfDoc(canvas);
    return {
      blob: pdf.output("blob"),
      canvas: canvas,
      store: store
    };
  }

  async function makePreviewPayload(tab) {
    tab = tab || "main";
    var gen = await generatePdfBlob(tab);
    var store = gen.store;
    var canvas = gen.canvas;
    var pdfBlob = gen.blob;
    var previewUrl = previewDataUrlFromCanvas(canvas);

    var token = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var pdfPath = TOKEN_PREFIX + token + "/pdf";
    var xlsPath = TOKEN_PREFIX + token + "/xls";
    var pdfName =
      safeFileStem(
        (store &&
          store.state &&
          store.state.markings &&
          store.state.markings.current) ||
          null
      ) +
      "-" +
      tab +
      "-" +
      fileStamp() +
      ".pdf";

    var xlsBlob = new Blob([buildXlsText(store)], {
      type: "text/csv;charset=utf-8"
    });
    var pdfFileUrl = URL.createObjectURL(pdfBlob);
    var xlsFileUrl = URL.createObjectURL(xlsBlob);

    cache[token] = {
      pdfBlob: pdfBlob,
      pdfFileUrl: pdfFileUrl,
      pdfName: pdfName,
      xlsBlob: xlsBlob,
      xlsFileUrl: xlsFileUrl,
      previewUrl: previewUrl,
      tab: tab
    };

    // Cache for later Générer click — do not show the ready panel on preview alone.
    cache[token]._pendingFile = {
      token: token,
      kind: "pdf",
      tab: tab,
      name: pdfName,
      label: "Marquage PDF (" + tab + ")",
      blob: pdfBlob,
      url: pdfFileUrl,
      bytes: pdfBlob.size,
      previewUrl: previewUrl
    };

    var block = {
      previews: [previewUrl],
      pdf: absUrl(pdfPath),
      xls: absUrl(xlsPath)
    };

    var out = {
      EMKEY: "dz-offline-" + token,
      tab: tab,
      delivery: null,
      costs: null,
      costs_pro: null,
      excesslength: 0
    };
    out[tab] = block;
    // Keep main populated so switching tabs still has a printable file.
    if (tab !== "main") {
      out.main = Object.assign({}, block);
    } else {
      out.main = block;
    }
    return out;
  }

  function isPreviewUrl(url) {
    return /\/v3\.5\.1\/preview\/?(\?|$)/.test(String(url));
  }

  function tokenFromUrl(url) {
    var m = String(url).match(/\/__dz_offline\/([^/]+)\//);
    return m && m[1];
  }

  function patchStoreSave(store) {
    if (!store || store.__dzOfflineSavePatched) return;
    store.__dzOfflineSavePatched = true;
    var origDispatch = store.dispatch.bind(store);
    store.dispatch = function (type, payload, opts) {
      var action = typeof type === "string" ? type : type && type.type;
      if (action === "markings/save") {
        try {
          var current = store.state.markings && store.state.markings.current;
          if (!current) return Promise.resolve();
          if (!current.id) {
            current.id = "dz-" + Date.now().toString(36);
          }
          // Ensure list entry exists so authorized save path won't crash.
          var items = store.state.markings.items || [];
          if (!items.find(function (x) {
            return x && x.id === current.id;
          })) {
            items.unshift(
              listItemFromPayload(
                Object.assign({}, current, {
                  rails: (store.getters && store.getters["rails/pureData"]) || []
                }),
                current.id
              )
            );
            store.commit("markings/assign", { items: items });
          }
        } catch (e) {}
      }
      return origDispatch(type, payload, opts);
    };
  }

  function bootPatches() {
    try {
      var store = findStore();
      if (store) patchStoreSave(store);
    } catch (e) {}
  }

  // Page open must never show leftover "Fichiers PDF prêts" or trigger downloads.
  clearFilesPanel();
  setInterval(bootPatches, 1000);
  document.addEventListener("DOMContentLoaded", function () {
    clearFilesPanel();
    bootPatches();
  });
  window.addEventListener("load", function () {
    clearFilesPanel();
    setTimeout(bootPatches, 400);
    setTimeout(bootPatches, 1200);
  });

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();

    if (isPreviewUrl(url) && (method === "POST" || method === "PUT")) {
      var tab = "main";
      try {
        var body = init && init.body;
        if (typeof body === "string") {
          var parsed = JSON.parse(body);
          if (parsed && parsed.tab) tab = parsed.tab;
        }
      } catch (e) {}
      return makePreviewPayload(tab)
        .then(function (payload) {
          return jsonResponse(payload);
        })
        .catch(function (err) {
          console.error("[dz-offline-pdf]", err);
          return jsonResponse({ error: String(err && err.message) }, 500);
        });
    }

    if (url.indexOf("__dz_offline/") !== -1) {
      var token = tokenFromUrl(url);
      var entry = token && cache[token];
      if (!entry) {
        // Must return a Promise — app code always does fetch(...).then(...)
        return Promise.resolve(jsonResponse({ error: "expired" }, 404));
      }
      if (/\/pdf\/?(\?|$)/.test(url) || /\/xls\/?(\?|$)/.test(url)) {
        var isXls = /\/xls\/?(\?|$)/.test(url);
        var fileName = isXls
          ? "marquage-equipement.csv"
          : entry.pdfName || "marquage-electro-marker.pdf";
        // Official download(tab): fetch(token) → JSON {file, downloads[, paid]}
        // then links[tab]=file and window.open(file). No forced <a download>.
        if (!isXls) {
          registerOfflineFile(
            entry._pendingFile || {
              token: token,
              kind: "pdf",
              tab: entry.tab || "main",
              name: fileName,
              label: "PDF généré",
              blob: entry.pdfBlob,
              url: entry.pdfFileUrl,
              bytes: entry.pdfBlob && entry.pdfBlob.size,
              previewUrl: entry.previewUrl
            },
            { showPanel: false }
          );
        } else {
          syncDownloadsCount();
        }
        return Promise.resolve(
          jsonResponse({
            // Honest remaining/listed files — never fake 9999.
            downloads: Math.max(1, offlineFiles.length),
            paid: 1,
            // Blob URL so window.open / a.downloadLink show the real PDF sheet.
            file: isXls ? entry.xlsFileUrl : entry.pdfFileUrl
          })
        );
      }
      if (/\/file\.pdf/.test(url)) {
        return Promise.resolve(
          new Response(entry.pdfBlob, {
            status: 200,
            headers: { "Content-Type": "application/pdf" }
          })
        );
      }
      if (/\/file\.csv/.test(url)) {
        return Promise.resolve(
          new Response(entry.xlsBlob, {
            status: 200,
            headers: { "Content-Type": "text/csv" }
          })
        );
      }
    }

    if (isMarkingCollection(url) || isMarkingItem(url)) {
      try {
        return Promise.resolve(handleMarkingRequest(url, method, init));
      } catch (err) {
        console.error("[dz-offline-save]", err);
        return Promise.resolve(
          jsonResponse({ error: String(err && err.message) }, 500)
        );
      }
    }

    return origFetch(input, init);
  };
})();
