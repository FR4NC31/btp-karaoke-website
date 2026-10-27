import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  ChevronDownIcon,
  File01Icon,
  InfoIcon,
  ShieldCheckIcon,
  ZoomInIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ReservationDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove?: () => void
  onReject?: () => void
}

type InfoCardProps = {
  label: string
  value: string
  valueColor?: 'text-primary' | 'text-secondary' | 'text-success' | 'text-warning'
  bold?: boolean
}

function InfoCard({ label, value, valueColor = 'text-primary', bold = false }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${valueColor === 'text-success' ? 'text-success' : valueColor === 'text-warning' ? 'text-warning' : 'text-text-primary'} ${bold ? 'font-bold' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
        {label}
      </p>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-warning">
        {value.toLowerCase()}
      </span>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
      <span className="shrink-0 text-text-muted">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  )
}

export default function ReservationDetailsDialog({
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ReservationDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-surface p-0 text-text-primary sm:max-w-2xl max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface-elevated">
              <HugeiconsIcon icon={File01Icon} size={18} className="text-text-secondary" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold tracking-wide text-text-primary">
                  Reservation Details
                </DialogTitle>
                <DialogDescription className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
                  BTP-LL7TX9
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2"
          >
            <span className="sr-only">Close</span>
            <span className="text-[11px] font-bold text-text-muted">×</span>
          </Button>
        </div>

        <p className="px-5 py-3 border-b border-border text-[11px] font-bold tracking-widest text-text-muted uppercase">
          Comprehensive booking parameters &amp; payment validation
        </p>
        <div className="grid gap-4 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoCard label="Customer Name" value="BTP Karaoke Web" />
            <StatusCard label="Current Status" value="Pending Approval" />
            <InfoCard label="Total Price" value="₱2,500.00" valueColor="text-success" bold />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard label="Service / Studio Room" value="Sound System Rental" />
            <InfoCard label="Scheduled Date" value="Fri, Oct 30, 2026" />
          </div>

          <InfoCard label="Email Address" value="btp.karaoke.web@gmail.com" />
        </div>
  return (
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
              Payment Channel
            </span>
            <select
              defaultValue="GCash Transfer (Image Proof Available)"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-primary focus:ring-0 outline-none appearance-none"
            >
              <option>GCash Transfer (Image Proof Available)</option>
            </select>
            <HugeiconsIcon icon={ChevronDownIcon} size={12} className="text-text-muted" />
          </div>
        </div>
        <section className="p-5 flex-1 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-text-primary">
                <span className="text-sm font-bold">G</span>
              </div>
              <span className="font-heading text-sm font-bold tracking-wide text-text-primary">
                GCash Transfer Verification
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                <span className="size-1.5 rounded-full bg-success" />
                Verified Receipt
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="Enlarge receipt"
              >
                <HugeiconsIcon icon={ZoomInIcon} size={14} />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-primary/30 bg-primary-soft p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                  GCash Express Send
                </span>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-success" />
              </div>
              <p className="mt-2 font-heading text-sm font-bold tracking-wide text-text-primary uppercase">
                Amount Paid
              </p>
              <p className="mt-0.5 font-heading text-2xl font-bold text-text-primary">
                ₱2,500.00
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                  Transaction Status
                </span>
                <span className="flex items-center gap-1 rounded border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                  <HugeiconsIcon icon={ShieldCheckIcon} size={12} className="text-success" />
                  Authentic
                </span>
              </div>
              <DetailRow label="GCash Ref No." value="1008-9281-9921" />
              <DetailRow label="Timestamp" value="Oct 28, 2026 · 14:32:01" />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-surface-elevated p-3">
            <DetailRow label="Ref No:" value="1008-9281-9921" />
            <DetailRow label="To:" value="BTP STUDIO PH" />
            <DetailRow label="From:" value="0917 *** 821" />
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] text-text-secondary leading-relaxed">
            <HugeiconsIcon icon={InfoIcon} size={14} className="mt-0.5 shrink-0" />
            <span>
              Verified against studio merchant account statement. Reference code and payment match.
            </span>
          </p>
        </section>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-surface">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="destructive" onClick={onReject}>
            Reject Reservation
          </Button>
          <Button type="button" onClick={onApprove}>
            Approve Reservation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
