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
import { describeBookingError, fetchServices, type Service } from '../../../../lib/booking-api'
import { formatDay } from '../../../../lib/booking-format'
import CustomerFieldset from './CustomerFieldset'
import SessionFieldset from './SessionFieldset'
import type { CustomerMode } from './types'

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

  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<TagUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TagUser | null>(null)
  const [userSearchError, setUserSearchError] = useState('')

  const [guestName, setGuestName] = useState('')

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
    setGuestName('')
    setServiceId('')
    setNotes('')
    setBookingDate(studioToday)
    setFormError('')
    setCreated(null)
  }

  function handleModeChange(next: CustomerMode) {
    setMode(next)
    setFormError('')
  }

  function handleUserQueryChange(value: string) {
    setUserQuery(value)
    setSearchingUsers(value.trim().length > 0)
    setUserSearchError('')
    if (!value.trim()) setUserResults([])
  }

  function handlePickUser(candidate: TagUser) {
    setSelectedUser(candidate)
    setUserResults([])
  }

  function handleClearUser() {
    setSelectedUser(null)
    setUserQuery('')
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
          onServiceChange={setServiceId}
          bookingDate={bookingDate}
          studioToday={studioToday}
          onDateChange={setBookingDate}
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
