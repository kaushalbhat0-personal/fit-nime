import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log workout",
};

export default function LogPlaceholderPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Log workout</h1>
      <p className="text-sm leading-6 text-zinc-600">
        Workout logging is intentionally deferred past Phase 0. This placeholder
        exists so the foundation call-to-action has a stable target.
      </p>
    </main>
  );
}
