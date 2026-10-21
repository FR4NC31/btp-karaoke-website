-- NOTE (hand-edited): IF NOT EXISTS is deliberate. On an existing database
-- these are the statements that add the profile location; on a FRESH one,
-- `bun x auth migrate` already creates them, because the three fields are
-- declared in src/auth.ts (user.additionalFields). The guard keeps both paths
-- runnable, exactly like the `role` column in 0001.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "province" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "city_municipality" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "barangay" text;
