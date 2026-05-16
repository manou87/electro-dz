/**
 * Client Supabase partagé — site web DZSWISS ELEC (login, register, dashboard).
 * Clé anon : publique côté navigateur (normal pour Supabase).
 */
(function (g) {
  'use strict';

  const SUPABASE_URL = 'https://wxiqqcnzcxswdqzubxyt.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4aXFxY256Y3hzd2RxenVieHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTQ5NzcsImV4cCI6MjA2MDAzMDk3N30.YFkBDCmHIcTmjRJrYWuMbbfQgQkRIFa6PoLtl7Ml1UE';

  function redirectAfterAuth() {
    if (typeof location === 'undefined') return 'https://electro-dz.com/dashboard.html';
    const base = location.origin + location.pathname.replace(/\/[^/]*$/, '');
    return base + '/dashboard.html';
  }

  function getClient() {
    if (!g.supabase) throw new Error('SDK Supabase non chargé');
    return g.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  g.ElectroDzAuth = {
    url: SUPABASE_URL,
    redirectAfterAuth,
    getClient,
  };
})(typeof window !== 'undefined' ? window : globalThis);
