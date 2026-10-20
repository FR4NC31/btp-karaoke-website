import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import NewReservationForm from './components/reservation/NewReservationForm'

/**
 * "New reservation" modal — take a reservation for someone else without
 * leaving the desk page. Hosted by AdminShell (lib/new-reservation-dialog.ts
 * exposes it through the outlet context) and opened by the + New reservation
 * buttons on Overview and Reservations; the old /admin/bookings/new page is
 * gone.
 *
 * The dialog owns only the open/busy contract; the form itself lives in
 * components/reservation (customer picker, session fields, save pipeline).
 */
type NewReservationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fired after a save — AdminShell bumps its reservation revision. */
  onCreated: () => void
}

export default function NewReservationDialog({
  open,
  onOpenChange,
  onCreated,
}: NewReservationDialogProps) {
  // Keep the modal open while a save is in flight: dismissing it mid-request
  // would hide the result (or error) after the booking may already exist.
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

        {/* Radix unmounts the content while closed, so the form remounts fresh
            (service catalog refetched included) every time it opens. */}
        <NewReservationForm
          onClose={() => onOpenChange(false)}
          onCreated={onCreated}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  )
}
