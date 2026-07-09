export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted/50" />
      <div className="h-4 w-72 rounded bg-muted/30" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
