import type { ExerciseCategory } from "@/lib/supabase/database.types";

/**
 * Parse the authoritative per-stat breakdown stored by award_workout_xp
 * in xp_events.metadata.by_stat. Anything malformed yields null so the UI
 * shows the authoritative total only — never a recomputed guess.
 *
 * Pure: no React, no Next.js, no Supabase, no browser APIs.
 */

const STAT_KEYS: ExerciseCategory[] = [
  "strength",
  "endurance",
  "agility",
  "focus",
];

export function parseEventByStat(
  metadata: unknown,
): Record<ExerciseCategory, number> | null {
  if (typeof metadata !== "object" || metadata === null) {
    return null;
  }
  const byStat = (metadata as Record<string, unknown>)["by_stat"];
  if (typeof byStat !== "object" || byStat === null) {
    return null;
  }
  const record = byStat as Record<string, unknown>;
  const result = {} as Record<ExerciseCategory, number>;
  for (const key of STAT_KEYS) {
    const value = record[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return null;
    }
    result[key] = value;
  }
  return result;
}
