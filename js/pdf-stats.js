/**
 * Compteurs PDF globaux + par livre (vues / téléchargements).
 */
(function (g) {
  'use strict';

  const cache = { totals: null, byBook: {} };

  function getSb() {
    try {
      return window.ElectroDzAuth?.getClient?.() || null;
    } catch (_) {
      return null;
    }
  }

  async function waitSb(n) {
    for (let i = 0; i < n; i++) {
      const sb = getSb();
      if (sb) return sb;
      await new Promise((r) => setTimeout(r, 80));
    }
    return null;
  }

  function parseRow(data) {
    if (!data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      views: Number(row.view_count ?? row.views ?? 0),
      downloads: Number(row.download_count ?? row.downloads ?? 0),
    };
  }

  async function fetchTotals() {
    if (cache.totals) return cache.totals;
    const sb = await waitSb(20);
    if (!sb) return null;
    const { data, error } = await sb.rpc('get_pdf_stats_totals');
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    cache.totals = {
      views: Number(row?.total_views ?? 0),
      downloads: Number(row?.total_downloads ?? 0),
    };
    return cache.totals;
  }

  async function fetchBookStats(bookId) {
    if (!bookId) return { views: 0, downloads: 0 };
    if (cache.byBook[bookId]) return cache.byBook[bookId];
    const sb = await waitSb(15);
    if (!sb) return { views: 0, downloads: 0 };
    const { data, error } = await sb
      .from('site_pdf_stats')
      .select('view_count,download_count')
      .eq('book_id', bookId)
      .maybeSingle();
    if (error || !data) {
      cache.byBook[bookId] = { views: 0, downloads: 0 };
      return cache.byBook[bookId];
    }
    cache.byBook[bookId] = {
      views: Number(data.view_count || 0),
      downloads: Number(data.download_count || 0),
    };
    return cache.byBook[bookId];
  }

  async function fetchAllBookStats() {
    const sb = await waitSb(20);
    if (!sb) return {};
    const { data, error } = await sb.from('site_pdf_stats').select('book_id,view_count,download_count');
    if (error || !data) return {};
    const map = {};
    data.forEach((r) => {
      map[r.book_id] = {
        views: Number(r.view_count || 0),
        downloads: Number(r.download_count || 0),
      };
      cache.byBook[r.book_id] = map[r.book_id];
    });
    return map;
  }

  async function trackView(bookId) {
    if (!bookId) return null;
    const sb = await waitSb(15);
    if (!sb) return null;
    const { data, error } = await sb.rpc('increment_pdf_view', { p_book_id: bookId });
    if (error) return null;
    const stats = parseRow(data);
    if (stats) cache.byBook[bookId] = stats;
    if (cache.totals) cache.totals.views += 1;
    return stats;
  }

  async function trackDownload(bookId) {
    if (!bookId) return null;
    const sb = await waitSb(15);
    if (!sb) return null;
    const { data, error } = await sb.rpc('increment_pdf_download', { p_book_id: bookId });
    if (error) return null;
    const stats = parseRow(data);
    if (stats) cache.byBook[bookId] = stats;
    if (cache.totals) cache.totals.downloads += 1;
    return stats;
  }

  g.ElectroDzPdfStats = {
    fetchTotals,
    fetchBookStats,
    fetchAllBookStats,
    trackView,
    trackDownload,
    invalidateTotals() {
      cache.totals = null;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
