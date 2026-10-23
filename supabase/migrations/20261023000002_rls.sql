-- RCCF-003: RLS. Ownership always derives from auth.uid(), never from a
-- client-provided user_id. Tables without a write policy below are
-- intentionally read-only (or hidden) for clients; future progression
-- writes happen via service-role / SECURITY DEFINER server logic, which
-- bypass RLS. Do NOT add client write policies for progression tables.

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_entries enable row level security;
alter table public.player_stats enable row level security;
alter table public.xp_events enable row level security;
alter table public.character_state enable row level security;

-- profiles: owners read/update their own row only. INSERT is handled by
-- the handle_new_user() trigger, so no client INSERT policy exists.
-- The WITH CHECK on id prevents ownership transfer.
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- exercises: global catalog. Authenticated users read active and inactive
-- rows (inactive = hidden from logging UI, kept for history integrity).
-- No write policies: ordinary users cannot mutate the catalog.
create policy exercises_select on public.exercises
  for select to authenticated using (true);

-- workout_sessions: full ownership by the authenticated user.
create policy sessions_select_own on public.workout_sessions
  for select to authenticated using (auth.uid() = user_id);
create policy sessions_insert_own on public.workout_sessions
  for insert to authenticated with check (auth.uid() = user_id);
create policy sessions_update_own on public.workout_sessions
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sessions_delete_own on public.workout_sessions
  for delete to authenticated using (auth.uid() = user_id);

-- workout_entries: ownership inherited from the parent session. The
-- WITH CHECK on session_id prevents moving an entry into another user's
-- session, and the USING clause prevents reading/touching others' rows.
create policy entries_select_own on public.workout_entries
  for select to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  );
create policy entries_insert_own on public.workout_entries
  for insert to authenticated with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  );
create policy entries_update_own on public.workout_entries
  for update to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  );
create policy entries_delete_own on public.workout_entries
  for delete to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_entries.session_id and s.user_id = auth.uid()
    )
  );

-- player_stats: read-own only. Deliberately no INSERT/UPDATE/DELETE for
-- clients; the future XP engine writes server-side.
create policy stats_select_own on public.player_stats
  for select to authenticated using (auth.uid() = user_id);

-- xp_events: append-only audit. Clients read their own history; nothing
-- else. A missing write policy means "no client writes", which is the
-- anti-cheat guarantee future phases rely on.
create policy xp_select_own on public.xp_events
  for select to authenticated using (auth.uid() = user_id);

-- character_state: read-own only. Level/stage are set by future server
-- progression logic, never by the browser.
create policy character_select_own on public.character_state
  for select to authenticated using (auth.uid() = user_id);
