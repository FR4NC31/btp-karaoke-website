import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import type { Service } from '../../../../lib/booking-api'
import { WING_LABELS } from './constants'
import BookingServiceCard from './BookingServiceCard'

type ServiceCatalogProps = {
  /** Wing keys in the mockup's order, `all` first. */
  wings: string[]
  wing: string
  onWingChange: (wing: string) => void
  /** Already filtered by wing and by the toolbar search. */
  services: Service[]
  isVip: boolean
  disabled: boolean
  onBack: () => void
  onBook: (service: Service) => void
}

/**
 * The "New Booking" view from the booking-desk mockup: policy banner with a
 * back link, the wing filter pills, and the catalogue as horizontal rows.
 */
export default function ServiceCatalog({
  wings,
  wing,
  onWingChange,
  services,
  isVip,
  disabled,
  onBack,
  onBook,
}: ServiceCatalogProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} />
        </span>
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-text-secondary">
          <strong className="font-semibold text-text-primary">Booking Desk Info:</strong> Per-hour
          services (recording, editing, coaching) reserve a specific date and time slot on the hour.
          Per-unit or starting rates are confirmed after initial studio consultation.
          {isVip && (
            <span className="mt-1 block font-semibold text-primary">
              VIP member: 20% off all services applied at checkout.
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 text-sm text-text-secondary underline underline-offset-4 transition hover:text-text-primary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to My Bookings
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {wings.map((entry) => (
          <button
            key={entry}
            type="button"
            aria-pressed={wing === entry}
            onClick={() => onWingChange(entry)}
            className={`rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition ${
              wing === entry
                ? 'bg-primary text-text-primary hover:bg-primary-hover'
                : 'border border-border bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {entry === 'all' ? 'All Services' : (WING_LABELS[entry] ?? entry)}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-semibold tracking-widest text-text-muted uppercase">
          {services.length} service{services.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="space-y-4">
        {services.map((service) => (
          <BookingServiceCard
            key={service.id}
            service={service}
            disabled={disabled}
            onBook={onBook}
          />
        ))}
      </ul>

      {services.length === 0 && (
        <p className="text-sm text-text-muted">No services match this filter yet.</p>
      )}
    </div>
  )
}
