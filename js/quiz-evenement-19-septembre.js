(function () {
  "use strict";

  var STORAGE = "edz-event19-ok";
  var CODE = "SWISS19";

  var QUESTIONS = [
    {
      q: "لماذا نقيس قبل تسليم تركيب كهربائي؟",
      opts: [
        "لأن الجهاز يجمّل الصورة على فيسبوك",
        "لأن بدون appareil de mesure يبقى الـ défaut تخميناً، ومع mesure يصبح دليلاً في le rapport de sécurité",
        "لأن GRD يطلب فاتورة فقط",
        "لأن القياس يغني عن examen visuel"
      ],
      a: 1,
      why: "هدف الأمان: حماية الأشخاص والأشياء. الرقم المكتوب هو اللغة التي يقبلها المالك وGRD.",
      src: "بيداغوجيا الندوة + OIBT art. 24"
    },
    {
      q: "وفق المادة 24 من OIBT، متى تُجرى première vérification؟",
      opts: [
        "بعد خمس سنوات من التشغيل",
        "فقط إذا طلب المالك ذلك كتابةً",
        "قبل mise en service لتركيب أو جزء منه، بموازاة البناء",
        "عند بيع العقار فقط"
      ],
      a: 2,
      why: "المادة 24: première vérification قبل وضع التركيب أو أجزائه في الخدمة، وتُثبَّت في procès-verbal.",
      src: "premiere-verification-oibt.pdf · oibt-mesures-jt22.pdf"
    },
    {
      q: "أين تُسجَّل نتائج première vérification؟",
      opts: [
        "في procès-verbal / protocole de mesure et d'essai",
        "في رسالة واتساب إلى الجار",
        "لا وثيقة إن اشتغل التركيب",
        "في ضمان تجاري شفهي فقط"
      ],
      a: 0,
      why: "OIBT art. 24: هذه الأولى تُثبَّت في procès-verbal. الوثيقة 1 تضيف أنها أساس للـ contrôle final اللاحق.",
      src: "premiere-verification-oibt.pdf · JT22"
    },
    {
      q: "من يجوز له إجراء première vérification (وفق الوثيقتين)؟",
      opts: [
        "أي صاحب محل كهرباء",
        "installateur-électricien CFC أو électricien de montage CFC وفق شروط التكوين",
        "المالك وحده",
        "المتدرّب بلا مراقبة"
      ],
      a: 1,
      why: "الوثيقة 1: CFC installateur أو montage (2015 أو complément). المتدربون تحت مراقبة personne du métier.",
      src: "premiere-verification-oibt.pdf"
    },
    {
      q: "من لا يحق له إجراء contrôle final أو périodique؟",
      opts: [
        "conseiller en sécurité électrique (Brevet)",
        "personne de métier (maîtrise)",
        "installateur CFC بمفرده دون صفة contrôle",
        "organe de contrôle مستقلة"
      ],
      a: 2,
      why: "JT22: installateur CFC ليس له حق CF ولا CR ولا CP. هذه للـ Brevet / maîtrise / organe de contrôle.",
      src: "oibt-mesures-jt22.pdf"
    },
    {
      q: "ما الترتيب الصحيح للسلسلة السويسرية؟",
      opts: [
        "rapport de sécurité ثم première vérification ثم visuel",
        "première vérification → contrôle final → rapport de sécurité → GRD  (ثم périodique)",
        "périodique أولاً ثم بناء التركيب",
        "إعلان فيسبوك ثم توصيل العداد"
      ],
      a: 1,
      why: "أثناء البناء: première vérification (procès-verbal). قبل التسليم: contrôle final و rapport de sécurité نحو GRD. لاحقاً périodique.",
      src: "OIBT art. 24 · الوثيقتان"
    },
    {
      q: "نحو كم في المئة من أخطاء التركيب يكشفها examen visuel الكامل (الوثيقة 1)؟",
      opts: ["نحو 10٪", "نحو 30٪", "نحو 70٪", "100٪ فلا حاجة لأي mesure"],
      a: 2,
      why: "الوثيقة 1: نحو 70٪ — خصوصاً ما لا تقيسه الأجهزة (absence de protection principale، barrière coupe-feu).",
      src: "premiere-verification-oibt.pdf"
    },
    {
      q: "إذا ظهرت عيوب أثناء examen visuel، ماذا يفعل المُتحكّم؟",
      opts: [
        "يكمل قياسات Icc فوراً",
        "يوقف التحكم وتُصلح العيوب قبل المتابعة",
        "يشغّل التركيب ليرى هل يتحمل",
        "يؤجّل visuel إلى périodique"
      ],
      a: 1,
      why: "JT22: إن وُجدت مشاكل من visuel يُوقف التحكم وتُصلح العيوب قبل أي قياس.",
      src: "oibt-mesures-jt22.pdf"
    },
    {
      q: "لماذا يجب فتح sectionneur de neutre عند قياس continuité (Rlo)؟",
      opts: [
        "لتجميل اللوحة",
        "وإلا قد نقيس موصل N بدل PE ولا نعرف ماذا نقيس",
        "لأن DDR لا يعمل إلا كذلك",
        "لا يُفتح أبداً"
      ],
      a: 1,
      why: "JT22: مع sectionneur مغلق لا نعرف ماذا نقيس. القياس خارج التوتر وsectionneur مفتوح.",
      src: "oibt-mesures-jt22.pdf"
    },
    {
      q: "قيم continuity الموصى بها في الوثيقة 1 (basse impédance)؟",
      opts: [
        "PE < 1 Ω و équipotentielle supplémentaire < 0,1 Ω  (Um 4–24 V و Im ≥ 200 mA)",
        "PE < 30 Ω دائماً",
        "أي صفير على الملتيمتر يكفي",
        "لا قيمة: القياس ممنوع"
      ],
      a: 0,
      why: "وثيقة première vérification: 4–24 V، 200 mA على الأقل، PE < 1 Ω، équipot. suppl. < 0,1 Ω.",
      src: "premiere-verification-oibt.pdf"
    },
    {
      q: "لماذا continuity قبل résistance d'isolement؟",
      opts: [
        "لا أهمية للترتيب",
        "لأن défaut d'isolement لا يظهر إذا كان PE غير موصول على العنصر",
        "لأن Riso أسهل",
        "لأن GRD يطلب ذلك في الفاتورة"
      ],
      a: 1,
      why: "JT22: نعم للترتيب أهمية كبيرة. عيب العزل لا يظهر إن لم يكن PE مربوطاً.",
      src: "oibt-mesures-jt22.pdf"
    },
    {
      q: "قيم Riso الواردة في JT22 للمنشأة 50–500 V؟",
      opts: [
        "250 V و ≥ 0,05 MΩ",
        "500 V و ≥ 1 MΩ",
        "50 V و ≥ 30 Ω",
        "لا قياس عزل إذا وُجد DDR"
      ],
      a: 1,
      why: "JT22: TBTS/TBTP 250 V ≥ 0,5 MΩ · 50–500 V : 500 V ≥ 1 MΩ · > 500 V : 1000 V ≥ 1 MΩ.",
      src: "oibt-mesures-jt22.pdf"
    },
    {
      q: "اختبار DDR 30 mA وفق JT22 (NIBT 2020) يشمل:",
      opts: [
        "touche d'essai فقط",
        "touche d'essai ثم 40٪ IΔn (12 mA) ثم 100٪ IΔn مع قطع ≤ 300 ms",
        "قياس Riso مكان DDR",
        "تشغيل التركيب 24 ساعة"
      ],
      a: 1,
      why: "JT22: زر التجربة، 40٪ IΔn، ثم 100٪ IΔn وقطع في 300 ms كحد أقصى. الهدف أن mesure de protection تعمل.",
      src: "oibt-mesures-jt22.pdf · premiere-verification-oibt.pdf"
    },
    {
      q: "زمن coupure automatique للمآخذ حتى 63 A (JT22 / NIBT 2020)؟",
      opts: ["5 ثوانٍ دائماً", "0,4 ثانية", "30 ثانية", "لا زمن إن وُجد terre"],
      a: 1,
      why: "JT22: prises حتى 63 A → 0,4 s. تيارات أعلى: 5 s وفق جداول NIBT / شكل الوثيقة 1.",
      src: "oibt-mesures-jt22.pdf"
    },
    {
      q: "ماذا تفرض الممارسة السويسرية على mesure de terre في rapport de sécurité؟",
      opts: [
        "نجاح تلقائي إن كانت أقل من 30 Ω",
        "عدم القياس إن وُجد DDR",
        "توثيق القيمة بـ Ω (ESTI يناير 2021) بلا حد قبول/رفض واحد من نوع 30 Ω في OIBT",
        "كتابة «bonne terre» بدون رقم"
      ],
      a: 2,
      why: "JT22 ينقل ESTI 2021: توثيق القياس. أربع طرائق. pince قد تكذب (chauffe-eau). لا حد 30 Ω كحكم OIBT.",
      src: "oibt-mesures-jt22.pdf · ESTI janv. 2021"
    },
    {
      q: "230 V × 16 A تعادل تقريباً:",
      opts: ["1 kVA وإعفاء كامل من contrôle", "3,7 kVA — عتبة avis d'installation لـ GRD وليست إعفاءً من contrôle", "25 kVA", "0,16 kVA"],
      a: 1,
      why: "230×16 ≈ 3,68 kVA ≈ 3,7 kVA. عتبة إعلان لـ gestionnaire de réseau، لا تلغي première vérification ولا contrôle final.",
      src: "بيداغوجيا الندوة · ESTI 221"
    },
    {
      q: "من الوثيقة 1: تشغيل قصير (enclenchement) ومراقبة النتيجة على تركيب مؤقت:",
      opts: [
        "مقبول إن لم يقع حادث",
        "غير مقبول — première vérification واجبة بنفس متطلبات التركيب النهائي",
        "يكفي إذا وافق رئيس الورشة شفهياً",
        "يغني عن visuel"
      ],
      a: 1,
      why: "الوثيقة 1: هذه الممارسة غير مقبولة. الحوادث مرتبطة بـ fils بلا protection principale.",
      src: "premiere-verification-oibt.pdf"
    },
    {
      q: "chute de tension في كامل التركيب وفق NIBT 5.2.5 (الوثيقتان) لا تتجاوز:",
      opts: ["40٪", "4٪ من tension assignée (نحو 9,2 V على 230 V)", "1 V دائماً", "لا حد إن كان Icc مرتفعاً"],
      a: 1,
      why: "الوثيقة 1 و JT22: 4٪. يمكن حسابها أو قياسها. 4٪ من 230 V = 9,2 V.",
      src: "premiere-verification-oibt.pdf · oibt-mesures-jt22.pdf"
    }
  ];

  var gate = document.getElementById("gate");
  var quiz = document.getElementById("quiz");
  var done = document.getElementById("done");
  var i = 0;
  var score = 0;
  var locked = false;

  function show(el) {
    gate.classList.toggle("on", el === gate);
    quiz.classList.toggle("on", el === quiz);
    done.classList.toggle("on", el === done);
  }

  function normalize(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function unlock() {
    try {
      sessionStorage.setItem(STORAGE, "1");
    } catch (e) {}
    i = 0;
    score = 0;
    renderQ();
    show(quiz);
  }

  function already() {
    try {
      return sessionStorage.getItem(STORAGE) === "1";
    } catch (e) {
      return false;
    }
  }

  document.getElementById("enter").addEventListener("click", function () {
    var err = document.getElementById("gate-err");
    if (normalize(document.getElementById("code").value) === CODE) {
      err.hidden = true;
      unlock();
    } else {
      err.hidden = false;
      err.textContent = "رمز غير صحيح. اطلبوا الرمز في القاعة.";
    }
  });
  document.getElementById("code").addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("enter").click();
  });

  function renderQ() {
    locked = false;
    var q = QUESTIONS[i];
    document.getElementById("progress").textContent =
      "سؤال " + (i + 1) + " / " + QUESTIONS.length;
    document.getElementById("qtext").textContent = q.q;
    document.getElementById("src").textContent = q.src;
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
        pick(idx, b);
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

  document.getElementById("next").addEventListener("click", function () {
    if (i + 1 >= QUESTIONS.length) {
      document.getElementById("score").textContent =
        score + " / " + QUESTIONS.length;
      var msg = document.getElementById("score-msg");
      if (score >= 15) msg.textContent = "ممتاز — السلسلة والقياسات حاضرة.";
      else if (score >= 10) msg.textContent = "جيد — راجعوا ترتيب hors tension و DDR.";
      else msg.textContent = "أعيدوا شرائح الصباح: visuel ثم PE ثم Riso ثم التوتر.";
      show(done);
    } else {
      i += 1;
      renderQ();
    }
  });

  document.getElementById("retry").addEventListener("click", function () {
    i = 0;
    score = 0;
    renderQ();
    show(quiz);
  });

  if (already()) unlock();
})();
