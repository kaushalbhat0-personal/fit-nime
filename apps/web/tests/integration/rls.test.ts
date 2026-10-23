import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { calculateEntryXp } from "@/features/gamification/domain/xp";

/**
 * RLS + provisioning verification. Runs ONLY against a throwaway stack:
 *
 *   $env:SUPABASE_TEST_URL = "http://127.0.0.1:54321"
 *   $env:SUPABASE_TEST_ANON_KEY = "<local anon key>"
 *   pnpm --dir apps/web exec vitest run tests/integration
 *
 * Never point this at the shared/remote project: it creates auth users
 * that cannot be removed with the anon key.
 */

const TEST_URL = process.env.SUPABASE_TEST_URL;
const TEST_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY;
const hasEnv = Boolean(TEST_URL && TEST_ANON_KEY);

const PASSWORD = "test-password-123";
const stamp = Date.now();
const emailA = `rls-a-${stamp}@example.com`;
const emailB = `rls-b-${stamp}@example.com`;

function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(TEST_URL!, TEST_ANON_KEY!);
}

describe.skipIf(!hasEnv)("rls + provisioning", () => {
  let a: SupabaseClient<Database>;
  let b: SupabaseClient<Database>;
  let userAId = "";
  let userBId = "";
  let sessionAId = "";
  let exerciseId = "";

  beforeAll(async () => {
    a = anonClient();
    b = anonClient();

    const { data: signUpA, error: errA } = await a.auth.signUp({
      email: emailA,
      password: PASSWORD,
    });
    expect(errA).toBeNull();
    expect(signUpA.session).not.toBeNull();
    userAId = signUpA.user!.id;

    const { data: signUpB, error: errB } = await b.auth.signUp({
      email: emailB,
      password: PASSWORD,
    });
    expect(errB).toBeNull();
    expect(signUpB.session).not.toBeNull();
    userBId = signUpB.user!.id;
    expect(userBId).not.toBe(userAId);
  });

  it("provisions profile, stats, and character rows for each user", async () => {
    for (const [client] of [[a], [b]] as const) {
      const { data: profile, error } = await client
        .from("profiles")
        .select("id");
      expect(error).toBeNull();
      expect(profile).toHaveLength(1);
    }

    const { data: stats } = await a.from("player_stats").select("*");
    expect(stats).toHaveLength(1);
    expect(stats![0]).toMatchObject({
      strength_xp: 0,
      endurance_xp: 0,
      agility_xp: 0,
      focus_xp: 0,
    });

    const { data: character } = await a.from("character_state").select("*");
    expect(character).toHaveLength(1);
    expect(character![0]).toMatchObject({ level: 1, stage: 1 });
  });

  it("exposes the 12 seeded exercises to authenticated users", async () => {
    const { data, error } = await a.from("exercises").select("*");
    expect(error).toBeNull();
    expect(data).toHaveLength(12);
    const categories = new Set(data!.map((e) => e.category));
    expect(categories).toEqual(
      new Set(["strength", "endurance", "agility", "focus"]),
    );
    exerciseId = data![0].id;
  });

  it("lets a user create and read their own session + entries", async () => {
    const { data: session, error: sessionError } = await a
      .from("workout_sessions")
      .insert({ user_id: userAId })
      .select("id")
      .single();
    expect(sessionError).toBeNull();
    sessionAId = session!.id;

    const { error: entryError } = await a.from("workout_entries").insert({
      session_id: sessionAId,
      exercise_id: exerciseId,
      quantity: 10,
    });
    expect(entryError).toBeNull();

    const { data: entries } = await a
      .from("workout_entries")
      .select("id")
      .eq("session_id", sessionAId);
    expect(entries).toHaveLength(1);
  });

  it("isolates user B from user A's rows", async () => {
    // Profiles
    const { data: profiles } = await b.from("profiles").select("id");
    expect(profiles!.map((p) => p.id)).not.toContain(userAId);

    // Sessions + entries
    const { data: sessions } = await b.from("workout_sessions").select("id");
    expect(sessions).toHaveLength(0);

    const { data: entries } = await b
      .from("workout_entries")
      .select("id")
      .eq("session_id", sessionAId);
    expect(entries).toHaveLength(0);

    // Progression reads
    for (const table of [
      "player_stats",
      "xp_events",
      "character_state",
    ] as const) {
      const { data } = await b.from(table).select("*");
      expect(data).toHaveLength(0);
    }
  });

  it("rejects writes into another user's session", async () => {
    const { error } = await b.from("workout_entries").insert({
      session_id: sessionAId,
      exercise_id: exerciseId,
      quantity: 5,
    });
    expect(error).not.toBeNull();
  });

  it("rejects updates and deletes on another user's session", async () => {
    const { data: updated } = await b
      .from("workout_sessions")
      .update({ notes: "hijacked" })
      .eq("id", sessionAId)
      .select("id");
    expect(updated).toHaveLength(0);

    const { data: deleted } = await b
      .from("workout_sessions")
      .delete()
      .eq("id", sessionAId)
      .select("id");
    expect(deleted).toHaveLength(0);

    // A's session is untouched.
    const { data: stillThere } = await a
      .from("workout_sessions")
      .select("id")
      .eq("id", sessionAId);
    expect(stillThere).toHaveLength(1);
  });

  it("rejects all client writes to progression tables", async () => {
    const { error: xpError } = await a.from("xp_events").insert({
      user_id: userAId,
      source: "cheat",
      amount: 9999,
    });
    expect(xpError).not.toBeNull();

    const { data: statsData } = await a
      .from("player_stats")
      .update({ strength_xp: 9999 })
      .eq("user_id", userAId)
      .select();
    expect(statsData).toHaveLength(0);

    const { data: charData } = await a
      .from("character_state")
      .update({ level: 99, stage: 5 })
      .eq("user_id", userAId)
      .select();
    expect(charData).toHaveLength(0);

    // Values unchanged.
    const { data: stats } = await a
      .from("player_stats")
      .select("strength_xp")
      .single();
    expect(stats!.strength_xp).toBe(0);
  });

  it("awards XP exactly once per workout via award_workout_xp", async () => {
    // Oracle: the pure TS domain. SQL must agree with it exactly.
    const { data: exercise } = await a
      .from("exercises")
      .select("category, unit")
      .eq("id", exerciseId)
      .single();
    const expected = calculateEntryXp(10, exercise!.unit);

    const first = await a.rpc("award_workout_xp", {
      p_session_id: sessionAId,
    });
    expect(first.error).toBeNull();
    expect(first.data).toBe(expected);

    const { data: stats } = await a
      .from("player_stats")
      .select("strength_xp, endurance_xp, agility_xp, focus_xp")
      .single();
    const column = `${exercise!.category}_xp` as keyof typeof stats;
    expect(stats![column]).toBe(expected);

    const { data: events } = await a
      .from("xp_events")
      .select("source, amount, metadata");
    expect(events).toHaveLength(1);
    expect(events![0]).toMatchObject({ source: "workout", amount: expected });
    expect(
      (events![0].metadata as Record<string, unknown>)["workout_session_id"],
    ).toBe(sessionAId);

    // Re-awards return 0 and change nothing.
    for (let i = 0; i < 2; i++) {
      const again = await a.rpc("award_workout_xp", {
        p_session_id: sessionAId,
      });
      expect(again.error).toBeNull();
      expect(again.data).toBe(0);
    }
    const { data: statsAfter } = await a
      .from("player_stats")
      .select("strength_xp, endurance_xp, agility_xp, focus_xp")
      .single();
    expect(statsAfter).toEqual(stats);
    const { data: eventsAfter } = await a.from("xp_events").select("id");
    expect(eventsAfter).toHaveLength(1);

    // No character evolution happens as a side effect.
    const { data: character } = await a
      .from("character_state")
      .select("level, stage")
      .single();
    expect(character).toMatchObject({ level: 1, stage: 1 });
  });

  it("rejects cross-user, anonymous, and bogus award calls", async () => {
    const cross = await b.rpc("award_workout_xp", {
      p_session_id: sessionAId,
    });
    expect(cross.error).not.toBeNull();

    const anon = anonClient();
    const anonCall = await anon.rpc("award_workout_xp", {
      p_session_id: sessionAId,
    });
    expect(anonCall.error).not.toBeNull();

    const bogus = await a.rpc("award_workout_xp", {
      p_session_id: "00000000-0000-4000-8000-000000000000",
    });
    expect(bogus.error).not.toBeNull();

    // Nobody's stats moved.
    const { data: events } = await a.from("xp_events").select("id");
    expect(events).toHaveLength(1);
  });
});
