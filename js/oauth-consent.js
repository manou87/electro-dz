/**
 * Page OAuth consent — Supabase OAuth Server (/oauth/consent).
 * Avec authorization_id : écran réel Approuver / Refuser.
 * Sans paramètre : aperçu pour la validation Google / Supabase.
 */
(function () {
  'use strict';

  const SCOPE_LABELS = {
    openid: 'Identité',
    email: 'Adresse e-mail',
    profile: 'Profil (nom, photo)',
    phone: 'Téléphone',
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showMsg(text, type) {
    const el = document.getElementById('msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg ' + (type || 'e');
    el.style.display = 'block';
  }

  function loginUrl() {
    const returnTo = location.pathname + location.search;
    const base = window.ElectroDzSite?.url?.login?.() || '../../login.html';
    const sep = base.includes('?') ? '&' : '?';
    return base + sep + 'redirect=' + encodeURIComponent(returnTo);
  }

  function formatScopes(scopeStr) {
    if (!scopeStr || !String(scopeStr).trim()) {
      return '<li>Accès de base au compte</li>';
    }
    return String(scopeStr)
      .trim()
      .split(/\s+/)
      .map((s) => '<li>' + esc(SCOPE_LABELS[s] || s) + '</li>')
      .join('');
  }

  function renderDetails(details) {
    const box = document.getElementById('details');
    const title = document.getElementById('flow-title');
    if (!box) return;

    const clientName = details?.client?.name || details?.client_name || 'Application';
    if (title) title.textContent = 'Autoriser « ' + clientName + ' » ?';

    box.innerHTML =
      '<p><strong>Application :</strong> ' +
      esc(clientName) +
      '</p>' +
      (details?.redirect_uri
        ? '<p><strong>Retour vers :</strong> ' + esc(details.redirect_uri) + '</p>'
        : '') +
      '<p><strong>Permissions :</strong></p><ul class="scopes">' +
      formatScopes(details?.scope) +
      '</ul>';
    box.style.display = 'block';
  }

  async function runFlow() {
    const preview = document.getElementById('preview');
    const flow = document.getElementById('flow');
    const loading = document.getElementById('loading');
    const actions = document.getElementById('actions');
    const params = new URLSearchParams(location.search);
    const authorizationId = params.get('authorization_id');

    if (!authorizationId) {
      if (preview) preview.style.display = 'block';
      if (flow) flow.style.display = 'none';
      return;
    }

    if (preview) preview.style.display = 'none';
    if (flow) flow.style.display = 'block';

    const sb = window.ElectroDzAuth.getClient();
    const oauthApi = sb.auth.oauth;

    if (!oauthApi?.getAuthorizationDetails) {
      if (loading) loading.style.display = 'none';
      showMsg(
        'OAuth Server : mettez à jour @supabase/supabase-js ou activez OAuth Server dans Supabase.',
        'e'
      );
      return;
    }

    const {
      data: { session },
    } = await sb.auth.getSession();

    if (!session) {
      location.href = loginUrl();
      return;
    }

    const { data: details, error } = await oauthApi.getAuthorizationDetails(authorizationId);

    if (loading) loading.style.display = 'none';

    if (error || !details) {
      showMsg(error?.message || 'Demande d’autorisation invalide ou expirée.', 'e');
      return;
    }

    if (!('authorization_id' in details) && details.redirect_url) {
      location.href = details.redirect_url;
      return;
    }

    renderDetails(details);
    if (actions) actions.style.display = 'flex';

    const btnApprove = document.getElementById('btn-approve');
    const btnDeny = document.getElementById('btn-deny');

    async function decide(approve) {
      if (btnApprove) btnApprove.disabled = true;
      if (btnDeny) btnDeny.disabled = true;

      const fn = approve ? oauthApi.approveAuthorization : oauthApi.denyAuthorization;
      const { data, error: err } = await fn(authorizationId);

      if (err) {
        showMsg(err.message || 'Erreur', 'e');
        if (btnApprove) btnApprove.disabled = false;
        if (btnDeny) btnDeny.disabled = false;
        return;
      }

      const next = data?.redirect_to || data?.redirect_url;
      if (next) {
        location.href = next;
      } else {
        showMsg('Réponse incomplète de Supabase.', 'e');
      }
    }

    btnApprove?.addEventListener('click', () => decide(true));
    btnDeny?.addEventListener('click', () => decide(false));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFlow);
  } else {
    runFlow();
  }
})();
