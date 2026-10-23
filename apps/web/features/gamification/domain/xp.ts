import type {
  ExerciseCategory,
  ExerciseUnit,
} from "@/lib/supabase/database.types";
import { STAT_COLUMN } from "@/features/gamification/domain/mapping";
import type {
  EntryXpInput,
  WorkoutXpResult,
} from "@/features/gamification/domain/types";

/**
 * PROPOSED v1 XP economy (rebalance here; the SQL mirror in
 * supabase/migrations/20261023000004_award_xp.sql cites this file).
 *
 * Rounding rule: round half up on non-negative inputs. JavaScript
 * Math.round and PostgreSQL round(numeric) agree exactly there, so the
 * display/preview math below and the authoritative SQL award match.
 *
 * Pure: no React, no Next.js, no Supabase, no browser APIs.
 */

/** PROPOSED: XP per unit of quantity, by exercise unit. */
export const XP_PER_UNIT: Record<ExerciseUnit, number> = {
  reps: 1,
  seconds: 1,
  minutes: 2,
  kilometers: 10,
};

/** PROPOSED: every performed entry earns at least this much. */
export const MIN_ENTRY_XP = 1;

/** PROPOSED: single-entry cap; bounds absurd quantities and exploits. */
export const MAX_ENTRY_XP = 500;

/** One entry → integer XP. Assumes validated quantity (> 0, finite). */
export function calculateEntryXp(quantity: number, unit: ExerciseUnit): number {
  const raw = quantity * XP_PER_UNIT[unit];
  const rounded = Math.round(raw);
  return Math.min(MAX_ENTRY_XP, Math.max(MIN_ENTRY_XP, rounded));
}

/**
 * A workout → total XP plus per-stat breakdown. No workout-level caps,
 * bonuses, or multipliers by design (deterministic and minimal).
 */
export function calculateWorkoutXp(entries: EntryXpInput[]): WorkoutXpResult {
  const byStat: Record<ExerciseCategory, number> = {
    strength: 0,
    endurance: 0,
    agility: 0,
    focus: 0,
  };
  for (const entry of entries) {
    byStat[entry.category] += calculateEntryXp(entry.quantity, entry.unit);
  }
  return {
    totalXp: byStat.strength + byStat.endurance + byStat.agility + byStat.focus,
    byStat,
  };
}

/** Stat column holding an entry's XP (single lookup, no conditionals). */
export function statColumnFor(category: ExerciseCategory): string {
  return STAT_COLUMN[category];
}
