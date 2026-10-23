"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  type ActionState,
} from "@/features/auth/schemas";

export type { ActionState };

/**
 * Auth mutations. Each action validates input with Zod, talks to Supabase
 * Auth, and redirects on success. No business logic beyond auth lives here.
 */

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Generic message: never reveal whether the email exists.
    return { message: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  // When email confirmation is enabled there is no session yet: tell the
  // user to check their inbox instead of faking a signed-in state.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Google OAuth initiation. Server-side only: builds the Google authorization
 * URL via Supabase (PKCE verifier cookie is set through the SSR client) and
 * redirects the browser there. No tokens touch client JS; no secrets here —
 * the Google Client ID/Secret live in the Supabase Dashboard, not the app.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const headersList = await headers();

  // Request-aware origin so local dev and production both work without
  // hardcoding a domain. Supabase validates `redirectTo` against the
  // dashboard allowlist, so a spoofed host fails closed there.
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host");
  const proto =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  const origin = host ? `${proto}://${host}` : "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data.url) {
    redirect("/login");
  }

  redirect(data.url);
}
