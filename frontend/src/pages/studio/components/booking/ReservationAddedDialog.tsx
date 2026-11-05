import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import type { Booking } from '../../../../lib/booking-api'
import { formatDay, formatTime12h, peso } from '../../../../lib/booking-format'

type ReservationAddedDialogProps = {
  booking: Booking
  /** "View My Bookings" — closes the popup and lands on the overview. */
  onViewBookings: () => void
}

/** Human payment label for the mockup's Payment row (null = older row). */
function paymentLabel(booking: Booking): string {
  if (booking.paymentMethod === 'gcash') return 'GCash'
  if (booking.paymentMethod === 'filler') return 'In Person'
  return 'Not set'
}

/**
 * The mockup's "Reservation Added!" popup: the success sheet shown right
 * after a booking is created, summarising what was booked. Its single
 * action returns the customer to the reservation overview — the popup is
 * the navigation, so creating no longer jumps views on its own.
 */
export default function ReservationAddedDialog({
  booking,
  onViewBookings,
}: ReservationAddedDialogProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Service', value: booking.serviceName },
    { label: 'Date', value: formatDay(booking.bookingDate) },
    {
      label: 'Slot',
      value: booking.bookingTime ? formatTime12h(booking.bookingTime) : 'All day',
    },
    { label: 'Payment', value: paymentLabel(booking) },
    { label: 'Rate', value: peso.format(booking.amountDuePhp ?? booking.pricePhp) },
    { label: 'Reference', value: booking.referenceCode },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-added-heading"
        className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success/10 text-success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} />
          </span>
          <h2 id="reservation-added-heading" className="mt-4 text-xl font-bold tracking-wide">
            Reservation Added!
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Your studio session is on the books. Here is the summary.
          </p>
        </div>

        <dl className="space-y-2 rounded-xl border border-border bg-surface-elevated p-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                {row.label}
              </dt>
              <dd className="text-right text-sm font-semibold text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onViewBookings}
          className="w-full rounded-lg bg-primary px-5 py-3 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover"
        >
          View My Bookings
        </button>
      </div>
    </div>
  )
}
