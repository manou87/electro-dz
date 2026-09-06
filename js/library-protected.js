/**
 * PDF protégés par mot de passe (bibliothèque + lecteur).
 * Config : ElectroDzSite.libraryProtected dans site-config.js
 */
(function (g) {
  "use strict";

  const STORAGE_KEY = "electrodz-lib-unlocked";
  /** Fin d’accès libre (inclus) — aligné sur ElectroDzSite.libraryFreeUntil */
  const DEFAULT_FREE_UNTIL = "2026-09-16";
  const DEFAULT_GROUPS = [
    {
      key: "fet",
      bookIds: ["fet1-2014", "fet2-2013", "fet3-2014"],
      passwordSha256:
        "d5c86339a450038ca96787f78db4edbcef8f6774f0d4518998926bf55c11e9f5",
      labelFr: "FET 1, 2 et 3",
      labelAr: "FET 1 و 2 و 3",
      labelEn: "FET 1, 2 and 3",
    },
    {
      key: "ae-prof",
      bookIds: ["ae-prof-2019"],
      passwordSha256:
        "071a51aa208c43df5218ec197b713668cbc859d73dd94fa78107c6ed496a7a09",
      labelFr: "AE professionnel",
      labelAr: "التكوين المهني AE",
      labelEn: "AE professional",
    },
  ];

  function freeUntilIso() {
    const cfg = g.ElectroDzSite;
    if (cfg && cfg.libraryFreeUntil) return String(cfg.libraryFreeUntil);
    if (cfg && cfg.libraryProtected && cfg.libraryProtected.freeUntil) {
      return String(cfg.libraryProtected.freeUntil);
    }
    return DEFAULT_FREE_UNTIL;
  }

  /** Accès libre sans mot de passe jusqu’à la date (fin de journée locale). */
  function isFreeAccess() {
    const iso = freeUntilIso();
    const end = new Date(iso + "T23:59:59");
    if (isNaN(end.getTime())) return false;
    return Date.now() <= end.getTime();
  }

  function freeUntilLabel(lang) {
    const iso = freeUntilIso();
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    const l = lang || getLang();
    if (l === "ar") return d + "/" + m + "/" + y;
    if (l === "en") return d + "/" + m + "/" + y;
    return d + "/" + m + "/" + y;
  }

  function freeAccessMessage() {
    const date = freeUntilLabel();
    return t(
      "Accès libre — testez sans code jusqu’au " + date,
      "دخول مجاني — جرّب بدون رمز حتى " + date,
      "Free access — try without a code until " + date
    );
  }

  function getGroups() {
    const cfg = g.ElectroDzSite && g.ElectroDzSite.libraryProtected;
    if (cfg && Array.isArray(cfg.groups) && cfg.groups.length) return cfg.groups;
    return DEFAULT_GROUPS;
  }

  function bookToGroup(bookId) {
    const groups = getGroups();
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].bookIds && groups[i].bookIds.indexOf(bookId) !== -1) return groups[i];
    }
    return null;
  }

  function loadUnlocked() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveUnlocked(keys) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (_) { /* ignore */ }
  }

  function sha256Hex(text) {
    const enc = new TextEncoder();
    return crypto.subtle
      .digest("SHA-256", enc.encode(String(text)))
      .then(function (buf) {
        return Array.from(new Uint8Array(buf))
          .map(function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("");
      });
  }

  function isProtected(bookId) {
    if (isFreeAccess()) return false;
    return !!bookToGroup(bookId);
  }

  function isUnlocked(bookId) {
    if (isFreeAccess()) return true;
    const group = bookToGroup(bookId);
    if (!group) return true;
    return loadUnlocked().indexOf(group.key) !== -1;
  }

  function unlockGroup(groupKey) {
    const keys = loadUnlocked();
    if (keys.indexOf(groupKey) === -1) {
      keys.push(groupKey);
      saveUnlocked(keys);
    }
  }

  function getLang() {
    try {
      const s = localStorage.getItem("electrodz-site-lang");
      if (s === "fr" || s === "ar" || s === "en") return s;
    } catch (_) { /* ignore */ }
    return "ar";
  }

  function t(fr, ar, en) {
    const l = getLang();
    if (l === "ar") return ar;
    if (l === "en") return en != null && en !== "" ? en : fr;
    return fr;
  }

  let modalEl = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement("div");
    modalEl.className = "lib-lock-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.hidden = true;
    modalEl.innerHTML =
      '<div class="lib-lock-dialog">' +
      '<h2 class="lib-lock-title"></h2>' +
      '<p class="lib-lock-hint"></p>' +
      '<label class="lib-lock-label"></label>' +
      '<input type="password" class="lib-lock-input" autocomplete="current-password"/>' +
      '<p class="lib-lock-error" hidden></p>' +
      '<div class="lib-lock-actions">' +
      '<button type="button" class="lib-lock-cancel"></button>' +
      '<button type="button" class="lib-lock-submit"></button>' +
      "</div></div>";
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeModal(false);
    });
    return modalEl;
  }

  function closeModal(ok) {
    if (!modalEl) return;
    modalEl.hidden = true;
    if (modalEl._resolve) {
      modalEl._resolve(!!ok);
      modalEl._resolve = null;
    }
  }

  function promptUnlock(bookId) {
    const group = bookToGroup(bookId);
    if (!group) return Promise.resolve(true);
    if (isUnlocked(bookId)) return Promise.resolve(true);

    ensureModal();
    const title = modalEl.querySelector(".lib-lock-title");
    const hint = modalEl.querySelector(".lib-lock-hint");
    const label = modalEl.querySelector(".lib-lock-label");
    const input = modalEl.querySelector(".lib-lock-input");
    const err = modalEl.querySelector(".lib-lock-error");
    const btnCancel = modalEl.querySelector(".lib-lock-cancel");
    const btnSubmit = modalEl.querySelector(".lib-lock-submit");

    title.textContent = "🔒 " + t("Accès protégé", "وصول محمي", "Protected access");
    hint.textContent =
      t("Document réservé : ", "وثيقة محجوزة: ", "Restricted document: ") +
      t(group.labelFr, group.labelAr, group.labelEn || group.labelFr);
    label.textContent = t("Mot de passe", "كلمة المرور", "Password");
    input.value = "";
    err.hidden = true;
    err.textContent = "";
    btnCancel.textContent = t("Annuler", "إلغاء", "Cancel");
    btnSubmit.textContent = t("Déverrouiller", "فتح", "Unlock");

    modalEl.hidden = false;
    input.focus();

    return new Promise(function (resolve) {
      modalEl._resolve = resolve;

      function submit() {
        const pwd = input.value;
        sha256Hex(pwd).then(function (hash) {
          if (hash === group.passwordSha256) {
            unlockGroup(group.key);
            closeModal(true);
          } else {
            err.textContent = t("Mot de passe incorrect.", "كلمة المرور غير صحيحة.", "Incorrect password.");
            err.hidden = false;
            input.select();
          }
        });
      }

      btnSubmit.onclick = submit;
      btnCancel.onclick = function () {
        closeModal(false);
      };
      input.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
        if (e.key === "Escape") closeModal(false);
      };
    });
  }

  function guardAccess(bookId, onAllowed) {
    if (!isProtected(bookId) || isUnlocked(bookId)) {
      onAllowed();
      return;
    }
    promptUnlock(bookId).then(function (ok) {
      if (ok) onAllowed();
    });
  }

  g.ElectroDzLibraryLock = {
    isProtected: isProtected,
    isUnlocked: isUnlocked,
    isFreeAccess: isFreeAccess,
    freeUntilIso: freeUntilIso,
    freeAccessMessage: freeAccessMessage,
    promptUnlock: promptUnlock,
    guardAccess: guardAccess,
    bookToGroup: bookToGroup,
  };

  function mountFreeBanner() {
    if (!isFreeAccess()) return;
    try {
      document.documentElement.setAttribute("data-lib-free", freeUntilIso());
    } catch (_) { /* ignore */ }

    if (document.getElementById("edz-lib-free-banner")) return;
    var path = (location.pathname || "").toLowerCase();
    if (path.indexOf("bibliotheque") < 0 && path.indexOf("lecteur") < 0) return;

    var banner = document.createElement("div");
    banner.id = "edz-lib-free-banner";
    banner.setAttribute("role", "status");
    banner.style.cssText =
      "margin:0 0 1rem;padding:12px 14px;border-radius:10px;" +
      "border:1px solid rgba(167,139,250,.45);background:rgba(167,139,250,.12);" +
      "color:#e9d5ff;font-size:.9rem;font-weight:700;line-height:1.35;" +
      "box-shadow:0 0 18px rgba(167,139,250,.15)";
    banner.textContent = freeAccessMessage();

    var host =
      document.querySelector(".library-hero-row") ||
      document.querySelector("main.page") ||
      document.querySelector("main");
    if (host) {
      if (host.classList && host.classList.contains("library-hero-row")) {
        host.parentNode.insertBefore(banner, host.nextSibling);
      } else {
        host.insertBefore(banner, host.firstChild);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFreeBanner);
  } else {
    mountFreeBanner();
  }
})(typeof window !== "undefined" ? window : globalThis);
