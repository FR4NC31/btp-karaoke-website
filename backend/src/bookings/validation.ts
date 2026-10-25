import { BOOKING_BLOCKOUT_REASONS, type BookingBlockoutReason } from '../schema.ts'
import { BookingError } from './types.ts'

/**
 * Pure booking validators — no database import, so they can be unit-tested
 * without a DATABASE_URL. The db-touching helpers live in shared.ts.
 */

/**
 * The studio's calendar day boundary. A booking is a *local* day, so "today"
 * must be resolved in the studio's timezone — comparing against UTC would let
 * someone book a day that has already ended in Manila (UTC+8), and block a
 * valid today between midnight and 08:00 local.
 */
const STUDIO_TIMEZONE = process.env.STUDIO_TIMEZONE ?? 'Asia/Manila'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** Max horizon for a booking — a typo guard, not a business rule. */
const MAX_DAYS_AHEAD = 730

const NOTES_MAX = 500

/** Today's date in the studio's timezone, as `YYYY-MM-DD`. */
export function studioToday(): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the column's ISO form.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Shifts a `YYYY-MM-DD` string by whole days and returns the same form. */
function addDays(isoDate: string, days: number): string {
  // Defaults only satisfy noUncheckedIndexedAccess — callers pass studioToday().
  const [y = 1970, m = 1, d = 1] = isoDate.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return shifted.toISOString().slice(0, 10)
}

/**
 * True when `day` is a `YYYY-MM-DD` string naming a day that actually exists.
 *
 * The shape test alone accepts days that do not exist — 2027-02-29,
 * 2027-04-31, 2027-13-01 — and those reach Postgres, which rejects them as an
 * out-of-range `date`. `Date` rolls impossible days over (2027-04-31 -> 2027-05-01)
 * rather than failing, so parsing back and comparing is what actually catches
 * it. Shared by the booking writers and the admin date filter, which must not
 * hand Postgres a day it cannot parse.
 */
export function isRealCalendarDay(day: string): boolean {
  if (!ISO_DATE.test(day)) return false
  // JavaScript's Date accepts year 0000 (1 BC), but Postgres rejects '0000-01-01'
  // as a `date` input. No booking can legitimately start there either.
  if (Number(day.slice(0, 4)) < 1) return false
  const parsed = new Date(`${day}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
}

/**
 * Shared day validation for both booking paths (customer self-service and
 * admin reservations): format, real calendar day, not in the past, not
 * absurdly far ahead. Returns the trimmed day so callers cannot accidentally
 * keep the raw input.
 */
export function validateBookingDay(raw: unknown): string {
  const bookingDate = typeof raw === 'string' ? raw.trim() : ''

  if (!ISO_DATE.test(bookingDate)) {
    throw new BookingError('Pick a date in YYYY-MM-DD format.', 400)
  }

  if (!isRealCalendarDay(bookingDate)) {
    throw new BookingError('That is not a real calendar date. Pick a valid day.', 400)
  }

  const today = studioToday()
  if (bookingDate < today) {
    throw new BookingError('That day has already passed. Pick today or a later date.', 400)
  }
  if (bookingDate > addDays(today, MAX_DAYS_AHEAD)) {
    throw new BookingError('That date is too far ahead. Pick something within two years.', 400)
  }

  return bookingDate
}

/** Units that need a time slot: "Per Hour", "Per 60-Minute Broadcast", … */
const TIME_UNIT = /\b(hour|hr|minute|min)(?:ly|s)?\b/i
/** Units billed by the hour — their slots must start on the hour. */
const HOUR_UNIT = /\b(hour|hr)(?:ly|s)?\b/i

export function isTimeBasedUnit(unit: string): boolean {
  return TIME_UNIT.test(unit)
}

export function isHourlyUnit(unit: string): boolean {
  return HOUR_UNIT.test(unit)
}

/**
 * Validates a time slot against the service's billing unit.
 *
 * - Time-based services require one; day/song/event services must not send one.
 * - Hourly services only accept `HH:00` — the studio sells whole-hour blocks
 *   (1:00 PM–2:00 PM), not arbitrary half-hour starts.
 * - Minute-based services keep any `HH:MM`.
 * - A slot that has already passed today (studio timezone) is rejected.
 */
export function validateBookingTime(raw: unknown, date: string, unit: string): string | null {
  const bookingTime = typeof raw === 'string' ? raw.trim() : ''
  const timeBased = isTimeBasedUnit(unit)

  if (!bookingTime) {
    if (timeBased) {
      throw new BookingError('This service needs a start time.', 400)
    }
    return null
  }

  if (!timeBased) {
    throw new BookingError('This service is booked by the day; leave the time empty.', 400)
  }

  if (!ISO_TIME.test(bookingTime)) {
    throw new BookingError('Pick a time in HH:MM format (24-hour clock).', 400)
  }

  if (isHourlyUnit(unit) && !bookingTime.endsWith(':00')) {
    throw new BookingError('Hourly services start on the hour. Pick a time like 14:00.', 400)
  }

  // Same-day slots that have already started are gone. Comparing `HH:MM`
  // strings is exact because both sides are zero-padded 24-hour values.
  if (date === studioToday()) {
    const now = new Intl.DateTimeFormat('en-GB', {
      timeZone: STUDIO_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
    if (bookingTime <= now) {
      throw new BookingError('Cannot book a time slot that has already passed.', 400)
    }
  }

  return bookingTime
}

/** Shared notes validation. Returns the trimmed text, or null when empty. */
export function validateNotes(raw: unknown): string | null {
  const notes = typeof raw === 'string' ? raw.trim() || null : null
  if (notes && notes.length > NOTES_MAX) {
    throw new BookingError(`Notes must be ${NOTES_MAX} characters or fewer.`, 400)
  }
  return notes
}

/** Human label for a blockout reason; shared by API errors and admin copy. */
const BLOCKOUT_REASON_LABELS: Record<BookingBlockoutReason, string> = {
  unavailable: 'Unavailable',
  maintenance: 'Maintenance',
  other: 'Other',
}

export function blockoutReasonLabel(reason: BookingBlockoutReason | null): string | null {
  return reason ? BLOCKOUT_REASON_LABELS[reason] : null
}

/** The customer-facing message for a closed day. */
export function blockoutMessage(day: string, reason: BookingBlockoutReason | null): string {
  const label = blockoutReasonLabel(reason)
  return `The studio is unavailable on ${day}${label ? ` (${label})` : ''}. Pick another day.`
}

/** Optional blockout reason; empty/null means "no reason given". */
export function validateBlockoutReason(raw: unknown): BookingBlockoutReason | null {
  if (raw === undefined || raw === null) return null
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return null
  if (!(BOOKING_BLOCKOUT_REASONS as readonly string[]).includes(value)) {
    throw new BookingError('Pick a valid reason for the blocked day.', 400)
  }
  return value as BookingBlockoutReason
}
