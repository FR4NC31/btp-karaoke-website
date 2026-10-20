import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  adminBookingAction,
  fetchAdminBookings,
  type AdminBooking,
  type AdminBookingAction,
} from '../../lib/admin-api'
import { describeBookingError, type BookingStatus } from '../../lib/booking-api'
import { useNewReservationDialog } from '../../lib/new-reservation-dialog'
import { ReservationRowsSkeleton } from './AdminSkeletons'
import AdminBookingRow from './components/bookings/AdminBookingRow'
import BookingsFilters from './components/bookings/BookingsFilters'

/**
 * /admin/bookings — every reservation, across all customers.
 *
 * Filters (status / day / free-text) are applied in SQL by the API, so this
 * page never pulls rows it will not show. Actions are contextual: a pending
 * reservation can be confirmed or rejected, a confirmed one completed or
 * cancelled — exactly the transitions the backend's ADMIN_ACTIONS allows.
 * A 409 ("already confirmed by someone else") surfaces as a flash, and the
 * list reloads so the row shows its real state.
 *
 * The + New reservation button opens the shell-hosted modal (no create page);
 * the shell bumps `reservationsRevision` when it saves, which reloads this
 * list behind the modal.
 */

export default function AdminBookings() {
  const { openNewReservation, reservationsRevision } = useNewReservationDialog()
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
  // Bumped whenever a filter (or the shell's save revision) starts a new load.
  // Action handlers capture it so a slower response cannot overwrite rows that
  // belong to a newer filter.
  const filterGeneration = useRef(0)

  // Reload whenever a filter changes (the API does the filtering) or the
  // modal saves a reservation.
  useEffect(() => {
    const generation = ++filterGeneration.current
    let alive = true

    async function load() {
      setLoading(true)
      try {
        const result = await fetchAdminBookings({
          status: status === 'all' ? undefined : status,
          date: date || undefined,
          query: query || undefined,
        })
        if (!alive || generation !== filterGeneration.current) return
        setBookings(result.bookings)
        setStudioToday(result.studioToday)
        setLoadError('')
      } catch (err) {
        if (!alive || generation !== filterGeneration.current) return
        setLoadError(describeBookingError(err, 'Could not load the reservations.'))
      } finally {
        if (alive && generation === filterGeneration.current) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [status, date, query, reservationsRevision])

  async function handleAction(booking: AdminBooking, action: AdminBookingAction) {
    if (actingId) return
    setActingId(booking.id)
    setFlash('')
    setLoadError('')
    const generation = filterGeneration.current
    let failure = ''
    try {
      const { booking: updated } = await adminBookingAction(booking.id, action)
      setFlash(`${updated.referenceCode} is now ${updated.status}.`)
    } catch (err) {
      // A 409 here is normal life (another tab acted first) — the reload below
      // shows the row's true state instead of a stale button set.
      failure = describeBookingError(err, 'The reservation could not be updated.')
    }
    // Reload rather than patch in place: the active filter may no longer match
    // the row (e.g. "pending" after a confirm), and the server is the source of
    // truth for order + filters. The reload is best-effort — the action's own
    // error stays on screen when it fails too.
    try {
      const result = await fetchAdminBookings({
        status: status === 'all' ? undefined : status,
        date: date || undefined,
        query: query || undefined,
      })
      if (generation === filterGeneration.current) setBookings(result.bookings)
    } catch (err) {
      if (!failure) failure = describeBookingError(err, 'Could not refresh the reservations.')
    }
    if (failure) setLoadError(failure)
    setActingId('')
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
        <button
          type="button"
          onClick={openNewReservation}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover"
        >
          + New reservation
        </button>
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
      <BookingsFilters
        status={status}
        onStatusChange={setStatus}
        date={date}
        onDateChange={setDate}
        queryInput={queryInput}
        onQueryInputChange={setQueryInput}
        query={query}
        onSearch={() => setQuery(queryInput.trim())}
        onClear={() => {
          setStatus('all')
          setDate('')
          setQueryInput('')
          setQuery('')
        }}
      />

      {/* ------------------------------- rows -------------------------------- */}
      {loading ? (
        <ReservationRowsSkeleton />
      ) : bookings.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-muted">
          No reservations match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <AdminBookingRow
              key={booking.id}
              booking={booking}
              busy={actingId === booking.id}
              onAction={handleAction}
            />
          ))}
        </ul>
      )}

      <p className="text-[11px] tracking-widest text-text-muted uppercase">
        Studio today: {studioToday || '—'}
      </p>
    </div>
  )
}
