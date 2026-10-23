import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/user";
import {
  calculateLevel,
  calculateTotalXp,
} from "@/features/gamification/domain/level";
import { CATEGORY_META } from "@/features/workouts/components/categories";

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

  const owned = stats ?? EMPTY_STATS;
  const totalXp = calculateTotalXp(owned);
  const level = calculateLevel(totalXp);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}!
      </h1>
      <Button asChild size="lg" className="w-full">
        <Link href="/log">Log a workout</Link>
      </Button>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold">
          Level {level} · {totalXp} total XP
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
