import type { Booking } from '../../../../lib/booking-api'
import { formatDay, formatTime12h } from '../../../../lib/booking-format'

type CancelReservationDialogProps = {
  booking: Booking
  busy: boolean
  /** API error from the last attempt; stays inside the dialog so the
   *  customer can retry instead of losing the confirmation context. */
  error: string
  onConfirm: () => void
  /** "Keep Reservation" — dismiss without cancelling. */
  onDismiss: () => void
}

/**
 * The "modal for sureness" before a cancellation: name the reservation being
 * cancelled and make the destructive step explicit (Cancel Reservation) next
 * to a safe Keep Reservation.
 */
export default function CancelReservationDialog({
  booking,
  busy,
  error,
  onConfirm,
  onDismiss,
}: CancelReservationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-reservation-heading"
        className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div>
          <h2 id="cancel-reservation-heading" className="text-lg font-bold tracking-wide">
            Cancel Reservation?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            You are about to cancel{' '}
            <span className="font-semibold text-text-primary">{booking.serviceName}</span> on{' '}
            {formatDay(booking.bookingDate)}
            {booking.bookingTime ? ` at ${formatTime12h(booking.bookingTime)}` : ''} (
            {booking.referenceCode}). This cannot be undone.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep Reservation
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-error px-4 py-2.5 text-sm font-bold text-text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Cancelling…' : 'Cancel Reservation'}
          </button>
        </div>
      </div>
    </div>
  )
}
