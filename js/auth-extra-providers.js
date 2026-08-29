/**
 * Facebook (OAuth) + téléphone (SMS OTP) — pages login / register.
 * Même compte Supabase (UID) que Google / e-mail.
 */
(function () {
  'use strict';

  const t = (key) =>
    (window.ElectroDzAuthI18n && window.ElectroDzAuthI18n.t(key)) || key;

  const msgEl = document.getElementById('msg');
  const showMsg = (html, type) => {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.className = 'msg ' + type;
    msgEl.style.display = 'block';
  };

  function postAuthUrl() {
    if (document.body.getAttribute('data-auth-page') === 'login') {
      const r = new URLSearchParams(location.search).get('redirect');
      if (r) {
        try {
          return new URL(r, location.origin).href;
        } catch (_) {
          return r.startsWith('/')
            ? location.origin + r
            : window.ElectroDzAuth.redirectAfterAuth();
        }
      }
    }
    return window.ElectroDzAuth.redirectAfterAuth();
  }

  function setBusy(el, busy) {
    if (!el) return;
    el.disabled = !!busy;
    el.style.opacity = busy ? '0.7' : '';
  }

  document.getElementById('fbBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('fbBtn');
    setBusy(btn, true);
    try {
      if (document.body.getAttribute('data-auth-page') === 'login') {
        const r = new URLSearchParams(location.search).get('redirect');
        if (r) window.ElectroDzAuth.savePostAuthRedirect(postAuthUrl());
      }
      await window.ElectroDzAuth.signInWithFacebook();
    } catch (err) {
      showMsg(err?.message || t('auth.errFacebook'), 'e');
      setBusy(btn, false);
    }
  });

  const phoneToggle = document.getElementById('phoneToggle');
  const phonePanel = document.getElementById('phonePanel');
  const phoneSend = document.getElementById('phoneSend');
  const phoneVerify = document.getElementById('phoneVerify');
  const otpWrap = document.getElementById('otpWrap');
  const phoneNum = document.getElementById('phoneNum');
  const phoneCc = document.getElementById('phoneCc');
  const phoneOtp = document.getElementById('phoneOtp');

  let pendingPhone = '';

  function revealOtpField() {
    if (!otpWrap) return;
    otpWrap.removeAttribute('hidden');
    otpWrap.classList.add('is-visible');
    otpWrap.setAttribute('aria-hidden', 'false');
    otpWrap.style.display = 'block';
    try {
      otpWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
    phoneOtp?.focus();
  }

  phoneToggle?.addEventListener('click', () => {
    if (!phonePanel) return;
    const open = phonePanel.hasAttribute('hidden');
    if (open) phonePanel.removeAttribute('hidden');
    else phonePanel.setAttribute('hidden', '');
    phoneToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) phoneNum?.focus();
  });

  phoneSend?.addEventListener('click', async () => {
    const raw = phoneNum?.value || '';
    const cc = phoneCc?.value || '+213';
    const e164 = window.ElectroDzAuth.formatPhoneE164(raw, cc);
    if (!e164) {
      showMsg(t('auth.errPhoneFormat'), 'e');
      return;
    }
    const prev = phoneSend.textContent;
    phoneSend.textContent = t('auth.phoneSending');
    setBusy(phoneSend, true);
    try {
      await window.ElectroDzAuth.sendPhoneOtp(e164);
      pendingPhone = e164;
      revealOtpField();
      showMsg(t('auth.smsSent'), 's');
    } catch (err) {
      showMsg(err?.message || t('auth.errPhone'), 'e');
    } finally {
      phoneSend.textContent = prev;
      setBusy(phoneSend, false);
    }
  });

  phoneVerify?.addEventListener('click', async () => {
    const token = phoneOtp?.value || '';
    if (!pendingPhone) {
      showMsg(t('auth.errPhoneFormat'), 'e');
      return;
    }
    if (!/^\d{4,8}$/.test(token.trim())) {
      showMsg(t('auth.errOtp'), 'e');
      return;
    }
    const prev = phoneVerify.textContent;
    phoneVerify.textContent = t('auth.phoneVerifying');
    setBusy(phoneVerify, true);
    try {
      await window.ElectroDzAuth.verifyPhoneOtp(pendingPhone, token);
      try {
        await window.ElectroDzFavorites?.mergeLocalAfterLogin?.();
      } catch (_) {}
      location.href = postAuthUrl();
    } catch (err) {
      showMsg(err?.message || t('auth.errOtp'), 'e');
      phoneVerify.textContent = prev;
      setBusy(phoneVerify, false);
    }
  });

  phoneOtp?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      phoneVerify?.click();
    }
  });

  phoneNum?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      phoneSend?.click();
    }
  });
})();
