import { z } from "zod";

/**
 * Auth input contracts. Client forms reuse these for fast feedback;
 * server actions re-validate authoritatively. Single source of truth —
 * do not duplicate these rules elsewhere.
 */

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  // Login intentionally has no strength rules: never hint at the real
  // password policy on the way in.
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export type ActionState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};
