import { useMemo } from 'react'
import type { Service } from '../../../../lib/booking-api'
import { peso } from '../../../../lib/booking-format'

const NOTES_MAX = 500

type SessionFieldsetProps = {
  services: Service[]
  serviceId: string
  onServiceChange: (value: string) => void
  bookingDate: string
  /** The studio's today — the date input's min and the reset default. */
  studioToday: string
  onDateChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
}

/**
 * "The session" — service picker (with the selected service's unit/price
 * line), session date and optional notes. The desk books whole days.
 */
export default function SessionFieldset({
  services,
  serviceId,
  onServiceChange,
  bookingDate,
  studioToday,
  onDateChange,
  notes,
  onNotesChange,
}: SessionFieldsetProps) {
  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [services, serviceId],
  )

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
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Contact details, special setup, anything the studio should know…"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>
    </fieldset>
  )
}
