import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarCheck01Icon } from '@hugeicons/core-free-icons'
import type { Booking } from '../../../../lib/booking-api'
import { STATUS_STYLES, formatDay, peso } from '../../../../lib/booking-format'

type BookingsPanelProps = {
  bookings: Booking[]
  loadError: string
  cancellingId: string
  onCancel: (booking: Booking) => void
}

export default function BookingsPanel({
  bookings,
  loadError,
  cancellingId,
  onCancel,
}: BookingsPanelProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold tracking-wide uppercase">
          <HugeiconsIcon icon={CalendarCheck01Icon} size={18} className="text-primary" />
          My bookings
        </h2>
        <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
          {loadError ? '—' : `${bookings.length} total`}
        </p>
      </div>

      {bookings.length === 0 && !loadError ? (
        <p className="mt-6 text-sm text-text-muted">
          No bookings yet — pick a service above to reserve a day.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-heading text-base font-bold tracking-wide uppercase">
                    {booking.serviceName}
                  </p>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${STATUS_STYLES[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-text-secondary">
                  {formatDay(booking.bookingDate)} · {peso.format(booking.pricePhp)}
                </p>
                <p className="mt-1 text-[11px] tracking-widest text-text-muted uppercase">
                  {booking.referenceCode}
                </p>
                {booking.notes && (
                  <p className="mt-2 max-w-prose text-xs leading-relaxed text-text-muted">
                    {booking.notes}
                  </p>
                )}
              </div>

              {booking.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => onCancel(booking)}
                  disabled={cancellingId === booking.id}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
