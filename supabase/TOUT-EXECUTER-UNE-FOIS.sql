-- SwissDZ — exécuter TOUT ce fichier une fois (SQL Editor Supabase)
-- Ou : node scripts/apply-supabase-site-setup.mjs (avec token Management API)

-- ========== 1. Compteur visiteurs ==========
create table if not exists public.site_visitor_stats (
  id int primary key default 1 check (id = 1),
  total_visits bigint not null default 0,
  today_visits bigint not null default 0,
  today_date date not null default (timezone('utc', now()))::date,
  updated_at timestamptz not null default now()
);

insert into public.site_visitor_stats (id, total_visits, today_visits, today_date)
values (1, 0, 0, (timezone('utc', now()))::date)
on conflict (id) do nothing;

alter table public.site_visitor_stats enable row level security;

drop policy if exists "Lecture publique stats" on public.site_visitor_stats;
create policy "Lecture publique stats"
  on public.site_visitor_stats for select
  to anon, authenticated
  using (true);

create or replace function public.increment_site_visits()
returns table(total_visits bigint, today_visits bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
begin
  insert into public.site_visitor_stats (id, total_visits, today_visits, today_date)
  values (1, 1, 1, v_today)
  on conflict (id) do update set
    total_visits = site_visitor_stats.total_visits + 1,
    today_visits = case
      when site_visitor_stats.today_date = v_today then site_visitor_stats.today_visits + 1
      else 1
    end,
    today_date = v_today,
    updated_at = now();

  return query
  select s.total_visits, s.today_visits
  from public.site_visitor_stats s
  where s.id = 1;
end;
$$;

grant execute on function public.increment_site_visits() to anon, authenticated;

-- ========== 1b. Stats visiteurs par pays ==========
create table if not exists public.site_visits_by_country (
  country_code char(2) primary key,
  total_visits bigint not null default 0,
  today_visits bigint not null default 0,
  today_date date not null default (timezone('utc', now()))::date,
  updated_at timestamptz not null default now()
);

alter table public.site_visits_by_country enable row level security;

drop policy if exists "Lecture publique stats pays" on public.site_visits_by_country;
create policy "Lecture publique stats pays"
  on public.site_visits_by_country for select
  to anon, authenticated
  using (true);

drop function if exists public.increment_site_visits();

create or replace function public.increment_site_visits(p_country_code text default null)
returns table(total_visits bigint, today_visits bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_cc char(2);
begin
  insert into public.site_visitor_stats (id, total_visits, today_visits, today_date)
  values (1, 1, 1, v_today)
  on conflict (id) do update set
    total_visits = site_visitor_stats.total_visits + 1,
    today_visits = case
      when site_visitor_stats.today_date = v_today then site_visitor_stats.today_visits + 1
      else 1
    end,
    today_date = v_today,
    updated_at = now();

  v_cc := upper(trim(coalesce(p_country_code, '')));
  if length(v_cc) = 2 and v_cc ~ '^[A-Z]{2}$' then
    insert into public.site_visits_by_country (country_code, total_visits, today_visits, today_date)
    values (v_cc, 1, 1, v_today)
    on conflict (country_code) do update set
      total_visits = site_visits_by_country.total_visits + 1,
      today_visits = case
        when site_visits_by_country.today_date = v_today then site_visits_by_country.today_visits + 1
        else 1
      end,
      today_date = v_today,
      updated_at = now();
  end if;

  return query
  select s.total_visits, s.today_visits
  from public.site_visitor_stats s
  where s.id = 1;
end;
$$;

grant execute on function public.increment_site_visits(text) to anon, authenticated;

create or replace function public.get_visits_by_country(p_scope text default 'total')
returns table(country_code text, visit_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
begin
  if lower(trim(coalesce(p_scope, 'total'))) = 'today' then
    return query
    select c.country_code::text, c.today_visits
    from public.site_visits_by_country c
    where c.today_date = v_today and c.today_visits > 0
    order by c.today_visits desc, c.country_code;
  else
    return query
    select c.country_code::text, c.total_visits
    from public.site_visits_by_country c
    where c.total_visits > 0
    order by c.total_visits desc, c.country_code;
  end if;
end;
$$;

grant execute on function public.get_visits_by_country(text) to anon, authenticated;

-- ========== 2. Stats PDF + favoris ==========
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

-- ========== 3. Bucket media (dashboard) ==========
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

drop policy if exists "Site membres lisent media" on storage.objects;
create policy "Site membres lisent media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media');

-- ========== 4. Classement quiz NF C 15-100 ==========
-- Exécuter aussi : supabase/quiz-leaderboard.sql (table + RPC submit/get)
-- Inclut RLS sur quiz_pseudo_registry (voir aussi fix-rls-quiz-pseudo-registry.sql)
