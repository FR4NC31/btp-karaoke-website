import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { booking, service } from '../../db/schema.ts'
import {
  assertDayNotBlocked,
  assertServiceAvailable,
  bookingColumns,
  insertBookingRow,
  toBooking,
  uniqueViolationConstraint,
  type BookingRow,
} from './shared.ts'
import { validateBookingDay, validateBookingTime, validateNotes } from './validation.ts'
import { BookingError, type Booking, type CreateBookingInput } from './types.ts'
import { membershipDiscountPercent } from '../membership/index.ts'

/**
 * The signed-in user's own bookings, newest day first.
 *
 * `bookingDate` is read in `mode: 'string'`, so it stays the ISO day the
 * column holds instead of being parsed into a JS Date at local midnight —
 * that round trip can slide the day across a timezone boundary, which is
 * exactly the bug a day-only booking must not have.
 */
export async function listBookingsForUser(userId: string): Promise<Booking[]> {
  const rows = await db
    .select(bookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .where(eq(booking.userId, userId))
    .orderBy(desc(booking.bookingDate), desc(booking.createdAt))

  return rows.map(toBooking)
}

async function findBookingForUser(bookingId: string, userId: string): Promise<Booking | null> {
  const rows = await db
    .select(bookingColumns)
    .from(booking)
    .innerJoin(service, eq(service.id, booking.serviceId))
    .where(and(eq(booking.id, bookingId), eq(booking.userId, userId)))
    .limit(1)

  const row = rows[0] as BookingRow | undefined
  return row ? toBooking(row) : null
}

/**
 * Books one service for one day for one user — the signed-in customer
 * creating their own booking. Created `pending`, which is the state the admin
 * queue acts on.
 *
 * Validates the day locally (format, not past, not absurdly far), confirms the
 * service is real and active, then relies on `booking_active_unique_idx` to
 * reject a duplicate live booking for the same service on the same day —
 * surfacing it as a friendly 409 rather than a raw constraint error.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingDate = validateBookingDay(input.bookingDate)
  const { unit, pricePhp } = await assertServiceAvailable(input.serviceId)
  const bookingTime = validateBookingTime(input.bookingTime, bookingDate, unit)
  const notes = validateNotes(input.notes)

  await assertDayNotBlocked(bookingDate)

  const discountPercent = await membershipDiscountPercent(input.userId)
  const amountDuePhp = pricePhp * (1 - discountPercent / 100)

  try {
    const bookingId = await insertBookingRow({
      userId: input.userId,
      serviceId: input.serviceId,
      bookingDate,
      bookingTime,
      status: 'pending',
      notes,
      discountPercent,
      amountDuePhp: String(amountDuePhp),
    })

    const created = await findBookingForUser(bookingId, input.userId)
    if (!created) {
      // A row that vanished between insert and read-back is our fault, not the
      // caller's — a plain Error surfaces as a 500.
      throw new Error('The booking could not be read back after saving.')
    }
    return created
  } catch (err) {
    // Handle both day-wide and time-slot unique constraint violations
    const constraint = uniqueViolationConstraint(err)
    if (constraint === 'booking_active_day_unique_idx') {
      throw new BookingError('You already have a booking for that service on that day.', 409)
    }
    if (constraint === 'booking_active_time_unique_idx') {
      throw new BookingError('That customer already has a booking for this service at this time slot.', 409)
    }
    // booking_active_unique_idx is dead since migration 0007 dropped that index
    throw err
  }
}

/**
 * Withdraws one of the caller's own bookings.
 *
 * Ownership and state are enforced in the UPDATE itself (`userId` and
 * `status = 'pending'`), so two tabs racing cannot both "cancel" it. A
 * zero-row result is then re-read to say *why* — missing, not yours, or no
 * longer pending.
 */
export async function cancelBooking(bookingId: string, userId: string): Promise<Booking> {
  const updated = await db
    .update(booking)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(eq(booking.id, bookingId), eq(booking.userId, userId), eq(booking.status, 'pending')),
    )
    .returning({ id: booking.id })

  if (updated.length === 0) {
    const existing = await findBookingForUser(bookingId, userId)
    if (!existing) {
      throw new BookingError('That booking does not exist.', 404)
    }
    throw new BookingError(`A ${existing.status} booking can no longer be cancelled.`, 409)
  }

  const cancelled = await findBookingForUser(bookingId, userId)
  if (!cancelled) {
    throw new Error('The booking could not be read back after cancelling.')
  }
  return cancelled
}

