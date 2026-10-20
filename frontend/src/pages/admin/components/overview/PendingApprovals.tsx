import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import type { AdminBooking } from '../../../../lib/admin-api'
import { STATUS_STYLES, formatDay } from '../../../../lib/booking-format'

type PendingApprovalsProps = {
  pending: AdminBooking[]
  actingId: string
  actingAction: 'confirm' | 'reject' | null
  onAction: (booking: AdminBooking, action: 'confirm' | 'reject') => void
}

export default function PendingApprovals({
  pending,
  actingId,
  actingAction,
  onAction,
}: PendingApprovalsProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold tracking-wide uppercase">
          <HugeiconsIcon icon={Clock01Icon} size={18} className="text-warning" />
          Pending approvals
        </h2>
        <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
          {pending.length} waiting
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">
          Nothing waiting — every reservation has been answered.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pending.map((booking) => (
            <li
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
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
                </div>
                <p className="mt-1.5 text-sm text-text-secondary">
                  {booking.serviceName} · {formatDay(booking.bookingDate)}
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

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAction(booking, 'reject')}
                  disabled={actingId === booking.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  {actingId === booking.id && actingAction === 'reject' ? 'Working…' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => onAction(booking, 'confirm')}
                  disabled={actingId === booking.id}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                  {actingId === booking.id && actingAction === 'confirm' ? 'Working…' : 'Confirm'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
