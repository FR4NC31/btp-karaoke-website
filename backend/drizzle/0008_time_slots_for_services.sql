ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "bookingTime" time;

-- NOTE (hand-edited): IF NOT EXISTS on the column keeps this migration safe on
-- databases where the column landed manually before the migration was recorded.
-- The named indexes are dropped before creation, so a stale same-named
-- definition cannot survive. The journal timestamp for this entry was also
-- moved after 0007 so Drizzle stops treating it as older than the ledger
-- watermark and skipping it.

-- Replace the old day-only unique index with two partial indexes:
--   * Day-based bookings (bookingTime IS NULL): unique on (userId, serviceId, bookingDate)
--   * Time-based bookings (bookingTime IS NOT NULL): unique on (userId, serviceId, bookingDate, bookingTime)
DROP INDEX IF EXISTS "booking_active_unique_idx";
DROP INDEX IF EXISTS "booking_active_day_unique_idx";
DROP INDEX IF EXISTS "booking_active_time_unique_idx";

CREATE UNIQUE INDEX "booking_active_day_unique_idx" ON "booking" ("userId", "serviceId", "bookingDate")
  WHERE "bookingTime" IS NULL AND "status" IN ('pending', 'confirmed');

CREATE UNIQUE INDEX "booking_active_time_unique_idx" ON "booking" ("userId", "serviceId", "bookingDate", "bookingTime")
  WHERE "bookingTime" IS NOT NULL AND "status" IN ('pending', 'confirmed');
