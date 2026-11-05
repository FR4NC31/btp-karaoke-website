import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar01Icon, PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'

/** The desk has two views: the reservation list and the service catalogue. */
export type BookingTab = 'bookings' | 'services'

type BookingToolbarProps = {
  tab: BookingTab
  onTabChange: (tab: BookingTab) => void
  bookingCount: number
  query: string
  onQueryChange: (value: string) => void
}

const PILL_BASE =
  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold tracking-wide transition'

function pillClass(active: boolean): string {
  return active
    ? `${PILL_BASE} border-primary bg-primary text-text-primary hover:bg-primary-hover`
    : `${PILL_BASE} border-border bg-surface text-text-secondary hover:text-text-primary`
}

/**
 * The page toolbar from the booking-desk mockup: a catalogue search plus the
 * My Bookings / New Booking view switch and the always-on studio status pill.
 */
export default function BookingToolbar({
  tab,
  onTabChange,
  bookingCount,
  query,
  onQueryChange,
}: BookingToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tab === 'services' && (
        <div className="relative w-full max-w-md">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search studio services..."
            aria-label="Search studio services"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={tab === 'bookings'}
          onClick={() => onTabChange('bookings')}
          className={pillClass(tab === 'bookings')}
        >
          <HugeiconsIcon icon={Calendar01Icon} size={15} />
          My Bookings
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              tab === 'bookings' ? 'bg-white/20 text-text-primary' : 'bg-primary text-text-primary'
            }`}
          >
            {bookingCount}
          </span>
        </button>

        <button
          type="button"
          aria-pressed={tab === 'services'}
          onClick={() => onTabChange('services')}
          className={pillClass(tab === 'services')}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} />
          New Booking
        </button>

        <span className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text-secondary">
          <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          Studio Open 24/7
        </span>
      </div>
    </div>
  )
}
