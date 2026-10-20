import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import NewReservationForm from './components/reservation/NewReservationForm'

type NewReservationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export default function NewReservationDialog({
  open,
  onOpenChange,
  onCreated,
}: NewReservationDialogProps) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="border border-border bg-surface p-6 text-text-primary sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-bold tracking-wide uppercase">
            New reservation
          </DialogTitle>
          <DialogDescription className="text-xs font-bold tracking-widest text-primary uppercase">
            Taken by the studio — confirmed on save
          </DialogDescription>
        </DialogHeader>

        <NewReservationForm
          onClose={() => onOpenChange(false)}
          onCreated={onCreated}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  )
}
