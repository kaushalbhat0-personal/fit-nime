# Database

Supabase Postgres is the persistent source of truth. Godot never touches it.

## Tables

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user (`id` = `auth.users.id`). Holds `display_name`. |
| `exercises` | Global exercise catalog (12 seeded rows). Not user-owned. |
| `workout_sessions` | A workout session owned by one user. |
| `workout_entries` | One exercise performed in a session. `quantity` is measured in the exercise's `unit`. |
| `player_stats` | Progression state (`strength_xp`, …). Server-authoritative: clients read, never write. |
| `xp_events` | Append-only XP audit. Clients read their own history, never write. |
| `character_state` | Cached avatar `level`/`stage`. Server-authoritative. |

Relationships:

```text
auth.users 1:1 profiles 1:N workout_sessions 1:N workout_entries N:1 exercises
profiles 1:1 player_stats / xp_events (1:N) / character_state
```

Total XP and level are **derived** (`SUM(stat_xp)` → level curve in code),
never stored. XP math lives in `features/gamification/` (Phase 3+), not here.

## Ownership

`auth.uid()` is the source of truth. No client-provided `user_id` is ever
trusted: INSERT/UPDATE policies use `WITH CHECK (auth.uid() = user_id)`, and
`workout_entries` inherit ownership through their parent session. `profiles.id`
is the primary key, so ownership cannot be transferred.

## RLS model

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | own row | — (trigger only) | own row, id immutable | — |
| `exercises` | authenticated | — | — | — |
| `workout_sessions` | own | own | own | own |
| `workout_entries` | own session's | own session's | own session's (no re-parenting) | own session's |
| `player_stats` | own | — (server only) | — (server only) | — |
| `xp_events` | own | — (server only) | — | — |
| `character_state` | own | — (server only) | — (server only) | — |

Missing write policies are intentional: with RLS enabled, "no policy" means
"no client access". Future progression writes use service-role or
`SECURITY DEFINER` functions, which bypass RLS. Do not add client write
policies for progression tables.

## Profile provisioning

`handle_new_user()` trigger on `auth.users` INSERT creates `profiles`,
`player_stats`, and `character_state` rows (`SECURITY DEFINER`, idempotent
via `ON CONFLICT DO NOTHING`). This is the only creation path.

## Authentication

Email/password via Supabase Auth. Routes: `/login`, `/signup` (public),
`/dashboard` (protected). The proxy redirects optimistically; the `(app)`
layout re-checks the session server-side and is the real gate. Sign-out is a
server action in the `(app)` header. If email confirmation is enabled,
signup returns "check your inbox" instead of a session.

## Seed

12 exercises (3 per stat) in `20261023000003_seed_exercises.sql`, idempotent
via `ON CONFLICT (slug) DO UPDATE`. Re-running never duplicates.

## Verification (RCCF-003, run 2026-10-23 against the live project)

Behavioral suite: 20/20 PASS via anon + GoTrue admin APIs with two
throwaway users, both deleted afterwards (`profiles` count back to 0 —
zero residue). Verified: trigger provisioning, 12-row seed, own CRUD,
xp/stats/character write denials, and full cross-user isolation.
`tests/integration/rls.test.ts` encodes the same suite for any future
local stack (`SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY`).

Quick re-checks (dashboard SQL editor):

```sql
select count(*) from public.exercises;          -- expect 12
select * from pg_policies where schemaname = 'public';  -- expect 15 policies
```

## Migrations

```sh
# local stack (needs Docker Desktop running)
supabase start     # first boot pulls images
supabase db reset  # applies supabase/migrations/* in order
supabase stop

# remote project (dashboard SQL editor, or link once):
supabase link --project-ref <ref>   # needs an access token, never commit it
supabase db push
```

Migration files are timestamped and ordered: schema → RLS → seed.

## Types

`apps/web/lib/supabase/database.types.ts` is the single source of DB types,
consumed via `createServerClient<Database>` / `createBrowserClient<Database>`.
Regenerate after any schema change:

```sh
supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts
```

The committed file is hand-authored to match the migration; every table
and column was exercised against the live project during verification.
Prefer the generator once a linked project or local stack is available.
