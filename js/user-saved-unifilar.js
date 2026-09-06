/**
 * Unifilaires — compte connecté (Supabase), fallback localStorage.
 * Clé locale partagée avec unifilar-auto-page.js : electrodz-unifilar-saved-v1
 */
(function (g) {
  'use strict';

  const LOCAL_KEY = 'electrodz-unifilar-saved-v1';
  const MAX_SAVED = 30;

  function getSb() {
    try {
      return window.ElectroDzAuth?.getClient?.() || null;
    } catch (_) {
      return null;
    }
  }

  async function getSession() {
    const sb = getSb();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  function readLocal() {
    try {
      const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function writeLocal(list) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify((list || []).slice(0, MAX_SAVED)));
    } catch (_) {
      throw new Error('storage');
    }
  }

  function normalizeCloudRow(row) {
    return {
      id: String(row.id),
      name: row.name || '',
      savedAt: row.updated_at || row.created_at || null,
      project: row.payload || null,
    };
  }

  async function list() {
    const session = await getSession();
    if (!session) {
      return { loggedIn: false, items: readLocal() };
    }

    const sb = getSb();
    const { data, error } = await sb
      .from('user_saved_unifilar')
      .select('id,name,payload,created_at,updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return {
      loggedIn: true,
      items: (data || []).map(normalizeCloudRow),
    };
  }

  async function save(entry) {
    const session = await getSession();
    if (!session) return { ok: false, needLogin: true };

    if (!entry?.name || !entry?.project) return { ok: false, error: 'missing' };

    const sb = getSb();
    const { data, error } = await sb
      .from('user_saved_unifilar')
      .insert({
        user_id: session.user.id,
        name: entry.name,
        payload: entry.project,
      })
      .select('id,name,payload,created_at,updated_at')
      .single();

    if (error) throw error;
    return { ok: true, item: normalizeCloudRow(data) };
  }

  function saveLocal(entry) {
    const list = readLocal();
    const item = {
      id: entry.id || 'uni-' + Date.now(),
      name: entry.name,
      savedAt: entry.savedAt || new Date().toISOString(),
      project: entry.project,
    };
    list.unshift(item);
    writeLocal(list);
    return { ok: true, item, local: true };
  }

  async function remove(id) {
    if (!id) return { ok: false, error: 'missing_id' };

    const session = await getSession();
    if (!session) {
      writeLocal(readLocal().filter((x) => x.id !== id));
      return { ok: true, local: true };
    }

    const sb = getSb();
    const { error } = await sb
      .from('user_saved_unifilar')
      .delete()
      .eq('user_id', session.user.id)
      .eq('id', id);
    if (error) throw error;
    return { ok: true };
  }

  async function getById(id) {
    const { items } = await list();
    return items.find((x) => x.id === id) || null;
  }

  /** Fusionne unifilaires locaux vers le compte après connexion */
  async function mergeLocalAfterLogin() {
    const session = await getSession();
    if (!session) return { merged: 0 };
    const local = readLocal();
    if (!local.length) return { merged: 0 };

    const sb = getSb();
    let merged = 0;
    for (const item of local) {
      if (!item?.project?.circuits?.length) continue;
      const { error } = await sb.from('user_saved_unifilar').insert({
        user_id: session.user.id,
        name: item.name || 'Unifilaire',
        payload: item.project,
      });
      if (!error) merged += 1;
    }
    writeLocal([]);
    return { merged };
  }

  g.ElectroDzSavedUnifilar = {
    LOCAL_KEY,
    getSession,
    list,
    save,
    saveLocal,
    remove,
    getById,
    mergeLocalAfterLogin,
    loginUrl: () =>
      (window.ElectroDzSite?.url?.login?.() || 'login.html') +
      '?redirect=' +
      encodeURIComponent(location.pathname + location.search + location.hash),
  };
})(typeof window !== 'undefined' ? window : globalThis);
