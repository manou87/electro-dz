(function () {
  'use strict';

  const sb = window.ElectroDzAuth.getClient();
  const redirectTo = window.ElectroDzAuth.redirectAfterAuth();

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) location.href = 'dashboard.html';
  });

  const msgEl = document.getElementById('msg');
  const showMsg = (html, type) => {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.className = 'msg ' + type;
    msgEl.style.display = 'block';
  };

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

    location.href = 'dashboard.html';
  });

  document.getElementById('gBtn')?.addEventListener('click', () => {
    sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  });
})();
