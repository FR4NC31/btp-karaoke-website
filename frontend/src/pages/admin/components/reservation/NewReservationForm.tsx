import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  createAdminBooking,
  searchUsers,
  type AdminBooking,
  type TagUser,
} from '../../../../lib/admin-api'
import {
  BLOCKOUT_REASON_LABELS,
  describeBookingError,
  fetchBlockouts,
  fetchServices,
  isTimeBasedService,
  type PublicBlockout,
  type Service,
} from '../../../../lib/booking-api'
import { formatDay, nextOpenDay } from '../../../../lib/booking-format'
import CustomerFieldset from './CustomerFieldset'
import SessionFieldset from './SessionFieldset'
import type { CustomerMode } from './types'

/**
 * The reservation form inside the modal: customer kind, guest/customer pick,
 * session fields, validation, save, and the success panel. Radix unmounts the
 * dialog content while closed, so this remounts fresh (service catalog
 * refetched included) every time it opens.
 *
 * Creates the reservation `confirmed`: the admin taking it is the approval
 * step, so it does not enter the pending queue.
 */
export default function NewReservationForm({
  onClose,
  onCreated,
  onBusyChange,
}: {
  onClose: () => void
  onCreated: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const [mode, setMode] = useState<CustomerMode>('user')

  // Registered-customer search
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<TagUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TagUser | null>(null)
  // A failed search used to look identical to an empty result — "No accounts
  // match" — which invites an admin to book a registered customer as a guest.
  const [userSearchError, setUserSearchError] = useState('')

  // Guest name
  const [guestName, setGuestName] = useState('')

  // Reservation fields
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [blockouts, setBlockouts] = useState<PublicBlockout[]>([])
  const [studioToday, setStudioToday] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState<AdminBooking | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const [serviceResult, blockoutResult] = await Promise.all([
          fetchServices(),
          fetchBlockouts(),
        ])
        if (!alive) return
        setServices(serviceResult.services)
        setStudioToday(serviceResult.studioToday)
        setBlockouts(blockoutResult.blockouts)
        // Pre-fill with the first open day so a closed "today" does not fail
        // on submit for a reason the admin has not seen yet.
        setBookingDate(
          nextOpenDay(serviceResult.studioToday, (day) =>
            blockoutResult.blockouts.some((blockout: { bookingDate: string }) => blockout.bookingDate === day),
          ),
        )
      } catch (err) {
        if (!alive) return
        setLoadError(describeBookingError(err, 'Could not load the service catalog.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  function isBlockedDay(day: string): boolean {
    return blockouts.some((blockout) => blockout.bookingDate === day)
  }

  function firstOpenDay(): string {
    return nextOpenDay(studioToday, isBlockedDay)
  }

  // Debounced customer search. Runs only while someone is actually picking a
  // registered customer — the guest tab never hits the endpoint. The state
  // updates that can happen immediately (clearing for an empty box, showing
  // "Searching…") live in the change handler, so this effect only schedules
  // work asynchronously.
  useEffect(() => {
    if (mode !== 'user' || selectedUser) return
    const query = userQuery.trim()
    if (!query) return

    let alive = true
    const timer = setTimeout(async () => {
      try {
        const { users } = await searchUsers(query)
        if (alive) {
          setUserResults(users)
          setUserSearchError('')
        }
      } catch (err) {
        // A failed search must not block typing, but it must not read as
        // "no matches" either — that is how a registered customer ends up
        // booked as a guest.
        if (alive) {
          setUserResults([])
          setUserSearchError(describeBookingError(err, 'Could not search accounts.'))
        }
      } finally {
        if (alive) setSearchingUsers(false)
      }
    }, 300)

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [mode, userQuery, selectedUser])

  function resetForm() {
    setSelectedUser(null)
    setUserQuery('')
    setUserResults([])
    setSearchingUsers(false)
    setUserSearchError('')
    setGuestName('')
    setServiceId('')
    setBookingTime('')
    setNotes('')
    setBookingDate(firstOpenDay())
    setFormError('')
    setCreated(null)
  }

  /**
   * Switching customer kinds drops the previous kind's validation error,
   * including a search failure: the submit path reads `userSearchError`, so
   * leaving it behind would blame a search the admin has already left.
   */
  function handleModeChange(next: CustomerMode) {
    setMode(next)
    setFormError('')
    setUserSearchError('')
    setSearchingUsers(next === 'user' && userQuery.trim().length > 0 && !selectedUser)
  }

  /** Mirrors the search dropdown's immediate states; the request follows. */
  function handleUserQueryChange(value: string) {
    setUserQuery(value)
    // An empty box has nothing to search; anything else reads as
    // "Searching…" until the debounced request settles.
    setSearchingUsers(value.trim().length > 0)
    setUserSearchError('')
    if (!value.trim()) setUserResults([])
  }

  function handlePickUser(candidate: TagUser) {
    setSelectedUser(candidate)
    setUserResults([])
    setSearchingUsers(false)
    setUserSearchError('')
  }

  function handleClearUser() {
    setSelectedUser(null)
    setUserQuery('')
    setUserResults([])
    setSearchingUsers(false)
    setUserSearchError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    if (mode === 'user' && !selectedUser) {
      setFormError(
        userSearchError
          ? 'The customer search failed. Try again, or switch to a guest name.'
          : 'Pick a registered customer, or switch to a guest name.',
      )
      return
    }
    if (mode === 'guest' && !guestName.trim()) {
      setFormError('Type the guest name.')
      return
    }
    if (!serviceId) {
      setFormError('Pick a service.')
      return
    }
    if (!bookingDate) {
      setFormError('Pick a date for the session.')
      return
    }

    const selectedService = services.find((service) => service.id === serviceId) ?? null
    const timeBased = selectedService ? isTimeBasedService(selectedService) : false
    const activeBlockout =
      blockouts.find((blockout) => blockout.bookingDate === bookingDate) ?? null

    if (activeBlockout) {
      setFormError(
        `The studio is unavailable on ${formatDay(bookingDate)}${
          activeBlockout.reason ? ` (${BLOCKOUT_REASON_LABELS[activeBlockout.reason]})` : ''
        }. Pick another day.`,
      )
      return
    }
    if (timeBased && !bookingTime) {
      setFormError('Pick a start time for this service.')
      return
    }

    setSubmitting(true)
    onBusyChange(true)
    setFormError('')
    try {
      const { booking } = await createAdminBooking({
        userId: mode === 'user' ? selectedUser?.id : undefined,
        guestName: mode === 'guest' ? guestName.trim() : undefined,
        serviceId,
        bookingDate,
        bookingTime: timeBased ? bookingTime : undefined,
        notes: notes.trim() || undefined,
      })
      setCreated(booking)
      setSelectedUser(null)
      setUserQuery('')
      setUserResults([])
      setSearchingUsers(false)
      setUserSearchError('')
      setGuestName('')
      setServiceId('')
      setBookingTime('')
      setNotes('')
      setBookingDate(firstOpenDay())
      // The desk pages behind the modal show the new row right away.
      onCreated()
    } catch (err) {
      setFormError(describeBookingError(err, 'The reservation could not be saved.'))
    } finally {
      setSubmitting(false)
      onBusyChange(false)
    }
  }

  if (loading) {
    return (
      <p role="status" className="text-sm text-text-muted">
        Loading the service catalog…
      </p>
    )
  }

  const activeBlockout =
    blockouts.find((blockout) => blockout.bookingDate === bookingDate) ?? null

  return (
    <div className="space-y-6">
      {loadError && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </p>
      )}

      {created && (
        <div
          role="status"
          className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <p className="flex items-start gap-2.5">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
            Reserved {created.serviceName} for {created.customerName} on{' '}
            {formatDay(created.bookingDate)} — reference {created.referenceCode} ({created.status}).
          </p>
          <div className="mt-3 flex flex-wrap gap-3 pl-6.5">
            <Link
              to="/admin/bookings"
              onClick={onClose}
              className="font-bold tracking-widest uppercase underline-offset-4 hover:underline"
            >
              View reservations
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="font-bold tracking-widest uppercase underline-offset-4 hover:underline"
            >
              Add another
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <CustomerFieldset
          mode={mode}
          onModeChange={handleModeChange}
          selectedUser={selectedUser}
          onClearUser={handleClearUser}
          userQuery={userQuery}
          onUserQueryChange={handleUserQueryChange}
          searchingUsers={searchingUsers}
          userSearchError={userSearchError}
          userResults={userResults}
          onPickUser={handlePickUser}
          guestName={guestName}
          onGuestNameChange={setGuestName}
        />

        <SessionFieldset
          services={services}
          serviceId={serviceId}
          onServiceChange={(value) => {
            setServiceId(value)
            // A slot picked for the previous service must not leak into the
            // next one (or into a day-based service's payload).
            setBookingTime('')
          }}
          bookingDate={bookingDate}
          studioToday={studioToday}
          onDateChange={setBookingDate}
          bookingTime={bookingTime}
          onTimeChange={setBookingTime}
          blockout={activeBlockout}
          notes={notes}
          onNotesChange={setNotes}
        />

        {formError && (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save reservation'}
          </button>
          <p className="text-[11px] tracking-widest text-text-muted uppercase">
            Saved as confirmed — no approval step needed
          </p>
        </div>
      </form>
    </div>
  )
}
