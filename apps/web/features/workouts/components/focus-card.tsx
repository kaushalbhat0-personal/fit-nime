"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unitHint } from "@/features/workouts/domain/format";
import type { LoggableExercise } from "@/features/workouts/components/log-workout-form";

/**
 * Today's Focus card. Dismissal lasts for this visit only (plain client
 * state, nothing persisted) — a suggestion, never a prescription.
 */
export function FocusCard({ exercises }: { exercises: LoggableExercise[] }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || exercises.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Today's focus"
      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm"
    >
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
        Today&apos;s Focus
      </p>
      <p className="mt-1 text-xs leading-5 text-zinc-600">
        A small win for today. Start with these {exercises.length} — ready when
        you are.
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="flex items-baseline gap-2">
            <span aria-hidden="true" className="text-amber-500">
              •
            </span>
            <span className="font-medium">{exercise.name}</span>
            <span className="text-xs text-zinc-500">
              {exercise.default_value} {unitHint(exercise.unit)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link href="/log">Start with these</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setDismissed(true)}
        >
          Not today
        </Button>
      </div>
    </section>
  );
}
