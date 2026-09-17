(function () {
  "use strict";

  var MODULE_SLUG = "seminaire-19-sept";
  var LIMIT = 30;
  var REFRESH_MS = 5000;

  var rowsEl = document.getElementById("board-rows");
  var emptyEl = document.getElementById("board-empty");
  var statusEl = document.getElementById("board-status");

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function medal(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return String(rank);
  }

  function formatTime(sec) {
    var n = Number(sec) || 0;
    if (n < 60) return n + "s";
    var m = Math.floor(n / 60);
    var s = n % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function getConfig() {
    var cfg = window.ElectroDzSite && window.ElectroDzSite.supabase;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    return cfg;
  }

  async function fetchRows() {
    var cfg = getConfig();
    if (!cfg) return { ok: false, rows: [] };

    var url =
      cfg.url +
      "/rest/v1/quiz_leaderboard_bests" +
      "?module_slug=eq." +
      encodeURIComponent(MODULE_SLUG) +
      "&select=pseudo,score,total,pct,duration_sec,updated_at" +
      "&order=score.desc,duration_sec.asc,updated_at.desc" +
      "&limit=" +
      LIMIT;

    var res = await fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey
      }
    });
    if (!res.ok) return { ok: false, rows: [] };
    var data = await res.json();
    return { ok: true, rows: Array.isArray(data) ? data : [] };
  }

  function render(rows) {
    if (!rows || !rows.length) {
      rowsEl.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    rowsEl.innerHTML = rows
      .map(function (r, idx) {
        var rank = idx + 1;
        var cls = rank <= 3 ? " board-row--top" : "";
        return (
          '<div class="board-row' +
          cls +
          '" dir="ltr">' +
          "<span>" +
          medal(rank) +
          "</span>" +
          '<span class="pseudo">' +
          escapeHtml(r.pseudo) +
          "</span>" +
          "<span>" +
          escapeHtml(String(r.score != null ? r.score : "—")) +
          "/" +
          escapeHtml(String(r.total != null ? r.total : 14)) +
          "</span>" +
          "<span>" +
          escapeHtml(String(r.pct != null ? r.pct : "—")) +
          "%</span>" +
          '<span class="time">' +
          escapeHtml(formatTime(r.duration_sec)) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function tick() {
    fetchRows()
      .then(function (res) {
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, "0");
        var mm = String(now.getMinutes()).padStart(2, "0");
        var ss = String(now.getSeconds()).padStart(2, "0");
        if (!res || !res.ok) {
          statusEl.textContent =
            "تعذّر التحديث — إعادة المحاولة… · " + hh + ":" + mm + ":" + ss;
          return;
        }
        render(res.rows || []);
        var n = (res.rows && res.rows.length) || 0;
        statusEl.textContent =
          n +
          " مشارك · الترتيب: النقاط ثم الوقت الأسرع · آخر تحديث " +
          hh +
          ":" +
          mm +
          ":" +
          ss;
      })
      .catch(function () {
        statusEl.textContent = "تعذّر الاتصال بالخادم.";
      });
  }

  tick();
  setInterval(tick, REFRESH_MS);
})();
