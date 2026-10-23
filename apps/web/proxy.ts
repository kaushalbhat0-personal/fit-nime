import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 uses `proxy` instead of `middleware` for session refresh.
// Optimistic route protection only: the (app) layout re-checks the
// session server-side, so this stays a fast redirect, not an auth system.
export default async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  // Segment-aware match: "/login".startsWith("/log") is true, so a raw
  // prefix check would loop the login page onto itself.
  const isProtectedPage =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/log" ||
    pathname.startsWith("/log/");

  if (!user && isProtectedPage) {
    return redirectTo(request, response, "/login");
  }

  if (user && isAuthPage) {
    return redirectTo(request, response, "/dashboard");
  }

  return response;
}

function redirectTo(
  request: NextRequest,
  response: NextResponse,
  path: string,
): NextResponse {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  // Preserve refreshed auth cookies across the redirect.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie.name, cookie.value, cookie);
  }
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|godot/).*)",
  ],
};
