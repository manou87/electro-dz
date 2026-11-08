/**
 * Offline PDF/XLS bridge for Électro Marker on static hosting.
 * Intercepts /v3.5.1/preview (and download tokens) because GitHub Pages
 * has no Electromarker backend — without this, "Générer le fichier" is a no-op.
 */
(function () {
  if (window.__DZ_OFFLINE_PDF__) return;
  window.__DZ_OFFLINE_PDF__ = true;

  var TOKEN_PREFIX = "/dzmarker-app/v3.5.1/__dz_offline/";
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
      // 1x1 white placeholder so the preview pane is not empty
      previewUrl =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }

    var token = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var pdfPath = TOKEN_PREFIX + token + "/pdf";
    var filePath = TOKEN_PREFIX + token + "/file.pdf";
    var xlsPath = TOKEN_PREFIX + token + "/xls";
    var xlsFilePath = TOKEN_PREFIX + token + "/file.csv";

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
    // Always expose main.pdf for equipment XLS source as upstream expects
    if ((tab || "main") !== "main") {
      out.main = Object.assign({}, block);
    } else {
      out.main = block;
    }
    return out;
  }

  function isPreviewUrl(url) {
    return /\/v3\.5\.1\/preview\/?(\?|$)/.test(url);
  }

  function tokenFromUrl(url) {
    var m = String(url).match(/\/__dz_offline\/([^/]+)\//);
    return m && m[1];
  }

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

    return origFetch(input, init);
  };
})();
