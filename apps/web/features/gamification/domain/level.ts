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

/**
 * XP threshold to advance past a level: level L spans
 * [nextLevelAt(L-1), nextLevelAt(L)). Levels below 1 start at 0 so the
 * level-1 band computes correctly.
 */
export function nextLevelAt(level: number): number {
  if (!Number.isFinite(level) || level < 1) {
    return 0;
  }
  const band = Math.floor(level);
  return LEVEL_XP_DIVISOR * band * band;
}

export type LevelProgress = {
  level: number;
  totalXp: number;
  /** XP needed to reach the next level (start of next band). */
  nextLevelAt: number;
  /** XP earned inside the current band. */
  intoLevel: number;
  /** XP spanning the current band. */
  bandSize: number;
  /** 0..1 fraction through the current band (for progress bars). */
  progress: number;
};

/** Everything a progress display needs, derived from one total. */
export function calculateLevelProgress(totalXp: number): LevelProgress {
  const safe = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
  const level = calculateLevel(safe);
  const bandStart = nextLevelAt(level - 1);
  const bandEnd = nextLevelAt(level);
  const bandSize = Math.max(1, bandEnd - bandStart);
  return {
    level,
    totalXp: safe,
    nextLevelAt: bandEnd,
    intoLevel: safe - bandStart,
    bandSize,
    progress: Math.min(1, Math.max(0, (safe - bandStart) / bandSize)),
  };
}
