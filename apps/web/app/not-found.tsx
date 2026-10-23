import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        This trail doesn&apos;t exist
      </h1>
      <p className="text-sm leading-6 text-zinc-600">
        The page you&apos;re looking for moved or never existed. Your workouts
        are safe.
      </p>
      <Button asChild size="lg">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
