import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar01Icon } from '@hugeicons/core-free-icons'
import type { Service } from '../../../../lib/booking-api'
import { peso } from '../../../../lib/booking-format'
import { WING_LABELS } from './constants'

type BookingServiceCardProps = {
  service: Service
  disabled: boolean
  onBook: (service: Service) => void
}

/**
 * One catalogue row from the booking-desk mockup: wing + unit badges, the
 * service name and description, then the rate and the red Book action.
 */
export default function BookingServiceCard({ service, disabled, onBook }: BookingServiceCardProps) {
  return (
    <li>
      <article className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-surface-elevated px-2.5 py-1 text-[10px] font-bold tracking-widest text-text-secondary uppercase">
              {WING_LABELS[service.wing] ?? service.wing}
            </span>
            <span className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
              {service.unit}
            </span>
          </div>
          <h3 className="mt-3 text-xl leading-tight font-bold tracking-wide">{service.name}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {service.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end">
          <div className="sm:text-right">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Rate</p>
            <p className="mt-1 text-2xl leading-none font-bold text-primary">
              {peso.format(service.pricePhp)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onBook(service)}
            disabled={disabled}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HugeiconsIcon icon={Calendar01Icon} size={15} />
            Book this service
          </button>
        </div>
      </article>
    </li>
  )
}
