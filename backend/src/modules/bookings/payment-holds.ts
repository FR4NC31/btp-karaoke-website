import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { booking, user } from '../../db/schema.ts'
import { BookingError } from './types.ts'

/** Returns the time until which booking is suspended, or null. */
export async function getUserSuspension(userId: string): Promise<Date | null> {
  const rows = await db
    .select({ until: user.bookingSuspendedUntil })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  const until = rows[0]?.until
  return until ? new Date(until) : null
}

/** Clear a user's suspension and failure count (admin). */
export async function clearUserSuspension(userId: string): Promise<void> {
  await db
    .update(user)
    .set({ bookingSuspendedUntil: null, bookingFailureCount: 0, updatedAt: new Date() })
    .where(eq(user.id, userId))
}

/** Apply an escalating suspension after a failed/expired payment hold.
 *  One statement on purpose: a read-then-write lets two concurrent failures
 *  overwrite each other and lose an increment. */
export async function recordPaymentFailure(userId: string): Promise<Date> {
  const result = await db.execute<{ until: Date | string }>(sql`
    update "user"
    set "booking_failure_count" = "booking_failure_count" + 1,
        "booking_suspended_until" = now() + (
          case least("booking_failure_count" + 1, 5)
            when 1 then interval '10 minutes'
            when 2 then interval '30 minutes'
            when 3 then interval '60 minutes'
            when 4 then interval '120 minutes'
            else interval '240 minutes'
          end
        ),
        "updatedAt" = now()
    where "id" = ${userId}
    returning "booking_suspended_until" as until
  `)

  const until = result.rows[0]?.until
  if (!until) {
    throw new Error('The user could not be read back after recording a payment failure.')
  }
  return new Date(until)
}

/**
 * Release expired payment holds: cancel pending GCash/hold bookings whose
 * deadline passed without a receipt, and apply the escalating suspension.
 * Cash bookings carry no deadline and are never released here.
 */
export async function releaseExpiredPaymentHolds(): Promise<number> {
  const now = new Date()
  const expired = await db
    .select({ id: booking.id, userId: booking.userId })
    .from(booking)
    .where(
      and(
        eq(booking.status, 'pending'),
        lt(booking.paymentDeadline, now),
        isNull(booking.receiptUrl),
        or(isNull(booking.paymentMethod), eq(booking.paymentMethod, 'gcash')),
      ),
    )

  let cancelled = 0
  for (const row of expired) {
    const updated = await db
      .update(booking)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(booking.id, row.id), eq(booking.status, 'pending')))
      .returning({ id: booking.id })
    if (updated.length === 0) continue
    cancelled++
    if (row.userId) await recordPaymentFailure(row.userId)
  }
  return cancelled
}

/** Reset failure count on a successful booking. */
export async function recordPaymentSuccess(userId: string): Promise<void> {
  await db
    .update(user)
    .set({ bookingFailureCount: 0, bookingSuspendedUntil: null, updatedAt: new Date() })
    .where(eq(user.id, userId))
}
