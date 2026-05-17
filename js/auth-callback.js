/**
 * Retour OAuth (Google) — échange le code PKCE puis redirige vers le dashboard.
 */
(function () {
  'use strict';

  async function waitForSession(sb, maxMs) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      if (data.session) return data.session;
      await new Promise((r) => setTimeout(r, 150));
    }
    return null;
  }

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
      }, 4000);
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
          fail(
            error.message +
              ' — Ajoutez https://electro-dz.com/auth-callback.html dans Supabase → Redirect URLs.'
          );
          return;
        }
      } else if (location.hash && location.hash.includes('access_token')) {
        const { error } = await sb.auth.getSession();
        if (error) {
          fail(error.message);
          return;
        }
      }

      const session = await waitForSession(sb, 4000);
      if (!session) {
        fail(
          'Session introuvable après Google. Vérifiez Redirect URLs : https://electro-dz.com/auth-callback.html'
        );
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
