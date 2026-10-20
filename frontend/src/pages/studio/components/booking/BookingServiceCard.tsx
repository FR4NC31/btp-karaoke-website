import type { Service } from '../../../../lib/booking-api'
import { peso } from '../../../../lib/booking-format'
import { WING_LABELS } from './constants'

type BookingServiceCardProps = {
  service: Service
  /** A save is in flight — the card cannot start another. */
  disabled: boolean
  onBook: (service: Service) => void
}

/** One catalog card: wing, price, name, unit, description and the book CTA. */
export default function BookingServiceCard({ service, disabled, onBook }: BookingServiceCardProps) {
  return (
    <li>
      <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            {WING_LABELS[service.wing] ?? service.wing}
          </p>
          <p className="font-heading text-lg leading-none font-bold tracking-wide text-primary">
            {peso.format(service.pricePhp)}
          </p>
        </div>
        <h3 className="mt-3 font-heading text-base leading-tight font-bold tracking-wide uppercase">
          {service.name}
        </h3>
        <p className="mt-1 text-[11px] tracking-widest text-text-muted uppercase">{service.unit}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">{service.description}</p>
        <button
          type="button"
          onClick={() => onBook(service)}
          disabled={disabled}
          className="mt-5 rounded-lg border border-border bg-surface-elevated px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-primary/50 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Book this service
        </button>
      </article>
    </li>
  )
}
