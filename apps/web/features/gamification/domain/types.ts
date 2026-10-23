import type {
  ExerciseCategory,
  ExerciseUnit,
} from "@/lib/supabase/database.types";

/**
 * Shared gamification input/output shapes. Field types only — no logic.
 */
export type EntryXpInput = {
  category: ExerciseCategory;
  quantity: number;
  unit: ExerciseUnit;
};

export type WorkoutXpResult = {
  totalXp: number;
  byStat: Record<ExerciseCategory, number>;
};

export type StatXp = {
  strength_xp: number;
  endurance_xp: number;
  agility_xp: number;
  focus_xp: number;
};
