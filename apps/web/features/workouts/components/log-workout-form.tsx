"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CompanionFigure,
  companionLineFor,
  pickCelebrationVariant,
} from "@/components/companion";
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
    const variant = pickCelebrationVariant({
      leveledUp: state.xp?.leveledUp ?? false,
      totalXp: state.xp?.total ?? null,
    });
    const statLines =
      state.xp?.byStat == null
        ? []
        : (Object.entries(state.xp.byStat) as [ExerciseCategory, number][])
            .filter(([, amount]) => amount > 0)
            .map(
              ([category, amount]) =>
                `${CATEGORY_META[category].label} +${amount}`,
            );
    const remaining =
      state.xp?.nextLevelAt != null && state.xp?.cumulativeTotal != null
        ? state.xp.nextLevelAt - state.xp.cumulativeTotal
        : null;
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm"
      >
        {state.xp?.leveledUp ? (
          <p className="flex items-center gap-2 text-base font-bold text-emerald-950">
            <PartyPopper
              aria-hidden="true"
              className="size-5 motion-safe:animate-pulse"
            />
            LEVEL UP! You reached level {state.xp.level}.
          </p>
        ) : (
          <p className="text-sm font-bold text-emerald-950">
            Workout complete — nice work!
          </p>
        )}
        <div className="mt-1 flex flex-col items-center text-center">
          <CompanionFigure variant={variant} size={128} />
          <p className="mt-1 text-xs font-medium text-emerald-800">
            {companionLineFor(variant)}
          </p>
        </div>
        {state.xp != null ? (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-emerald-900">
              <Sparkles aria-hidden="true" className="size-5" />+
              {state.xp.total} XP
            </p>
            {statLines.length > 0 ? (
              <ul className="mt-1 text-sm font-medium text-emerald-900">
                {statLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            {state.xp.level != null && state.xp.progress != null ? (
              <div className="mt-3">
                <div className="flex items-baseline justify-between text-xs font-medium text-emerald-900">
                  <span>Level {state.xp.level}</span>
                  {remaining != null && remaining > 0 ? (
                    <span>
                      {remaining} XP to level {state.xp.level + 1}
                    </span>
                  ) : (
                    <span>Level {state.xp.level}</span>
                  )}
                </div>
                <div
                  role="progressbar"
                  aria-label={`Level ${state.xp.level} progress`}
                  aria-valuenow={Math.round(state.xp.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100"
                >
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${state.xp.progress * 100}%` }}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-sm text-emerald-900">
            {state.loggedCount}{" "}
            {state.loggedCount === 1 ? "exercise" : "exercises"} saved. XP could
            not be awarded this time — your workout is still saved.
          </p>
        )}
        {state.xp != null ? (
          <p className="mt-1 text-xs text-emerald-800">
            {state.loggedCount}{" "}
            {state.loggedCount === 1 ? "exercise" : "exercises"} saved.
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href="/dashboard">View progress</Link>
          </Button>
          <Button asChild size="sm" variant="secondary" className="flex-1">
            <Link href="/log">Log another</Link>
          </Button>
        </div>
      </div>
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
      <div className="sticky bottom-4 z-10 rounded-full bg-[#fafaf8]/95 pb-[env(safe-area-inset-bottom)] shadow-sm">
        <SubmitButton exerciseCount={exercises.length} />
      </div>
    </form>
  );
}
