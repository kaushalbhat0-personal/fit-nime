import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/user";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Authenticated entry point. Deliberately a placeholder: workout logging
 * and gamification arrive in later phases. The profile read below proves
 * the signup trigger + RLS read path work end to end.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}!
      </h1>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold">Level 1 · Stage 1</p>
        <p className="mt-1 text-xs text-zinc-500">
          Workout logging, XP, and your evolving avatar arrive in the next
          phases.
        </p>
      </div>
    </main>
  );
}
