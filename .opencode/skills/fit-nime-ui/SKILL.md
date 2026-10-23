---
name: fit-nime-ui
description: Build Fit-Nime UI with its light anime-RPG direction using Tailwind v4, existing shadcn-style components, and Lucide — mobile-first and WCAG AA.
---

# Fit-Nime UI

## Visual direction

- **Light theme, anime-inspired, RPG/game feel.** Clean, friendly, character-centric. NOT a dark gamer aesthetic.
- Mobile-first; visual feedback for actions; subtle animation only.

## Technology — reuse first

- Tailwind CSS v4 + existing design tokens in `apps/web/app/globals.css`.
- shadcn-style components in `apps/web/components/ui/` (new-york, zinc, RSC). Check what exists before adding anything.
- Lucide icons only (`lucide-react`). No emoji in UI.
- To add a missing primitive, use the shadcn MCP (`@shadcn` registry) so installs match `apps/web/components.json`. Never hand-copy a component the MCP/CLI can install; never introduce a second UI framework or duplicate an existing primitive.

## Accessibility (WCAG AA, non-negotiable)

- Semantic HTML, visible focus states, sufficient contrast on the light theme.
- Full keyboard operability for interactive elements (forms, dialogs, menus).
- `prefers-reduced-motion`: disable/greatly reduce animation.
- Touch targets ≥ 44px for primary mobile actions (workout logging is thumb-driven).

## Keep it junior-readable

Small components, explicit props, no clever abstractions. A new contributor must find UI → logic → validation → DB without chasing wrappers.
