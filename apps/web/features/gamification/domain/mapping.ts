import type { ExerciseCategory } from "@/lib/supabase/database.types";

/**
 * Single centralized exercise-category → stat-column mapping.
 * Categories and stat names match 1:1 by product design (see seed:
 * "3 exercises per stat"). No per-category conditionals elsewhere.
 */
export const STAT_COLUMN = {
  strength: "strength_xp",
  endurance: "endurance_xp",
  agility: "agility_xp",
  focus: "focus_xp",
} as const satisfies Record<ExerciseCategory, string>;
