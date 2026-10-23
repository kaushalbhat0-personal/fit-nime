import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "@/features/auth/redirect";

describe("getSafeNextPath", () => {
  it("defaults to /dashboard for nullish input", () => {
    expect(getSafeNextPath(null)).toBe("/dashboard");
    expect(getSafeNextPath(undefined)).toBe("/dashboard");
    expect(getSafeNextPath("")).toBe("/dashboard");
  });

  it("accepts safe relative paths", () => {
    expect(getSafeNextPath("/dashboard")).toBe("/dashboard");
    expect(getSafeNextPath("/log")).toBe("/log");
    expect(getSafeNextPath("/dashboard/settings")).toBe("/dashboard/settings");
  });

  it("rejects absolute URLs and schemes", () => {
    expect(getSafeNextPath("https://evil.example")).toBe("/dashboard");
    expect(getSafeNextPath("http://localhost:3000/dashboard")).toBe(
      "/dashboard",
    );
    expect(getSafeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects protocol-relative and backslash redirects", () => {
    expect(getSafeNextPath("//evil.example")).toBe("/dashboard");
    expect(getSafeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(getSafeNextPath("\\evil")).toBe("/dashboard");
    expect(getSafeNextPath("%2F%2Fevil.example")).toBe("/dashboard");
  });

  it("rejects non-relative paths", () => {
    expect(getSafeNextPath("dashboard")).toBe("/dashboard");
  });
});
