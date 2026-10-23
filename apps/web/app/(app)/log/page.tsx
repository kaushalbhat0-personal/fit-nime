import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CompanionFigure } from "@/components/companion";
import { parseFocusIdsParam } from "@/features/workouts/domain/focus";
import {
  LogWorkoutForm,
  type LoggableExercise,
} from "@/features/workouts/components/log-workout-form";
import { RecentWorkouts } from "@/features/workouts/components/recent-workouts";

export const metadata: Metadata = {
  title: "Log workout",
};

/**
 * Workout logging entry point (authenticated: see the (app) layout).
 * Orchestrates only: loads the active exercise catalog for the form and
 * renders the form + recent history. Mutations live in the server action.
 *
 * Optional `?focus=<id>,…` (from Today's Focus) highlights that suggestion
 * at the top of the form. Ids are validated against the active catalog
 * here and re-validated authoritatively on submit — the URL is a hint,
 * never a trust boundary.
 */
export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string | string[] }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, description, category, unit, default_value")
    .eq("is_active", true)
    .order("name");

  if (error || !data) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Log workout</h1>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Could not load exercises. Check your connection and reload the page.
        </p>
      </main>
    );
  }

  const exercises: LoggableExercise[] = data;
  const { focus } = await searchParams;
  const focusIds = parseFocusIdsParam(
    focus,
    exercises.map((e) => e.id),
  );

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <Dumbbell aria-hidden="true" className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">Log workout</h1>
      </header>

      {exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center shadow-sm">
          <CompanionFigure size={72} />
          <p className="mt-2 text-sm text-zinc-600">
            No exercises are available right now. Your companion will be here
            when they return — check back soon.
          </p>
        </div>
      ) : (
        <LogWorkoutForm exercises={exercises} focusIds={focusIds} />
      )}

      <RecentWorkouts />
    </main>
  );
}
