(function () {
  'use strict';

  const qs = location.search || '';
  const hash = location.hash || '';
  if (new URLSearchParams(qs).get('code') || hash.includes('access_token=')) {
    location.replace('auth-callback.html' + qs + hash);
    return;
  }

  const sb = window.ElectroDzAuth.getClient();
  const redirectTo = window.ElectroDzAuth.oauthCallbackUrl();
  const t = (key) =>
    (window.ElectroDzAuthI18n && window.ElectroDzAuthI18n.t(key)) || key;

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) location.href = window.ElectroDzAuth.redirectAfterAuth();
  });

  const msgEl = document.getElementById('msg');
  const showMsg = (html, type) => {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.className = 'msg ' + type;
    msgEl.style.display = 'block';
  };

  document.getElementById('pwd')?.addEventListener('input', function () {
    const v = this.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const f = document.getElementById('bf');
    if (!f) return;
    f.style.width = s * 25 + '%';
    f.style.background = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][s] || '';
  });

  document.getElementById('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn');
    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const pwd = document.getElementById('pwd')?.value;
    const pwd2 = document.getElementById('pwd2')?.value;

    if (pwd !== pwd2) {
      showMsg(t('register.errMatch'), 'e');
      return;
    }
    if (!pwd || pwd.length < 8) {
      showMsg(t('register.errLen'), 'e');
      return;
    }

    if (btn) {
      btn.textContent = t('register.submitting');
      btn.disabled = true;
    }

    const { error } = await sb.auth.signUp({
      email,
      password: pwd,
      options: {
        data: { full_name: name },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      showMsg(error.message, 'e');
      if (btn) {
        btn.textContent = t('register.submit');
        btn.disabled = false;
      }
      return;
    }

    showMsg(t('register.createdMsg'), 's');
    if (btn) btn.textContent = t('register.created');
  });

  document.getElementById('gBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('gBtn');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }
    try {
      await window.ElectroDzAuth.signInWithGoogle();
    } catch (err) {
      showMsg(err?.message || t('register.errGoogle'), 'e');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '';
      }
    }
  });
})();
