import { and, eq, gte, inArray, like, or } from 'drizzle-orm'
import { db, pool } from '../src/db/client.ts'
import { booking, user } from '../src/db/schema.ts'
import { releaseExpiredPaymentHolds } from '../src/modules/bookings/payment-holds.ts'

/**
 * Resets the shared E2E account's test residue before every Playwright run.
 *
 *   cd backend
 *   npm run reset:e2e-state
 *
 * Three kinds of leftover accumulate between runs against the live QA database:
 *
 *  1. Expired payment holds. `releaseExpiredPaymentHolds` cancels a pending
 *     no-method/GCash booking past its 5-minute deadline — and calls
 *     `recordPaymentFailure` for its owner. A hold left behind by a test that
 *     died mid-create therefore suspends the account *during* the next run's
 *     first booking attempt. Sweeping here (before the suspension is cleared)
 *     is what makes the reset deterministic: the sweep's own failure
 *     recording is erased immediately after.
 *
 *  2. Booking-abuse suspension. The escalation is 10/30/60/120/240-minute
 *     penalties, and the suspension check in customer.ts runs *before*
 *     validation — every later `POST /api/bookings` then answers 403, taking
 *     out ten booking/admin tests at once.
 *
 *  3. Live far-future bookings. A test that dies after creating its booking
 *     (timeout, failed assertion) leaves a pending/confirmed row on the
 *     +400..699-day E2E pool. The partial unique indexes
 *     (userId, serviceId, bookingDate[/bookingTime]) then reject the next
 *     attempt with 409 "already has a live booking for this service on that
 *     day" — ADMIN-005 has burnt a dozen FILSCAP-PORTAL days that way, and
 *     every new failure adds one. In-person (`filler`) pending rows never
 *     expire either (there is no hold to sweep), so they pile up in the
 *     admin queue until the dashboard renders dozens of dead rows.
 *
 * Playwright's globalSetup (frontend/tests/e2e/setup/global-setup.ts) runs
 * this before every suite. Bookings are cancelled, not deleted: history the
 * suites read stays intact, and cancellation drops the row out of the
 * partial unique indexes — which is what frees the day again.
 *
 * Scope: the seeded QA account plus `E2E Guest *` names, at least
 * POOL_FLOOR_DAYS out (the random pool starts at +400). Real near-term
 * bookings — any customer, any day — are never touched. The hold sweep is
 * the backend's own global routine and keeps its original scope.
 */

const QA_EMAIL = 'qa@example.com'
const E2E_GUEST_LIKE = 'E2E Guest %'
const POOL_FLOOR_DAYS = 300

const cutoff = new Date(Date.now() + POOL_FLOOR_DAYS * 86_400_000).toISOString().slice(0, 10)

try {
  // 1. Expired holds FIRST: the sweep cancels them and records a payment
  //    failure per owner, so the suspension reset below must run after it —
  //    otherwise the failure the sweep just recorded survives and suspends
  //    the account mid-run.
  const swept = await releaseExpiredPaymentHolds()
  if (swept > 0) {
    console.log(`[reset-e2e-state] swept ${swept} expired payment hold(s).`)
  }

  // 2. Suspension + failure count on the shared account.
  const [qa] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, QA_EMAIL))
    .limit(1)

  if (!qa) {
    console.warn(`[reset-e2e-state] ${QA_EMAIL} not found — run npm run seed:e2e first.`)
  } else {
    await db
      .update(user)
      .set({ bookingFailureCount: 0, bookingSuspendedUntil: null, updatedAt: new Date() })
      .where(eq(user.id, qa.id))
    console.log(`[reset-e2e-state] booking suspension cleared for ${QA_EMAIL}.`)
  }

  // 3. Stale live bookings in the far-future E2E pool.
  const cancelled = await db
    .update(booking)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        inArray(booking.status, ['pending', 'confirmed']),
        gte(booking.bookingDate, cutoff),
        or(qa ? eq(booking.userId, qa.id) : undefined, like(booking.guestName, E2E_GUEST_LIKE)),
      ),
    )
    .returning({ id: booking.id })

  console.log(
    `[reset-e2e-state] cancelled ${cancelled.length} stale far-future booking(s) at or after ${cutoff}.`,
  )
} catch (err) {
  console.error('\nreset-e2e-state failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
