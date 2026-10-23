import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY,
  parseLogWorkoutFormData,
  validateLogWorkoutInput,
} from "@/features/workouts/schemas";

const EX_A = "11111111-1111-4111-8111-111111111111";
const EX_B = "22222222-2222-4222-8222-222222222222";

function form(pairs: [string, string][], notes?: string): FormData {
  const fd = new FormData();
  for (const [k, v] of pairs) {
    fd.append(k, v);
  }
  if (notes !== undefined) {
    fd.append("notes", notes);
  }
  return fd;
}

describe("parseLogWorkoutFormData", () => {
  it("collects qty_ fields and skips blanks", () => {
    const parsed = parseLogWorkoutFormData(
      form([
        [`qty_${EX_A}`, "20"],
        [`qty_${EX_B}`, "  "],
        ["unrelated", "x"],
      ]),
    );
    expect(parsed.entries).toEqual([{ exerciseId: EX_A, quantity: 20 }]);
    expect(parsed.notes).toBe("");
  });

  it("reads notes and defaults to empty", () => {
    expect(parseLogWorkoutFormData(form([], "felt strong")).notes).toBe(
      "felt strong",
    );
    expect(parseLogWorkoutFormData(form([])).notes).toBe("");
  });
});

describe("validateLogWorkoutInput", () => {
  it("accepts a valid payload", () => {
    const result = validateLogWorkoutInput({
      entries: [
        { exerciseId: EX_A, quantity: 20 },
        { exerciseId: EX_B, quantity: 2.5 },
      ],
      notes: "good session",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entries).toHaveLength(2);
    }
  });

  it("rejects an empty workout", () => {
    const result = validateLogWorkoutInput({ entries: [], notes: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/at least one exercise/);
    }
  });

  it.each([0, -5])("rejects non-positive quantity %s", (quantity) => {
    const result = validateLogWorkoutInput({
      entries: [{ exerciseId: EX_A, quantity }],
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it.each(["abc", Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects non-numeric quantity %s",
    (quantity) => {
      const result = validateLogWorkoutInput({
        entries: [{ exerciseId: EX_A, quantity }],
        notes: "",
      });
      expect(result.success).toBe(false);
    },
  );

  it("rejects quantities above the cap", () => {
    const result = validateLogWorkoutInput({
      entries: [{ exerciseId: EX_A, quantity: MAX_QUANTITY + 1 }],
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed exercise ids", () => {
    const result = validateLogWorkoutInput({
      entries: [{ exerciseId: "push-ups", quantity: 10 }],
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate exercise ids", () => {
    const result = validateLogWorkoutInput({
      entries: [
        { exerciseId: EX_A, quantity: 10 },
        { exerciseId: EX_A.toUpperCase(), quantity: 12 },
      ],
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects over-long notes", () => {
    const result = validateLogWorkoutInput({
      entries: [{ exerciseId: EX_A, quantity: 10 }],
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("end-to-end: invalid form text fails validation", () => {
    const raw = parseLogWorkoutFormData(form([[`qty_${EX_A}`, "zero"]]));
    const result = validateLogWorkoutInput(raw);
    expect(result.success).toBe(false);
  });
});
