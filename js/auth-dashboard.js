(function () {
  'use strict';

  const sb = window.ElectroDzAuth.getClient();
  let files = [];

  const msgEl = document.getElementById('msg');
  const showMsg = (html, type) => {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.className = 'msg ' + type;
    msgEl.style.display = 'block';
  };

  const icons = { 'video/mp4': '&#127916;', 'application/pdf': '&#128196;' };

  function renderFiles(list) {
    const g = document.getElementById('grid');
    if (!g) return;
    g.innerHTML = list
      .map((f) => {
        const type = f.metadata?.mimetype || '';
        const icon = icons[type] || '&#128462;';
        const size = ((f.metadata?.size || 0) / 1024 / 1024).toFixed(1) + ' MB';
        const safeName = f.name.replace(/"/g, '&quot;');
        return `<div class="file">
      <div class="file-top">
        <span class="file-i">${icon}</span>
        <div class="file-info">
          <div class="file-name">${f.name}</div>
          <div class="file-meta">${size}</div>
        </div>
      </div>
      <div class="file-act">
        <button type="button" class="file-btn" data-dl="${safeName}">&#8595; Télécharger</button>
      </div>
    </div>`;
      })
      .join('');

    g.querySelectorAll('[data-dl]').forEach((btn) => {
      btn.addEventListener('click', () => downloadFile(btn.getAttribute('data-dl')));
    });
  }

  function downloadFile(name) {
    if (!name) return;
    sb.storage
      .from('media')
      .download(name)
      .then(({ data, error }) => {
        if (error) {
          showMsg('Erreur : ' + error.message, 'e');
          return;
        }
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  (async () => {
    const code = new URLSearchParams(location.search).get('code');
    if (code) {
      await sb.auth.exchangeCodeForSession(code);
      history.replaceState({}, document.title, location.pathname);
    }

    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) {
      location.href = 'login.html';
      return;
    }

    const displayName = (
      session.user.user_metadata?.full_name || session.user.email || ''
    ).split('@')[0];
    const nameEl = document.getElementById('name');
    const userEl = document.getElementById('user');
    if (nameEl) nameEl.textContent = displayName;
    if (userEl) userEl.textContent = session.user.email || '';

    showMsg('Chargement…', 'i');

    const { data, error } = await sb.storage.from('media').list();
    if (error) {
      showMsg('Erreur de chargement : ' + error.message, 'e');
      return;
    }
    if (!data || data.length === 0) {
      showMsg('Aucun fichier disponible pour le moment.', 'i');
      return;
    }

    files = data.filter((f) => f.name !== '.emptyFolderPlaceholder');
    if (files.length === 0) {
      showMsg('Aucun fichier disponible.', 'i');
      return;
    }

    renderFiles(files);

    const vid = document.getElementById('vid');
    const doc = document.getElementById('doc');
    const tot = document.getElementById('tot');
    if (vid) vid.textContent = String(files.filter((f) => f.metadata?.mimetype?.includes('video')).length);
    if (doc) doc.textContent = String(files.filter((f) => f.metadata?.mimetype?.includes('pdf')).length);
    if (tot) tot.textContent = String(files.length);
    if (msgEl) msgEl.style.display = 'none';
  })();

  document.getElementById('srch')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderFiles(files.filter((x) => x.name.toLowerCase().includes(q)));
  });

  document.getElementById('out')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'login.html';
  });
})();
