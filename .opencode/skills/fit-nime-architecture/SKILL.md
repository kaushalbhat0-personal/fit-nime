---
name: fit-nime-architecture
description: Enforce Fit-Nime's approved architecture (SOLID/DRY/KISS, feature-driven structure, pure domain, server authority, Godot boundary) on every change.
---

# Fit-Nime Architecture

Binding constraints for all implementation work. Details: `docs/ARCHITECTURE.md`.

## Principles

- **SOLID** where it improves clarity. No abstraction for its own sake.
- **DRY**: one authoritative implementation (especially XP/level/stats), imported everywhere.
- **KISS**: simplest solution that satisfies the requirement.
- **CALL, DON'T COPY**: reuse existing functions, schemas, types, clients.
- **Minimum layers necessary.** Approved simple mutation flow:

```text
page → server action → domain function (pure) → Supabase
```

Pure calculation needs no extra layers: `component → calculateXp()`.

## Structure

- Feature-driven: `features/workouts/`, `features/gamification/`, `features/profile/`, `features/progress/`, `features/avatar/`.
- Main files (pages, actions, layouts) **orchestrate**; they compose, they don't contain everything.
- Shared Supabase helpers live only in `apps/web/lib/supabase/`. No other shared data-access layer.

## Hard boundaries

- **Pure domain**: `features/*/domain/` and schemas have no React, Next.js, Supabase, browser, or Godot imports. Vitest-tested.
- **Server authority**: XP, stats, level, streaks, achievements, rewards are computed server-side. Client previews are never trusted and never written to progression tables.
- **Godot boundary**: renderer only. Same-origin iframe + validated `postMessage` snapshot (`level, stats, stage, event`). No credentials, no DB writes, no progression logic.

## Prohibited by default

Generic `services/`, `helpers/`, `repositories/`, controller-service-repository chains, DI frameworks, global state managers, giant `utils/` dumps, giant components/pages, duplicated domain logic, client-authoritative progression, Godot database access.

Introduce a layer only when real complexity justifies it AND a junior can still trace UI → logic → validation → DB → types → tests → entry point. If they can't, simplify before merging.
