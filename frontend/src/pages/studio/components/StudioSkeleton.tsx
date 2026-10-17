/**
 * Loading skeleton for the /studio main region. Shape mirrors StudioHome
 * (video song block → music player rows → radio cards).
 * Pure divs on purpose: no h1/h2/article/button, so pinned E2E a11y
 * assertions only ever match the real content underneath.
 */
function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-elevated ${className}`} />
}

export default function StudioSkeleton() {
  return (
    <div role="status" aria-label="Loading studio" className="space-y-8">
      {/* Video song */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <Bar className="h-6 w-40" />
          <Bar className="h-4 w-32" />
          <Bar className="ml-auto h-4 w-28" />
        </div>
        <div className="flex flex-col gap-6 xl:flex-row">
          <Bar className="aspect-video min-w-0 flex-1 rounded-xl" />
          <div className="min-w-0 space-y-3 xl:w-72 xl:shrink-0">
            <Bar className="h-6 w-32" />
            <Bar className="h-10 w-3/4" />
            <Bar className="h-4 w-1/3" />
            <Bar className="h-3.5 w-full" />
            <Bar className="h-3.5 w-2/3" />
            <div className="flex gap-3 pt-2">
              <Bar className="h-9 w-36" />
              <Bar className="h-9 w-28" />
            </div>
          </div>
        </div>
      </section>

      {/* Music player rows */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Bar className="h-6 w-48" />
          <Bar className="h-4 w-40" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
              <Bar className="size-8 rounded-md" />
              <Bar className="size-10 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bar className="h-4 w-52" />
                <Bar className="h-3 w-36" />
              </div>
              <Bar className="size-8 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Radio cards */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Bar className="h-6 w-28" />
          <Bar className="h-4 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <Bar className="h-5 w-16" />
                <Bar className="h-4 w-12" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Bar className="h-10 w-8" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bar className="h-4 w-3/4" />
                  <Bar className="h-3 w-1/2" />
                </div>
              </div>
              <Bar className="mt-3 h-3.5 w-full" />
              <Bar className="mt-3 h-8 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
