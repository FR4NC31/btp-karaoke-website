import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  adminBookingAction,
  adminPaymentAction,
  fetchAdminBookings,
  type AdminBooking,
  type AdminBookingAction,
} from '../../lib/admin-api'
import { describeBookingError, type BookingStatus } from '../../lib/booking-api'
import { useNewReservationDialog } from '../../lib/new-reservation-dialog'
import { ReservationRowsSkeleton } from './AdminSkeletons'
import AdminBookingRow from './components/bookings/AdminBookingRow'
import BookingDetailsDialog from './components/bookings/BookingDetailsDialog'
import BookingsFilters from './components/bookings/BookingsFilters'
import BlockedDaysDialog from './components/reservation/BlockedDaysDialog'
import MembershipDialog from './components/reservation/MembershipDialog'

type StatusKey = BookingStatus | 'all'

/**
 * /admin/bookings — the reservation desk.
 *
 * One snapshot of the whole calendar is loaded (single studio, not paginated)
 * and every filter runs client-side, so the tab counts and the "Showing N"
 * line are always in step with the rows below. Lifecycle actions live in the
 * details dialog; the list itself stays a scannable summary.
 */
export default function AdminBookings() {
  const { reservationsRevision } = useNewReservationDialog()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [status, setStatus] = useState<StatusKey>('all')
  const [date, setDate] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')
  const [selected, setSelected] = useState<AdminBooking | null>(null)
  const [blockedDaysOpen, setBlockedDaysOpen] = useState(false)
  const [membershipOpen, setMembershipOpen] = useState(false)
  const loadGeneration = useRef(0)

  useEffect(() => {
    const generation = ++loadGeneration.current
    let alive = true

    async function load() {
      setLoading(true)
      try {
        const result = await fetchAdminBookings()
        if (!alive || generation !== loadGeneration.current) return
        setBookings(result.bookings)
        setLoadError('')
      } catch (err) {
        if (!alive || generation !== loadGeneration.current) return
        setLoadError(describeBookingError(err, 'Could not load the reservations.'))
      } finally {
        if (alive && generation === loadGeneration.current) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [reservationsRevision])

  async function handleAction(booking: AdminBooking, action: AdminBookingAction) {
    if (actingId) return
    setActingId(booking.id)
    setFlash('')
    setLoadError('')
    try {
      const result =
        booking.status === 'pending' && (action === 'confirm' || action === 'reject')
          ? await adminPaymentAction(booking.id, action === 'confirm' ? 'approve' : 'reject')
          : await adminBookingAction(booking.id, action)
      const { booking: updated } = result
      setBookings((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setFlash(`${updated.referenceCode} is now ${updated.status}.`)
      setSelected(null)
    } catch (err) {
      setLoadError(describeBookingError(err, 'The reservation could not be updated.'))
    } finally {
      setActingId('')
    }
  }

  function resetFilters() {
    setStatus('all')
    setDate('')
    setQuery('')
  }

  const needle = query.trim().toLowerCase()
  const base = bookings.filter((booking) => {
    if (date && booking.bookingDate !== date) return false
    if (!needle) return true
    const haystack = [
      booking.referenceCode,
      booking.customerName,
      booking.customerEmail,
      booking.customerContact,
      booking.serviceName,
      booking.guestName,
      booking.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })

  const counts: Record<StatusKey, number> = {
    all: base.length,
    pending: 0,
    confirmed: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  }
  for (const booking of base) counts[booking.status] += 1

  const visible = status === 'all' ? base : base.filter((booking) => booking.status === status)
  const dirty = status !== 'all' || date !== '' || query !== ''

  return (
    <div className="space-y-5">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBlockedDaysOpen(true)}
            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-bold tracking-widest text-text-secondary transition hover:border-warning/50 hover:text-warning"
          >
            Block Days
          </button>
          <button
            type="button"
            onClick={() => setMembershipOpen(true)}
            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-bold tracking-widest text-text-secondary transition hover:border-primary/50 hover:text-primary"
          >
            Membership
          </button>
        </div>
      </div>

      <BookingsFilters
        status={status}
        onStatusChange={setStatus}
        counts={counts}
        showing={visible.length}
        date={date}
        onDateChange={setDate}
        query={query}
        onQueryChange={setQuery}
        onReset={resetFilters}
        dirty={dirty}
      />

      {loading ? (
        <ReservationRowsSkeleton />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
          <HugeiconsIcon icon={Search01Icon} size={26} className="text-text-muted" />
          <p className="text-sm text-text-muted">No reservations match these filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((booking) => (
            <AdminBookingRow key={booking.id} booking={booking} onOpen={setSelected} />
          ))}
        </ul>
      )}

      <BookingDetailsDialog
        booking={selected}
        busy={Boolean(selected && actingId === selected.id)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        onAction={handleAction}
      />

      <BlockedDaysDialog
        open={blockedDaysOpen}
        onOpenChange={setBlockedDaysOpen}
      />

      <MembershipDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
      />
    </div>
  )
}
