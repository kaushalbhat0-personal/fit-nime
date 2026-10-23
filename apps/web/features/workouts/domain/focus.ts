import type { ExerciseCategory } from "@/lib/supabase/database.types";
import { CATEGORY_ORDER } from "@/features/workouts/domain/categories";

/**
 * Today's Focus: one small, beginner-friendly suggestion answering
 * "what should I do right now?" Deterministic per calendar date, no
 * database, no randomness, no personalization claims.
 *
 * Selection: rotate the starting category by day-of-year, then take one
 * exercise from each of the next three categories (round-robin). Within
 * a category the offset also rotates daily so the same exercise isn't
 * suggested every day. At most 3 items; fewer when the catalog is small.
 *
 * Pure: no React, no Next.js, no Supabase, no browser APIs.
 */

export type FocusCandidate = {
  id: string;
  name: string;
  category: ExerciseCategory;
};

export function focusSeedForDate(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  return date.getUTCFullYear() * 1000 + dayOfYear;
}
export function selectTodaysFocus<T extends FocusCandidate>(
  exercises: T[],
  date: Date,
): T[] {
  if (exercises.length === 0) {
    return [];
  }
  const seed = focusSeedForDate(date);
  const picked: T[] = [];
  const used = new Set<string>();
  for (let i = 0; i < CATEGORY_ORDER.length && picked.length < 3; i++) {
    const category = CATEGORY_ORDER[(seed + i) % CATEGORY_ORDER.length];
    const inCategory = exercises.filter(
      (e) => e.category === category && !used.has(e.id),
    );
    if (inCategory.length === 0) {
      continue;
    }
    const choice = inCategory[(seed >> (2 * i)) % inCategory.length];
    used.add(choice.id);
    picked.push(choice);
  }
  return picked;
}

/**
 * Parse the `focus` URL parameter (`/log?focus=<id>,<id>,…`) into an
 * ordered list of exercise ids. Pure and total: unknown ids are dropped,
 * duplicates collapse to first occurrence, and anything unparseable
 * yields an empty list — the caller renders the full catalog instead.
 * Never trusted for XP or authorization; the server action re-validates
 * every submitted id against the active catalog.
 */
export function parseFocusIdsParam(
  raw: string | string[] | undefined,
  validIds: readonly string[],
): string[] {
  if (raw == null) {
    return [];
  }
  const text = Array.isArray(raw) ? raw.join(",") : raw;
  const valid = new Set(validIds);
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const part of text.split(",")) {
    const id = part.trim().toLowerCase();
    if (id === "" || seen.has(id) || !valid.has(id)) {
      continue;
    }
    seen.add(id);
    picked.push(id);
  }
  return picked;
}

/**
 * Split a catalog into focus-first order. Returns the focus exercises in
 * focus order (each exactly once) plus the remaining catalog in its
 * original order. Pure: no React, no Next.js, no Supabase.
 */
export function partitionFocusExercises<T extends FocusCandidate>(
  exercises: readonly T[],
  focusIds: readonly string[],
): { focus: T[]; rest: T[] } {
  const wanted = new Set(focusIds.map((id) => id.toLowerCase()));
  const byId = new Map(exercises.map((e) => [e.id.toLowerCase(), e]));
  const focus: T[] = [];
  for (const id of wanted) {
    const match = byId.get(id);
    if (match && !focus.includes(match)) {
      focus.push(match);
    }
  }
  return {
    focus,
    rest: exercises.filter((e) => !wanted.has(e.id.toLowerCase())),
  };
}
