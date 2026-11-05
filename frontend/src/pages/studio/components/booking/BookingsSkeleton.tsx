function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated motion-reduce:animate-none ${className}`}
    />
  )
}

/** One reservation row, shaped like `BookingItem` (tags, title, schedule, proof). */
function RowSkeleton() {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Bar className="h-5 w-36" />
        <Bar className="h-5 w-32" />
        <Bar className="h-5 w-28" />
      </div>
      <Bar className="mt-3 h-4 w-56 max-w-full" />
      <Bar className="mt-2.5 h-3 w-72 max-w-full" />
      <Bar className="mt-3 h-4 w-40" />
    </li>
  )
}

/**
 * The booking desk's loading state — the whole reservations view as pulse
 * placeholders instead of a text line: the toolbar pills, the Reservation
 * Overview panel (header row only; the list/empty state arrive with the
 * data), and a few `Booked Studio Sessions` rows. Mirrors the page's
 * `space-y-6` stack so nothing jumps when the real content lands.
 */
export default function BookingsSkeleton() {
  return (
    <div role="status" aria-label="Loading booking desk" className="space-y-6">
      <span className="sr-only">Loading the booking desk…</span>

      {/* Toolbar: My Bookings / New Booking pills + the studio status pill. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Bar className="h-10 w-32 rounded-lg" />
        <Bar className="h-10 w-32 rounded-lg" />
        <Bar className="h-10 w-36 rounded-lg" />
      </div>

      {/* Reservation Overview panel with its icon / heading / archive row. */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Bar className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bar className="h-6 w-56 max-w-full" />
            <Bar className="h-3 w-80 max-w-full" />
          </div>
          <Bar className="size-10 shrink-0" />
        </div>
      </div>

      {/* The session list below it. */}
      <section className="space-y-3">
        <Bar className="h-3 w-44" />
        <ul className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <RowSkeleton key={index} />
          ))}
        </ul>
      </section>
    </div>
  )
}
