export default function AppLoading() {
  return (
    <main aria-label="Loading" aria-busy="true" className="flex flex-col gap-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-100" />
      <div className="h-12 w-full animate-pulse rounded-full bg-zinc-100" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-zinc-100" />
    </main>
  );
}
