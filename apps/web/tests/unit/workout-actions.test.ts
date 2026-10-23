import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/features/auth/user";
import { createClient } from "@/lib/supabase/server";
import { logWorkout } from "@/features/workouts/actions";

vi.mock("@/features/auth/user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockedUser = vi.mocked(getCurrentUser);
const mockedClient = vi.mocked(createClient);

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const EX_A = "11111111-1111-4111-8111-111111111111";
const EX_B = "22222222-2222-4222-8222-222222222222";
const SESSION_ID = "33333333-3333-4333-8333-333333333333";

type Call = { op: string; table: string; args: unknown[] };

/**
 * Thenable query-builder stub. Every method records its call and returns
 * the same proxy (chainable); awaiting resolves from the recorded ops,
 * like PostgREST would for each statement.
 */
function makeDb(scenario: {
  catalog: { id: string; category?: string; unit?: string }[];
  session?: { id: string } | null;
  sessionError?: { message: string } | null;
  entriesError?: { message: string } | null;
  rpcTotal?: number | null;
  rpcError?: { message: string } | null;
  statsRow?: {
    strength_xp: number;
    endurance_xp: number;
    agility_xp: number;
    focus_xp: number;
  } | null;
  statsError?: { message: string } | null;
  eventRow?: { metadata: unknown } | null;
  eventError?: { message: string } | null;
}) {
  const calls: Call[] = [];
  let table = "";
  let statement: string[] = [];

  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => {
            const head = statement[0];
            if (table === "exercises") {
              return resolve({ data: scenario.catalog, error: null });
            }
            if (head === "insert" && table === "workout_sessions") {
              return resolve({
                data: scenario.session ?? null,
                error: scenario.sessionError ?? null,
              });
            }
            if (head === "insert") {
              return resolve({
                data: [],
                error: scenario.entriesError ?? null,
              });
            }
            if (head === "delete") {
              return resolve({ data: [], error: null });
            }
            if (head === "select" && table === "player_stats") {
              return resolve({
                data: scenario.statsRow ?? null,
                error: scenario.statsError ?? null,
              });
            }
            if (head === "select" && table === "xp_events") {
              return resolve({
                data: scenario.eventRow ?? null,
                error: scenario.eventError ?? null,
              });
            }
            return resolve({ data: null, error: null });
          };
        }
        return (...args: unknown[]) => {
          calls.push({ op: String(prop), table, args });
          statement.push(String(prop));
          return proxy;
        };
      },
    },
  );

  return {
    calls,
    from(t: string) {
      table = t;
      // The action awaits each statement before starting the next, so a
      // per-statement op list resolves unambiguously (calls keeps history).
      statement = [];
      return proxy;
    },
    rpc(fn: string, args: unknown) {
      calls.push({ op: `rpc:${fn}`, table: "rpc", args: [args] });
      return Promise.resolve({
        data: scenario.rpcTotal ?? null,
        error: scenario.rpcError ?? null,
      });
    },
  };
}

function form(pairs: [string, string][]): FormData {
  const fd = new FormData();
  for (const [k, v] of pairs) {
    fd.append(k, v);
  }
  return fd;
}

