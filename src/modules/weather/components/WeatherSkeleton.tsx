export function WeatherSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      <div className="h-72 animate-pulse rounded-[28px] bg-surface-900/80 border border-surface-700/60" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-surface-900/80 border border-surface-700/60" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-surface-900/80 border border-surface-700/60" />
        <div className="h-80 animate-pulse rounded-2xl bg-surface-900/80 border border-surface-700/60" />
      </div>
    </div>
  )
}
