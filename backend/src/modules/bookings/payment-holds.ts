import { and, eq, lt } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { booking, user } from '../../db/schema.ts'
import { BookingError } from './types.ts'

const PENALTY_MINUTES = [10, 30, 60, 120, 240] as const

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

/** Apply an escalating suspension after a failed/expired payment hold. */
export async function recordPaymentFailure(userId: string): Promise<Date> {
  const rows = await db
    .select({ count: user.bookingFailureCount })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  const count = (rows[0]?.count ?? 0) + 1
  const minutes = PENALTY_MINUTES[Math.min(count - 1, PENALTY_MINUTES.length - 1)] ?? 240
  const until = new Date(Date.now() + minutes * 60 * 1000)
  await db
    .update(user)
    .set({ bookingFailureCount: count, bookingSuspendedUntil: until, updatedAt: new Date() })
    .where(eq(user.id, userId))
  return until
}

/** Release expired payment holds: cancel bookings whose deadline passed without a receipt. */
export async function releaseExpiredPaymentHolds(): Promise<number> {
  const now = new Date()
  const expired = await db
    .select({ id: booking.id, userId: booking.userId })
    .from(booking)
    .where(and(eq(booking.status, 'pending'), lt(booking.paymentDeadline, now)))

  // Only cancel those without a submitted receipt (receiptUrl null).
  let cancelled = 0
  for (const row of expired) {
    // Re-check receiptUrl
    const full = await db
      .select({ receiptUrl: booking.receiptUrl, userId: booking.userId })
      .from(booking)
      .where(eq(booking.id, row.id))
      .limit(1)
    const r = full[0]
    if (!r) continue
    if (r.receiptUrl) continue // has receipt, leave for admin review
    await db.update(booking).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(booking.id, row.id))
    cancelled++
    if (r.userId) await recordPaymentFailure(r.userId)
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
