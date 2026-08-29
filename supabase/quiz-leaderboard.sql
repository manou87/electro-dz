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
    coalesce(nullif(p_duration_sec, 0), 1),
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

-- Réservation de surnom unique (code auto -XXX si le nom de base est pris)

create table if not exists public.quiz_pseudo_registry (
  pseudo_norm text primary key,
  pseudo text not null,
  created_at timestamptz not null default now()
);

alter table public.quiz_pseudo_registry enable row level security;

-- Pas de policy directe : écriture/lecture via reserve_quiz_pseudo (security definer).
revoke all on table public.quiz_pseudo_registry from anon, authenticated;

insert into public.quiz_pseudo_registry (pseudo_norm, pseudo)
select distinct b.pseudo_norm, b.pseudo
from public.quiz_leaderboard_bests b
on conflict (pseudo_norm) do nothing;

create or replace function public.quiz_pseudo_is_taken(p_norm text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.quiz_pseudo_registry r where r.pseudo_norm = p_norm
  ) or exists (
    select 1 from public.quiz_leaderboard_bests b where b.pseudo_norm = p_norm
  );
$$;

create or replace function public.reserve_quiz_pseudo(p_base text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_base_norm text;
  v_existing text;
  v_suffix text;
  v_candidate_norm text;
  v_candidate text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i int;
  v_j int;
begin
  v_base := trim(coalesce(p_base, ''));
  if length(v_base) < 3 or length(v_base) > 16 then
    return jsonb_build_object('ok', false, 'error', 'pseudo_invalid');
  end if;
  if v_base !~ '^[A-Za-z0-9_\-\.]+$' then
    return jsonb_build_object('ok', false, 'error', 'pseudo_invalid');
  end if;

  v_base_norm := lower(v_base);

  -- Revalidation d'un surnom complet déjà réservé (ex. Mohamed-x9Z)
  if v_base ~ '-[A-Za-z0-9]{3}$' then
    select r.pseudo into v_existing
    from public.quiz_pseudo_registry r
    where r.pseudo_norm = v_base_norm;

    if v_existing is not null then
      return jsonb_build_object(
        'ok', true,
        'pseudo', v_existing,
        'pseudo_norm', v_base_norm,
        'suffix_added', true,
        'reused', true
      );
    end if;
  end if;

  if length(v_base) <= 12 and not public.quiz_pseudo_is_taken(v_base_norm) then
    insert into public.quiz_pseudo_registry (pseudo_norm, pseudo)
    values (v_base_norm, v_base)
    on conflict (pseudo_norm) do nothing;

    return jsonb_build_object(
      'ok', true,
      'pseudo', v_base,
      'pseudo_norm', v_base_norm,
      'suffix_added', false,
      'reused', false
    );
  end if;

  if length(v_base) > 12 then
    return jsonb_build_object('ok', false, 'error', 'pseudo_taken');
  end if;

  for v_i in 1..40 loop
    v_suffix := '';
    for v_j in 1..3 loop
      v_suffix := v_suffix || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    v_candidate_norm := v_base_norm || '-' || lower(v_suffix);
    v_candidate := v_base || '-' || v_suffix;

    if length(v_candidate) > 16 then
      continue;
    end if;

    if not public.quiz_pseudo_is_taken(v_candidate_norm) then
      insert into public.quiz_pseudo_registry (pseudo_norm, pseudo)
      values (v_candidate_norm, v_candidate)
      on conflict (pseudo_norm) do nothing;

      return jsonb_build_object(
        'ok', true,
        'pseudo', v_candidate,
        'pseudo_norm', v_candidate_norm,
        'suffix_added', true,
        'reused', false
      );
    end if;
  end loop;

  return jsonb_build_object('ok', false, 'error', 'pseudo_unavailable');
end;
$$;

revoke all on function public.reserve_quiz_pseudo(text) from public;
grant execute on function public.reserve_quiz_pseudo(text) to anon, authenticated;
