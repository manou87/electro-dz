/**
 * Classement quiz NF C 15-100 — soumission pseudo + lecture Supabase RPC.
 */
(function (g) {
  "use strict";

  const STORAGE_PSEUDO = "quiz-nfc-pseudo";

  function getSavedPseudo() {
    try {
      return localStorage.getItem(STORAGE_PSEUDO) || "";
    } catch (_) {
      return "";
    }
  }

  function savePseudo(pseudo) {
    try {
      localStorage.setItem(STORAGE_PSEUDO, pseudo);
    } catch (_) {}
  }

  function normalizePseudo(pseudo) {
    return String(pseudo || "").trim();
  }

  function isValidPseudoBase(pseudo) {
    return /^[A-Za-z0-9_\-\.]{3,12}$/.test(pseudo);
  }

  function isValidPseudo(pseudo) {
    return /^[A-Za-z0-9_\-\.]{3,16}$/.test(pseudo);
  }

  function getClient() {
    if (!g.ElectroDzAuth || !g.ElectroDzAuth.getClient) {
      throw new Error("Supabase non configuré");
    }
    return g.ElectroDzAuth.getClient();
  }

  function errorMessage(code, lang) {
    const fr = {
      pseudo_invalid: "Pseudo invalide (3–12 caractères : lettres, chiffres, _ - .)",
      pseudo_taken:
        "Ce surnom est déjà pris. Choisissez un autre nom de base (3–12 caractères).",
      pseudo_unavailable: "Impossible de générer un surnom unique. Réessayez avec un autre nom.",
      module_invalid: "Module inconnu.",
      score_invalid: "Score invalide.",
      duration_invalid: "Durée invalide — réessayez.",
      not_better: "Score déjà enregistré : vous devez battre votre record.",
      network_reserve:
        "Impossible de valider le surnom. Vérifiez votre connexion puis rechargez la page (Cmd+Shift+R).",
      network_score:
        "Impossible d’envoyer le score. Vérifiez votre connexion et réessayez.",
      network: "Connexion au serveur impossible. Réessayez.",
      outdated:
        "Version du quiz obsolète — rechargez la page avec Cmd+Shift+R (ou Ctrl+F5).",
      config: "Classement indisponible (configuration serveur).",
    };
    const ar = {
      pseudo_invalid: "اسم مستعار غير صالح (3–12 حرفاً: حروف، أرقام، _ - .)",
      pseudo_taken: "هذا الاسم مستخدم. اختر اسماً آخر (3–12 حرفاً).",
      pseudo_unavailable: "تعذّر إنشاء اسم فريد. جرّب اسماً مختلفاً.",
      module_invalid: "وحدة غير معروفة.",
      score_invalid: "نتيجة غير صالحة.",
      duration_invalid: "مدة غير صالحة — حاول مجدداً.",
      not_better: "النتيجة مسجّلة مسبقاً: يجب تحطيم رقمك.",
      network_reserve:
        "تعذّر التحقق من الاسم. تحقق من الشبكة ثم أعد تحميل الصفحة.",
      network_score: "تعذّر إرسال النتيجة. تحقق من الشبكة وحاول مجدداً.",
      network: "تعذّر الاتصال بالخادم. حاول مجدداً.",
      outdated: "نسخة قديمة من الاختبار — أعد تحميل الصفحة.",
      config: "التصنيف غير متاح (إعداد الخادم).",
    };
    const en = {
      pseudo_invalid: "Invalid nickname (3–12 characters: letters, digits, _ - .)",
      pseudo_taken:
        "This nickname is already taken. Choose another base name (3–12 characters).",
      pseudo_unavailable: "Could not generate a unique nickname. Try a different name.",
      module_invalid: "Unknown module.",
      score_invalid: "Invalid score.",
      duration_invalid: "Invalid duration — try again.",
      not_better: "Score already saved: you must beat your record.",
      network_reserve:
        "Could not confirm the nickname. Check your connection then reload (Cmd+Shift+R).",
      network_score:
        "Could not submit the score. Check your connection and try again.",
      network: "Could not reach the server. Try again.",
      outdated:
        "Outdated quiz version — reload the page with Cmd+Shift+R (or Ctrl+F5).",
      config: "Leaderboard unavailable (server configuration).",
    };
    const dict = lang === "ar" ? ar : lang === "en" ? en : fr;
    return dict[code] || dict.network;
  }

  function getSupabaseConfig() {
    const cfg = g.ElectroDzSite && g.ElectroDzSite.supabase;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    return cfg;
  }

  async function callRpc(name, payload, timeoutMs) {
    const cfg = getSupabaseConfig();
    if (!cfg) return { data: null, error: { message: "config" } };

    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs || 12000);

    try {
      const res = await fetch(cfg.url + "/rest/v1/rpc/" + name, {
        method: "POST",
        headers: {
          apikey: cfg.anonKey,
          Authorization: "Bearer " + cfg.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload || {}),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(function () {
          return "";
        });
        console.error(name, res.status, detail);
        if (res.status === 404) {
          return { data: null, error: { message: "rpc_missing", status: 404 } };
        }
        return { data: null, error: { message: "http_" + res.status, status: res.status } };
      }

      const text = await res.text();
      if (!text) {
        return { data: null, error: { message: "empty_response" } };
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error(name, "json", parseErr, text);
        return { data: null, error: { message: "bad_json" } };
      }
      return { data: data, error: null };
    } catch (err) {
      console.error(name, err);
      return { data: null, error: err };
    } finally {
      clearTimeout(timer);
    }
  }

  async function reservePseudo(base) {
    const pseudo = normalizePseudo(base);
    if (!isValidPseudo(pseudo) && !isValidPseudoBase(pseudo)) {
      return { ok: false, error: "pseudo_invalid" };
    }

    const { data, error } = await callRpc("reserve_quiz_pseudo", { p_base: pseudo });

    if (error) {
      if (error.message === "rpc_missing") {
        return { ok: false, error: "outdated" };
      }
      return { ok: false, error: "network_reserve" };
    }

    if (data && data.ok) {
      savePseudo(data.pseudo);
    }

    return data || { ok: false, error: "network_reserve" };
  }

  async function submitScore(opts) {
    const pseudo = normalizePseudo(opts.pseudo);
    if (!isValidPseudo(pseudo)) {
      return { ok: false, error: "pseudo_invalid" };
    }

    const { data, error } = await callRpc("submit_quiz_score", {
      p_pseudo: pseudo,
      p_module_slug: opts.moduleSlug,
      p_module_id: opts.moduleId || null,
      p_score: opts.score,
      p_total: opts.total,
      p_duration_sec: opts.durationSec,
    });

    if (error) {
      return { ok: false, error: "network_score" };
    }

    if (data && data.ok) {
      savePseudo(pseudo);
    }

    return data || { ok: false, error: "network_score" };
  }

  async function fetchLeaderboard(moduleSlug, limit) {
    const { data, error } = await callRpc("get_quiz_leaderboard", {
      p_module_slug: moduleSlug || null,
      p_limit: limit || 50,
    });

    if (error) {
      return { ok: false, rows: [], error: "network_score" };
    }

    return { ok: true, rows: data || [] };
  }

  async function getSessionUser() {
    try {
      const sb = getClient();
      const { data } = await sb.auth.getSession();
      return data?.session?.user || null;
    } catch (_) {
      return null;
    }
  }

  g.QuizLeaderboard = {
    STORAGE_PSEUDO,
    getSavedPseudo,
    savePseudo,
    normalizePseudo,
    isValidPseudoBase,
    isValidPseudo,
    errorMessage,
    reservePseudo,
    submitScore,
    fetchLeaderboard,
    getSessionUser,
  };
})(typeof window !== "undefined" ? window : globalThis);
