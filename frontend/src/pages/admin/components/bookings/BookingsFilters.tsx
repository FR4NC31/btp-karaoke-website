import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import type { BookingStatus } from '../../../../lib/booking-api'
import { STATUS_FILTERS } from './helpers'

type BookingsFiltersProps = {
  status: BookingStatus | 'all'
  onStatusChange: (value: BookingStatus | 'all') => void
  date: string
  onDateChange: (value: string) => void
  /** The live search box; `query` is the committed one. */
  queryInput: string
  onQueryInputChange: (value: string) => void
  query: string
  onSearch: () => void
  onClear: () => void
}

/**
 * Status pills + day picker + free-text search. The page owns the state; the
 * API applies the filters in SQL, so pressing Search commits `queryInput`.
 */
export default function BookingsFilters({
  status,
  onStatusChange,
  date,
  onDateChange,
  queryInput,
  onQueryInputChange,
  query,
  onSearch,
  onClear,
}: BookingsFiltersProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => onStatusChange(filter.value)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold tracking-widest uppercase transition ${
              status === filter.value
                ? 'bg-primary-soft text-primary'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="filter-date"
            className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
          >
            Day
          </label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSearch()
          }}
          className="flex min-w-0 flex-1 items-end gap-2"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="filter-query"
              className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
            >
              Search
            </label>
            <div className="relative mt-1.5">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <input
                id="filter-query"
                type="search"
                placeholder="Reference code, customer name or email…"
                value={queryInput}
                onChange={(e) => onQueryInputChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:text-text-primary"
          >
            Search
          </button>
        </form>

        {(status !== 'all' || date || query || queryInput) && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold tracking-widest text-text-muted uppercase transition hover:text-text-primary"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
            Clear
          </button>
        )}
      </div>
    </section>
  )
}
