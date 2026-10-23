import { Brain, Dumbbell, HeartPulse, Zap } from "lucide-react";
import type { ExerciseCategory } from "@/lib/supabase/database.types";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/features/workouts/domain/categories";

/**
 * Single source of category presentation. Components look up label + icon
 * by the category value from the database — no per-category conditionals
 * scattered across the UI. Order and labels live in the pure domain layer
 * so non-UI logic (Today's Focus) reuses them without UI imports.
 */
export const CATEGORY_META: Record<
  ExerciseCategory,
  { label: string; Icon: typeof Dumbbell }
> = {
  strength: { label: CATEGORY_LABELS.strength, Icon: Dumbbell },
  endurance: { label: CATEGORY_LABELS.endurance, Icon: HeartPulse },
  agility: { label: CATEGORY_LABELS.agility, Icon: Zap },
  focus: { label: CATEGORY_LABELS.focus, Icon: Brain },
};

export { CATEGORY_ORDER };
