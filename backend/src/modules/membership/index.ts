import { eq } from 'drizzle-orm'
import { db } from '../../db/client.ts'
import { user } from '../../db/schema.ts'
import { BookingError } from '../../modules/bookings/types.ts'

export { BookingError }

export const MEMBERSHIP_TIERS = ['free', 'subscriber', 'vip'] as const
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number]

export const VIP_DISCOUNT_PERCENT = 20

/** Returns the user's membership tier, expiry and booking-suspension state. */
export async function getUserMembership(userId: string): Promise<{
  tier: MembershipTier
  expiresAt: string | null
  /** Booking ban end time, or null when the account is in good standing. */
  suspendedUntil: string | null
  /** Count of consecutive failed/expired payment holds. */
  failureCount: number
}> {
  const rows = await db
    .select({
      tier: user.membershipTier,
      expiresAt: user.membershipExpiresAt,
      suspendedUntil: user.bookingSuspendedUntil,
      failureCount: user.bookingFailureCount,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  const row = rows[0]
  if (!row) throw new BookingError('That user does not exist.', 404)
  return {
    tier: (row.tier as MembershipTier) ?? 'free',
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    suspendedUntil: row.suspendedUntil ? row.suspendedUntil.toISOString() : null,
    failureCount: row.failureCount ?? 0,
  }
}

/** Admin-only: grant or revoke a membership tier. */
export async function setUserMembership(
  userId: string,
  tier: string,
  expiresAt: string | null,
): Promise<{ tier: MembershipTier; expiresAt: string | null }> {
  if (!(MEMBERSHIP_TIERS as readonly string[]).includes(tier)) {
    throw new BookingError('Pick a valid membership tier.', 400)
  }
  const parsedExpiry = expiresAt ? new Date(expiresAt) : null
  if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) {
    throw new BookingError('That expiry date is not valid.', 400)
  }
  // Guard against Date normalizing invalid calendar dates (e.g. Feb 30).
  if (parsedExpiry && parsedExpiry.toISOString().slice(0, 10) !== expiresAt!.slice(0, 10)) {
    throw new BookingError('That expiry date is not valid.', 400)
  }

  const updated = await db
    .update(user)
    .set({
      membershipTier: tier,
      membershipExpiresAt: parsedExpiry,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({ tier: user.membershipTier, expiresAt: user.membershipExpiresAt })

  const row = updated[0]
  if (!row) throw new BookingError('That user does not exist.', 404)
  return {
    tier: (row.tier as MembershipTier) ?? 'free',
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

/** Discount percent for a user's active membership (0 if free/expired). */
export async function membershipDiscountPercent(userId: string | null): Promise<number> {
  if (!userId) return 0
  const m = await getUserMembership(userId)
  if (m.tier !== 'vip') return 0
  if (m.expiresAt) {
    const expiryDay = new Date(m.expiresAt).toISOString().slice(0, 10)
    if (expiryDay < new Date().toISOString().slice(0, 10)) return 0
  }
  return VIP_DISCOUNT_PERCENT
}
