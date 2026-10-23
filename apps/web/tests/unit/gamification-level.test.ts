import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  calculateTotalXp,
} from "@/features/gamification/domain/level";

describe("calculateTotalXp", () => {
  it("sums the four stats and never reads anything else", () => {
    expect(
      calculateTotalXp({
        strength_xp: 20,
        endurance_xp: 20,
        agility_xp: 60,
        focus_xp: 0,
      }),
    ).toBe(100);
  });

  it("is zero for fresh stats", () => {
    expect(
      calculateTotalXp({
        strength_xp: 0,
        endurance_xp: 0,
        agility_xp: 0,
        focus_xp: 0,
      }),
    ).toBe(0);
  });
});

describe("calculateLevel", () => {
  it.each([
    [0, 1],
    [1, 1],
    [99, 1],
    [100, 2],
    [399, 2],
    [400, 3],
    [899, 3],
    [900, 4],
    [1600, 5],
  ])("maps total XP %s to level %s", (total, expected) => {
    expect(calculateLevel(total)).toBe(expected);
  });

  it("treats non-finite or negative totals as zero", () => {
    expect(calculateLevel(Number.NaN)).toBe(1);
    expect(calculateLevel(Number.POSITIVE_INFINITY)).toBe(1);
    expect(calculateLevel(-50)).toBe(1);
  });

  it("is deterministic across repeats", () => {
    expect([1, 2, 3].map(() => calculateLevel(250))).toEqual([2, 2, 2]);
  });
});
