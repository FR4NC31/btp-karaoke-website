function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-elevated ${className}`} />
}

function ReservationRowSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Bar className="h-5 w-40" />
        <Bar className="h-[18px] w-16 rounded" />
      </div>
      <Bar className="mt-3 h-3.5 w-72 max-w-full" />
      <Bar className="mt-2 h-2.5 w-56 max-w-full" />
    </div>
  )
}

export function ReservationRowsSkeleton() {
  return (
    <div role="status" aria-label="Loading reservations" className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <ReservationRowSkeleton key={i} />
      ))}
    </div>
  )
}

export function OverviewSkeleton() {
  return (
    <div role="status" aria-label="Loading the admin console" className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Bar className="h-8 w-40" />
          <Bar className="mt-2 h-3 w-48" />
        </div>
        <Bar className="h-10 w-44 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <Bar className="h-2.5 w-28" />
            <Bar className="mt-3 h-8 w-16" />
            <Bar className="mt-3 h-2.5 w-40 max-w-full" />
          </div>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Bar className="h-6 w-44" />
          <Bar className="h-3 w-20" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Bar className="h-5 w-36" />
                  <Bar className="h-[18px] w-16 rounded" />
                </div>
                <Bar className="mt-2.5 h-3.5 w-56 max-w-full" />
                <Bar className="mt-2 h-2.5 w-48 max-w-full" />
              </div>
              <div className="flex items-center gap-2">
                <Bar className="h-9 w-24 rounded-lg" />
                <Bar className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
