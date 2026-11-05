import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Archive01Icon, Calendar01Icon, CalendarRemove01Icon } from '@hugeicons/core-free-icons'
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
  rescheduleBooking,
  uploadReceipt,
  type Booking,
  type PublicBlockout,
  type Service,
} from '../../lib/booking-api'
import { WING_LABELS } from './components/booking/constants'
import { formatDay, formatTime12h, nextOpenDay } from '../../lib/booking-format'
import BookingForm, { type PaymentChoice } from './components/booking/BookingForm'
import BookingToolbar, { type BookingTab } from './components/booking/BookingToolbar'
import BookingsPanel from './components/booking/BookingsPanel'
import BookingsSkeleton from './components/booking/BookingsSkeleton'
import CancelReservationDialog from './components/booking/CancelReservationDialog'
import FlashToast from './components/booking/FlashToast'
import ReservationAddedDialog from './components/booking/ReservationAddedDialog'
import ReservationDetailsDialog from './components/booking/ReservationDetailsDialog'
import ServiceCatalog from './components/booking/ServiceCatalog'
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
 *
 * The page is the booking-desk mockup's two views: `bookings` (reservation
 * overview card, the My bookings list, the empty state) and `services` (policy
 * banner, wing filter pills, catalogue rows). The toolbar switches between
 * them; picking a service opens the booking form as a modal on top.
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
  const membershipTier = session?.user?.membershipTier
  const membershipExpiresAt = session?.user?.membershipExpiresAt
  const isVip =
    membershipTier === 'vip' &&
    (!membershipExpiresAt || String(membershipExpiresAt).slice(0, 10) >= new Date().toISOString().slice(0, 10))
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockouts, setBlockouts] = useState<PublicBlockout[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [wing, setWing] = useState('all')
  // Which of the mockup's two views is on screen, and the catalogue search.
  const [tab, setTab] = useState<BookingTab>('bookings')
  const [query, setQuery] = useState('')

  // Booking form — `selected` doubles as "the form is open".
  const [selected, setSelected] = useState<Service | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [flash, setFlash] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  // Reservation actions from the mockup: the archive toggle, the "Reservation
  // Added!" popup, and the row menu's details / reschedule / cancel flows.
  const [showArchived, setShowArchived] = useState(false)
  const [addedBooking, setAddedBooking] = useState<Booking | null>(null)
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelError, setCancelError] = useState('')
  const [rescheduling, setRescheduling] = useState<Booking | null>(null)

  // Payment is part of the one booking modal: no method picked yet, no receipt.
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>('')
  const [receipt, setReceipt] = useState<File | null>(null)
  /**
   * Row created by a submit whose receipt upload then failed: the slot is
   * already taken, so a retry re-uploads instead of creating a second row.
   * Cleared on success, on close, and whenever the form inputs change.
   */
  const heldBooking = useRef<Booking | null>(null)
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
            const service = serviceResult.services.find((entry: Service) => entry.id === draft.serviceId)
            if (service) {
              setSelected(service)
              // The form lives on the catalogue view — follow the draft there.
              setTab('services')
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

  /**
   * Releases a row a failed submit left behind. Best-effort: if the cancel
   * fails, the 5-minute payment hold expires on its own.
   */
  function releaseHold() {
    const held = heldBooking.current
    if (!held) return
    heldBooking.current = null
    void cancelBooking(held.id).catch(() => {
      // The 5-minute expiry will release it anyway.
    })
  }

  function startBooking(service: Service) {
    releaseHold()
    setSelected(service)
    // Pre-fill with the first open day so a closed "today" does not greet the
    // customer with an error the moment the form opens.
    setBookingDate(
      nextOpenDay(studioToday, (day) => blockouts.some((b) => b.bookingDate === day)),
    )
    setBookingTime('')
    setNotes('')
    setPaymentMethod('')
    setReceipt(null)
    setFormError('')
    setFlash('')
  }

  /** Closes the modal, dropping the draft and any half-finished hold. */
  function closeForm() {
    if (submitting) return
    releaseHold()
    setSelected(null)
    setRescheduling(null)
    setPaymentMethod('')
    setReceipt(null)
    setFormError('')
    try {
      window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
    } catch {
      // Ignore storage failures.
    }
  }

  // Persist the in-progress form so it survives the page unmounting when the
  // player queue is maximized from the player bar. Change Schedule never
  // writes a draft — restoring one would reopen it as a fresh booking.
  useEffect(() => {
    if (!selected || rescheduling) {
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
  }, [selected, rescheduling, bookingDate, bookingTime, notes])

  /**
   * The single Confirm Booking submit: create the row (payment method locked
   * in the same call), then attach the GCash receipt when that method is
   * chosen. A receipt failure keeps `heldBooking` so the retry only re-uploads
   * — the customer never ends up with two rows for one attempt.
   */
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

    // Change Schedule — same modal, schedule-only submit: payment, receipt
    // and status stay as they are, only the day/slot/notes move.
    if (rescheduling) {
      bookingGeneration.current += 1
      setSubmitting(true)
      setFormError('')
      setLoadError('')
      try {
        const timePayload = isTimeBasedService(selected) ? bookingTime || undefined : undefined
        const { booking: updated } = await rescheduleBooking(rescheduling.id, {
          bookingDate,
          bookingTime: timePayload,
          notes: notes.trim(),
        })
        setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)).sort(byNewest))
        setRescheduling(null)
        setSelected(null)
        setPaymentMethod('')
        setReceipt(null)
        setBookingTime('')
        setNotes('')
        try {
          window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
        } catch {
          // Ignore storage failures.
        }
        setFlash(
          `Successfully rescheduled to ${formatDay(updated.bookingDate)}${
            updated.bookingTime ? ` at ${formatTime12h(updated.bookingTime)}` : ''
          }.`,
        )
        void refreshBookingsQuietly()
      } catch (err) {
        setFormError(describeBookingError(err, 'The schedule could not be updated.'))
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!paymentMethod) {
      setFormError('Choose a payment method — GCash or In Person.')
      return
    }

    if (paymentMethod === 'gcash' && !receipt) {
      setFormError('Upload your GCash payment receipt.')
      return
    }

    bookingGeneration.current += 1
    setSubmitting(true)
    setFormError('')
    setLoadError('')
    try {
      let booking: Booking
      if (heldBooking.current) {
        // The row already exists from a failed attempt — just finish the receipt.
        booking = heldBooking.current
      } else {
        const timePayload = isTimeBasedService(selected) ? bookingTime || undefined : undefined
        const created = await createBooking({
          serviceId: selected.id,
          bookingDate,
          bookingTime: timePayload,
          notes: notes.trim() || undefined,
          paymentMethod,
        })
        booking = created.booking
        // Store it immediately so a failed receipt upload can be retried
        // against the same row instead of creating a duplicate.
        heldBooking.current = booking
      }

      if (paymentMethod === 'gcash' && receipt) {
        const result = await uploadReceipt(booking.id, receipt)
        booking = result.booking
      }
      heldBooking.current = null

      setBookings((prev) => [booking, ...prev].sort(byNewest))
      setSelected(null)
      // The mockup's "Reservation Added!" popup carries the summary; its
      // "View My Bookings" button is what navigates back to the overview.
      setAddedBooking(booking)
      try {
        window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
      } catch {
        // Ignore storage failures.
      }
      setBookingTime('')
      setNotes('')
      setPaymentMethod('')
      setReceipt(null)
      void refreshBookingsQuietly()
    } catch (err) {
      // A 404 means the held row vanished server-side — a retry must recreate it.
      if (err instanceof BookingApiError && err.status === 404) {
        heldBooking.current = null
      }
      setFormError(describeBookingError(err, 'The booking could not be saved.'))
    } finally {
      setSubmitting(false)
    }
  }

  /** Opens the "modal for sureness" instead of cancelling straight away. */
  function requestCancel(booking: Booking) {
    setCancelTarget(booking)
    setCancelError('')
    setFlash('')
    setLoadError('')
  }

  /** Confirms the cancellation from that dialog. */
  async function handleCancel() {
    const target = cancelTarget
    if (!target || cancellingId) return
    bookingGeneration.current += 1
    setCancellingId(target.id)
    setCancelError('')
    setFlash('')
    setLoadError('')
    try {
      const { booking: updated } = await cancelBooking(target.id)
      // Swap the one row: bookingDate is unchanged, so the list order holds.
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setCancelTarget(null)
      setFlash('Successfully cancelled your reservation.')
    } catch (err) {
      const message = describeBookingError(err, 'The booking could not be cancelled.')
      if (err instanceof BookingApiError && (err.status === 409 || err.status === 404)) {
        // Stale list — close the dialog and re-read so the row shows its real
        // state instead of a cancel action the server will keep refusing.
        setCancelTarget(null)
        setLoadError(message)
        void refreshBookingsQuietly()
      } else {
        // Retryable: keep the dialog open with the error inside it.
        setCancelError(message)
      }
    } finally {
      setCancellingId('')
    }
  }

  /** Change Schedule: the booking form again, prefilled from the row. */
  function openReschedule(booking: Booking) {
    const service = services.find((entry) => entry.id === booking.serviceId)
    if (!service) return
    releaseHold()
    setRescheduling(booking)
    setSelected(service)
    setBookingDate(booking.bookingDate)
    setBookingTime(booking.bookingTime ? booking.bookingTime.slice(0, 5) : '')
    setNotes(booking.notes ?? '')
    // Hidden in reschedule mode, but kept consistent so closing resets cleanly.
    setPaymentMethod(booking.paymentMethod ?? 'filler')
    setReceipt(null)
    setFormError('')
    setFlash('')
  }

  const wings = ['all', ...Array.from(new Set(services.map((s) => s.wing)))]
  const needle = query.trim().toLowerCase()
  const visibleServices = services.filter((service) => {
    if (wing !== 'all' && service.wing !== wing) return false
    if (!needle) return true
    return [service.name, service.description, service.unit, WING_LABELS[service.wing] ?? service.wing].some(
      (field) => field.toLowerCase().includes(needle),
    )
  })
  const activeBlockout = selected
    ? (blockouts.find((b) => b.bookingDate === bookingDate) ?? null)
    : null

  // The archive toggle hides terminal rows (cancelled/rejected/completed)
  // from the default list; flipping it in the overview brings them back.
  const visibleBookings = showArchived
    ? bookings
    : bookings.filter(
        (b) => b.status !== 'cancelled' && b.status !== 'rejected' && b.status !== 'completed',
      )

  // The whole desk pulses while the catalogue, list and closures load —
  // the landing (reservations) view, mirrored block for block.
  if (loading) return <BookingsSkeleton />

  return (
    <div className="space-y-6">
      <BookingToolbar
        tab={tab}
        onTabChange={setTab}
        bookingCount={visibleBookings.length}
        query={query}
        onQueryChange={setQuery}
        studioOpen={!blockouts.some((b) => b.bookingDate === studioToday)}
      />

      {loadError && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </p>
      )}

      {flash && <FlashToast key={flash} message={flash} onDismiss={() => setFlash('')} />}

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

      {tab === 'bookings' ? (
        <>
          {/* ---------------------- reservation overview -------------------- */}
          <section
            aria-labelledby="reservation-overview-heading"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <HugeiconsIcon icon={Calendar01Icon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="reservation-overview-heading" className="text-xl font-bold tracking-wide">
                  Reservation Overview
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Manage your active studio reservations or add new service sessions below.
                </p>
              </div>
              {/* Icon-only archive toggle — no text, per the mockup. */}
              <button
                type="button"
                aria-pressed={showArchived}
                aria-label={showArchived ? 'Hide archived bookings' : 'Show archived bookings'}
                title={showArchived ? 'Hide archived bookings' : 'Show archived bookings'}
                onClick={() => setShowArchived((shown) => !shown)}
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-primary"
              >
                <HugeiconsIcon icon={Archive01Icon} size={18} />
              </button>
            </div>

            {/* Empty state lives inside the overview panel, below its header. */}
            {visibleBookings.length === 0 && !loadError && (
              <div className="mt-5 flex flex-col items-center rounded-xl border border-border bg-surface-elevated px-6 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-surface text-primary">
                  <HugeiconsIcon icon={CalendarRemove01Icon} size={26} />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-wide">
                  No Reservations Selected Yet
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
                  Your reservation desk is currently empty. Pick services from our studio catalogue
                  to get started.
                </p>
              </div>
            )}
          </section>

          {/* ------------------------------ my bookings --------------------- */}
          {visibleBookings.length > 0 && (
            <BookingsPanel
              bookings={visibleBookings}
              onViewDetails={setDetailsBooking}
              onReschedule={openReschedule}
              onCancel={requestCancel}
            />
          )}
        </>
      ) : (
        <ServiceCatalog
          wings={wings}
          wing={wing}
          onWingChange={setWing}
          services={visibleServices}
          isVip={isVip}
          disabled={submitting}
          onBack={() => setTab('bookings')}
          onBook={startBooking}
        />
      )}

      {/* Booking form — opens when a service is chosen (create) or when the
          row menu picks Change Schedule (reschedule). */}
      {selected && (
        <BookingForm
          service={selected}
          mode={rescheduling ? 'reschedule' : 'create'}
          studioToday={studioToday}
          bookingDate={bookingDate}
          onDateChange={(value) => {
            releaseHold()
            setFormError('')
            setBookingDate(value)
          }}
          bookingTime={bookingTime}
          onTimeChange={(value) => {
            releaseHold()
            setFormError('')
            setBookingTime(value)
          }}
          notes={notes}
          onNotesChange={(value) => {
            releaseHold()
            setFormError('')
            setNotes(value)
          }}
          blockedDates={blockouts.map((blockout) => blockout.bookingDate)}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={(value) => {
            releaseHold()
            setFormError('')
            setPaymentMethod(value)
            if (value !== 'gcash') setReceipt(null)
          }}
          receipt={receipt}
          onReceiptChange={setReceipt}
          blockout={activeBlockout}
          formError={formError}
          submitting={submitting}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {/* "Reservation Added!" — the mockup's success popup after a create. */}
      {addedBooking && (
        <ReservationAddedDialog
          booking={addedBooking}
          onViewBookings={() => {
            setAddedBooking(null)
            setTab('bookings')
          }}
        />
      )}

      {/* View Details — read-only summary of one reservation. */}
      {detailsBooking && (
        <ReservationDetailsDialog
          booking={detailsBooking}
          onClose={() => setDetailsBooking(null)}
        />
      )}

      {/* Cancel Session — the confirmation modal for sureness. */}
      {cancelTarget && (
        <CancelReservationDialog
          booking={cancelTarget}
          busy={cancellingId === cancelTarget.id}
          error={cancelError}
          onConfirm={handleCancel}
          onDismiss={() => {
            if (cancellingId) return
            setCancelTarget(null)
            setCancelError('')
          }}
        />
      )}
    </div>
  )
}
