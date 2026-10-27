import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import type { AdminBooking } from '../../../../lib/admin-api'
import { STATUS_STYLES, formatDay } from '../../../../lib/booking-format'

type PendingApprovalsProps = {
  pending: AdminBooking[]
  actingId: string
  actingAction: 'confirm' | 'reject' | null
  onAction: (booking: AdminBooking, action: 'confirm' | 'reject') => void
}

/**
 * Pending Approvals — the actionable queue, styled as the same panel as the
 * activity log directly below it. Confirm/reject stay on the row; the panel
 * links out to the full reservations desk.
 */
export default function PendingApprovals({
  pending,
  actingId,
  actingAction,
  onAction,
}: PendingApprovalsProps) {
  const empty = pending.length === 0

  return (
    <section
      aria-labelledby="pending-approvals-heading"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
            <HugeiconsIcon icon={Clock01Icon} size={18} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="pending-approvals-heading"
                className="font-heading text-xl font-bold tracking-wide uppercase"
              >
                Pending Approvals
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
                  empty
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-warning/40 bg-warning/10 text-warning'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${empty ? 'bg-success' : 'bg-warning'}`}
                />
                {empty ? 'All clear' : `${pending.length} waiting`}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Confirm or reject the reservations waiting on the desk.
            </p>
          </div>
        </div>

        <Link
          to="/admin/bookings"
          aria-label="All reservations"
          title="All reservations"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} />
        </Link>
      </div>

      {empty ? (
        <div className="m-5 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-elevated/40 p-10 text-center">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} className="text-success" />
          <h3 className="font-heading text-base font-bold tracking-wide text-text-primary">
            No pending approvals
          </h3>
          <p className="text-xs text-text-muted">
            Every reservation has been confirmed or rejected. New requests will appear here.
          </p>
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[300px] text-left">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/40">
                {['Customer / Service', 'Action'].map((heading, index) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`px-4 py-3 text-[9px] font-bold tracking-[0.16em] text-text-muted uppercase ${
                      index === 1 ? 'text-right' : ''
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {pending.map((booking) => (
                <tr key={booking.id} className="transition hover:bg-surface-elevated/40">
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-text-primary">
                        {booking.customerName}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize ${STATUS_STYLES[booking.status]}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">
                      {booking.referenceCode}
                      {booking.customerContact ? ` · ${booking.customerContact}` : ''}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-text-secondary">
                      {booking.serviceName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {formatDay(booking.bookingDate)} ·{' '}
                      {booking.bookingTime ? booking.bookingTime.slice(0, 5) : 'Whole day'}
                    </p>
                    {booking.notes && (
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">{booking.notes}</p>
                    )}
                    {booking.paymentMethod && (
                      <p className="mt-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                        {booking.paymentMethod === 'gcash' ? 'GCash' : 'Cash on arrival'}
                      </p>
                    )}
                    {booking.receiptUrl && (
                      <a
                        href={booking.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-block"
                      >
                        <img
                          src={booking.receiptUrl}
                          alt="GCash receipt"
                          className="h-10 w-10 rounded border border-border object-cover"
                        />
                      </a>
                    )}
                  </td>
                  <td className="w-12 px-3 py-3.5 text-right align-middle">
                    <div className="ml-auto flex w-8 flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAction(booking, 'confirm')}
                        disabled={actingId === booking.id}
                        aria-label="Confirm"
                        title="Confirm reservation"
                        className="grid size-8 place-items-center rounded-lg bg-primary text-text-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <HugeiconsIcon
                          icon={
                            actingId === booking.id && actingAction === 'confirm'
                              ? RefreshIcon
                              : CheckmarkCircle02Icon
                          }
                          size={14}
                          className={
                            actingId === booking.id && actingAction === 'confirm'
                              ? 'animate-spin motion-reduce:animate-none'
                              : undefined
                          }
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction(booking, 'reject')}
                        disabled={actingId === booking.id}
                        aria-label="Reject"
                        title="Reject reservation"
                        className="grid size-8 place-items-center rounded-lg border border-border bg-surface-elevated text-text-secondary transition hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <HugeiconsIcon
                          icon={
                            actingId === booking.id && actingAction === 'reject'
                              ? RefreshIcon
                              : Cancel01Icon
                          }
                          size={14}
                          className={
                            actingId === booking.id && actingAction === 'reject'
                              ? 'animate-spin motion-reduce:animate-none'
                              : undefined
                          }
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
