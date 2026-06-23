/**
 * Démo locale — quiz visuel (figures-preview) sans pseudo ni classement.
 */
(function () {
  const MODULE_URL =
    "data/quiz/nf-c15-100-2015/modules/DEMO_figures_visuelles.json";
  const PDF_URL = "pdf/francais/nf-c15-100-2015/nf-c15-100-2015.pdf";
  const BUILD = "demo2";

  const root = document.querySelector("[data-demo-quiz-root]");
  if (!root) return;

  let lang = localStorage.getItem("electrodz-site-lang") || "fr";
  let moduleData = null;
  let qIndex = 0;
  let score = 0;
  let answered = false;
  let questionDisplay = null;
  let lastChosen = null;

  function t(fr, ar) {
    return lang === "ar" && ar ? ar : fr;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function siteBasePath() {
    const p = window.location.pathname.replace(/[^/]*$/, "");
    return p.endsWith("/") ? p : p + "/";
  }

  function resolveSiteUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === "/") return window.location.origin + path;
    return window.location.origin + siteBasePath() + path.replace(/^\//, "");
  }

  function shuffleIndices(n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function buildQuestionDisplay(q) {
    const optsFr = q.optionsFr || [];
    const optsAr = q.optionsAr || optsFr;
    const order = shuffleIndices(optsFr.length);
    return {
      optionsFr: order.map(function (i) {
        return optsFr[i];
      }),
      optionsAr: order.map(function (i) {
        return optsAr[i];
      }),
      correctBtnIndex: order.indexOf(q.correctAnswer),
    };
  }

  function correctAnswerText(q) {
    const opts = lang === "ar" && q.optionsAr ? q.optionsAr : q.optionsFr;
    if (opts && q.correctAnswer >= 0 && q.correctAnswer < opts.length) {
      return opts[q.correctAnswer];
    }
    return "";
  }

  function renderFigure(q) {
    if (!q.imageUrl) return "";
    let src = resolveSiteUrl(q.imageUrl);
    src += (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + BUILD;
    const cap = t(q.imageCaptionFr, q.imageCaptionAr);
    let html = '<figure class="quiz-figure">';
    html +=
      '<div class="quiz-figure-frame" data-figure-zoom role="button" tabindex="0" aria-label="' +
      escapeHtml(t("Agrandir l'image", "تكبير الصورة")) +
      '">';
    html +=
      '<img src="' +
      escapeHtml(src) +
      '" alt="" class="quiz-figure-img" loading="eager" decoding="async" data-quiz-figure-img />';
    html += "</div>";
    if (cap) {
      html += '<figcaption class="quiz-figure-cap">' + escapeHtml(cap) + "</figcaption>";
    }
    html += "</figure>";
    return html;
  }

  function bindFigureZoom(card) {
    const frame = card && card.querySelector("[data-figure-zoom]");
    if (!frame) return;
    frame.addEventListener("click", function () {
      const img = frame.querySelector("[data-quiz-figure-img]");
      if (!img || !img.src) return;
      const overlay = document.createElement("div");
      overlay.className = "quiz-figure-overlay";
      overlay.innerHTML =
        '<button type="button" class="quiz-figure-overlay-close" aria-label="' +
        escapeHtml(t("Fermer", "إغلاق")) +
        '">×</button><img src="' +
        escapeHtml(img.src) +
        '" alt="" />';
      function close() {
        overlay.remove();
        document.body.style.overflow = "";
      }
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay || e.target.closest(".quiz-figure-overlay-close")) close();
      });
      document.body.style.overflow = "hidden";
      document.body.appendChild(overlay);
    });
  }

  function renderPdfBlock(q) {
    const page = q.pdfPage != null && Number(q.pdfPage) > 0 ? Number(q.pdfPage) : null;
    const pdfAbs = resolveSiteUrl(PDF_URL);
    const pdfHash = page ? pdfAbs + "#page=" + page : pdfAbs;
    const answerTxt = correctAnswerText(q);
    let html =
      '<div class="quiz-source-box" role="region" aria-label="' +
      escapeHtml(t("Source normative", "المصدر المعياري")) +
      '">';
    html +=
      '<p class="quiz-source-title">' +
      escapeHtml(t("Document en ligne (réponse)", "الوثيقة (الإجابة)")) +
      "</p>";
    if (answerTxt) {
      html +=
        '<p class="quiz-source-answer"><span class="quiz-source-label">' +
        escapeHtml(t("Bonne réponse : ", "الإجابة الصحيحة: ")) +
        "</span>" +
        escapeHtml(answerTxt) +
        "</p>";
    }
    if (page) {
      html +=
        '<p class="quiz-source-meta" style="margin:8px 0">' +
        escapeHtml(t("Page PDF : p. ", "صفحة PDF: ص. ")) +
        "<strong>" +
        page +
        "</strong></p>";
    }
    if (q.normRef) {
      html +=
        '<p class="quiz-source-meta" style="margin:0 0 8px">' +
        escapeHtml(q.normRef) +
        "</p>";
    }
    html +=
      '<div class="quiz-source-links"><a class="quiz-source-btn quiz-source-btn--primary" href="' +
      escapeHtml(pdfHash) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(t("Ouvrir le PDF", "فتح PDF")) +
      "</a></div></div>";
    return html;
  }

  function renderIntro() {
    root.innerHTML =
      '<div class="quiz-hero"><h1 style="font-size:1.35rem">' +
      escapeHtml(t(moduleData.titleFr, moduleData.titleAr)) +
      "</h1><p>" +
      escapeHtml(
        t(
          moduleData.questions.length +
            " questions image — aperçu local (pas encore dans le quiz principal)",
          moduleData.questions.length + " أسئلة بصور — معاينة محلية"
        )
      ) +
      '</p><p class="quiz-disclaimer" style="margin-top:12px">' +
      escapeHtml(
        t(
          "Recadrages provisoires depuis le PDF. Les titres « Figure … » seront exclus avant intégration finale.",
          "اقتصاصات مؤقتة من PDF."
        )
      ) +
      "</p></div>" +
      '<div class="quiz-result-actions">' +
      '<button type="button" class="quiz-btn-next" data-demo-start>' +
      escapeHtml(t("Commencer la démo", "ابدأ العرض")) +
      "</button> " +
      '<a class="quiz-btn-ghost" href="quiz-figures-preview.html">' +
      escapeHtml(t("Galerie des figures", "معرض الأشكال")) +
      "</a> " +
      '<a class="quiz-btn-ghost" href="quiz-nfc-15-100.html">' +
      escapeHtml(t("Quiz complet", "الاختبار الكامل")) +
      "</a></div>";
    root.querySelector("[data-demo-start]").addEventListener("click", function () {
      qIndex = 0;
      score = 0;
      answered = false;
      renderQuestion();
    });
  }

  function renderWin() {
    const total = moduleData.questions.length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    root.innerHTML =
      '<div class="quiz-result"><h2>' +
      escapeHtml(t("Démo terminée !", "انتهى العرض!")) +
      '</h2><div class="quiz-score-final" aria-live="polite">' +
      '<span class="quiz-score-num">' +
      score +
      '</span><span class="quiz-score-sep">/</span><span class="quiz-score-total">' +
      total +
      "</span>" +
      '<p class="quiz-score-pct">' +
      escapeHtml(pct + "%") +
      "</p></div>" +
      '<div class="quiz-result-actions">' +
      '<button type="button" class="quiz-btn-next" data-demo-restart>' +
      escapeHtml(t("Recommencer", "إعادة")) +
      "</button> " +
      '<a class="quiz-btn-ghost" href="quiz-figures-preview.html">' +
      escapeHtml(t("Galerie", "المعرض")) +
      "</a></div></div>";
    root.querySelector("[data-demo-restart]").addEventListener("click", function () {
      qIndex = 0;
      score = 0;
      answered = false;
      renderIntro();
    });
  }

  function paintFeedback(q, chosen) {
    const disp = questionDisplay || buildQuestionDisplay(q);
    const correct = chosen === disp.correctBtnIndex;
    const fb = root.querySelector("[data-quiz-feedback]");
    if (!fb) return;

    root.querySelectorAll(".quiz-opt").forEach(function (btn, i) {
      btn.disabled = true;
      if (i === disp.correctBtnIndex) btn.classList.add("quiz-opt--correct");
      else if (parseInt(btn.getAttribute("data-opt"), 10) === chosen && !correct) {
        btn.classList.add("quiz-opt--wrong");
      }
    });

    let fbHtml =
      '<div class="quiz-feedback ' +
      (correct ? "quiz-feedback--ok" : "quiz-feedback--ko") +
      '">';
    fbHtml += escapeHtml(
      correct
        ? t("Bonne réponse !", "إجابة صحيحة!")
        : t("Pas tout à fait — voir l'explication.", "ليست صحيحة تماماً — انظر الشرح.")
    );
    fbHtml += "</div>";
    fbHtml +=
      '<p class="quiz-explanation">' +
      escapeHtml(t(q.explanationFr, q.explanationAr)) +
      "</p>";
    fbHtml += renderPdfBlock(q);

    const actions = root.querySelector("[data-quiz-actions]");
    const isLast = qIndex >= moduleData.questions.length - 1;
    if (actions) {
      actions.innerHTML =
        '<button type="button" class="quiz-btn-next" data-demo-next>' +
        escapeHtml(
          isLast ? t("Voir le score →", "عرض النتيجة ←") : t("Question suivante →", "السؤال التالي ←")
        ) +
        "</button>";
      actions.querySelector("[data-demo-next]").addEventListener("click", function () {
        answered = false;
        lastChosen = null;
        questionDisplay = null;
        qIndex++;
        if (qIndex >= moduleData.questions.length) renderWin();
        else renderQuestion();
      });
    }
    fb.innerHTML = fbHtml;
  }

  function renderQuestion() {
    if (!moduleData || qIndex >= moduleData.questions.length) {
      renderWin();
      return;
    }

    const q = moduleData.questions[qIndex];
    const total = moduleData.questions.length;
    if (!answered) questionDisplay = buildQuestionDisplay(q);

    let html =
      '<div class="quiz-hero" style="margin-bottom:16px"><h1 style="font-size:1.2rem">' +
      escapeHtml(t(moduleData.titleFr, moduleData.titleAr)) +
      "</h1></div>";
    html +=
      '<div class="quiz-progress"><span class="quiz-level-badge">' +
      escapeHtml(
        t("Question ", "سؤال ") + (qIndex + 1) + "/" + total + " · " + t("Démo", "عرض")
      ) +
      '</span><span class="quiz-palier">' +
      escapeHtml(t("Score : ", "النقاط: ") + score) +
      "</span></div>";
    html += '<div class="quiz-card" data-quiz-card>';
    html += renderFigure(q);
    html +=
      '<p class="quiz-question quiz-question--full">' +
      escapeHtml(t(q.questionFr, q.questionAr)) +
      "</p>";
    html += '<div class="quiz-options">';
    const opts =
      lang === "ar" ? questionDisplay.optionsAr : questionDisplay.optionsFr;
    opts.forEach(function (opt, i) {
      html +=
        '<button type="button" class="quiz-opt" data-opt="' +
        i +
        '">' +
        escapeHtml(opt) +
        "</button>";
    });
    html += '</div><div data-quiz-actions class="quiz-actions quiz-actions--inline"></div>';
    html += '<div data-quiz-feedback></div></div>';
  html +=
      '<p style="text-align:center;margin-top:16px"><a class="quiz-btn-ghost" href="quiz-figures-preview.html">' +
      escapeHtml(t("← Galerie des figures", "← معرض الأشكال")) +
      "</a></p>";

    root.innerHTML = html;
    bindFigureZoom(root.querySelector("[data-quiz-card]"));

    root.querySelectorAll(".quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.getAttribute("data-opt"), 10);
        lastChosen = chosen;
        if (chosen === questionDisplay.correctBtnIndex) score++;
        paintFeedback(q, chosen);
      });
    });

    if (answered && lastChosen !== null) paintFeedback(q, lastChosen);
  }

  function applyLang(l) {
    lang = l;
    localStorage.setItem("electrodz-site-lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      const isFr = b.hasAttribute("data-lang-fr");
      b.classList.toggle("active", (l === "fr" && isFr) || (l === "ar" && !isFr));
    });
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.hasAttribute("data-lang-fr") ? "fr" : "ar");
      if (moduleData) {
        if (qIndex > 0 || answered) renderQuestion();
        else renderIntro();
      }
    });
  });

  applyLang(lang);

  if (location.protocol === "file:") {
    root.innerHTML =
      '<div style="color:#f87171;padding:20px;max-width:36rem;margin:0 auto;line-height:1.5">' +
      "<p><strong>" +
      escapeHtml(t("Serveur local requis", "يلزم خادم محلي")) +
      "</strong></p><p>" +
      escapeHtml(
        t(
          "Lancez : cd website && python3 -m http.server 8765",
          "نفّذ: cd website && python3 -m http.server 8765"
        )
      ) +
      '</p><p><a href="http://localhost:8765/quiz-demo-figures.html" style="color:#facc15">http://localhost:8765/quiz-demo-figures.html</a></p></div>';
    return;
  }

  fetch(MODULE_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("load " + MODULE_URL);
      return r.json();
    })
    .then(function (data) {
      moduleData = data;
      renderIntro();
    })
    .catch(function (err) {
      root.innerHTML =
        '<p style="color:#f87171;padding:20px">' +
        escapeHtml(t("Erreur de chargement", "خطأ في التحميل")) +
        ": " +
        escapeHtml(String(err.message)) +
        "</p>";
      console.error(err);
    });
})();
