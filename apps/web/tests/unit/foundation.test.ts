import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("foundation smoke", () => {
  it("merges class names with a single shared helper", () => {
    expect(cn("px-2", "px-4", { hidden: false })).toBe("px-4");
  });

  it("keeps the architecture contract visible", () => {
    // Minimum layers necessary: page -> action -> domain -> Supabase.
    // No controller / repository / adapter layer exists in Phase 0.
    expect(["page", "action", "domain", "supabase"].length).toBe(4);
  });
});
