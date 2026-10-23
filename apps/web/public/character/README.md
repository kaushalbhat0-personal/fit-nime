# Character asset contract (RCCF-008)

The companion is a **visual motivational asset only**. It is not a game
system: no stats, progression, selection, or persistence back it. See
`components/companion.tsx` for the single static manifest.

## Current asset

| Slot                        | Path                                                   |
| --------------------------- | ------------------------------------------------------ |
| `default`                   | `/character/companion.svg`                             |
| `celebrate` (large session) | `/character/companion.svg` (same art, stronger motion) |
| `level-up`                  | `/character/companion.svg` (same art, glow treatment)  |

One shared illustration is intentionally reused across all three slots.
Variant emphasis comes from CSS (entrance, bob, glow), never from extra
artwork or new components.

## Dropping in supplied renders later

When the real transparent-background male/female fitness renders land,
save them here and point the manifest at them — no UI code changes:

- `public/character/default.{png,webp}`
- `public/character/celebrate.{png,webp}`
- `public/character/level-up.{png,webp}`

Rules for replacements:

- Transparent background, roughly square, ≤ 200 KB each.
- Friendly, athletic, light anime style matching the app palette
  (cream `#FBF3E8`, terracotta `#C65D3B`, muted teal `#3E8E87`).
- No text baked into the image (captions live in components for i18n/a11y).
- If both male and female renders are supplied, do NOT add account gender
  or a chooser in this phase — pick one deterministic default in the
  manifest and document why.

## Guards

- The component treats every slot as decorative (`aria-hidden`); missing
  or broken art must never block the workout flow.
- No database tables, server actions, or XP logic may reference these
  assets. Presentation layer only.
