/**
 * Notes cap shared by the customer form and the admin desk. The API mirrors
 * this limit in `backend/src/bookings/validation.ts`, so keep the two in sync.
 */
export const NOTES_MAX = 500

/** `HH:MM` (24-hour) → `01:00 PM` style clock, padded like the mockup. */
function clock(hourOfDay: number): string {
  const hour = hourOfDay % 24
  const suffix = hour < 12 ? 'AM' : 'PM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${String(display).padStart(2, '0')}:00 ${suffix}`
}

/**
 * Whole-hour options for hourly services — values are 24-hour `HH:00` (the
 * server rejects anything off the hour, and the pickers select by value),
 * labels show the booked range `01:00 PM - 02:00 PM`. Hourly bookings must
 * start on the hour, so the admin and customer pickers share this one list.
 */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: `${String(hour).padStart(2, '0')}:00`,
  label: `${clock(hour)} - ${clock(hour + 1)}`,
}))
