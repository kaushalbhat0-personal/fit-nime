import { z } from "zod";

/**
 * Workout logging input contracts. The log form posts plain FormData; the
 * server action parses it here and re-validates authoritatively. Client-side
 * checks (if any) are UX only — this module is the source of truth.
 *
 * Pure: no React, no Next.js, no Supabase. Only the exercise *shape*
 * (uuid) is checked here; existence/activity is verified against the
 * database in the server action, which owns that I/O.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Database CHECK is quantity > 0; the cap rejects absurd submissions. */
export const MAX_QUANTITY = 100_000;

/** One exercise performed in a session. */
export const workoutEntrySchema = z.object({
  exerciseId: z
    .string()
    .regex(UUID_RE, "Select a valid exercise.")
    .transform((s) => s.toLowerCase()),
  quantity: z
    .number({ invalid_type_error: "Enter a quantity." })
    .finite("Enter a valid quantity.")
    .positive("Quantity must be more than zero.")
    .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}.`),
});

/** Notes live on the session row (varchar-less text, capped for sanity). */
export const sessionNotesSchema = z
  .string()
  .trim()
  .max(500, "Notes must be at most 500 characters.");

const logWorkoutPayloadSchema = z.object({
  entries: z
    .array(workoutEntrySchema)
    .min(1, "Add at least one exercise to log a workout.")
    // Bounded by the catalog in practice; the cap stops hostile payloads.
    .max(50, "Too many entries in one workout.")
    .refine(
      (entries) =>
        new Set(entries.map((e) => e.exerciseId)).size === entries.length,
      "Each exercise can appear only once per workout.",
    ),
  notes: sessionNotesSchema,
});

export type WorkoutEntryInput = z.infer<typeof workoutEntrySchema>;
export type LogWorkoutInput = z.infer<typeof logWorkoutPayloadSchema>;

/**
 * Parse the log form's FormData into a validatable payload.
 *
 * Field convention: `qty_<exercise-uuid>` → quantity text. Blank inputs
 * mean "not performed" and are skipped. Anything not matching the
 * convention is ignored (never trusted, never echoed back).
 */
export function parseLogWorkoutFormData(formData: FormData): {
  entries: { exerciseId: string; quantity: unknown }[];
  notes: string;
} {
  const entries: { exerciseId: string; quantity: unknown }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_") || typeof value !== "string") {
      continue;
    }
    const exerciseId = key.slice("qty_".length);
    const raw = value.trim();
    if (raw === "") {
      continue;
    }
    const quantity = Number(raw);
    entries.push({ exerciseId, quantity });
  }

  const notesValue = formData.get("notes");
  return {
    entries,
    notes: typeof notesValue === "string" ? notesValue : "",
  };
}

/** Validate a parsed payload. Returns data or safe, displayable errors. */
export function validateLogWorkoutInput(raw: {
  entries: { exerciseId: string; quantity: unknown }[];
  notes: string;
}):
  | { success: true; data: LogWorkoutInput }
  | {
      success: false;
      errors: Record<string, string[] | undefined>;
      message: string;
    } {
  const parsed = logWorkoutPayloadSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const flat = parsed.error.flatten();
  return {
    success: false,
    errors: flat.fieldErrors,
    message:
      flat.formErrors[0] ??
      flat.fieldErrors.entries?.[0] ??
      "Some entries are invalid. Check the quantities and try again.",
  };
}

export type LogWorkoutState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  ok?: boolean;
  loggedCount?: number;
  /**
   * Authoritative award result. Present (possibly null) only on success:
   * null means the workout saved but XP could not be awarded — the UI
   * must not claim XP in that case. `total` always comes from the award
   * RPC; cumulative fields are re-read from player_stats (null when that
   * read fails — the UI must hide level context rather than guess it).
   */
  xp?: {
    total: number;
    byStat: Record<string, number> | null;
    cumulativeTotal: number | null;
    level: number | null;
    leveledUp: boolean;
    progress: number | null;
    nextLevelAt: number | null;
    intoLevel: number | null;
  } | null;
};
