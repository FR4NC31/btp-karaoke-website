/**
 * Loading skeleton for the /studio main region. Shape mirrors the current
 * media hub (section header → MediaCard grids for Video Song / Music Player /
 * Radio), so the placeholder and the real content it becomes share one
 * layout. StudioHome also renders it while the catalog fetch is in flight,
 * so the shell's simulated delay and the real load read as one state.
 *
 * Pure divs on purpose: no h1/h2/article/button/role inside, so pinned E2E
 * a11y assertions only ever match the real content underneath.
 */
function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-elevated ${className}`} />
}

/** One MediaCard-shaped tile: cover area, title/subtitle block, meta footer. */
function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <Bar className="aspect-[4/3] w-full" />
      <div className="space-y-2 px-3.5 pt-3 pb-2.5">
        <Bar className="h-4 w-3/4" />
        <Bar className="h-2.5 w-2/5" />
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-border px-3.5 py-2">
        <Bar className="h-2.5 w-10" />
        <Bar className="h-2.5 w-8" />
        <Bar className="ml-auto size-5 rounded-full" />
      </div>
    </div>
  )
}

/** Section header (◆ + heading + sub-label + counter) over a card grid. */
function SectionSkeleton({
  headingWidth,
  labelWidth,
  gridClass,
  cards,
}: {
  headingWidth: string
  labelWidth: string
  gridClass: string
  cards: number
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Bar className="size-3 rounded-sm" />
        <Bar className={`h-6 ${headingWidth}`} />
        <Bar className={`h-3.5 ${labelWidth}`} />
        <Bar className="ml-auto h-4 w-32" />
      </div>
      <div className={gridClass}>
        {Array.from({ length: cards }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

export default function StudioSkeleton() {
  return (
    <div role="status" aria-label="Loading studio" className="space-y-8">
      <SectionSkeleton
        headingWidth="w-36"
        labelWidth="w-44"
        gridClass="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        cards={4}
      />
      <SectionSkeleton
        headingWidth="w-44"
        labelWidth="w-52"
        gridClass="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        cards={5}
      />
      <SectionSkeleton
        headingWidth="w-24"
        labelWidth="w-40"
        gridClass="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        cards={4}
      />
    </div>
  )
}
