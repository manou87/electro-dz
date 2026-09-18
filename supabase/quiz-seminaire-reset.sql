-- Reset classement séminaire 19 sept (code RESET19)
-- + départage 100% par temps plus rapide dans submit_quiz_score

create or replace function public.reset_quiz_module_scores(
  p_module_slug text,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_code text;
  v_deleted int;
begin
  v_slug := trim(coalesce(p_module_slug, ''));
  v_code := upper(trim(coalesce(p_code, '')));

  if v_code <> 'RESET19' then
    return jsonb_build_object('ok', false, 'error', 'code_invalid');
  end if;

  if v_slug <> 'seminaire-19-sept' then
    return jsonb_build_object('ok', false, 'error', 'module_invalid');
  end if;

  delete from public.quiz_leaderboard_bests
  where module_slug = v_slug;

  get diagnostics v_deleted = row_count;

  return jsonb_build_object('ok', true, 'deleted', v_deleted, 'module', v_slug);
end;
$$;

revoke all on function public.reset_quiz_module_scores(text, text) from public;
grant execute on function public.reset_quiz_module_scores(text, text) to anon, authenticated;

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
  v_existing_dur int;
  v_pct int;
  v_dur int;
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

  v_dur := coalesce(nullif(p_duration_sec, 0), 1);
  if v_dur <= 0 then
    return jsonb_build_object('ok', false, 'error', 'duration_invalid');
  end if;

  v_pseudo_norm := lower(v_pseudo);
  v_pct := round(100.0 * p_score / p_total)::int;

  select b.score, b.duration_sec into v_existing, v_existing_dur
  from public.quiz_leaderboard_bests b
  where b.pseudo_norm = v_pseudo_norm
    and b.module_slug = trim(p_module_slug);

  if v_existing is not null then
    if p_score < v_existing then
      return jsonb_build_object('ok', false, 'error', 'not_better', 'best', v_existing);
    end if;
    if p_score = v_existing and v_dur >= coalesce(v_existing_dur, 2147483647) then
      return jsonb_build_object('ok', false, 'error', 'not_better', 'best', v_existing);
    end if;
  end if;

  insert into public.quiz_leaderboard_bests (
    pseudo, pseudo_norm, module_slug, module_id,
    score, total, pct, duration_sec, user_id, verified, updated_at
  )
  values (
    v_pseudo, v_pseudo_norm, trim(p_module_slug),
    nullif(trim(coalesce(p_module_id, '')), ''),
    p_score, p_total, v_pct, v_dur, v_user_id, v_verified, now()
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
  where excluded.score > quiz_leaderboard_bests.score
     or (
       excluded.score = quiz_leaderboard_bests.score
       and excluded.duration_sec < quiz_leaderboard_bests.duration_sec
     );

  return jsonb_build_object('ok', true, 'score', p_score, 'pct', v_pct);
end;
$$;
