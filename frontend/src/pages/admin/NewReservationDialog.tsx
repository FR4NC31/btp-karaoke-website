import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import {
  createAdminBooking,
  searchUsers,
  type AdminBooking,
  type TagUser,
} from '../../lib/admin-api'
import { describeBookingError, fetchServices, type Service } from '../../lib/booking-api'
import { formatDay, peso } from '../../lib/booking-format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

/**
 * "New reservation" modal — take a reservation for someone else without
 * leaving the desk page. Hosted by AdminShell (lib/new-reservation-dialog.ts
 * exposes it through the outlet context) and opened by the + New reservation
 * buttons on Overview and Reservations; the old /admin/bookings/new page is
 * gone.
 *
 * Two customer kinds, exactly one of which is required (the backend's
 * booking_owner_check enforces the same rule in the database):
 *
 *  - "Registered customer": type to search accounts, tag one — the booking
 *    lands in their own /studio/bookings list under their account.
 *  - "Guest": type a name for a walk-in / phone caller with no account.
 *
 * Creates the reservation `confirmed`: the admin taking it is the approval
 * step, so it does not enter the pending queue.
 */

const NOTES_MAX = 500

type CustomerMode = 'user' | 'guest'

type NewReservationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fired after a save — AdminShell bumps its reservation revision. */
  onCreated: () => void
}

export default function NewReservationDialog({
  open,
  onOpenChange,
  onCreated,
}: NewReservationDialogProps) {
  // Keep the modal open while a save is in flight: dismissing it mid-request
  // would hide the result (or error) after the booking may already exist.
  const [busy, setBusy] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="border border-border bg-surface p-6 text-text-primary sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-bold tracking-wide uppercase">
            New reservation
          </DialogTitle>
          <DialogDescription className="text-xs font-bold tracking-widest text-primary uppercase">
            Taken by the studio — confirmed on save
          </DialogDescription>
        </DialogHeader>

        {/* Radix unmounts the content while closed, so the form remounts fresh
            (service catalog refetched included) every time it opens. */}
        <NewReservationForm
          onClose={() => onOpenChange(false)}
          onCreated={onCreated}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  )
}

function NewReservationForm({
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
        const result = await fetchServices()
        if (!alive) return
        setServices(result.services)
        setStudioToday(result.studioToday)
        // Pre-fill with the studio's today so the field is never empty.
        setBookingDate(result.studioToday)
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

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [services, serviceId],
  )

  function resetForm() {
    setSelectedUser(null)
    setUserQuery('')
    setUserResults([])
    setGuestName('')
    setServiceId('')
    setNotes('')
    setBookingDate(studioToday)
    setFormError('')
    setCreated(null)
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

    setSubmitting(true)
    onBusyChange(true)
    setFormError('')
    try {
      const { booking } = await createAdminBooking({
        userId: mode === 'user' ? selectedUser?.id : undefined,
        guestName: mode === 'guest' ? guestName.trim() : undefined,
        serviceId,
        bookingDate,
        notes: notes.trim() || undefined,
      })
      setCreated(booking)
      setSelectedUser(null)
      setUserQuery('')
      setUserResults([])
      setGuestName('')
      setServiceId('')
      setNotes('')
      setBookingDate(studioToday)
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
        {/* ------------------------- who is it for? -------------------------- */}
        <fieldset className="rounded-xl border border-border bg-surface p-5">
          <legend className="px-1 text-[11px] font-bold tracking-widest text-text-secondary uppercase">
            Customer
          </legend>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={mode === 'user'}
              onClick={() => {
                setMode('user')
                setFormError('')
              }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold tracking-widest uppercase transition ${
                mode === 'user'
                  ? 'bg-primary-soft text-primary'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <HugeiconsIcon icon={UserMultiple02Icon} size={14} />
              Registered customer
            </button>
            <button
              type="button"
              aria-pressed={mode === 'guest'}
              onClick={() => {
                setMode('guest')
                setFormError('')
              }}
              className={`rounded-lg px-4 py-2 text-xs font-bold tracking-widest uppercase transition ${
                mode === 'guest'
                  ? 'bg-primary-soft text-primary'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              Guest name
            </button>
          </div>

          {mode === 'user' ? (
            <div className="mt-4">
              {selectedUser ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary-soft/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{selectedUser.name}</p>
                    <p className="text-xs text-text-muted">{selectedUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null)
                      setUserQuery('')
                    }}
                    aria-label="Clear selected customer"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface hover:text-text-primary"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="customer-search"
                    className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
                  >
                    Find an account
                  </label>
                  <div className="relative mt-2">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={15}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      id="customer-search"
                      type="search"
                      placeholder="Name or email…"
                      value={userQuery}
                      onChange={(e) => {
                        const value = e.target.value
                        setUserQuery(value)
                        // Mirrors what the dropdown shows: an empty box has
                        // nothing to search; anything else reads as
                        // "Searching…" until the debounced request settles.
                        setSearchingUsers(value.trim().length > 0)
                        setUserSearchError('')
                        if (!value.trim()) setUserResults([])
                      }}
                      onKeyDown={(e) => {
                        // Enter has nothing to select here; without this it
                        // submits the whole reservation form and reports
                        // "Pick a customer" instead of finishing the search.
                        if (e.key === 'Enter') e.preventDefault()
                      }}
                      className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  {userQuery.trim() && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface-elevated">
                      {searchingUsers ? (
                        <p className="px-4 py-3 text-xs text-text-muted">Searching…</p>
                      ) : userSearchError ? (
                        <p role="alert" className="px-4 py-3 text-xs text-error">
                          {userSearchError}
                        </p>
                      ) : userResults.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-text-muted">
                          No accounts match “{userQuery.trim()}”.
                        </p>
                      ) : (
                        <ul>
                          {userResults.map((candidate) => (
                            <li key={candidate.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(candidate)
                                  setUserResults([])
                                }}
                                className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-surface"
                              >
                                <span className="text-sm font-semibold">{candidate.name}</span>
                                <span className="text-xs text-text-muted">{candidate.email}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <label
                htmlFor="guest-name"
                className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
              >
                Guest name
              </label>
              <input
                id="guest-name"
                type="text"
                maxLength={120}
                placeholder="Walk-in or phone caller, e.g. “Mara Santos”"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-text-muted">
                No account needed — the reservation is held under this name.
              </p>
            </div>
          )}
        </fieldset>

        {/* --------------------------- the session --------------------------- */}
        <fieldset className="rounded-xl border border-border bg-surface p-5">
          <legend className="px-1 text-[11px] font-bold tracking-widest text-text-secondary uppercase">
            Session
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="service"
                className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
              >
                Service
              </label>
              <select
                id="service"
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="" disabled>
                  Pick a service…
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {peso.format(service.pricePhp)}
                  </option>
                ))}
              </select>
              {selectedService && (
                <p className="mt-1.5 text-[11px] text-text-muted">
                  {selectedService.unit} · {peso.format(selectedService.pricePhp)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="session-date"
                className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
              >
                Session date
              </label>
              <input
                id="session-date"
                type="date"
                required
                min={studioToday}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-text-muted">
                Whole day. One live booking per customer per service per day.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="reservation-notes"
              className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
            >
              Notes (optional)
            </label>
            <textarea
              id="reservation-notes"
              rows={3}
              maxLength={NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contact details, special setup, anything the studio should know…"
              className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </fieldset>

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
