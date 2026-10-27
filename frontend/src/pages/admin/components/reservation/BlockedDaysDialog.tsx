import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarBlock01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import BlockedDaysPanel from '../bookings/BlockedDaysPanel'

type BlockedDaysDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BlockedDaysDialog({ open, onOpenChange }: BlockedDaysDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-surface p-0 text-text-primary sm:max-w-2xl max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-elevated">
              <HugeiconsIcon icon={CalendarBlock01Icon} size={16} className="text-warning" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold tracking-wide text-text-primary">
                  Blocked Studio Days
                </DialogTitle>
                <DialogDescription className="text-[11px] font-bold tracking-widest text-text-muted uppercase">
                  Prevent online bookings on specific maintenance or event dates.
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
        <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6">
          <BlockedDaysPanel />
        </div>
      </DialogContent>
    </Dialog>
  )
}