describe("logWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUser.mockResolvedValue({ id: USER_ID, email: "ash@example.com" });
  });

  it("persists a session plus one bulk entries insert for the session user", async () => {
    const db = makeDb({
      catalog: [
        { id: EX_A, category: "strength", unit: "reps" },
        { id: EX_B, category: "endurance", unit: "kilometers" },
      ],
      session: { id: SESSION_ID },
      rpcTotal: 45,
      statsRow: {
        strength_xp: 20,
        endurance_xp: 25,
        agility_xp: 0,
        focus_xp: 0,
      },
      eventRow: {
        metadata: {
          workout_session_id: SESSION_ID,
          by_stat: { strength: 20, endurance: 25, agility: 0, focus: 0 },
        },
      },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout(
      {},
      form([
        [`qty_${EX_A}`, "20"],
        [`qty_${EX_B}`, "2.5"],
      ]),
    );

    expect(state).toEqual({
      ok: true,
      loggedCount: 2,
      xp: {
        total: 45,
        byStat: { strength: 20, endurance: 25, agility: 0, focus: 0 },
        cumulativeTotal: 45,
        level: 1,
        leveledUp: false,
        progress: 0.45,
        nextLevelAt: 100,
        intoLevel: 45,
      },
    });
    const sessionInsert = db.calls.find(
      (c) => c.op === "insert" && c.table === "workout_sessions",
    );
    expect(sessionInsert?.args[0]).toMatchObject({ user_id: USER_ID });
    const entriesInsert = db.calls.find(
      (c) => c.op === "insert" && c.table === "workout_entries",
    );
    const rows = (entriesInsert?.args[0] ?? []) as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      session_id: SESSION_ID,
      exercise_id: EX_A,
      quantity: 20,
    });
  });

  it("rejects unauthenticated callers before touching the database", async () => {
    mockedUser.mockResolvedValue(null);
    const db = makeDb({ catalog: [{ id: EX_A }] });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "10"]]));

    expect(state.message).toMatch(/sign in/i);
    expect(db.calls).toHaveLength(0);
  });

  it("rejects unknown exercise ids without writing anything", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A }],
      session: { id: SESSION_ID },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_B}`, "10"]]));

    expect(state.message).toMatch(/no longer available/);
    expect(
      db.calls.filter(
        (c) => c.op === "insert" && c.table === "workout_sessions",
      ),
    ).toHaveLength(0);
  });

  it("keeps the saved workout but reports no XP when the award fails", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A, category: "strength", unit: "reps" }],
      session: { id: SESSION_ID },
      rpcError: { message: "boom" },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "10"]]));

    // Workout data outranks vanity metrics: entries stay, XP is honestly null.
    expect(state).toEqual({ ok: true, loggedCount: 1, xp: null });
  });

  it("awards nothing when the function reports a re-award", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A, category: "strength", unit: "reps" }],
      session: { id: SESSION_ID },
      rpcTotal: 0,
      statsRow: {
        strength_xp: 10,
        endurance_xp: 0,
        agility_xp: 0,
        focus_xp: 0,
      },
      eventRow: {
        metadata: {
          workout_session_id: SESSION_ID,
          by_stat: { strength: 10, endurance: 0, agility: 0, focus: 0 },
        },
      },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "10"]]));

    expect(state).toEqual({
      ok: true,
      loggedCount: 1,
      xp: {
        total: 0,
        byStat: { strength: 10, endurance: 0, agility: 0, focus: 0 },
        cumulativeTotal: 10,
        level: 1,
        leveledUp: false,
        progress: 0.1,
        nextLevelAt: 100,
        intoLevel: 10,
      },
    });
  });

  it("detects a level-up from trusted cumulative XP", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A, category: "strength", unit: "reps" }],
      session: { id: SESSION_ID },
      rpcTotal: 20,
      statsRow: {
        strength_xp: 110,
        endurance_xp: 0,
        agility_xp: 0,
        focus_xp: 0,
      },
      eventRow: {
        metadata: {
          workout_session_id: SESSION_ID,
          by_stat: { strength: 20, endurance: 0, agility: 0, focus: 0 },
        },
      },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "20"]]));

    // Prior total was 90 (level 1); 110 is level 2.
    expect(state.xp).toMatchObject({
      total: 20,
      cumulativeTotal: 110,
      level: 2,
      leveledUp: true,
      nextLevelAt: 400,
      intoLevel: 10,
    });
  });

  it("shows XP total without level context when the stats read fails", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A, category: "strength", unit: "reps" }],
      session: { id: SESSION_ID },
      rpcTotal: 10,
      statsError: { message: "boom" },
      eventRow: {
        metadata: {
          workout_session_id: SESSION_ID,
          by_stat: { strength: 10, endurance: 0, agility: 0, focus: 0 },
        },
      },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "10"]]));

    // Never fabricate level context: totals stay, level fields are null.
    expect(state).toEqual({
      ok: true,
      loggedCount: 1,
      xp: {
        total: 10,
        byStat: { strength: 10, endurance: 0, agility: 0, focus: 0 },
        cumulativeTotal: null,
        level: null,
        leveledUp: false,
        progress: null,
        nextLevelAt: null,
        intoLevel: null,
      },
    });
  });

  it("shows XP total without stat lines when the event read fails", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A, category: "strength", unit: "reps" }],
      session: { id: SESSION_ID },
      rpcTotal: 10,
      statsRow: {
        strength_xp: 10,
        endurance_xp: 0,
        agility_xp: 0,
        focus_xp: 0,
      },
      eventError: { message: "boom" },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "10"]]));

    expect(state.xp).toMatchObject({ total: 10, byStat: null });
  });

  it("removes the new session when the entries insert fails", async () => {
    const db = makeDb({
      catalog: [{ id: EX_A }],
      session: { id: SESSION_ID },
      entriesError: { message: "boom" },
    });
    mockedClient.mockResolvedValue(db as never);

    const state = await logWorkout({}, form([[`qty_${EX_A}`, "10"]]));

    expect(state.message).toMatch(/could not save/i);
    expect(
      db.calls.filter(
        (c) => c.op === "delete" && c.table === "workout_sessions",
      ),
    ).toHaveLength(1);
    const eqArgs = db.calls
      .filter((c) => c.op === "eq" && c.table === "workout_sessions")
      .map((c) => c.args);
    expect(eqArgs).toContainEqual(["id", SESSION_ID]);
    expect(eqArgs).toContainEqual(["user_id", USER_ID]);
  });
});
