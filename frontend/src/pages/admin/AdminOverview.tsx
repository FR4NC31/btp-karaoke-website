import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CalendarCheck01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import {
  adminBookingAction,
  fetchAdminBookings,
  type AdminBooking,
} from '../../lib/admin-api'
import { describeBookingError } from '../../lib/booking-api'
import { STATUS_STYLES, formatDay } from '../../lib/booking-format'

/**
 * /admin — the work queue.
 *
 * Pending reservations come first: they are the only rows with actions, and
 * the reason this page exists. Below them, "today at the studio" answers the
 * one question worth asking on arrival — who is coming in today.
 *
 * Reads the full list (this is a single studio's calendar, not a paginated
 * dataset) and derives the cards client-side, so the page costs one request.
 */

interface Stat {
  label: string
  value: number
  hint: string
}

export default function AdminOverview() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [flash, setFlash] = useState('')
  const [actingId, setActingId] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const result = await fetchAdminBookings()
        if (!alive) return
        setBookings(result.bookings)
        setStudioToday(result.studioToday)
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
  }, [])

  async function handleAction(booking: AdminBooking, action: 'confirm' | 'reject') {
    if (actingId) return
    setActingId(booking.id)
    setFlash('')
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
    } finally {
      setActingId('')
    }
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.bookingDate >= studioToday)
  const today = bookings.filter(
    (b) =>
      b.bookingDate === studioToday &&
      (b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed'),
  )

  const stats: Stat[] = [
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
    return (
      <p role="status" className="text-sm text-text-muted">
        Loading the admin console…
      </p>
    )
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

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              {stat.label}
            </p>
            <p className="mt-2 font-heading text-3xl leading-none font-bold text-primary">
              {stat.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold tracking-wide uppercase">
            <HugeiconsIcon icon={Clock01Icon} size={18} className="text-warning" />
            Pending approvals
          </h2>
          <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
            {pending.length} waiting
          </p>
        </div>

        {pending.length === 0 ? (
          <p className="mt-6 text-sm text-text-muted">
            Nothing waiting — every reservation has been answered.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {pending.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
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
                  </div>
                  <p className="mt-1.5 text-sm text-text-secondary">
                    {booking.serviceName} · {formatDay(booking.bookingDate)}
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

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(booking, 'reject')}
                    disabled={actingId === booking.id}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(booking, 'confirm')}
                    disabled={actingId === booking.id}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    {actingId === booking.id ? 'Working…' : 'Confirm'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold tracking-wide uppercase">
            <HugeiconsIcon icon={CalendarCheck01Icon} size={18} className="text-primary" />
            Today at the studio
          </h2>
          <Link
            to="/admin/bookings"
            className="text-[11px] font-bold tracking-widest text-primary uppercase transition hover:text-primary-hover"
          >
            All reservations →
          </Link>
        </div>

        {today.length === 0 ? (
          <p className="mt-6 text-sm text-text-muted">No sessions booked for today.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {today.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold tracking-wide uppercase">
                    {booking.customerName}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">{booking.serviceName}</p>
                </div>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${STATUS_STYLES[booking.status]}`}
                >
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
