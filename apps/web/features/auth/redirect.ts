/**
 * Safe post-auth redirect destinations.
 * Single source of truth for OAuth `next` validation — used by the
 * callback route. Keep it strict: relative paths only, never open redirects.
 */
export function getSafeNextPath(raw: string | null | undefined): string {
  if (!raw) {
    return "/dashboard";
  }

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/dashboard";
  }

  // Must be a relative path starting with exactly one slash.
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/dashboard";
  }
  // Backslashes can be treated as slashes by some browsers/proxies.
  if (decoded.includes("\\")) {
    return "/dashboard";
  }
  // Reject schemes (e.g. `https:`, `javascript:`) and control characters.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
    return "/dashboard";
  }
  if (/[\u0000-\u001f\u007f]/.test(decoded)) {
    return "/dashboard";
  }

  return decoded;
}
