# Architecture

Binding for all phases. Optimizes for junior-developer comprehension.

## Principles

- SOLID where it helps, never as abstraction for its own sake.
- DRY: one authoritative implementation (especially XP/level/stats), imported everywhere.
- KISS: simplest solution that satisfies the requirement.
- Feature-driven: `features/workouts/`, `features/gamification/`, `features/profile/`, `features/progress/`, `features/avatar/`.
- Minimum layers necessary, maximum clarity.

## Approved flows

Simple mutation:

```text
page
 ↓
server action
 ↓
domain function (pure)
 ↓
Supabase
```

Pure calculation (no extra layers):

```text
component
 ↓
calculateXp()
```

## What we do NOT create by default

Controllers, repositories, adapters, generic service layers, DI frameworks,
global state managers, giant `utils/` dumps. Introduce a layer only when real
complexity justifies it and a junior can still trace the flow.

## Boundaries

- Domain (`features/*/domain/`, schemas): pure, deterministic, no React, no
  Next.js, no Supabase, no browser APIs, no Godot. Unit-tested with Vitest.
- Data access: inside feature `actions/` for single-feature use; shared
  Supabase helpers only in `lib/supabase/`.
- Server authority: XP, levels, stats, streaks, achievements are computed
  server-side. Client previews are never trusted.
- Godot: presentation only. Same-origin iframe, validated `postMessage`
  snapshot (`level, stats, stage, event`). No credentials, no direct DB writes.

## Junior-developer test (completion gate)

For any feature, a newcomer must quickly answer: where is the UI, business
logic, validation, database access, types, tests, and entry point? If that
requires chasing abstractions, simplify before merging.
