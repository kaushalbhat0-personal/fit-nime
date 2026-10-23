import type { StatXp } from "@/features/gamification/domain/types";

/**
 * Derivation from stored stat XP. Total is never stored (see schema);
 * level is a pure function of the total so rebalancing is one constant.
 *
 * PROPOSED v1 curve: level = floor(sqrt(total / 100)) + 1
 *   0–99 → 1, 100–399 → 2, 400–899 → 3, 900–1599 → 4, …
 *
 * Pure: no React, no Next.js, no Supabase, no browser APIs.
 */

/** PROPOSED: XP divisor shaping the level curve. */
export const LEVEL_XP_DIVISOR = 100;

export function calculateTotalXp(stats: StatXp): number {
  return (
    stats.strength_xp + stats.endurance_xp + stats.agility_xp + stats.focus_xp
  );
}

export function calculateLevel(totalXp: number): number {
  const safe = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
  return Math.floor(Math.sqrt(safe / LEVEL_XP_DIVISOR)) + 1;
}
