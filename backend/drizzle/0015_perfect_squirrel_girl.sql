-- Cross-customer slot lock: at most one live booking per service + day + time.
--
-- Deployment prerequisite: earlier per-customer indexes allowed different
-- customers (and guests) to share a live timed slot, so a populated database
-- may already contain duplicates. This migration refuses to run in that case
-- instead of failing with a bare duplicate-key error. Find the rows with:
--
--   SELECT "serviceId", "bookingDate", "bookingTime", count(*)
--   FROM booking
--   WHERE "bookingTime" IS NOT NULL AND status IN ('pending', 'confirmed')
--   GROUP BY 1, 2, 3 HAVING count(*) > 1;
--
-- Resolve them (cancel/reschedule the extras) before re-running `npm run migrate`.
DO $$
DECLARE
  dup record;
BEGIN
  SELECT "serviceId", "bookingDate", "bookingTime", count(*) AS n
  INTO dup
  FROM booking
  WHERE "bookingTime" IS NOT NULL AND status IN ('pending', 'confirmed')
  GROUP BY 1, 2, 3
  HAVING count(*) > 1
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'booking_slot_unique_idx cannot be created: % live bookings already share service % on % at %. Resolve them first (see the query at the top of this migration).',
      dup.n, dup."serviceId", dup."bookingDate", dup."bookingTime";
  END IF;
END
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "booking_slot_unique_idx" ON "booking" USING btree ("serviceId","bookingDate","bookingTime") WHERE "bookingTime" IS NOT NULL AND "status" in ('pending', 'confirmed');
