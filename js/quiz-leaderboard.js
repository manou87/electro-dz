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
      pseudo_invalid: "Pseudo invalide (3–16 caractères : lettres, chiffres, _ - .)",
      module_invalid: "Module inconnu.",
      score_invalid: "Score invalide.",
      duration_invalid: "Durée trop courte — refaites le module sans tricher.",
      not_better: "Score déjà enregistré : vous devez battre votre record.",
      network: "Impossible d’envoyer le score. Réessayez plus tard.",
      config: "Classement indisponible (configuration serveur).",
    };
    const ar = {
      pseudo_invalid: "اسم مستعار غير صالح (3–16 حرفاً: حروف، أرقام، _ - .)",
      module_invalid: "وحدة غير معروفة.",
      score_invalid: "نتيجة غير صالحة.",
      duration_invalid: "مدة قصيرة جداً — أعد الوحدة بجدية.",
      not_better: "النتيجة مسجّلة مسبقاً: يجب تحطيم رقمك.",
      network: "تعذّر إرسال النتيجة. حاول لاحقاً.",
      config: "التصنيف غير متاح (إعداد الخادم).",
    };
    const dict = lang === "ar" ? ar : fr;
    return dict[code] || dict.network;
  }

  async function submitScore(opts) {
    const pseudo = normalizePseudo(opts.pseudo);
    if (!isValidPseudo(pseudo)) {
      return { ok: false, error: "pseudo_invalid" };
    }

    let sb;
    try {
      sb = getClient();
    } catch (_) {
      return { ok: false, error: "config" };
    }

    const { data, error } = await sb.rpc("submit_quiz_score", {
      p_pseudo: pseudo,
      p_module_slug: opts.moduleSlug,
      p_module_id: opts.moduleId || null,
      p_score: opts.score,
      p_total: opts.total,
      p_duration_sec: opts.durationSec,
    });

    if (error) {
      console.error("submit_quiz_score", error);
      return { ok: false, error: "network" };
    }

    if (data && data.ok) {
      savePseudo(pseudo);
    }

    return data || { ok: false, error: "network" };
  }

  async function fetchLeaderboard(moduleSlug, limit) {
    let sb;
    try {
      sb = getClient();
    } catch (_) {
      return { ok: false, rows: [], error: "config" };
    }

    const { data, error } = await sb.rpc("get_quiz_leaderboard", {
      p_module_slug: moduleSlug || null,
      p_limit: limit || 50,
    });

    if (error) {
      console.error("get_quiz_leaderboard", error);
      return { ok: false, rows: [], error: "network" };
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
    isValidPseudo,
    errorMessage,
    submitScore,
    fetchLeaderboard,
    getSessionUser,
  };
})(typeof window !== "undefined" ? window : globalThis);
