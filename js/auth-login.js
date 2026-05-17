(function () {
  'use strict';

  const qs = location.search || '';
  const hash = location.hash || '';
  if (new URLSearchParams(qs).get('code') || hash.includes('access_token=')) {
    location.replace('auth-callback.html' + qs + hash);
    return;
  }

  const sb = window.ElectroDzAuth.getClient();

  function postLoginUrl() {
    const r = new URLSearchParams(location.search).get('redirect');
    if (!r) return window.ElectroDzAuth.redirectAfterAuth();
    try {
      return new URL(r, location.origin).href;
    } catch (_) {
      return r.startsWith('/') ? location.origin + r : window.ElectroDzAuth.redirectAfterAuth();
    }
  }

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) location.href = postLoginUrl();
  });

  const msgEl = document.getElementById('msg');
  const showMsg = (html, type) => {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.className = 'msg ' + type;
    msgEl.style.display = 'block';
  };

  const urlError = new URLSearchParams(location.search).get('error');
  if (urlError) {
    showMsg(decodeURIComponent(urlError), 'e');
  }

  document.getElementById('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn');
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('pwd')?.value;
    if (!email || !password) return;

    if (btn) {
      btn.textContent = 'Connexion…';
      btn.disabled = true;
    }

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      showMsg('Email ou mot de passe incorrect.', 'e');
      if (btn) {
        btn.textContent = 'Se connecter';
        btn.disabled = false;
      }
      return;
    }

    location.href = postLoginUrl();
  });

  document.getElementById('gBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('gBtn');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }
    try {
      if (new URLSearchParams(location.search).get('redirect')) {
        window.ElectroDzAuth.savePostAuthRedirect(postLoginUrl());
      }
      await window.ElectroDzAuth.signInWithGoogle();
    } catch (err) {
      showMsg(
        err?.message ||
          'Connexion Google indisponible. Vérifiez que Google est activé dans Supabase.',
        'e'
      );
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '';
      }
    }
  });
})();
