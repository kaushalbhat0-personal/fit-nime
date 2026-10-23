import type { ExerciseUnit } from "@/lib/supabase/database.types";

/**
 * Presentation of a logged quantity, driven by the exercise's unit from
 * the database. No per-exercise conditionals anywhere else: components
 * call this instead of branching on slugs.
 *
 * Pure: no React, no Next.js, no Supabase, no browser APIs.
 */

const UNIT_LABELS: Record<ExerciseUnit, { one: string; many: string }> = {
  reps: { one: "rep", many: "reps" },
  seconds: { one: "second", many: "seconds" },
  minutes: { one: "minute", many: "minutes" },
  kilometers: { one: "kilometer", many: "kilometers" },
};

export function formatQuantity(quantity: number, unit: ExerciseUnit): string {
  const labels = UNIT_LABELS[unit];
  return `${String(quantity)} ${quantity === 1 ? labels.one : labels.many}`;
}

/** Short unit hint shown next to quantity inputs, e.g. "reps". */
export function unitHint(unit: ExerciseUnit): string {
  return UNIT_LABELS[unit].many;
}
