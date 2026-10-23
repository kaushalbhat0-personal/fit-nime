"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/user";
import { parseEventByStat } from "@/features/gamification/domain/events";
import {
  calculateLevel,
  calculateLevelProgress,
  calculateTotalXp,
} from "@/features/gamification/domain/level";
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
 * session → bulk-insert entries (one statement, no N+1) → award XP via
 * the authoritative database function → revalidate.
 * If the entries insert fails, the new session is removed again so a
 * workout never persists half-written. If the XP award fails, the saved
 * workout is kept (user data outranks vanity metrics) and the result
 * honestly reports no XP. Raw database errors never reach the client.
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

  // Authoritative award: the database function re-checks ownership,
  // recomputes XP from trusted tables, and awards each session at most
  // once — the client-supplied quantities are never trusted for amounts.
  const { data: xpTotal, error: xpError } = await supabase.rpc(
    "award_workout_xp",
    { p_session_id: session.id },
  );

  revalidatePath("/log");
  revalidatePath("/dashboard");

  if (xpError || typeof xpTotal !== "number") {
    return { ok: true, loggedCount: entries.length, xp: null };
  }

  // Cumulative context for the completion peak. Both reads are own-row,
  // RLS-scoped; byStat comes from the authoritative event metadata, never
  // recomputed locally. Any read failure degrades to XP-total-only UI.
  const { data: statsRow } = await supabase
    .from("player_stats")
    .select("strength_xp, endurance_xp, agility_xp, focus_xp")
    .eq("user_id", user.id)
    .single();
  const { data: eventRow } = await supabase
    .from("xp_events")
    .select("metadata")
    .eq("user_id", user.id)
    .filter("metadata->>workout_session_id", "eq", session.id)
    .single();

  const cumulative = statsRow ? calculateTotalXp(statsRow) : null;
  const level = cumulative === null ? null : calculateLevel(cumulative);
  const progress =
    cumulative === null ? null : calculateLevelProgress(cumulative);
  return {
    ok: true,
    loggedCount: entries.length,
    xp: {
      total: xpTotal,
      byStat: parseEventByStat(eventRow?.metadata ?? null),
      cumulativeTotal: cumulative,
      level,
      leveledUp:
        level !== null && cumulative !== null
          ? level > calculateLevel(cumulative - xpTotal)
          : false,
      progress: progress?.progress ?? null,
      nextLevelAt: progress?.nextLevelAt ?? null,
      intoLevel: progress?.intoLevel ?? null,
    },
  };
}
