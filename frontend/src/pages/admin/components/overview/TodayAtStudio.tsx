import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarCheck01Icon } from '@hugeicons/core-free-icons'
import type { AdminBooking } from '../../../../lib/admin-api'
import { STATUS_STYLES } from '../../../../lib/booking-format'

/** Today's live schedule — who is coming in, and their status. */
export default function TodayAtStudio({ today }: { today: AdminBooking[] }) {
  return (
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
  )
}
