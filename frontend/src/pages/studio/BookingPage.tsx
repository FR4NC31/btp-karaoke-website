import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarCheck01Icon, Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  BookingApiError,
  cancelBooking,
  createBooking,
  fetchBookings,
  fetchServices,
  type Booking,
  type BookingStatus,
  type Service,
} from '../../lib/booking-api'

/**
 * /studio/bookings — the booking desk.
 *
 * Day-only prototype: pick a service from the catalog and claim a whole day.
 * There is no time slot or time block yet — that arrives as its own migration,
 * and `service.durationDays` is turnaround metadata, not a claim on extra days.
 *
 * Every booking is created `pending`, which is the state an admin will later
 * confirm or reject (no online payment). The status column already carries
 * that workflow, so accepting a booking needs no schema change.
 *
 * Services and bookings both come from the backend (`/api/services`,
 * `/api/bookings`) — the catalog is real data, not the static module in
 * `data.ts`, so prices live in one place.
 */

const WING_LABELS: Record<string, string> = {
  create: 'Create',
  promote: 'Promote',
  learn: 'Learn',
  protect: 'Protect',
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  confirmed: 'border-success/40 bg-success/10 text-success',
  rejected: 'border-error/40 bg-error/10 text-error',
  cancelled: 'border-border bg-surface-elevated text-text-muted',
  completed: 'border-primary/40 bg-primary-soft text-primary',
}

const NOTES_MAX = 500

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

/**
 * A booking day is a calendar day, not an instant. Parsing it as UTC keeps the
 * displayed date from sliding a day backwards for anyone west of Manila.
 */
const dayFormat = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(`${isoDate}T00:00:00Z`))
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof BookingApiError) {
    if (err.status === 401) {
      return 'Your session has expired. Sign in again to manage bookings.'
    }
    return err.message
  }
  return err instanceof Error ? err.message : fallback
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [wing, setWing] = useState('all')

  // Booking form — `selected` doubles as "the form is open".
  const [selected, setSelected] = useState<Service | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [flash, setFlash] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const [serviceResult, bookingResult] = await Promise.all([fetchServices(), fetchBookings()])
        if (!alive) return
        setServices(serviceResult.services)
        setStudioToday(serviceResult.studioToday)
        setBookings(bookingResult.bookings)
      } catch (err) {
        if (!alive) return
        setLoadError(describeError(err, 'Could not load the booking desk.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  /** Re-reads just the booking list — used after creating a row. */
  async function refreshBookings() {
    const result = await fetchBookings()
    setBookings(result.bookings)
  }

  function startBooking(service: Service) {
    setSelected(service)
    // Pre-fill with the studio's today so the field is never empty on open.
    setBookingDate(studioToday)
    setNotes('')
    setFormError('')
    setFlash('')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || submitting) return

    if (!bookingDate) {
      setFormError('Pick a date for the session.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const { booking } = await createBooking({
        serviceId: selected.id,
        bookingDate,
        notes: notes.trim() || undefined,
      })
      await refreshBookings()
      setSelected(null)
      setNotes('')
      setFlash(
        `Booked ${booking.serviceName} for ${formatDay(booking.bookingDate)} — reference ${booking.referenceCode}.`,
      )
    } catch (err) {
      setFormError(describeError(err, 'The booking could not be saved.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(booking: Booking) {
    if (cancellingId) return
    setCancellingId(booking.id)
    setFlash('')
    try {
      const { booking: updated } = await cancelBooking(booking.id)
      // Swap the one row: bookingDate is unchanged, so the list order holds.
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setFlash(`Cancelled ${updated.referenceCode}.`)
    } catch (err) {
      setFlash('')
      setLoadError(describeError(err, 'The booking could not be cancelled.'))
    } finally {
      setCancellingId('')
    }
  }

  const wings = ['all', ...Array.from(new Set(services.map((s) => s.wing)))]
  const visibleServices = services.filter((s) => wing === 'all' || s.wing === wing)

  if (loading) {
    return (
      <p role="status" className="text-sm text-text-muted">
        Loading the booking desk…
      </p>
    )
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">Booking Desk</h1>
          <p className="mt-1 text-xs font-bold tracking-widest text-primary uppercase">
            Reserve a session day
          </p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-text-muted">
          Pick a service and claim a day. Time slots and time blocks are coming — for now a booking
          covers the whole day.
        </p>
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

      {/* ------------------------------- catalog ------------------------------ */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          {wings.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={wing === w}
              onClick={() => setWing(w)}
              className={`rounded-lg px-4 py-2 text-xs font-bold tracking-widest uppercase transition ${
                wing === w
                  ? 'bg-primary-soft text-primary'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              {w === 'all' ? 'All services' : (WING_LABELS[w] ?? w)}
            </button>
          ))}
          <span className="ml-auto text-[11px] font-semibold tracking-widest text-text-muted uppercase">
            {visibleServices.length} service{visibleServices.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Booking form — opens when a service is chosen. */}
        {selected && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-primary/40 bg-primary-soft/30 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                  New booking
                </p>
                <h2 className="mt-1 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  {selected.unit} · {peso.format(selected.pricePhp)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setFormError('')
                }}
                aria-label="Close booking form"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface hover:text-text-primary"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
                >
                  Session date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  required
                  min={studioToday}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-text-muted">
                  Whole day. One booking per service per day.
                </p>
              </div>

              <div>
                <label
                  htmlFor="booking-notes"
                  className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="booking-notes"
                  rows={3}
                  maxLength={NOTES_MAX}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the studio should prepare…"
                  className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {formError && (
              <p role="alert" className="mt-4 text-sm text-error">
                {formError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Booking…' : 'Confirm booking'}
              </button>
              <p className="text-[11px] tracking-widest text-text-muted uppercase">
                No payment taken — the studio confirms your slot
              </p>
            </div>
          </form>
        )}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleServices.map((service) => (
            <li key={service.id}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                    {WING_LABELS[service.wing] ?? service.wing}
                  </p>
                  <p className="font-heading text-lg leading-none font-bold tracking-wide text-primary">
                    {peso.format(service.pricePhp)}
                  </p>
                </div>
                <h3 className="mt-3 font-heading text-base leading-tight font-bold tracking-wide uppercase">
                  {service.name}
                </h3>
                <p className="mt-1 text-[11px] tracking-widest text-text-muted uppercase">
                  {service.unit}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
                  {service.description}
                </p>
                <button
                  type="button"
                  onClick={() => startBooking(service)}
                  className="mt-5 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-primary/50 hover:text-text-primary"
                >
                  Book this service
                </button>
              </article>
            </li>
          ))}
        </ul>

        {visibleServices.length === 0 && (
          <p className="mt-6 text-sm text-text-muted">No services in this wing yet.</p>
        )}
      </section>

      {/* ------------------------------ my bookings --------------------------- */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold tracking-wide uppercase">
            <HugeiconsIcon icon={CalendarCheck01Icon} size={18} className="text-primary" />
            My bookings
          </h2>
          <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
            {bookings.length} total
          </p>
        </div>

        {bookings.length === 0 ? (
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
                    onClick={() => handleCancel(booking)}
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
    </div>
  )
}
