/**
 * Compteurs PDF globaux + par livre (vues / téléchargements).
 * Supabase : table site_pdf_stats + RPC (voir supabase/pdf-stats-and-favorites.sql).
 * Repli localStorage si la base n'est pas encore configurée.
 */
(function (g) {
  'use strict';

  const LOCAL_KEY = 'electrodz-pdf-stats-v1';
  const cache = { totals: null, byBook: {}, serverOk: null };

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

  function readLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const o = raw ? JSON.parse(raw) : {};
      return o && typeof o === 'object' ? o : {};
    } catch (_) {
      return {};
    }
  }

  function writeLocal(map) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
    } catch (_) { /* ignore */ }
  }

  function bumpLocal(bookId, field) {
    const map = readLocal();
    if (!map[bookId]) map[bookId] = { views: 0, downloads: 0 };
    map[bookId][field] = Number(map[bookId][field] || 0) + 1;
    writeLocal(map);
    const stats = {
      views: Number(map[bookId].views || 0),
      downloads: Number(map[bookId].downloads || 0),
    };
    cache.byBook[bookId] = stats;
    return stats;
  }

  function localToMap(local) {
    const map = {};
    Object.keys(local || {}).forEach(function (id) {
      const row = local[id];
      map[id] = {
        views: Number(row?.views || 0),
        downloads: Number(row?.downloads || 0),
      };
    });
    return map;
  }

  function mergeMaps(serverMap, localMap) {
    const out = localToMap(localMap);
    Object.keys(serverMap || {}).forEach(function (id) {
      const s = serverMap[id];
      const l = out[id] || { views: 0, downloads: 0 };
      out[id] = {
        views: Math.max(Number(s.views || 0), Number(l.views || 0)),
        downloads: Math.max(Number(s.downloads || 0), Number(l.downloads || 0)),
      };
    });
    return out;
  }

  function isServerTableMissing(err) {
    const code = err?.code || '';
    const msg = String(err?.message || err || '');
    return (
      code === 'PGRST202' ||
      code === 'PGRST205' ||
      /site_pdf_stats/i.test(msg) ||
      /increment_pdf_view/i.test(msg)
    );
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

  async function probeServer(sb) {
    if (cache.serverOk !== null) return cache.serverOk;
    const { error } = await sb.from('site_pdf_stats').select('book_id').limit(1);
    if (error && isServerTableMissing(error)) {
      cache.serverOk = false;
      return false;
    }
    cache.serverOk = !error;
    return cache.serverOk;
  }

  async function fetchTotals() {
    if (cache.totals) return cache.totals;
    const local = readLocal();
    let localViews = 0;
    let localDl = 0;
    Object.keys(local).forEach(function (id) {
      localViews += Number(local[id]?.views || 0);
      localDl += Number(local[id]?.downloads || 0);
    });

    const sb = await waitSb(20);
    if (!sb) {
      cache.totals = { views: localViews, downloads: localDl };
      return cache.totals;
    }

    const { data, error } = await sb.rpc('get_pdf_stats_totals');
    if (error || !data) {
      cache.totals = { views: localViews, downloads: localDl };
      return cache.totals;
    }
    const row = Array.isArray(data) ? data[0] : data;
    cache.totals = {
      views: Math.max(Number(row?.total_views ?? 0), localViews),
      downloads: Math.max(Number(row?.total_downloads ?? 0), localDl),
    };
    return cache.totals;
  }

  async function fetchBookStats(bookId) {
    if (!bookId) return { views: 0, downloads: 0 };
    if (cache.byBook[bookId]) return cache.byBook[bookId];

    const local = readLocal();
    const localRow = local[bookId];
    const localStats = {
      views: Number(localRow?.views || 0),
      downloads: Number(localRow?.downloads || 0),
    };

    const sb = await waitSb(15);
    if (!sb) {
      cache.byBook[bookId] = localStats;
      return localStats;
    }

    const serverUp = await probeServer(sb);
    if (!serverUp) {
      cache.byBook[bookId] = localStats;
      return localStats;
    }

    const { data, error } = await sb
      .from('site_pdf_stats')
      .select('view_count,download_count')
      .eq('book_id', bookId)
      .maybeSingle();

    if (error || !data) {
      cache.byBook[bookId] = localStats;
      return localStats;
    }

    cache.byBook[bookId] = {
      views: Math.max(Number(data.view_count || 0), localStats.views),
      downloads: Math.max(Number(data.download_count || 0), localStats.downloads),
    };
    return cache.byBook[bookId];
  }

  async function fetchAllBookStats() {
    const localMap = localToMap(readLocal());

    const sb = await waitSb(20);
    if (!sb) return localMap;

    const serverUp = await probeServer(sb);
    if (!serverUp) return localMap;

    const { data, error } = await sb
      .from('site_pdf_stats')
      .select('book_id,view_count,download_count');

    if (error) return localMap;

    const serverMap = {};
    (data || []).forEach(function (r) {
      serverMap[r.book_id] = {
        views: Number(r.view_count || 0),
        downloads: Number(r.download_count || 0),
      };
      cache.byBook[r.book_id] = serverMap[r.book_id];
    });

    const merged = mergeMaps(serverMap, readLocal());
    Object.keys(merged).forEach(function (id) {
      cache.byBook[id] = merged[id];
    });
    return merged;
  }

  async function trackView(bookId) {
    if (!bookId) return null;
    const stats = bumpLocal(bookId, 'views');

    const sb = await waitSb(15);
    if (!sb) return stats;

    const serverUp = await probeServer(sb);
    if (!serverUp) return stats;

    const { data, error } = await sb.rpc('increment_pdf_view', { p_book_id: bookId });
    if (error) return stats;

    const serverStats = parseRow(data);
    if (serverStats) {
      cache.byBook[bookId] = {
        views: Math.max(serverStats.views, stats.views),
        downloads: Math.max(serverStats.downloads, stats.downloads),
      };
    }
    if (cache.totals) cache.totals.views += 1;
    else cache.totals = null;
    return cache.byBook[bookId];
  }

  async function trackDownload(bookId) {
    if (!bookId) return null;
    const stats = bumpLocal(bookId, 'downloads');

    const sb = await waitSb(15);
    if (!sb) return stats;

    const serverUp = await probeServer(sb);
    if (!serverUp) return stats;

    const { data, error } = await sb.rpc('increment_pdf_download', { p_book_id: bookId });
    if (error) return stats;

    const serverStats = parseRow(data);
    if (serverStats) {
      cache.byBook[bookId] = {
        views: Math.max(serverStats.views, stats.views),
        downloads: Math.max(serverStats.downloads, stats.downloads),
      };
    }
    if (cache.totals) cache.totals.downloads += 1;
    else cache.totals = null;
    return cache.byBook[bookId];
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
    invalidateAll() {
      cache.totals = null;
      cache.byBook = {};
      cache.serverOk = null;
    },
    isServerConfigured() {
      return cache.serverOk === true;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
