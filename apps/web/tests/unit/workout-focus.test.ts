import { describe, expect, it } from "vitest";
import {
  focusSeedForDate,
  selectTodaysFocus,
} from "@/features/workouts/domain/focus";
import type { ExerciseCategory } from "@/lib/supabase/database.types";

type Item = { id: string; name: string; category: ExerciseCategory };

const CATALOG: Item[] = [
  { id: "s1", name: "Push-ups", category: "strength" },
  { id: "s2", name: "Squats", category: "strength" },
  { id: "e1", name: "Running", category: "endurance" },
  { id: "e2", name: "Cycling", category: "endurance" },
  { id: "a1", name: "Burpees", category: "agility" },
  { id: "a2", name: "High Knees", category: "agility" },
  { id: "f1", name: "Plank", category: "focus" },
  { id: "f2", name: "Yoga Flow", category: "focus" },
];

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("focusSeedForDate", () => {
  it("is stable for the same date", () => {
    expect(focusSeedForDate(day("2026-10-26"))).toBe(
      focusSeedForDate(day("2026-10-26")),
    );
  });

  it("differs across dates", () => {
    expect(focusSeedForDate(day("2026-10-26"))).not.toBe(
      focusSeedForDate(day("2026-10-27")),
    );
  });
});

describe("selectTodaysFocus", () => {
  it("returns at most 3 valid catalog items", () => {
    const picked = selectTodaysFocus(CATALOG, day("2026-10-26"));
    expect(picked.length).toBeLessThanOrEqual(3);
    expect(picked.length).toBeGreaterThan(0);
    for (const item of picked) {
      expect(CATALOG.map((c) => c.id)).toContain(item.id);
    }
  });

  it("is deterministic for the same date", () => {
    expect(selectTodaysFocus(CATALOG, day("2026-10-26"))).toEqual(
      selectTodaysFocus(CATALOG, day("2026-10-26")),
    );
  });

  it("spreads across categories over a week", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 7; d++) {
      for (const item of selectTodaysFocus(
        CATALOG,
        day(`2026-11-${String(d).padStart(2, "0")}`),
      )) {
        seen.add(item.category);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it("never repeats an exercise within one day", () => {
    const picked = selectTodaysFocus(CATALOG, day("2026-10-26"));
    expect(new Set(picked.map((p) => p.id)).size).toBe(picked.length);
  });

  it("handles small and empty catalogs", () => {
    expect(selectTodaysFocus([], day("2026-10-26"))).toEqual([]);
    const one = selectTodaysFocus([CATALOG[0]], day("2026-10-26"));
    expect(one).toHaveLength(1);
  });
});
