import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      <header className="mb-6 flex items-center justify-between">
        <p className="text-sm font-semibold">Fit-Nime</p>
        <form action={logout} className="flex items-center gap-3">
          <span className="max-w-40 truncate text-xs text-zinc-500">
            {user.email}
          </span>
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}
