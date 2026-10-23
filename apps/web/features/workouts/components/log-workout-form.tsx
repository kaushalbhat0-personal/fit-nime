"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logWorkout, type LogWorkoutState } from "@/features/workouts/actions";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
} from "@/features/workouts/components/categories";
import { unitHint } from "@/features/workouts/domain/format";
import type {
  ExerciseCategory,
  ExerciseUnit,
} from "@/lib/supabase/database.types";

export type LoggableExercise = {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  default_value: number;
};

const initialState: LogWorkoutState = {};

function SubmitButton({ exerciseCount }: { exerciseCount: number }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="min-h-12 w-full"
      disabled={pending || exerciseCount === 0}
    >
      {pending ? "Saving workout…" : "Log workout"}
    </Button>
  );
}

function FormFeedback({ state }: { state: LogWorkoutState }) {
  const fieldMessages = state.errors
    ? [...new Set(Object.values(state.errors).flat().filter(Boolean))]
    : [];
  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
      >
        Workout logged — {state.loggedCount}{" "}
        {state.loggedCount === 1 ? "exercise" : "exercises"} saved.
      </p>
    );
  }
  if (!state.message && fieldMessages.length === 0) {
    return null;
  }
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {state.message ? <p className="font-medium">{state.message}</p> : null}
      {fieldMessages.length > 0 ? (
        <ul className="mt-1 list-disc pl-5">
          {fieldMessages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function LogWorkoutForm({
  exercises,
}: {
  exercises: LoggableExercise[];
}) {
  const [state, formAction] = useActionState(logWorkout, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const lastLogged = useRef(0);

  // Clear inputs after a successful save so a refresh can't resubmit
  // the same workout and the next workout starts empty.
  useEffect(() => {
    if (state.ok && state.loggedCount !== lastLogged.current) {
      lastLogged.current = state.loggedCount ?? 0;
      formRef.current?.reset();
    }
  }, [state]);

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: exercises.filter((e) => e.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {groups.map(({ category, items }) => {
        const { label, Icon } = CATEGORY_META[category];
        return (
          <fieldset
            key={category}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold">
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </legend>
            <div className="flex flex-col gap-3">
              {items.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Quantity in {unitHint(exercise.unit)} · e.g.{" "}
                      {exercise.default_value}
                    </p>
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    name={`qty_${exercise.id}`}
                    placeholder={String(exercise.default_value)}
                    aria-label={`${exercise.name} quantity in ${unitHint(exercise.unit)}`}
                    className="h-12 w-28 shrink-0 text-base"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        );
      })}

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Session notes{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Input
          id="notes"
          name="notes"
          type="text"
          maxLength={500}
          placeholder="How did it feel?"
          autoComplete="off"
        />
      </div>

      <FormFeedback state={state} />
      <SubmitButton exerciseCount={exercises.length} />
    </form>
  );
}
