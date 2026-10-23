import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign-in failed",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          Google sign-in didn&apos;t finish
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          We couldn&apos;t complete Google sign-in. Your account is unchanged —
          try again or use email and password.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
