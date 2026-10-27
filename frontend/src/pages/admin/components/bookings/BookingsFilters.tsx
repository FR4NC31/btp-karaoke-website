import { HugeiconsIcon } from '@hugeicons/react'
import { RotateLeft01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import type { BookingStatus } from '../../../../lib/booking-api'
import { STATUS_FILTERS } from './helpers'

type StatusKey = BookingStatus | 'all'

type BookingsFiltersProps = {
  status: StatusKey
  onStatusChange: (value: StatusKey) => void
  counts: Record<StatusKey, number>
  showing: number
  date: string
  onDateChange: (value: string) => void
  query: string
  onQueryChange: (value: string) => void
  onReset: () => void
  dirty: boolean
}

/**
 * Desk filters. Everything is applied client-side against the one snapshot
 * the page loads, so the tab counts and "Showing N" always agree.
 */
export default function BookingsFilters({
  status,
  onStatusChange,
  counts,
  showing,
  date,
  onDateChange,
  query,
  onQueryChange,
  onReset,
  dirty,
}: BookingsFiltersProps) {
  return (
    <section aria-label="Reservation filters" className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.value
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(filter.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition ${
                  active
                    ? 'bg-primary text-text-primary'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active ? 'bg-black/20 text-text-primary' : 'bg-surface-elevated text-text-muted'
                  }`}
                >
                  {counts[filter.value] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-[10px] font-bold tracking-[0.16em] text-text-muted uppercase">
          Showing {showing} booking{showing === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4">
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <label htmlFor="filter-query" className="sr-only">
              Search
            </label>
            <HugeiconsIcon
              icon={Search01Icon}
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            />
            <input
              id="filter-query"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search name, reference, email…"
              className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-date" className="sr-only">
            Date
          </label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={!dirty}
          aria-label="Reset filters"
          title="Reset filters"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={RotateLeft01Icon} size={15} />
        </button>
      </div>
    </section>
  )
}
