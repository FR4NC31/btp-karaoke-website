import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import type { AdminBooking, AdminBookingAction } from '../../../../lib/admin-api'
import { STATUS_STYLES, formatDay, peso } from '../../../../lib/booking-format'
import { ROW_ACTIONS } from './helpers'

type BookingDetailsDialogProps = {
  booking: AdminBooking | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onAction: (booking: AdminBooking, action: AdminBookingAction) => void
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold tracking-[0.18em] text-text-muted uppercase">{label}</dt>
      <dd className="mt-1 truncate text-sm text-text-primary">{value}</dd>
    </div>
  )
}

function actionIcon(action: AdminBookingAction) {
  if (action === 'complete') return TaskDone01Icon
  if (action === 'reject' || action === 'cancel') return Cancel01Icon
  return CheckmarkCircle02Icon
}

export default function BookingDetailsDialog({
  booking,
  busy,
  onOpenChange,
  onAction,
}: BookingDetailsDialogProps) {
  const actions = booking ? (ROW_ACTIONS[booking.status] ?? []) : []

  return (
    <Dialog
      open={Boolean(booking)}
      onOpenChange={(next) => {
        if (!next && busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="border border-border bg-surface p-0 text-text-primary sm:max-w-xl">
        {booking && (
          <div className="flex flex-col">
            <DialogHeader className="gap-2 border-b border-border px-6 py-5">
              <div className="flex flex-wrap items-center gap-2.5 pr-8">
                <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
                  {booking.customerName}
                </DialogTitle>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[booking.status]}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {booking.status}
                </span>
                {booking.guestName && (
                  <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-[9px] font-bold tracking-widest text-text-muted uppercase">
                    Guest
                  </span>
                )}
              </div>
              <DialogDescription className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
                {booking.referenceCode}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Service" value={booking.serviceName} />
                <Detail
                  label="Schedule"
                  value={`${formatDay(booking.bookingDate)}${
                    booking.bookingTime ? ` · ${booking.bookingTime.slice(0, 5)}` : ' · Whole day'
                  }`}
                />
                <Detail
                  label="Amount due"
                  value={peso.format(booking.amountDuePhp ?? booking.pricePhp)}
                />
                <Detail
                  label="Payment"
                  value={
                    booking.paymentMethod
                      ? booking.paymentMethod === 'gcash'
                        ? 'GCash'
                        : 'Cash on arrival'
                      : 'Not set'
                  }
                />
                <Detail label="Email" value={booking.customerEmail || '—'} />
                <Detail label="Contact" value={booking.customerContact || '—'} />
              </dl>

              {booking.notes && (
                <div>
                  <p className="text-[9px] font-bold tracking-[0.18em] text-text-muted uppercase">
                    Notes
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {booking.notes}
                  </p>
                </div>
              )}

              {booking.receiptUrl && (
                <div>
                  <p className="text-[9px] font-bold tracking-[0.18em] text-text-muted uppercase">
                    GCash receipt
                  </p>
                  <a
                    href={booking.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block"
                  >
                    <img
                      src={booking.receiptUrl}
                      alt="GCash receipt"
                      className="h-24 w-24 rounded-lg border border-border object-cover"
                    />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
              {actions.length === 0 ? (
                <p className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
                  No actions left on this reservation
                </p>
              ) : (
                actions.map((rowAction) => (
                  <button
                    key={rowAction.action}
                    type="button"
                    onClick={() => onAction(booking, rowAction.action)}
                    disabled={busy}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-bold tracking-widest uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      rowAction.kind === 'primary'
                        ? 'bg-primary text-text-primary hover:bg-primary-hover'
                        : rowAction.kind === 'danger'
                          ? 'border border-border bg-surface-elevated text-text-secondary hover:border-error/50 hover:text-error'
                          : 'border border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <HugeiconsIcon
                      icon={busy ? RefreshIcon : actionIcon(rowAction.action)}
                      size={13}
                      className={busy ? 'animate-spin motion-reduce:animate-none' : undefined}
                    />
                    {busy ? 'Working…' : rowAction.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
