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
          const msg = error.message || '';
          if (/invalid api key/i.test(msg)) {
            fail(
              'Clé API Supabase invalide sur le site. Dashboard → Settings → API → copiez la clé « anon public », puis : node scripts/set-anon-key.mjs VOTRE_CLE (voir supabase/COPIER-CLE-ANON.txt).'
            );
            return;
          }
          fail(
            msg +
              ' — Vérifiez aussi Redirect URLs : ' +
              location.origin +
              '/auth-callback.html'
          );
          return;
        }
      } else if (location.hash && location.hash.includes('access_token')) {
        const { error } = await sb.auth.getSession();
        if (error) {
          fail(error.message);
          return;
        }
      } else {
        await new Promise((resolve) => {
          const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              subscription.unsubscribe();
              resolve();
            }
          });
          setTimeout(resolve, 2500);
        });
      }

      const session = await waitForSession(sb, 3000);
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
