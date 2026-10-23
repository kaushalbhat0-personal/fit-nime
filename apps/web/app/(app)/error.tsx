"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-col items-center gap-4 py-10 text-center">
      <h1 className="text-xl font-bold tracking-tight">
        Something didn&apos;t load
      </h1>
      <p className="text-sm leading-6 text-zinc-600">
        Your workouts are safe. Try again, or head back to the dashboard.
      </p>
      <div className="flex gap-2">
        <Button type="button" size="lg" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
