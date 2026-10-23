import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
 */
export default async function LogPage() {
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

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <Dumbbell aria-hidden="true" className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">Log workout</h1>
      </header>

      {exercises.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
          No exercises are available right now. Check back soon.
        </p>
      ) : (
        <LogWorkoutForm exercises={exercises} />
      )}

      <RecentWorkouts />
    </main>
  );
}
