import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'
import {
  adminBookingAction,
  fetchAdminBookings,
  type AdminBooking,
  type AdminBookingAction,
} from '../../lib/admin-api'
import { describeBookingError, type BookingStatus } from '../../lib/booking-api'
import { STATUS_STYLES, formatDay, peso } from '../../lib/booking-format'

/**
 * /admin/bookings — every reservation, across all customers.
 *
 * Filters (status / day / free-text) are applied in SQL by the API, so this
 * page never pulls rows it will not show. Actions are contextual: a pending
 * reservation can be confirmed or rejected, a confirmed one completed or
 * cancelled — exactly the transitions the backend's ADMIN_ACTIONS allows.
 * A 409 ("already confirmed by someone else") surfaces as a flash, and the
 * list reloads so the row shows its real state.
 */

const STATUS_FILTERS: Array<{ value: BookingStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

/** The buttons a row shows, per current status. */
const ROW_ACTIONS: Record<string, Array<{ action: AdminBookingAction; label: string; kind: 'primary' | 'danger' | 'neutral' }>> = {
  pending: [
    { action: 'confirm', label: 'Confirm', kind: 'primary' },
    { action: 'reject', label: 'Reject', kind: 'danger' },
  ],
  confirmed: [
    { action: 'complete', label: 'Mark completed', kind: 'primary' },
    { action: 'cancel', label: 'Cancel', kind: 'danger' },
  ],
}

function ActionButton({
  label,
  kind,
  disabled,
  onClick,
}: {
  label: string
  kind: 'primary' | 'danger' | 'neutral'
  disabled: boolean
  onClick: () => void
}) {
  const classes =
    kind === 'primary'
      ? 'bg-primary text-text-primary hover:bg-primary-hover'
      : kind === 'danger'
        ? 'border border-border text-text-secondary hover:border-error/50 hover:text-error'
        : 'border border-border text-text-secondary hover:text-text-primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2 text-xs font-bold tracking-widest uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}
    >
      {label}
    </button>
  )
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')
  const [date, setDate] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')

  // Reload whenever a filter changes; the API does the filtering.
  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      try {
        const result = await fetchAdminBookings({
          status: status === 'all' ? undefined : status,
          date: date || undefined,
          query: query || undefined,
        })
        if (!alive) return
        setBookings(result.bookings)
        setStudioToday(result.studioToday)
        setLoadError('')
      } catch (err) {
        if (!alive) return
        setLoadError(describeBookingError(err, 'Could not load the reservations.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [status, date, query])

  async function handleAction(booking: AdminBooking, action: AdminBookingAction) {
    if (actingId) return
    setActingId(booking.id)
    setFlash('')
    try {
      const { booking: updated } = await adminBookingAction(booking.id, action)
      setFlash(`${updated.referenceCode} is now ${updated.status}.`)
      // Reload rather than patch in place: the active filter may no longer
      // match the row (e.g. "pending" after a confirm), and the server is the
      // source of truth for order + filters.
      const result = await fetchAdminBookings({
        status: status === 'all' ? undefined : status,
        date: date || undefined,
        query: query || undefined,
      })
      setBookings(result.bookings)
    } catch (err) {
      // A 409 here is normal life (another tab acted first) — reload so the
      // row shows its true state instead of a stale button set.
      setLoadError(describeBookingError(err, 'The reservation could not be updated.'))
      try {
        const result = await fetchAdminBookings({
          status: status === 'all' ? undefined : status,
          date: date || undefined,
          query: query || undefined,
        })
        setBookings(result.bookings)
      } catch {
        // Keep the original error message; the reload is best-effort.
      }
    } finally {
      setActingId('')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">Reservations</h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">
            Every customer, every status
          </p>
        </div>
        <Link
          to="/admin/bookings/new"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover"
        >
          + New reservation
        </Link>
      </header>

      {loadError && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </p>
      )}

      {flash && (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
          {flash}
        </p>
      )}

      {/* ------------------------------- filters ------------------------------ */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
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
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setQuery(queryInput.trim())
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
                  onChange={(e) => setQueryInput(e.target.value)}
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

          {(status !== 'all' || date || query) && (
            <button
              type="button"
              onClick={() => {
                setStatus('all')
                setDate('')
                setQueryInput('')
                setQuery('')
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold tracking-widest text-text-muted uppercase transition hover:text-text-primary"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={13} />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* ------------------------------- rows -------------------------------- */}
      {loading ? (
        <p role="status" className="text-sm text-text-muted">
          Loading reservations…
        </p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-text-muted">No reservations match these filters.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-heading text-base font-bold tracking-wide uppercase">
                    {booking.customerName}
                  </p>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${STATUS_STYLES[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                  {booking.guestName && (
                    <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                      Guest
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-text-secondary">
                  {booking.serviceName} · {formatDay(booking.bookingDate)} ·{' '}
                  {peso.format(booking.pricePhp)}
                </p>
                <p className="mt-1 text-[11px] tracking-widest text-text-muted uppercase">
                  {booking.referenceCode}
                  {booking.customerContact ? ` · ${booking.customerContact}` : ''}
                  {booking.customerEmail ? ` · ${booking.customerEmail}` : ''}
                </p>
                {booking.notes && (
                  <p className="mt-2 max-w-prose text-xs leading-relaxed text-text-muted">
                    {booking.notes}
                  </p>
                )}
              </div>

              {ROW_ACTIONS[booking.status] && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {ROW_ACTIONS[booking.status]!.map((rowAction) => (
                    <ActionButton
                      key={rowAction.action}
                      label={actingId === booking.id ? 'Working…' : rowAction.label}
                      kind={rowAction.kind}
                      disabled={actingId === booking.id}
                      onClick={() => handleAction(booking, rowAction.action)}
                    />
                  ))}
                </div>
              )}

              {booking.status === 'completed' && (
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold tracking-widest text-text-muted uppercase">
                  <HugeiconsIcon icon={TaskDone01Icon} size={14} />
                  Done
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] tracking-widest text-text-muted uppercase">
        Studio today: {studioToday || '—'}
      </p>
    </div>
  )
}
