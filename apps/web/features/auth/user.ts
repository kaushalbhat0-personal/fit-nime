import { createClient } from "@/lib/supabase/server";

/**
 * Current signed-in user, or null. Server-side only.
 * Ownership and route protection build on this — never trust a
 * client-provided user id.
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string | undefined;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { id: user.id, email: user.email ?? undefined };
}
