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

function LikedStripSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
      <Bar className="size-14 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bar className="h-2.5 w-24" />
        <Bar className="h-5 w-40 max-w-full" />
        <Bar className="h-2.5 w-28" />
      </div>
      <div className="flex shrink-0 gap-2">
        <Bar className="size-10 rounded-full" />
        <Bar className="size-10 rounded-full" />
      </div>
    </div>
  )
}

function TrendingCardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden rounded-xl border border-border bg-surface p-3">
      <MosaicSkeleton className="size-20 shrink-0 rounded-lg border border-border sm:size-24" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bar className="h-2.5 w-20" />
        <Bar className="h-5 w-36 max-w-full" />
        <Bar className="h-2.5 w-full" />
        <Bar className="h-2.5 w-2/3" />
        <Bar className="mt-2 h-2.5 w-24" />
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Bar className="size-9 rounded-full" />
        <Bar className="size-8 rounded-full" />
      </div>
    </div>
  )
}

function PlaylistCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-square">
        <MosaicSkeleton className="h-full w-full" />
        <Bar className="absolute top-3 left-3 h-4 w-16 rounded" />
        <Bar className="absolute right-3 bottom-3 size-10 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
        <Bar className="h-4 w-4/5" />
        <Bar className="mt-2 h-2.5 w-2/5" />
        <div className="mt-auto pt-4">
          <Bar className="h-2.5 w-1/3" />
        </div>
      </div>
    </div>
  )
}

export default function PlaylistsSkeleton() {
  return (
    <div role="status" aria-label="Loading playlists" className="space-y-7">
      <span className="sr-only">Loading playlists</span>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Bar className="h-2.5 w-24" />
          <Bar className="mt-2 h-9 w-44" />
          <Bar className="mt-3 h-4 w-80 max-w-full" />
          <Bar className="mt-3 h-2.5 w-52" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Bar className="h-10 w-32 rounded-lg" />
          <Bar className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <LikedStripSkeleton />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Bar className="size-4 rounded-sm" />
          <Bar className="h-6 w-28" />
          <Bar className="h-3 w-32" />
          <Bar className="ml-auto h-4 w-24" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <TrendingCardSkeleton />
          <TrendingCardSkeleton />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Bar className="size-4 rounded-sm" />
          <Bar className="h-6 w-40" />
          <Bar className="h-3 w-24" />
          <Bar className="ml-auto h-4 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <Bar className="h-2.5 w-64 max-w-full" />
        <Bar className="h-2.5 w-32" />
      </div>
    </div>
  )
}
