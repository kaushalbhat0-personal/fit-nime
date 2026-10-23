import { describe, expect, it } from "vitest";
import {
  COMPANION_ASSETS,
  LARGE_WORKOUT_XP,
  companionLineFor,
  pickCelebrationVariant,
} from "@/components/companion";

describe("companion asset contract", () => {
  it("reuses one static illustration across all slots", () => {
    expect(COMPANION_ASSETS.default).toBe("/character/companion.svg");
    expect(COMPANION_ASSETS.celebrate).toBe(COMPANION_ASSETS.default);
    expect(COMPANION_ASSETS["level-up"]).toBe(COMPANION_ASSETS.default);
  });

  it("keeps the large-session threshold at the level-2 boundary", () => {
    expect(LARGE_WORKOUT_XP).toBe(100);
  });
});

describe("pickCelebrationVariant", () => {
  it("returns level-up when the workout leveled the user up", () => {
    expect(pickCelebrationVariant({ leveledUp: true, totalXp: 20 })).toBe(
      "level-up",
    );
  });

  it("returns celebrate for a large session without a level-up", () => {
    expect(pickCelebrationVariant({ leveledUp: false, totalXp: 120 })).toBe(
      "celebrate",
    );
  });

  it("returns default for an ordinary session", () => {
    expect(pickCelebrationVariant({ leveledUp: false, totalXp: 20 })).toBe(
      "default",
    );
  });

  it("treats missing XP as an ordinary session instead of crashing", () => {
    expect(pickCelebrationVariant({})).toBe("default");
    expect(pickCelebrationVariant({ totalXp: null })).toBe("default");
  });
});

describe("companionLineFor", () => {
  it("is encouraging for every variant, never shaming", () => {
    for (const variant of ["default", "celebrate", "level-up"] as const) {
      const line = companionLineFor(variant);
      expect(line.length).toBeGreaterThan(0);
      expect(line.toLowerCase()).not.toMatch(
        /lazy|shame|guilt|streak|missed|behind/,
      );
    }
  });
});
