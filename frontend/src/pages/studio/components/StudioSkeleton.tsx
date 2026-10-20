function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-elevated ${className}`} />
}

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
        <Bar className="ml-auto size-6 rounded" />
      </div>
    </div>
  )
}

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
    <div role="status" className="space-y-8">
      <span className="sr-only">Loading studio content</span>
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
