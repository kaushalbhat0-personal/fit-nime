import { describe, expect, it } from "vitest";
import {
  parseFocusIdsParam,
  partitionFocusExercises,
} from "@/features/workouts/domain/focus";

const VALID = ["aaa", "bbb", "ccc"] as const;

describe("parseFocusIdsParam", () => {
  it("parses a comma-separated id list in order", () => {
    expect(parseFocusIdsParam("aaa,ccc", VALID)).toEqual(["aaa", "ccc"]);
  });

  it("returns an empty list for missing input", () => {
    expect(parseFocusIdsParam(undefined, VALID)).toEqual([]);
  });

  it("drops unknown ids instead of crashing", () => {
    expect(parseFocusIdsParam("aaa,nope,bbb", VALID)).toEqual(["aaa", "bbb"]);
  });

  it("collapses duplicates to first occurrence", () => {
    expect(parseFocusIdsParam("bbb,aaa,bbb", VALID)).toEqual(["bbb", "aaa"]);
  });

  it("ignores blanks and whitespace", () => {
    expect(parseFocusIdsParam(" , aaa ,, ", VALID)).toEqual(["aaa"]);
  });

  it("handles repeated query keys by joining them", () => {
    expect(parseFocusIdsParam(["aaa", "ccc"], VALID)).toEqual(["aaa", "ccc"]);
  });

  it("matches ids case-insensitively", () => {
    expect(parseFocusIdsParam("AAA", VALID)).toEqual(["aaa"]);
  });
});

const CATALOG = [
  { id: "aaa", name: "A", category: "strength" },
  { id: "bbb", name: "B", category: "endurance" },
  { id: "ccc", name: "C", category: "agility" },
  { id: "ddd", name: "D", category: "focus" },
] as const;

type Entry = (typeof CATALOG)[number];

describe("partitionFocusExercises", () => {
  it("returns focus exercises first in focus order, each exactly once", () => {
    const { focus, rest } = partitionFocusExercises<Entry>(
      [...CATALOG],
      ["ccc", "aaa"],
    );
    expect(focus.map((e) => e.id)).toEqual(["ccc", "aaa"]);
    expect(rest.map((e) => e.id)).toEqual(["bbb", "ddd"]);
  });

  it("keeps every catalog exercise available exactly once", () => {
    const { focus, rest } = partitionFocusExercises<Entry>(
      [...CATALOG],
      ["bBb"],
    );
    expect([...focus, ...rest].map((e) => e.id).sort()).toEqual([
      "aaa",
      "bbb",
      "ccc",
      "ddd",
    ]);
  });

  it("returns the whole catalog as rest when no focus matches", () => {
    const { focus, rest } = partitionFocusExercises<Entry>(
      [...CATALOG],
      ["nope"],
    );
    expect(focus).toEqual([]);
    expect(rest.map((e) => e.id)).toEqual(["aaa", "bbb", "ccc", "ddd"]);
  });
});
