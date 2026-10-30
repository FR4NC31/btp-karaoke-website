import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CalendarCheck01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  MoneyBag02Icon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons'
import {
  adminBookingAction,
  adminPaymentAction,
  fetchAdminBookings,
  type AdminBooking,
  type AdminBookingAction,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { useNewReservationDialog } from '../../lib/new-reservation-dialog'
import { OverviewSkeleton } from './AdminSkeletons'
import BookingDetailsDialog from './components/bookings/BookingDetailsDialog'
import OverviewSummary, { type OverviewStat } from './components/overview/OverviewSummary'
import PendingApprovals from './components/overview/PendingApprovals'
import ActivityLog from './components/overview/ActivityLog'
import { activityEntriesFrom } from './components/overview/activity-log-data'

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
  const { reservationsRevision } = useNewReservationDialog()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')
  const [selected, setSelected] = useState<AdminBooking | null>(null)
  // Bumped whenever the shell's revision starts a new load. Action refreshes
  // capture it so a slower response cannot overwrite a newer snapshot.
  const loadGeneration = useRef(0)

  useEffect(() => {
    const generation = ++loadGeneration.current
    let alive = true

    async function load() {
      try {
        const result = await fetchAdminBookings()
        if (!alive || generation !== loadGeneration.current) return
        setBookings(result.bookings)
        setStudioToday(result.studioToday)
        // A successful reload clears a stale error from an earlier attempt.
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

  /** Re-reads the snapshot — used best-effort after a failed action. */
  async function refresh() {
    const generation = loadGeneration.current
    const result = await fetchAdminBookings()
    if (generation !== loadGeneration.current) return
    setBookings(result.bookings)
    setStudioToday(result.studioToday)
  }

  /** Manual refresh from the activity-log header. */
  async function handleRefresh() {
    setLoadError('')
    try {
      await refresh()
    } catch (err) {
      setLoadError(describeBookingError(err, 'Could not refresh the dashboard.'))
    }
  }

  async function handleAction(booking: AdminBooking, action: AdminBookingAction) {
    if (actingId) return
    const generation = loadGeneration.current
    setActingId(booking.id)
    setFlash('')
    setLoadError('')
    try {
      const result =
        booking.status === 'pending' && (action === 'confirm' || action === 'reject')
          ? await adminPaymentAction(booking.id, action === 'confirm' ? 'approve' : 'reject')
          : await adminBookingAction(booking.id, action)
      const { booking: updated } = result
      // Swap the one row; the day never changes, so list order holds until
      // the next load re-sorts. A newer load already has the server's truth.
      if (generation === loadGeneration.current) {
        setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
        setFlash(
          `${updated.referenceCode} ${updated.status} — ${updated.customerName}, ${updated.serviceName}.`,
        )
        setSelected(null)
      }
    } catch (err) {
      if (generation === loadGeneration.current) {
        setLoadError(describeBookingError(err, 'The reservation could not be updated.'))
      }
      // The action may have lost a race (409) — re-read so the queue matches
      // the server even though the action itself reported an error.
      try {
        await refresh()
      } catch {
        // Keep the action's error; the reload is best-effort.
      }
    } finally {
      setActingId('')
    }
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const today = bookings.filter(
    (b) =>
      b.bookingDate === studioToday &&
      (b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed'),
  )

  // KPI inputs — all derived from the same reservation snapshot the page loads,
  // so the cards, the queue and the activity log can never disagree.
  const month = studioToday.slice(0, 7)
  const monthBookings = month
    ? bookings.filter((b) => b.bookingDate.startsWith(month))
    : []
  const keptThisMonth = monthBookings.filter(
    (b) => b.status !== 'rejected' && b.status !== 'cancelled',
  )
  const completedThisMonth = keptThisMonth.filter((b) => b.status === 'completed')
  const confirmedThisMonth = keptThisMonth.filter((b) => b.status === 'confirmed')
  const revenueThisMonth = keptThisMonth.reduce((sum, b) => sum + b.amountDuePhp, 0)
  const settledRevenue = completedThisMonth.reduce((sum, b) => sum + b.amountDuePhp, 0)
  const keptShare = monthBookings.length
    ? Math.round((keptThisMonth.length / monthBookings.length) * 100)
    : 0
  const settledShare = revenueThisMonth
    ? Math.round((settledRevenue / revenueThisMonth) * 100)
    : 0
  const activeToday = today.filter((b) => b.status === 'confirmed')
  const completedToday = today.filter((b) => b.status === 'completed')
  const pad = (count: number) => String(count).padStart(2, '0')
  const compactPeso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
  })

  const stats: OverviewStat[] = [
    {
      label: 'Pending Approvals',
      value: pad(pending.length),
      trend: {
        label: 'review queue',
        value: pending.length > 0 ? 'Action' : 'Clear',
        color: pending.length > 0 ? 'warning' : 'success',
      },
      detail:
        pending.length > 0
          ? `${pending.length} request${pending.length === 1 ? '' : 's'} waiting on you`
          : 'Every request has been answered',
      icon: Clock01Icon,
      link: { label: 'Review', to: '/admin/bookings' },
    },
    {
      label: 'Active Sessions',
      value: pad(activeToday.length),
      trend: {
        label: 'closed today',
        value: `${completedToday.length}`,
        color: completedToday.length > 0 ? 'success' : 'text-muted',
      },
      detail:
        today.length > 0
          ? `${today.length} on today's schedule`
          : 'No sessions booked today',
      icon: MusicNote01Icon,
      link: { label: 'Schedule', to: '/admin/bookings' },
    },
    {
      label: 'Studio Bookings',
      value: pad(keptThisMonth.length),
      trend: {
        label: 'kept this month',
        value: `${keptShare}%`,
        color: keptShare >= 80 ? 'success' : 'warning',
      },
      detail: `${completedThisMonth.length} completed · ${confirmedThisMonth.length} confirmed`,
      icon: CalendarCheck01Icon,
      link: { label: 'Schedule', to: '/admin/bookings' },
    },
    {
      label: 'Monthly Revenue',
      value: revenueThisMonth > 0 ? compactPeso.format(revenueThisMonth) : '₱0',
      trend: {
        label: 'collected',
        value: `${settledShare}%`,
        color: settledShare >= 50 ? 'success' : 'warning',
      },
      detail: 'Booked value this month',
      icon: MoneyBag02Icon,
      link: { label: 'Reservations', to: '/admin/bookings' },
    },
  ]

  if (loading) {
    return <OverviewSkeleton />
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-5 xl:h-[600px] xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <ActivityLog entries={activityEntriesFrom(bookings)} onRefresh={handleRefresh} />

        <PendingApprovals
          pending={pending}
          today={today}
          onOpen={setSelected}
        />
      </div>

      <BookingDetailsDialog
        booking={selected}
        busy={Boolean(selected && actingId === selected.id)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        onAction={(booking, action) => {
          void handleAction(booking, action)
        }}
      />
    </div>
  )
}
