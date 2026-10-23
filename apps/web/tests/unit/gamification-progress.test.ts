import { describe, expect, it } from "vitest";
import {
  calculateLevelProgress,
  nextLevelAt,
} from "@/features/gamification/domain/level";

describe("nextLevelAt", () => {
  it.each([
    [1, 100],
    [2, 400],
    [3, 900],
    [4, 1600],
  ])("level %s starts at %s XP", (level, expected) => {
    expect(nextLevelAt(level)).toBe(expected);
  });

  it("starts levels below 1 at zero (level-1 band edge)", () => {
    expect(nextLevelAt(0)).toBe(0);
    expect(nextLevelAt(-3)).toBe(0);
    expect(nextLevelAt(Number.NaN)).toBe(0);
  });
});

describe("calculateLevelProgress", () => {
  it("reports an empty band at zero XP", () => {
    expect(calculateLevelProgress(0)).toEqual({
      level: 1,
      totalXp: 0,
      nextLevelAt: 100,
      intoLevel: 0,
      bandSize: 100,
      progress: 0,
    });
  });

  it("tracks exact thresholds", () => {
    expect(calculateLevelProgress(99).progress).toBeCloseTo(0.99);
    const at100 = calculateLevelProgress(100);
    expect(at100.level).toBe(2);
    expect(at100.intoLevel).toBe(0);
    expect(at100.nextLevelAt).toBe(400);
    const mid = calculateLevelProgress(250);
    expect(mid.level).toBe(2);
    expect(mid.intoLevel).toBe(150);
    expect(mid.bandSize).toBe(300);
    expect(mid.progress).toBeCloseTo(0.5);
    const at900 = calculateLevelProgress(900);
    expect(at900.level).toBe(4);
    expect(at900.nextLevelAt).toBe(1600);
  });

  it("clamps invalid totals", () => {
    expect(calculateLevelProgress(-50).progress).toBe(0);
    expect(calculateLevelProgress(Number.NaN).level).toBe(1);
  });

  it("is deterministic", () => {
    expect(calculateLevelProgress(377)).toEqual(calculateLevelProgress(377));
  });
});
