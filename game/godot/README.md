# Fit-Nime — Godot project (deferred)

Godot integration is intentionally deferred past Phase 0.

When implemented:
- Godot 4.x project lives here (`game/godot/`).
- Web export is copied to `apps/web/public/godot/` (git-ignored build output).
- Communication is same-origin `postMessage` only.
- Godot is a renderer. It must never hold Supabase credentials
  or mutate XP, levels, or stats.
