import { and, eq, gte, inArray, like, or } from 'drizzle-orm'
import { db, pool } from '../src/db/client.ts'
import { booking, user } from '../src/db/schema.ts'

/**
 * Resets the shared E2E account's test residue before every Playwright run.
 *
 *   cd backend
 *   npm run reset:e2e-state
 *
 * Two kinds of leftover accumulate between runs against the live QA database:
 *
 *  1. Booking-abuse suspension. The suite leaves real pending holds; when one
 *     expires unpaid, `recordPaymentFailure` suspends `qa@example.com`
 *     (10/30/60/120/240-minute escalating penalties), and the suspension
 *     check in customer.ts runs *before* validation — every later
 *     `POST /api/bookings` then answers 403, taking out ten booking/admin
 *     tests at once.
 *
 *  2. Live far-future bookings. A test that dies after creating its booking
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
 * bookings — any customer, any day — are never touched.
 */

const QA_EMAIL = 'qa@example.com'
const E2E_GUEST_LIKE = 'E2E Guest %'
const POOL_FLOOR_DAYS = 300

const cutoff = new Date(Date.now() + POOL_FLOOR_DAYS * 86_400_000).toISOString().slice(0, 10)

try {
  // 1. Suspension + failure count on the shared account.
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

  // 2. Stale live bookings in the far-future E2E pool.
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
