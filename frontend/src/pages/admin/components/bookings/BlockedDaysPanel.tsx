import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  createAdminBlockout,
  deleteAdminBlockout,
  fetchAdminBlockouts,
  type AdminBlockout,
} from '../../../../lib/admin-api'
import {
  BLOCKOUT_REASON_LABELS,
  BLOCKOUT_REASONS,
  describeBookingError,
  type BlockoutReason,
} from '../../../../lib/booking-api'
import { formatDay } from '../../../../lib/booking-format'

const NOTE_MAX = 500

type BlockedDaysPanelProps = {
  studioToday?: string
  initialDate?: string
}

/**
 * Admin-only closed-day management. Blocking a day never touches existing
 * reservations — the API refuses while live bookings remain on that day, so
 * the admin cancels/moves them first.
 */
export default function BlockedDaysPanel({
  studioToday: initialStudioToday = '',
  initialDate = '',
}: BlockedDaysPanelProps) {
  const [blockouts, setBlockouts] = useState<AdminBlockout[]>([])
  const [studioToday, setStudioToday] = useState(initialStudioToday)
  const [bookingDate, setBookingDate] = useState(initialDate)
  const [reason, setReason] = useState<BlockoutReason | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const result = await fetchAdminBlockouts()
        if (!alive) return
        setBlockouts(result.blockouts)
        setStudioToday(result.studioToday)
      } catch (err) {
        if (!alive) return
        setError(describeBookingError(err, 'Could not load the blocked days.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  async function refresh() {
    const result = await fetchAdminBlockouts()
    setBlockouts(result.blockouts)
  }

  async function handleBlock(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!bookingDate) {
      setError('Pick a day to block.')
      return
    }

    setBusy(true)
    setError('')
    setFlash('')
    try {
      const { blockout } = await createAdminBlockout({ bookingDate, reason, note })
      setFlash(
        `Blocked ${formatDay(blockout.bookingDate)}${
          blockout.reason ? ` (${BLOCKOUT_REASON_LABELS[blockout.reason]})` : ''
        }.`,
      )
      setBookingDate('')
      setReason('')
      setNote('')
      await refresh()
    } catch (err) {
      setError(describeBookingError(err, 'The day could not be blocked.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUnblock(blockout: AdminBlockout) {
    if (busy) return
    setBusy(true)
    setError('')
    setFlash('')
    try {
      await deleteAdminBlockout(blockout.id)
      setFlash(`Reopened ${formatDay(blockout.bookingDate)}.`)
      await refresh()
    } catch (err) {
      setError(describeBookingError(err, 'The day could not be reopened.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-labelledby="blocked-days-heading"
      className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="blocked-days-heading"
            className="font-heading text-sm font-bold tracking-widest uppercase"
          >
            Studio closures
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Close a whole day for maintenance, a private event, or no reason at all. Cancel or
            move live bookings first.
          </p>
        </div>
        <span className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
          {blockouts.length} upcoming
        </span>
      </div>

      <form onSubmit={handleBlock} className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="blockout-date"
            className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
          >
            Day
          </label>
          <input
            id="blockout-date"
            type="date"
            required
            min={studioToday || undefined}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="blockout-reason"
            className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
          >
            Reason (optional)
          </label>
          <select
            id="blockout-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as BlockoutReason | '')}
            className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">No reason</option>
            {BLOCKOUT_REASONS.map((value) => (
              <option key={value} value={value}>
                {BLOCKOUT_REASON_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex-1">
          <label
            htmlFor="blockout-note"
            className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
          >
            Note (optional)
          </label>
          <input
            id="blockout-note"
            type="text"
            maxLength={NOTE_MAX}
            placeholder="Internal note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Block this day'}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      {flash && (
        <p role="status" className="flex items-start gap-2.5 text-sm text-success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mt-0.5 shrink-0" />
          {flash}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-text-muted">Loading blocked days…</p>
      ) : blockouts.length === 0 ? (
        <p className="text-xs text-text-muted">No upcoming blocked days.</p>
      ) : (
        <ul className="space-y-2">
          {blockouts.map((blockout) => (
            <li
              key={blockout.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {formatDay(blockout.bookingDate)}
                  {blockout.reason ? ` — ${BLOCKOUT_REASON_LABELS[blockout.reason]}` : ''}
                </p>
                {blockout.note && <p className="mt-0.5 text-xs text-text-muted">{blockout.note}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleUnblock(blockout)}
                disabled={busy}
                aria-label={`Unblock ${formatDay(blockout.bookingDate)}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
