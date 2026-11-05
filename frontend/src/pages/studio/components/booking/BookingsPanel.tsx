import type { Booking } from '../../../../lib/booking-api'
import BookingItem from './BookingItem'

type BookingsPanelProps = {
  /** Visible rows — the page already filtered archived ones out. */
  bookings: Booking[]
  onViewDetails: (booking: Booking) => void
  onReschedule: (booking: Booking) => void
  onCancel: (booking: Booking) => void
}

/**
 * The mockup's reservation list (`Booked Studio Sessions`). Each row is a
 * `BookingItem` (tags, schedule, payment proof, 3-dot menu); the archived
 * rows themselves live behind the overview's archive toggle. The panel wears
 * no heading of its own — the mockup drops straight from the toolbar into
 * the session list, and the empty state lives inside the Reservation
 * Overview panel above (the page only renders this list when rows exist).
 */
export default function BookingsPanel({
  bookings,
  onViewDetails,
  onReschedule,
  onCancel,
}: BookingsPanelProps) {
  if (bookings.length === 0) return null

  return (
    <section>
      <h3 className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
        Booked Studio Sessions
      </h3>
      <ul className="mt-3 space-y-3">
        {bookings.map((booking) => (
          <BookingItem
            key={booking.id}
            booking={booking}
            onViewDetails={onViewDetails}
            onReschedule={onReschedule}
            onCancel={onCancel}
          />
        ))}
      </ul>
    </section>
  )
}
