# AI Tooling

Small, project-aware AI development setup for Fit-Nime (OpenCode v2). Established in `RCCF-FITNESS-APP-003.5`; product architecture is unchanged — see `docs/ARCHITECTURE.md` and `docs/DATABASE.md`.

## 1. MCPs

| MCP | Purpose | Auth | Why installed |
|---|---|---|---|
| `supabase` | Inspect tables, migrations, RLS, logs, advisors; `generate_typescript_types`; assist DB development | OAuth (browser flow, no committed secret), project-scoped via `?project_ref=` | Highest-value: live schema/RLS evidence for Phase 2+ DB work |
| `shadcn` | Search, inspect, and install shadcn registry components matching `apps/web/components.json` | None (local stdio) | Official, lightweight; keeps UI primitives consistent instead of hand-copied |

Project config is `opencode.json` (V2 native `mcp.servers` format). Global user MCPs (`playwright`, `browser-use`, `rea` in `~/.config/opencode/`) are **not** duplicated here — they remain available without bloating the committed config.

- **Playwright test runner** = automated regression tests (`pnpm test:e2e`).
- **Playwright MCP** (global) = AI-driven interactive browser inspection/debugging.
- No project-local Playwright MCP: the global one already covers the debugging use case; committing another copy adds ~20 tools of context overhead for every session.

### First-time setup

```sh
opencode mcp auth supabase   # one-time browser OAuth; grants project-scoped access
opencode mcp list            # expect: supabase connected, shadcn connected/pending
```

Headless/CI alternative (never commit): add an `Authorization: Bearer {env:SUPABASE_ACCESS_KEY}` header via local-only config and a scoped PAT. For unattended routines, prefer `?project_ref=<ref>&read_only=true` and approve only read tools in advance.

## 2. Skills

| Skill | Scope | Source | Purpose |
|---|---|---|---|
| `supabase` | project (`.agents/skills/`) | Official `supabase/agent-skills` v0.1.2 (`npx skills add supabase/agent-skills --skill supabase`) | Current Supabase procedures: SSR, CLI/MCP usage, RLS traps, security checklist |
| `fit-nime-architecture` | project (`.opencode/skills/`) | Custom | Approved architecture gate (SOLID/DRY/KISS, boundaries, prohibited patterns) |
| `fit-nime-supabase` | project (`.opencode/skills/`) | Custom | Project DB rules (ownership, RLS model, triggers, safe clients, MCP discipline) |
| `fit-nime-ui` | project (`.opencode/skills/`) | Custom | Light anime-RPG direction, Tailwind v4 + shadcn + Lucide reuse, WCAG AA |
| `fit-nime-testing` | project (`.opencode/skills/`) | Custom | Test-type selection, required checks, no fabricated results |
| `fit-nime-rccf` | project (`.opencode/skills/`) | Custom | RCCF prompt structure and workflow (audit-first, verify-before-claim, exact verdict) |

## 3. Fit-Nime custom skills

In `.opencode/skills/<name>/SKILL.md` (auto-discovered by OpenCode up to the git root). Each is < 60 lines and references `docs/` instead of duplicating it:

- **fit-nime-architecture** — the gate every change must pass; lists prohibited patterns (generic service/repository chains, giant components, client-authoritative progression, Godot DB access).
- **fit-nime-supabase** — ownership/RLS rules, trigger-only provisioning, migration ordering, safe client usage, MCP read-only discipline.
- **fit-nime-ui** — reuse-first component policy via the shadcn MCP; accessibility minimums (keyboard, focus, contrast, reduced motion, 44px targets).
- **fit-nime-testing** — which tool per test type (incl. MCP-vs-runner distinction); commands that must pass before "done".
- **fit-nime-rccf** — keeps future phase prompts consistent (Role/Context/Constraints/Format, audit-first, exact verdicts).

No `fit-nime-gamification` skill: XP formulas are not finalized — creating one now would invent rules.

## 4. Environment variables

Names only — values never committed, never printed:

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`apps/web/.env.local`) | Yes, to run the app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key, safe with RLS (`apps/web/.env.local`) | Yes, to run the app |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only progression writes (future) — never `NEXT_PUBLIC_`, never client imports | No (not yet used) |
| `SUPABASE_ACCESS_KEY` | Optional PAT for headless MCP use only; prefer OAuth | No |

`.env`, `.env*.local` are git-ignored; only `.env.example` (empty placeholders) is tracked.

## 5. Maintenance

- **Update official skill**: `npx skills update supabase` (bumps `.agents/skills/supabase` + `skills-lock.json`). Review the diff — upstream guidance changes; check it against `docs/DATABASE.md`.
- **Update MCP config**: edit `opencode.json`, then `opencode mcp list` to confirm parsing/status. Keep V2 `mcp.servers` shape; secrets stay in env/OAuth, never in the file.
- **Add a new tool safely**: it needs a concrete Fit-Nime use case, official/maintained source, safe credential handling, and no overlap with existing tools. Document it in the tables above.
- **When NOT to add another MCP**: generic SaaS (Slack/Notion/Linear/Figma), analytics/CRM/email, second browser automation, paid registries, or anything the test runner / docs / existing skills already cover.
