/**
 * Retour OAuth (Google) — échange le code PKCE puis redirige vers le dashboard.
 */
(function () {
  'use strict';

  async function finish() {
    const statusEl = document.getElementById('status');
    const errEl = document.getElementById('err');
    const spin = document.getElementById('spin');

    function fail(message) {
      if (spin) spin.style.display = 'none';
      if (statusEl) statusEl.textContent = 'Échec de la connexion';
      if (errEl) {
        errEl.textContent = message || 'Connexion annulée.';
        errEl.style.display = 'block';
      }
      setTimeout(() => {
        location.replace(
          'login.html?error=' + encodeURIComponent(message || 'Connexion Google impossible')
        );
      }, 2200);
    }

    try {
      const sb = window.ElectroDzAuth.getClient();
      const params = new URLSearchParams(window.location.search);

      const oauthError =
        params.get('error_description') || params.get('error');
      if (oauthError) {
        fail(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
        return;
      }

      const code = params.get('code');
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          fail(error.message);
          return;
        }
      }

      const { data, error: sessionError } = await sb.auth.getSession();
      if (sessionError) {
        fail(sessionError.message);
        return;
      }
      if (!data.session) {
        fail('Session introuvable après Google. Réessayez.');
        return;
      }

      if (statusEl) statusEl.textContent = 'Connexion réussie, redirection…';
      location.replace(window.ElectroDzAuth.redirectAfterAuth());
    } catch (e) {
      fail(e?.message || String(e));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finish);
  } else {
    finish();
  }
})();
