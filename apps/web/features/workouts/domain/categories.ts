import type { ExerciseCategory } from "@/lib/supabase/database.types";

/**
 * Canonical category order and display labels. Pure data (no icons) so
 * domain logic like Today's Focus can reuse it; the UI layer pairs each
 * entry with a Lucide icon in components/categories.ts.
 */
export const CATEGORY_ORDER: ExerciseCategory[] = [
  "strength",
  "endurance",
  "agility",
  "focus",
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: "Strength",
  endurance: "Endurance",
  agility: "Agility",
  focus: "Focus",
};
