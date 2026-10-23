import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "Strength", hint: "Strength exercises" },
  { label: "Endurance", hint: "Cardio" },
  { label: "Agility", hint: "Mobility" },
  { label: "Focus", hint: "Mindfulness" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Fit-Nime · Foundation
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Train. Log. Level up.
        </h1>
        <p className="text-sm leading-6 text-zinc-600">
          A gamified fitness app. Log workouts, earn XP across four stats, and
          watch your anime character grow. Foundation only — workout logging
          arrives in the next phase.
        </p>
      </header>

      <section
        aria-label="Character preview"
        className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100 text-4xl"
        >
          ✦
        </div>
        <p className="text-sm font-semibold">Level 1 · Stage 1</p>
        <p className="mt-1 text-xs text-zinc-500">
          Godot avatar loads here later (lazy, same-origin iframe).
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Total XP progress"
        >
          <div className="h-full w-0 rounded-full bg-amber-400" />
        </div>
      </section>

      <section aria-label="Stats" className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold">{stat.label}</p>
            <p className="text-xs text-zinc-500">{stat.hint}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full">
          <Link href="/log">Log workout</Link>
        </Button>
        <p className="text-center text-xs text-zinc-500">
          Workout logging, XP, and auth arrive in later phases.
        </p>
      </div>
    </main>
  );
}
