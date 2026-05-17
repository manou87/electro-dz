/**
 * Si Supabase renvoie ?code= sur une autre page, redirige vers auth-callback (même origine).
 */
(function () {
  'use strict';
  const qs = location.search || '';
  const hash = location.hash || '';
  if (!qs.includes('code=') && !hash.includes('access_token=')) return;
  if (/auth-callback\.html$/i.test(location.pathname)) return;
  location.replace(location.origin + '/auth-callback.html' + qs + hash);
})();
