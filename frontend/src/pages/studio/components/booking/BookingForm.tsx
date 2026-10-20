import type { FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import type { Service } from '../../../../lib/booking-api'
import { peso } from '../../../../lib/booking-format'
import { NOTES_MAX } from '../../../../lib/booking-constants'

type BookingFormProps = {
  service: Service
  studioToday: string
  bookingDate: string
  onDateChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
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
  notes,
  onNotesChange,
  formError,
  submitting,
  onClose,
  onSubmit,
}: BookingFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-primary/40 bg-primary-soft/30 p-5">
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
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <p className="mt-1.5 text-[11px] text-text-muted">
            Whole day. One live booking per customer, per service, per day.
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
  )
}
