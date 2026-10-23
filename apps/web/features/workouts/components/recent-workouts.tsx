import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META } from "@/features/workouts/components/categories";
import { formatQuantity } from "@/features/workouts/domain/format";

const HISTORY_LIMIT = 5;

/**
 * Recent workout history. One embedded query (sessions + entries +
 * exercise meta), newest first. RLS scopes rows to the signed-in user;
 * nothing user-specific is passed in from the client.
 */
export async function RecentWorkouts() {
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, started_at, notes, workout_entries(quantity, created_at, exercises(name, unit, category))",
    )
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error || !sessions) {
    return (
      <section
        aria-label="Recent workouts"
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm text-zinc-600">
          Could not load recent workouts. Your logged workouts are safe — try
          reloading the page.
        </p>
      </section>
    );
  }

  if (sessions.length === 0) {
    return (
      <section
        aria-label="Recent workouts"
        className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center shadow-sm"
      >
        <History
          aria-hidden="true"
          className="mx-auto mb-2 size-5 text-zinc-400"
        />
        <p className="text-sm font-medium">No workouts yet</p>
        <p className="mt-1 text-xs text-zinc-500">
          Log your first workout above — it will show up here.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Recent workouts" className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
        Recent workouts
      </h2>
      {sessions.map((session) => {
        const entries = [...(session.workout_entries ?? [])].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        const date = new Date(session.started_at).toLocaleDateString(
          undefined,
          { month: "short", day: "numeric" },
        );
        return (
          <article
            key={session.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{date}</p>
              <p className="text-xs text-zinc-500">
                {entries.length}{" "}
                {entries.length === 1 ? "exercise" : "exercises"}
              </p>
            </div>
            <ul className="flex flex-col gap-1.5">
              {entries.map((entry, i) => {
                const exercise = entry.exercises;
                if (!exercise) {
                  return null;
                }
                const { Icon } = CATEGORY_META[exercise.category];
                return (
                  <li
                    key={`${session.id}-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-zinc-400"
                    />
                    <span className="font-medium">{exercise.name}</span>
                    <span className="ml-auto text-zinc-600">
                      {formatQuantity(entry.quantity, exercise.unit)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {session.notes ? (
              <p className="mt-2 truncate text-xs text-zinc-500">
                {session.notes}
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
