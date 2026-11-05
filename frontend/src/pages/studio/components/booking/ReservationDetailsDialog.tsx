import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Image01Icon } from '@hugeicons/core-free-icons'
import type { Booking } from '../../../../lib/booking-api'
import { STATUS_STYLES, formatDay, formatTime12h, peso } from '../../../../lib/booking-format'
import { WING_LABELS } from './constants'

type ReservationDetailsDialogProps = {
  booking: Booking
  onClose: () => void
}

function paymentOption(booking: Booking): string {
  if (booking.paymentMethod === 'gcash') return 'GCash'
  if (booking.paymentMethod === 'filler') return 'In Person'
  return 'Not set'
}

/**
 * The mockup's "Reservation Details" sheet (View Details): read-only summary
 * of one reservation — wing tag, service, rate, schedule, payment option,
 * and the uploaded GCash receipt when there is one (In Person has none).
 */
export default function ReservationDetailsDialog({
  booking,
  onClose,
}: ReservationDetailsDialogProps) {
  const rows = [
    { label: 'Scheduled Date', value: formatDay(booking.bookingDate) },
    {
      label: 'Time Slot',
      value: booking.bookingTime ? formatTime12h(booking.bookingTime) : 'All day',
    },
    { label: 'Payment Option', value: paymentOption(booking) },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-details-heading"
        className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
              {WING_LABELS[booking.wing] ?? booking.wing}
            </p>
            <h2 id="reservation-details-heading" className="mt-1 text-lg leading-tight font-bold">
              Reservation Details
            </h2>
            <p className="mt-1 text-sm font-semibold text-text-primary">{booking.serviceName}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {peso.format(booking.amountDuePhp ?? booking.pricePhp)}
            </p>
            <span
              className={`mt-2 inline-block rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${STATUS_STYLES[booking.status]}`}
            >
              {booking.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reservation details"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <dl className="space-y-3 border-t border-border pt-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                {row.label}
              </dt>
              <dd className="text-right text-sm font-semibold text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>

        {booking.paymentMethod === 'gcash' && (
          <div className="border-t border-border pt-4">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Payment Proof
            </p>
            {booking.receiptUrl ? (
              <img
                src={booking.receiptUrl}
                alt={`Payment proof for ${booking.referenceCode}`}
                className="mt-2 max-h-56 w-full rounded-lg border border-border object-contain"
              />
            ) : (
              <p className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                <HugeiconsIcon icon={Image01Icon} size={15} />
                No payment proof uploaded yet.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-text-primary transition hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
