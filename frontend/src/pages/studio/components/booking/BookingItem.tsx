import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar01Icon, Image01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons'
import type { Booking } from '../../../../lib/booking-api'
import { STATUS_STYLES, formatTime12h } from '../../../../lib/booking-format'
import { WING_LABELS } from './constants'

type BookingItemProps = {
  booking: Booking
  onViewDetails: (booking: Booking) => void
  onReschedule: (booking: Booking) => void
  onCancel: (booking: Booking) => void
}

/**
 * Status text for the mockup's tag: a confirmed reservation reads
 * "CONFIRMED & NOTIFIED" (CSS uppercases it); every other state shows as-is.
 */
function statusLabel(booking: Booking): string {
  return booking.status === 'confirmed' ? 'Confirmed' : booking.status
}

function paymentTag(booking: Booking): string | null {
  if (booking.paymentMethod === 'gcash') return 'Payment: GCash'
  if (booking.paymentMethod === 'filler') return 'Payment: In Person'
  return null
}

/** `14:00` → `15:00` — the end of an hourly booking's one-hour block. */
function addHour(time: string): string {
  const [hour, minute] = time.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time
  return `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const MENU_ITEM_CLASSES =
  'block w-full px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-surface'

/**
 * One reservation row from the booking-desk mockup: wing/status/payment tags,
 * the service name and `Scheduled:` line (ISO day + slot range), the inline
 * payment-proof thumbnail (GCash without an upload shows the placeholder), the
 * notes, and the centered 3-dot menu that opens View Details / Change
 * Schedule / Cancel Session. No price and no reference code — the mockup's
 * row shows neither (the reference lives in the success popup and flash).
 */
export default function BookingItem({
  booking,
  onViewDetails,
  onReschedule,
  onCancel,
}: BookingItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Escape closes the popup menu; the invisible backdrop handles outside clicks.
  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const wingLabel = WING_LABELS[booking.wing] ?? booking.wing
  const payment = paymentTag(booking)
  // Hourly rows show the whole block (`01:00 PM - 02:00 PM`); minute-based
  // services only know their start, so they show that alone.
  const hourly = /\b(hour|hr)(?:ly|s)?\b/i.test(booking.serviceUnit ?? '')
  const schedule = booking.bookingTime
    ? `${booking.bookingDate} (${formatTime12h(booking.bookingTime)}${
        hourly ? ` - ${formatTime12h(addHour(booking.bookingTime))}` : ''
      })`
    : `${booking.bookingDate} (All day)`

  return (
    <li className="relative rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary uppercase">
              {wingLabel}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${STATUS_STYLES[booking.status]}`}
            >
              {statusLabel(booking)}
            </span>
            {payment && (
              <span className="rounded border border-info/40 bg-info/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-info uppercase">
                {payment}
              </span>
            )}
          </div>

          <p className="mt-3 text-[15px] font-bold text-text-primary">{booking.serviceName}</p>

          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-text-secondary">
            <HugeiconsIcon icon={Calendar01Icon} size={15} className="shrink-0 text-text-muted" />
            <span>Scheduled:</span>
            <span className="font-bold text-text-primary">{schedule}</span>
          </p>

          {booking.notes && (
            <p className="mt-2 max-w-prose text-xs leading-relaxed text-text-muted">
              {booking.notes}
            </p>
          )}

          {booking.paymentMethod === 'gcash' && (
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-text-secondary">Payment Proof:</span>
              {booking.receiptUrl ? (
                <img
                  src={booking.receiptUrl}
                  alt={`Payment proof for ${booking.referenceCode}`}
                  className="size-11 rounded-lg border border-border object-cover"
                />
              ) : (
                <>
                  <span
                    className="grid size-11 place-items-center rounded-lg border-2 border-dashed border-border text-text-muted"
                    title="No payment proof uploaded yet"
                  >
                    <HugeiconsIcon icon={Image01Icon} size={18} />
                  </span>
                  <span className="text-xs text-text-muted">No payment proof uploaded yet.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* The mockup's 3-dot menu sits at the row's right, vertically
            centered; the popup anchors below the button itself. */}
        <div className="relative shrink-0 self-center">
          <button
            type="button"
            aria-label={`More options for ${booking.serviceName}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute top-full right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onViewDetails(booking)
                  }}
                  className={`${MENU_ITEM_CLASSES} text-text-primary`}
                >
                  View Details
                </button>
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onReschedule(booking)
                    }}
                    className={`${MENU_ITEM_CLASSES} text-text-primary`}
                  >
                    Change Schedule
                  </button>
                )}
                {booking.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onCancel(booking)
                    }}
                    className={`${MENU_ITEM_CLASSES} text-error`}
                  >
                    Cancel Session
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
