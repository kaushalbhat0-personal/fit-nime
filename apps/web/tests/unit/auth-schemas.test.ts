import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/features/auth/schemas";

describe("login schema", () => {
  it("accepts a valid email and password", () => {
    const parsed = loginSchema.safeParse({
      email: "ash@example.com",
      password: "pikachu123",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const parsed = loginSchema.safeParse({
      email: "not-an-email",
      password: "pikachu123",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const parsed = loginSchema.safeParse({
      email: "ash@example.com",
      password: "",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("signup schema", () => {
  const valid = {
    email: "misty@example.com",
    password: "starmie123",
    confirmPassword: "starmie123",
  };

  it("accepts matching passwords", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const parsed = signupSchema.safeParse({
      ...valid,
      confirmPassword: "psyduck123",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match.",
      );
    }
  });

  it("rejects short passwords", () => {
    const parsed = signupSchema.safeParse({
      ...valid,
      password: "abc",
      confirmPassword: "abc",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const parsed = signupSchema.safeParse({ ...valid, email: "nope" });
    expect(parsed.success).toBe(false);
  });
});
