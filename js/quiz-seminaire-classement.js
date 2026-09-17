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

  function render(rows) {
    if (!rows || !rows.length) {
      rowsEl.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    rowsEl.innerHTML = rows
      .map(function (r, idx) {
        var rank = r.rank != null ? r.rank : idx + 1;
        var cls = rank <= 3 ? " board-row--top" : "";
        return (
          '<div class="board-row' +
          cls +
          '" dir="ltr">' +
          "<span>" +
          medal(rank) +
          "</span>" +
          "<span class=\"pseudo\">" +
          escapeHtml(r.pseudo) +
          "</span>" +
          "<span>" +
          escapeHtml(String(r.total_score != null ? r.total_score : "—")) +
          "/" +
          escapeHtml(String(r.max_score != null ? r.max_score : 14)) +
          "</span>" +
          "<span>" +
          escapeHtml(String(r.pct != null ? r.pct : "—")) +
          "%</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function tick() {
    var api = window.QuizLeaderboard;
    if (!api) {
      statusEl.textContent = "التصنيف غير متاح (إعداد الخادم).";
      return;
    }
    api.fetchLeaderboard(MODULE_SLUG, LIMIT).then(function (res) {
      var now = new Date();
      var hh = String(now.getHours()).padStart(2, "0");
      var mm = String(now.getMinutes()).padStart(2, "0");
      var ss = String(now.getSeconds()).padStart(2, "0");
      if (!res || !res.ok) {
        statusEl.textContent = "تعذّر التحديث — إعادة المحاولة… · " + hh + ":" + mm + ":" + ss;
        return;
      }
      render(res.rows || []);
      var n = (res.rows && res.rows.length) || 0;
      statusEl.textContent =
        n + " مشارك · آخر تحديث " + hh + ":" + mm + ":" + ss + " · تحديث كل 5 ثوانٍ";
    });
  }

  tick();
  setInterval(tick, REFRESH_MS);
})();
