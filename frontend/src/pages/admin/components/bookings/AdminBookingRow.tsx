import { HugeiconsIcon } from '@hugeicons/react'
import { TaskDone01Icon } from '@hugeicons/core-free-icons'
import type { AdminBooking, AdminBookingAction } from '../../../../lib/admin-api'
import { STATUS_STYLES, formatDay, peso } from '../../../../lib/booking-format'
import { ROW_ACTIONS } from './helpers'

function ActionButton({
  label,
  kind,
  disabled,
  onClick,
}: {
  label: string
  kind: 'primary' | 'danger' | 'neutral'
  disabled: boolean
  onClick: () => void
}) {
  const classes =
    kind === 'primary'
      ? 'bg-primary text-text-primary hover:bg-primary-hover'
      : kind === 'danger'
        ? 'border border-border text-text-secondary hover:border-error/50 hover:text-error'
        : 'border border-border text-text-secondary hover:text-text-primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2 text-xs font-bold tracking-widest uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}
    >
      {label}
    </button>
  )
}

type AdminBookingRowProps = {
  booking: AdminBooking
  busy: boolean
  onAction: (booking: AdminBooking, action: AdminBookingAction) => void
}

export default function AdminBookingRow({ booking, busy, onAction }: AdminBookingRowProps) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-heading text-base font-bold tracking-wide uppercase">
            {booking.customerName}
          </p>
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${STATUS_STYLES[booking.status]}`}
          >
            {booking.status}
          </span>
          {booking.guestName && (
            <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Guest
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-text-secondary">
          {booking.serviceName} · {formatDay(booking.bookingDate)} · {peso.format(booking.pricePhp)}
        </p>
        <p className="mt-1 text-[11px] tracking-widest text-text-muted uppercase">
          {booking.referenceCode}
          {booking.customerContact ? ` · ${booking.customerContact}` : ''}
          {booking.customerEmail ? ` · ${booking.customerEmail}` : ''}
        </p>
        {booking.notes && (
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-text-muted">
            {booking.notes}
          </p>
        )}
      </div>

      {ROW_ACTIONS[booking.status] && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {ROW_ACTIONS[booking.status]!.map((rowAction) => (
            <ActionButton
              key={rowAction.action}
              label={busy ? 'Working…' : rowAction.label}
              kind={rowAction.kind}
              disabled={busy}
              onClick={() => onAction(booking, rowAction.action)}
            />
          ))}
        </div>
      )}

      {booking.status === 'completed' && (
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold tracking-widest text-text-muted uppercase">
          <HugeiconsIcon icon={TaskDone01Icon} size={14} />
          Done
        </span>
      )}
    </li>
  )
}
