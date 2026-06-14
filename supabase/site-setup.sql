-- =============================================================================
-- SwissDZ — configuration Supabase SITE WEB uniquement (electro-dz.com)
-- Exécuter dans Supabase → SQL Editor (une fois).
-- L'app mobile sera configurée séparément plus tard.
-- =============================================================================

-- 1) Compteur de visites : exécuter d'abord visitor-stats.sql (fichier séparé)

-- 2) Bucket fichiers membres (vidéos / PDF du dashboard)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  524288000,
  array['video/mp4', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Lecture : membres connectés uniquement
drop policy if exists "Site membres lisent media" on storage.objects;
create policy "Site membres lisent media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media');

-- Upload : réservé au service role / dashboard admin (pas anon)
drop policy if exists "Site membres upload media" on storage.objects;
-- Pas de policy INSERT pour anon/authenticated = uploads via Dashboard Supabase Storage
