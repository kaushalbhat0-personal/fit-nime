import { Brain, Dumbbell, HeartPulse, Zap } from "lucide-react";
import type { ExerciseCategory } from "@/lib/supabase/database.types";

/**
 * Single source of category presentation. Components look up label + icon
 * by the category value from the database — no per-category conditionals
 * scattered across the UI.
 */
export const CATEGORY_META: Record<
  ExerciseCategory,
  { label: string; Icon: typeof Dumbbell }
> = {
  strength: { label: "Strength", Icon: Dumbbell },
  endurance: { label: "Endurance", Icon: HeartPulse },
  agility: { label: "Agility", Icon: Zap },
  focus: { label: "Focus", Icon: Brain },
};

export const CATEGORY_ORDER: ExerciseCategory[] = [
  "strength",
  "endurance",
  "agility",
  "focus",
];
