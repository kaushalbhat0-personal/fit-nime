# Fit-Nime

A gamified fitness web app. Log workouts, earn XP across Strength, Endurance,
Agility, and Focus, and watch an anime character grow.

Phase 0 is foundation only: no auth UI, no workout logging, no XP, no Godot.

## Stack

- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS v4
- shadcn/ui pattern + Lucide icons
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Zod for validation (from Phase 1 on)
- Vitest (unit) + Playwright (E2E)
- pnpm workspaces

## Structure

```text
apps/web/            Next.js PWA (the app)
  app/               Routes (server components by default)
  components/ui/     Shared UI (shadcn-style)
  features/          Business capabilities (workouts, gamification, ...)
  lib/supabase/      Browser / server / middleware Supabase helpers
  lib/utils.ts       Shared helpers (cn)
  tests/unit/        Vitest smoke tests
  tests/e2e/        Playwright specs
game/godot/          Godot 4.x project (deferred, renderer only)
supabase/migrations/ Database migrations (Phase 1+)
docs/                Architecture notes
```

## Quickstart

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local
# fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

## Checks

```sh
pnpm build       # Next.js production build
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test        # vitest run
pnpm test:e2e    # playwright (starts dev server)
```

## Environment variables

| Name | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (safe with RLS) | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No — server only, never add | Reserved for later server mutations |

Never commit `.env.local`. Never put service-role keys in client components.

## Architecture principles

- Feature-driven: `features/<name>/` owns UI-adjacent code, schemas, types.
- Minimum layers necessary: `page → server action → domain → Supabase`.
- Pure domain: `features/gamification/domain/` has no React/Next/Supabase deps.
- Server-authoritative progression: client may preview, server decides XP.
- Godot is a renderer: `postMessage` snapshot in, animation event out. No secrets.

See `docs/ARCHITECTURE.md`. Future features belong in `features/`:
workouts → `features/workouts/`, progression math → `features/gamification/`,
avatar shell → `features/avatar/`.
