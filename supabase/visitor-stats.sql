-- Compteur de visites site SwissDZ — exécuter une fois dans Supabase → SQL Editor

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
