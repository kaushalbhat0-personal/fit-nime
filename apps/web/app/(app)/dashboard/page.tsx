import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CompanionFigure } from "@/components/companion";
import { getCurrentUser } from "@/features/auth/user";
import {
  calculateLevelProgress,
  calculateTotalXp,
} from "@/features/gamification/domain/level";
import { CATEGORY_META } from "@/features/workouts/components/categories";
import { FocusCard } from "@/features/workouts/components/focus-card";
import type { LoggableExercise } from "@/features/workouts/components/log-workout-form";
import { selectTodaysFocus } from "@/features/workouts/domain/focus";

export const metadata: Metadata = {
  title: "Dashboard",
};

const EMPTY_STATS = {
  strength_xp: 0,
  endurance_xp: 0,
  agility_xp: 0,
  focus_xp: 0,
} as const;

/**
 * Authenticated entry point. Shows derived progression (total XP, level,
 * per-stat XP) read from player_stats — the dashboard never writes
 * progression and never computes authoritative XP itself.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user?.id ?? "")
    .single();
  const { data: stats } = await supabase
    .from("player_stats")
    .select("strength_xp, endurance_xp, agility_xp, focus_xp")
    .eq("user_id", user?.id ?? "")
    .single();
  const { data: catalog } = await supabase
    .from("exercises")
    .select("id, name, description, category, unit, default_value")
    .eq("is_active", true);

  const owned = stats ?? EMPTY_STATS;
  const progress = calculateLevelProgress(calculateTotalXp(owned));
  const focus: LoggableExercise[] = selectTodaysFocus(
    catalog ?? [],
    new Date(),
  );

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}!
      </h1>
      <section
        aria-label="Training companion"
        className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <CompanionFigure size={72} className="mx-0 shrink-0" />
        <div>
          <p className="text-sm font-bold">Ready when you are.</p>
          <p className="mt-0.5 text-xs leading-5 text-zinc-600">
            Your companion warmed up. Today&apos;s focus is below — start small,
            finish proud.
          </p>
        </div>
      </section>
      <FocusCard exercises={focus} />
      <Button asChild size="lg" className="w-full">
        <Link href="/log">Log a workout</Link>
      </Button>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold">
          Level {progress.level} · {progress.totalXp} total XP
        </p>
        <div
          role="progressbar"
          aria-label={`Level ${progress.level} progress`}
          aria-valuenow={Math.round(progress.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mx-auto mt-2 h-2 max-w-56 overflow-hidden rounded-full bg-zinc-100"
        >
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${progress.progress * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {progress.nextLevelAt - progress.totalXp} XP to level{" "}
          {progress.level + 1}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-left">
          {(
            Object.entries(CATEGORY_META) as [
              keyof typeof CATEGORY_META,
              (typeof CATEGORY_META)[keyof typeof CATEGORY_META],
            ][]
          ).map(([category, { label, Icon }]) => (
            <li key={category} className="flex items-center gap-2 text-sm">
              <Icon aria-hidden="true" className="size-4 text-zinc-400" />
              <span className="font-medium">{label}</span>
              <span className="ml-auto text-zinc-600">
                {owned[`${category}_xp` as keyof typeof owned]} XP
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
