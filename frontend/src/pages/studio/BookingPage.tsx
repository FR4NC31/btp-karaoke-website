import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  BLOCKOUT_REASON_LABELS,
  BookingApiError,
  cancelBooking,
  createBooking,
  describeBookingError,
  fetchBlockouts,
  fetchBookings,
  fetchServices,
  isTimeBasedService,
  type Booking,
  type PublicBlockout,
  type Service,
} from '../../lib/booking-api'
import { WING_LABELS } from './components/booking/constants'
import { formatDay, nextOpenDay } from '../../lib/booking-format'
import BookingForm from './components/booking/BookingForm'
import BookingServiceCard from './components/booking/BookingServiceCard'
import BookingsPanel from './components/booking/BookingsPanel'
import { useSession } from '../../lib/auth-client'

/**
 * /studio/bookings — the booking desk.
 *
 * Per-day services claim a whole day; per-hour/minute services also take a
 * time slot (`HH:MM`, PH timezone) — migration 0008 added `bookingTime` plus
 * the day-wide and time-slot uniqueness indexes it sits under.
 * `service.durationDays` is turnaround metadata, not a claim on extra days.
 *
 * Every booking is created `pending`, which is the state an admin will later
 * confirm or reject (no online payment). The status column already carries
 * that workflow, so accepting a booking needs no schema change.
 *
 * Services and bookings both come from the backend (`/api/services`,
 * `/api/bookings`) — the catalog is real data, not the static module in
 * `data.ts`, so prices live in one place.
 */

/** Key for the in-progress booking form, so maximizing the player queue (which
 *  unmounts this page) does not wipe the customer's draft. */
const BOOKING_DRAFT_KEY = 'bookingFormDraft'

/** The API's list order: newest session day first, then newest booking first. */
function byNewest(a: Booking, b: Booking): number {
  if (a.bookingDate !== b.bookingDate) return a.bookingDate < b.bookingDate ? 1 : -1
  if (a.createdAt === b.createdAt) return 0
  return a.createdAt < b.createdAt ? 1 : -1
}

