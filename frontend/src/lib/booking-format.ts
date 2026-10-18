import type { BookingStatus } from './booking-api'

/**
 * Display helpers shared by the customer booking desk and the admin console —
 * extracted so a status badge or a date reads identically in both.
 */

/** Badge styles per booking status (border + background + text). */
export const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  confirmed: 'border-success/40 bg-success/10 text-success',
  rejected: 'border-error/40 bg-error/10 text-error',
  cancelled: 'border-border bg-surface-elevated text-text-muted',
  completed: 'border-primary/40 bg-primary-soft text-primary',
}

export const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

/**
 * A booking day is a calendar day, not an instant. Parsing it as UTC keeps the
 * displayed date from sliding a day backwards for anyone west of Manila.
 */
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
