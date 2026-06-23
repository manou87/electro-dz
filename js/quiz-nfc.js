/**
 * Quiz NF C 15-100 (2015) — parcours par paliers (5 niveaux × 15 questions).
 */
(function () {
  const STORAGE_LANG = "electrodz-site-lang";
  const PLAN_URL = "data/quiz/nf-c15-100-2015/plan-modules.json";
  const QUIZ_BUILD = "20260624c";
  const LOCAL_QUIZ_URL = "http://localhost:8765/quiz-nfc-15-100.html";

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
  let moduleReady = false;
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
    if (lang === "ar" && q.type === "truefalse" && q.statementFr) {
      let html =
        '<p class="quiz-question">' +
        escapeHtml(
          q.questionAr && q.questionAr.indexOf("«") >= 0
            ? q.questionAr
            : t(
                "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟",
                "حسب معيار NF C 15-100، هل العبارة التالية صحيحة؟"
              )
        ) +
        "</p>";
      html +=
        '<blockquote class="quiz-statement" lang="fr">' +
        "« " +
        escapeHtml(q.statementFr) +
        " »</blockquote>";
      html +=
        '<p class="quiz-statement-note">' +
        escapeHtml(t("(extrait NF C 15-100 — français)", "(مقتطف NF C 15-100 — فرنسي)")) +
        "</p>";
      return html;
    }

    const full = t(q.questionFr, q.questionAr);
    return '<p class="quiz-question quiz-question--full">' + escapeHtml(full) + "</p>";
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
    removeMidQuizSaveBar();
    removeQuizQuitBar();
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
      '<p class="quiz-build-tag" data-quiz-build>Quiz test · build ' +
      QUIZ_BUILD +
      "</p>";
    html += renderParticipantForm({
      variant: "home",
      inputId: "quiz-pseudo-home",
      extraClass: "quiz-participant-setup",
      validateButton: true,
    });
    html +=
      '<p class="quiz-participant-note">' +
      escapeHtml(
        t(
          "Lettres latines, chiffres, _ - . · si le nom est pris, un code est ajouté (ex. -7F2)",
          "حروف لاتينية وأرقام و _ - . · إن كان الاسم مستخدماً يُضاف رمز (مثال -7F2)"
        )
      ) +
      "</p>";
    html +=
      '<p class="quiz-disclaimer">' +
      escapeHtml(t(plan.disclaimerFr, plan.disclaimerAr)) +
      "</p>";
    html +=
      '<div class="quiz-ready-banner" data-quiz-ready-banner hidden aria-live="polite"></div>';
    html += '<div class="quiz-modules" data-quiz-modules>';
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
    const participantBox = root.querySelector("[data-participant-box]");
    bindParticipantValidate(participantBox);
    bindHomeModuleGuards();
    const saved = savedPseudo();
    if (saved && isValidPseudoForReserve(saved)) {
      showHomeReadyScreen({ pseudo: saved, suffixAdded: false, raw: saved });
    }
  }

  function showHomeReadyScreen(result) {
    const box = root.querySelector("[data-participant-box]");
    if (!box || !result || !result.pseudo) return;

    box.setAttribute("data-participant-valid", "1");
    box.className = "quiz-leaderboard-box quiz-leaderboard-box--prominent quiz-participant-setup quiz-participant-box--success";

    let sub =
      result.suffixAdded && result.raw
        ? t(
            "Code ajouté car « " + result.raw + " » était déjà pris.",
            "أُضيف رمز لأن « " + result.raw + " » مستخدم."
          )
        : t("Vous pouvez maintenant choisir un module.", "يمكنك الآن اختيار وحدة.");

    box.innerHTML =
      '<div class="quiz-participant-success">' +
      '<div class="quiz-participant-success-icon" aria-hidden="true">✓</div>' +
      "<h3>" +
      escapeHtml(t("Surnom accepté !", "تم قبول الاسم!")) +
      "</h3>" +
      '<p class="quiz-participant-success-name">' +
      escapeHtml(result.pseudo) +
      "</p>" +
      '<p class="quiz-participant-success-sub">' +
      escapeHtml(sub) +
      "</p>" +
      '<button type="button" class="quiz-btn-ghost quiz-participant-edit" data-participant-edit>' +
      escapeHtml(t("Modifier mon surnom", "تعديل الاسم")) +
      "</button></div>";

    const editBtn = box.querySelector("[data-participant-edit]");
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        showHomeEditForm();
      });
    }

    const banner = root.querySelector("[data-quiz-ready-banner]");
    if (banner) {
      banner.hidden = false;
      banner.innerHTML =
        "<h2>" +
        escapeHtml(t("Étape 2 — Choisissez un module", "الخطوة 2 — اختر وحدة")) +
        "</h2><p>" +
        escapeHtml(
          t(
            "Cliquez sur M01, M02… pour commencer le quiz avec votre surnom.",
            "اضغط M01 أو M02… لبدء الاختبار باسمك."
          )
        ) +
        "</p>";
    }

    const modules = root.querySelector("[data-quiz-modules]");
    if (modules) {
      modules.classList.add("quiz-modules--ready");
      setTimeout(function () {
        if (modules.scrollIntoView) {
          modules.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    }
  }

  function showHomeEditForm() {
    const banner = root.querySelector("[data-quiz-ready-banner]");
    if (banner) {
      banner.hidden = true;
      banner.innerHTML = "";
    }
    const modules = root.querySelector("[data-quiz-modules]");
    if (modules) modules.classList.remove("quiz-modules--ready");

    const saved = savedPseudo();
    const box = root.querySelector("[data-participant-box]");
    if (!box) {
      renderHome();
      return;
    }

    const parent = box.parentNode;
    const tmp = document.createElement("div");
    tmp.innerHTML = renderParticipantForm({
      variant: "home",
      inputId: "quiz-pseudo-home",
      extraClass: "quiz-participant-setup",
      validateButton: true,
    });
    const newBox = tmp.firstElementChild;
    parent.replaceChild(newBox, box);

    bindParticipantValidate(newBox);
    const input = newBox.querySelector("[data-quiz-pseudo]");
    if (input) {
      input.value = saved || "";
      if (input.focus) input.focus();
      if (input.select) input.select();
    }
    if (newBox.scrollIntoView) {
      newBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function bindHomeModuleGuards() {
    root.querySelectorAll(".quiz-module-card--active").forEach(function (link) {
      link.addEventListener("click", function (e) {
        const box = root.querySelector("[data-participant-box]");
        if (!box || box.getAttribute("data-participant-valid") !== "1") {
          e.preventDefault();
          const msg = box && box.querySelector("[data-participant-validate-msg]");
          if (msg) {
            msg.hidden = false;
            msg.textContent = t(
              "Validez d’abord votre surnom avec le bouton « Valider mon surnom ».",
              "أكّد اسمك أولاً بزر «تأكيد الاسم»."
            );
            msg.classList.remove("quiz-leaderboard-msg--ok");
            msg.classList.add("quiz-leaderboard-msg--err");
          }
          if (box && box.scrollIntoView) {
            box.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      });
    });
  }

  const STORAGE_PSEUDO = "quiz-nfc-pseudo";

  function savePseudoLocal(pseudo) {
    try {
      localStorage.setItem(STORAGE_PSEUDO, pseudo);
    } catch (_) {}
    if (window.QuizLeaderboard && window.QuizLeaderboard.savePseudo) {
      window.QuizLeaderboard.savePseudo(pseudo);
    }
  }

  function savedPseudo() {
    if (window.QuizLeaderboard && window.QuizLeaderboard.getSavedPseudo) {
      const fromApi = window.QuizLeaderboard.getSavedPseudo();
      if (fromApi) return fromApi;
    }
    try {
      return localStorage.getItem(STORAGE_PSEUDO) || "";
    } catch (_) {
      return "";
    }
  }

  function normalizePseudoInput(raw) {
    if (window.QuizLeaderboard && window.QuizLeaderboard.normalizePseudo) {
      return window.QuizLeaderboard.normalizePseudo(raw);
    }
    return String(raw || "").trim();
  }

  function isValidPseudoBaseLocal(pseudo) {
    return /^[A-Za-z0-9_\-\.]{3,12}$/.test(pseudo);
  }

  function isValidPseudoLocal(pseudo) {
    return /^[A-Za-z0-9_\-\.]{3,16}$/.test(pseudo);
  }

  function isValidPseudoForReserve(raw) {
    return isValidPseudoBaseLocal(raw) || isValidPseudoLocal(raw);
  }

  function pseudoErrorMessage(code) {
    const fr = {
      pseudo_invalid: "Pseudo invalide (3–12 caractères : lettres, chiffres, _ - .)",
      network_reserve:
        "Impossible de valider le surnom. Vérifiez votre connexion puis rechargez (Cmd+Shift+R).",
      outdated: "Version obsolète — rechargez la page (Cmd+Shift+R).",
      config: "Classement indisponible (configuration serveur).",
    };
    const ar = {
      pseudo_invalid: "اسم مستعار غير صالح (3–12 حرفاً).",
      network_reserve: "تعذّر التحقق من الاسم. تحقق من الشبكة وأعد التحميل.",
      outdated: "نسخة قديمة — أعد تحميل الصفحة.",
      config: "التصنيف غير متاح.",
    };
    const dict = lang === "ar" ? ar : fr;
    return dict[code] || dict.network_reserve;
  }

  async function reservePseudoDirect(base) {
    const pseudo = normalizePseudoInput(base);
    if (!isValidPseudoForReserve(pseudo)) {
      return { ok: false, error: "pseudo_invalid" };
    }
    const cfg = window.ElectroDzSite && window.ElectroDzSite.supabase;
    if (!cfg || !cfg.url || !cfg.anonKey) {
      return { ok: false, error: "config" };
    }
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, 12000);
    try {
      const res = await fetch(cfg.url + "/rest/v1/rpc/reserve_quiz_pseudo", {
        method: "POST",
        headers: {
          apikey: cfg.anonKey,
          Authorization: "Bearer " + cfg.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_base: pseudo }),
        signal: controller.signal,
      });
      if (!res.ok) {
        return { ok: false, error: res.status === 404 ? "outdated" : "network_reserve" };
      }
      const data = await res.json();
      if (data && data.ok) savePseudoLocal(data.pseudo);
      return data || { ok: false, error: "network_reserve" };
    } catch (err) {
      console.error("reserve_quiz_pseudo", err);
      return { ok: false, error: "network_reserve" };
    } finally {
      clearTimeout(timer);
    }
  }

  function participantLeadText(variant) {
    if (variant === "home") {
      return t(
        "Saisissez un surnom puis cliquez « Valider ». Pas de compte Google nécessaire.",
        "أدخل اسماً مستعاراً ثم «تأكيد». لا حاجة لحساب Google."
      );
    }
    if (variant === "intro") {
      return t(
        "Confirmez votre surnom pour apparaître au classement à la fin du module.",
        "أكّد اسمك المستعار للظهور في التصنيف بعد انتهاء الوحدة."
      );
    }
    return t(
      "Cliquez le bouton jaune pour envoyer votre score au classement.",
      "اضغط الزر الأصفر لإرسال نتيجتك إلى التصنيف."
    );
  }

  function renderParticipantForm(opts) {
    opts = opts || {};
    const variant = opts.variant || "home";
    const inputId = opts.inputId || "quiz-pseudo-input";
    const saved = savedPseudo();
    const prominent =
      variant === "home" || variant === "intro" ? " quiz-leaderboard-box--prominent" : "";
    const title =
      variant === "result"
        ? t("Envoyer au classement", "إرسال إلى التصنيف")
        : t("Votre surnom de participant", "اسمك المستعار");

    return (
      '<div class="quiz-leaderboard-box' +
      prominent +
      (opts.extraClass ? " " + opts.extraClass : "") +
      '" data-participant-box data-participant-variant="' +
      escapeHtml(variant) +
      '"' +
      (opts.leaderboard ? ' data-quiz-leaderboard id="quiz-participant-form"' : "") +
      ">" +
      '<p class="quiz-leaderboard-kicker">' +
      escapeHtml(t("📋 Classement", "📋 التصنيف")) +
      "</p>" +
      "<h3>" +
      escapeHtml(title) +
      "</h3>" +
      '<p class="quiz-leaderboard-lead">' +
      escapeHtml(participantLeadText(variant)) +
      "</p>" +
      '<label class="quiz-leaderboard-label" for="' +
      escapeHtml(inputId) +
      '">' +
      escapeHtml(t("Nom / pseudo (3–12 caractères)", "الاسم / اسم مستعار (3–12)")) +
      "</label>" +
      '<input id="' +
      escapeHtml(inputId) +
      '" class="quiz-leaderboard-input" type="text" maxlength="16" autocomplete="nickname" data-quiz-pseudo value="' +
      escapeHtml(saved) +
      '" placeholder="' +
      escapeHtml(t("Ex. Karim_DZ", "مثال Karim_DZ")) +
      '" />' +
      (opts.validateButton
        ? '<button type="button" class="quiz-btn-next quiz-leaderboard-submit" data-participant-validate>' +
          escapeHtml(t("Valider mon surnom", "تأكيد الاسم")) +
          "</button>" +
          '<p class="quiz-leaderboard-msg" data-participant-validate-msg hidden></p>'
        : "") +
      (opts.submitButton
        ? '<button type="button" class="quiz-btn-next quiz-leaderboard-submit" data-quiz-submit-score>' +
          escapeHtml(t("Enregistrer mon score au classement", "تسجيل نتيجتي في التصنيف")) +
          "</button>" +
          '<p class="quiz-leaderboard-msg" data-quiz-submit-msg hidden></p>'
        : "") +
      (opts.hint
        ? '<p class="quiz-leaderboard-hint">' + escapeHtml(opts.hint) + "</p>"
        : "") +
      (opts.footerHtml || "") +
      "</div>"
    );
  }

  function bindParticipantAutosave(box) {
    if (!box || !window.QuizLeaderboard) return;
    const input = box.querySelector("[data-quiz-pseudo]");
    if (!input) return;
    function trySave() {
      const pseudo = window.QuizLeaderboard.normalizePseudo(input.value);
      if (window.QuizLeaderboard.isValidPseudo(pseudo)) {
        window.QuizLeaderboard.savePseudo(pseudo);
      }
    }
    input.addEventListener("blur", trySave);
    input.addEventListener("change", trySave);
  }

  function bindParticipantValidate(box) {
    if (!box) return;
    const input = box.querySelector("[data-quiz-pseudo]");
    const btn = box.querySelector("[data-participant-validate]");
    const msg = box.querySelector("[data-participant-validate-msg]");
    if (!input || !btn) return;

    const btnDefault = t("Valider mon surnom", "تأكيد الاسم");
    const btnOk = t("Surnom validé ✓", "تم التأكيد ✓");

    function doValidate() {
      const variant = box.getAttribute("data-participant-variant") || "home";
      if (msg) {
        msg.hidden = false;
        msg.classList.remove("quiz-leaderboard-msg--ok", "quiz-leaderboard-msg--err");
        msg.classList.add("quiz-leaderboard-msg--wait");
        msg.textContent = t("Vérification en cours…", "جاري التحقق…");
      }
      btn.disabled = true;
      input.disabled = true;
      btn.textContent = t("Vérification…", "جاري التحقق…");

      validateAndReserveParticipant(input, msg)
        .then(function (result) {
          input.disabled = false;
          btn.disabled = false;
          btn.textContent = btnDefault;

          if (result && result.pseudo) {
            if (variant === "home") {
              showHomeReadyScreen(result);
            } else {
              box.setAttribute("data-participant-valid", "1");
              btn.textContent = btnOk;
            }
          } else {
            box.removeAttribute("data-participant-valid");
            if (msg) {
              msg.hidden = false;
              msg.classList.remove("quiz-leaderboard-msg--wait");
            }
          }
        })
        .catch(function (err) {
          console.error("validate pseudo", err);
          input.disabled = false;
          btn.disabled = false;
          btn.textContent = btnDefault;
          box.removeAttribute("data-participant-valid");
          if (msg) {
            msg.hidden = false;
            msg.classList.remove("quiz-leaderboard-msg--wait");
            msg.textContent = pseudoErrorMessage("network_reserve");
            msg.classList.add("quiz-leaderboard-msg--err");
          }
        });
    }

    btn.addEventListener("click", doValidate);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        doValidate();
      }
    });
    input.addEventListener("input", function () {
      box.removeAttribute("data-participant-valid");
      btn.textContent = btnDefault;
      if (msg) msg.hidden = true;
    });
  }

  async function validateAndReserveParticipant(input, msgEl) {
    try {
      const raw = normalizePseudoInput(input.value);
      const saved = savedPseudo();
      if (
        saved &&
        (saved === raw ||
          (/^[A-Za-z0-9_\-\.]{3,12}$/.test(raw) &&
            saved.toLowerCase().startsWith(raw.toLowerCase() + "-")))
      ) {
        input.value = saved;
        savePseudoLocal(saved);
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.classList.remove("quiz-leaderboard-msg--wait", "quiz-leaderboard-msg--err");
          msgEl.textContent = t("Surnom enregistré ✓ : " + saved, "تم حفظ الاسم ✓ : " + saved);
          msgEl.classList.add("quiz-leaderboard-msg--ok");
        }
        return { pseudo: saved, suffixAdded: false, raw: raw };
      }

      if (!isValidPseudoForReserve(raw)) {
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.classList.remove("quiz-leaderboard-msg--wait");
          msgEl.textContent = pseudoErrorMessage("pseudo_invalid");
          msgEl.classList.add("quiz-leaderboard-msg--err");
        }
        return null;
      }

      if (msgEl) {
        msgEl.hidden = false;
        msgEl.classList.remove("quiz-leaderboard-msg--ok", "quiz-leaderboard-msg--err");
        msgEl.classList.add("quiz-leaderboard-msg--wait");
        msgEl.textContent = t("Vérification du surnom…", "جاري التحقق من الاسم…");
      }

      const res = await reservePseudoDirect(raw);
      if (!res || !res.ok) {
        const code = (res && res.error) || "network_reserve";
        if (msgEl) {
          msgEl.classList.remove("quiz-leaderboard-msg--wait");
          msgEl.textContent = pseudoErrorMessage(code);
          msgEl.classList.add("quiz-leaderboard-msg--err");
        }
        return null;
      }

      input.value = res.pseudo;
      savePseudoLocal(res.pseudo);
      if (msgEl) {
        msgEl.classList.remove("quiz-leaderboard-msg--wait");
        msgEl.textContent = res.suffix_added
          ? t(
              "Surnom : " +
                res.pseudo +
                " (code ajouté car « " +
                raw +
                " » était déjà pris)",
              "الاسم: " +
                res.pseudo +
                " (أُضيف رمز لأن « " +
                raw +
                " » مستخدم)"
            )
          : t("Surnom enregistré ✓ : " + res.pseudo, "تم حفظ الاسم ✓ : " + res.pseudo);
        msgEl.classList.remove("quiz-leaderboard-msg--err");
        msgEl.classList.add("quiz-leaderboard-msg--ok");
      }
      return {
        pseudo: res.pseudo,
        suffixAdded: !!res.suffix_added,
        raw: raw,
      };
    } catch (err) {
      console.error("validateAndReserveParticipant", err);
      if (msgEl) {
        msgEl.hidden = false;
        msgEl.classList.remove("quiz-leaderboard-msg--wait");
        msgEl.textContent = pseudoErrorMessage("network_reserve");
        msgEl.classList.add("quiz-leaderboard-msg--err");
      }
      return null;
    }
  }

  function moduleMetaFromSlug(slug) {
    if (!plan || !slug) return { slug: slug, id: "" };
    const mod = plan.modules.find(function (m) {
      return m.slug === slug || m.id === slug;
    });
    return mod ? { slug: mod.slug, id: mod.id } : { slug: slug, id: "" };
  }

  function renderModuleIntro() {
    removeMidQuizSaveBar();
    removeQuizQuitBar();
    const meta = moduleMetaFromSlug(moduleSlug);
    root.innerHTML =
      '<div class="quiz-hero"><h1 style="font-size:1.35rem">' +
      escapeHtml(t(moduleData.titleFr, moduleData.titleAr)) +
      "</h1><p>" +
      escapeHtml(
        t(
          meta.id + " — 5 paliers × 15 questions",
          meta.id + " — 5 مراحل × 15 سؤالاً"
        )
      ) +
      "</p></div>" +
      renderParticipantForm({
        variant: "intro",
        inputId: "quiz-pseudo-intro",
        extraClass: "quiz-participant-setup",
      }) +
      '<p class="quiz-leaderboard-msg" data-participant-intro-msg hidden></p>' +
      '<div class="quiz-result-actions">' +
      '<button type="button" class="quiz-btn-next" data-module-start>' +
      escapeHtml(t("Commencer le module", "ابدأ الوحدة")) +
      "</button> " +
      '<a class="quiz-btn-ghost" href="' +
      quizHomeHref() +
      '">' +
      escapeHtml(t("✕ Quitter le quiz", "✕ مغادرة الاختبار")) +
      "</a></div>";

    const box = root.querySelector("[data-participant-box]");
    bindParticipantValidate(box);
    const input = root.querySelector("[data-quiz-pseudo]");
    const msg = root.querySelector("[data-participant-intro-msg]");
    const startBtn = root.querySelector("[data-module-start]");
    if (input && input.focus) input.focus();

    if (startBtn && input) {
      const startLabel = t("Commencer le module", "ابدأ الوحدة");
      startBtn.addEventListener("click", function () {
        if (msg) {
          msg.hidden = false;
          msg.classList.remove("quiz-leaderboard-msg--ok", "quiz-leaderboard-msg--err");
          msg.classList.add("quiz-leaderboard-msg--wait");
          msg.textContent = t("Vérification du surnom…", "جاري التحقق من الاسم…");
        }
        startBtn.disabled = true;
        input.disabled = true;
        startBtn.textContent = t("Préparation du quiz…", "تحضير الاختبار…");

        validateAndReserveParticipant(input, msg)
          .then(function (result) {
            input.disabled = false;
            if (!result || !result.pseudo) {
              startBtn.disabled = false;
              startBtn.textContent = startLabel;
              if (msg) msg.classList.remove("quiz-leaderboard-msg--wait");
              return;
            }
            startBtn.textContent = t("C'est parti ! ✓", "انطلاق! ✓");
            moduleReady = true;
            moduleStartedAt = Date.now();
            scoreSubmitted = false;
            qIndex = 0;
            levelIndex = 0;
            score = 0;
            setTimeout(function () {
              renderQuestion();
            }, 400);
          })
          .catch(function (err) {
            console.error("start module", err);
            input.disabled = false;
            startBtn.disabled = false;
            startBtn.textContent = startLabel;
            if (msg) {
              msg.hidden = false;
              msg.classList.remove("quiz-leaderboard-msg--wait");
              msg.textContent = window.QuizLeaderboard
                ? window.QuizLeaderboard.errorMessage("network", lang)
                : t("Erreur — réessayez.", "خطأ — حاول مجدداً.");
              msg.classList.add("quiz-leaderboard-msg--err");
            }
          });
      });
    }
  }

  function renderLeaderboardBox(total, pct) {
    return renderParticipantForm({
      variant: "result",
      inputId: "quiz-pseudo-input",
      leaderboard: true,
      submitButton: true,
      hint: t(
        "Score : " + score + "/" + total + " (" + pct + "%)",
        "النتيجة: " + score + "/" + total + " (" + pct + "%)"
      ),
      footerHtml:
        '<p class="quiz-leaderboard-hint"><a href="quiz-classement.html">' +
        escapeHtml(t("Voir le classement →", "عرض التصنيف ←")) +
        "</a></p>",
    });
  }

  function questionsAnsweredCount() {
    if (!moduleData) return 0;
    const byLevel = questionsByLevel(moduleData.questions);
    const keys = sortedLevelKeys(byLevel);
    let n = 0;
    for (let i = 0; i < levelIndex; i++) {
      n += (byLevel[keys[i]] || []).length;
    }
    n += qIndex;
    if (answered) n += 1;
    return n;
  }

  function renderMidQuizSaveBarHtml() {
    const answered = questionsAnsweredCount();
    const pseudo = savedPseudo();
    return (
      '<div class="quiz-save-bar" data-quiz-save-bar role="region" aria-label="' +
      escapeHtml(t("Enregistrement au classement", "التسجيل في التصنيف")) +
      '">' +
      '<div class="quiz-save-bar-inner">' +
      '<div class="quiz-save-bar-text">' +
      '<p class="quiz-save-bar-title">' +
      escapeHtml(t("💾 Enregistrer vos points", "💾 حفظ نقاطك")) +
      "</p>" +
      '<p class="quiz-save-bar-score" data-quiz-save-score>' +
      escapeHtml(
        t(
          "Score actuel : " + score + "/" + answered,
          "النتيجة الحالية: " + score + "/" + answered
        )
      ) +
      "</p>" +
      '<p class="quiz-save-bar-hint">' +
      escapeHtml(
        t(
          "Vous pouvez quitter le module — votre score partiel part au classement.",
          "يمكنك مغادرة الوحدة — تُرسل نتيجتك الجزئية إلى التصنيف."
        )
      ) +
      "</p>" +
      (pseudo
        ? '<p class="quiz-save-bar-pseudo">' +
          escapeHtml(t("Surnom : ", "الاسم: ") + pseudo) +
          "</p>"
        : "") +
      "</div>" +
      '<div class="quiz-save-bar-actions">' +
      '<button type="button" class="quiz-btn-next quiz-save-bar-btn" data-quiz-save-partial' +
      (answered < 1 ? " disabled" : "") +
      ">" +
      escapeHtml(t("Enregistrer au classement", "تسجيل في التصنيف")) +
      "</button>" +
      '<a class="quiz-btn-ghost quiz-save-bar-quit" href="' +
      quizHomeHref() +
      '">' +
      escapeHtml(t("Quitter", "مغادرة")) +
      "</a></div></div>" +
      '<p class="quiz-save-bar-msg quiz-leaderboard-msg" data-quiz-save-msg hidden></p>' +
      "</div>"
    );
  }

  function updateMidQuizSaveBar() {
    const bar = document.querySelector("[data-quiz-save-bar]");
    if (!bar) return;
    const answered = questionsAnsweredCount();
    const scoreEl = bar.querySelector("[data-quiz-save-score]");
    const btn = bar.querySelector("[data-quiz-save-partial]");
    const pseudoEl = bar.querySelector(".quiz-save-bar-pseudo");
    const pseudo = savedPseudo();
    if (scoreEl) {
      scoreEl.textContent = t(
        "Score actuel : " + score + "/" + answered,
        "النتيجة الحالية: " + score + "/" + answered
      );
    }
    if (btn) btn.disabled = answered < 1;
    if (pseudoEl) {
      pseudoEl.textContent = t("Surnom : ", "الاسم: ") + (pseudo || "—");
    } else if (pseudo) {
      const text = bar.querySelector(".quiz-save-bar-text");
      if (text) {
        const p = document.createElement("p");
        p.className = "quiz-save-bar-pseudo";
        p.textContent = t("Surnom : ", "الاسم: ") + pseudo;
        text.appendChild(p);
      }
    }
  }

  function ensureMidQuizSaveBar() {
    let bar = document.querySelector("[data-quiz-save-bar]");
    if (!bar) {
      const wrap = document.createElement("div");
      wrap.innerHTML = renderMidQuizSaveBarHtml();
      bar = wrap.firstElementChild;
      page.appendChild(bar);
      bindMidQuizSave(bar);
    }
    updateMidQuizSaveBar();
  }

  function removeMidQuizSaveBar() {
    const bar = document.querySelector("[data-quiz-save-bar]");
    if (bar) bar.remove();
  }

  function quizHomeHref() {
    return "quiz-nfc-15-100.html";
  }

  function ensureQuizQuitBar(label) {
    let bar = document.querySelector("[data-quiz-quit-bar]");
    const text = label || t("Quiz en cours", "الاختبار جارٍ");
    if (!bar) {
      const wrap = document.createElement("div");
      wrap.innerHTML =
        '<div class="quiz-quit-bar" data-quiz-quit-bar>' +
        '<span class="quiz-quit-bar-label">' +
        escapeHtml(text) +
        "</span>" +
        '<a class="quiz-quit-bar-btn" href="' +
        quizHomeHref() +
        '">' +
        escapeHtml(t("✕ Quitter le quiz", "✕ مغادرة الاختبار")) +
        "</a></div>";
      bar = wrap.firstElementChild;
      page.insertBefore(bar, page.firstChild);
    } else {
      const lbl = bar.querySelector(".quiz-quit-bar-label");
      if (lbl) lbl.textContent = text;
    }
  }

  function removeQuizQuitBar() {
    const bar = document.querySelector("[data-quiz-quit-bar]");
    if (bar) bar.remove();
  }

  function bindMidQuizSave(bar) {
    if (!bar || !window.QuizLeaderboard) return;
    const btn = bar.querySelector("[data-quiz-save-partial]");
    const msg = bar.querySelector("[data-quiz-save-msg]");
    if (!btn) return;

    btn.addEventListener("click", function () {
      const total = questionsAnsweredCount();
      if (total < 1) return;

      let pseudo = savedPseudo();
      if (!window.QuizLeaderboard.isValidPseudo(pseudo)) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = t(
            "Surnom manquant — retournez à l’accueil quiz pour valider votre nom.",
            "الاسم مفقود — ارجع لصفحة الاختبار لتأكيد اسمك."
          );
          msg.classList.add("quiz-leaderboard-msg--err");
        }
        return;
      }

      btn.disabled = true;
      if (msg) {
        msg.hidden = false;
        msg.classList.remove("quiz-leaderboard-msg--ok", "quiz-leaderboard-msg--err");
        msg.textContent = t("Envoi en cours…", "جاري الإرسال…");
      }

      const meta = moduleMetaFromSlug(moduleSlug);
      window.QuizLeaderboard.submitScore({
        pseudo: pseudo,
        moduleSlug: meta.slug,
        moduleId: meta.id,
        score: score,
        total: total,
        durationSec: 1,
      }).then(function (res) {
        if (res && res.ok) {
          if (msg) {
            msg.textContent = t(
              "Score enregistré ! Vous pouvez quitter ou continuer.",
              "تم التسجيل! يمكنك المغادرة أو المتابعة."
            );
            msg.classList.add("quiz-leaderboard-msg--ok");
          }
          btn.textContent = t("Score enregistré ✓", "تم التسجيل ✓");
          setTimeout(function () {
            btn.textContent = t("Enregistrer au classement", "تسجيل في التصنيف");
            btn.disabled = questionsAnsweredCount() < 1;
          }, 2500);
          return;
        }
        const code = (res && res.error) || "network_score";
        if (msg) {
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
        }
        btn.disabled = questionsAnsweredCount() < 1;
      });
    });
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
      const durationSec = 1;

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
        const code = (res && res.error) || "network_score";
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
    removeMidQuizSaveBar();
    removeQuizQuitBar();
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
    bindParticipantAutosave(root.querySelector("[data-quiz-leaderboard]"));
    const form = document.getElementById("quiz-participant-form");
    if (form && form.scrollIntoView) {
      setTimeout(function () {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
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

    root.innerHTML = html;
    ensureQuizQuitBar(
      t(moduleData.titleFr, moduleData.titleAr) +
        " · " +
        t("Palier ", "مرحلة ") +
        currentLevelNum
    );
    ensureMidQuizSaveBar();

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
    updateMidQuizSaveBar();
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

  function showQuizLoadError(err) {
    const isFile = location.protocol === "file:";
    let detail = "";
    if (isFile) {
      detail =
        t(
          "Vous avez ouvert le fichier HTML directement (double-clic). Le quiz doit passer par un serveur web.",
          "لقد فتحت ملف HTML مباشرة. يجب فتح الاختبار عبر خادم ويب."
        ) +
        " " +
        t("Ouvrez ce lien :", "افتح هذا الرابط:") +
        ' <a href="' +
        LOCAL_QUIZ_URL +
        '" style="color:#facc15">' +
        LOCAL_QUIZ_URL +
        "</a>. " +
        t(
          "Ou lancez dans le Terminal : cd website && ./scripts/serve-local.sh",
          "أو نفّذ في الطرفية: cd website && ./scripts/serve-local.sh"
        );
    } else if (err && err.message) {
      detail = escapeHtml(String(err.message));
    }
    root.innerHTML =
      '<div style="color:#f87171;padding:20px;max-width:36rem;margin:0 auto;line-height:1.5">' +
      "<p><strong>" +
      escapeHtml(
        t(
          isFile
            ? "Ouvrez le quiz via le serveur local"
            : "Impossible de charger le quiz",
          isFile ? "افتح الاختبار عبر الخادم المحلي" : "تعذر تحميل الاختبار"
        )
      ) +
      "</strong></p>" +
      (detail ? "<p>" + detail + "</p>" : "") +
      (!isFile
        ? "<p>" +
          escapeHtml(
            t(
              "Vérifiez votre connexion ou réessayez plus tard.",
              "تحقق من الاتصال أو حاول لاحقاً."
            )
          ) +
          "</p>"
        : "") +
      "</div>";
    console.error(err);
  }

  applyLang(lang);

  function run() {
    if (location.protocol === "file:") {
      showQuizLoadError(new Error("file protocol"));
      return;
    }
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
        moduleReady = false;
        renderModuleIntro();
      })
      .catch(function (err) {
        showQuizLoadError(err);
      });
  }

  run();
})();