export default function BookingPage() {
  const { data: session } = useSession()
  const isVip = session?.user?.membershipTier === 'vip'
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockouts, setBlockouts] = useState<PublicBlockout[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [wing, setWing] = useState('all')

  // Booking form — `selected` doubles as "the form is open".
  const [selected, setSelected] = useState<Service | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [flash, setFlash] = useState('')
  const [cancellingId, setCancellingId] = useState('')
  // Bumped when a mutation starts, so a refresh that was already in flight
  // cannot overwrite the row set the mutation just produced.
  const bookingGeneration = useRef(0)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const [serviceResult, bookingResult, blockoutResult] = await Promise.all([
          fetchServices(),
          fetchBookings(),
          fetchBlockouts(),
        ])
        if (!alive) return
        setServices(serviceResult.services)
        setStudioToday(serviceResult.studioToday)
        setBookings(bookingResult.bookings)
        setBlockouts(blockoutResult.blockouts)

        // Restore an in-progress booking so maximizing the player queue (which
        // unmounts this page) does not wipe the customer's draft.
        try {
          const raw = window.sessionStorage.getItem(BOOKING_DRAFT_KEY)
          if (raw) {
            const draft = JSON.parse(raw) as {
              serviceId?: string
              bookingDate?: string
              bookingTime?: string
              notes?: string
            }
            const service = serviceResult.services.find((entry) => entry.id === draft.serviceId)
            if (service) {
              setSelected(service)
              setBookingDate(draft.bookingDate || serviceResult.studioToday)
              setBookingTime(draft.bookingTime || '')
              setNotes(draft.notes || '')
            }
          }
        } catch {
          // Ignore malformed drafts.
        }
      } catch (err) {
        if (!alive) return
        setLoadError(describeBookingError(err, 'Could not load the booking desk.'))
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
    const generation = bookingGeneration.current
    const result = await fetchBookings()
    if (generation !== bookingGeneration.current) return
    setBookings(result.bookings)
  }

  /**
   * Best-effort re-read after a mutation. The mutation already produced its
   * own outcome (success flash or error message), so a failed refresh must not
   * replace it — the next visit reads fresh rows anyway.
   */
  async function refreshBookingsQuietly() {
    try {
      await refreshBookings()
    } catch {
      // Keep the mutation's outcome on screen.
    }
  }

  function startBooking(service: Service) {
    setSelected(service)
    // Pre-fill with the first open day so a closed "today" does not greet the
    // customer with an error the moment the form opens.
    setBookingDate(
      nextOpenDay(studioToday, (day) => blockouts.some((b) => b.bookingDate === day)),
    )
    setBookingTime('')
    setNotes('')
    setFormError('')
    setFlash('')
  }

  // Persist the in-progress form so it survives the page unmounting when the
  // player queue is maximized from the player bar.
  useEffect(() => {
    if (!selected) {
      try {
        window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
      } catch {
        // Ignore storage failures.
      }
      return
    }
    try {
      window.sessionStorage.setItem(
        BOOKING_DRAFT_KEY,
        JSON.stringify({
          serviceId: selected.id,
          bookingDate,
          bookingTime,
          notes,
        }),
      )
    } catch {
      // Ignore storage failures.
    }
  }, [selected, bookingDate, bookingTime, notes])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || submitting) return

    if (!bookingDate) {
      setFormError('Pick a date for the session.')
      return
    }

    if (activeBlockout) {
      setFormError(
        `The studio is unavailable on ${formatDay(bookingDate)}${
          activeBlockout.reason ? ` (${BLOCKOUT_REASON_LABELS[activeBlockout.reason]})` : ''
        }. Pick another day.`,
      )
      return
    }

    // Time-based services require a time slot; per-day services omit it.
    const timePayload = isTimeBasedService(selected) ? bookingTime || undefined : undefined

    bookingGeneration.current += 1
    setSubmitting(true)
    setFormError('')
    setLoadError('')
    try {
      const { booking } = await createBooking({
        serviceId: selected.id,
        bookingDate,
        bookingTime: timePayload,
        notes: notes.trim() || undefined,
      })
      // Show the new row immediately, in the server's order, rather than
      // waiting on a second request; the quiet refresh reconciles the list.
      setBookings((prev) => [booking, ...prev].sort(byNewest))
      setSelected(null)
      try {
        window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
      } catch {
        // Ignore storage failures.
      }
      setNotes('')
      setFlash(
        `Booked ${booking.serviceName} for ${formatDay(booking.bookingDate)} ${booking.bookingTime ? `at ${booking.bookingTime.slice(0, 5)}` : ''} — reference ${booking.referenceCode}.`,
      )
      void refreshBookingsQuietly()
    } catch (err) {
      setFormError(describeBookingError(err, 'The booking could not be saved.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(booking: Booking) {
    if (cancellingId) return
    bookingGeneration.current += 1
    setCancellingId(booking.id)
    setFlash('')
    setLoadError('')
    try {
      const { booking: updated } = await cancelBooking(booking.id)
      // Swap the one row: bookingDate is unchanged, so the list order holds.
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setFlash(`Cancelled ${updated.referenceCode}.`)
    } catch (err) {
      setFlash('')
      setLoadError(describeBookingError(err, 'The booking could not be cancelled.'))
      // A 409/404 means this list is stale — re-read it so the row shows its
      // real state instead of a Cancel button the server will keep refusing.
      if (err instanceof BookingApiError && (err.status === 409 || err.status === 404)) {
        void refreshBookingsQuietly()
      }
    } finally {
      setCancellingId('')
    }
  }

  const wings = ['all', ...Array.from(new Set(services.map((s) => s.wing)))]
  const visibleServices = services.filter((s) => wing === 'all' || s.wing === wing)
  const activeBlockout = selected
    ? (blockouts.find((b) => b.bookingDate === bookingDate) ?? null)
    : null

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
          Per-hour services (recording, editing, coaching) book a date + a start time on the hour
          (e.g. 1:00 PM–2:00 PM) — open 24 hours. Per-song, per-video, per-day and per-event
          services book a date; rates marked “starting” are confirmed after consultation.
          {isVip && (
            <span className="mt-1 block font-semibold text-primary">
              VIP member: 20% off all services applied at checkout.
            </span>
          )}
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

      {blockouts.length > 0 && (
        <section
          aria-labelledby="closures-heading"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2
            id="closures-heading"
            className="font-heading text-sm font-bold tracking-widest uppercase"
          >
            Studio closures
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            These days are unavailable for new bookings.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {blockouts.map((blockout) => (
              <li
                key={blockout.bookingDate}
                className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-secondary"
              >
                <span className="font-semibold text-text-primary">
                  {formatDay(blockout.bookingDate)}
                </span>
                {blockout.reason ? ` — ${BLOCKOUT_REASON_LABELS[blockout.reason]}` : ''}
              </li>
            ))}
          </ul>
        </section>
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
          <BookingForm
            service={selected}
            studioToday={studioToday}
            bookingDate={bookingDate}
            onDateChange={setBookingDate}
            bookingTime={bookingTime}
            onTimeChange={setBookingTime}
            notes={notes}
            onNotesChange={setNotes}
            blockout={activeBlockout}
            formError={formError}
            submitting={submitting}
            onClose={() => {
              setSelected(null)
              setFormError('')
              try {
                window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
              } catch {
                // Ignore storage failures.
              }
            }}
            onSubmit={handleSubmit}
          />
        )}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleServices.map((service) => (
            <BookingServiceCard
              key={service.id}
              service={service}
              disabled={submitting}
              onBook={startBooking}
            />
          ))}
        </ul>

        {visibleServices.length === 0 && (
          <p className="mt-6 text-sm text-text-muted">No services in this wing yet.</p>
        )}
      </section>

      {/* ------------------------------ my bookings --------------------------- */}
      <BookingsPanel
        bookings={bookings}
        loadError={loadError}
        cancellingId={cancellingId}
        onCancel={handleCancel}
      />
    </div>
  )
}
