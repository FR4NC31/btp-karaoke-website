ALTER TABLE "booking" ADD COLUMN "bookingTime" time;

-- Replace the old day-only unique index with two partial indexes:
--   * Day-based bookings (bookingTime IS NULL): unique on (userId, serviceId, bookingDate)
--   * Time-based bookings (bookingTime IS NOT NULL): unique on (userId, serviceId, bookingDate, bookingTime)
DROP INDEX IF EXISTS "booking_active_unique_idx";

CREATE UNIQUE INDEX "booking_active_day_unique_idx" ON "booking" ("userId", "serviceId", "bookingDate")
  WHERE "bookingTime" IS NULL AND "status" IN ('pending', 'confirmed');

CREATE UNIQUE INDEX "booking_active_time_unique_idx" ON "booking" ("userId", "serviceId", "bookingDate", "bookingTime")
  WHERE "bookingTime" IS NOT NULL AND "status" IN ('pending', 'confirmed');