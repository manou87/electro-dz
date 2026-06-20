/**
 * Quiz NF C 15-100 (2015) — parcours par paliers (5 niveaux × 15 questions).
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";
  const PLAN_URL = "data/quiz/nf-c15-100-2015/plan-modules.json";

  const page = document.querySelector(".quiz-page");
  const root = document.querySelector("[data-quiz-root]");
  if (!page || !root) return;

  let lang = localStorage.getItem(STORAGE_LANG) || "fr";
  let plan = null;
  let moduleData = null;
  let qIndex = 0;
  let levelIndex = 0;
  let score = 0;
  let answered = false;
  let questionDisplay = null;
  let moduleStartedAt = 0;
  let scoreSubmitted = false;
  const params = new URLSearchParams(location.search);
  const moduleSlug = params.get("module");

  function t(fr, ar) {
    return lang === "ar" && ar ? ar : fr;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("load " + url);
      return r.json();
    });
  }

  function resolveSiteUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = window.location.href.replace(/[^/]*$/, "");
    return base + path.replace(/^\//, "");
  }

  function pdfSectionFromQuestion(q) {
    if (q.normRef) {
      const m = q.normRef.match(/§\s*([\d.]+(?:\s*\/\s*[\d.]+)?)/);
      if (m) return m[1].trim();
    }
    const expl = q.explanationFr || "";
    const m2 = expl.match(/§\s*([\d.]+)/);
    return m2 ? m2[1] : "";
  }

  function shuffleIndices(n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function buildQuestionDisplay(q) {
    if (q.type === "truefalse") {
      const swapLabels = Math.random() < 0.5;
      const labelsFr = swapLabels ? ["Faux", "Vrai"] : ["Vrai", "Faux"];
      const labelsAr = swapLabels ? ["خطأ", "صحيح"] : ["صحيح", "خطأ"];
      return {
        type: "truefalse",
        labelsFr: labelsFr,
        labelsAr: labelsAr,
        choiceToBool: function (btnIndex) {
          if (swapLabels) return btnIndex === 1;
          return btnIndex === 0;
        },
        correctBtnIndex: q.correctAnswer === true ? (swapLabels ? 1 : 0) : swapLabels ? 0 : 1,
      };
    }
    const optsFr = q.optionsFr || [];
    const optsAr = q.optionsAr || optsFr;
    const order = shuffleIndices(optsFr.length);
    return {
      type: "multiple",
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
    if (q.type === "truefalse") {
      const ok = q.correctAnswer === true;
      return lang === "ar" ? (ok ? "صحيح" : "خطأ") : ok ? "Vrai" : "Faux";
    }
    const opts = lang === "ar" && q.optionsAr ? q.optionsAr : q.optionsFr;
    if (opts && q.correctAnswer >= 0 && q.correctAnswer < opts.length) {
      return opts[q.correctAnswer];
    }
    return "";
  }

  function lecteurPdfHref(page) {
    if (!plan || !plan.pdfUrl) return "";
    const q = new URLSearchParams();
    q.set("src", plan.pdfUrl);
    q.set("id", plan.bookId || "nf-c15-100-2015");
    q.set("titleFr", plan.bookTitleFr || plan.normTitle || "PDF");
    q.set("titleAr", plan.bookTitleAr || plan.normTitle || "PDF");
    q.set("from", "quiz-nfc-15-100.html");
    if (page) q.set("page", String(page));
    return "lecteur-pdf.html?" + q.toString();
  }

  function renderPdfSourceBlock(q) {
    if (!plan || !plan.pdfUrl) return "";
    const page = q.pdfPage != null && Number(q.pdfPage) > 0 ? Number(q.pdfPage) : null;
    const section = pdfSectionFromQuestion(q);
    const pdfPath = plan.pdfUrl;
    const pdfAbs = resolveSiteUrl(pdfPath);
    const pdfHash = page ? pdfAbs + "#page=" + page : pdfAbs;
    const lecteur = page ? lecteurPdfHref(page) : lecteurPdfHref(1);
    const title = t(plan.bookTitleFr || plan.normTitle, plan.bookTitleAr || plan.normTitle);
    const answerTxt = correctAnswerText(q);

    let html =
      '<div class="quiz-source-box" role="region" aria-label="' +
      escapeHtml(t("Source normative", "المصدر المعياري")) +
      '">';
    html +=
      '<p class="quiz-source-title">' +
      escapeHtml(t("Document en ligne (réponse)", "الوثيقة على الإنترنت (الإجابة)")) +
      "</p>";
    html +=
      '<p class="quiz-source-doc"><strong>' + escapeHtml(title) + "</strong></p>";

    if (answerTxt) {
      html +=
        '<p class="quiz-source-answer"><span class="quiz-source-label">' +
        escapeHtml(t("Bonne réponse : ", "الإجابة الصحيحة: ")) +
        "</span>" +
        escapeHtml(answerTxt) +
        "</p>";
    }

    html += '<ul class="quiz-source-meta">';
    if (section) {
      html +=
        "<li><span class=\"quiz-source-label\">" +
        escapeHtml(t("Paragraphe : ", "الفقرة: ")) +
        "</span><code>§ " +
        escapeHtml(section) +
        "</code></li>";
    }
    if (page) {
      html +=
        "<li><span class=\"quiz-source-label\">" +
        escapeHtml(t("Page PDF : ", "صفحة PDF: ")) +
        "</span><strong>p. " +
        escapeHtml(String(page)) +
        "</strong></li>";
    }
    if (q.normRef) {
      html +=
        "<li><span class=\"quiz-source-label\">" +
        escapeHtml(t("Référence : ", "المرجع: ")) +
        "</span>" +
        escapeHtml(q.normRef) +
        "</li>";
    }
    html += "</ul>";

    html += '<div class="quiz-source-links">';
    if (page && lecteur) {
      html +=
        '<a class="quiz-source-btn quiz-source-btn--primary" href="' +
        escapeHtml(lecteur) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(t("Ouvrir le PDF à la page ", "فتح PDF صفحة ") + page) +
        "</a>";
    }
    html +=
      '<a class="quiz-source-btn" href="' +
      escapeHtml(pdfHash) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(t("Lien direct PDF", "رابط PDF مباشر")) +
      "</a>";
    if (plan.bibliothequeUrl) {
      html +=
        '<a class="quiz-source-btn" href="' +
        escapeHtml(plan.bibliothequeUrl) +
        '">' +
        escapeHtml(t("Bibliothèque PDF", "مكتبة PDF")) +
        "</a>";
    }
    html +=
      '<span class="quiz-source-path" title="' +
      escapeHtml(pdfPath) +
      '">' +
      escapeHtml(pdfPath) +
      "</span>";
    html += "</div></div>";
    return html;
  }

  function moduleFileFromSlug(slug) {
    const mod = plan.modules.find(function (m) {
      return m.slug === slug || m.id === slug;
    });
    if (mod && mod.dataFile) return "data/quiz/nf-c15-100-2015/" + mod.dataFile;
    return "data/quiz/nf-c15-100-2015/modules/" + slug + ".json";
  }

  function questionsByLevel(questions) {
    const levels = {};
    questions.forEach(function (q) {
      const L = q.level || 1;
      if (!levels[L]) levels[L] = [];
      levels[L].push(q);
    });
    return levels;
  }

  function sortedLevelKeys(byLevel) {
    return Object.keys(byLevel)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
  }

  function extractQuote(text) {
    const m = String(text || "").match(/«\s*([\s\S]+?)\s*»/);
    return m ? m[1].trim() : "";
  }

  function questionIntro(q) {
    if (q.statementFr) {
      return t(
        "Selon la norme NF C 15-100, cette affirmation est-elle correcte ?",
        "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"
      );
    }
    const raw = t(q.questionFr, q.questionAr);
    const idx = raw.indexOf("«");
    if (idx > 0) return raw.slice(0, idx).trim();
    return raw;
  }

  function questionStatement(q) {
    if (q.statementFr) return q.statementFr;
    const fr = extractQuote(q.questionFr);
    if (fr) return fr;
    return extractQuote(q.questionAr);
  }

  function renderQuestionBody(q) {
    const intro = questionIntro(q);
    const statement = questionStatement(q);
    let html = '<p class="quiz-question">' + escapeHtml(intro) + "</p>";
    if (statement && (q.type === "truefalse" || q.statementFr)) {
      html +=
        '<blockquote class="quiz-statement" lang="fr">' +
        "« " +
        escapeHtml(statement) +
        " »</blockquote>";
      if (lang === "ar") {
        html +=
          '<p class="quiz-statement-note">' +
          escapeHtml(t("(extrait NF C 15-100 — français)", "(مقتطف NF C 15-100 — فرنسي)")) +
          "</p>";
      }
    }
    return html;
  }

  function renderLadder(totalLevels, current) {
    let html = '<div class="quiz-ladder" aria-hidden="true">';
    for (let i = 1; i <= totalLevels; i++) {
      let cls = "quiz-ladder-step";
      if (i < current) cls += " quiz-ladder-step--done";
      else if (i === current) cls += " quiz-ladder-step--current";
      html += '<span class="' + cls + '">' + i + "</span>";
    }
    html += "</div>";
    return html;
  }

  function renderHome() {
    let html =
      '<div class="quiz-hero"><h1>' +
      escapeHtml(t("Quiz NF C 15-100 (2015)", "اختبار NF C 15-100 (2015)")) +
      "</h1><p>" +
      escapeHtml(
        t(
          "Révision par modules — 5 paliers × 15 questions ; score à la fin",
          "مراجعة حسب الوحدات — 5 مراحل × 15 أسئلة؛ النتيجة في النهاية"
        )
      ) +
      "</p></div>";
    html +=
      '<p class="quiz-disclaimer">' +
      escapeHtml(t(plan.disclaimerFr, plan.disclaimerAr)) +
      "</p>";
    html += '<div class="quiz-modules">';
    plan.modules.forEach(function (m) {
      const isPilot = m.status === "pilot" || m.status === "validated-pdf";
      const href = isPilot
        ? "quiz-nfc-15-100.html?module=" + encodeURIComponent(m.slug)
        : "#";
      const cls =
        "quiz-module-card" +
        (isPilot ? " quiz-module-card--active" : " quiz-module-card--soon");
      html +=
        '<a class="' +
        cls +
        '" href="' +
        href +
        '"><span class="quiz-module-tag">' +
        escapeHtml(m.id) +
        (isPilot
          ? " · " + escapeHtml(t("Disponible", "متاح"))
          : " · " + escapeHtml(t("Bientôt", "قريبًا"))) +
        '</span><div class="quiz-module-title">' +
        escapeHtml(t(m.titleFr, m.titleAr)) +
        "</div></a>";
    });
    html += "</div>";
    html +=
      '<p class="quiz-home-links">' +
      '<a class="quiz-btn-ghost" href="quiz-classement.html">' +
      escapeHtml(t("🏆 Voir le classement", "🏆 التصنيف")) +
      '</a> · <a class="quiz-btn-ghost" href="bibliotheque.html">' +
      escapeHtml(t("Bibliothèque PDF", "مكتبة PDF")) +
      '</a> · <a class="quiz-btn-ghost" href="' +
      escapeHtml(plan.pdfUrl) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(t("Norme PDF", "معيار PDF")) +
      "</a></p>";
    root.innerHTML = html;
  }

  function moduleMetaFromSlug(slug) {
    if (!plan || !slug) return { slug: slug, id: "" };
    const mod = plan.modules.find(function (m) {
      return m.slug === slug || m.id === slug;
    });
    return mod ? { slug: mod.slug, id: mod.id } : { slug: slug, id: "" };
  }

  function renderLeaderboardBox(total, pct) {
    const saved =
      window.QuizLeaderboard && window.QuizLeaderboard.getSavedPseudo
        ? window.QuizLeaderboard.getSavedPseudo()
        : "";
    return (
      '<div class="quiz-leaderboard-box" data-quiz-leaderboard>' +
      "<h3>" +
      escapeHtml(t("Entrer au classement", "دخول التصنيف")) +
      "</h3>" +
      '<p class="quiz-leaderboard-lead">' +
      escapeHtml(
        t(
          "Choisissez un pseudo (3–16 caractères) puis envoyez — obligatoire pour apparaître au classement.",
          "اختر اسماً مستعاراً (3–16 حرفاً) ثم أرسل — ضروري للظهور في التصنيف."
        )
      ) +
      "</p>" +
      '<label class="quiz-leaderboard-label" for="quiz-pseudo-input">' +
      escapeHtml(t("Pseudo", "الاسم المستعار")) +
      "</label>" +
      '<input id="quiz-pseudo-input" class="quiz-leaderboard-input" type="text" maxlength="16" autocomplete="nickname" data-quiz-pseudo value="' +
      escapeHtml(saved) +
      '" placeholder="' +
      escapeHtml(t("Ex. Karim_DZ", "مثال Karim_DZ")) +
      '" />' +
      '<button type="button" class="quiz-btn-next quiz-leaderboard-submit" data-quiz-submit-score>' +
      escapeHtml(t("Envoyer mon score", "إرسال نتيجتي")) +
      "</button>" +
      '<p class="quiz-leaderboard-msg" data-quiz-submit-msg hidden></p>' +
      '<p class="quiz-leaderboard-hint">' +
      escapeHtml(
        t(
          "Score enregistré : " + score + "/" + total + " (" + pct + "%)",
          "النتيجة: " + score + "/" + total + " (" + pct + "%)"
        )
      ) +
      ' · <a href="quiz-classement.html">' +
      escapeHtml(t("Voir le classement →", "عرض التصنيف ←")) +
      "</a></p></div>"
    );
  }

  function bindLeaderboardSubmit(total) {
    const box = root.querySelector("[data-quiz-leaderboard]");
    if (!box || !window.QuizLeaderboard || scoreSubmitted) return;

    const input = box.querySelector("[data-quiz-pseudo]");
    const btn = box.querySelector("[data-quiz-submit-score]");
    const msg = box.querySelector("[data-quiz-submit-msg]");
    if (!input || !btn || !msg) return;

    btn.addEventListener("click", function () {
      if (scoreSubmitted) return;
      const pseudo = window.QuizLeaderboard.normalizePseudo(input.value);
      msg.hidden = false;
      msg.classList.remove("quiz-leaderboard-msg--ok", "quiz-leaderboard-msg--err");

      if (!window.QuizLeaderboard.isValidPseudo(pseudo)) {
        msg.textContent = window.QuizLeaderboard.errorMessage("pseudo_invalid", lang);
        msg.classList.add("quiz-leaderboard-msg--err");
        return;
      }

      btn.disabled = true;
      msg.textContent = t("Envoi en cours…", "جاري الإرسال…");

      const meta = moduleMetaFromSlug(moduleSlug);
      const durationSec = moduleStartedAt
        ? Math.max(1, Math.round((Date.now() - moduleStartedAt) / 1000))
        : Math.max(120, total * 2);

      window.QuizLeaderboard.submitScore({
        pseudo: pseudo,
        moduleSlug: meta.slug,
        moduleId: meta.id,
        score: score,
        total: total,
        durationSec: durationSec,
      }).then(function (res) {
        btn.disabled = false;
        if (res && res.ok) {
          scoreSubmitted = true;
          msg.textContent = t(
            "Score enregistré ! Consultez le classement.",
            "تم تسجيل النتيجة! راجع التصنيف."
          );
          msg.classList.add("quiz-leaderboard-msg--ok");
          btn.textContent = t("Score enregistré ✓", "تم التسجيل ✓");
          btn.disabled = true;
          return;
        }
        const code = (res && res.error) || "network";
        if (code === "not_better" && res.best != null) {
          msg.textContent =
            window.QuizLeaderboard.errorMessage("not_better", lang) +
            " (" +
            res.best +
            "/" +
            total +
            ")";
        } else {
          msg.textContent = window.QuizLeaderboard.errorMessage(code, lang);
        }
        msg.classList.add("quiz-leaderboard-msg--err");
      });
    });
  }

  function currentLevelQuestions() {
    const byLevel = questionsByLevel(moduleData.questions);
    const keys = sortedLevelKeys(byLevel);
    return byLevel[keys[levelIndex]] || [];
  }

  function renderWin() {
    const total = moduleData.questions.length;
    const totalLevels = sortedLevelKeys(questionsByLevel(moduleData.questions)).length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    root.innerHTML =
      '<div class="quiz-result">' +
      renderLadder(totalLevels, totalLevels + 1) +
      "<h2>" +
      escapeHtml(t("Module terminé !", "اكتملت الوحدة!")) +
      "</h2>" +
      '<p class="quiz-score-label">' +
      escapeHtml(t("Points récoltés", "النقاط المحصّلة")) +
      "</p>" +
      '<div class="quiz-score-final" aria-live="polite">' +
      '<span class="quiz-score-num">' +
      score +
      '</span><span class="quiz-score-sep">/</span><span class="quiz-score-total">' +
      total +
      "</span>" +
      '<p class="quiz-score-pct">' +
      escapeHtml(pct + "%") +
      "</p></div>" +
      renderLeaderboardBox(total, pct) +
      '<div class="quiz-result-actions">' +
      '<a class="quiz-btn-next" href="quiz-nfc-15-100.html">' +
      escapeHtml(t("Autres modules", "وحدات أخرى")) +
      '</a> <a class="quiz-btn-ghost" href="quiz-classement.html">' +
      escapeHtml(t("Classement", "التصنيف")) +
      '</a> <a class="quiz-btn-ghost" href="bibliotheque.html">' +
      escapeHtml(t("Bibliothèque", "المكتبة")) +
      "</a></div></div>";
    bindLeaderboardSubmit(total);
  }

  function renderQuestion() {
    const byLevel = questionsByLevel(moduleData.questions);
    const levelKeys = sortedLevelKeys(byLevel);
    const totalLevels = levelKeys.length;

    if (levelIndex >= totalLevels) {
      renderWin();
      return;
    }

    const levelQs = currentLevelQuestions();
    const currentLevelNum = levelKeys[levelIndex];

    if (qIndex >= levelQs.length) {
      levelIndex++;
      qIndex = 0;
      renderQuestion();
      return;
    }

    const q = levelQs[qIndex];
    answered = false;
    questionDisplay = buildQuestionDisplay(q);

    let html =
      '<div class="quiz-hero" style="margin-bottom:16px"><h1 style="font-size:1.25rem">' +
      escapeHtml(t(moduleData.titleFr, moduleData.titleAr)) +
      "</h1></div>";
    html += renderLadder(totalLevels, currentLevelNum);
    html +=
      '<div class="quiz-progress"><span class="quiz-level-badge">' +
      escapeHtml(
        t("Palier ", "مرحلة ") +
          currentLevelNum +
          " · " +
          t("Question ", "سؤال ") +
          (qIndex + 1) +
          "/" +
          levelQs.length
      ) +
      '</span><span class="quiz-palier">' +
      escapeHtml(t("Score : ", "النقاط : ") + score) +
      "</span></div>";
    html +=
      '<p class="quiz-disclaimer" style="margin-bottom:16px;font-size:0.78rem">' +
      escapeHtml(t(plan.disclaimerFr, plan.disclaimerAr)) +
      "</p>";
    html += '<div class="quiz-card" data-quiz-card>';
    html += renderQuestionBody(q);
    html += '<div class="quiz-options">';

    if (questionDisplay.type === "truefalse") {
      const labels =
        lang === "ar" ? questionDisplay.labelsAr : questionDisplay.labelsFr;
      [0, 1].forEach(function (i) {
        html +=
          '<button type="button" class="quiz-opt" data-opt="' +
          i +
          '">' +
          escapeHtml(labels[i]) +
          "</button>";
      });
    } else {
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
    }
    html +=
      '<p class="quiz-source-hint">' +
      escapeHtml(
        t(
          "Réponses vérifiées sur le PDF NF C 15-100 de la bibliothèque — la page exacte s’affiche après votre réponse.",
          "الإجابات من PDF NF C 15-100 في المكتبة — تظهر الصفحة بعد إجابتك."
        )
      ) +
      "</p>";
    html += '</div><div data-quiz-feedback></div></div>';
    html +=
      '<div class="quiz-actions"><a class="quiz-btn-ghost" href="quiz-nfc-15-100.html">' +
      escapeHtml(t("Modules", "الوحدات")) +
      '</a><a class="quiz-btn-ghost" href="' +
      escapeHtml(lecteurPdfHref(q.pdfPage || 1)) +
      '">' +
      escapeHtml(t("PDF en ligne", "PDF على الإنترنت")) +
      "</a></div>";

    root.innerHTML = html;

    root.querySelectorAll(".quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (answered) return;
        onAnswer(q, parseInt(btn.getAttribute("data-opt"), 10), levelQs.length);
      });
    });
  }

  function nextButtonLabel(countInLevel) {
    const byLevel = questionsByLevel(moduleData.questions);
    const levelKeys = sortedLevelKeys(byLevel);
    const isLastQuestion =
      levelIndex === levelKeys.length - 1 && qIndex === countInLevel - 1;
    if (isLastQuestion) {
      return t("Voir les points récoltés →", "عرض النقاط المحصّلة ←");
    }
    if (qIndex + 1 < countInLevel) {
      return t("Question suivante →", "السؤال التالي ←");
    }
    return t("Palier suivant →", "المرحلة التالية ←");
  }

  function onAnswer(q, chosen, countInLevel) {
    answered = true;
    const disp = questionDisplay || buildQuestionDisplay(q);
    const correct = chosen === disp.correctBtnIndex;

    const fb = root.querySelector("[data-quiz-feedback]");
    root.querySelectorAll(".quiz-opt").forEach(function (btn, i) {
      btn.disabled = true;
      const ok = i === disp.correctBtnIndex;
      if (ok) btn.classList.add("quiz-opt--correct");
      else if (parseInt(btn.getAttribute("data-opt"), 10) === chosen && !correct) {
        btn.classList.add("quiz-opt--wrong");
      }
    });

    if (correct) score++;

    let fbHtml =
      '<div class="quiz-feedback ' +
      (correct ? "quiz-feedback--ok" : "quiz-feedback--ko") +
      '">';
    fbHtml += escapeHtml(
      correct
        ? t("✓ Bonne réponse", "✓ إجابة صحيحة")
        : t("✗ Mauvaise réponse", "✗ إجابة خاطئة")
    );
    fbHtml +=
      "<br>" + escapeHtml(t(q.explanationFr, q.explanationAr));
    fbHtml += renderPdfSourceBlock(q);
    if (q.trapFr && lang !== "ar") {
      fbHtml +=
        '<span class="quiz-ref">' +
        escapeHtml(t("Piège : ", "فخ : ") + q.trapFr) +
        "</span>";
    }
    fbHtml += "</div>";
    fbHtml +=
      '<div class="quiz-actions" style="margin-top:16px"><button type="button" class="quiz-btn-next" data-next>' +
      escapeHtml(nextButtonLabel(countInLevel)) +
      "</button></div>";

    fb.innerHTML = fbHtml;
    fb.querySelector("[data-next]").addEventListener("click", function () {
      qIndex++;
      renderQuestion();
    });
  }

  function applyLang(l) {
    lang = l;
    localStorage.setItem(STORAGE_LANG, l);
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
      run();
    });
  });

  applyLang(lang);

  function run() {
    fetchJson(PLAN_URL)
      .then(function (p) {
        plan = p;
        if (!moduleSlug) {
          renderHome();
          return null;
        }
        return fetchJson(moduleFileFromSlug(moduleSlug));
      })
      .then(function (mod) {
        if (!mod) return;
        moduleData = mod;
        qIndex = 0;
        levelIndex = 0;
        score = 0;
        scoreSubmitted = false;
        moduleStartedAt = Date.now();
        renderQuestion();
      })
      .catch(function (err) {
        root.innerHTML =
          '<p style="color:#f87171;padding:20px">' +
          escapeHtml(
            t(
              "Impossible de charger le quiz. Ouvrez le site via un serveur local (pas file://).",
              "تعذر تحميل الاختبار. افتح الموقع عبر خادم محلي."
            )
          ) +
          "</p>";
        console.error(err);
      });
  }

  run();
})();
