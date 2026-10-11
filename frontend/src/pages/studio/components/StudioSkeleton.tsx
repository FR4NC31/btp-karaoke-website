/**
 * Loading skeleton for the /studio main region. Shape mirrors StudioHome
 * (featured card → genre filter → collections grid → telemetry table).
 * Pure divs on purpose: no h1/h2/article/button, so pinned E2E a11y
 * assertions only ever match the real content underneath.
 */
function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-elevated ${className}`} />
}

export default function StudioSkeleton() {
  return (
    <div role="status" aria-label="Loading studio" className="space-y-8">
      {/* Featured collection */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex gap-6">
          <div className="hidden size-40 shrink-0 rounded-lg bg-surface-elevated sm:block" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <Bar className="h-6 w-44" />
              <Bar className="h-4 w-28" />
            </div>
            <Bar className="mt-4 h-10 w-3/4" />
            <Bar className="mt-3 h-10 w-1/2" />
            <div className="mt-4 max-w-2xl space-y-2">
              <Bar className="h-3.5 w-full" />
              <Bar className="h-3.5 w-full" />
              <Bar className="h-3.5 w-2/3" />
            </div>
            <div className="mt-5 flex gap-3">
              <Bar className="h-9 w-44" />
              <Bar className="h-9 w-44" />
            </div>
          </div>
        </div>
      </section>

      {/* Genre filter pills */}
      <section className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Bar key={i} className="h-8 w-24" />
        ))}
      </section>

      {/* Collections grid */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Bar className="h-6 w-64" />
          <Bar className="h-4 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4">
              <Bar className="h-32 w-full" />
              <Bar className="mt-4 h-4 w-3/4" />
              <Bar className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>

      {/* Telemetry table */}
      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Bar className="h-5 w-48" />
          <Bar className="ml-auto h-4 w-24" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
            <Bar className="h-4 w-8" />
            <Bar className="h-4 w-40" />
            <Bar className="h-4 w-24" />
            <Bar className="hidden h-4 w-20 sm:block" />
            <Bar className="ml-auto h-7 w-16" />
          </div>
        ))}
      </section>
    </div>
  )
}
