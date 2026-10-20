import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../db.ts'
import { booking, service, type BookingStatus } from '../schema.ts'
import { BookingError, type Booking } from './types.ts'

/**
 * The studio's calendar day boundary. A booking is a *local* day, so "today"
 * must be resolved in the studio's timezone — comparing against UTC would let
 * someone book a day that has already ended in Manila (UTC+8), and block a
 * valid today between midnight and 08:00 local.
 */
const STUDIO_TIMEZONE = process.env.STUDIO_TIMEZONE ?? 'Asia/Manila'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

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
 * The constraint name behind a 23505 (unique_violation), or null when `err`
 * is not one. `booking` carries two unique constraints and they mean very
 * different things: `booking_active_unique_idx` is the caller's duplicate
 * booking, while `booking_referenceCode_unique` is a random code collision
 * that has nothing to do with the request. Drizzle rethrows the driver
 * error, but a wrapped cause is checked too so this keeps working if that
 * ever changes.
 */
export function uniqueViolationConstraint(err: unknown): string | null {
  const infoOf = (value: unknown) =>
    typeof value === 'object' && value !== null
      ? (value as { code?: string; constraint?: string })
      : undefined
  const direct = infoOf(err)
  const cause = infoOf((err as { cause?: unknown })?.cause)
  const violation = direct?.code === '23505' ? direct : cause?.code === '23505' ? cause : undefined
  return violation?.constraint ?? null
}

/** Columns the API exposes for a booking, joined with its service. */
export const bookingColumns = {
  id: booking.id,
  referenceCode: booking.referenceCode,
  serviceId: booking.serviceId,
  bookingDate: booking.bookingDate,
  status: booking.status,
  notes: booking.notes,
  createdAt: booking.createdAt,
  serviceCode: service.code,
  serviceName: service.name,
  serviceUnit: service.unit,
  pricePhp: service.pricePhp,
}

export type BookingRow = {
  id: string
  referenceCode: string
  serviceId: string
  bookingDate: string
  status: BookingStatus
  notes: string | null
  createdAt: Date
  serviceCode: string
  serviceName: string
  serviceUnit: string
  pricePhp: string
}

/** numeric arrives from Postgres as a string to protect precision; these are
 * peso amounts well inside float range, so parse once at the boundary. */
export function toBooking(row: BookingRow): Booking {
  return {
    ...row,
    pricePhp: Number(row.pricePhp),
    createdAt: row.createdAt.toISOString(),
  }
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** `BTP-XXXXXX` — unambiguous characters, safe to read out loud. */
function makeReferenceCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)]
  }
  return `BTP-${code}`
}

/** How many times an insert retries when the random reference code collided. */
const REFERENCE_CODE_ATTEMPTS = 3

/**
 * Inserts one booking row, regenerating the reference code if the
 * (vanishingly unlikely) random collision trips its unique constraint.
 * Anything else — including the duplicate-booking index — is rethrown for
 * the caller to classify.
 */
export async function insertBookingRow(
  values: Omit<typeof booking.$inferInsert, 'id' | 'referenceCode'>,
): Promise<string> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const inserted = await db
        .insert(booking)
        .values({ id: randomUUID(), referenceCode: makeReferenceCode(), ...values })
        .returning({ id: booking.id })

      const row = inserted[0]
      // An insert without a returning row is a server-side inconsistency, not
      // caller input — a plain Error surfaces as a 500.
      if (!row) throw new Error('The booking insert returned no row.')
      return row.id
    } catch (err) {
      const retryable =
        uniqueViolationConstraint(err) === 'booking_referenceCode_unique' &&
        attempt < REFERENCE_CODE_ATTEMPTS - 1
      if (!retryable) throw err
    }
  }
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

/** Shared notes validation. Returns the trimmed text, or null when empty. */
export function validateNotes(raw: unknown): string | null {
  const notes = typeof raw === 'string' ? raw.trim() || null : null
  if (notes && notes.length > NOTES_MAX) {
    throw new BookingError(`Notes must be ${NOTES_MAX} characters or fewer.`, 400)
  }
  return notes
}

/** Confirms the service exists and is bookable, or throws a 404. */
export async function assertServiceAvailable(serviceId: string): Promise<void> {
  const available = await db
    .select({ id: service.id })
    .from(service)
    .where(and(eq(service.id, serviceId), eq(service.isActive, true)))
    .limit(1)

  if (available.length === 0) {
    throw new BookingError('That service is not available.', 404)
  }
}
