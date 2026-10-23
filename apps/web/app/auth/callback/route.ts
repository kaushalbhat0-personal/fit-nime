import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/features/auth/redirect";

/**
 * OAuth callback. Supabase redirects here after Google consent with
 * `?code=...&next=/dashboard`. The code is exchanged for httpOnly session
 * cookies via the existing SSR server client (PKCE handled by @supabase/ssr).
 * Tokens never appear in URLs or pages. A failed callback never signs out
 * an existing session — it just lands on the error page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
