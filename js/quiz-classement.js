/**
 * Page classement quiz NF C 15-100.
 */
(function () {
  const PLAN_URL = "data/quiz/nf-c15-100-2015/plan-modules.json";
  const STORAGE_LANG = "electrodz-site-lang";

  const root = document.querySelector("[data-leaderboard-root]");
  const filtersEl = document.querySelector("[data-leaderboard-filters]");
  if (!root) return;

  let lang = localStorage.getItem(STORAGE_LANG) || "fr";
  let plan = null;
  let currentFilter = "global";

  const I18N = {
    fr: {
      title: "Classement Quiz NF C 15-100",
      sub: "Top 50 — pseudo libre · connexion Google optionnelle (badge ✓)",
      disclaimer:
        "Classement optionnel : le quiz reste jouable sans inscription. Seul votre meilleur score par module est conservé.",
      back: "← Quiz",
    },
    ar: {
      title: "تصنيف اختبار NF C 15-100",
      sub: "Top 50 — اسم مستعار · تسجيل Google اختياري (✓)",
      disclaimer:
        "تصنيف اختياري: الاختبار بدون تسجيل. يُحفظ أفضل نتيجة لكل وحدة فقط.",
      back: "← الاختبار",
    },
  };

  function t(fr, ar) {
    return lang === "ar" && ar ? ar : fr;
  }

  function tKey(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function medal(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return String(rank);
  }

  function applyLang(l) {
    lang = l;
    localStorage.setItem(STORAGE_LANG, l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.title =
      lang === "ar"
        ? "تصنيف الاختبار NF C 15-100 — SwissDZ"
        : "Classement Quiz NF C 15-100 — SwissDZ";
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      const isFr = b.hasAttribute("data-lang-fr");
      b.classList.toggle("active", (l === "fr" && isFr) || (l === "ar" && !isFr));
    });
    document.querySelectorAll("[data-i18n-clb]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-clb");
      if (key) el.textContent = tKey(key);
    });
  }

  function renderFilters() {
    if (!filtersEl || !plan) return;
    let html =
      '<button type="button" class="quiz-lb-filter' +
      (currentFilter === "global" ? " quiz-lb-filter--active" : "") +
      '" data-filter="global">' +
      escapeHtml(t("Global", "الإجمالي")) +
      "</button>";
    plan.modules.forEach(function (m) {
      const active = currentFilter === m.slug ? " quiz-lb-filter--active" : "";
      html +=
        '<button type="button" class="quiz-lb-filter' +
        active +
        '" data-filter="' +
        escapeHtml(m.slug) +
        '">' +
        escapeHtml(m.id) +
        "</button>";
    });
    filtersEl.innerHTML = html;
    filtersEl.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentFilter = btn.getAttribute("data-filter");
        renderFilters();
        loadBoard();
      });
    });
  }

  function renderTable(rows) {
    const isGlobal = currentFilter === "global";
    const scoreLabel = isGlobal
      ? t("Points totaux", "مجموع النقاط")
      : t("Score module", "نتيجة الوحدة");

    let html =
      '<div class="quiz-lb-table-wrap"><table class="quiz-lb-table"><thead><tr>' +
      "<th>" +
      escapeHtml(t("Rang", "الترتيب")) +
      "</th><th>" +
      escapeHtml(t("Pseudo", "الاسم")) +
      "</th><th>" +
      escapeHtml(scoreLabel) +
      "</th><th>" +
      escapeHtml(t("%", "%")) +
      "</th>";
    if (isGlobal) {
      html +=
        "<th>" + escapeHtml(t("Modules", "الوحدات")) + "</th>";
    }
    html += "</tr></thead><tbody>";

    if (!rows.length) {
      html +=
        '<tr><td colspan="' +
        (isGlobal ? 5 : 4) +
        '" class="quiz-lb-empty">' +
        escapeHtml(
          t(
            "Aucun score enregistré pour l’instant. Terminer un module ne suffit pas : à la fin, entrez un pseudo et cliquez « Envoyer mon score » (module ≥ 5 min).",
            "لا نتائج بعد. إنهاء الوحدة لا يكفي: في النهاية أدخل اسماً مستعاراً واضغط «إرسال نتيجتي» (الوحدة ≥ 5 دقائق)."
          )
        ) +
        "</td></tr>";
    } else {
      rows.forEach(function (row) {
        html += "<tr>";
        html += '<td class="quiz-lb-rank">' + escapeHtml(medal(row.rank)) + "</td>";
        html +=
          '<td class="quiz-lb-pseudo">' +
          escapeHtml(row.pseudo) +
          (row.verified
            ? ' <span class="quiz-lb-verified" title="' +
              escapeHtml(t("Compte vérifié", "حساب موثّق")) +
              '">✓</span>'
            : "") +
          "</td>";
        html +=
          '<td class="quiz-lb-score">' +
          escapeHtml(row.total_score + "/" + row.max_score) +
          "</td>";
        html += '<td class="quiz-lb-pct">' + escapeHtml(String(row.pct) + "%") + "</td>";
        if (isGlobal) {
          html +=
            '<td class="quiz-lb-modules">' +
            escapeHtml(String(row.modules_done || 0) + "/6") +
            "</td>";
        }
        html += "</tr>";
      });
    }

    html += "</tbody></table></div>";
    return html;
  }

  function renderLoading() {
    root.innerHTML =
      '<p class="quiz-lb-status">' +
      escapeHtml(t("Chargement du classement…", "جاري تحميل التصنيف…")) +
      "</p>";
  }

  function renderError(code) {
    const msg =
      code === "config"
        ? t(
            "Classement indisponible — exécutez quiz-leaderboard.sql dans Supabase.",
            "التصنيف غير متاح — نفّذ quiz-leaderboard.sql في Supabase."
          )
        : t("Impossible de charger le classement.", "تعذّر تحميل التصنيف.");
    root.innerHTML = '<p class="quiz-lb-status quiz-lb-status--err">' + escapeHtml(msg) + "</p>";
  }

  async function loadBoard() {
    renderLoading();
    if (!window.QuizLeaderboard) {
      renderError("config");
      return;
    }
    const slug = currentFilter === "global" ? null : currentFilter;
    const res = await window.QuizLeaderboard.fetchLeaderboard(slug, 50);
    if (!res.ok) {
      renderError(res.error);
      return;
    }
    root.innerHTML = renderTable(res.rows);
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.hasAttribute("data-lang-fr") ? "fr" : "ar");
      renderFilters();
      loadBoard();
    });
  });

  applyLang(lang);

  fetch(PLAN_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("plan");
      return r.json();
    })
    .then(function (p) {
      plan = p;
      renderFilters();
      return loadBoard();
    })
    .catch(function () {
      currentFilter = "global";
      loadBoard();
    });
})();
