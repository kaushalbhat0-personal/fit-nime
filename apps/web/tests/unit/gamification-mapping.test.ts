import { describe, expect, it } from "vitest";
import { STAT_COLUMN } from "@/features/gamification/domain/mapping";

describe("STAT_COLUMN", () => {
  it.each([
    ["strength", "strength_xp"],
    ["endurance", "endurance_xp"],
    ["agility", "agility_xp"],
    ["focus", "focus_xp"],
  ] as const)("maps %s to %s", (category, column) => {
    expect(STAT_COLUMN[category]).toBe(column);
  });

  it("covers exactly the four stats, no extras", () => {
    expect(Object.keys(STAT_COLUMN).sort()).toEqual([
      "agility",
      "endurance",
      "focus",
      "strength",
    ]);
  });
});
