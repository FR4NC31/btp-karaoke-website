import { useOutletContext } from 'react-router'

export type NewReservationDialogApi = {
  openNewReservation: () => void
  reservationsRevision: number
}

export function useNewReservationDialog(): NewReservationDialogApi {
  return useOutletContext<NewReservationDialogApi>()
}
