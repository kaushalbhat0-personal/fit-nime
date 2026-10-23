import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/app-nav";
import { logout } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/user";

/**
 * Authenticated shell. Server-enforced boundary: no session means no
 * content. The proxy redirects early for speed; this layout is the real
 * gate and must never be removed.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/dashboard"
          className="rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Fit-Nime
        </Link>
        <AppNav />
        <form action={logout} className="flex min-w-0 items-center gap-3">
          <span className="hidden max-w-40 truncate text-xs text-zinc-500 sm:inline">
            {user.email}
          </span>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="min-h-11 shrink-0"
          >
            Sign out
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}
