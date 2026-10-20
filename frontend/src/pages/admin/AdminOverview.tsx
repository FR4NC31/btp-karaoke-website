import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  adminBookingAction,
  fetchAdminBookings,
  type AdminBooking,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { formatDay } from '../../lib/booking-format'
import { useNewReservationDialog } from '../../lib/new-reservation-dialog'
import { OverviewSkeleton } from './AdminSkeletons'
import OverviewSummary, { type OverviewStat } from './components/overview/OverviewSummary'
import PendingApprovals from './components/overview/PendingApprovals'
import TodayAtStudio from './components/overview/TodayAtStudio'

/**
 * /admin — the work queue.
 *
 * Pending reservations come first: they are the only rows with actions, and
 * the reason this page exists. Below them, "today at the studio" answers the
 * one question worth asking on arrival — who is coming in today.
 *
 * Reads the full list (this is a single studio's calendar, not a paginated
 * dataset) and derives the cards client-side, so the page costs one request.
 * The + New reservation button opens the shell-hosted modal; a save bumps the
 * shell's revision and reloads this snapshot.
 */

export default function AdminOverview() {
  const { openNewReservation, reservationsRevision } = useNewReservationDialog()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')
  /** Which action the acting row is running, so only that button says Working. */
  const [actingAction, setActingAction] = useState<'confirm' | 'reject' | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const result = await fetchAdminBookings()
        if (!alive) return
        setBookings(result.bookings)
        setStudioToday(result.studioToday)
        // A successful reload clears a stale error from an earlier attempt.
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
  }, [reservationsRevision])

  /** Re-reads the snapshot — used best-effort after a failed action. */
  async function refresh() {
    const result = await fetchAdminBookings()
    setBookings(result.bookings)
    setStudioToday(result.studioToday)
  }

  async function handleAction(booking: AdminBooking, action: 'confirm' | 'reject') {
    if (actingId) return
    setActingId(booking.id)
    setActingAction(action)
    setFlash('')
    setLoadError('')
    try {
      const { booking: updated } = await adminBookingAction(booking.id, action)
      // Swap the one row; the day never changes, so list order holds until
      // the next load re-sorts.
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setFlash(
        `${updated.referenceCode} ${updated.status} — ${updated.customerName}, ${updated.serviceName}.`,
      )
    } catch (err) {
      setLoadError(describeBookingError(err, 'The reservation could not be updated.'))
      // The action may have lost a race (409) — re-read so the queue matches
      // the server even though the action itself reported an error.
      try {
        await refresh()
      } catch {
        // Keep the action's error; the reload is best-effort.
      }
    } finally {
      setActingId('')
      setActingAction(null)
    }
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.bookingDate >= studioToday)
  const today = bookings.filter(
    (b) =>
      b.bookingDate === studioToday &&
      (b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed'),
  )

  const stats: OverviewStat[] = [
    {
      label: 'Pending approvals',
      value: pending.length,
      hint: 'Waiting on you to confirm or reject',
    },
    {
      label: 'Confirmed upcoming',
      value: upcoming.length,
      hint: 'Confirmed sessions from today onwards',
    },
    {
      label: 'Today at the studio',
      value: today.length,
      hint: `Live schedule for ${studioToday || 'today'}`,
    },
  ]

  if (loading) {
    return <OverviewSkeleton />
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">Overview</h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">
            {studioToday ? `Studio day · ${formatDay(studioToday)}` : 'Studio control room'}
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

      <OverviewSummary stats={stats} />

      <PendingApprovals
        pending={pending}
        actingId={actingId}
        actingAction={actingAction}
        onAction={handleAction}
      />

      <TodayAtStudio today={today} />
    </div>
  )
}
