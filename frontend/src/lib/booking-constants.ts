/**
 * Notes cap shared by the customer form and the admin desk. The API mirrors
 * this limit in `backend/src/bookings/validation.ts`, so keep the two in sync.
 */
export const NOTES_MAX = 500

/**
 * Whole-hour options for hourly services — values are 24-hour `HH:00`, labels
 * also show the 12-hour form. Hourly bookings must start on the hour, so the
 * admin and customer pickers share this one list.
 */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const value = `${String(hour).padStart(2, '0')}:00`
  const suffix = hour < 12 ? 'AM' : 'PM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return { value, label: `${value} (${display}:00 ${suffix})` }
})
