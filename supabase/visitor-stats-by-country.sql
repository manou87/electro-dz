-- Stats visiteurs par pays — exécuter dans Supabase → SQL Editor (après visitor-stats.sql)

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
