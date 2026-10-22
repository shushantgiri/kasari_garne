export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">लोड हुँदैछ… Loading…</span>
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-paper-warm" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-paper-warm" />
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-paper-warm" />)}
      </div>
    </div>
  );
}
