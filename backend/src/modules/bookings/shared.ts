import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { booking, bookingBlockout, service, type BookingStatus } from '../../db/schema.ts'
import { BookingError, type Booking } from './types.ts'
import { blockoutMessage } from './validation.ts'

/**
 * Database-backed booking helpers. Pure input validation lives in
 * validation.ts so it can be unit-tested without a database connection.
 */

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
  bookingTime: booking.bookingTime,
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
  bookingTime: string | null
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

/** Rejects a booking on a day the admin has blocked. */
export async function assertDayNotBlocked(day: string): Promise<void> {
  const rows = await db
    .select({ reason: bookingBlockout.reason })
    .from(bookingBlockout)
    .where(eq(bookingBlockout.bookingDate, day))
    .limit(1)

  const blocked = rows[0]
  if (blocked) {
    throw new BookingError(blockoutMessage(day, blocked.reason), 409)
  }
}

/** Confirms the service exists and is bookable, or throws a 404. Returns the
 *  billing unit so the caller can validate the time slot against it. */
export async function assertServiceAvailable(serviceId: string): Promise<{ unit: string }> {
  const rows = await db
    .select({ unit: service.unit })
    .from(service)
    .where(and(eq(service.id, serviceId), eq(service.isActive, true)))
    .limit(1)

  const available = rows[0]
  if (!available) {
    throw new BookingError('That service is not available.', 404)
  }
  return available
}

