(function () {
  "use strict";

  var STORAGE = "edz-event19-ok";
  var CODE = "SWISS19";
  var MODULE_SLUG = "seminaire-19-sept";
  var TOTAL = 22;

  /* Bonnes réponses réparties A/B/C/D (indices a) — contenu inchangé, ordre des opts seulement. */
  var QUESTIONS = [
    {
      q: "أين تقيس تيار القصر الأدنى؟",
      terms: "Icc min",
      opts: [
        "في آخر الدارة / في نهاية الخط",
        "في رأس اللوحة فقط",
        "على زر التفاضلي",
        "بين المحايد والأرضي فقط"
      ],
      a: 0,
      why: "تيار القصر الأدنى يُقاس في أبعد نقطة. في رأس اللوحة ننظر غالباً إلى تيار القصر الأقصى وقدرة القطع."
    },
    {
      q: "قاطع ستة عشر أمبير منحنى سي: ما قيمة العتبة المغناطيسية التي نقارن بها القياس؟",
      terms: "16 A · courbe C · 10 × In",
      opts: ["16 أمبير", "160 أمبير", "80 أمبير", "320 أمبير"],
      a: 1,
      why: "منحنى B حوالي 5×In، منحنى C حوالي 10×In، منحنى D حوالي 20×In. هنا 10×16 = 160 أمبير."
    },
    {
      q: "على آخر مأخذ الجهاز يظهر خمسة وتسعين أمبير. كيف تقرأ النتيجة؟",
      terms: "Icc min = 95 A · 10 × In = 160 A",
      opts: [
        "خمسة وتسعون هو الحد الأدنى المطلوب للقاطع",
        "نسمّي مئة وستين تيار القصر الأدنى",
        "خمسة وتسعون هو تيار القصر الأدنى المقاس، وهو أصغر من مئة وستين: القاطع قد لا يقطع فوراً",
        "نكتفي بالقياس في رأس اللوحة"
      ],
      a: 2,
      why: "Icc min هو ما قاسه الجهاز في النهاية (95 A). نقارنه بعتبة القاطع (160 A)، لا العكس."
    },
    {
      q: "إذا كان تيار القصر الأدنى أصغر من عتبة القاطع، ماذا تفعل؟",
      terms: "Icc min < 10 × In",
      opts: [
        "تكبر القاطع إلى اثنين وثلاثين أمبير",
        "تعطّل التفاضلي",
        "تكتب صالح لأن المصباح يضيء",
        "تزيد مقطع الكابل، أو تغيّر المنحنى إلى بي"
      ],
      a: 3,
      why: "تكبير القاطع يرفع العتبة ويزيد المشكلة. الحل: زيادة مقطع الكابل، أو تغيير المنحنى إلى بي."
    },
    {
      q: "مقاومة العزل تُكتب بأي وحدة؟",
      terms: "Riso · MΩ",
      opts: ["ميغاأوم / MΩ", "أمبير / A", "فولت / V", "واط / W"],
      a: 0,
      why: "العزل يُسجَّل بالميغاأوم (MΩ)، لا بالأمبير ولا بالفولت ولا بالواط."
    },
    {
      q: "لمنشأة مئتين وثلاثين فولت، توتر تجربة العزل الأكثر استعمالاً:",
      terms: "Riso · 230 V",
      opts: ["50 فولت", "500 فولت", "5000 فولت", "نفس توتر تيار القصر"],
      a: 1,
      why: "للتركيبات 50–500 فولت يُستعمل عادةً 500 فولت للتجربة."
    },
    {
      q: "لماذا استمرارية الموصل الواقي قبل العزل؟",
      terms: "RPE ثم Riso",
      opts: [
        "لا أهمية للترتيب",
        "لأن العزل أسهل",
        "إذا كان الواقي مقطوعاً، عيب العزل قد لا يظهر",
        "لأن البطارية تفرض ذلك"
      ],
      a: 2,
      why: "بدون موصل واقي متصل، قد يبدو العزل سليماً وهو ليس كذلك."
    },
    {
      q: "قياس العزل يتم:",
      terms: "Riso",
      opts: [
        "تحت التوتر",
        "أثناء اختبار التفاضلي",
        "مع المصباح مشتعل",
        "خارج التوتر، بعد التحقق من غياب التوتر"
      ],
      a: 3,
      why: "حقن توتر التجربة يتم دائماً خارج التوتر وبعد التأكد من غياب التوتر."
    },
    {
      q: "في آخر الدارة، العزل يظهر اثنان من عشرة ميغاأوم عند خمسمائة فولت. ماذا تستنتج؟",
      terms: "Riso = 0,2 MΩ · 500 V",
      opts: [
        "ضعيف: العزل غير مقبول",
        "صالح لأنه أكبر من صفر",
        "نرفع العيار إلى ألف فولت ونمرّ",
        "نعوّض بقياس تيار القصر"
      ],
      a: 0,
      why: "القيمة المرجعية المعتادة ≥ 1 ميغاأوم عند 500 فولت. 0,2 ميغاأوم ضعيف."
    },
    {
      q: "عيار التفاضلي على خط المآخذ هو عادة:",
      terms: "IΔN",
      opts: ["160 أمبير", "30 ميلي أمبير", "500 فولت", "1 ميغاأوم"],
      a: 1,
      why: "لمآخذ الاستعمال العادي، العيار الشائع 30 ميلي أمبير."
    },
    {
      q: "عند نصف العيار، ماذا يجب أن يحدث؟",
      terms: "½ × IΔN",
      opts: [
        "يقطع دائماً",
        "يقطع في أقل من أربعين ميلي ثانية",
        "لا يقطع",
        "يقيس العزل"
      ],
      a: 2,
      why: "عند ½ × IΔN يجب ألا يقطع. عند 1 × IΔN يجب أن يقطع ونسجّل الزمن."
    },
    {
      q: "تقيس التفاضلي على نفس المأخذ في آخر الدارة. زمن القطع يجب أن يكون:",
      terms: "DDR · IΔT · 1 × IΔN",
      opts: [
        "أقل من خمس ثوانٍ",
        "مساوياً لتيار القصر",
        "غير مهم إذا اشتغل زر التجربة",
        "ثلاثمئة ميلي ثانية أو أقل"
      ],
      a: 3,
      why: "عند 1 × IΔN، زمن القطع المقبول ≤ 300 ميلي ثانية."
    },
    {
      q: "زر التجربة على التفاضلي:",
      terms: "touche Test",
      opts: [
        "يتحقق أن الآلية تتحرك، لكن لا يعطي زمن القطع ولا التيار",
        "يغني عن جهاز القياس",
        "يقيس تيار القصر",
        "يقيس العزل"
      ],
      a: 0,
      why: "زر التجربة يحرّك الآلية فقط. IΔN و IΔT يأتيان من جهاز القياس."
    },
    {
      q: "الجهاز يظهر زمن قطع ثمانمئة ميلي ثانية عند العيار. ماذا تفعل؟",
      terms: "IΔT = 800 ms · IΔN",
      opts: [
        "تقبل لأن التفاضلي تحرّك",
        "غير مقبول: تبدّل الجهاز وتعيد القياس",
        "تكتفي بزر التجربة",
        "تزيد طول الكابل"
      ],
      a: 1,
      why: "800 ميلي ثانية أكبر من 300. النتيجة غير مقبولة حتى لو تحرّك الجهاز."
    },
    {
      q: "نظام TT — قياس تيار العطل بين الطور والأرضي ماذا يفيد أساساً؟",
      terms: "نظام TT · تيار العطل L–PE",
      opts: [
        "قياس تيار القصر بين الطور والمحايد (Icc L–N)",
        "قياس العزل بالميغاأوم",
        "التحقق من مسار العطل عبر الموصل الواقي وحلقة الرجوع إلى الأرض",
        "ضبط عيار التفاضلي"
      ],
      a: 2,
      why: "في TT، قياس L–PE = تيار العطل (مسار عبر الواقي ورجوع الأرض). ليس Icc كالطور–محايد."
    },
    {
      q: "نظام TN — تيار القصر بين الطور والأرضي ماذا يمثّل؟",
      terms: "نظام TN · Icc L–PE",
      opts: [
        "نفس قياس العزل",
        "زمن قطع التفاضلي",
        "مقاومة الأرض فقط",
        "تيار القصر المحتمل عبر الموصل الواقي (Icc L–PE)"
      ],
      a: 3,
      why: "في TN، قياس L–PE = Icc (تيار قصر عبر الواقي). في TT نفس القياس L–PE يُسمّى تيار العطل."
    },
    {
      q: "متى تقيس تحت التوتر (تيار قصر، تفاضلي) بالنسبة لقياسات خارج التوتر؟",
      terms: "hors tension → sous tension",
      opts: [
        "بعد الاستمرارية والعزل وغياب التوتر، ثم القياسات تحت التوتر",
        "تحت التوتر أولاً ثم العزل",
        "لا ترتيب: أي قياس يكفي",
        "التفاضلي قبل الاستمرارية دائماً"
      ],
      a: 0,
      why: "الاستمرارية والعزل خارج التوتر أولاً. بعد إعادة التوتر: Icc ثم DDR."
    },
    {
      q: "مقاومة الأرض أو حلقة الأرض تُسجَّل عادة بأي وحدة؟",
      terms: "Re · Ω",
      opts: ["ميغاأوم / MΩ", "أوم / Ω", "فولت / V", "ميلي أمبير / mA"],
      a: 1,
      why: "Re تُكتب بالأوم (Ω). لا تخلطها مع Riso بالميغاأوم."
    },
    {
      q: "الجهاز يعطي قيماً غريبة فجأة. ماذا تفعل أولاً؟",
      terms: "batterie · cordons · fonction",
      opts: [
        "تعلن المنشأة معيبة فوراً",
        "تغيّر منحنى القاطع",
        "تتأكد من البطارية والموصلات والوظيفة المختارة على الجهاز",
        "تضغط زر التجربة على التفاضلي"
      ],
      a: 2,
      why: "قبل الحكم على المنشأة: بطارية ضعيفة، أسلاك مقطوعة، أو وظيفة خاطئة تفسّر أرقاماً شاذة."
    },
    {
      q: "على مأخذ، كيف تتحقق من القطبية الصحيحة؟",
      terms: "polarité L · N · PE",
      opts: [
        "المصباح يضيء يكفي",
        "أي ترتيب مقبول إذا وُجد توتّر",
        "تقيس العزل بدل القطبية",
        "الطور على L، المحايد على N، الواقي على PE"
      ],
      a: 3,
      why: "القطبية: الطور على L والمحايد على N والواقي على PE. الإضاءة وحدها لا تثبت الترتيب."
    },
    {
      q: "في شبكة ثلاثية الأطوار لمحرّك، ماذا يبيّن اختبار الحقل الدوّار؟",
      terms: "champ tournant · L1 L2 L3",
      opts: [
        "اتجاه دوران الأطوار (صحيح أو معكوس)",
        "قيمة العزل بالميغاأوم",
        "عيار التفاضلي",
        "طول الكابل بالأمتار"
      ],
      a: 0,
      why: "الحقل الدوّار يتحقق من ترتيب L1–L2–L3 حتى يدور المحرّك بالاتجاه المطلوب."
    },
    {
      q: "تيار القصر بين الطور والمحايد ماذا يمثّل؟",
      terms: "Icc L–N",
      opts: [
        "نفس قياس العزل",
        "تيار القصر المحتمل بين الطور والمحايد، لا عبر الواقي",
        "زمن قطع التفاضلي",
        "مقاومة الأرض فقط"
      ],
      a: 1,
      why: "Icc L–N = تيار قصر طور–محايد. مسار L–PE مسار آخر (في TN: Icc L–PE ؛ في TT: تيار العطل)."
    }
  ];

  var gate = document.getElementById("gate");
  var nick = document.getElementById("nick");
  var quiz = document.getElementById("quiz");
  var done = document.getElementById("done");
  var i = 0;
  var score = 0;
  var locked = false;
  var pseudo = "";
  var startedAt = 0;
  var durationSec = 0;
  var scoreSubmitted = false;

  function show(el) {
    gate.classList.toggle("on", el === gate);
    nick.classList.toggle("on", el === nick);
    quiz.classList.toggle("on", el === quiz);
    done.classList.toggle("on", el === done);
  }

  function normalize(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function already() {
    try {
      return sessionStorage.getItem(STORAGE) === "1";
    } catch (e) {
      return false;
    }
  }

  function markGate() {
    try {
      sessionStorage.setItem(STORAGE, "1");
    } catch (e) {}
  }

  function lb() {
    return window.QuizLeaderboard || null;
  }

  function setNickMsg(text, kind) {
    var msg = document.getElementById("nick-msg");
    if (!msg) return;
    msg.hidden = !text;
    msg.textContent = text || "";
    msg.className = "err";
    if (kind === "ok") msg.className = "ok-msg";
    if (kind === "wait") msg.className = "wait-msg";
  }

  function fillSavedPseudo() {
    var api = lb();
    var input = document.getElementById("pseudo");
    if (!input || !api) return;
    var saved = api.getSavedPseudo();
    if (saved) input.value = saved;
  }

  function goNick() {
    markGate();
    fillSavedPseudo();
    setNickMsg("", "");
    show(nick);
  }

  function startQuizWithPseudo(name) {
    pseudo = name;
    i = 0;
    score = 0;
    scoreSubmitted = false;
    startedAt = Date.now();
    durationSec = 0;
    renderQ();
    show(quiz);
  }

  document.getElementById("enter").addEventListener("click", function () {
    var err = document.getElementById("gate-err");
    if (normalize(document.getElementById("code").value) === CODE) {
      err.hidden = true;
      goNick();
    } else {
      err.hidden = false;
      err.textContent = "رمز غير صحيح. اطلبوا الرمز في القاعة.";
    }
  });
  document.getElementById("code").addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("enter").click();
  });

  document.getElementById("nick-go").addEventListener("click", function () {
    var api = lb();
    var input = document.getElementById("pseudo");
    var btn = document.getElementById("nick-go");
    if (!api) {
      setNickMsg("التصنيف غير متاح (إعداد الخادم).", "err");
      return;
    }
    var base = api.normalizePseudo(input.value);
    if (!api.isValidPseudoBase(base) && !api.isValidPseudo(base)) {
      setNickMsg(api.errorMessage("pseudo_invalid", "ar"), "err");
      return;
    }
    btn.disabled = true;
    setNickMsg("جاري التحقق من الاسم…", "wait");
    api.reservePseudo(base).then(function (res) {
      btn.disabled = false;
      if (res && res.ok && res.pseudo) {
        input.value = res.pseudo;
        setNickMsg("تم حفظ الاسم: " + res.pseudo, "ok");
        startQuizWithPseudo(res.pseudo);
        return;
      }
      var code = (res && res.error) || "network_reserve";
      setNickMsg(api.errorMessage(code, "ar"), "err");
    });
  });
  document.getElementById("pseudo").addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("nick-go").click();
  });

  function renderQ() {
    locked = false;
    var q = QUESTIONS[i];
    document.getElementById("progress").textContent =
      "سؤال " + (i + 1) + " / " + QUESTIONS.length;
    document.getElementById("qtext").textContent = q.q;
    var terms = document.getElementById("terms");
    if (q.terms) {
      terms.hidden = false;
      terms.textContent = q.terms;
    } else {
      terms.hidden = true;
      terms.textContent = "";
    }
    var why = document.getElementById("why");
    why.hidden = true;
    var next = document.getElementById("next");
    next.hidden = true;
    var box = document.getElementById("opts");
    box.innerHTML = "";
    q.opts.forEach(function (label, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.textContent = label;
      b.addEventListener("click", function () {
        pick(idx);
      });
      box.appendChild(b);
    });
  }

  function pick(idx) {
    if (locked) return;
    locked = true;
    var q = QUESTIONS[i];
    var buttons = document.querySelectorAll("#opts .opt");
    buttons.forEach(function (b, k) {
      if (k === q.a) b.classList.add("is-ok");
      if (k === idx && idx !== q.a) b.classList.add("is-bad");
      b.disabled = true;
    });
    if (idx === q.a) score += 1;
    var why = document.getElementById("why");
    why.hidden = false;
    why.textContent = q.why;
    var next = document.getElementById("next");
    next.hidden = false;
    next.textContent = i + 1 === QUESTIONS.length ? "النتيجة" : "التالي";
  }

  function finishScreen() {
    durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    document.getElementById("score").textContent = score + " / " + TOTAL;
    document.getElementById("score-time").textContent =
      "الوقت: " + durationSec + " ثانية · الاسم: " + (pseudo || "—");
    var msg = document.getElementById("score-msg");
    if (score >= 18) msg.textContent = "ممتاز — Icc و Riso و DDR حاضرة.";
    else if (score >= 13) msg.textContent = "جيد — راجعوا عتبة القاطع وزمن التفاضلي.";
    else msg.textContent = "أعيدوا قياسات آخر الدارة: Icc ثم Riso ثم DDR.";
    var submitMsg = document.getElementById("submit-msg");
    submitMsg.hidden = false;
    submitMsg.className = "wait-msg";
    submitMsg.textContent = "جاري إرسال النتيجة إلى التصنيف…";
    show(done);
    autoSubmit();
  }

  function autoSubmit() {
    var api = lb();
    var submitMsg = document.getElementById("submit-msg");
    var btn = document.getElementById("submit-score");
    if (!api || !pseudo) {
      submitMsg.className = "err";
      submitMsg.textContent = "تعذّر الإرسال: الاسم غير جاهز.";
      btn.disabled = false;
      return;
    }
    if (scoreSubmitted) {
      submitMsg.className = "ok-msg";
      submitMsg.textContent = "النتيجة مسجّلة في التصنيف.";
      btn.disabled = true;
      return;
    }
    btn.disabled = true;
    api
      .submitScore({
        pseudo: pseudo,
        moduleSlug: MODULE_SLUG,
        moduleId: null,
        score: score,
        total: TOTAL,
        durationSec: durationSec || 1
      })
      .then(function (res) {
        if (res && res.ok) {
          scoreSubmitted = true;
          submitMsg.className = "ok-msg";
          submitMsg.textContent =
            "تم التسجيل ✓ — " + score + "/" + TOTAL + " (" + (res.pct != null ? res.pct : Math.round((100 * score) / TOTAL)) + "٪)";
          btn.textContent = "تم التسجيل ✓";
          btn.disabled = true;
          return;
        }
        var code = (res && res.error) || "network_score";
        submitMsg.className = "err";
        if (code === "not_better" && res.best != null) {
          submitMsg.textContent =
            api.errorMessage("not_better", "ar") + " (" + res.best + "/" + TOTAL + ")";
          scoreSubmitted = true;
          btn.disabled = true;
        } else {
          submitMsg.textContent = api.errorMessage(code, "ar");
          btn.disabled = false;
          btn.textContent = "إعادة إرسال النتيجة";
        }
      });
  }

  document.getElementById("next").addEventListener("click", function () {
    if (i + 1 >= QUESTIONS.length) finishScreen();
    else {
      i += 1;
      renderQ();
    }
  });

  document.getElementById("submit-score").addEventListener("click", function () {
    autoSubmit();
  });

  document.getElementById("retry").addEventListener("click", function () {
    if (!pseudo) {
      goNick();
      return;
    }
    startQuizWithPseudo(pseudo);
  });

  if (already()) goNick();
})();
