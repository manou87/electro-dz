/**
 * Favoris PDF — compte connecté (Google ou e-mail), stockés dans Supabase.
 */
(function (g) {
  'use strict';

  const LOCAL_KEY = 'edz_pdf_favorites_local';

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
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  function writeLocal(list) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  async function listFavorites() {
    const session = await getSession();
    if (!session) return { loggedIn: false, ids: new Set(), items: [] };

    const sb = getSb();
    const { data, error } = await sb
      .from('user_pdf_favorites')
      .select('book_id,title_fr,title_ar,pdf_url,created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const items = data || [];
    return {
      loggedIn: true,
      ids: new Set(items.map((r) => r.book_id)),
      items,
    };
  }

  async function isFavorite(bookId) {
    const { ids } = await listFavorites();
    return ids.has(bookId);
  }

  async function toggleFavorite(book) {
    const session = await getSession();
    if (!session) {
      return { ok: false, needLogin: true };
    }
    if (!book?.id) return { ok: false, error: 'missing_id' };

    const sb = getSb();
    const { ids } = await listFavorites();
    const on = ids.has(book.id);

    if (on) {
      const { error } = await sb
        .from('user_pdf_favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('book_id', book.id);
      if (error) throw error;
      return { ok: true, favorited: false };
    }

    const { error } = await sb.from('user_pdf_favorites').insert({
      user_id: session.user.id,
      book_id: book.id,
      title_fr: book.titleFr || '',
      title_ar: book.titleAr || book.titleFr || '',
      pdf_url: book.pdfUrl || '',
    });
    if (error) throw error;
    return { ok: true, favorited: true };
  }

  /** Fusionne favoris locaux vers le compte après connexion */
  async function mergeLocalAfterLogin() {
    const session = await getSession();
    if (!session) return;
    const local = readLocal();
    if (!local.length) return;
    const sb = getSb();
    for (const book of local) {
      if (!book?.id) continue;
      await sb.from('user_pdf_favorites').upsert(
        {
          user_id: session.user.id,
          book_id: book.id,
          title_fr: book.titleFr || '',
          title_ar: book.titleAr || '',
          pdf_url: book.pdfUrl || '',
        },
        { onConflict: 'user_id,book_id' }
      );
    }
    writeLocal([]);
  }

  g.ElectroDzFavorites = {
    getSession,
    listFavorites,
    isFavorite,
    toggleFavorite,
    mergeLocalAfterLogin,
    loginUrl: () =>
      (window.ElectroDzSite?.url?.login?.() || 'login.html') +
      '?redirect=' +
      encodeURIComponent(location.pathname + location.search),
  };
})(typeof window !== 'undefined' ? window : globalThis);
