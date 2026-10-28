import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import type { PublicBlockout, Service } from '../../../../lib/booking-api'
import {
  BLOCKOUT_REASON_LABELS,
  isHourlyService,
  isTimeBasedService,
} from '../../../../lib/booking-api'
import { peso } from '../../../../lib/booking-format'
import { HOUR_OPTIONS, NOTES_MAX } from '../../../../lib/booking-constants'

type BookingFormProps = {
  service: Service
  studioToday: string
  bookingDate: string
  onDateChange: (value: string) => void
  bookingTime: string
  onTimeChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
  /** Set when the chosen day is closed; the form refuses to submit. */
  blockout: PublicBlockout | null
  formError: string
  submitting: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function BookingForm({
  service,
  studioToday,
  bookingDate,
  onDateChange,
  bookingTime,
  onTimeChange,
  notes,
  onNotesChange,
  blockout,
  formError,
  submitting,
  onClose,
  onSubmit,
}: BookingFormProps) {
  const timeBased = isTimeBasedService(service)
  const hourly = isHourlyService(service)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg space-y-5 rounded-xl border border-border bg-surface p-6 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">New booking</p>
          <h2 className="mt-1 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
            {service.name}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {service.unit} · {peso.format(service.pricePhp)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking form"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
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
            onChange={(e) => onDateChange(e.target.value)}
            aria-describedby={blockout ? 'booking-date-closed' : undefined}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          {blockout ? (
            <p
              id="booking-date-closed"
              role="alert"
              className="mt-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error"
            >
              The studio is unavailable on this day
              {blockout.reason ? ` (${BLOCKOUT_REASON_LABELS[blockout.reason]})` : ''}. Pick
              another date.
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-text-muted">
              {timeBased
                ? 'Pick the day for your session.'
                : 'Whole day. One live booking per customer, per service, per day.'}
            </p>
          )}
        </div>
        {timeBased && (
          <div>
            <label
              htmlFor="booking-time"
              className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
            >
              Session time
            </label>
            {hourly ? (
              <select
                id="booking-time"
                required
                value={bookingTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">Select a time</option>
                {HOUR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="booking-time"
                type="time"
                required
                value={bookingTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            )}
            <p className="mt-1.5 text-[11px] text-text-muted">
              {hourly
                ? 'Whole-hour blocks (e.g. 1:00 PM–2:00 PM) — studio (PH) timezone.'
                : '24-hour clock — time is in studio (PH) timezone'}
            </p>
          </div>
        )}

        <div className="sm:col-span-2">
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
            onChange={(e) => onNotesChange(e.target.value)}
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
          disabled={submitting || Boolean(blockout)}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
        <p className="text-[11px] tracking-widest text-text-muted uppercase">
          No payment taken — the studio confirms your slot
        </p>
      </div>
    </form>
    </div>
  )
}
