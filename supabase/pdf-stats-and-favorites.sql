-- Stats PDF (vues / téléchargements) + favoris utilisateurs connectés
-- Exécuter dans Supabase → SQL Editor (après visitor-stats.sql)

create table if not exists public.site_pdf_stats (
  book_id text primary key,
  view_count bigint not null default 0,
  download_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.site_pdf_stats enable row level security;

drop policy if exists "Lecture publique stats PDF" on public.site_pdf_stats;
create policy "Lecture publique stats PDF"
  on public.site_pdf_stats for select
  to anon, authenticated
  using (true);

create table if not exists public.user_pdf_favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  title_fr text,
  title_ar text,
  pdf_url text,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists user_pdf_favorites_user_id_idx on public.user_pdf_favorites (user_id);

alter table public.user_pdf_favorites enable row level security;

drop policy if exists "Favoris lecture propre" on public.user_pdf_favorites;
create policy "Favoris lecture propre"
  on public.user_pdf_favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Favoris ajout propre" on public.user_pdf_favorites;
create policy "Favoris ajout propre"
  on public.user_pdf_favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Favoris suppression propre" on public.user_pdf_favorites;
create policy "Favoris suppression propre"
  on public.user_pdf_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Favoris mise à jour propre" on public.user_pdf_favorites;
create policy "Favoris mise à jour propre"
  on public.user_pdf_favorites for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.increment_pdf_view(p_book_id text)
returns table(view_count bigint, download_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_book_id is null or length(trim(p_book_id)) = 0 then
    return;
  end if;
  insert into public.site_pdf_stats (book_id, view_count, download_count)
  values (trim(p_book_id), 1, 0)
  on conflict (book_id) do update set
    view_count = site_pdf_stats.view_count + 1,
    updated_at = now();
  return query
  select s.view_count, s.download_count from public.site_pdf_stats s where s.book_id = trim(p_book_id);
end;
$$;

create or replace function public.increment_pdf_download(p_book_id text)
returns table(view_count bigint, download_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_book_id is null or length(trim(p_book_id)) = 0 then
    return;
  end if;
  insert into public.site_pdf_stats (book_id, view_count, download_count)
  values (trim(p_book_id), 0, 1)
  on conflict (book_id) do update set
    download_count = site_pdf_stats.download_count + 1,
    updated_at = now();
  return query
  select s.view_count, s.download_count from public.site_pdf_stats s where s.book_id = trim(p_book_id);
end;
$$;

create or replace function public.get_pdf_stats_totals()
returns table(total_views bigint, total_downloads bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(sum(view_count), 0)::bigint,
    coalesce(sum(download_count), 0)::bigint
  from public.site_pdf_stats;
$$;

grant execute on function public.increment_pdf_view(text) to anon, authenticated;
grant execute on function public.increment_pdf_download(text) to anon, authenticated;
grant execute on function public.get_pdf_stats_totals() to anon, authenticated;
