-- RCCF-003: core tables for profiles, exercise catalog, workouts, progression.
-- Progression tables (player_stats, xp_events, character_state) are created
-- here but left server-authoritative: see 20261023000002_rls.sql (read-only
-- for clients; writes happen from trusted server logic in later phases).

-- Categories map 1:1 to the four future stats (strength, endurance,
-- agility, focus). Units describe how an exercise quantity is measured.
do $$ begin
  create type public.exercise_category as enum (
    'strength', 'endurance', 'agility', 'focus'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.exercise_unit as enum (
    'reps', 'seconds', 'minutes', 'kilometers'
  );
exception when duplicate_object then null;
end $$;

-- One application profile per Supabase auth user. id IS auth.users.id.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 30)
);

-- Canonical exercise catalog. Global rows, not owned by any user.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  category public.exercise_category not null,
  unit public.exercise_unit not null,
  default_value numeric not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint exercises_default_value_positive check (default_value > 0)
);

-- A logical workout session owned by one user.
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint sessions_completed_after_start check (
    completed_at is null or completed_at >= started_at
  )
);
create index workout_sessions_user_id_idx on public.workout_sessions (user_id);

-- One exercised performed inside a session. quantity is measured in the
-- exercise's unit (e.g. 10 reps, 60 seconds, 2 kilometers).
create table public.workout_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  quantity numeric not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint entries_quantity_positive check (quantity > 0)
);
create index workout_entries_session_id_idx on public.workout_entries (session_id);
create index workout_entries_exercise_id_idx on public.workout_entries (exercise_id);

-- Persistent progression state. Updated only by trusted server logic
-- (Phase 3+). No client write policies exist by design.
create table public.player_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  strength_xp integer not null default 0,
  endurance_xp integer not null default 0,
  agility_xp integer not null default 0,
  focus_xp integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint stats_non_negative check (
    strength_xp >= 0 and endurance_xp >= 0
    and agility_xp >= 0 and focus_xp >= 0
  )
);

-- Append-only audit of XP awards. Total XP is derived (sum of stat XP);
-- level/stage are derived in application code, never stored as truth here.
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null,
  amount integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint xp_amount_positive check (amount > 0)
);
create index xp_events_user_id_created_at_idx
  on public.xp_events (user_id, created_at desc);

-- Cached presentation state for the avatar. Owned by future server logic.
create table public.character_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  level integer not null default 1,
  stage integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint character_level_valid check (level >= 1),
  constraint character_stage_valid check (stage between 1 and 5)
);

-- Keep updated_at fresh without application code.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists player_stats_updated_at on public.player_stats;
create trigger player_stats_updated_at before update on public.player_stats
  for each row execute function public.set_updated_at();

drop trigger if exists character_state_updated_at on public.character_state;
create trigger character_state_updated_at before update on public.character_state
  for each row execute function public.set_updated_at();

-- Provisioning: a new auth user always gets a profile, stats row, and
-- character row. Runs as definer (bypasses RLS), idempotent by PK.
-- This is the ONLY profile-creation path; no client INSERT policy exists.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
    on conflict (id) do nothing;
  insert into public.player_stats (user_id) values (new.id)
    on conflict (user_id) do nothing;
  insert into public.character_state (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
