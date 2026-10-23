---
name: fit-nime-testing
description: Apply Fit-Nime's testing expectations (unit, RLS/security, E2E) and required checks (typecheck, lint, format, build) before claiming success.
---

# Fit-Nime Testing

## Test types — use the right one

| Type | Tool | When |
|---|---|---|
| Unit (pure logic) | Vitest, `apps/web/tests/unit/` | Domain math, schemas, validation. Deterministic, no I/O. |
| Integration / RLS | Vitest + Supabase, `apps/web/tests/integration/rls.test.ts` | Ownership, cross-user isolation, progression write denials. Must prove behavior, not just shape. |
| E2E (user flows) | Playwright, `apps/web/tests/e2e/` | Auth, workout logging, responsive/mobile states. |
| Browser inspection | Playwright MCP (interactive, AI-driven) | Debugging a failing flow, verifying a visual state. Distinct from the Playwright test runner (automated regression). |

No test-count vanity. Security tests must demonstrate the denial/isolation, as `rls.test.ts` does.

## Required checks before "done"

```sh
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
pnpm test       # vitest run
pnpm format     # prettier --check .
pnpm build      # Next.js production build (before phase milestones)
pnpm test:e2e   # playwright (needs dev server + env)
```

## Rules

- Never fabricate test results. Report exact pass/fail counts from actual runs.
- If a check can't run (missing Docker, env, credentials), say so explicitly and mark the work unverified — don't substitute assumptions.
- Don't commit `test-results/`, `playwright-report/`, or `.next/` artifacts.
