import { useOutletContext } from 'react-router'

export type NewReservationDialogApi = {
  /** Opens the "New reservation" modal hosted by AdminShell. */
  openNewReservation: () => void
  /**
   * Bumped after a reservation is taken in the modal. Desk pages depend on it
   * so their lists/stats refetch without a remount — the shell owns the modal
   * and the pages own the data.
   */
  reservationsRevision: number
}

/**
 * AdminShell exposes the new-reservation modal through the router outlet
 * context — same pattern as the auth modal (lib/auth-dialog.ts).
 */
export function useNewReservationDialog(): NewReservationDialogApi {
  return useOutletContext<NewReservationDialogApi>()
}
