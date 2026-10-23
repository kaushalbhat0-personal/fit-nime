"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/user";
import {
  parseLogWorkoutFormData,
  validateLogWorkoutInput,
  type LogWorkoutState,
} from "@/features/workouts/schemas";

export type { LogWorkoutState };

/**
 * Workout mutations. Ownership always derives from the session — the client
 * never supplies a user_id.
 *
 * Order: authenticate → parse → validate → verify exercises → insert
 * session → bulk-insert entries (one statement, no N+1) → revalidate.
 * If the entries insert fails, the new session is removed again so a
 * workout never persists half-written. Raw database errors never reach
 * the client.
 */
export async function logWorkout(
  _prevState: LogWorkoutState,
  formData: FormData,
): Promise<LogWorkoutState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "Sign in to log a workout." };
  }

  const parsed = validateLogWorkoutInput(parseLogWorkoutFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.errors, message: parsed.message };
  }
  const { entries, notes } = parsed.data;

  const supabase = await createClient();

  // The catalog is the source of truth: every submitted id must exist
  // and be active. Unknown ids are rejected here, never sent to the FK.
  const { data: catalog, error: catalogError } = await supabase
    .from("exercises")
    .select("id")
    .eq("is_active", true);
  if (catalogError || !catalog) {
    return { message: "Could not load exercises. Try again." };
  }
  const activeIds = new Set(catalog.map((e) => e.id));
  const unknown = entries.some((e) => !activeIds.has(e.exerciseId));
  if (unknown) {
    return {
      message: "One of the selected exercises is no longer available.",
    };
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({ user_id: user.id, notes })
    .select("id")
    .single();
  if (sessionError || !session) {
    return { message: "Could not save your workout. Try again." };
  }

  const { error: entriesError } = await supabase.from("workout_entries").insert(
    entries.map((e) => ({
      session_id: session.id,
      exercise_id: e.exerciseId,
      quantity: e.quantity,
    })),
  );
  if (entriesError) {
    // Compensating delete: own row only (RLS delete-own also guards this).
    await supabase
      .from("workout_sessions")
      .delete()
      .eq("id", session.id)
      .eq("user_id", user.id);
    return { message: "Could not save your workout. Try again." };
  }

  revalidatePath("/log");
  return { ok: true, loggedCount: entries.length };
}
