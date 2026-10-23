---
name: fit-nime-supabase
description: Apply Fit-Nime's Supabase rules (RLS-first ownership, server-authoritative progression, safe clients, migrations) when touching data or auth.
---

# Fit-Nime Supabase

Project rules for data and auth. Schema reference: `docs/DATABASE.md`. Never duplicate that file's table details here — read it when needed.

## Ownership and RLS

- `auth.uid()` is the source of truth. Never trust client-provided `user_id`.
- RLS first: every user-owned table enforces `auth.uid() = user_id`; `workout_entries` inherit ownership via the parent session.
- Missing write policies are intentional ("no policy" = "no client access"). Never add client write policies for `player_stats`, `xp_events`, `character_state` — progression writes are server-only (service-role or `SECURITY DEFINER` functions).
- Total XP and level are **derived** (`SUM(stat_xp)` → level curve in code), never stored.

## Writes

- Profile rows are created only by the `handle_new_user()` trigger (idempotent, `ON CONFLICT DO NOTHING`). No client INSERT into `profiles`.
- Schema changes go through timestamped migrations in `supabase/migrations/` (schema → RLS → seed). Seed must stay idempotent (`ON CONFLICT ... DO UPDATE`).
- After schema changes, regenerate `apps/web/lib/supabase/database.types.ts` (single source of DB types).

## Clients

- Browser: `createBrowserClient<Database>`; server/middleware: `createServerClient<Database>` from `apps/web/lib/supabase/`.
- Never import server clients (or service-role keys) into client components. `SUPABASE_SERVICE_ROLE_KEY` is server-only and never committed.
- Auth routes: `/login`, `/signup` public; `/dashboard` protected. The `(app)` layout re-checks the session server-side — that is the real gate, the proxy redirect is only optimistic.

## AI tooling

- Prefer the Supabase MCP (OAuth, project-scoped) for inspection: `list_tables`, logs, advisors, `generate_typescript_types`. Read-only questions get read-only queries.
- Keep manual tool-call approval ON. Review every `execute_sql` / `apply_migration` before running; never run destructive SQL without explicit user confirmation.
