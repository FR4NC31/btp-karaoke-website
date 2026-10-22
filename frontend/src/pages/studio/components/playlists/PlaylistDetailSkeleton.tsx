function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated motion-reduce:animate-none ${className}`}
    />
  )
}

function MosaicSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-border ${className}`}>
      {Array.from({ length: 4 }, (_, i) => (
        <Bar key={i} className="h-full w-full rounded-none" />
      ))}
    </div>
  )
}

function TrackRowSkeleton() {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto_4.5rem] items-center gap-3 border-b border-border/70 px-3 py-2.5 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1.45fr)_minmax(0,1fr)_4.5rem_3.5rem_4.5rem]">
      <Bar className="size-8 rounded" />
      <div className="flex min-w-0 items-center gap-2.5">
        <Bar className="size-9 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Bar className="h-3.5 w-3/4" />
          <Bar className="h-2.5 w-1/2" />
        </div>
      </div>
      <Bar className="hidden h-2.5 w-24 sm:block" />
      <Bar className="hidden h-2.5 w-16 sm:block" />
      <Bar className="ml-auto h-2.5 w-10" />
      <div className="flex items-center justify-end gap-0.5">
        <Bar className="size-8 rounded" />
        <Bar className="size-8 rounded" />
      </div>
    </div>
  )
}

export default function PlaylistDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading playlist" className="space-y-7">
      <span className="sr-only">Loading playlist</span>

      <div className="flex items-center gap-2">
        <Bar className="h-2.5 w-24" />
        <Bar className="h-2.5 w-2" />
        <Bar className="h-2.5 w-32" />
      </div>

      <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="w-40 shrink-0 sm:w-52">
          <MosaicSkeleton className="aspect-square rounded-xl border border-border shadow-2xl" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <Bar className="h-2.5 w-44" />
          <Bar className="h-10 w-80 max-w-full" />
          <Bar className="h-4 w-full max-w-2xl" />
          <Bar className="h-4 w-2/3 max-w-xl" />
          <Bar className="h-2.5 w-56 max-w-full" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Bar className="h-5 w-16 rounded-full" />
            <Bar className="h-5 w-20 rounded-full" />
            <Bar className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Bar className="size-10 rounded-lg" />
            <Bar className="size-10 rounded-lg" />
            <Bar className="size-10 rounded-lg" />
            <Bar className="ml-1 h-5 w-24 rounded-full" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
          <Bar className="h-6 w-32" />
          <Bar className="h-2.5 w-40" />
        </div>

        <div
          aria-hidden="true"
          className="hidden grid-cols-[2rem_minmax(0,1.45fr)_minmax(0,1fr)_4.5rem_3.5rem_4.5rem] gap-3 border-b border-border px-3 py-2 sm:grid"
        >
          <Bar className="h-2 w-4" />
          <Bar className="h-2 w-16" />
          <Bar className="h-2 w-20" />
          <Bar className="h-2 w-14" />
          <Bar className="ml-auto h-2 w-10" />
          <span />
        </div>

        {Array.from({ length: 8 }, (_, i) => (
          <TrackRowSkeleton key={i} />
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <Bar className="h-2.5 w-64 max-w-full" />
        <Bar className="h-2.5 w-32" />
      </div>
    </div>
  )
}
