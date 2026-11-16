function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-elevated ${className}`}
    />
  )
}

/** Video/music card: artwork block + title/subtitle footer, no divider. */
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Bar className="aspect-[16/10] w-full rounded-none" />
      <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Bar className="h-4 w-3/4" />
          <Bar className="h-2.5 w-1/2" />
        </div>
        <Bar className="size-5 shrink-0 rounded" />
      </div>
    </div>
  )
}

/** Music/radio list row. */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <Bar className="size-11 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bar className="h-4 w-2/5" />
        <Bar className="h-2.5 w-3/5" />
      </div>
      <Bar className="h-3.5 w-10 shrink-0" />
      <Bar className="size-5 shrink-0 rounded" />
    </div>
  )
}

function SectionHeaderSkeleton({
  titleWidth,
  subtitleWidth,
  chips = 0,
  link = false,
}: {
  titleWidth: string
  subtitleWidth: string
  chips?: number
  link?: boolean
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex items-start gap-2.5">
        <Bar className="size-9 shrink-0 rounded-lg" />
        <div className="space-y-2">
          <Bar className={`h-6 ${titleWidth}`} />
          <Bar className={`h-3 ${subtitleWidth}`} />
        </div>
      </div>
      {chips > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {Array.from({ length: chips }, (_, index) => (
            <Bar key={index} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      )}
      {link && <Bar className="h-4 w-24" />}
    </div>
  )
}

export default function StudioSkeleton() {
  return (
    <div role="status" className="space-y-8">
      <span className="sr-only">Loading studio content</span>

      {/* Recently Played strip */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-3">
          <div className="flex items-start gap-3">
            <Bar className="size-9 shrink-0 rounded-lg" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bar className="h-6 w-44" />
                <Bar className="h-5 w-16 rounded-full" />
              </div>
              <Bar className="h-3 w-72 max-w-full" />
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Bar className="h-8 w-40 rounded-lg" />
            <Bar className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </section>

      {/* Video Songs */}
      <section>
        <SectionHeaderSkeleton titleWidth="w-40" subtitleWidth="w-80" chips={5} />
        <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,27rem))]">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </section>

      {/* Music Tracks */}
      <section>
        <SectionHeaderSkeleton titleWidth="w-36" subtitleWidth="w-72" link />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      </section>

      {/* Playlists + radio panels */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-start gap-2.5">
            <Bar className="size-9 shrink-0 rounded-lg" />
            <div className="space-y-2">
              <Bar className="h-6 w-56" />
              <Bar className="h-3 w-72 max-w-full" />
            </div>
          </div>
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated/50 p-2.5">
              <Bar className="size-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bar className="h-4 w-1/3" />
                <Bar className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Bar className="h-6 w-36 rounded-full" />
            <Bar className="ml-auto h-4 w-20" />
          </div>
          <Bar className="h-5 w-3/4" />
          <div className="space-y-2">
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-5/6" />
          </div>
          <div className="flex gap-2 pt-1">
            <Bar className="h-9 flex-1 rounded-lg" />
            <Bar className="h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-2.5 pt-1">
            {Array.from({ length: 2 }, (_, index) => (
              <RowSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
