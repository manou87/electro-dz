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
      symbolCount: 0,
      iconCount: 0
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

  function downloadJson(payload, id) {
    var safeName = String((payload && payload.name) || "marquage")
      .replace(/^marking\.name$/i, "marquage")
      .replace(/[^\w\-àâäéèêëïîôùûüç]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "marquage";
    var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    var file = {
      format: "electro-marker-project",
      version: 1,
      savedAt: new Date().toISOString(),
      id: id,
      marking: payload
    };
    var blob = new Blob([JSON.stringify(file, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    downloadBlob(blob, safeName + "-" + stamp + ".json");
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
      downloadJson(source, newId);
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
      if (method === "PUT") downloadJson(next, id);
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

  function captureTarget() {
    return (
      document.querySelector(".rails") ||
      document.querySelector(".modnumbers") ||
      document.querySelector(".content") ||
      document.body
    );
  }

  function railSummary(store) {
    var lines = [];
    try {
      var rails = (store && store.state && store.state.rails && store.state.rails.items) || [];
      rails.forEach(function (rail, ri) {
        lines.push("Rail " + (ri + 1) + " — " + (rail.din || "?") + " DIN");
        (rail.items || []).forEach(function (d, di) {
          var label =
            (d.deviceNumber || d.name || d.text || d.type || "module") +
            (d.In || d.curve ? " " + [d.curve, d.In ? d.In + "A" : ""].filter(Boolean).join(" ") : "");
          lines.push("  " + (di + 1) + ". " + label);
        });
      });
    } catch (e) {}
    return lines;
  }

  function buildPdfDoc(canvas, store) {
    var JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    var pdf = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    var pageW = pdf.internal.pageSize.getWidth();
    var pageH = pdf.internal.pageSize.getHeight();
    var margin = 8;
    pdf.setFontSize(12);
    pdf.text("Électro Marker — export hors-ligne", margin, margin + 4);
    pdf.setFontSize(9);
    pdf.setTextColor(80);
    var name = "";
    try {
      name =
        (store &&
          store.state &&
          store.state.markings &&
          store.state.markings.current &&
          store.getters.localize &&
          store.getters.localize(store.state.markings.current.name)) ||
        (store.state.markings.current && store.state.markings.current.name) ||
        "";
    } catch (e) {
      try {
        name = store.state.markings.current.name || "";
      } catch (e2) {}
    }
    if (name) pdf.text(String(name), margin, margin + 9);
    pdf.setTextColor(0);

    if (canvas && canvas.width > 2 && canvas.height > 2) {
      var maxW = pageW - margin * 2;
      var maxH = pageH - margin * 2 - 14;
      var ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      var w = canvas.width * ratio;
      var h = canvas.height * ratio;
      var img = canvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(img, "JPEG", margin, margin + 12, w, h);
    } else {
      pdf.setFontSize(10);
      var y = margin + 16;
      railSummary(store).forEach(function (line) {
        pdf.text(line, margin, y);
        y += 6;
      });
      if (y === margin + 16) {
        pdf.text("Aucun appareil sur le rail — ajoutez des modules avant d'exporter.", margin, y);
      }
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

  async function makePreviewPayload(tab) {
    await waitForLibs();
    var store = findStore();
    var target = captureTarget();
    var canvas = null;
    try {
      canvas = await window.html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: Math.max(target.scrollWidth || 1200, 1200)
      });
    } catch (e) {
      canvas = null;
    }

    var pdf = buildPdfDoc(canvas, store);
    var pdfBlob = pdf.output("blob");
    var previewUrl =
      canvas && canvas.width > 2
        ? canvas.toDataURL("image/jpeg", 0.85)
        : "";
    if (!previewUrl) {
      previewUrl =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }

    var token = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var pdfPath = TOKEN_PREFIX + token + "/pdf";
    var xlsPath = TOKEN_PREFIX + token + "/xls";

    var xlsBlob = new Blob([buildXlsText(store)], {
      type: "text/csv;charset=utf-8"
    });

    cache[token] = {
      pdfBlob: pdfBlob,
      pdfFileUrl: URL.createObjectURL(pdfBlob),
      xlsBlob: xlsBlob,
      xlsFileUrl: URL.createObjectURL(xlsBlob),
      previewUrl: previewUrl
    };

    var block = {
      previews: [previewUrl],
      pdf: absUrl(pdfPath),
      xls: absUrl(xlsPath)
    };

    var out = {
      EMKEY: "dz-offline-" + token,
      tab: tab || "main",
      delivery: null,
      costs: null,
      costs_pro: null,
      excesslength: 0
    };
    out[tab || "main"] = block;
    if ((tab || "main") !== "main") {
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

  setInterval(bootPatches, 1000);
  document.addEventListener("DOMContentLoaded", bootPatches);
  window.addEventListener("load", function () {
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
        return jsonResponse({ error: "expired" }, 404);
      }
      if (/\/pdf\/?(\?|$)/.test(url) || /\/xls\/?(\?|$)/.test(url)) {
        var isXls = /\/xls\/?(\?|$)/.test(url);
        return jsonResponse({
          downloads: 9999,
          paid: 1,
          file: isXls ? entry.xlsFileUrl : entry.pdfFileUrl
        });
      }
      if (/\/file\.pdf/.test(url)) {
        return new Response(entry.pdfBlob, {
          status: 200,
          headers: { "Content-Type": "application/pdf" }
        });
      }
      if (/\/file\.csv/.test(url)) {
        return new Response(entry.xlsBlob, {
          status: 200,
          headers: { "Content-Type": "text/csv" }
        });
      }
    }

    if (isMarkingCollection(url) || isMarkingItem(url)) {
      try {
        return Promise.resolve(handleMarkingRequest(url, method, init));
      } catch (err) {
        console.error("[dz-offline-save]", err);
        return jsonResponse({ error: String(err && err.message) }, 500);
      }
    }

    return origFetch(input, init);
  };
})();
