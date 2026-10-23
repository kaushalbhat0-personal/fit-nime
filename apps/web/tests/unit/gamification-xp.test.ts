import { describe, expect, it } from "vitest";
import {
  calculateEntryXp,
  calculateWorkoutXp,
  MAX_ENTRY_XP,
  MIN_ENTRY_XP,
  statColumnFor,
  XP_PER_UNIT,
} from "@/features/gamification/domain/xp";

describe("XP_PER_UNIT", () => {
  it("defines exactly the four proposed unit values", () => {
    expect(XP_PER_UNIT).toEqual({
      reps: 1,
      seconds: 1,
      minutes: 2,
      kilometers: 10,
    });
  });
});

describe("calculateEntryXp", () => {
  it.each([
    ["reps", 20, 20],
    ["seconds", 60, 60],
    ["minutes", 20, 40],
    ["kilometers", 2, 20],
  ] as const)("computes %s × %s = %s XP", (unit, quantity, expected) => {
    expect(calculateEntryXp(quantity, unit)).toBe(expected);
  });

  it("keeps fractional quantities (2.5 km → 25 XP)", () => {
    expect(calculateEntryXp(2.5, "kilometers")).toBe(25);
    expect(calculateEntryXp(1.5, "reps")).toBe(2);
  });

  it(`floors tiny quantities at ${MIN_ENTRY_XP} XP`, () => {
    expect(calculateEntryXp(0.1, "reps")).toBe(1);
    expect(calculateEntryXp(0.4, "seconds")).toBe(1);
  });

  it(`caps huge quantities at ${MAX_ENTRY_XP} XP`, () => {
    expect(calculateEntryXp(100_000, "reps")).toBe(500);
    expect(calculateEntryXp(1000, "minutes")).toBe(500);
  });

  it("rounds half up (matches PostgreSQL round on non-negatives)", () => {
    expect(calculateEntryXp(0.5, "reps")).toBe(1);
    expect(calculateEntryXp(2.5, "seconds")).toBe(3);
    expect(calculateEntryXp(99.9, "reps")).toBe(100);
    expect(calculateEntryXp(499.5, "reps")).toBe(500);
    expect(calculateEntryXp(500.4, "reps")).toBe(500);
    // 501 raw would clamp back to the cap.
    expect(calculateEntryXp(501, "reps")).toBe(500);
  });

  it("is deterministic across repeats", () => {
    const first = calculateEntryXp(37.5, "minutes");
    expect([1, 2, 3].map(() => calculateEntryXp(37.5, "minutes"))).toEqual([
      first,
      first,
      first,
    ]);
  });
});

describe("calculateWorkoutXp", () => {
  it("sums a single entry", () => {
    expect(
      calculateWorkoutXp([
        { category: "strength", quantity: 20, unit: "reps" },
      ]),
    ).toEqual({
      totalXp: 20,
      byStat: { strength: 20, endurance: 0, agility: 0, focus: 0 },
    });
  });

  it("splits multiple categories", () => {
    expect(
      calculateWorkoutXp([
        { category: "strength", quantity: 20, unit: "reps" },
        { category: "focus", quantity: 60, unit: "seconds" },
        { category: "endurance", quantity: 2, unit: "kilometers" },
      ]),
    ).toEqual({
      totalXp: 100,
      byStat: { strength: 20, endurance: 20, agility: 0, focus: 60 },
    });
  });

  it("accumulates same-stat entries", () => {
    const result = calculateWorkoutXp([
      { category: "strength", quantity: 10, unit: "reps" },
      { category: "strength", quantity: 15, unit: "reps" },
    ]);
    expect(result.totalXp).toBe(25);
    expect(result.byStat.strength).toBe(25);
  });

  it("returns zero for an empty workout", () => {
    expect(calculateWorkoutXp([])).toEqual({
      totalXp: 0,
      byStat: { strength: 0, endurance: 0, agility: 0, focus: 0 },
    });
  });
});

describe("statColumnFor", () => {
  it("resolves through the central mapping", () => {
    expect(statColumnFor("agility")).toBe("agility_xp");
  });
});
