import { describe, expect, it } from "vitest";
import { parseEventByStat } from "@/features/gamification/domain/events";

describe("parseEventByStat", () => {
  it("parses a well-formed event payload", () => {
    expect(
      parseEventByStat({
        workout_session_id: "abc",
        by_stat: { strength: 20, endurance: 0, agility: 0, focus: 60 },
      }),
    ).toEqual({ strength: 20, endurance: 0, agility: 0, focus: 60 });
  });

  it.each([null, undefined, "x", 42, []])(
    "rejects non-object metadata %p",
    (metadata) => {
      expect(parseEventByStat(metadata)).toBeNull();
    },
  );

  it("rejects missing or malformed by_stat", () => {
    expect(parseEventByStat({})).toBeNull();
    expect(parseEventByStat({ by_stat: null })).toBeNull();
    expect(parseEventByStat({ by_stat: { strength: 20 } })).toBeNull();
    expect(
      parseEventByStat({
        by_stat: { strength: 20, endurance: 0, agility: 0, focus: "60" },
      }),
    ).toBeNull();
    expect(
      parseEventByStat({
        by_stat: { strength: -1, endurance: 0, agility: 0, focus: 0 },
      }),
    ).toBeNull();
  });
});
