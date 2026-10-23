---
name: fit-nime-rccf
description: Follow Fit-Nime's RCCF prompt workflow (Role, Context, Constraints, Format plus audit-first, verify-before-claim, exact verdicts) for phased development tasks.
---

# Fit-Nime RCCF

How to run phased development prompts (e.g. `RCCF-FITNESS-APP-00X`) consistently.

## Prompt structure

Every implementation prompt uses **Role → Context → Constraints → Format**:

1. **Role**: the expert hat (e.g. Lead AI Development Infrastructure Architect).
2. **Context**: project, stack, current phase, what exists (from repo inspection, not memory).
3. **Constraints**: approved architecture, quality gate (SOLID/DRY/KISS), what NOT to do.
4. **Format**: exact report sections and the single-line verdict required.

## Workflow rules

- **Audit before implementation.** Inspect the repo first; make decisions from what exists.
- **Preserve the approved architecture.** Never redesign it mid-task; surface conflicts as findings instead.
- **Verify before claiming success.** Run the checks; report exact results. Never fabricate tests, MCP connectivity, or skill discovery.
- **Report findings and deferred work** explicitly rather than silently skipping.
- **Exact verdict**: end with exactly one of `PASS`, `PASS WITH FINDINGS`, or `FAIL` (plus the task's verdict suffix).
- **Tooling changes only** when the task says so: no product features, no schema/RLS/auth changes unless the task requires them.
- **Git discipline**: review `git status`/`git diff` before and after; never commit secrets, credentials, machine-specific files, or build artifacts.
