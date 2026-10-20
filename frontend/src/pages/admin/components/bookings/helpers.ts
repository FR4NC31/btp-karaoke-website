import type { AdminBookingAction } from '../../../../lib/admin-api'
import type { BookingStatus } from '../../../../lib/booking-api'

type BookingRowAction = {
  action: AdminBookingAction
  label: string
  kind: 'primary' | 'danger' | 'neutral'
}

export const STATUS_FILTERS: Array<{ value: BookingStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const ROW_ACTIONS: Record<string, BookingRowAction[]> = {
  pending: [
    { action: 'confirm', label: 'Confirm', kind: 'primary' },
    { action: 'reject', label: 'Reject', kind: 'danger' },
  ],
  confirmed: [
    { action: 'complete', label: 'Mark completed', kind: 'primary' },
    { action: 'cancel', label: 'Cancel', kind: 'danger' },
  ],
}
