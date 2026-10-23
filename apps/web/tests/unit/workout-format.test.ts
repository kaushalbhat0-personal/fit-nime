import { describe, expect, it } from "vitest";
import { formatQuantity, unitHint } from "@/features/workouts/domain/format";

describe("formatQuantity", () => {
  it("renders every unit from data, not slugs", () => {
    expect(formatQuantity(20, "reps")).toBe("20 reps");
    expect(formatQuantity(60, "seconds")).toBe("60 seconds");
    expect(formatQuantity(15, "minutes")).toBe("15 minutes");
    expect(formatQuantity(2, "kilometers")).toBe("2 kilometers");
  });

  it("uses singular for exactly one", () => {
    expect(formatQuantity(1, "reps")).toBe("1 rep");
    expect(formatQuantity(1, "seconds")).toBe("1 second");
    expect(formatQuantity(1, "minutes")).toBe("1 minute");
    expect(formatQuantity(1, "kilometers")).toBe("1 kilometer");
  });

  it("keeps decimals as-is", () => {
    expect(formatQuantity(2.5, "kilometers")).toBe("2.5 kilometers");
  });

  it("unitHint matches the plural label", () => {
    expect(unitHint("reps")).toBe("reps");
    expect(unitHint("seconds")).toBe("seconds");
    expect(unitHint("minutes")).toBe("minutes");
    expect(unitHint("kilometers")).toBe("kilometers");
  });
});
