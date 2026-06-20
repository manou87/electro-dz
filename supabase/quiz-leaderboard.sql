-- Classement quiz NF C 15-100 — pseudo + Supabase (Option B)
-- Exécuter dans Supabase → SQL Editor (une fois).

create table if not exists public.quiz_leaderboard_bests (
  pseudo text not null,
  pseudo_norm text not null,
  module_slug text not null,
  module_id text,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  pct int not null check (pct >= 0 and pct <= 100),
  duration_sec int not null check (duration_sec > 0),
  user_id uuid references auth.users (id) on delete set null,
  verified boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (pseudo_norm, module_slug)
);

create index if not exists quiz_leaderboard_bests_score_idx
  on public.quiz_leaderboard_bests (module_slug, score desc);

alter table public.quiz_leaderboard_bests enable row level security;

drop policy if exists "Lecture publique classement quiz" on public.quiz_leaderboard_bests;
create policy "Lecture publique classement quiz"
  on public.quiz_leaderboard_bests for select
  to anon, authenticated
  using (true);

-- Soumission uniquement via RPC (security definer)

create or replace function public.submit_quiz_score(
  p_pseudo text,
  p_module_slug text,
  p_module_id text,
  p_score int,
  p_total int,
  p_duration_sec int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pseudo text;
  v_pseudo_norm text;
  v_user_id uuid;
  v_verified boolean;
  v_existing int;
  v_pct int;
begin
  v_user_id := auth.uid();
  v_verified := v_user_id is not null;

  v_pseudo := trim(coalesce(p_pseudo, ''));
  if length(v_pseudo) < 3 or length(v_pseudo) > 16 then
    return jsonb_build_object('ok', false, 'error', 'pseudo_invalid');
  end if;
  if v_pseudo !~ '^[A-Za-z0-9_\-\.]+$' then
    return jsonb_build_object('ok', false, 'error', 'pseudo_invalid');
  end if;

  if p_module_slug is null or length(trim(p_module_slug)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'module_invalid');
  end if;

  if p_score is null or p_total is null or p_total <= 0 or p_score < 0 or p_score > p_total then
    return jsonb_build_object('ok', false, 'error', 'score_invalid');
  end if;

  if p_duration_sec is null or p_duration_sec < 1 or p_duration_sec > 7200 then
    return jsonb_build_object('ok', false, 'error', 'duration_invalid');
  end if;

  v_pseudo_norm := lower(v_pseudo);
  v_pct := round(100.0 * p_score / p_total)::int;

  select b.score into v_existing
  from public.quiz_leaderboard_bests b
  where b.pseudo_norm = v_pseudo_norm
    and b.module_slug = trim(p_module_slug);

  if v_existing is not null and p_score < v_existing then
    return jsonb_build_object(
      'ok', false,
      'error', 'not_better',
      'best', v_existing
    );
  end if;

  insert into public.quiz_leaderboard_bests (
    pseudo,
    pseudo_norm,
    module_slug,
    module_id,
    score,
    total,
    pct,
    duration_sec,
    user_id,
    verified,
    updated_at
  )
  values (
    v_pseudo,
    v_pseudo_norm,
    trim(p_module_slug),
    nullif(trim(coalesce(p_module_id, '')), ''),
    p_score,
    p_total,
    v_pct,
    p_duration_sec,
    v_user_id,
    v_verified,
    now()
  )
  on conflict (pseudo_norm, module_slug) do update set
    pseudo = excluded.pseudo,
    module_id = excluded.module_id,
    score = excluded.score,
    total = excluded.total,
    pct = excluded.pct,
    duration_sec = excluded.duration_sec,
    user_id = coalesce(excluded.user_id, quiz_leaderboard_bests.user_id),
    verified = quiz_leaderboard_bests.verified or excluded.verified,
    updated_at = now()
  where excluded.score > quiz_leaderboard_bests.score;

  return jsonb_build_object('ok', true, 'score', p_score, 'pct', v_pct);
end;
$$;

create or replace function public.get_quiz_leaderboard(
  p_module_slug text default null,
  p_limit int default 50
)
returns table (
  rank int,
  pseudo text,
  verified boolean,
  total_score int,
  max_score int,
  pct int,
  modules_done int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int;
  v_module text;
begin
  v_limit := greatest(1, least(coalesce(p_limit, 50), 100));
  v_module := nullif(trim(coalesce(p_module_slug, '')), '');

  if v_module is null or lower(v_module) = 'global' then
    return query
    select
      row_number() over (
        order by sum(b.score) desc, round(100.0 * sum(b.score) / nullif(sum(b.total), 0)) desc, max(b.updated_at) desc
      )::int as rank,
      max(b.pseudo) as pseudo,
      bool_or(b.verified) as verified,
      sum(b.score)::int as total_score,
      sum(b.total)::int as max_score,
      round(100.0 * sum(b.score) / nullif(sum(b.total), 0))::int as pct,
      count(distinct b.module_slug)::int as modules_done
    from public.quiz_leaderboard_bests b
    group by b.pseudo_norm
    order by sum(b.score) desc, round(100.0 * sum(b.score) / nullif(sum(b.total), 0)) desc, max(b.updated_at) desc
    limit v_limit;
  else
    return query
    select
      row_number() over (
        order by b.score desc, b.duration_sec asc, b.updated_at desc
      )::int as rank,
      b.pseudo,
      b.verified,
      b.score as total_score,
      b.total as max_score,
      b.pct,
      1 as modules_done
    from public.quiz_leaderboard_bests b
    where b.module_slug = v_module
    order by b.score desc, b.duration_sec asc, b.updated_at desc
    limit v_limit;
  end if;
end;
$$;

revoke all on function public.submit_quiz_score(text, text, text, int, int, int) from public;
grant execute on function public.submit_quiz_score(text, text, text, int, int, int) to anon, authenticated;

revoke all on function public.get_quiz_leaderboard(text, int) from public;
grant execute on function public.get_quiz_leaderboard(text, int) to anon, authenticated;
