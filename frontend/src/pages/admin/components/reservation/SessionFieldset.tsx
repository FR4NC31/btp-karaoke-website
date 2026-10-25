import { useMemo } from 'react'
import type { PublicBlockout, Service } from '../../../../lib/booking-api'
import {
  BLOCKOUT_REASON_LABELS,
  isHourlyService,
  isTimeBasedService,
} from '../../../../lib/booking-api'
import { HOUR_OPTIONS, NOTES_MAX } from '../../../../lib/booking-constants'
import { peso } from '../../../../lib/booking-format'

type SessionFieldsetProps = {
  services: Service[]
  serviceId: string
  onServiceChange: (value: string) => void
  bookingDate: string
  studioToday: string
  onDateChange: (value: string) => void
  bookingTime: string
  onTimeChange: (value: string) => void
  /** Set when the chosen day is closed; the form refuses to submit. */
  blockout: PublicBlockout | null
  notes: string
  onNotesChange: (value: string) => void
}

export default function SessionFieldset({
  services,
  serviceId,
  onServiceChange,
  bookingDate,
  studioToday,
  onDateChange,
  bookingTime,
  onTimeChange,
  blockout,
  notes,
  onNotesChange,
}: SessionFieldsetProps) {
  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [services, serviceId],
  )
  const timeBased = selectedService ? isTimeBasedService(selectedService) : false
  const hourly = selectedService ? isHourlyService(selectedService) : false

  return (
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
            onChange={(e) => onServiceChange(e.target.value)}
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
            onChange={(e) => onDateChange(e.target.value)}
            aria-describedby={blockout ? 'session-date-closed' : undefined}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          {blockout ? (
            <p
              id="session-date-closed"
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
                ? 'Pick the day for the session.'
                : 'Whole day. One live booking per customer per service per day.'}
            </p>
          )}
        </div>

        {timeBased && (
          <div>
            <label
              htmlFor="session-time"
              className="block text-[11px] font-bold tracking-widest text-text-secondary uppercase"
            >
              Session time
            </label>
            {hourly ? (
              <select
                id="session-time"
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
                id="session-time"
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
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Contact details, special setup, anything the studio should know…"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>
    </fieldset>
  )
}
