import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, EyeIcon } from '@hugeicons/core-free-icons'
import type { AdminBooking } from '../../../../lib/admin-api'
import { STATUS_STYLES, formatDay, peso } from '../../../../lib/booking-format'

type AdminBookingRowProps = {
  booking: AdminBooking
  onOpen: (booking: AdminBooking) => void
}

/**
 * One reservation in the desk list. The row is a summary only — the eye
 * button opens the details dialog where the lifecycle actions live, and the
 * calendar button jumps to the closure desk for that day.
 */
export default function AdminBookingRow({ booking, onOpen }: AdminBookingRowProps) {
  const day = formatDay(booking.bookingDate)

  return (
    <li className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">
              {booking.customerName}
            </p>
            {booking.guestName && (
              <span className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-text-muted uppercase">
                Guest
              </span>
            )}
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-text-secondary">
            <span className="truncate">{booking.serviceName}</span>
            <span aria-hidden="true" className="text-text-muted">
              ·
            </span>
            <span className="whitespace-nowrap">
              {day}
              {booking.bookingTime ? `, ${booking.bookingTime.slice(0, 5)}` : ', whole day'}
            </span>
            <span aria-hidden="true" className="text-text-muted">
              ·
            </span>
            <span className="font-semibold whitespace-nowrap text-success">
              {peso.format(booking.amountDuePhp ?? booking.pricePhp)}
            </span>
          </p>

          <p className="mt-1 truncate text-[10px] font-bold tracking-[0.16em] text-text-muted uppercase">
            {booking.referenceCode}
            {booking.customerEmail ? ` · ${booking.customerEmail}` : ''}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[booking.status]}`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {booking.status}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpen(booking)}
            aria-label={`View ${booking.referenceCode}`}
            title="View reservation"
            className="grid size-8 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
          >
            <HugeiconsIcon icon={EyeIcon} size={14} />
          </button>
          <Link
            to={`/admin/blocked-days?date=${booking.bookingDate}`}
            aria-label={`Block ${day}`}
            title="Block this day"
            className="grid size-8 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
          >
            <HugeiconsIcon icon={Calendar03Icon} size={14} />
          </Link>
        </div>
      </div>
    </li>
  )
}
