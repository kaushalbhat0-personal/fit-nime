-- RCCF-005: authoritative XP award. No table, column, or policy changes.
-- Fully re-runnable (IF NOT EXISTS / OR REPLACE / idempotent grants).
--
-- Why a SECURITY DEFINER function: progression tables intentionally have
-- NO client write policies, and the server action uses the same user JWT
-- as the browser — so no anon-key client can write stats/events. This
-- function runs with definer rights and is safe for direct calls because
-- it re-checks ownership (auth.uid), recomputes XP from trusted tables
-- (never from arguments), and awards each session at most once.

-- Once-only guarantee under concurrency: partial unique index + bare
-- ON CONFLICT DO NOTHING + row-count check (never check-then-insert).
create unique index if not exists xp_events_workout_session_uidx
  on public.xp_events ((metadata->>'workout_session_id'))
  where source = 'workout' and metadata->>'workout_session_id' is not null;

create or replace function public.award_workout_xp(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_strength integer := 0;
  v_endurance integer := 0;
  v_agility integer := 0;
  v_focus integer := 0;
  v_total integer := 0;
  v_event_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Never trust the caller: the session must belong to the caller.
  if not exists (
    select 1 from public.workout_sessions s
    where s.id = p_session_id and s.user_id = v_user_id
  ) then
    raise exception 'workout not found';
  end if;

  -- Authoritative XP from trusted tables only. Formula mirrors
  -- features/gamification/domain/xp.ts (PROPOSED v1): round half up,
  -- clamp each entry to [1, 500]. PostgreSQL round(numeric) and
  -- JavaScript Math.round agree on non-negative inputs.
  select
    coalesce(sum(xp) filter (where category = 'strength'), 0),
    coalesce(sum(xp) filter (where category = 'endurance'), 0),
    coalesce(sum(xp) filter (where category = 'agility'), 0),
    coalesce(sum(xp) filter (where category = 'focus'), 0)
  into v_strength, v_endurance, v_agility, v_focus
  from (
    select
      ex.category,
      least(
        500,
        greatest(
          1,
          round(
            we.quantity * case ex.unit
              when 'reps' then 1
              when 'seconds' then 1
              when 'minutes' then 2
              when 'kilometers' then 10
            end
          )
        )
      )::integer as xp
    from public.workout_entries we
    join public.exercises ex on ex.id = we.exercise_id
    where we.session_id = p_session_id
      and ex.is_active
  ) entry_xp;

  v_total := v_strength + v_endurance + v_agility + v_focus;
  if v_total <= 0 then
    return 0;
  end if;

  -- Event FIRST: the conflict-safe insert decides exactly-once. Stats are
  -- only touched when this call inserted the event row.
  insert into public.xp_events (user_id, source, amount, metadata)
  values (
    v_user_id,
    'workout',
    v_total,
    jsonb_build_object(
      'workout_session_id', p_session_id::text,
      'entry_count', (
        select count(*)
        from public.workout_entries
        where session_id = p_session_id
      ),
      'by_stat', jsonb_build_object(
        'strength', v_strength,
        'endurance', v_endurance,
        'agility', v_agility,
        'focus', v_focus
      )
    )
  )
  on conflict do nothing;
  get diagnostics v_event_count = row_count;
  if v_event_count = 0 then
    return 0;
  end if;

  -- Upsert (not read-modify-write): atomic increment, tolerates a user
  -- row missing its stats row.
  insert into public.player_stats as ps
    (user_id, strength_xp, endurance_xp, agility_xp, focus_xp)
  values (v_user_id, v_strength, v_endurance, v_agility, v_focus)
  on conflict (user_id) do update set
    strength_xp = ps.strength_xp + excluded.strength_xp,
    endurance_xp = ps.endurance_xp + excluded.endurance_xp,
    agility_xp = ps.agility_xp + excluded.agility_xp,
    focus_xp = ps.focus_xp + excluded.focus_xp,
    updated_at = now();

  return v_total;
end;
$$;

-- Least privilege: only signed-in users may call it. Direct calls are
-- harmless by construction (ownership + recompute + once-only above).
revoke all on function public.award_workout_xp(uuid) from public, anon;
grant execute on function public.award_workout_xp(uuid) to authenticated;
