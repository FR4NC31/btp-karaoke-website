import type { BookingStatus } from './booking-api'


export const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  confirmed: 'border-success/40 bg-success/10 text-success',
  rejected: 'border-error/40 bg-error/10 text-error',
  cancelled: 'border-border bg-surface-elevated text-text-muted',
  completed: 'border-primary/40 bg-primary-soft text-primary',
}

export const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const dayFormat = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(`${isoDate}T00:00:00Z`))
}
